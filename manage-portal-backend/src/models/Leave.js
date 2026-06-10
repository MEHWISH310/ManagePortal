const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name:       { type: String },
  type:       { type: String, enum: ["Casual", "Medical", "Earned"], required: true },
  from:       { type: String, required: true },
  to:         { type: String, required: true },
  days:       { type: Number, required: true },
  reason:     { type: String, default: "" },
  status:     { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
}, { timestamps: true });

module.exports = mongoose.model("Leave", leaveSchema);