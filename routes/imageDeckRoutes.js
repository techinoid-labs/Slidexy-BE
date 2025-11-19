/**
 * Image Deck Routes
 * 
 * API endpoints for image to deck conversion service
 * CEO Requirement: Separate service for image processing
 * Created: November 12, 2025
 */

const express = require("express");
const router = express.Router();
const {
  generateDeckFromUrl,
  generateDeckFromData,
  healthCheck
} = require("../controllers/imageDeckController");

/**
 * @route   GET /api/image-deck/health
 * @desc    Health check for the service
 * @access  Public
 */
router.get("/health", healthCheck);

/**
 * @route   POST /api/image-deck/generate-from-url
 * @desc    Generate Konva deck from website URL (extracts images)
 * @access  Public (for testing)
 * @body    { "url": "https://example.com" }
 */
router.post("/generate-from-url", generateDeckFromUrl);

/**
 * @route   POST /api/image-deck/generate-from-data
 * @desc    Generate Konva deck from direct image data array
 * @access  Public (for testing)
 * @body    { "images": [{ "src": "...", "alt": "..." }] }
 */
router.post("/generate-from-data", generateDeckFromData);

module.exports = router;
