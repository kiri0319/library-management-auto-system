const express = require("express");
const { getFines, updateFineStatus, recalculateUnpaidFines } = require("../controllers/fineController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect, getFines);
router.route("/recalculate").post(protect, authorize("Admin"), recalculateUnpaidFines);
router.route("/:id").put(protect, authorize("Librarian"), updateFineStatus);

module.exports = router;

