const express = require("express");
const { issueBook, selfBorrow, returnBook, getBorrows } = require("../controllers/borrowController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect, getBorrows);
router.route("/issue").post(protect, authorize("Admin", "Librarian"), issueBook);
router.route("/self").post(protect, authorize("Student"), selfBorrow);
router.route("/return").post(protect, authorize("Admin", "Librarian"), returnBook);

module.exports = router;

