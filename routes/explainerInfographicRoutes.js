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
  try {
    const { topic, viewMode = "landscape", colorScheme } = req.body;

    if (!topic || typeof topic !== "string") {
      return res.status(400).json({ error: "Topic is required and must be a string" });
    }

    // Validate viewMode
    if (!["landscape", "portrait"].includes(viewMode)) {
      return res.status(400).json({ error: "viewMode must be 'landscape' or 'portrait'" });
    }

    // Validate colorScheme if provided
    const validColorSchemes = [
      'techBlue', 'forestGreen', 'culinaryRed', 'creativeViolet', 
      'travelTeal', 'academicYellow', 'scienceBlue', 'corporateGold', 'medicalBlue'
    ];
    
    if (colorScheme && !validColorSchemes.includes(colorScheme)) {
      return res.status(400).json({ 
        error: `Invalid colorScheme. Must be one of: ${validColorSchemes.join(', ')}` 
      });
    }

    console.log(`🎬 [Explainer Route] Generating infographic - Topic: "${topic.substring(0, 50)}..." | ViewMode: ${viewMode}${colorScheme ? ` | ColorScheme: ${colorScheme}` : ''}`);
    
    // Build options object
    const options = {};
    if (colorScheme) {
      options.colorScheme = colorScheme;
    }

    // 1. Generate infographic using explainer service
    const result = await generateInfographicExplainerService.generateInfographic(topic, viewMode, options);

    // 2. Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // 3. Save HTML file (optional, for debugging)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `explainer-${timestamp}.html`;
    const filepath = path.join(OUTPUT_DIR, filename);
    
    try {
      fs.writeFileSync(filepath, result.html, 'utf8');
      console.log(`💾 [Explainer Route] HTML saved: ${filepath}`);
    } catch (writeError) {
      console.warn(`⚠️ [Explainer Route] Failed to save HTML file: ${writeError.message}`);
    }

    // 4. Return response
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

    console.log(`✅ [Explainer Route] Infographic generated successfully`);
    res.json(response);

  } catch (error) {
    console.error(`❌ [Explainer Route] Error:`, error.message);
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: error.stack
    });
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