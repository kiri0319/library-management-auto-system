const express = require("express");
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router
  .route("/")
  .get(protect, getCategories)
  .post(protect, authorize("Admin", "Librarian"), createCategory);

router
  .route("/:id")
  .put(protect, authorize("Admin", "Librarian"), updateCategory)
  .delete(protect, authorize("Admin", "Librarian"), deleteCategory);

module.exports = router;

