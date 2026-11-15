const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  register, login, googleLogin, getMe, updateProfile, changePassword, forgotPassword, resetPassword,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/me", auth, getMe);
router.put("/me", auth, updateProfile);
router.put("/change-password", auth, changePassword);

module.exports = router;
