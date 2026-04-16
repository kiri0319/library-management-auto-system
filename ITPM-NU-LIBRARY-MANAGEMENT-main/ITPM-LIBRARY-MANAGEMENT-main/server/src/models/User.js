const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const otpResetSchema = new mongoose.Schema(
  {
    code: String,
    expiresAt: Date,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["Admin", "Librarian", "Student"],
      default: "Student",
    },
    status: {
      type: String,
      enum: ["Active", "Restricted", "Suspended"],
      default: "Active",
    },
    studentId: String,
    phone: String,
    address: String,
    avatar: String,
    membershipCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    readingHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Borrow",
      },
    ],
    otpReset: otpResetSchema,
    lastLoginAt: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function savePassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);

