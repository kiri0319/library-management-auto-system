const mongoose = require("mongoose");

const authorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    biography: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Author", authorSchema);

