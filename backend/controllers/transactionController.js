const Transaction = require("../models/Transaction");

exports.getTransactions = async (req, res) => {
  const { category, type, page = 1, limit = 10, startDate, endDate } = req.query;

  const filter = { user: req.userId };
  if (category) filter.category = category;
  if (type) filter.type = type;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate("category", "name color type")
      .sort({ date: -1, createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Transaction.countDocuments(filter),
  ]);

  res.json({
    transactions,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  });
};

exports.getTransaction = async (req, res) => {
  const txn = await Transaction.findOne({ _id: req.params.id, user: req.userId }).populate(
    "category",
    "name color type"
  );
  if (!txn) return res.status(404).json({ message: "Transaction not found." });
  res.json(txn);
};

exports.createTransaction = async (req, res) => {
  try {
    const { title, category, type, amount, date, paymentMethod, notes } = req.body;
    if (!title || !category || !type || amount === undefined) {
      return res.status(400).json({ message: "Title, category, type and amount are required." });
    }

    const txn = await Transaction.create({
      user: req.userId,
      title,
      category,
      type,
      amount,
      date: date || Date.now(),
      paymentMethod,
      notes,
    });

    const populated = await txn.populate("category", "name color type");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Could not create transaction.", error: err.message });
  }
};

exports.updateTransaction = async (req, res) => {
  const txn = await Transaction.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    req.body,
    { new: true, runValidators: true }
  ).populate("category", "name color type");
  if (!txn) return res.status(404).json({ message: "Transaction not found." });
  res.json(txn);
};

exports.deleteTransaction = async (req, res) => {
  const txn = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!txn) return res.status(404).json({ message: "Transaction not found." });
  res.json({ message: "Transaction deleted." });
};
