const mongoose = require("mongoose");

const trainingSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: "" },
  date:        { type: String, required: true },
  duration:    { type: String, default: "" },
  price:       { type: Number, required: true },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("Training", trainingSchema);