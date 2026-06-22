const express       = require("express");
const Notification  = require("../models/Notification");
const { protect }   = require("../middleware/auth");
const { adminOnly } = require("../middleware/roleCheck");

const router = express.Router();

// GET /api/notifications — get my notifications
router.get("/", protect, async (req, res) => {
  try {
    const notifs = await Notification.find({
      $or: [
        { recipient: null },           // broadcast to all
        { recipient: req.user._id },   // targeted to me
      ]
    })
    .sort({ createdAt: -1 })
    .populate("createdBy", "firstName lastName");

    const mapped = notifs.map(n => ({
      _id:    n._id,
      title:  n.title,
      sub:    n.sub,
      type:   n.type,
      unread: !n.readBy.includes(req.user._id.toString()),
      time:   timeAgo(n.createdAt),
      createdBy: n.createdBy ? `${n.createdBy.firstName} ${n.createdBy.lastName}` : "System",
    }));

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/notifications — admin creates notification
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { title, sub, type, recipientId } = req.body;
    const n = await Notification.create({
      title,
      sub:       sub || "",
      type:      type || "system",
      recipient: recipientId || null,
      createdBy: req.user._id,
    });
    res.status(201).json(n);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/bulk", protect, adminOnly, async (req, res) => {
  try {
    const { title, sub, type, recipientIds } = req.body;
    // recipientIds = [] means broadcast (null), else targeted
    if (!recipientIds || recipientIds.length === 0) {
      const n = await Notification.create({
        title, sub: sub || "", type: type || "system",
        recipient: null, createdBy: req.user._id,
      });
      req.io?.emit("notification:new", { title, sub, type });
      return res.status(201).json([n]);
    }
    const created = await Promise.all(
      recipientIds.map(id => Notification.create({
        title, sub: sub || "", type: type || "system",
        recipient: id, createdBy: req.user._id,
      }))
    );
    recipientIds.forEach(id => {
      req.io?.to(`user:${id}`).emit("notification:new", { title, sub, type });
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/notifications/:id/read — mark single as read
router.patch("/:id/read", protect, async (req, res) => {
  try {
    const n = await Notification.findById(req.params.id);
    if (!n) return res.status(404).json({ message: "Not found" });
    if (!n.readBy.includes(req.user._id.toString())) {
      n.readBy.push(req.user._id);
      await n.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/notifications/read-all — mark all as read
router.patch("/read-all", protect, async (req, res) => {
  try {
    const notifs = await Notification.find({
      $or: [{ recipient: null }, { recipient: req.user._id }],
      readBy: { $ne: req.user._id },
    });
    await Promise.all(notifs.map(n => {
      n.readBy.push(req.user._id);
      return n.save();
    }));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/notifications/:id — admin only
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

module.exports = router;