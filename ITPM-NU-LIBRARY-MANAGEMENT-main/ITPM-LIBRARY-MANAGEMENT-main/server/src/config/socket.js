const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { getAllowedOrigins } = require("../utils/originUtils");

let io;

const initSocket = (server) => {
  io = require("socket.io")(server, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const rawToken =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!rawToken) {
        return next();
      }

      const decoded = jwt.verify(rawToken, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id role name email");
      socket.user = user || null;
      return next();
    } catch (error) {
      return next(new Error("Socket authentication failed."));
    }
  });

  io.on("connection", (socket) => {
    if (socket.user) {
      socket.join(`user:${socket.user._id}`);
      socket.join(`role:${socket.user.role}`);
    }

    socket.on("join-book-room", (bookId) => {
      if (bookId) {
        socket.join(`book:${bookId}`);
      }
    });

    socket.on("disconnect", () => {
      if (socket.user) {
        console.log(`Socket disconnected: ${socket.user.email}`);
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io has not been initialized.");
  }

  return io;
};

module.exports = { initSocket, getIO };
