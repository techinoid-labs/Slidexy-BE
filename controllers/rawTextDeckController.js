/**
 * Raw Text Deck Controller
 * 
 * Handles HTTP requests for raw text to deck conversion
 * CEO Requirement: Separate service for raw text processing
 * Created: November 12, 2025
 */

const { generateRawTextDeck, generateRawTextDeckFromText } = require("../services/rawTextDeck");

/**
 * POST /api/raw-text-deck/generate-from-url
 * Generate Konva deck from website URL
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

    console.log(`\n📥 Received request to generate deck from URL: ${url}\n`);

    // Generate deck
    const result = await generateRawTextDeck(url);

    // Return success response
    return res.status(200).json(result);

  } catch (error) {
    console.error("❌ Controller Error:", error.message);
    
    return res.status(500).json({
      success: false,
      error: "Deck generation failed",
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
}

/**
 * POST /api/raw-text-deck/generate-from-text
 * Generate Konva deck from direct text input
 * 
 * Request Body:
 * {
 *   "text": "Your raw text content here..."
 * }
 */
async function generateDeckFromText(req, res) {
  try {
    const { text } = req.body;

    // Validation
    if (!text) {
      return res.status(400).json({
        success: false,
        error: "Text is required",
        message: "Please provide a 'text' field in the request body"
      });
    }

    if (typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid text input",
        message: "Text must be a non-empty string"
      });
    }

    console.log(`\n📥 Received request to generate deck from text (${text.length} chars)\n`);

    // Generate deck
    const result = await generateRawTextDeckFromText(text);

    // Return success response
    return res.status(200).json(result);

  } catch (error) {
    console.error("❌ Controller Error:", error.message);
    
    return res.status(500).json({
      success: false,
      error: "Deck generation failed",
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
}

/**
 * GET /api/raw-text-deck/health
 * Health check endpoint
 */
async function healthCheck(req, res) {
  return res.status(200).json({
    success: true,
    service: "Raw Text Deck Service",
    status: "operational",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
}

module.exports = {
  generateDeckFromUrl,
  generateDeckFromText,
  healthCheck
};
