const asyncHandler = require("express-async-handler");
const LibrarianActivity = require("../models/LibrarianActivity");
const User = require("../models/User");

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const endOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
const formatDayKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getRange = (range, dateValue) => {
  const base = dateValue ? new Date(dateValue) : new Date();
  if (Number.isNaN(base.getTime())) {
    return { start: startOfDay(new Date()), end: endOfDay(new Date()) };
  }
  if (range === "weekly") {
    const end = endOfDay(base);
    const startDate = new Date(base);
    startDate.setDate(base.getDate() - 6);
    return { start: startOfDay(startDate), end };
  }
  if (range === "monthly") {
    return {
      start: new Date(base.getFullYear(), base.getMonth(), 1),
      end: new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }
  return { start: startOfDay(base), end: endOfDay(base) };
};

const buildStatsFromLogs = (logs) => {
  const byLibrarian = new Map();
  logs.forEach((log) => {
    const key = String(log.librarian?._id || log.librarian);
    if (!byLibrarian.has(key)) {
      byLibrarian.set(key, {
        librarian: log.librarian,
        booksIssued: 0,
        booksReturned: 0,
        tasksCompleted: 0,
        firstAt: log.createdAt,
        lastAt: log.createdAt,
      });
    }
    const item = byLibrarian.get(key);
    if (log.activityType === "Issue") item.booksIssued += log.count;
    if (log.activityType === "Return") item.booksReturned += log.count;
    if (log.activityType === "Task") item.tasksCompleted += log.count;
    if (new Date(log.createdAt) < new Date(item.firstAt)) item.firstAt = log.createdAt;
    if (new Date(log.createdAt) > new Date(item.lastAt)) item.lastAt = log.createdAt;
  });

  return Array.from(byLibrarian.values()).map((item) => {
    const booksHandled = item.booksIssued + item.booksReturned;
    const rawHours = (new Date(item.lastAt).getTime() - new Date(item.firstAt).getTime()) / (1000 * 60 * 60);
    const workingHours = Math.max(rawHours, 1);
    const efficiency = (booksHandled + item.tasksCompleted) / workingHours;
    return {
      librarian: item.librarian,
      booksIssued: item.booksIssued,
      booksReturned: item.booksReturned,
      booksHandled,
      tasksCompleted: item.tasksCompleted,
      workingHours: Number(workingHours.toFixed(2)),
      efficiency: Number(efficiency.toFixed(2)),
    };
  });
};

const recordLibrarianActivity = asyncHandler(async (req, res) => {
  const { activityType, count = 1, taskName = "", librarianId } = req.body;
  if (!["Issue", "Return", "Task"].includes(activityType)) {
    res.status(400);
    throw new Error("activityType must be Issue, Return, or Task.");
  }

  const targetLibrarianId = req.user.role === "Admin" && librarianId ? librarianId : req.user._id;
  const librarian = await User.findById(targetLibrarianId);
  if (!librarian || librarian.role !== "Librarian") {
    res.status(400);
    throw new Error("Valid librarian account is required.");
  }

  const activity = await LibrarianActivity.create({
    librarian: librarian._id,
    activityType,
    count: Number(count) > 0 ? Number(count) : 1,
    taskName,
  });
  res.status(201).json(activity);
});

const getLibrarianProductivityStats = asyncHandler(async (req, res) => {
  const range = req.query.range || "daily";
  const { start, end } = getRange(range, req.query.date);
  const logs = await LibrarianActivity.find({
    createdAt: { $gte: start, $lte: end },
  })
    .populate("librarian", "name email role")
    .sort({ createdAt: 1 });

  const summaries = buildStatsFromLogs(logs);
  const topPerformer = summaries.length
    ? [...summaries].sort((a, b) => b.efficiency - a.efficiency)[0]
    : null;

  const targetLibrarianId = req.user.role === "Librarian"
    ? String(req.user._id)
    : String(req.query.librarianId || topPerformer?.librarian?._id || "");
  const targetSummary = summaries.find((item) => String(item.librarian?._id) === targetLibrarianId)
    || {
      librarian: req.user.role === "Librarian" ? req.user : null,
      booksIssued: 0,
      booksReturned: 0,
      booksHandled: 0,
      tasksCompleted: 0,
      workingHours: 0,
      efficiency: 0,
    };

  const chartMap = new Map();
  logs
    .filter((log) => String(log.librarian?._id) === targetLibrarianId)
    .forEach((log) => {
      const key = formatDayKey(log.createdAt);
      if (!chartMap.has(key)) {
        chartMap.set(key, { booksHandled: 0, tasksCompleted: 0 });
      }
      const row = chartMap.get(key);
      if (log.activityType === "Issue" || log.activityType === "Return") {
        row.booksHandled += log.count;
      }
      if (log.activityType === "Task") {
        row.tasksCompleted += log.count;
      }
    });

  const chartRows = Array.from(chartMap.entries())
    .map(([day, value]) => ({
      day,
      score: value.booksHandled + value.tasksCompleted,
    }))
    .sort((a, b) => new Date(a.day) - new Date(b.day));

  res.json({
    range,
    start,
    end,
    summary: targetSummary,
    topPerformer,
    chart: {
      labels: chartRows.map((item) => item.day),
      values: chartRows.map((item) => item.score),
    },
  });
});

module.exports = {
  recordLibrarianActivity,
  getLibrarianProductivityStats,
};
