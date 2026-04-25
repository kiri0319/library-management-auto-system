const SeatBooking = require("../models/SeatBooking");
const { createNotification } = require("../services/notificationService");

const runSeatReminderCycle = async () => {
  const now = new Date();
  const reminderThreshold = new Date(now.getTime() + 10 * 60 * 1000);

  const upcomingBookings = await SeatBooking.find({
    status: "Reserved",
    reminderSent: false,
    startTime: { $gte: now, $lte: reminderThreshold },
  }).populate("seat", "code zone");

  for (const booking of upcomingBookings) {
    try {
      await createNotification({
        user: booking.user,
        title: "Seat booking reminder",
        message: `Your booking for seat ${booking.seat?.code || ""} (${booking.seat?.zone || ""}) starts in less than 10 minutes.`,
        type: "Info",
        link: "/dashboard/student/seats",
      });

      booking.reminderSent = true;
      await booking.save();
    } catch (error) {
      console.error("Failed to process seat reminder:", booking._id?.toString(), error.message);
    }
  }
};

const runSeatAutoReleaseCycle = async () => {
  const now = new Date();
  const expiredBookings = await SeatBooking.find({
    status: "Reserved",
    checkInDeadline: { $lt: now },
  }).populate("seat", "code");

  for (const booking of expiredBookings) {
    try {
      booking.status = "AutoReleased";
      booking.releasedAt = now;
      await booking.save();

      await createNotification({
        user: booking.user,
        title: "Seat auto-released",
        message: `Your booking for seat ${booking.seat?.code || ""} was auto-released due to missed check-in.`,
        type: "Warning",
        link: "/dashboard/student/seats",
      });
    } catch (error) {
      console.error("Failed to process seat auto-release:", booking._id?.toString(), error.message);
    }
  }
};

const startSeatAutoReleaseJob = () => {
  const intervalMs = 2 * 60 * 1000;
  Promise.all([runSeatReminderCycle(), runSeatAutoReleaseCycle()]).catch((error) =>
    console.error("Initial seat booking scheduler failed:", error.message)
  );
  setInterval(() => {
    Promise.all([runSeatReminderCycle(), runSeatAutoReleaseCycle()]).catch((error) =>
      console.error("Seat booking scheduler failed:", error.message)
    );
  }, intervalMs);
};

module.exports = {
  startSeatAutoReleaseJob,
};
