const express = require("express");
const Leave   = require("../models/Leave");
const { protect }   = require("../middleware/auth");
const { adminOnly } = require("../middleware/roleCheck");

const router = express.Router();

// GET /api/leaves
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
      name:   `${req.user.firstName} ${req.user.lastName}`,
      avatar: `${req.user.firstName[0]}${req.user.lastName[0]}`.toUpperCase(),
      status: "Pending",
    });

    // ── Notify admins of new leave request ──
    req.io?.to("admins").emit("leave:applied", {
      _id:    leave._id,
      name:   leave.name,
      avatar: leave.avatar,
      type:   leave.type,
      from:   leave.from,
      to:     leave.to,
      days:   leave.days,
      reason: leave.reason,
      status: "Pending",
    });

    res.status(201).json(leave);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/leaves/:id — admin approves/rejects
router.put("/:id", protect, async (req, res) => {
  try {
    const leave = await Leave.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    // ── Notify the employee who applied ──
    req.io?.to(`user:${leave.employeeId}`).emit("leave:updated", {
      _id:    leave._id,
      status: leave.status,
      type:   leave.type,
      from:   leave.from,
      to:     leave.to,
    });

    // ── Also notify all admins so their leave list refreshes ──
    req.io?.to("admins").emit("leave:updated", {
      _id:    leave._id,
      status: leave.status,
    });

    res.json(leave);
  } catch (err) {
    res.status(400).json({ message: err.message });
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

module.exports = router;