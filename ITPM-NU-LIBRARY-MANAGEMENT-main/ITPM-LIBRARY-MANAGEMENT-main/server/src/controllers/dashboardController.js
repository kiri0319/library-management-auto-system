const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Book = require("../models/Book");
const Borrow = require("../models/Borrow");
const Fine = require("../models/Fine");
const Reservation = require("../models/Reservation");
const ActivityLog = require("../models/ActivityLog");

const getAdminDashboard = asyncHandler(async (req, res) => {
  const [userCount, activeBorrows, overdueBorrows, queuedReservations, unpaidFines, suspiciousActions, recentLogs] =
    await Promise.all([
      User.countDocuments(),
      Borrow.countDocuments({ status: "Active" }),
      Borrow.countDocuments({ dueDate: { $lt: new Date() }, status: { $in: ["Active", "Overdue"] } }),
      Reservation.countDocuments({ status: { $in: ["Queued", "Notified"] } }),
      Fine.aggregate([
        { $match: { status: "Unpaid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      ActivityLog.countDocuments({ severity: "High" }),
      ActivityLog.find().populate("actor", "name email").sort({ createdAt: -1 }).limit(8),
    ]);

  const monthlyBorrowing = await Borrow.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$borrowDate" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 6 },
  ]);

  const categoryPopularity = await Borrow.aggregate([
    {
      $lookup: {
        from: "books",
        localField: "book",
        foreignField: "_id",
        as: "book",
      },
    },
    { $unwind: "$book" },
    {
      $lookup: {
        from: "categories",
        localField: "book.category",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    {
      $group: {
        _id: "$category.name",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  const roleDistribution = await User.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);

  res.json({
    stats: {
      userCount,
      activeBorrows,
      overdueBorrows,
      queuedReservations,
      unpaidFineTotal: unpaidFines[0]?.total || 0,
      suspiciousActions,
    },
    charts: {
      monthlyBorrowing,
      categoryPopularity,
      roleDistribution,
    },
    recentLogs,
  });
});

const getLibrarianDashboard = asyncHandler(async (req, res) => {
  const [bookCount, availableBooks, activeBorrows, overdueBorrows, finesSummary, queuedReservations] = await Promise.all([
    Book.countDocuments(),
    Book.aggregate([{ $group: { _id: null, total: { $sum: "$availableCopies" } } }]),
    Borrow.countDocuments({ status: "Active" }),
    Borrow.countDocuments({ dueDate: { $lt: new Date() }, status: { $in: ["Active", "Overdue"] } }),
    Fine.aggregate([{ $group: { _id: "$status", total: { $sum: "$amount" } } }]),
    Reservation.countDocuments({ status: { $in: ["Queued", "Notified"] } }),
  ]);

  const dailyBorrowing = await Borrow.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$borrowDate" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: 7 },
    { $sort: { _id: 1 } },
  ]);

  const topBooks = await Book.find().sort({ borrowedCount: -1 }).limit(5).select("title borrowedCount availableCopies");

  res.json({
    stats: {
      bookCount,
      availableCopies: availableBooks[0]?.total || 0,
      activeBorrows,
      overdueBorrows,
      queuedReservations,
      fineCollection: finesSummary.reduce((acc, item) => ({ ...acc, [item._id]: item.total }), {}),
    },
    charts: {
      dailyBorrowing,
      topBooks,
    },
  });
});

const getStudentDashboard = asyncHandler(async (req, res) => {
  const [activeBorrows, reservations, unpaidFines, recentBorrows, recommendedBooks] = await Promise.all([
    Borrow.countDocuments({ user: req.user._id, status: { $in: ["Active", "Overdue"] } }),
    Reservation.countDocuments({ user: req.user._id, status: { $in: ["Queued", "Notified"] } }),
    Fine.aggregate([
      { $match: { user: req.user._id, status: "Unpaid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Borrow.find({ user: req.user._id }).populate("book", "title isbn coverImage").sort({ createdAt: -1 }).limit(5),
    Book.find({ availableCopies: { $gt: 0 } })
      .sort({ borrowedCount: -1 })
      .limit(4)
      .populate("author", "name")
      .populate("category", "name"),
  ]);

  res.json({
    stats: {
      activeBorrows,
      reservations,
      unpaidFineTotal: unpaidFines[0]?.total || 0,
    },
    recentBorrows,
    recommendedBooks,
  });
});

module.exports = {
  getAdminDashboard,
  getLibrarianDashboard,
  getStudentDashboard,
};

