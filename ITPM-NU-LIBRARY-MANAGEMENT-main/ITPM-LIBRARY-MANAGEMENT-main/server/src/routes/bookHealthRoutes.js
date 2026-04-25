const express = require("express");
const {
  getBookHealthList,
  getBookHealthAlerts,
  updateBookHealth,
} = require("../controllers/bookHealthController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/")
  .get(protect, authorize("Admin", "Librarian"), getBookHealthList);

router.route("/alerts")
  .get(protect, authorize("Admin", "Librarian"), getBookHealthAlerts);

router.route("/:bookId")
  .put(protect, authorize("Admin", "Librarian"), updateBookHealth);

module.exports = router;
