const express = require("express");
const { getFines, updateFineStatus } = require("../controllers/fineController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect, getFines);
router.route("/:id").put(protect, authorize("Admin", "Librarian"), updateFineStatus);

module.exports = router;

