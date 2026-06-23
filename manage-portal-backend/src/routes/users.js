const express = require("express");
const User    = require("../models/User");
const { protect }             = require("../middleware/auth");
const { adminOnly, selfOrAdmin } = require("../middleware/roleCheck");

const router = express.Router();

// GET /api/users — active employees
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ deleted: { $ne: true } }).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/deleted — MUST be before /:id
router.get("/deleted", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ deleted: true }).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ NEW: GET /api/users/search?q=xyz&limit=10
// Search by name, email, phone, username (employee code)
// MUST be before /:id route
// GET /api/users/search?q=xyz&limit=10
router.get("/search", protect, adminOnly, async (req, res) => {
  try {
    const q     = (req.query.q || "").trim();
    const limit = Math.min(parseInt(req.query.limit) || 10, 20);

    if (!q) return res.json([]);

    const regex = new RegExp(q, "i");

    const users = await User.find({
      deleted: { $ne: true },
      // ✅ removed: role: { $ne: "admin" }  — ab sab aayenge including admins
      $or: [
        { firstName: regex },
        { lastName:  regex },
        { email:     regex },
        { phone:     regex },
        { username:  regex },
      ],
    })
      .select("_id firstName lastName email phone username dept role") // ✅ role bhi add kiya
      .limit(limit)
      .lean();

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

// DELETE /api/users/:id — soft delete
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { deleted: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    req.io?.to("admins").emit("employee:deleted", { id: req.params.id });
    res.json({ message: "User soft-deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;