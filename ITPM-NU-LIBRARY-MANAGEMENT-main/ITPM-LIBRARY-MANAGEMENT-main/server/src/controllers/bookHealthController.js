const asyncHandler = require("express-async-handler");
const Book = require("../models/Book");
const BookHealth = require("../models/BookHealth");

const getSuggestion = (status) => {
  if (status === "Damaged") {
    return "Repair";
  }
  if (status === "Old") {
    return "Replace";
  }
  return "Monitor";
};

const getBookHealthList = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const books = await Book.find({})
    .populate("author", "name")
    .populate("category", "name")
    .sort({ title: 1 });
  const healthRecords = await BookHealth.find({})
    .populate("updatedBy", "name role")
    .sort({ updatedAt: -1 });

  const healthMap = new Map(
    healthRecords.map((record) => [record.book.toString(), record])
  );

  const merged = books.map((book) => {
    const health = healthMap.get(book._id.toString());
    if (health) {
      return {
        _id: health._id,
        book,
        status: health.status,
        suggestion: health.suggestion,
        history: health.history,
        updatedAt: health.updatedAt,
        updatedBy: health.updatedBy || null,
      };
    }
    return {
      _id: `default-${book._id}`,
      book,
      status: "Good",
      suggestion: "Monitor",
      history: [],
      updatedAt: book.updatedAt,
      updatedBy: null,
    };
  });

  const filtered = status
    ? merged.filter((item) => item.status === status)
    : merged;
  res.json(filtered);
});

const getBookHealthAlerts = asyncHandler(async (req, res) => {
  const alerts = await BookHealth.find({ status: { $in: ["Damaged", "Old"] } })
    .populate({
      path: "book",
      populate: [
        { path: "author", select: "name" },
        { path: "category", select: "name" },
      ],
    })
    .populate("updatedBy", "name role")
    .sort({ updatedAt: -1 });

  res.json(alerts);
});

const updateBookHealth = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  const { status, remarks = "" } = req.body;
  if (!["Good", "Damaged", "Old"].includes(status)) {
    res.status(400);
    throw new Error("Status must be Good, Damaged, or Old.");
  }

  const book = await Book.findById(bookId);
  if (!book) {
    res.status(404);
    throw new Error("Book not found.");
  }

  const suggestion = getSuggestion(status);
  const historyEntry = {
    status,
    remarks: String(remarks).trim(),
    updatedAt: new Date(),
    updatedBy: req.user._id,
  };

  const updated = await BookHealth.findOneAndUpdate(
    { book: book._id },
    {
      $set: { status, suggestion, updatedBy: req.user._id },
      $push: { history: historyEntry },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  )
    .populate("book", "title isbn")
    .populate("updatedBy", "name role");

  res.json(updated);
});

module.exports = {
  getBookHealthList,
  getBookHealthAlerts,
  updateBookHealth,
};
