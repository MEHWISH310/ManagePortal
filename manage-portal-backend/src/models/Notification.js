const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  sub:       { type: String, default: "" },
  type:      { type: String, enum: ["leave", "announce", "payroll", "task", "system"], default: "system" },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // null = all users
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  readBy:    [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);