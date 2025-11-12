/**
 * Stylesheet Deck Controller
 * 
 * Handles HTTP requests for stylesheet/aesthetics to deck conversion
 * CEO Requirement: Separate service for stylesheet/aesthetics processing
 * Created: November 12, 2025
 */

const { generateStylesheetDeck, generateStylesheetDeckFromData } = require("../services/stylesheetDeck");

/**
 * POST /api/stylesheet-deck/generate-from-url
 * Generate Konva deck from website URL (extracts stylesheets & aesthetics)
 * 
 * Request Body:
 * {
 *   "url": "https://example.com"
 * }
 */
async function generateDeckFromUrl(req, res) {
  try {
    const { url } = req.body;

    // Validation
    if (!url) {
      return res.status(400).json({
        success: false,
        error: "URL is required",
        message: "Please provide a 'url' field in the request body"
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (urlError) {
      return res.status(400).json({
        success: false,
        error: "Invalid URL format",
        message: "Please provide a valid URL (e.g., https://example.com)"
      });
    }

    console.log(`\n📥 Received request to generate stylesheet deck from URL: ${url}\n`);

    // Generate deck
    const result = await generateStylesheetDeck(url);

    // Return success response
    return res.status(200).json(result);

  } catch (error) {
    console.error("❌ Controller Error:", error.message);
    
    return res.status(500).json({
      success: false,
      error: "Stylesheet deck generation failed",
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
}

/**
 * POST /api/stylesheet-deck/generate-from-data
 * Generate Konva deck from direct stylesheet/aesthetics data input
 * 
 * Request Body:
 * {
 *   "stylesheets": {
 *     "external": [{ "href": "...", "media": "all" }],
 *     "inline": [{ "content": "..." }]
 *   },
 *   "aesthetics": {
 *     "colors": ["#6c5ce7", "#00b894"],
 *     "fonts": ["Inter", "Roboto"],
 *     "typography": { "baseFontFamily": "Inter" }
 *   }
 * }
 */
async function generateDeckFromData(req, res) {
  try {
    const { stylesheets, aesthetics } = req.body;

    // Validation
    if (!stylesheets && !aesthetics) {
      return res.status(400).json({
        success: false,
        error: "Stylesheets or aesthetics data is required",
        message: "Please provide either 'stylesheets' or 'aesthetics' object in the request body"
      });
    }

    // Validate data structure
    if (stylesheets && typeof stylesheets !== 'object') {
      return res.status(400).json({
        success: false,
        error: "Invalid stylesheets format",
        message: "Stylesheets must be an object with 'external' and/or 'inline' properties"
      });
    }

    if (aesthetics && typeof aesthetics !== 'object') {
      return res.status(400).json({
        success: false,
        error: "Invalid aesthetics format",
        message: "Aesthetics must be an object with properties like 'colors', 'fonts', 'typography'"
      });
    }

    console.log(`\n📥 Received request to generate stylesheet deck from data\n`);

    // Generate deck
    const result = await generateStylesheetDeckFromData({ stylesheets, aesthetics });

    // Return success response
    return res.status(200).json(result);

  } catch (error) {
    console.error("❌ Controller Error:", error.message);
    
    return res.status(500).json({
      success: false,
      error: "Stylesheet deck generation failed",
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
}

/**
 * GET /api/stylesheet-deck/health
 * Health check endpoint
 */
async function healthCheck(req, res) {
  return res.status(200).json({
    success: true,
    service: "Stylesheet Deck Service",
    status: "operational",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
}

module.exports = {
  generateDeckFromUrl,
  generateDeckFromData,
  healthCheck
};
