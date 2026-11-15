const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto");
const User = require("../models/User");
const Category = require("../models/Category");
const sendEmail = require("../utils/sendEmail");

const PHONE_RE = /^[0-9+\-\s()]{7,15}$/;

const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", type: "expense", color: "#7C6FF0" },
  { name: "Transport", type: "expense", color: "#4C8DF5" },
  { name: "Shopping", type: "expense", color: "#F5A623" },
  { name: "Bills & Utilities", type: "expense", color: "#3FD6C6" },
  { name: "Entertainment", type: "expense", color: "#B06FF0" },
  { name: "Health & Fitness", type: "expense", color: "#F0578E" },
  { name: "Others", type: "expense", color: "#6C7A94" },
  { name: "Income", type: "income", color: "#3FD68A" },
];

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const phone = (req.body.phone || "").trim();

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }
    if (phone && !PHONE_RE.test(phone)) {
      return res.status(400).json({ message: "Enter a valid mobile number (7-15 digits)." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const user = await User.create({ name, email, password, phone });

    await Category.insertMany(DEFAULT_CATEGORIES.map((c) => ({ ...c, user: user._id })));

    const token = signToken(user._id);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: "Could not create account.", error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    const token = signToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: "Could not log in.", error: err.message });
  }
};

exports.googleLogin = async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ message: "Google credential is missing." });
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(500).json({ message: "Google sign-in is not configured on the server (GOOGLE_CLIENT_ID)." });
  }

  let payload;
  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch (err) {
    return res.status(401).json({ message: "Google sign-in failed. Please try again." });
  }
  if (!payload?.email || !payload.email_verified) {
    return res.status(401).json({ message: "Your Google email is not verified." });
  }

  const email = payload.email.toLowerCase();
  let user = await User.findOne({ email });
  if (!user) {
    // New user: random password (they can still use "Forgot password" later to set one).
    user = await User.create({
      name: payload.name || email.split("@")[0],
      email,
      password: crypto.randomBytes(24).toString("hex"),
      googleId: payload.sub,
    });
    await Category.insertMany(DEFAULT_CATEGORIES.map((c) => ({ ...c, user: user._id })));
  } else if (!user.googleId) {
    user.googleId = payload.sub;
    await user.save();
  }

  res.json({ token: signToken(user._id), user: user.toSafeObject() });
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json(user.toSafeObject());
};

exports.updateProfile = async (req, res) => {
  const { name, currency, phone } = req.body;
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found." });

  if (phone !== undefined) {
    const trimmed = String(phone).trim();
    if (trimmed && !PHONE_RE.test(trimmed)) {
      return res.status(400).json({ message: "Enter a valid mobile number (7-15 digits)." });
    }
    user.phone = trimmed;
  }
  if (name) user.name = name;
  if (currency) user.currency = currency;
  await user.save();
  res.json(user.toSafeObject());
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Current and new password are required." });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters." });
  }
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found." });

  const match = await user.comparePassword(currentPassword);
  // 400 (not 401) so the frontend doesn't treat a typo as an expired session.
  if (!match) return res.status(400).json({ message: "Current password is incorrect." });

  user.password = newPassword;
  await user.save();
  res.json({ message: "Password updated." });
};

exports.forgotPassword = async (req, res) => {
  const email = (req.body.email || "").toLowerCase().trim();
  if (!email) return res.status(400).json({ message: "Email is required." });

  const generic = { message: "If an account exists for that email, a reset link has been sent." };

  try {
    const user = await User.findOne({ email });
    if (!user) return res.json(generic);

    const token = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password/${token}`;

    let sent = false;
    try {
      sent = await sendEmail({
        to: user.email,
        subject: "Reset your WealthFlow password",
        text: `Hi ${user.name},\n\nUse this link to reset your password (valid for 15 minutes):\n${resetUrl}\n\nIf you didn't ask for this, you can ignore this email.`,
        html: `<p>Hi ${user.name},</p><p>Use this link to reset your password (valid for 15 minutes):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't ask for this, you can ignore this email.</p>`,
      });
    } catch (err) {
      console.error("Email send failed:", err.message);
    }

    if (!sent) {
      console.log(`\n[WealthFlow] Password reset link for ${email}:\n${resetUrl}\n`);
    }

    const body = { ...generic };
    // Local development convenience: show the link when no email server is set up.
    if (!sent && process.env.NODE_ENV !== "production") body.devResetLink = resetUrl;
    res.json(body);
  } catch (err) {
    res.status(500).json({ message: "Could not process your request. Try again." });
  }
};

exports.resetPassword = async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const hashed = crypto.createHash("sha256").update(req.params.token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    return res.status(400).json({ message: "This reset link is invalid or has expired." });
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({ message: "Password updated. You can now log in." });
};
