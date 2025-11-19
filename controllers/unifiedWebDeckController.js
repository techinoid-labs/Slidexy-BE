/**
 * =============================================================================
 * UNIFIED WEB DECK CONTROLLER
 * =============================================================================
 * 
 * Purpose: HTTP handlers for the unified web deck service
 * 
 * Endpoints:
 * - POST /api/unified-web-deck/generate-from-url
 * - POST /api/unified-web-deck/save-to-db
 * - GET /api/unified-web-deck/health
 * 
 * CEO Requirement: Final controller that orchestrates all 3 services
 *                  and returns a complete Presentation object
 * 
 * Created: 2025-11-14
 * =============================================================================
 */

const { generateUnifiedWebDeck } = require("../services/unifiedWebDeck");
const Presentation = require("../models/Presentation");

/**
 * Health check endpoint
 */
async function healthCheck(req, res) {
  try {
    res.status(200).json({
      success: true,
      message: "Unified Web Deck Service is operational",
      timestamp: new Date().toISOString(),
      services: {
        rawText: "operational",
        image: "operational",
        stylesheet: "operational",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Generate unified presentation from URL
 * Calls all 3 services and combines results
 */
async function generateFromUrl(req, res) {
  try {
    const { url } = req.body;

    // Validate input
    if (!url) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: url",
      });
    }

    // Validate URL format
    const urlPattern = /^(https?:\/\/).+/i;
    if (!urlPattern.test(url)) {
      return res.status(400).json({
        success: false,
        error: "Invalid URL format. Must start with http:// or https://",
      });
    }

    console.log("\n🌐 Unified Web Deck Request Received");
    console.log(`   URL: ${url}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    // Generate unified presentation
    const result = await generateUnifiedWebDeck(url);

    console.log("\n✅ Unified Presentation Generated Successfully");
    console.log(`   Presentation ID: ${result.presentation.presentation_id}`);
    console.log(`   Total Slides: ${result.presentation.slide_count}`);

    res.status(200).json({
      success: true,
      message: "Unified web deck generated successfully",
      presentation: result.presentation,
      metadata: result.metadata,
      individualResults: result.individualResults,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("\n❌ Unified Web Deck Generation Failed");
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);

    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Generate unified presentation and save to MongoDB
 * This endpoint generates the presentation AND saves it to the database
 */
async function generateAndSave(req, res) {
  try {
    const { url, userId } = req.body;

    // Validate input
    if (!url) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: url",
      });
    }

    // Validate URL format
    const urlPattern = /^(https?:\/\/).+/i;
    if (!urlPattern.test(url)) {
      return res.status(400).json({
        success: false,
        error: "Invalid URL format. Must start with http:// or https://",
      });
    }

    console.log("\n🌐 Unified Web Deck + Save Request Received");
    console.log(`   URL: ${url}`);
    console.log(`   User ID: ${userId || "Not provided (optional)"}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    // Generate unified presentation
    const result = await generateUnifiedWebDeck(url);

    console.log("\n💾 Saving presentation to MongoDB...");

    // Create MongoDB document
    const presentationData = {
      ...result.presentation,
    };

    // Add user reference if provided
    if (userId) {
      presentationData.user = userId;
    }

    // Save to database
    const presentation = new Presentation(presentationData);
    await presentation.save();

    console.log("✅ Presentation saved to MongoDB");
    console.log(`   MongoDB _id: ${presentation._id}`);
    console.log(`   Presentation ID: ${presentation.presentation_id}`);

    res.status(201).json({
      success: true,
      message: "Unified web deck generated and saved to database",
      presentation: {
        _id: presentation._id,
        presentation_id: presentation.presentation_id,
        topic: presentation.topic,
        slide_count: presentation.slide_count,
        slides: presentation.slides,
        art_palette: presentation.art_palette,
        meta: presentation.meta,
        createdAt: presentation.createdAt,
      },
      metadata: result.metadata,
      individualResults: result.individualResults,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("\n❌ Unified Web Deck Generation & Save Failed");
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);

    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = {
  healthCheck,
  generateFromUrl,
  generateAndSave,
};
