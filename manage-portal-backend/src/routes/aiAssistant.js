const express = require("express");
const router  = express.Router();
const { handleAiQuery } = require("../controllers/aiAssistantController");
const { protect } = require("../middleware/auth");

router.post("/", protect, handleAiQuery);

module.exports = router;