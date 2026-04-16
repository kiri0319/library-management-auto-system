const express = require("express");
const {
  getReservations,
  createReservation,
  cancelReservation,
} = require("../controllers/reservationController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router
  .route("/")
  .get(protect, getReservations)
  .post(protect, authorize("Student"), createReservation);

router.route("/:id").delete(protect, cancelReservation);

module.exports = router;

