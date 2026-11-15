const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getOverview,
  getSummary,
  getExpensesByCategory,
  getSpendingTrend,
  getCalendarMonth,
} = require("../controllers/dashboardController");

router.use(auth);
router.get("/overview", getOverview);
router.get("/summary", getSummary);
router.get("/expenses-by-category", getExpensesByCategory);
router.get("/spending-trend", getSpendingTrend);
router.get("/calendar", getCalendarMonth);

module.exports = router;
