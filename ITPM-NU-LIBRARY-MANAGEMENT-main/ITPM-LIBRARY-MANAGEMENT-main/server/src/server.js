const http = require("http");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const app = require("./app");
const { initSocket } = require("./config/socket");
const { startReminderJob } = require("./jobs/reminderJob");
const { startSeatAutoReleaseJob } = require("./jobs/seatAutoReleaseJob");

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);
  initSocket(server);
  startReminderJob();
  startSeatAutoReleaseJob();

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Stop the existing process or change PORT in server/.env before starting again.`
      );
      process.exit(1);
    }

    console.error("Server failed during listen:", error.message);
    process.exit(1);
  });

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Server failed to start:", error.message);
  process.exit(1);
});
