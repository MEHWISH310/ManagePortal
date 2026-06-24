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

// DELETE /api/training/:id — admin deletes (only if training is upcoming)
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) return res.status(404).json({ message: "Training not found" });

    const today = new Date().toISOString().slice(0, 10);
    if (training.date < today) {
      return res.status(403).json({ message: "Cannot delete a past training." });
    }

    await Training.findByIdAndDelete(req.params.id);
    res.json({ message: "Training deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/training/:id — admin edits (only if training is upcoming)
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) return res.status(404).json({ message: "Training not found" });

    const today = new Date().toISOString().slice(0, 10);
    if (training.date < today) {
      return res.status(403).json({ message: "Cannot edit a past training." });
    }

    const updated = await Training.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;