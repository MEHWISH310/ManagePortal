const express       = require("express");
const Announcement  = require("../models/Announcement");
const { protect }   = require("../middleware/auth");
const { adminOnly } = require("../middleware/roleCheck");

const router = express.Router();

// GET /api/announcements — everyone
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
    const ann = await Announcement.create({
      ...req.body,
      createdBy: req.user._id,
    });
    res.status(201).json(ann);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/announcements/:id — admin only
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;