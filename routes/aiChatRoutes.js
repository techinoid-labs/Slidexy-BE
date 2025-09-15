const express = require("express");
const router = express.Router();
const aiChatController = require("../controllers/aiChatController");

// POST /api/chat
router.post("/", aiChatController.chat);

module.exports = router;
