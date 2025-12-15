const express = require("express");
const router = express.Router();
const telegramController = require("../controllers/telegramController");
const auth = require("../middlewares/auth");

/**
 * Telegram Integration Routes
 * Handles Telegram Bot API integration for content sharing
 */

// @route   POST /api/telegram/connect
// @desc    Connect Telegram account with chat ID
// @access  Private
// @body    { chatId: string|number }
router.post("/connect", auth, telegramController.connectTelegram);

// @route   GET /api/telegram/status
// @desc    Check Telegram connection status
// @access  Private
router.get("/status", auth, telegramController.getConnectionStatus);

// @route   DELETE /api/telegram/disconnect
// @desc    Disconnect Telegram account
// @access  Private
router.delete("/disconnect", auth, telegramController.disconnectTelegram);

// @route   POST /api/telegram/share
// @desc    Share presentation slide to Telegram
// @access  Private
// @body    { presentationId: string, slideIndex: number, message?: string }
router.post("/share", auth, telegramController.shareToTelegram);

// @route   POST /api/telegram/share-custom
// @desc    Share custom content to Telegram
// @access  Private
// @body    { imageUrl: string, message: string }
router.post("/share-custom", auth, telegramController.shareCustomContent);

// @route   POST /api/telegram/send-message
// @desc    Send text message to Telegram
// @access  Private
// @body    { message: string }
router.post("/send-message", auth, telegramController.sendMessage);

// @route   GET /api/telegram/bot-info
// @desc    Get Telegram bot information
// @access  Private
router.get("/bot-info", auth, telegramController.getBotInfo);

module.exports = router;
