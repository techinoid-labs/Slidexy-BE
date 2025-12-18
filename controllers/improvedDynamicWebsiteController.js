// controllers/improvedDynamicWebsiteController.js
const { generateImprovedDynamicWebsite } = require("../services/improvedDynamicWebsiteGenerator");
const { createAndUploadZip } = require('../utils/createAndUploadZip');
const DynamicWebsite = require('../models/DynamicWebsite');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

async function generateImprovedDynamic(req, res) {
  try {
    const { url } = req.body;
    if (!url?.trim()) return res.status(400).json({ success: false, error: "URL required" });

    const cleanUrl = url.trim().replace(/\/+$/, "");
    if (!/^https?:\/\//i.test(cleanUrl)) {
      return res.status(400).json({ success: false, error: "Valid URL required" });
    }

    console.log("Generating improved dynamic website from:", cleanUrl);

    const result = await generateImprovedDynamicWebsite(cleanUrl);

    if (!result.success) {
      throw new Error(result.error || "Generation failed");
    }

    const { folderName, folderPath, previewUrl, metadata, sourceUrl, generatedAt } = result;

    // Read the generated files from disk
    const websiteCodesDir = path.join(__dirname, "..", "website-codes");
    const websiteFolderPath = path.join(websiteCodesDir, folderName);

    const htmlContent = await fs.readFile(path.join(websiteFolderPath, "index.html"), "utf-8");
    const cssContent = await fs.readFile(path.join(websiteFolderPath, "styles.css"), "utf-8");
    const jsContent = await fs.readFile(path.join(websiteFolderPath, "app.js"), "utf-8");

    // Prepare files in the format expected by the system
    const normalizedFiles = [
      { type: "html", content: htmlContent },
      { type: "css", content: cssContent },
      { type: "js", content: jsContent },
    ];

    // Calculate size
    const totalSize = htmlContent.length + cssContent.length + jsContent.length;
    const sizeKB = Math.round(totalSize / 1024);

    // Generate unique presentationId
    const presentationId = `improved-dyn-${Date.now()}-${uuidv4().slice(0, 8)}`;

    // Create ZIP file
    const zipUrl = await createAndUploadZip(folderName, normalizedFiles, presentationId);

    // Save to database
    const saved = await DynamicWebsite.create({
      presentationId,
      topic: metadata.topic || "Improved Dynamic Website",
      sourceUrl,
      folderName,
      files: normalizedFiles,
      presentation: {
        slide_count: metadata.slide_count || 0,
        art_style: metadata.art_style || "modern",
        art_palette: metadata.art_palette || [],
        total_images: metadata.total_images || 0,
        total_headings: metadata.total_headings || 0,
      },
      zipUrl,
      previewUrl: previewUrl || `/website-codes/${folderName}/index.html`,
      sizeKB,
      generatedAt: new Date(generatedAt || Date.now()),
      improved: true,
      qualityChecked: result.qualityChecked || false,
    });

    // Return response in same format as standard dynamic
    return res.status(201).json({
      success: true,
      message: "Improved dynamic website generated successfully!",
      data: {
        id: saved._id.toString(),
        presentationId: saved.presentationId,
        topic: saved.topic,
        sourceUrl: saved.sourceUrl,
        folderName: saved.folderName,
        downloadZipUrl: zipUrl,
        previewUrl: saved.previewUrl,
        sizeKB: saved.sizeKB,
        generatedAt: saved.generatedAt,
        improved: true,
        qualityChecked: saved.qualityChecked,
      }
    });

  } catch (error) {
    console.error("Improved dynamic generation failed:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate improved dynamic website"
    });
  }
}

async function getImprovedDynamicWebsiteById(req, res) {
  try {
    const { id } = req.params;
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ success: false, error: "Invalid ID" });
    }

    const website = await DynamicWebsite.findById(id);
    if (!website) return res.status(404).json({ success: false, error: "Not found" });

    res.json({
      success: true,
      data: {
        id: website._id.toString(),
        presentationId: website.presentationId,
        topic: website.topic,
        sourceUrl: website.sourceUrl,
        folderName: website.folderName,
        files: website.files,
        zipUrl: website.zipUrl,
        previewUrl: website.previewUrl,
        presentation: website.presentation,
        sizeKB: website.sizeKB,
        generatedAt: website.generatedAt,
        improved: website.improved || false,
        qualityChecked: website.qualityChecked || false,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { generateImprovedDynamic, getImprovedDynamicWebsiteById };
