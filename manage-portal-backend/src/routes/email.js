const express            = require("express");
const { protect }        = require("../middleware/auth");
const { adminOnly }      = require("../middleware/roleCheck");
const { sendCustomEmail } = require("../services/emailService");

const router = express.Router();

// POST /api/email/send — admin sends email to employee
router.post("/send", protect, adminOnly, async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    if (!to || !subject || !message) {
      return res.status(400).json({ message: "to, subject and message are required" });
    }
    const fromName = `${req.user.firstName} ${req.user.lastName}`;
    await sendCustomEmail(to, subject, message, fromName);
    res.json({ message: "Email sent successfully" });
  } catch (err) {
    console.error("Send email error:", err);
    res.status(500).json({ message: "Failed to send email." });
  }
});

module.exports = router;