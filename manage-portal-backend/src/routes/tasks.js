const express = require("express");
const Task    = require("../models/Task");
const { protect } = require("../middleware/auth");

const router = express.Router();

// GET /api/tasks
router.get("/", protect, async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { userId: req.user._id };
    const tasks  = await Task.find(filter).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks
router.post("/", protect, async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, userId: req.user._id });

    // ── Notify the user's personal room ──
    req.io?.to(`user:${req.user._id}`).emit("task:added", {
      id:        task._id,
      title:     task.title,
      completed: task.completed,
      priority:  task.priority,
      dueDate:   task.dueDate,
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/tasks/:id
router.put("/:id", protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (req.user.role !== "admin" && task.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });

    req.io?.to(`user:${task.userId}`).emit("task:updated", {
      id:        updated._id,
      completed: updated.completed,
      title:     updated.title,
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (req.user.role !== "admin" && task.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    await Task.findByIdAndDelete(req.params.id);

    req.io?.to(`user:${task.userId}`).emit("task:deleted", { id: req.params.id });

    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;