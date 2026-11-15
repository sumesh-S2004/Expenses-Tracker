const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getMonthlyTrend, getCategoryReport } = require("../controllers/analyticsController");

router.use(auth);
router.get("/monthly-trend", getMonthlyTrend);
router.get("/category-report", getCategoryReport);

module.exports = router;
