const express = require("express");
const {
  recordLibrarianActivity,
  getLibrarianProductivityStats,
} = require("../controllers/librarianProductivityController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/record")
  .post(protect, authorize("Librarian", "Admin"), recordLibrarianActivity);

router.route("/stats")
  .get(protect, authorize("Librarian", "Admin"), getLibrarianProductivityStats);

module.exports = router;
