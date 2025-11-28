const express = require("express");
const router = express.Router();
const aiChatController = require("../controllers/aiChatController");

// POST /api/chat
router.post("/", aiChatController.chat);
router.get("/history/:email", aiChatController.getChatHistory);
router.post("/validator/topic", aiChatController.validateTopic);

module.exports = router;
