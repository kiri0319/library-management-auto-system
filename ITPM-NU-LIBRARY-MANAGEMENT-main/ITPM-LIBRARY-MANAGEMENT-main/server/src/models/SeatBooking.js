const mongoose = require("mongoose");

const seatBookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat",
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Reserved", "CheckedIn", "Completed", "Cancelled", "AutoReleased"],
      default: "Reserved",
    },
    checkInDeadline: {
      type: Date,
      required: true,
    },
    checkedInAt: Date,
    cancelledAt: Date,
    releasedAt: Date,
    reminderSent: {
      type: Boolean,
      default: false,
    },
    qrToken: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

seatBookingSchema.index({ seat: 1, startTime: 1, endTime: 1 });
seatBookingSchema.index({ user: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model("SeatBooking", seatBookingSchema);
