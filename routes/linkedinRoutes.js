const express = require("express");
const multer = require("multer");

// In memory: the PDF is forwarded straight to LinkedIn and never stored.
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});
const router = express.Router();
const linkedinController = require("../controllers/linkedinController");
const auth = require("../middlewares/auth");

/**
 * LinkedIn Integration Routes
 * Handles OAuth authentication and content sharing
 */

// @route   GET /api/linkedin/auth
// @desc    Initiate LinkedIn OAuth flow
// @access  Private
router.get("/auth", auth, linkedinController.initiateAuth);

// @route   GET /api/linkedin/callback
// @desc    Handle LinkedIn OAuth callback
// @access  Public (but requires valid state parameter)
router.get("/callback", linkedinController.handleCallback);

// @route   GET /api/linkedin/status
// @desc    Check LinkedIn connection status
// @access  Private
router.get("/status", auth, linkedinController.getConnectionStatus);

// @route   DELETE /api/linkedin/disconnect
// @desc    Disconnect LinkedIn account
// @access  Private
router.delete("/disconnect", auth, linkedinController.disconnectAccount);

// @route   POST /api/linkedin/share
// @desc    Share presentation slide to LinkedIn
// @access  Private
// @body    { presentationId: string, slideIndex: number, message?: string }
router.post("/share", auth, linkedinController.shareToLinkedIn);

// @route   POST /api/linkedin/share-custom
// @desc    Share custom content to LinkedIn
// @access  Private
// @body    { imageUrl: string, message: string }
router.post("/share-custom", auth, linkedinController.shareCustomContent);

/**
 * Share the whole deck as a swipeable document carousel.
 * multipart/form-data: file (PDF) + message + optional title.
 */
router.post(
  "/share-document",
  auth,
  documentUpload.single("file"),
  linkedinController.shareDeckAsDocument
);

module.exports = router;
