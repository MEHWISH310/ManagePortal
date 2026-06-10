const express = require("express");
const User    = require("../models/User");
const { protect }   = require("../middleware/auth");
const { adminOnly } = require("../middleware/roleCheck");

const router = express.Router();

// GET /api/payroll — admin gets all, employee gets own
router.get("/", protect, async (req, res) => {
  try {
    const query = req.user.role === "admin" ? {} : { _id: req.user._id };
    const users = await User.find(query).select("-password");
    const data  = users.map(u => ({
      _id:           u._id,
      name:          `${u.firstName} ${u.lastName}`,
      email:         u.email,
      dept:          u.dept,
      jobTitle:      u.jobTitle,
      avatar:        `${u.firstName[0]}${u.lastName[0]}`.toUpperCase(),
      salary:        u.salary,
      status:        u.status,
      payrollStatus: u.payrollStatus || "Pending",
      allow:         Math.round(u.salary * 0.175),
      ded:           Math.round(u.salary * 0.105),
      net:           Math.round(u.salary + (u.salary * 0.175) - (u.salary * 0.105)),
    }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/payroll/:id/status — admin only
router.patch("/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const { payrollStatus } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { payrollStatus },
      { new: true }
    ).select("-password");
    res.json({ payrollStatus: user.payrollStatus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;