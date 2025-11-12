/**
 * Stylesheet Deck Routes
 * 
 * API endpoints for stylesheet/aesthetics to deck conversion service
 * CEO Requirement: Separate service for stylesheet/aesthetics processing
 * Created: November 12, 2025
 */

const express = require("express");
const router = express.Router();
const {
  generateDeckFromUrl,
  generateDeckFromData,
  healthCheck
} = require("../controllers/stylesheetDeckController");

/**
 * @route   GET /api/stylesheet-deck/health
 * @desc    Health check for the service
 * @access  Public
 */
router.get("/health", healthCheck);

/**
 * @route   POST /api/stylesheet-deck/generate-from-url
 * @desc    Generate Konva deck from website URL (extracts stylesheets & aesthetics)
 * @access  Public (for testing)
 * @body    { "url": "https://example.com" }
 */
router.post("/generate-from-url", generateDeckFromUrl);

/**
 * @route   POST /api/stylesheet-deck/generate-from-data
 * @desc    Generate Konva deck from direct stylesheet/aesthetics data
 * @access  Public (for testing)
 * @body    { "stylesheets": {...}, "aesthetics": {...} }
 */
router.post("/generate-from-data", generateDeckFromData);

module.exports = router;
