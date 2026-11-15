const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["income", "expense"], default: "expense" },
    color: { type: String, default: "#7C6FF0" },
    icon: { type: String, default: "tag" },
  },
  { timestamps: true }
);

CategorySchema.index({ user: 1, name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("Category", CategorySchema);
