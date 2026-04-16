const express = require("express");
const {
  downloadBorrowingReport,
  downloadFineReport,
  downloadActivityReport,
} = require("../controllers/reportController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/borrowing", protect, authorize("Admin", "Librarian"), downloadBorrowingReport);
router.get("/fines", protect, authorize("Admin", "Librarian"), downloadFineReport);
router.get("/activity", protect, authorize("Admin"), downloadActivityReport);

module.exports = router;

