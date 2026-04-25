const express = require("express");
const {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  updateProfile,
  sendEmailChangeOtp,
  verifyEmailChangeOtp,
  sendDeleteAccountOtp,
  verifyDeleteAccountOtp,
  sendAdminUserActionOtp,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/profile").put(protect, updateProfile);
router.route("/profile/email/send-otp").post(protect, sendEmailChangeOtp);
router.route("/profile/email/verify-otp").post(protect, verifyEmailChangeOtp);
router.route("/profile/delete/send-otp").post(protect, sendDeleteAccountOtp);
router.route("/profile/delete/verify-otp").post(protect, verifyDeleteAccountOtp);
router.route("/admin/action/send-otp").post(protect, authorize("Admin"), sendAdminUserActionOtp);
router.route("/").get(protect, authorize("Admin", "Librarian"), getUsers).post(protect, authorize("Admin"), createUser);
router
  .route("/:id")
  .get(protect, authorize("Admin"), getUserById)
  .put(protect, authorize("Admin"), updateUser)
  .delete(protect, authorize("Admin"), deleteUser);

module.exports = router;
