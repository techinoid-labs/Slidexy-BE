/**
 * =============================================================================
 * WEBSITE GENERATOR ROUTES
 * =============================================================================
 * 
 * Purpose: API endpoints for website generation service
 * 
 * Routes:
 * - POST /api/website-generator/generate    - Generate website from URL
 * - GET  /api/website-generator/health      - Health check
 * - GET  /api/website-generator/list        - List all generated websites
 * 
 * CEO Requirement: Generate modern HTML websites from URLs
 * 
 * Created: 2025-11-17
 * =============================================================================
 */

const express = require("express");
const router = express.Router();

const {
  healthCheck,
  generateWebsite,
  listGeneratedWebsites,
  getWebsiteById,
} = require("../controllers/websiteGeneratorController");

/**
 * @route   GET /api/website-generator/health
 * @desc    Check if website generator service is operational
 * @access  Public
 * @returns {object} Service status and statistics
 */
router.get("/health", healthCheck);

/**
 * @route   POST /api/website-generator/generate
 * @desc    Generate a modern HTML website from a given URL
 * @access  Public (can add auth middleware if needed)
 * @body    { url: "https://example.com" }
 * @returns {object} Generated website details, file path, and presentation data
 * 
 * @example
 * POST /api/website-generator/generate
 * {
 *   "url": "https://www.bbc.com"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Website generated successfully",
 *   "website": {
 *     "filename": "bbc-1737104567890-a3b2c1.html",
 *     "filePath": "C:\\path\\to\\website-codes\\bbc-1737104567890-a3b2c1.html",
 *     "url": "/website-codes/bbc-1737104567890-a3b2c1.html",
 *     "sizeKB": "42.34"
 *   },
 *   "presentation": { ... },
 *   "sourceUrl": "https://www.bbc.com",
 *   "generatedAt": "2025-11-17T10:30:00.000Z"
 * }
 */
router.post("/generate", generateWebsite);

/**
 * @route   GET /api/website-generator/list
 * @desc    List all generated websites with metadata
 * @access  Public
 * @returns {object} Array of generated websites with details
 * 
 * @example
 * GET /api/website-generator/list
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Found 5 generated website(s)",
 *   "websites": [
 *     {
 *       "filename": "bbc-1737104567890-a3b2c1.html",
 *       "topic": "BBC News",
 *       "sourceUrl": "https://www.bbc.com",
 *       "sizeKB": "42.34",
 *       "generatedAt": "2025-11-17T10:30:00.000Z",
 *       "previewUrl": "/website-codes/bbc-1737104567890-a3b2c1.html",
 *       "filePath": "C:\\path\\to\\website-codes\\bbc-1737104567890-a3b2c1.html"
 *     }
 *   ],
 *   "count": 5,
 *   "directory": "C:\\path\\to\\website-codes"
 * }
 */
router.get("/list", listGeneratedWebsites);

router.get("/website/:id", getWebsiteById);

module.exports = router;
