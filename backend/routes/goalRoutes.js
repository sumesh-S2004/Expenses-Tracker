const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getGoals, createGoal, updateGoal, contribute, deleteGoal,
} = require("../controllers/goalController");

router.use(auth);
router.get("/", getGoals);
router.post("/", createGoal);
router.put("/:id", updateGoal);
router.post("/:id/contribute", contribute);
router.delete("/:id", deleteGoal);

module.exports = router;
