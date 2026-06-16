const express  = require("express");
const Razorpay = require("razorpay");
const crypto   = require("crypto");
const Payment  = require("../models/Payment");
const Training = require("../models/Training");
const { protect }   = require("../middleware/auth");
const { adminOnly } = require("../middleware/roleCheck");

const router = express.Router();

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payment/create-order
router.post("/create-order", protect, async (req, res) => {
  try {
    const { trainingId } = req.body;
    const training = await Training.findById(trainingId);
    if (!training) return res.status(404).json({ message: "Training not found" });

    const order = await razorpay.orders.create({
      amount:   training.price * 100,
      currency: "INR",
      receipt:  `receipt_${Date.now()}`,
    });

    await Payment.create({
      userId:          req.user._id,
      trainingId:      training._id,
      razorpayOrderId: order.id,
      amount:          training.price,
      status:          "created",
    });

    res.json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      keyId:    process.env.RAZORPAY_KEY_ID,
      training: { title: training.title, price: training.price },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payment/verify
router.post("/verify", protect, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const body     = razorpayOrderId + "|" + razorpayPaymentId;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpaySignature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    await Payment.findOneAndUpdate(
      { razorpayOrderId },
      { razorpayPaymentId, status: "paid" },
      { new: true }
    );

    res.json({ success: true, message: "Payment verified successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payment/my-payments — employee ke apne payments
router.get("/my-payments", protect, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .populate("trainingId", "title date price")
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payment/all-payments — admin only
router.get("/all-payments", protect, adminOnly, async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("userId",     "firstName lastName email dept")
      .populate("trainingId", "title date price duration")
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payment/enrolled/:trainingId — admin sees who enrolled
router.get("/enrolled/:trainingId", protect, adminOnly, async (req, res) => {
  try {
    const payments = await Payment.find({ 
      trainingId: req.params.trainingId, 
      status: "paid" 
    })
      .populate("userId", "firstName lastName email dept jobTitle")
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;