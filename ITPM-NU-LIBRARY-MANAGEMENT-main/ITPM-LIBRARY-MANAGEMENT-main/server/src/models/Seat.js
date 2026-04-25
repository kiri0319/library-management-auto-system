const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    zone: {
      type: String,
      enum: ["Silent Zone", "Group Zone"],
      required: true,
    },
    floor: {
      type: Number,
      default: 1,
      min: 1,
    },
    capacity: {
      type: Number,
      default: 1,
      min: 1,
    },
    hasPower: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Seat", seatSchema);
