const Notification = require("../models/Notification");
const { getIO } = require("../config/socket");

const safeEmit = (event, payload, room) => {
  try {
    const io = getIO();
    io.to(room).emit(event, payload);
  } catch (error) {
    // Socket.io is optional outside runtime.
  }
};

const createNotification = async ({ user, title, message, type = "Info", link }) => {
  const notification = await Notification.create({
    user,
    title,
    message,
    type,
    link,
  });

  safeEmit("notification:new", notification, `user:${user}`);
  return notification;
};

module.exports = {
  createNotification,
};

