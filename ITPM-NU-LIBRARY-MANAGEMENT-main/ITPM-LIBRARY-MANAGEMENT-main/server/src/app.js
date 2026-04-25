const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const authorRoutes = require("./routes/authorRoutes");
const bookRoutes = require("./routes/bookRoutes");
const borrowRoutes = require("./routes/borrowRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const fineRoutes = require("./routes/fineRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reportRoutes = require("./routes/reportRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const activityRoutes = require("./routes/activityRoutes");
const seatRoutes = require("./routes/seatRoutes");
const bookHealthRoutes = require("./routes/bookHealthRoutes");
const librarianProductivityRoutes = require("./routes/librarianProductivityRoutes");
const supportChatRoutes = require("./routes/supportChatRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { getAllowedOrigins } = require("./utils/originUtils");

const app = express();
const allowedOrigins = getAllowedOrigins();
const isDevelopment = process.env.NODE_ENV !== "production";

const isAllowedDevLocalOrigin = (origin) => {
  if (!origin) {
    return false;
  }

  return /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin.replace(/\/$/, ""));
};

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin.replace(/\/$/, "")) ||
        (isDevelopment && isAllowedDevLocalOrigin(origin))
      ) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/", (req, res) => {
  res.json({ message: "Online Library Management API is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/authors", authorRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/borrows", borrowRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/fines", fineRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/activity-logs", activityRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/book-health", bookHealthRoutes);
app.use("/api/librarian-productivity", librarianProductivityRoutes);
app.use("/api/support-chat", supportChatRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
