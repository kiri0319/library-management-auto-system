const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Fine = require("../models/Fine");
const { logActivity } = require("../services/activityService");
const {
  sendEmailChangeOtpEmail,
  sendDeleteAccountOtpEmail,
  sendAdminUserActionOtpEmail,
} = require("../services/emailService");

const verifyAdminOtp = (adminUser, action, targetUserId, otp) => {
  if (!otp) {
    return false;
  }
  if (!adminUser.otpAdminUserAction?.code) {
    return false;
  }
  return (
    adminUser.otpAdminUserAction.code === otp &&
    adminUser.otpAdminUserAction.action === action &&
    String(adminUser.otpAdminUserAction.targetUser) === String(targetUserId) &&
    new Date(adminUser.otpAdminUserAction.expiresAt) > new Date()
  );
};

const normalizeSLPhone = (value) => {
  const raw = String(value || "").trim();
  if (!raw) {
    return raw;
  }
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("07")) {
    return `+94${digits.slice(1)}`;
  }
  if (digits.length === 11 && digits.startsWith("94")) {
    return `+${digits}`;
  }
  return raw.replace(/\s+/g, "");
};

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
  const adminUser = await User.findById(req.user._id);
  if (!verifyAdminOtp(adminUser, "update", req.params.id, req.body.otp)) {
    res.status(403);
    throw new Error("Admin verification OTP is required or expired.");
  }

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

  adminUser.otpAdminUserAction = undefined;
  await adminUser.save();

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

const sendEmailChangeOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findById(req.user._id);

  if (!email) {
    res.status(400);
    throw new Error("Email is required.");
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (normalizedEmail === user.email) {
    res.status(400);
    throw new Error("Enter a different email address to change it.");
  }

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    res.status(409);
    throw new Error("That email address is already in use.");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.pendingEmail = normalizedEmail;
  user.otpEmailChange = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  };
  await user.save();

  await sendEmailChangeOtpEmail(normalizedEmail, user.name, otp);

  await logActivity({
    actor: user._id,
    actorRole: user.role,
    action: "EMAIL_CHANGE_REQUEST",
    module: "USERS",
    targetType: "User",
    targetId: user._id.toString(),
    description: `${user.name} requested email change to ${normalizedEmail}.`,
    ipAddress: req.ip,
  });

  res.json({
    message: "Verification OTP sent to the new email address.",
    otpPreview: process.env.NODE_ENV === "production" ? undefined : otp,
  });
});

const verifyEmailChangeOtp = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const user = await User.findById(req.user._id);

  if (!otp) {
    res.status(400);
    throw new Error("OTP is required.");
  }

  if (
    !user.pendingEmail ||
    !user.otpEmailChange?.code ||
    user.otpEmailChange.code !== otp ||
    new Date(user.otpEmailChange.expiresAt) < new Date()
  ) {
    res.status(400);
    throw new Error("Invalid or expired OTP.");
  }

  const existing = await User.findOne({ email: user.pendingEmail, _id: { $ne: user._id } });
  if (existing) {
    res.status(409);
    throw new Error("That email address is already in use.");
  }

  user.email = user.pendingEmail;
  user.pendingEmail = undefined;
  user.otpEmailChange = undefined;
  user.isVerified = true;
  await user.save();

  await logActivity({
    actor: user._id,
    actorRole: user.role,
    action: "EMAIL_CHANGE_VERIFY",
    module: "USERS",
    targetType: "User",
    targetId: user._id.toString(),
    description: `${user.name} verified new email ${user.email}.`,
    ipAddress: req.ip,
  });

  res.json(user);
});

const sendDeleteAccountOtp = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.otpDeleteAccount = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  };
  await user.save();

  await sendDeleteAccountOtpEmail(user.email, user.name, otp);

  await logActivity({
    actor: user._id,
    actorRole: user.role,
    action: "DELETE_ACCOUNT_REQUEST",
    module: "USERS",
    targetType: "User",
    targetId: user._id.toString(),
    description: `${user.name} requested account deletion.`,
    ipAddress: req.ip,
  });

  res.json({
    message: "Account deletion OTP sent to your email.",
    otpPreview: process.env.NODE_ENV === "production" ? undefined : otp,
  });
});

const verifyDeleteAccountOtp = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const user = await User.findById(req.user._id);

  if (!otp) {
    res.status(400);
    throw new Error("OTP is required.");
  }

  if (
    !user.otpDeleteAccount?.code ||
    user.otpDeleteAccount.code !== otp ||
    new Date(user.otpDeleteAccount.expiresAt) < new Date()
  ) {
    res.status(400);
    throw new Error("Invalid or expired OTP.");
  }

  // Check for active borrows
  const Borrow = require("../models/Borrow");
  const activeBorrows = await Borrow.find({
    user: user._id,
    status: { $in: ["Borrowed", "Overdue"] },
  });

  if (activeBorrows.length > 0) {
    res.status(400);
    throw new Error("Cannot delete account with active book borrowings. Please return all books first.");
  }

  // Check for unpaid fines
  const Fine = require("../models/Fine");
  const unpaidFines = await Fine.find({
    user: user._id,
    status: "Unpaid",
  });

  if (unpaidFines.length > 0) {
    res.status(400);
    throw new Error("Cannot delete account with unpaid fines. Please settle all fines first.");
  }

  await logActivity({
    actor: user._id,
    actorRole: user.role,
    action: "DELETE_ACCOUNT_VERIFY",
    module: "USERS",
    targetType: "User",
    targetId: user._id.toString(),
    severity: "High",
    description: `${user.name} verified account deletion OTP.`,
    ipAddress: req.ip,
  });

  await user.deleteOne();

  res.json({ message: "Account deleted successfully." });
});

const deleteUser = asyncHandler(async (req, res) => {
  const adminUser = await User.findById(req.user._id);
  if (!verifyAdminOtp(adminUser, "delete", req.params.id, req.body?.otp)) {
    res.status(403);
    throw new Error("Admin verification OTP is required or expired.");
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  await user.deleteOne();

  adminUser.otpAdminUserAction = undefined;
  await adminUser.save();

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

const sendAdminUserActionOtp = asyncHandler(async (req, res) => {
  const { action, targetUserId } = req.body;
  if (!["update", "delete"].includes(action)) {
    res.status(400);
    throw new Error("Action must be update or delete.");
  }
  if (!targetUserId) {
    res.status(400);
    throw new Error("Target user is required.");
  }

  const adminUser = await User.findById(req.user._id);
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    res.status(404);
    throw new Error("Target user not found.");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  adminUser.otpAdminUserAction = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    action,
    targetUser: targetUser._id,
  };
  await adminUser.save();

  await sendAdminUserActionOtpEmail(targetUser.email, targetUser.name, otp, action, targetUser.email);
  if (String(adminUser.email).toLowerCase() !== String(targetUser.email).toLowerCase()) {
    await sendAdminUserActionOtpEmail(adminUser.email, adminUser.name, otp, action, targetUser.email);
  }

  res.json({
    message: `Verification OTP sent to ${targetUser.email} and ${adminUser.email}.`,
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  ["name", "phone", "address", "avatar"].forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = field === "phone" ? normalizeSLPhone(req.body[field]) : req.body[field];
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
  sendEmailChangeOtp,
  verifyEmailChangeOtp,
  sendDeleteAccountOtp,
  verifyDeleteAccountOtp,
  sendAdminUserActionOtp,
};
