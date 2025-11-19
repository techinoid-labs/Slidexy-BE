/**
 * Image Deck Controller
 * 
 * Handles HTTP requests for image to deck conversion
 * CEO Requirement: Separate service for image processing
 * Created: November 12, 2025
 */

const { generateImageDeck, generateImageDeckFromData } = require("../services/imageDeck");

/**
 * POST /api/image-deck/generate-from-url
 * Generate Konva deck from website URL (extracts images)
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

    console.log(`\n📥 Received request to generate image deck from URL: ${url}\n`);

    // Generate deck
    const result = await generateImageDeck(url);

    // Return success response
    return res.status(200).json(result);

  } catch (error) {
    console.error("❌ Controller Error:", error.message);
    
    return res.status(500).json({
      success: false,
      error: "Image deck generation failed",
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
}

/**
 * POST /api/image-deck/generate-from-data
 * Generate Konva deck from direct image data input
 * 
 * Request Body:
 * {
 *   "images": [
 *     { "src": "https://...", "alt": "...", "width": 800, "height": 600 },
 *     { "src": "https://...", "alt": "..." }
 *   ]
 * }
 */
async function generateDeckFromData(req, res) {
  try {
    const { images } = req.body;

    // Validation
    if (!images) {
      return res.status(400).json({
        success: false,
        error: "Images are required",
        message: "Please provide an 'images' array in the request body"
      });
    }

    if (!Array.isArray(images)) {
      return res.status(400).json({
        success: false,
        error: "Invalid images format",
        message: "Images must be an array of image objects"
      });
    }

    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Empty images array",
        message: "Please provide at least one image in the array"
      });
    }

    console.log(`\n📥 Received request to generate image deck from data (${images.length} images)\n`);

    // Generate deck
    const result = await generateImageDeckFromData(images);

    // Return success response
    return res.status(200).json(result);

  } catch (error) {
    console.error("❌ Controller Error:", error.message);
    
    return res.status(500).json({
      success: false,
      error: "Image deck generation failed",
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
}

/**
 * GET /api/image-deck/health
 * Health check endpoint
 */
async function healthCheck(req, res) {
  return res.status(200).json({
    success: true,
    service: "Image Deck Service",
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
