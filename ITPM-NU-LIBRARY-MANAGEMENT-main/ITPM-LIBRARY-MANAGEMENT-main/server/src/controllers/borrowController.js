const asyncHandler = require("express-async-handler");
const Borrow = require("../models/Borrow");
const Book = require("../models/Book");
const User = require("../models/User");
const Reservation = require("../models/Reservation");
const { calculateDueDate, getOverdueDays } = require("../utils/dateUtils");
const { logActivity } = require("../services/activityService");
const { createNotification } = require("../services/notificationService");
const { upsertFineForBorrow } = require("../services/fineService");
const { getRuntimeSettings } = require("../services/systemSettingsService");
const { recordProductivityActivity } = require("../services/librarianProductivityService");
const { getIO } = require("../config/socket");

const safeEmit = (event, payload, room) => {
  try {
    const io = getIO();
    io.to(room).emit(event, payload);
  } catch (error) {
    // Socket.io is optional in non-server contexts.
  }
};

const completeReservationIfExists = async (userId, bookId) => {
  const reservation = await Reservation.findOne({
    user: userId,
    book: bookId,
    status: { $in: ["Queued", "Notified"] },
  });

  if (!reservation) {
    return;
  }

  reservation.status = "Collected";
  await reservation.save();
  await Book.findByIdAndUpdate(bookId, { $inc: { reservedCount: -1 } });
};

const createBorrowEntry = async ({ user, book, issuer, ipAddress }) => {
  const runtimeSettings = await getRuntimeSettings();
  const existingBorrow = await Borrow.findOne({
    user: user._id,
    book: book._id,
    status: { $in: ["Active", "Overdue"] },
  });

  if (existingBorrow) {
    throw new Error("This user already has an active copy of this book.");
  }

  if (user.status !== "Active") {
    throw new Error("Only active accounts can borrow books.");
  }

  if (book.availableCopies <= 0) {
    throw new Error("Book is currently unavailable.");
  }

  const borrow = await Borrow.create({
    user: user._id,
    book: book._id,
    issuedBy: issuer._id,
    dueDate: calculateDueDate(new Date(), runtimeSettings.borrowPeriodDays),
    qrToken: `BRW-${Date.now()}-${user._id.toString().slice(-4)}-${book._id.toString().slice(-4)}`,
  });

  book.availableCopies -= 1;
  book.borrowedCount += 1;
  await book.save();

  user.readingHistory.push(borrow._id);
  await user.save();

  await completeReservationIfExists(user._id, book._id);

  await createNotification({
    user: user._id,
    title: "Book issued",
    message: `"${book.title}" has been issued to your account.`,
    type: "Success",
    link: "/dashboard/student/borrows",
  });

  await logActivity({
    actor: issuer._id,
    actorRole: issuer.role,
    action: "ISSUE_BOOK",
    module: "BORROWS",
    targetType: "Borrow",
    targetId: borrow._id.toString(),
    description: `${issuer.name} issued "${book.title}" to ${user.email}.`,
    ipAddress,
  });

  await recordProductivityActivity({
    actor: issuer,
    activityType: "Issue",
    count: 1,
  });

  safeEmit(
    "borrow:new",
    { borrowId: borrow._id, bookId: book._id, userId: user._id, availableCopies: book.availableCopies },
    "role:Admin"
  );
  safeEmit("book:stock-updated", { bookId: book._id, availableCopies: book.availableCopies }, `book:${book._id}`);

  return Borrow.findById(borrow._id).populate("user", "name email studentId").populate("book", "title isbn coverImage");
};

const issueBook = asyncHandler(async (req, res) => {
  const { userId, bookId } = req.body;
  const user = await User.findById(userId);
  const book = await Book.findById(bookId);

  if (!user || !book) {
    res.status(404);
    throw new Error("User or book not found.");
  }

  const borrow = await createBorrowEntry({
    user,
    book,
    issuer: req.user,
    ipAddress: req.ip,
  });

  res.status(201).json(borrow);
});

