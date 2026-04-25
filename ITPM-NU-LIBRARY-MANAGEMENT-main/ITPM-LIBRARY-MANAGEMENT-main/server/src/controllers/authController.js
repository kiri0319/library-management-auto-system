const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { logActivity } = require("../services/activityService");
const { sendOtpEmail, sendRegistrationOtpEmail } = require("../services/emailService");

const buildAuthResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  studentId: user.studentId,
  phone: user.phone,
  address: user.address,
  avatar: user.avatar,
  membershipCode: user.membershipCode,
  token: generateToken(user._id, user.role),
});

const registerStudent = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required.");
  }

  let user = await User.findOne({ email });

  if (user && user.isVerified) {
    res.status(409);
    throw new Error("Email is already registered.");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  if (user) {
    // Resend OTP for existing unverified user
    user.otpRegister = {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    };
    await user.save();
  } else {
    // Create new user
    user = await User.create({
      name,
      email,
      password,
      role: "Student",
      phone,
      address,
      studentId: `STU-${Date.now().toString().slice(-6)}`,
      membershipCode: `LIB-${Date.now().toString().slice(-8)}`,
      isVerified: false,
      otpRegister: {
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
  }

  await sendRegistrationOtpEmail(user.email, user.name, otp);

  res.status(200).json({
    message: "OTP sent successfully. Check your email to verify your account.",
    otpPreview: process.env.NODE_ENV === "production" ? undefined : otp,
  });
});

const verifyRegistrationOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error("Email and OTP are required.");
  }

  const user = await User.findOne({ email });
  if (
    !user ||
    !user.otpRegister?.code ||
    user.otpRegister.code !== otp ||
    new Date(user.otpRegister.expiresAt) < new Date()
  ) {
    res.status(400);
    throw new Error("Invalid or expired OTP.");
  }

  user.isVerified = true;
  user.otpRegister = undefined;
  await user.save();

  await logActivity({
    actor: user._id,
    actorRole: user.role,
    action: "REGISTER",
    module: "AUTH",
    targetType: "User",
    targetId: user._id.toString(),
    description: `${user.name} verified email and completed registration.`,
  });

  res.status(200).json(buildAuthResponse(user));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    await logActivity({
      action: "FAILED_LOGIN",
      module: "AUTH",
      severity: "High",
      description: `Failed login attempt for email ${email}.`,
      ipAddress: req.ip,
    });
    res.status(401);
    throw new Error("Invalid email or password.");
  }

  if (!user.isVerified) {
    res.status(403);
    throw new Error("Please verify your email before logging in.");
  }

  user.lastLoginAt = new Date();
  await user.save();

  await logActivity({
    actor: user._id,
    actorRole: user.role,
    action: "LOGIN",
    module: "AUTH",
    targetType: "User",
    targetId: user._id.toString(),
    description: `${user.name} logged in.`,
    ipAddress: req.ip,
  });

  res.json(buildAuthResponse(user));
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password")
    .populate({
      path: "readingHistory",
      populate: { path: "book", select: "title isbn coverImage" },
      options: { sort: { createdAt: -1 }, limit: 10 },
    });

  res.json(user);
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("No user found with this email.");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otpReset = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  };
  await user.save();
  await sendOtpEmail(user.email, user.name, otp);

  await logActivity({
    actor: user._id,
    actorRole: user.role,
    action: "FORGOT_PASSWORD",
    module: "AUTH",
    targetType: "User",
    targetId: user._id.toString(),
    description: `Password reset OTP requested for ${user.email}.`,
  });

  res.json({
    message: "OTP sent successfully. Configure SMTP to send real emails in production.",
    otpPreview: process.env.NODE_ENV === "production" ? undefined : otp,
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await User.findOne({ email }).select("+password");

  if (
    !user ||
    !user.otpReset?.code ||
    user.otpReset.code !== otp ||
    new Date(user.otpReset.expiresAt) < new Date()
  ) {
    res.status(400);
    throw new Error("Invalid or expired OTP.");
  }

  user.password = newPassword;
  user.otpReset = undefined;
  await user.save();

  await logActivity({
    actor: user._id,
    actorRole: user.role,
    action: "RESET_PASSWORD",
    module: "AUTH",
    targetType: "User",
    targetId: user._id.toString(),
    description: `${user.email} reset the account password.`,
  });

  res.json({ message: "Password reset successful." });
});

module.exports = {
  registerStudent,
  verifyRegistrationOtp,
  login,
  getMe,
  forgotPassword,
  resetPassword,
};

