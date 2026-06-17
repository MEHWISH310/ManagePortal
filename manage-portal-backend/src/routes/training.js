const express  = require("express");
const Training = require("../models/Training");
const Payment  = require("../models/Payment");
const { protect }   = require("../middleware/auth");
const { adminOnly } = require("../middleware/roleCheck");

const router = express.Router();

// GET /api/training — all trainings
router.get("/", protect, async (req, res) => {
  try {
    const trainings = await Training.find().sort({ createdAt: -1 });
    res.json(trainings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/training — admin creates training
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const training = await Training.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(training);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/training/:id — admin deletes
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await Training.findByIdAndDelete(req.params.id);
    res.json({ message: "Training deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/training/:id — admin edits
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const training = await Training.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!training) return res.status(404).json({ message: "Training not found" });
    res.json(training);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;