const selfBorrow = asyncHandler(async (req, res) => {
  const { bookId } = req.body;
  const book = await Book.findById(bookId);

  if (!book) {
    res.status(404);
    throw new Error("Book not found.");
  }

  const user = await User.findById(req.user._id);
  const borrow = await createBorrowEntry({
    user,
    book,
    issuer: req.user,
    ipAddress: req.ip,
  });

  res.status(201).json(borrow);
});

const processNextReservation = async (book) => {
  const runtimeSettings = await getRuntimeSettings();
  const nextReservation = await Reservation.findOne({
    book: book._id,
    status: "Queued",
  })
    .sort({ priorityScore: -1, position: 1 })
    .populate("user", "name email");

  if (!nextReservation) {
    return;
  }

  nextReservation.status = "Notified";
  nextReservation.notifiedAt = new Date();
  nextReservation.expiresAt = new Date(Date.now() + runtimeSettings.reservationPickupDays * 24 * 60 * 60 * 1000);
  await nextReservation.save();

  await createNotification({
    user: nextReservation.user._id,
    title: "Reserved book available",
    message: `"${book.title}" is now available for pickup.`,
    type: "Info",
    link: "/dashboard/student/reservations",
  });

  safeEmit("reservation:ready", { reservationId: nextReservation._id, bookId: book._id }, `user:${nextReservation.user._id}`);
};

const returnBook = asyncHandler(async (req, res) => {
  const { borrowId, qrToken } = req.body;

  if (!borrowId && !qrToken) {
    res.status(400);
    throw new Error("Provide a borrow ID or QR token to process a return.");
  }

  const borrow = await Borrow.findOne({
    ...(borrowId ? { _id: borrowId } : {}),
    ...(qrToken ? { qrToken } : {}),
    status: { $in: ["Active", "Overdue"] },
  })
    .populate("user", "name email")
    .populate("book", "title isbn coverImage");

  if (!borrow) {
    res.status(404);
    throw new Error("Active borrow record not found.");
  }

  const book = await Book.findById(borrow.book._id);
  borrow.returnedAt = new Date();
  borrow.status = getOverdueDays(borrow.dueDate, borrow.returnedAt) > 0 ? "Overdue" : "Returned";
  await borrow.save();

  book.availableCopies += 1;
  await book.save();

  const fine = await upsertFineForBorrow({
    borrow,
    userId: borrow.user._id,
  });

  if (fine) {
    borrow.fineAccrued = fine.amount;
    await borrow.save();

    await createNotification({
      user: borrow.user._id,
      title: "Overdue fine added",
      message: `A fine of Rs. ${fine.amount} has been added for "${book.title}".`,
      type: "Warning",
      link: "/dashboard/student/borrows",
    });
  } else {
    borrow.status = "Returned";
    await borrow.save();
  }

  await processNextReservation(book);

  await logActivity({
    actor: req.user._id,
    actorRole: req.user.role,
    action: "RETURN_BOOK",
    module: "BORROWS",
    targetType: "Borrow",
    targetId: borrow._id.toString(),
    description: `${req.user.name} processed return for "${book.title}".`,
    ipAddress: req.ip,
  });

  await recordProductivityActivity({
    actor: req.user,
    activityType: "Return",
    count: 1,
  });

  safeEmit("book:stock-updated", { bookId: book._id, availableCopies: book.availableCopies }, `book:${book._id}`);
  res.json({ borrow, fine });
});

const getBorrows = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = {};

  if (req.user.role === "Student") {
    query.user = req.user._id;
  }

  if (status) {
    query.status = status;
  }

  const borrows = await Borrow.find(query)
    .populate("user", "name email studentId")
    .populate("book", "title isbn coverImage")
    .populate("issuedBy", "name role")
    .sort({ createdAt: -1 });

  res.json(borrows);
});

module.exports = {
  issueBook,
  selfBorrow,
  returnBook,
  getBorrows,
};
