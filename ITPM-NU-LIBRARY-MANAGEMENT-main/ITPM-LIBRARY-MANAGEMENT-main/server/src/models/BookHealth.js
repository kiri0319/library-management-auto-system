const mongoose = require("mongoose");

const bookHealthHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["Good", "Damaged", "Old"],
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { _id: false }
);

const bookHealthSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["Good", "Damaged", "Old"],
      default: "Good",
      required: true,
    },
    suggestion: {
      type: String,
      enum: ["Monitor", "Repair", "Replace"],
      default: "Monitor",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    history: {
      type: [bookHealthHistorySchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BookHealth", bookHealthSchema);
