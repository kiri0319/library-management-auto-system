const mongoose = require("mongoose");

const supportChatMessageSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["Student", "Librarian"],
      required: true,
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportChatMessage",
      default: null,
    },
    attachment: {
      url: String,
      fileName: String,
      mimeType: String,
      size: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportChatMessage", supportChatMessageSchema);
