const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const generateInfographicExplainerService = require("../services/unit-services/generateInfographicExplainerService");

// Define output directory
const OUTPUT_DIR = path.join(__dirname, "../output-explainer-infographics");

/**
 * POST /api/explainer-infographic
 * Generate infographic for explainer videos with color scheme support
 * 
 * Request body:
 * {
 *   "topic": "string (required) - Topic/prompt for infographic",
 *   "viewMode": "string (optional) - 'landscape' (16:9, 1280px) or 'portrait' (9:16, 480px), default: 'landscape'",
 *   "colorScheme": "string (optional) - Color scheme name (techBlue, forestGreen, culinaryRed, etc.)"
 * }
 */
router.post("/", async (req, res) => {
  let filepath; // keep track of the file to delete

  try {
    const { topic, viewMode = "landscape", colorScheme, slideType, title, textOverlay, narration, keyPoints } = req.body;

    // Validation function
    function validateSlideData(data) {
      const errors = [];

      // Validate topic
      if (!data.topic || typeof data.topic !== "string" || data.topic.trim().length === 0) {
        errors.push("Topic is required and must be a non-empty string");
      }

      // Validate viewMode
      if (data.viewMode && !["landscape", "portrait"].includes(data.viewMode)) {
        errors.push("viewMode must be either 'landscape' or 'portrait'");
      }

      // Validate colorScheme (optional, but if provided, must be string)
      if (data.colorScheme && typeof data.colorScheme !== "string") {
        errors.push("colorScheme must be a string");
      }

      // Validate slideType (optional, but if provided, must be string)
      if (data.slideType && typeof data.slideType !== "string") {
        errors.push("slideType must be a string");
      }

      // Validate title (optional, but if provided, must be string)
      if (data.title && typeof data.title !== "string") {
        errors.push("title must be a string");
      }

      // Validate textOverlay (required)
      if (!data.textOverlay || typeof data.textOverlay !== "string") {
        errors.push("textOverlay is required and must be a string");
      }

      // Validate narration (optional, but if provided, must be string)
      if (data.narration && typeof data.narration !== "string") {
        errors.push("narration must be a string");
      }

      // Validate keyPoints (required, must be an array and not empty)
      if (!data.keyPoints || !Array.isArray(data.keyPoints) || data.keyPoints.length === 0) {
        errors.push("No Key Points Found");
      }

      return errors;
    }

    // Perform validation
    const errors = validateSlideData({ topic, viewMode, colorScheme, slideType, title, textOverlay, narration, keyPoints });

    if (errors.length > 0) {
      console.log("❌ Validation errors:", errors);
      return res.status(400).json({ errors });
    }

    // Log all valid fields
    console.log("✅ Valid slide data received:");
    console.log({
      topic,
      viewMode,
      colorScheme,
      slideType,
      title,
      textOverlay,
      narration,
      keyPoints
    });

    const validColorSchemes = [
      'techBlue', 'forestGreen', 'culinaryRed', 'creativeViolet',
      'travelTeal', 'academicYellow', 'scienceBlue', 'corporateGold', 'medicalBlue'
    ];

    if (colorScheme && !validColorSchemes.includes(colorScheme)) {
      return res.status(400).json({
        error: `Invalid colorScheme. Must be one of: ${validColorSchemes.join(', ')}`
      });
    }

    // Generate infographic
    // Assuming the service expects topic and an options object; adjust if the service signature differs
    const options = {
      topic,
      viewMode,
      colorScheme,
      slideType,
      title,
      textOverlay,
      narration,
      keyPoints
    };

    const result = await generateInfographicExplainerService.generateInfographic(options);

    // Save HTML temporarily
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `explainer-${timestamp}.html`;
    filepath = path.join(OUTPUT_DIR, filename);

    fs.writeFileSync(filepath, result.html, 'utf8');

    // Prepare response
    const response = {
      success: true,
      html: result.html,
      data: result.data,
      meta: {
        ...result.meta,
        colorScheme: colorScheme || 'auto-detected',
        viewMode,
        generatedAt: new Date().toISOString(),
        savedAs: filename
      }
    };

    // Send response **first**
    res.json(response);

  } catch (error) {
    console.error(`❌ [Explainer Route] Error:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  } finally {
    // Delete the file **after sending response**
    if (filepath && fs.existsSync(filepath)) {
      fs.unlink(filepath, (err) => {
        if (err) console.warn(`⚠️ Failed to delete file ${filepath}: ${err.message}`);
        else console.log(`🗑️ Deleted temporary file: ${filepath}`);
      });
    }
  }
});

/**
 * GET /api/explainer-infographic/info
 * Get service information and available color schemes
 */
router.get("/info", (req, res) => {
  try {
    const serviceInfo = generateInfographicExplainerService.getServiceInfo();
    res.json({
      success: true,
      service: serviceInfo,
      endpoint: "/api/explainer-infographic",
      usage: {
        method: "POST",
        requiredFields: ["topic"],
        optionalFields: ["viewMode", "colorScheme"],
        viewModes: ["landscape", "portrait"],
        colorSchemes: serviceInfo.colorSchemes
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;