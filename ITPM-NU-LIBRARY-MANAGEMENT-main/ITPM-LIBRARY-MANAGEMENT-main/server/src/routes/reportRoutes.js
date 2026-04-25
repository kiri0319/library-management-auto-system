const express = require("express");
const {
  downloadBorrowingReport,
  downloadFineReport,
  downloadActivityReport,
  viewBorrowingReport,
  viewFineReport,
  viewActivityReport,
} = require("../controllers/reportController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/borrowing", protect, authorize("Admin", "Librarian"), downloadBorrowingReport);
router.get("/fines", protect, authorize("Admin", "Librarian"), downloadFineReport);
router.get("/activity", protect, authorize("Admin"), downloadActivityReport);
router.get("/borrowing/view", protect, authorize("Admin", "Librarian"), viewBorrowingReport);
router.get("/fines/view", protect, authorize("Admin", "Librarian"), viewFineReport);
router.get("/activity/view", protect, authorize("Admin"), viewActivityReport);

module.exports = router;

