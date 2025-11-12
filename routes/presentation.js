const express = require("express");
const router = express.Router();
const { exportPresentationHandler, getPresentationHandler, webToDeckHandler } = require("../controllers/presentationController");
const auth = require("../middlewares/auth");

/**
 * Web to Deck - Generate presentation from website URL
 * 
 * POST /api/presentation/web-to-deck
 * 
 * Request Body:
 * {
 *   "url": "https://example.com",              // Required: Website URL to convert
 *   "presentationType": "presentation",         // Optional: "presentation" or "proposal" (default: "presentation")
 *   "slideCount": 5,                           // Optional: 3, 5, 7, or 10 (default: 5)
 *   "meta": {                                  // Optional: Additional metadata
 *     "goal": "Inform stakeholders",
 *     "tone": "Professional",
 *     "audience": "Business executives"
 *   }
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "_id": "...",
 *   "presentation_id": "uuid",
 *   "topic": "Website Title",
 *   "slides": [...],
 *   "meta": {
 *     "sourceUrl": "https://example.com",
 *     "websiteType": "portfolio",
 *     "aesthetics": { colors, fonts, primaryColor, backgroundColor },
 *     ...
 *   },
 *   "websiteImages": [...],
 *   "createdAt": "..."
 * }
 * 
 * Features:
 * - Extracts website content, images, and aesthetics using Puppeteer
 * - Analyzes color schemes, fonts, and brand identity
 * - Generates presentation structure using Gemini 2.5 Flash
 * - Matches website's visual identity in slides
 * - References actual images from the website
 * - Creates professional presentation or proposal format
 */
router.post("/web-to-deck", auth, webToDeckHandler);

// Protected export route
router.get("/:presentation_id/export", auth, exportPresentationHandler);

router.get("/:presentation_id", getPresentationHandler);

module.exports = router;
