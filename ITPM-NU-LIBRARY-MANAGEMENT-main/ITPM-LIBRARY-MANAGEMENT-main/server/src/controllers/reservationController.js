const asyncHandler = require("express-async-handler");
const Reservation = require("../models/Reservation");
const Book = require("../models/Book");
const Borrow = require("../models/Borrow");
const { logActivity } = require("../services/activityService");
const { createNotification } = require("../services/notificationService");

const rebalanceQueue = async (bookId) => {
  const reservations = await Reservation.find({
    book: bookId,
    status: { $in: ["Queued", "Notified"] },
  }).sort({ position: 1 });

  await Promise.all(
    reservations.map((reservation, index) =>
      Reservation.findByIdAndUpdate(reservation._id, { position: index + 1 })
    )
  );
};

const getReservations = asyncHandler(async (req, res) => {
  const query = req.user.role === "Student" ? { user: req.user._id } : {};

  const reservations = await Reservation.find(query)
    .populate("user", "name email studentId")
    .populate("book", "title isbn coverImage")
    .sort({ createdAt: -1 });

  res.json(reservations);
});

const createReservation = asyncHandler(async (req, res) => {
  const { bookId } = req.body;
  const book = await Book.findById(bookId);

  if (!book) {
    res.status(404);
    throw new Error("Book not found.");
  }

  const activeBorrow = await Borrow.findOne({
    user: req.user._id,
    book: bookId,
    status: { $in: ["Active", "Overdue"] },
  });

  if (activeBorrow) {
    res.status(400);
    throw new Error("You already have this book borrowed.");
  }

  const existingReservation = await Reservation.findOne({
    user: req.user._id,
    book: bookId,
    status: { $in: ["Queued", "Notified"] },
  });

  if (existingReservation) {
    res.status(409);
    throw new Error("Reservation already exists for this book.");
  }

  const currentQueueCount = await Reservation.countDocuments({
    book: bookId,
    status: { $in: ["Queued", "Notified"] },
  });

  const reservation = await Reservation.create({
    user: req.user._id,
    book: bookId,
    position: currentQueueCount + 1,
    priorityScore: req.user.status === "Active" ? 10 : 1,
  });

  book.reservedCount += 1;
  await book.save();

  await createNotification({
    user: req.user._id,
    title: "Reservation confirmed",
    message: `You joined the queue for "${book.title}".`,
    type: "Success",
    link: "/dashboard/student/reservations",
  });

  await logActivity({
    actor: req.user._id,
    actorRole: req.user.role,
    action: "CREATE_RESERVATION",
    module: "RESERVATIONS",
    targetType: "Reservation",
    targetId: reservation._id.toString(),
    description: `${req.user.name} queued for "${book.title}".`,
    ipAddress: req.ip,
  });

  res.status(201).json(reservation);
});

const cancelReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id).populate("book", "title isbn coverImage");

  if (!reservation) {
    res.status(404);
    throw new Error("Reservation not found.");
  }

  const canManage = req.user.role !== "Student" || reservation.user.toString() === req.user._id.toString();
  if (!canManage) {
    res.status(403);
    throw new Error("You cannot cancel this reservation.");
  }

  if (!["Queued", "Notified"].includes(reservation.status)) {
    res.status(400);
    throw new Error("Only active reservations can be cancelled.");
  }

  reservation.status = "Cancelled";
  await reservation.save();
  await Book.findByIdAndUpdate(reservation.book._id, { $inc: { reservedCount: -1 } });
  await rebalanceQueue(reservation.book._id);

  await logActivity({
    actor: req.user._id,
    actorRole: req.user.role,
    action: "CANCEL_RESERVATION",
    module: "RESERVATIONS",
    targetType: "Reservation",
    targetId: reservation._id.toString(),
    description: `${req.user.name} cancelled reservation for "${reservation.book.title}".`,
    ipAddress: req.ip,
  });

  res.json({ message: "Reservation cancelled." });
});

module.exports = {
  getReservations,
  createReservation,
  cancelReservation,
};
