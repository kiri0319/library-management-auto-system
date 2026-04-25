const mongoose = require("mongoose");

const librarianActivitySchema = new mongoose.Schema(
  {
    librarian: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    activityType: {
      type: String,
      enum: ["Issue", "Return", "Task"],
      required: true,
    },
    count: {
      type: Number,
      default: 1,
      min: 1,
    },
    taskName: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LibrarianActivity", librarianActivitySchema);
