const express = require("express");
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  postBookCoverUpload,
} = require("../controllers/bookController");
const { protect, authorize } = require("../middleware/authMiddleware");
const bookCoverUpload = require("../middleware/bookCoverUpload");

const router = express.Router();

router.post(
  "/upload-cover",
  protect,
  authorize("Admin", "Librarian"),
  bookCoverUpload.single("cover"),
  postBookCoverUpload
);

router
  .route("/")
  .get(getBooks)
  .post(protect, authorize("Admin", "Librarian"), createBook);

router
  .route("/:id")
  .get(protect, getBookById)
  .put(protect, authorize("Admin", "Librarian"), updateBook)
  .delete(protect, authorize("Admin", "Librarian"), deleteBook);

module.exports = router;
