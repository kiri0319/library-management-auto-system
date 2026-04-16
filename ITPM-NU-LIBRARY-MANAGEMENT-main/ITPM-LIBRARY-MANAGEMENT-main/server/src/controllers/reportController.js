const asyncHandler = require("express-async-handler");
const Borrow = require("../models/Borrow");
const Fine = require("../models/Fine");
const ActivityLog = require("../models/ActivityLog");
const createPdfReport = require("../utils/pdfReport");

const downloadBorrowingReport = asyncHandler(async (req, res) => {
  const borrows = await Borrow.find()
    .populate("user", "name email studentId")
    .populate("book", "title isbn coverImage")
    .sort({ createdAt: -1 })
    .limit(30);

  createPdfReport(res, "monthly-borrowing-report.pdf", "Monthly Borrowing Report", [
    {
      heading: "Recent Borrowing Entries",
      rows: borrows.map(
        (borrow) =>
          `${borrow.user.name} borrowed "${borrow.book.title}" on ${borrow.borrowDate.toDateString()} (status: ${borrow.status})`
      ),
    },
  ]);
});

const downloadFineReport = asyncHandler(async (req, res) => {
  const fines = await Fine.find()
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .limit(30);

  createPdfReport(res, "fine-collection-report.pdf", "Fine Collection Report", [
    {
      heading: "Recent Fine Records",
      rows: fines.map(
        (fine) => `${fine.user.name} - Rs. ${fine.amount} (${fine.status}) - ${fine.reason || "Overdue return"}`
      ),
    },
  ]);
});

const downloadActivityReport = asyncHandler(async (req, res) => {
  const logs = await ActivityLog.find().populate("actor", "name email").sort({ createdAt: -1 }).limit(40);

  createPdfReport(res, "user-activity-report.pdf", "User Activity Report", [
    {
      heading: "Recent Audit Trail",
      rows: logs.map(
        (log) =>
          `${log.createdAt.toDateString()} - ${log.actor?.name || "System"} - ${log.action} (${log.module})`
      ),
    },
  ]);
});

module.exports = {
  downloadBorrowingReport,
  downloadFineReport,
  downloadActivityReport,
};

