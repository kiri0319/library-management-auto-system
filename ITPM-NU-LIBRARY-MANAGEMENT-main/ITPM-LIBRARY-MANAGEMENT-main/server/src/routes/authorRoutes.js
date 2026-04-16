const express = require("express");
const {
  getAuthors,
  createAuthor,
  updateAuthor,
  deleteAuthor,
} = require("../controllers/authorController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router
  .route("/")
  .get(protect, getAuthors)
  .post(protect, authorize("Admin", "Librarian"), createAuthor);

router
  .route("/:id")
  .put(protect, authorize("Admin", "Librarian"), updateAuthor)
  .delete(protect, authorize("Admin", "Librarian"), deleteAuthor);

module.exports = router;

