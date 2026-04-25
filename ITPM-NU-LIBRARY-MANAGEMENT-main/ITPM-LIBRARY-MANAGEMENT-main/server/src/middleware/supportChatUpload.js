const fs = require("fs");
const path = require("path");
const multer = require("multer");

const dest = path.join(__dirname, "..", "..", "uploads", "support-chat");
fs.mkdirSync(dest, { recursive: true });

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, dest);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname || "") || "";
    cb(null, `chat-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const supportChatUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = [
      /^image\/(jpeg|jpg|png|gif|webp)$/i,
      /^application\/pdf$/i,
      /^text\/plain$/i,
      /^application\/(msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/i,
    ];
    if (allowed.some((rule) => rule.test(file.mimetype))) {
      cb(null, true);
      return;
    }
    cb(new Error("Only image, PDF, TXT, DOC, and DOCX files are allowed."));
  },
});

module.exports = supportChatUpload;
