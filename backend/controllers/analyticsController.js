const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

// Monthly income vs expense for the last N months (default 6)
exports.getMonthlyTrend = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.userId);
  const months = Number(req.query.months) || 6;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const results = await Transaction.aggregate([
    { $match: { user: userId, date: { $gte: start } } },
    {
      $group: {
        _id: { year: { $year: "$date" }, month: { $month: "$date" }, type: "$type" },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const buckets = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ year: d.getFullYear(), month: d.getMonth() + 1, income: 0, expense: 0 });
  }
  results.forEach((r) => {
    const bucket = buckets.find((b) => b.year === r._id.year && b.month === r._id.month);
    if (bucket) bucket[r._id.type] = r.total;
  });

  res.json(
    buckets.map((b) => ({
      label: new Date(b.year, b.month - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      income: b.income,
      expense: b.expense,
      net: b.income - b.expense,
    }))
  );
};

// Category totals for a given date range, for the Reports page
exports.getCategoryReport = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.userId);
  const { startDate, endDate, type } = req.query;
  const now = new Date();
  const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
  let end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  if (endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) end.setUTCHours(23, 59, 59, 999);

  const match = { user: userId, date: { $gte: start, $lte: end } };
  if (type) match.type = type;

  const results = await Transaction.aggregate([
    { $match: match },
    { $group: { _id: { category: "$category", type: "$type" }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    {
      $lookup: {
        from: "categories",
        localField: "_id.category",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    { $sort: { total: -1 } },
    {
      $project: {
        _id: 0, categoryId: "$category._id", name: "$category.name", color: "$category.color",
        type: "$_id.type", total: 1, count: 1,
      },
    },
  ]);

  // Individual transactions (with date) so the report can show / export the day for each row
  const transactions = await Transaction.find(match)
    .populate("category", "name color")
    .sort({ date: 1, createdAt: 1 })
    .limit(5000)
    .lean();

  res.json({ start, end, results, transactions });
};
