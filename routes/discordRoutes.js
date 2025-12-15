const express = require("express");
const router = express.Router();
const discordController = require("../controllers/discordController");
const auth = require("../middlewares/auth");

/**
 * Discord Integration Routes
 * Handles Discord Bot integration for sharing presentations to Discord channels
 */

// @route   GET /api/discord/bot-info
// @desc    Get Discord bot information
// @access  Private
router.get("/bot-info", auth, discordController.getBotInfo);

// @route   POST /api/discord/connect
// @desc    Connect Discord channel
// @access  Private
// @body    { channelId: string }
router.post("/connect", auth, discordController.connectDiscord);

// @route   GET /api/discord/status
// @desc    Check Discord connection status
// @access  Private
router.get("/status", auth, discordController.getConnectionStatus);

// @route   DELETE /api/discord/disconnect
// @desc    Disconnect Discord channel
// @access  Private
router.delete("/disconnect", auth, discordController.disconnectDiscord);

// @route   POST /api/discord/share
// @desc    Share presentation slide to Discord
// @access  Private
// @body    { presentationId: string, slideIndex: number, message?: string }
router.post("/share", auth, discordController.shareToDiscord);

// @route   POST /api/discord/share-custom
// @desc    Share custom content to Discord
// @access  Private
// @body    { imageUrl: string, message: string }
router.post("/share-custom", auth, discordController.shareCustomContent);

// @route   POST /api/discord/send-message
// @desc    Send text message to Discord
// @access  Private
// @body    { message: string }
router.post("/send-message", auth, discordController.sendMessage);

// @route   POST /api/discord/share-multiple
// @desc    Share multiple slides to Discord
// @access  Private
// @body    { presentationId: string, slideIndices: array, message?: string }
router.post("/share-multiple", auth, discordController.shareMultipleSlides);

module.exports = router;
