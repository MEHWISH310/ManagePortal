const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  done:     { type: Boolean, default: false },
  priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
  tag:      { type: String, default: "HR" },
  due:      { type: String, default: "" },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);