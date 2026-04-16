const asyncHandler = require("express-async-handler");
const Author = require("../models/Author");
const { logActivity } = require("../services/activityService");

const getAuthors = asyncHandler(async (req, res) => {
  const authors = await Author.find().sort({ name: 1 });
  res.json(authors);
});

const createAuthor = asyncHandler(async (req, res) => {
  const author = await Author.create(req.body);

  await logActivity({
    actor: req.user._id,
    actorRole: req.user.role,
    action: "CREATE_AUTHOR",
    module: "BOOKS",
    targetType: "Author",
    targetId: author._id.toString(),
    description: `${req.user.name} created author ${author.name}.`,
  });

  res.status(201).json(author);
});

const updateAuthor = asyncHandler(async (req, res) => {
  const author = await Author.findByIdAndUpdate(req.params.id, req.body, { new: true });

  if (!author) {
    res.status(404);
    throw new Error("Author not found.");
  }

  res.json(author);
});

const deleteAuthor = asyncHandler(async (req, res) => {
  const author = await Author.findById(req.params.id);

  if (!author) {
    res.status(404);
    throw new Error("Author not found.");
  }

  await author.deleteOne();
  res.json({ message: "Author deleted successfully." });
});

module.exports = {
  getAuthors,
  createAuthor,
  updateAuthor,
  deleteAuthor,
};

