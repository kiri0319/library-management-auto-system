const asyncHandler = require("express-async-handler");
const Seat = require("../models/Seat");
const SeatBooking = require("../models/SeatBooking");
const { createNotification } = require("../services/notificationService");
const { logActivity } = require("../services/activityService");

const ACTIVE_BOOKING_STATUSES = ["Reserved", "CheckedIn"];
const SLOT_MINUTES = 120;
const CHECK_IN_GRACE_MINUTES = 15;

const hasOverlap = (startA, endA, startB, endB) => startA < endB && endA > startB;
const toTwoDigits = (value) => String(value).padStart(2, "0");

const generateSeatCode = async ({ zone, floor }) => {
  const normalizedFloor = Number(floor) || 1;
  const prefix = zone === "Group Zone" ? "GRP" : "SIL";
  const floorLetter = String.fromCharCode(64 + Math.min(Math.max(normalizedFloor, 1), 26));
  const codePattern = new RegExp(`^${prefix}-${floorLetter}-(\\d+)$`);

  const existingSeats = await Seat.find({ code: { $regex: `^${prefix}-${floorLetter}-` } }).select("code");
  const maxNumber = existingSeats.reduce((max, seat) => {
    const match = seat.code.match(codePattern);
    if (!match) {
      return max;
    }
    return Math.max(max, Number(match[1]));
  }, 0);

  return `${prefix}-${floorLetter}-${toTwoDigits(maxNumber + 1)}`;
};

const getSeats = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.zone) {
    filter.zone = req.query.zone;
  }

  const seats = await Seat.find(filter).sort({ zone: 1, code: 1 });
  res.json(seats);
});

const createSeat = asyncHandler(async (req, res) => {
  const manualCode = req.body.code?.trim();
  let finalCode;

  if (manualCode) {
    finalCode = manualCode.toUpperCase();
    const existingSeat = await Seat.findOne({ code: finalCode }).select("_id");
    if (existingSeat) {
      res.status(409);
      throw new Error("Seat code already exists.");
    }
  } else {
    finalCode = await generateSeatCode(req.body);
  }

  const seatPayload = {
    ...req.body,
    code: finalCode,
  };

  const seat = await Seat.create(seatPayload);
  res.status(201).json(seat);
});

const updateSeat = asyncHandler(async (req, res) => {
  const seat = await Seat.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!seat) {
    res.status(404);
    throw new Error("Seat not found.");
  }
  res.json(seat);
});

const deleteSeat = asyncHandler(async (req, res) => {
  const seat = await Seat.findByIdAndDelete(req.params.id);
  if (!seat) {
    res.status(404);
    throw new Error("Seat not found.");
  }
  res.json({ message: "Seat deleted." });
});

const listSeatBookings = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === "Student") {
    filter.user = req.user._id;
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const bookings = await SeatBooking.find(filter)
    .populate("user", "name email studentId")
    .populate("seat", "code zone floor capacity hasPower")
    .sort({ startTime: -1 });

  res.json(bookings);
});

const createSeatBooking = asyncHandler(async (req, res) => {
  const { seatId, startTime } = req.body;
  const seat = await Seat.findById(seatId);
  if (!seat || !seat.isActive) {
    res.status(404);
    throw new Error("Seat not available.");
  }

  const start = new Date(startTime);
  if (Number.isNaN(start.getTime()) || start <= new Date()) {
    res.status(400);
    throw new Error("Provide a valid future start time.");
  }

  const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);
  const checkInDeadline = new Date(start.getTime() + CHECK_IN_GRACE_MINUTES * 60 * 1000);

  const seatConflicts = await SeatBooking.find({
    seat: seatId,
    status: { $in: ACTIVE_BOOKING_STATUSES },
  }).select("startTime endTime");

  if (seatConflicts.some((b) => hasOverlap(start, end, b.startTime, b.endTime))) {
    res.status(409);
    throw new Error("This seat is already reserved for the selected time.");
  }

  const userConflicts = await SeatBooking.find({
    user: req.user._id,
    status: { $in: ACTIVE_BOOKING_STATUSES },
  }).select("startTime endTime");

  if (userConflicts.some((b) => hasOverlap(start, end, b.startTime, b.endTime))) {
    res.status(409);
    throw new Error("You already have a seat reservation in this time range.");
  }

  const booking = await SeatBooking.create({
    user: req.user._id,
    seat: seat._id,
    startTime: start,
    endTime: end,
    checkInDeadline,
    qrToken: `SEAT-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
  });

  await createNotification({
    user: req.user._id,
    title: "Seat reserved",
    message: `${seat.code} (${seat.zone}) reserved from ${start.toLocaleTimeString()} to ${end.toLocaleTimeString()}.`,
    type: "Success",
    link: "/dashboard/student/seats",
  });

  await logActivity({
    actor: req.user._id,
    actorRole: req.user.role,
    action: "BOOK_SEAT",
    module: "SEAT_BOOKINGS",
    targetType: "SeatBooking",
    targetId: booking._id.toString(),
    description: `${req.user.name} booked seat ${seat.code}.`,
    ipAddress: req.ip,
  });

  const populated = await SeatBooking.findById(booking._id)
    .populate("user", "name email studentId")
    .populate("seat", "code zone floor capacity hasPower");
  res.status(201).json(populated);
});

const cancelSeatBooking = asyncHandler(async (req, res) => {
  const booking = await SeatBooking.findById(req.params.id).populate("seat", "code zone");
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found.");
  }

  const canManage = req.user.role !== "Student" || booking.user.toString() === req.user._id.toString();
  if (!canManage) {
    res.status(403);
    throw new Error("You cannot cancel this booking.");
  }

  if (!ACTIVE_BOOKING_STATUSES.includes(booking.status)) {
    res.status(400);
    throw new Error("Only active reservations can be cancelled.");
  }

  booking.status = "Cancelled";
  booking.cancelledAt = new Date();
  await booking.save();

  await createNotification({
    user: booking.user,
    title: "Seat booking cancelled",
    message: `Your booking for seat ${booking.seat.code} has been cancelled.`,
    type: "Info",
    link: "/dashboard/student/seats",
  });

  res.json({ message: "Seat booking cancelled." });
});

const checkInSeatBooking = asyncHandler(async (req, res) => {
  const booking = await SeatBooking.findById(req.params.id);
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found.");
  }

  if (booking.status !== "Reserved") {
    res.status(400);
    throw new Error("Only reserved bookings can be checked in.");
  }

  booking.status = "CheckedIn";
  booking.checkedInAt = new Date();
  await booking.save();

  res.json({ message: "Seat check-in successful." });
});

module.exports = {
  getSeats,
  createSeat,
  updateSeat,
  deleteSeat,
  listSeatBookings,
  createSeatBooking,
  cancelSeatBooking,
  checkInSeatBooking,
};
