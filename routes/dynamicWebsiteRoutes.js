/**
 * =============================================================================
 * DYNAMIC WEBSITE GENERATOR ROUTES
 * =============================================================================
 * 
 * Purpose: API routes for dynamic website generation
 * 
 * Endpoint:
 * - POST /api/dynamic-website/generate - Generate dynamic website
 * 
 * Created: 2025-11-20
 * =============================================================================
 */

const express = require("express");
const router = express.Router();
const { generateDynamic } = require("../controllers/dynamicWebsiteController");

/**
 * @route   POST /api/dynamic-website/generate
 * @desc    Generate dynamic, structure-aware website from URL
 * @access  Public
 */
router.post("/generate", generateDynamic);

module.exports = router;
