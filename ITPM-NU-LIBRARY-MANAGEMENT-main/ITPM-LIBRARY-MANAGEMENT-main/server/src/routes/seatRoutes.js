const express = require("express");
const {
  getSeats,
  createSeat,
  updateSeat,
  deleteSeat,
  listSeatBookings,
  createSeatBooking,
  cancelSeatBooking,
  checkInSeatBooking,
} = require("../controllers/seatController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/")
  .get(protect, getSeats)
  .post(protect, authorize("Admin", "Librarian"), createSeat);

router.route("/bookings")
  .get(protect, listSeatBookings)
  .post(protect, authorize("Student"), createSeatBooking);

router.route("/bookings/:id/cancel")
  .put(protect, cancelSeatBooking);

router.route("/bookings/:id/check-in")
  .put(protect, authorize("Admin", "Librarian"), checkInSeatBooking);

router.route("/:id")
  .put(protect, authorize("Admin", "Librarian"), updateSeat)
  .delete(protect, authorize("Admin", "Librarian"), deleteSeat);

module.exports = router;