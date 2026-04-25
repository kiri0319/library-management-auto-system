const express = require("express");
const {
  getStudentThread,
  getLibrarianThreads,
  postStudentMessage,
  postLibrarianMessage,
} = require("../controllers/supportChatController");
const { protect, authorize } = require("../middleware/authMiddleware");
const supportChatUpload = require("../middleware/supportChatUpload");

const router = express.Router();

router.route("/student")
  .get(protect, authorize("Student"), getStudentThread)
  .post(protect, authorize("Student"), supportChatUpload.single("file"), postStudentMessage);

router.route("/librarian")
  .get(protect, authorize("Librarian"), getLibrarianThreads);

router.route("/librarian/:studentId")
  .post(protect, authorize("Librarian"), supportChatUpload.single("file"), postLibrarianMessage);

module.exports = router;
