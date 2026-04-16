const ActivityLog = require("../models/ActivityLog");
const { getIO } = require("../config/socket");

const safeEmit = (event, payload, room) => {
  try {
    const io = getIO();
    if (room) {
      io.to(room).emit(event, payload);
      return;
    }
    io.emit(event, payload);
  } catch (error) {
    // Socket.io is optional during seed scripts and non-server contexts.
  }
};

const logActivity = async ({
  actor,
  actorRole,
  action,
  module,
  targetType,
  targetId,
  severity = "Low",
  description,
  metadata,
  ipAddress,
}) => {
  const entry = await ActivityLog.create({
    actor,
    actorRole,
    action,
    module,
    targetType,
    targetId,
    severity,
    description,
    metadata,
    ipAddress,
  });

  safeEmit("activity:new", entry, "role:Admin");
  return entry;
};

module.exports = {
  logActivity,
};

