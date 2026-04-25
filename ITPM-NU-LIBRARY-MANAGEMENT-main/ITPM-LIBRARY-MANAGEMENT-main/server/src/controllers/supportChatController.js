const asyncHandler = require("express-async-handler");
const SupportChatMessage = require("../models/SupportChatMessage");
const User = require("../models/User");
const { getIO } = require("../config/socket");
const { createNotification } = require("../services/notificationService");

const safeEmit = (event, payload, room) => {
  try {
    const io = getIO();
    io.to(room).emit(event, payload);
  } catch (error) {
    // Socket is optional for non-server scripts.
  }
};

const buildAttachment = (file) => {
  if (!file) {
    return undefined;
  }
  return {
    url: `/uploads/support-chat/${file.filename}`,
    fileName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  };
};

const getStudentThread = asyncHandler(async (req, res) => {
  const messages = await SupportChatMessage.find({ student: req.user._id })
    .populate("sender", "name role email")
    .populate({
      path: "replyTo",
      select: "message senderRole sender createdAt",
      populate: { path: "sender", select: "name role email" },
    })
    .sort({ createdAt: 1 });
  res.json(messages);
});

const getLibrarianThreads = asyncHandler(async (req, res) => {
  const messages = await SupportChatMessage.find({})
    .populate("student", "name email studentId")
    .populate("sender", "name role email")
    .populate({
      path: "replyTo",
      select: "message senderRole sender createdAt",
      populate: { path: "sender", select: "name role email" },
    })
    .sort({ createdAt: 1 });
  res.json(messages);
});

const postStudentMessage = asyncHandler(async (req, res) => {
  const messageText = String(req.body.message || "").trim();
  const replyToId = req.body.replyTo;
  const attachment = buildAttachment(req.file);
  if (!messageText && !attachment) {
    res.status(400);
    throw new Error("Message or attachment is required.");
  }
  let replyTo = null;
  if (replyToId) {
    replyTo = await SupportChatMessage.findOne({ _id: replyToId, student: req.user._id }).select("_id");
    if (!replyTo) {
      res.status(404);
      throw new Error("Reply target message not found.");
    }
  }

  const message = await SupportChatMessage.create({
    student: req.user._id,
    sender: req.user._id,
    senderRole: "Student",
    message: messageText,
    replyTo: replyTo?._id || null,
    attachment,
  });

  const populated = await SupportChatMessage.findById(message._id)
    .populate("student", "name email studentId")
    .populate("sender", "name role email")
    .populate({
      path: "replyTo",
      select: "message senderRole sender createdAt",
      populate: { path: "sender", select: "name role email" },
    });

  const librarians = await User.find({ role: "Librarian" }).select("_id");
  await Promise.all(
    librarians.map((librarian) =>
      createNotification({
        user: librarian._id,
        title: "New support chat message",
        message: `${req.user.name} sent a support message.`,
        type: "Info",
        link: "/dashboard/librarian/support-chat",
      })
    )
  );
  await createNotification({
    user: req.user._id,
    title: "Message sent",
    message: "Your support message was sent to the librarian.",
    type: "Success",
    link: "/dashboard/student/support-chat",
  });

  safeEmit("support-chat:new-message", populated, "role:Librarian");
  safeEmit("support-chat:new-message", populated, `user:${req.user._id}`);

  res.status(201).json(populated);
});

const postLibrarianMessage = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const messageText = String(req.body.message || "").trim();
  const replyToId = req.body.replyTo;
  const attachment = buildAttachment(req.file);
  if (!messageText && !attachment) {
    res.status(400);
    throw new Error("Message or attachment is required.");
  }

  const student = await User.findById(studentId).select("_id role");
  if (!student || student.role !== "Student") {
    res.status(404);
    throw new Error("Student not found.");
  }
  let replyTo = null;
  if (replyToId) {
    replyTo = await SupportChatMessage.findOne({ _id: replyToId, student: student._id }).select("_id");
    if (!replyTo) {
      res.status(404);
      throw new Error("Reply target message not found.");
    }
  }

  const message = await SupportChatMessage.create({
    student: student._id,
    sender: req.user._id,
    senderRole: "Librarian",
    message: messageText,
    replyTo: replyTo?._id || null,
    attachment,
  });

  const populated = await SupportChatMessage.findById(message._id)
    .populate("student", "name email studentId")
    .populate("sender", "name role email")
    .populate({
      path: "replyTo",
      select: "message senderRole sender createdAt",
      populate: { path: "sender", select: "name role email" },
    });

  await createNotification({
    user: student._id,
    title: "New librarian reply",
    message: `${req.user.name} replied to your support chat.`,
    type: "Info",
    link: "/dashboard/student/support-chat",
  });
  await createNotification({
    user: req.user._id,
    title: "Reply sent",
    message: "Your support reply was sent.",
    type: "Success",
    link: "/dashboard/librarian/support-chat",
  });

  safeEmit("support-chat:new-message", populated, `user:${student._id}`);
  safeEmit("support-chat:new-message", populated, "role:Librarian");

  res.status(201).json(populated);
});

module.exports = {
  getStudentThread,
  getLibrarianThreads,
  postStudentMessage,
  postLibrarianMessage,
};
