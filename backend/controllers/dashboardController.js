const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const Goal = require("../models/Goal");
const { getBudgetsWithSpent } = require("./budgetController");

const oid = (id) => new mongoose.Types.ObjectId(id);
const DAY = 86400000;

function endOfDay(s) {
  const d = new Date(s);
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(s))) d.setUTCHours(23, 59, 59, 999);
  return d;
}

// Dates are stored at UTC midnight, so ranges use UTC boundaries too.
function getRange(query) {
  const now = new Date();
  const start = query.startDate
    ? new Date(query.startDate)
    : new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const end = query.endDate
    ? endOfDay(query.endDate)
    : new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));
  return { start, end };
}

function prevPeriod(start, end) {
  const durationMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);
  return { prevStart, prevEnd };
}

// null = nothing to compare against (previous period was 0)
function pctChange(current, previous) {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}

async function totalsFor(userId, from, to) {
  const agg = await Transaction.aggregate([
    { $match: { user: oid(userId), date: { $gte: from, $lte: to } } },
    { $group: { _id: "$type", total: { $sum: "$amount" } } },
  ]);
  const income = agg.find((a) => a._id === "income")?.total || 0;
  const expenses = agg.find((a) => a._id === "expense")?.total || 0;
  return { income, expenses, balance: income - expenses };
}

function buildSummary(current, previous, start, end) {
  const rate = (t) =>
    t.income > 0 ? Math.round(((t.income - t.expenses) / t.income) * 1000) / 10 : 0;
  const savingsRate = rate(current);
  return {
    totalBalance: current.balance,
    totalIncome: current.income,
    totalExpenses: current.expenses,
    savingsRate,
    changes: {
      balance: pctChange(current.balance, previous.balance),
      income: pctChange(current.income, previous.income),
      expenses: pctChange(current.expenses, previous.expenses),
      savingsRate: pctChange(savingsRate, rate(previous)),
    },
    range: { start, end },
  };
}

async function byCategory(userId, type, from, to) {
  const results = await Transaction.aggregate([
    { $match: { user: oid(userId), type, date: { $gte: from, $lte: to } } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
    { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
    { $unwind: "$category" },
    { $sort: { total: -1 } },
    {
      $project: {
        _id: 0,
        categoryId: "$category._id",
        name: "$category.name",
        color: "$category.color",
        total: 1,
      },
    },
  ]);
  const grandTotal = results.reduce((s, r) => s + r.total, 0);
  const categories = results.map((r) => ({
    ...r,
    percentage: grandTotal > 0 ? Math.round((r.total / grandTotal) * 1000) / 10 : 0,
  }));
  return { total: grandTotal, categories };
}

// Cumulative spending for EVERY day in the range (so the chart is a real line, not one dot).
async function dailyTrend(userId, from, to) {
  const rows = await Transaction.aggregate([
    { $match: { user: oid(userId), type: "expense", date: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        total: { $sum: "$amount" },
      },
    },
  ]);
  if (!rows.length) return [];

  const map = new Map(rows.map((r) => [r._id, r.total]));
  const maxSpend = Math.max(...rows.map((r) => new Date(r._id).getTime()));
  const last = Math.min(to.getTime(), Math.max(Date.now(), maxSpend));
  const first = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());

  let running = 0;
  const out = [];
  for (let t = first; t <= last && out.length < 400; t += DAY) {
    const key = new Date(t).toISOString().slice(0, 10);
    running += map.get(key) || 0;
    out.push({ date: key, amount: running });
  }
  return out;
}

// ---- One request for the whole dashboard (much faster than 5 separate calls) ----
exports.getOverview = async (req, res) => {
  const { start, end } = getRange(req.query);
  const { prevStart, prevEnd } = prevPeriod(start, end);

  const [current, previous, expenseByCategory, incomeByCategory, trend, recent, budgets, goalsRaw] =
    await Promise.all([
      totalsFor(req.userId, start, end),
      totalsFor(req.userId, prevStart, prevEnd),
      byCategory(req.userId, "expense", start, end),
      byCategory(req.userId, "income", start, end),
      dailyTrend(req.userId, start, end),
      Transaction.find({ user: req.userId })
        .populate("category", "name color type")
        .sort({ date: -1, createdAt: -1 })
        .limit(5)
        .lean(),
      getBudgetsWithSpent(req.userId, start.getUTCMonth() + 1, start.getUTCFullYear()),
      Goal.find({ user: req.userId }).sort({ createdAt: -1 }).limit(20).lean(),
    ]);

  // active goals first, then completed ones; show at most 4
  const goals = goalsRaw.sort((a, b) => (a.status === "completed") - (b.status === "completed")).slice(0, 4);

  res.json({
    summary: buildSummary(current, previous, start, end),
    expenseByCategory,
    incomeByCategory,
    trend,
    recent,
    budgets,
    goals,
  });
};

// ---- Individual endpoints (still available) ----
exports.getSummary = async (req, res) => {
  const { start, end } = getRange(req.query);
  const { prevStart, prevEnd } = prevPeriod(start, end);
  const [current, previous] = await Promise.all([
    totalsFor(req.userId, start, end),
    totalsFor(req.userId, prevStart, prevEnd),
  ]);
  res.json(buildSummary(current, previous, start, end));
};

exports.getExpensesByCategory = async (req, res) => {
  const { start, end } = getRange(req.query);
  res.json(await byCategory(req.userId, req.query.type || "expense", start, end));
};

exports.getSpendingTrend = async (req, res) => {
  const { start, end } = getRange(req.query);
  res.json(await dailyTrend(req.userId, start, end));
};

exports.getCalendarMonth = async (req, res) => {
  const now = new Date();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const year = Number(req.query.year) || now.getFullYear();
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const results = await Transaction.aggregate([
    { $match: { user: oid(req.userId), date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
        expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
        count: { $sum: 1 },
      },
    },
    { $project: { _id: 0, date: "$_id", income: 1, expense: 1, count: 1 } },
  ]);

  res.json(results);
};
