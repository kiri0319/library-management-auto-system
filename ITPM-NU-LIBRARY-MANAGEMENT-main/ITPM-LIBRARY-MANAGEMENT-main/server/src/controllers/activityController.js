const asyncHandler = require("express-async-handler");
const ActivityLog = require("../models/ActivityLog");

const getActivityLogs = asyncHandler(async (req, res) => {
  const { severity, module, search } = req.query;
  const query = {};

  if (severity) {
    query.severity = severity;
  }

  if (module) {
    query.module = module;
  }

  if (search) {
    query.$or = [
      { action: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const logs = await ActivityLog.find(query)
    .populate("actor", "name email role")
    .sort({ createdAt: -1 })
    .limit(200);

  res.json(logs);
});

module.exports = {
  getActivityLogs,
};

