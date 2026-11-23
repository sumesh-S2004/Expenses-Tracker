const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const express = require("express");
require("express-async-errors");
const cors = require("cors");
const compression = require("compression");
const connectDB = require("./config/db");

const categoryRoutes = require("./routes/categoryRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const goalRoutes = require("./routes/goalRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const app = express();

connectDB();

app.use(compression());
//app.use(cors({ origin: process.env.CLIENT_URL || "*" }));

app.use(cors({
  origin(origin, callback) {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://expenses-tracker-w11y.vercel.app",
      "https://expenses-tracker-delta-five.vercel.app",
      process.env.CLIENT_URL
    ].filter(Boolean).map((url) => {
      try {
        return new URL(url).origin;
      } catch {
        return url.replace(/\/+$/, "");
      }
    });

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true
}));


app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/analytics", analyticsRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ message: "Route not found." }));

// Global error handler
app.use((err, req, res, next) => {
  if (err.name === "CastError") return res.status(400).json({ message: "That item could not be found." });
  if (err.name === "ValidationError") return res.status(400).json({ message: err.message });
  if (err.code === 11000) return res.status(409).json({ message: "That already exists." });
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || "Something went wrong." });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`WealthFlow API running on port ${PORT}`);
});