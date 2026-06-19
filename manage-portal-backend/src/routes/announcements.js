const express      = require("express");
const Announcement = require("../models/Announcement");
const { protect }   = require("../middleware/auth");
const { adminOnly } = require("../middleware/roleCheck");

const router = express.Router();

// GET /api/announcements
router.get("/", protect, async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/announcements — admin only
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const ann = await Announcement.create({ ...req.body, createdBy: req.user._id });

    const payload = {
      id:    ann._id,
      title: ann.title,
      body:  ann.body  || "",
      tags:  ann.tags  || [],
      date:  new Date(ann.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    };

    // ── Broadcast to ALL connected clients (admins + employees) ──
    req.io?.emit("announcement:new", payload);

    res.status(201).json(ann);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/announcements/:id
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    req.io?.emit("announcement:deleted", { id: req.params.id });
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;