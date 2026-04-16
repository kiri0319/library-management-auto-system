const express = require("express");
const {
  getAdminDashboard,
  getLibrarianDashboard,
  getStudentDashboard,
} = require("../controllers/dashboardController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/admin", protect, authorize("Admin"), getAdminDashboard);
router.get("/librarian", protect, authorize("Admin", "Librarian"), getLibrarianDashboard);
router.get("/student", protect, authorize("Student"), getStudentDashboard);

module.exports = router;

