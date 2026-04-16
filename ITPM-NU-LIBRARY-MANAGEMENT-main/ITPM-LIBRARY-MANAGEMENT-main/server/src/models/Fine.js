const mongoose = require("mongoose");

const fineSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    borrow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Borrow",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    reason: String,
    status: {
      type: String,
      enum: ["Unpaid", "Paid", "Waived"],
      default: "Unpaid",
    },
    paidAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Fine", fineSchema);

