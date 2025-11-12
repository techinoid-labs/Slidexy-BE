/**
 * Raw Text Deck Routes
 * 
 * API endpoints for raw text to deck conversion service
 * CEO Requirement: Separate service for raw text processing
 * Created: November 12, 2025
 */

const express = require("express");
const router = express.Router();
const {
  generateDeckFromUrl,
  generateDeckFromText,
  healthCheck
} = require("../controllers/rawTextDeckController");

/**
 * @route   GET /api/raw-text-deck/health
 * @desc    Health check for the service
 * @access  Public
 */
router.get("/health", healthCheck);

/**
 * @route   POST /api/raw-text-deck/generate-from-url
 * @desc    Generate Konva deck from website URL
 * @access  Public (for testing)
 * @body    { "url": "https://example.com" }
 */
router.post("/generate-from-url", generateDeckFromUrl);

/**
 * @route   POST /api/raw-text-deck/generate-from-text
 * @desc    Generate Konva deck from direct text input
 * @access  Public (for testing)
 * @body    { "text": "Your raw text content..." }
 */
router.post("/generate-from-text", generateDeckFromText);

module.exports = router;
