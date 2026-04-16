const express = require("express");
const { getActivityLogs } = require("../controllers/activityController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, authorize("Admin"), getActivityLogs);

module.exports = router;

