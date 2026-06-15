const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  trainingId:      { type: mongoose.Schema.Types.ObjectId, ref: "Training", required: true },
  razorpayOrderId: { type: String, required: true },
  razorpayPaymentId: { type: String, default: "" },
  amount:          { type: Number, required: true },
  status:          { type: String, enum: ["created", "paid", "failed"], default: "created" },
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);