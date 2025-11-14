/**
 * =============================================================================
 * UNIFIED WEB DECK ROUTES
 * =============================================================================
 * 
 * Purpose: Express routes for the unified web deck service
 * 
 * Endpoints:
 * - GET  /api/unified-web-deck/health
 * - POST /api/unified-web-deck/generate-from-url
 * - POST /api/unified-web-deck/save-to-db
 * 
 * CEO Requirement: Final route that orchestrates all 3 services
 * 
 * Created: 2025-11-14
 * =============================================================================
 */

const express = require("express");
const router = express.Router();
const {
  healthCheck,
  generateFromUrl,
  generateAndSave,
} = require("../controllers/unifiedWebDeckController");

/**
 * @route   GET /api/unified-web-deck/health
 * @desc    Health check for unified web deck service
 * @access  Public
 */
router.get("/health", healthCheck);

/**
 * @route   POST /api/unified-web-deck/generate-from-url
 * @desc    Generate unified presentation from URL (calls all 3 services)
 * @access  Public
 * @body    { url: string }
 * @returns { success: boolean, presentation: Object, metadata: Object }
 */
router.post("/generate-from-url", generateFromUrl);

/**
 * @route   POST /api/unified-web-deck/save-to-db
 * @desc    Generate unified presentation and save to MongoDB
 * @access  Public
 * @body    { url: string, userId?: string }
 * @returns { success: boolean, presentation: Object (with _id) }
 */
router.post("/save-to-db", generateAndSave);

module.exports = router;
