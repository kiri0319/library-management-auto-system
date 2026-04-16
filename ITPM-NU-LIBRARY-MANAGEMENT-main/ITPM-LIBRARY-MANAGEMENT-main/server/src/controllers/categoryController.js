const asyncHandler = require("express-async-handler");
const Category = require("../models/Category");
const { logActivity } = require("../services/activityService");

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json(categories);
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);

  await logActivity({
    actor: req.user._id,
    actorRole: req.user.role,
    action: "CREATE_CATEGORY",
    module: "BOOKS",
    targetType: "Category",
    targetId: category._id.toString(),
    description: `${req.user.name} created category ${category.name}.`,
  });

  res.status(201).json(category);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });

  if (!category) {
    res.status(404);
    throw new Error("Category not found.");
  }

  res.json(category);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found.");
  }

  await category.deleteOne();
  res.json({ message: "Category deleted successfully." });
});

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};

