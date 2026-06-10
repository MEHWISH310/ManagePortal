const express = require("express");
const Leave   = require("../models/Leave");
const { protect }   = require("../middleware/auth");
const { adminOnly } = require("../middleware/roleCheck");

const router = express.Router();

// GET /api/leaves — admin gets all, employee gets own
router.get("/", protect, async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { employeeId: req.user._id };
    const leaves = await Leave.find(filter)
      .populate("employeeId", "firstName lastName email")
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/leaves — employee applies
router.post("/", protect, async (req, res) => {
  try {
    const leave = await Leave.create({
      ...req.body,
      employeeId: req.user._id,
      name: `${req.user.firstName} ${req.user.lastName}`,
    });
    res.status(201).json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/leaves/:id — admin approves/rejects
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const leave = await Leave.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!leave) return res.status(404).json({ message: "Leave not found" });
    res.json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/leaves/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    await Leave.findByIdAndDelete(req.params.id);
    res.json({ message: "Leave deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", protect, async (req, res) => {
  try {
    console.log("User ID:", req.user._id);
    console.log("User role:", req.user.role);
    const filter = req.user.role === "admin" ? {} : { employeeId: req.user._id };
    console.log("Filter:", filter);
    const leaves = await Leave.find(filter)
      .populate("employeeId", "firstName lastName email")
      .sort({ createdAt: -1 });
    console.log("Leaves found:", leaves.length);
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;