const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Fine = require("../models/Fine");
const { logActivity } = require("../services/activityService");

const getUsers = asyncHandler(async (req, res) => {
  const { role, status, search } = req.query;
  const query = {};

  if (req.user.role === "Librarian") {
    query.role = "Student";
  } else if (role) {
    query.role = role;
  }

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { studentId: { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(query).select("-password").sort({ createdAt: -1 });
  res.json(users);
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, status, phone, address } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error("Name, email, password, and role are required.");
  }

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(409);
    throw new Error("User email already exists.");
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    status: status || "Active",
    phone,
    address,
    studentId: role === "Student" ? `STU-${Date.now().toString().slice(-6)}` : undefined,
    membershipCode: role === "Student" ? `LIB-${Date.now().toString().slice(-8)}` : undefined,
  });

  await logActivity({
    actor: req.user._id,
    actorRole: req.user.role,
    action: "CREATE_USER",
    module: "USERS",
    targetType: "User",
    targetId: user._id.toString(),
    description: `${req.user.name} created ${role} account ${email}.`,
    ipAddress: req.ip,
  });

  res.status(201).json(user);
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password")
    .populate({
      path: "readingHistory",
      populate: { path: "book", select: "title isbn coverImage" },
      options: { sort: { createdAt: -1 }, limit: 10 },
    });

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  const fines = await Fine.find({ user: user._id, status: "Unpaid" });

  res.json({
    ...user.toObject(),
    unpaidFineTotal: fines.reduce((sum, fine) => sum + fine.amount, 0),
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  const allowedFields = ["name", "email", "role", "status", "phone", "address", "avatar"];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });

  if (req.body.password) {
    user.password = req.body.password;
  }

  await user.save();

  await logActivity({
    actor: req.user._id,
    actorRole: req.user.role,
    action: "UPDATE_USER",
    module: "USERS",
    targetType: "User",
    targetId: user._id.toString(),
    description: `${req.user.name} updated user ${user.email}.`,
    ipAddress: req.ip,
  });

  res.json(user);
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  await user.deleteOne();

  await logActivity({
    actor: req.user._id,
    actorRole: req.user.role,
    action: "DELETE_USER",
    module: "USERS",
    targetType: "User",
    targetId: user._id.toString(),
    severity: "High",
    description: `${req.user.name} deleted user ${user.email}.`,
    ipAddress: req.ip,
  });

  res.json({ message: "User deleted successfully." });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  ["name", "phone", "address", "avatar"].forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });

  await user.save();

  await logActivity({
    actor: user._id,
    actorRole: user.role,
    action: "UPDATE_PROFILE",
    module: "USERS",
    targetType: "User",
    targetId: user._id.toString(),
    description: `${user.name} updated profile details.`,
    ipAddress: req.ip,
  });

  res.json(user);
});

module.exports = {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  updateProfile,
};
