const express = require("express");
const router = express.Router();
const redditController = require("../controllers/redditController");
const auth = require("../middlewares/auth");

/**
 * Reddit Integration Routes
 * Handles OAuth authentication and content sharing to Reddit
 */

// @route   GET /api/reddit/auth
// @desc    Initiate Reddit OAuth flow
// @access  Private
router.get("/auth", auth, redditController.initiateAuth);

// @route   GET /api/reddit/callback
// @desc    Handle Reddit OAuth callback
// @access  Public (but requires valid state parameter)
router.get("/callback", redditController.handleCallback);

// @route   GET /api/reddit/status
// @desc    Check Reddit connection status
// @access  Private
router.get("/status", auth, redditController.getConnectionStatus);

// @route   DELETE /api/reddit/disconnect
// @desc    Disconnect Reddit account
// @access  Private
router.delete("/disconnect", auth, redditController.disconnectReddit);

// @route   POST /api/reddit/share
// @desc    Share presentation slide to Reddit
// @access  Private
// @body    { presentationId: string, slideIndex: number, subreddit: string, title: string }
router.post("/share", auth, redditController.shareToReddit);

// @route   POST /api/reddit/share-text
// @desc    Share text post to Reddit
// @access  Private
// @body    { subreddit: string, title: string, text: string }
router.post("/share-text", auth, redditController.shareTextPost);

// @route   POST /api/reddit/share-gallery
// @desc    Share multiple slides as gallery to Reddit
// @access  Private
// @body    { presentationId: string, slideIndices: array, subreddit: string, title: string }
router.post("/share-gallery", auth, redditController.shareGalleryPost);

// @route   GET /api/reddit/subreddit/:name
// @desc    Get subreddit information
// @access  Private
router.get("/subreddit/:name", auth, redditController.getSubredditInfo);

module.exports = router;
