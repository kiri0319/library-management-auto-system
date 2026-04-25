const asyncHandler = require("express-async-handler");
const Borrow = require("../models/Borrow");
const Fine = require("../models/Fine");
const ActivityLog = require("../models/ActivityLog");
const { sendExcelReport } = require("../utils/excelReport");

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : "-");
const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "-");

const borrowingColumns = [
  { key: "studentName", label: "Student Name" },
  { key: "studentEmail", label: "Student Email" },
  { key: "studentId", label: "Student ID" },
  { key: "bookTitle", label: "Book Title" },
  { key: "isbn", label: "ISBN" },
  { key: "borrowDate", label: "Borrow Date" },
  { key: "dueDate", label: "Due Date" },
  { key: "returnedAt", label: "Returned At" },
  { key: "status", label: "Status" },
  { key: "fineAccrued", label: "Fine Accrued (Rs.)" },
];

const fineColumns = [
  { key: "studentName", label: "Student Name" },
  { key: "studentEmail", label: "Student Email" },
  { key: "amount", label: "Amount (Rs.)" },
  { key: "status", label: "Status" },
  { key: "reason", label: "Reason" },
  { key: "issuedDate", label: "Issued Date" },
  { key: "paidAt", label: "Paid At" },
];

const activityColumns = [
  { key: "date", label: "Date" },
  { key: "actorName", label: "Actor Name" },
  { key: "actorEmail", label: "Actor Email" },
  { key: "actorRole", label: "Actor Role" },
  { key: "action", label: "Action" },
  { key: "module", label: "Module" },
  { key: "severity", label: "Severity" },
  { key: "description", label: "Description" },
  { key: "ipAddress", label: "IP Address" },
];

const getBorrowingRows = async () => {
  const borrows = await Borrow.find()
    .populate("user", "name email studentId")
    .populate("book", "title isbn")
    .sort({ createdAt: -1 })
    .limit(200);

  return borrows.map((borrow, index) => ({
    id: index + 1,
    studentName: borrow.user?.name || "-",
    studentEmail: borrow.user?.email || "-",
    studentId: borrow.user?.studentId || "-",
    bookTitle: borrow.book?.title || "-",
    isbn: borrow.book?.isbn || "-",
    borrowDate: formatDateTime(borrow.borrowDate),
    dueDate: formatDateTime(borrow.dueDate),
    returnedAt: formatDateTime(borrow.returnedAt),
    status: borrow.status,
    fineAccrued: Number(borrow.fineAccrued || 0),
  }));
};

const getFineRows = async () => {
  const fines = await Fine.find()
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .limit(200);

  return fines.map((fine, index) => ({
    id: index + 1,
    studentName: fine.user?.name || "-",
    studentEmail: fine.user?.email || "-",
    amount: Number(fine.amount || 0),
    status: fine.status,
    reason: fine.reason || "Overdue return",
    issuedDate: formatDate(fine.createdAt),
    paidAt: formatDateTime(fine.paidAt),
  }));
};

const getActivityRows = async () => {
  const logs = await ActivityLog.find().populate("actor", "name email").sort({ createdAt: -1 }).limit(300);

  return logs.map((log, index) => ({
    id: index + 1,
    date: formatDateTime(log.createdAt),
    actorName: log.actor?.name || "System",
    actorEmail: log.actor?.email || "-",
    actorRole: log.actorRole || "-",
    action: log.action,
    module: log.module,
    severity: log.severity || "-",
    description: log.description || "-",
    ipAddress: log.ipAddress || "-",
  }));
};

const downloadBorrowingReport = asyncHandler(async (req, res) => {
  const rows = await getBorrowingRows();
  sendExcelReport(res, "monthly-borrowing-report.xlsx", "Borrowing", borrowingColumns, rows);
});

const downloadFineReport = asyncHandler(async (req, res) => {
  const rows = await getFineRows();
  sendExcelReport(res, "fine-collection-report.xlsx", "Fines", fineColumns, rows);
});

const downloadActivityReport = asyncHandler(async (req, res) => {
  const rows = await getActivityRows();
  sendExcelReport(res, "user-activity-report.xlsx", "Activity", activityColumns, rows);
});

const viewBorrowingReport = asyncHandler(async (req, res) => {
  const rows = await getBorrowingRows();
  res.json({ title: "Borrowing report", columns: borrowingColumns, rows });
});

const viewFineReport = asyncHandler(async (req, res) => {
  const rows = await getFineRows();
  res.json({ title: "Fine report", columns: fineColumns, rows });
});

const viewActivityReport = asyncHandler(async (req, res) => {
  const rows = await getActivityRows();
  res.json({ title: "Activity report", columns: activityColumns, rows });
});

module.exports = {
  downloadBorrowingReport,
  downloadFineReport,
  downloadActivityReport,
  viewBorrowingReport,
  viewFineReport,
  viewActivityReport,
};

