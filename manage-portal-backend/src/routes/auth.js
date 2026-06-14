const express           = require("express");
const jwt               = require("jsonwebtoken");
const crypto            = require("crypto");
const User              = require("../models/User");
const { protect }       = require("../middleware/auth");
const { sendOTPEmail }  = require("../services/emailService");

const router = express.Router();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });
    const user = await User.create({ firstName, lastName, email, password, role: role || "employee" });
    res.status(201).json({
      _id: user._id, firstName: user.firstName,
      lastName: user.lastName, email: user.email,
      role: user.role, token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    res.json({
      _id: user._id, firstName: user.firstName,
      lastName: user.lastName, email: user.email,
      role: user.role, image: user.image,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  res.json(req.user);
});

// POST /api/auth/forgot-password — send OTP
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account found with this email." });

    // Generate 6-digit OTP
    const otp    = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetOTP       = otp;
    user.resetOTPExpiry = expiry;
    await user.save();

    await sendOTPEmail(email, otp);
    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Failed to send OTP. Check your email configuration." });
  }
});

// POST /api/auth/verify-otp — verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user)                              return res.status(404).json({ message: "User not found." });
    if (user.resetOTP !== otp)              return res.status(400).json({ message: "Invalid OTP." });
    if (new Date() > user.resetOTPExpiry)   return res.status(400).json({ message: "OTP expired. Request a new one." });
    res.json({ message: "OTP verified" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/reset-password — set new password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user)                            return res.status(404).json({ message: "User not found." });
    if (user.resetOTP !== otp)            return res.status(400).json({ message: "Invalid OTP." });
    if (new Date() > user.resetOTPExpiry) return res.status(400).json({ message: "OTP expired." });

    user.password       = newPassword;
    user.resetOTP       = null;
    user.resetOTPExpiry = null;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;