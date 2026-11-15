const mongoose = require("mongoose");
const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");

// One query for budgets + ONE aggregation for all spending (no per-budget queries).
async function getBudgetsWithSpent(userId, month, year) {
  const budgets = await Budget.find({ user: userId, month, year })
    .populate("category", "name color")
    .lean();
  const valid = budgets.filter((b) => b.category);
  if (!valid.length) return [];

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const spentAgg = await Transaction.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        type: "expense",
        date: { $gte: start, $lte: end },
        category: { $in: valid.map((b) => b.category._id) },
      },
    },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
  ]);
  const spentMap = new Map(spentAgg.map((s) => [String(s._id), s.total]));

  return valid.map((b) => {
    const spent = spentMap.get(String(b.category._id)) || 0;
    return {
      _id: b._id,
      category: b.category,
      limit: b.limit,
      spent,
      percentage: b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0,
      month: b.month,
      year: b.year,
    };
  });
}

exports.getBudgetsWithSpent = getBudgetsWithSpent;

exports.getBudgets = async (req, res) => {
  const now = new Date();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const year = Number(req.query.year) || now.getFullYear();
  res.json(await getBudgetsWithSpent(req.userId, month, year));
};

exports.createBudget = async (req, res) => {
  try {
    const { category, limit, month, year } = req.body;
    if (!category || limit === undefined || !month || !year) {
      return res.status(400).json({ message: "Category, limit, month and year are required." });
    }
    const budget = await Budget.create({ user: req.userId, category, limit, month, year });
    res.status(201).json(budget);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "A budget for this category and month already exists." });
    }
    res.status(500).json({ message: "Could not create budget.", error: err.message });
  }
};

exports.updateBudget = async (req, res) => {
  try {
    const update = {};
    if (req.body.category) update.category = req.body.category;
    if (req.body.limit !== undefined) update.limit = req.body.limit;

    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      update,
      { new: true, runValidators: true }
    );
    if (!budget) return res.status(404).json({ message: "Budget not found." });
    res.json(budget);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "That category already has a budget this month." });
    }
    throw err;
  }
};

exports.deleteBudget = async (req, res) => {
  const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!budget) return res.status(404).json({ message: "Budget not found." });
  res.json({ message: "Budget deleted." });
};
