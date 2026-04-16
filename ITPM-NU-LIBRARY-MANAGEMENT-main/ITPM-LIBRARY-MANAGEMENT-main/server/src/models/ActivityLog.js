const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    actorRole: String,
    action: {
      type: String,
      required: true,
    },
    module: {
      type: String,
      required: true,
    },
    targetType: String,
    targetId: String,
    severity: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },
    description: String,
    metadata: mongoose.Schema.Types.Mixed,
    ipAddress: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);

