const asyncHandler = require("express-async-handler");
const Author = require("../models/Author");
const Book = require("../models/Book");
const Reservation = require("../models/Reservation");

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const { getStockStatus } = require("../utils/dateUtils");
const { logActivity } = require("../services/activityService");
const { getIO } = require("../config/socket");

const emitBookStock = (book) => {
  try {
    const io = getIO();
    io.to(`book:${book._id}`).emit("book:stock-updated", {
      bookId: book._id,
      availableCopies: book.availableCopies,
      reservedCount: book.reservedCount,
      stockStatus: getStockStatus(book),
    });
  } catch (error) {
    // Socket is optional during seed runs.
  }
};

const shapeBook = async (bookDoc) => {
  const queueCount = await Reservation.countDocuments({
    book: bookDoc._id,
    status: { $in: ["Queued", "Notified"] },
  });

  return {
    ...bookDoc.toObject(),
    stockStatus: getStockStatus(bookDoc),
    queueCount,
  };
};

const getBooks = asyncHandler(async (req, res) => {
  const { search, category, author, status } = req.query;
  const query = {};

  const searchTrimmed = typeof search === "string" ? search.trim() : "";

  if (searchTrimmed) {
    const safe = escapeRegex(searchTrimmed);
    query.$or = [
      { title: { $regex: safe, $options: "i" } },
      { isbn: { $regex: safe, $options: "i" } },
      { tags: { $elemMatch: { $regex: safe, $options: "i" } } },
    ];
    const words = searchTrimmed
      .split(/\s+/)
      .map((w) => w.trim())
      .filter(Boolean)
      .map(escapeRegex);
    const authorFilter =
      words.length === 0
        ? null
        : words.length === 1
          ? { name: { $regex: words[0], $options: "i" } }
          : { $and: words.map((w) => ({ name: { $regex: w, $options: "i" } })) };
    const authorIds = authorFilter ? await Author.find(authorFilter).distinct("_id") : [];
    if (authorIds.length) {
      query.$or.push({ author: { $in: authorIds } });
    }
  }

  if (category) {
    query.category = category;
  }

  if (author) {
    query.author = author;
  }

  const books = await Book.find(query)
    .populate("author", "name")
    .populate("category", "name")
    .sort({ createdAt: -1 });

  const shapedBooks = await Promise.all(
    books
      .filter((book) => (status ? getStockStatus(book) === status : true))
      .map((book) => shapeBook(book))
  );

  res.json(shapedBooks);
});

const getBookById = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id).populate("author", "name").populate("category", "name");

  if (!book) {
    res.status(404);
    throw new Error("Book not found.");
  }

  res.json(await shapeBook(book));
});

const createBook = asyncHandler(async (req, res) => {
  const payload = { ...req.body, createdBy: req.user._id };
  if (!payload.availableCopies && payload.availableCopies !== 0) {
    payload.availableCopies = payload.quantity;
  }

  const book = await Book.create(payload);
  const populatedBook = await Book.findById(book._id).populate("author", "name").populate("category", "name");

  await logActivity({
    actor: req.user._id,
    actorRole: req.user.role,
    action: "CREATE_BOOK",
    module: "BOOKS",
    targetType: "Book",
    targetId: book._id.toString(),
    description: `${req.user.name} added "${book.title}".`,
    ipAddress: req.ip,
  });

  emitBookStock(book);
  res.status(201).json(await shapeBook(populatedBook));
});

const updateBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    res.status(404);
    throw new Error("Book not found.");
  }

  Object.keys(req.body).forEach((field) => {
    book[field] = req.body[field];
  });

  if (book.availableCopies > book.quantity) {
    book.availableCopies = book.quantity;
  }

  await book.save();
  const populatedBook = await Book.findById(book._id).populate("author", "name").populate("category", "name");

  await logActivity({
    actor: req.user._id,
    actorRole: req.user.role,
    action: "UPDATE_BOOK",
    module: "BOOKS",
    targetType: "Book",
    targetId: book._id.toString(),
    description: `${req.user.name} updated "${book.title}".`,
    ipAddress: req.ip,
  });

  emitBookStock(book);
  res.json(await shapeBook(populatedBook));
});

const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    res.status(404);
    throw new Error("Book not found.");
  }

  await book.deleteOne();

  await logActivity({
    actor: req.user._id,
    actorRole: req.user.role,
    action: "DELETE_BOOK",
    module: "BOOKS",
    targetType: "Book",
    targetId: req.params.id,
    severity: "Medium",
    description: `${req.user.name} deleted "${book.title}".`,
    ipAddress: req.ip,
  });

  res.json({ message: "Book deleted successfully." });
});

const postBookCoverUpload = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No cover image file uploaded.");
  }
  const relativeUrl = `/uploads/book-covers/${req.file.filename}`;
  res.json({ coverImage: relativeUrl });
});

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  postBookCoverUpload,
};

