const express = require("express");
const {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  updateProfile,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/profile").put(protect, updateProfile);
router.route("/").get(protect, authorize("Admin", "Librarian"), getUsers).post(protect, authorize("Admin"), createUser);
router
  .route("/:id")
  .get(protect, authorize("Admin"), getUserById)
  .put(protect, authorize("Admin"), updateUser)
  .delete(protect, authorize("Admin"), deleteUser);

module.exports = router;
