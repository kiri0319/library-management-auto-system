const fs = require("fs");
const path = require("path");
const multer = require("multer");

const dest = path.join(__dirname, "..", "..", "uploads", "book-covers");
fs.mkdirSync(dest, { recursive: true });

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, dest);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname || "") || ".jpg";
    cb(null, `cover-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const uploadBookCover = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (/^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error("Only JPEG, PNG, GIF, or WebP images are allowed."));
  },
});

module.exports = uploadBookCover;
