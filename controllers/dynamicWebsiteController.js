/**
 * =============================================================================
 * DYNAMIC WEBSITE GENERATOR CONTROLLER
 * =============================================================================
 * 
 * Purpose: HTTP handlers for dynamic website generation service
 * 
 * Endpoint:
 * - POST /api/dynamic-website/generate
 * 
 * Created: 2025-11-20
 * =============================================================================
 */

const { generateDynamicWebsite } = require("../services/dynamicWebsiteGenerator");

/**
 * Generate dynamic website from URL
 * Main endpoint that creates structure-aware websites
 */
async function generateDynamic(req, res) {
  try {
    const { url } = req.body;

    // Validate input
    if (!url) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: url",
        message: "Please provide a 'url' field in the request body",
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

    console.log("\n🌐 Dynamic Website Generation Request Received");
    console.log(`   URL: ${url}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    // Generate dynamic website
    const result = await generateDynamicWebsite(url);

    // Extract folder name from result
    const folderName = Object.keys(result).find(key => 
      key !== 'success' && 
      key !== 'message' && 
      key !== 'presentation' && 
      key !== 'sourceUrl' && 
      key !== 'generatedAt'
    );

    if (folderName && result[folderName]) {
      console.log("\n✅ Dynamic Website Generated Successfully");
      console.log(`   Folder: ${folderName}`);
      console.log(`   Files: ${result[folderName].files.length}`);
      console.log(`   Size: ${result[folderName].sizeKB} KB`);
    }

    res.status(201).json(result);

  } catch (error) {
    console.error("\n❌ Dynamic Website Generation Failed");
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);

    res.status(500).json({
      success: false,
      error: error.message,
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = {
  generateDynamic,
};
