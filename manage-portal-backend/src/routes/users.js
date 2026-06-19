const express = require("express");
const User    = require("../models/User");
const { protect }             = require("../middleware/auth");
const { adminOnly, selfOrAdmin } = require("../middleware/roleCheck");

const router = express.Router();

// GET /api/users
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id
router.get("/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users — admin only
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { firstName, lastName, email, password, ...rest } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const user = await User.create({
      firstName, lastName, email,
      password: password || "Employee@123",
      ...rest,
    });

    const userObj = user.toObject();
    delete userObj.password;

    // ── Emit real-time event to all admins ──
    req.io?.to("admins").emit("employee:added", {
      id:       user._id,
      name:     `${user.firstName} ${user.lastName}`,
      email:    user.email,
      dept:     user.dept,
      role:     user.role,
      status:   user.status,
      salary:   user.salary,
      jobTitle: user.jobTitle,
      avatar:   `${user.firstName[0]}${user.lastName[0]}`.toUpperCase(),
    });

    res.status(201).json(userObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:id
router.put("/:id", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    const { password, ...rest } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, rest, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // ── Emit real-time update ──
    req.io?.to("admins").emit("employee:updated", {
      id:       user._id,
      name:     `${user.firstName} ${user.lastName}`,
      email:    user.email,
      dept:     user.dept,
      role:     user.role,
      status:   user.status,
      salary:   user.salary,
      jobTitle: user.jobTitle,
      avatar:   `${user.firstName[0]}${user.lastName[0]}`.toUpperCase(),
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/:id
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ── Emit real-time delete ──
    req.io?.to("admins").emit("employee:deleted", { id: req.params.id });

    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;