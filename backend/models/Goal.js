const mongoose = require("mongoose");

const GoalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true, min: 0 },
    currentAmount: { type: Number, default: 0, min: 0 },
    deadline: { type: Date },
    color: { type: String, default: "#7C6FF0" },
    status: { type: String, enum: ["active", "completed", "abandoned"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Goal", GoalSchema);
