const Borrow = require("../models/Borrow");
const User = require("../models/User");
const Book = require("../models/Book");
const { sendDueReminderEmail } = require("../services/emailService");
const { createNotification } = require("../services/notificationService");

const MS_IN_DAY = 1000 * 60 * 60 * 24;

const runReminderCycle = async () => {
  const thresholdStart = new Date();
  const thresholdEnd = new Date(Date.now() + 2 * MS_IN_DAY);

  const borrows = await Borrow.find({
    status: "Active",
    reminderSent: false,
    dueDate: { $gte: thresholdStart, $lte: thresholdEnd },
  });

  for (const borrow of borrows) {
    const [user, book] = await Promise.all([User.findById(borrow.user), Book.findById(borrow.book)]);

    if (!user || !book) {
      continue;
    }

    await sendDueReminderEmail(user.email, user.name, book.title, borrow.dueDate);
    await createNotification({
      user: user._id,
      title: "Due date reminder",
      message: `"${book.title}" is due on ${borrow.dueDate.toDateString()}.`,
      type: "Info",
      link: "/dashboard/student/borrows",
    });

    borrow.reminderSent = true;
    await borrow.save();
  }
};

const startReminderJob = () => {
  const intervalMs = 12 * 60 * 60 * 1000;
  setInterval(() => {
    runReminderCycle().catch((error) => console.error("Reminder job failed:", error.message));
  }, intervalMs);
};

module.exports = {
  startReminderJob,
};

