const Goal = require("../models/Goal");

exports.getGoals = async (req, res) => {
  const goals = await Goal.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json(goals);
};

exports.createGoal = async (req, res) => {
  try {
    const { title, targetAmount, currentAmount, deadline, color } = req.body;
    if (!title || targetAmount === undefined) {
      return res.status(400).json({ message: "Title and target amount are required." });
    }
    const goal = await Goal.create({
      user: req.userId, title, targetAmount, currentAmount: currentAmount || 0, deadline, color,
    });
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ message: "Could not create goal.", error: err.message });
  }
};

exports.updateGoal = async (req, res) => {
  const goal = await Goal.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!goal) return res.status(404).json({ message: "Goal not found." });
  res.json(goal);
};

// Add or subtract from currentAmount, e.g. { amount: 500 } or { amount: -200 }
exports.contribute = async (req, res) => {
  const { amount } = req.body;
  if (amount === undefined) return res.status(400).json({ message: "Amount is required." });

  const goal = await Goal.findOne({ _id: req.params.id, user: req.userId });
  if (!goal) return res.status(404).json({ message: "Goal not found." });

  goal.currentAmount = Math.max(0, goal.currentAmount + Number(amount));
  if (goal.currentAmount >= goal.targetAmount) goal.status = "completed";
  await goal.save();
  res.json(goal);
};

exports.deleteGoal = async (req, res) => {
  const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!goal) return res.status(404).json({ message: "Goal not found." });
  res.json({ message: "Goal deleted." });
};
