const express = require("express");
const { getSettings, updateSetting } = require("../controllers/settingsController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect, authorize("Admin"), getSettings);
router.route("/:id").put(protect, authorize("Admin"), updateSetting);

module.exports = router;

