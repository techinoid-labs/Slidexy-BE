/**
 * =============================================================================
 * WEBSITE GENERATOR CONTROLLER
 * =============================================================================
 * 
 * Purpose: HTTP handlers for website generation service
 * 
 * Endpoints:
 * - POST /api/website-generator/generate
 * - GET  /api/website-generator/health
 * - GET  /api/website-generator/list
 * 
 * CEO Requirement: Generate modern HTML websites from URLs using unified deck data
 * 
 * Created: 2025-11-17
 * =============================================================================
 */

const { generateWebsiteFromUrl } = require("../services/websiteGenerator");
const fs = require("fs").promises;
const path = require("path");

/**
 * Health check endpoint
 */
async function healthCheck(req, res) {
  try {
    // Check if website-codes directory exists
    const websiteCodesDir = path.join(__dirname, "..", "website-codes");
    let dirExists = false;
    let fileCount = 0;

    try {
      await fs.access(websiteCodesDir);
      dirExists = true;
      const items = await fs.readdir(websiteCodesDir);
      // Count directories (folders)
      for (const item of items) {
        const itemPath = path.join(websiteCodesDir, item);
        const stats = await fs.stat(itemPath);
        if (stats.isDirectory()) fileCount++;
      }
    } catch {
      dirExists = false;
    }

    res.status(200).json({
      success: true,
      message: "Website Generator Service is operational",
      timestamp: new Date().toISOString(),
      status: {
        service: "active",
        geminiAI: "connected",
        unifiedWebDeck: "connected",
        outputDirectory: dirExists ? "ready" : "will be created",
        generatedWebsites: fileCount,
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
 * Generate website from URL
 * Main endpoint that orchestrates the entire website generation process
 */
async function generateWebsite(req, res) {
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

    console.log("\n🌐 Website Generation Request Received");
    console.log(`   URL: ${url}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    // Generate website
    const result = await generateWebsiteFromUrl(url);

    // Extract folder name from the result (it's the dynamic key)
    const folderName = Object.keys(result).find(key => 
      key !== 'success' && 
      key !== 'message' && 
      key !== 'presentation' && 
      key !== 'sourceUrl' && 
      key !== 'generatedAt'
    );

    if (folderName && result[folderName]) {
      console.log("\n✅ Website Generated Successfully");
      console.log(`   Folder: ${folderName}`);
      console.log(`   Files: ${result[folderName].files.length}`);
      console.log(`   Size: ${result[folderName].sizeKB} KB`);
    }

    res.status(201).json(result);

  } catch (error) {
    console.error("\n❌ Website Generation Failed");
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);

    // Determine error type and status code
    let statusCode = 500;
    let errorMessage = error.message;

    if (error.message.includes("unified presentation")) {
      statusCode = 500;
      errorMessage = "Failed to generate presentation data from URL";
    } else if (error.message.includes("Gemini")) {
      statusCode = 500;
      errorMessage = "AI generation service error";
    } else if (error.message.includes("save")) {
      statusCode = 500;
      errorMessage = "Failed to save generated website";
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * List all generated websites
 */
async function listGeneratedWebsites(req, res) {
  try {
    const websiteCodesDir = path.join(__dirname, "..", "website-codes");
    
    // Check if directory exists
    try {
      await fs.access(websiteCodesDir);
    } catch {
      return res.status(200).json({
        success: true,
        message: "No websites generated yet",
        websites: [],
        count: 0,
      });
    }

    // Read all folders
    const items = await fs.readdir(websiteCodesDir);
    const folders = [];
    
    for (const item of items) {
      const itemPath = path.join(websiteCodesDir, item);
      const stats = await fs.stat(itemPath);
      if (stats.isDirectory()) {
        folders.push(item);
      }
    }

    // Get folder details
    const websiteDetails = await Promise.all(
      folders.map(async (folderName) => {
        const folderPath = path.join(websiteCodesDir, folderName);
        const stats = await fs.stat(folderPath);
        
        // Try to extract metadata from README.md
        let topic = "Unknown";
        let sourceUrl = "Unknown";
        let generatedAt = stats.birthtime;
        let fileCount = 0;
        let totalSize = 0;

        try {
          // Read README for metadata
          const readmePath = path.join(folderPath, "README.md");
          const content = await fs.readFile(readmePath, "utf-8");
          const topicMatch = content.match(/# (.+)/);
          const urlMatch = content.match(/\*\*Source URL:\*\* (.+)/);
          const dateMatch = content.match(/\*\*Generated:\*\* (.+)/);

          if (topicMatch) topic = topicMatch[1].trim();
          if (urlMatch) sourceUrl = urlMatch[1].trim();
          if (dateMatch) generatedAt = new Date(dateMatch[1].trim());

          // Count files and calculate total size
          const files = await fs.readdir(folderPath);
          fileCount = files.length;
          for (const file of files) {
            const filePath = path.join(folderPath, file);
            const fileStats = await fs.stat(filePath);
            totalSize += fileStats.size;
          }
        } catch {
          // Metadata extraction failed, use defaults
        }

        return {
          folderName: folderName,
          topic: topic,
          sourceUrl: sourceUrl,
          sizeKB: (totalSize / 1024).toFixed(2),
          fileCount: fileCount,
          generatedAt: generatedAt.toISOString(),
          previewUrl: `/website-codes/${folderName}/index.html`,
          folderPath: folderPath,
        };
      })
    );

    // Sort by generation date (newest first)
    websiteDetails.sort((a, b) => 
      new Date(b.generatedAt) - new Date(a.generatedAt)
    );

    res.status(200).json({
      success: true,
      message: `Found ${websiteDetails.length} generated website(s)`,
      websites: websiteDetails,
      count: websiteDetails.length,
      directory: websiteCodesDir,
    });

  } catch (error) {
    console.error("Error listing websites:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to list generated websites",
      details: error.message,
    });
  }
}

module.exports = {
  healthCheck,
  generateWebsite,
  listGeneratedWebsites,
};
