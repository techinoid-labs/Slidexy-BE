// controllers/dynamicWebsiteController.js
const { generateDynamicWebsite } = require("../services/dynamicWebsiteGenerator");
const { createAndUploadZip } = require('../utils/createAndUploadZip');
const DynamicWebsite = require('../models/DynamicWebsite');
const { v4: uuidv4 } = require('uuid');

async function generateDynamic(req, res) {
  try {
    const { url } = req.body;
    if (!url?.trim()) return res.status(400).json({ success: false, error: "URL required" });

    const cleanUrl = url.trim().replace(/\/+$/, "");
    if (!/^https?:\/\//i.test(cleanUrl)) {
      return res.status(400).json({ success: false, error: "Valid URL required" });
    }

    console.log("Generating dynamic website from:", cleanUrl);

    const result = await generateDynamicWebsite(cleanUrl);

    // Extract folder name (the dynamic key)
    const folderName = Object.keys(result).find(key =>
      !["success", "message", "presentation", "sourceUrl", "generatedAt"].includes(key)
    );

    if (!folderName) throw new Error("Invalid response from generator");

    const folderData = result[folderName];
    const { files: rawFiles, sizeKB, previewUrl } = folderData;
    const { presentation, sourceUrl, generatedAt } = result;

    // === CRITICAL FIX: Normalize files ===
    const normalizedFiles = rawFiles.map(file => {
      const fileType = file["file-type"]; // ← this is the key!
      let type = "html";

      if (fileType === "html") type = "html";
      else if (fileType === "css") type = "css";
      else if (fileType === "js") type = "js";
      else if (fileType === "readme") type = "readme";

      return {
        type,
        content: file.content || ""
      };
    });

    // Generate unique presentationId
    const presentationId = `dyn-${Date.now()}-${uuidv4().slice(0, 8)}`;

    // CORRECT — map to { type, content } first!
    const normalizedFilesForZip = rawFiles.map(file => ({
      type: file["file-type"],     // ← convert "file-type" → "type"
      content: file.content
    }));

    const zipUrl = await createAndUploadZip(folderName, normalizedFilesForZip, presentationId);

    // === NOW SAVE TO DB (this was missing or failing) ===
    const saved = await DynamicWebsite.create({
      presentationId,
      topic: presentation.topic || "Dynamic Website",
      sourceUrl,
      folderName,
      files: normalizedFiles,                    // ← now valid!
      presentation: {
        slide_count: presentation.slide_count || 0,
        art_style: presentation.art_style || "modern",
        art_palette: presentation.art_palette || [],
        total_images: presentation.total_images || 0,
        total_headings: presentation.total_headings || 0,
      },
      zipUrl,
      previewUrl: previewUrl || `/website-codes/${folderName}/index.html`,
      sizeKB,
      generatedAt: new Date(generatedAt || Date.now()),
    });

    // === RETURN SAME FORMAT AS STATIC ===
    return res.status(201).json({
      success: true,
      message: "Dynamic website generated successfully!",
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
      }
    });

  } catch (error) {
    console.error("Dynamic generation failed:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate dynamic website"
    });
  }
}

async function getDynamicWebsiteById(req, res) {
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
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { generateDynamic, getDynamicWebsiteById };