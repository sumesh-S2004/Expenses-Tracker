const Category = require("../models/Category");

exports.getCategories = async (req, res) => {
  const categories = await Category.find({ user: req.userId }).sort({ name: 1 }).lean();
  res.json(categories);
};

exports.createCategory = async (req, res) => {
  try {
    const { name, type, color, icon } = req.body;
    if (!name) return res.status(400).json({ message: "Category name is required." });

    const category = await Category.create({
      user: req.userId,
      name,
      type: type || "expense",
      color,
      icon,
    });
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "This category already exists." });
    }
    res.status(500).json({ message: "Could not create category.", error: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  const category = await Category.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!category) return res.status(404).json({ message: "Category not found." });
  res.json(category);
};

exports.deleteCategory = async (req, res) => {
  const category = await Category.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!category) return res.status(404).json({ message: "Category not found." });
  res.json({ message: "Category deleted." });
};
