const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    position: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Queued", "Notified", "Collected", "Cancelled"],
      default: "Queued",
    },
    priorityScore: {
      type: Number,
      default: 0,
    },
    expiresAt: Date,
    notifiedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reservation", reservationSchema);

