const { generateWebsiteFromUrl } = require("../services/websiteGenerator");
const { createAndUploadZip } = require('../utils/createAndUploadZip');
const GeneratedWebsite = require('../models/generateWebsite'); 
const fs = require("fs").promises;
const path = require("path");

async function healthCheck(req, res) {
  try {
    const websiteCodesDir = path.join(__dirname, "..", "website-codes");
    let dirExists = false;
    let fileCount = 0;

    try {
      await fs.access(websiteCodesDir);
      dirExists = true;
      const items = await fs.readdir(websiteCodesDir);
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
 */
// controllers/websiteGeneratorController.js
async function generateWebsite(req, res) {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: "URL required" });

    console.log(`Generating website for: ${url}`);
    
    // This now returns clean object
    const result = await generateWebsiteFromUrl(url);

    // result now has: folderName, files, sizeKB, presentation, etc.
    const { folderName, files, sizeKB, presentation, sourceUrl, generatedAt } = result;

    // Upload ZIP
    const zipUrl = await createAndUploadZip(folderName, files, presentation.presentation_id);

    // Save to DB
    const savedWebsite = await GeneratedWebsite.create({
      presentationId: presentation.presentation_id,
      topic: presentation.topic,
      sourceUrl,
      folderName,
      files,                    // ← correct format
      presentation: {
        slide_count: presentation.slide_count,
        art_style: presentation.art_style,
        art_palette: presentation.art_palette,
        total_images: presentation.total_images || 0,
        total_headings: presentation.total_headings || 0
      },
      zipUrl,
      sizeKB,
      generatedAt: new Date(generatedAt)
    });

    return res.status(201).json({
      success: true,
      message: "Website generated and saved!",
      data: {
        id: savedWebsite._id,
        topic: savedWebsite.topic,
        downloadZipUrl: zipUrl,
        sizeKB: savedWebsite.sizeKB,
        generatedAt: savedWebsite.generatedAt
      }
    });

  } catch (error) {
    console.error("Website generation failed:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
}
/**
 * List all generated websites
 */
async function listGeneratedWebsites(req, res) {
  try {
    const websiteCodesDir = path.join(__dirname, "..", "website-codes");
    
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

    const items = await fs.readdir(websiteCodesDir);
    const folders = [];
    
    for (const item of items) {
      const itemPath = path.join(websiteCodesDir, item);
      const stats = await fs.stat(itemPath);
      if (stats.isDirectory()) {
        folders.push(item);
      }
    }

    const websiteDetails = await Promise.all(
      folders.map(async (folderName) => {
        const folderPath = path.join(websiteCodesDir, folderName);
        const stats = await fs.stat(folderPath);
        
        let topic = "Unknown";
        let sourceUrl = "Unknown";
        let generatedAt = stats.birthtime;
        let fileCount = 0;
        let totalSize = 0;

        try {
          const readmePath = path.join(folderPath, "README.md");
          const content = await fs.readFile(readmePath, "utf-8");
          const topicMatch = content.match(/# (.+)/);
          const urlMatch = content.match(/\*\*Source URL:\*\* (.+)/);
          const dateMatch = content.match(/\*\*Generated:\*\* (.+)/);

          if (topicMatch) topic = topicMatch[1].trim();
          if (urlMatch) sourceUrl = urlMatch[1].trim();
          if (dateMatch) generatedAt = new Date(dateMatch[1].trim());

          const files = await fs.readdir(folderPath);
          fileCount = files.length;
          for (const file of files) {
            const filePath = path.join(folderPath, file);
            const fileStats = await fs.stat(filePath);
            totalSize += fileStats.size;
          }
        } catch (err) {
          console.warn(`Could not read metadata for ${folderName}:`, err.message);
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
// Add this function at the bottom of the file
async function getWebsiteById(req, res) {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid website ID",
      });
    }

    const website = await GeneratedWebsite.findById(id);

    if (!website) {
      return res.status(404).json({
        success: false,
        error: "Website not found",
      });
    }

    // Return exactly what your frontend expects
    return res.status(200).json({
      success: true,
      message: "Website fetched successfully",
      data: {
        presentationId: website._id.toString(),
        topic: website.topic,
        sourceUrl: website.sourceUrl,
        folderName: website.folderName,
        files: website.files,
        zipUrl: website.zipUrl,
        presentation: website.presentation,
        generatedAt: website.generatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching website by ID:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

module.exports = {
  healthCheck,
  generateWebsite,
  listGeneratedWebsites,
  getWebsiteById
};