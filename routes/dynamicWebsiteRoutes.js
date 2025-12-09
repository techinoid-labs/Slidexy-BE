const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  generateDynamic,
  getDynamicWebsiteById,
} = require("../controllers/dynamicWebsiteController");
const { editWebsiteController } = require("../controllers/websiteEditorController");
const DynamicWebsite = require('../models/DynamicWebsite');

const upload = multer({ dest: "uploads/" });

// Edit by ID (wrapper around existing editor)
router.post("/:id/edit", upload.single("image"), async (req, res) => {
  try {
    const website = await DynamicWebsite.findById(req.params.id);
    if (!website) return res.status(404).json({ success: false, error: "Not found" });
    req.body.folderName = website.folderName;
    return editWebsiteController(req, res);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Generate new dynamic website
router.post("/generate", generateDynamic);

// Get dynamic website by ID
router.get("/:id", getDynamicWebsiteById);  // Consistent with static

// Optional: List all dynamic websites
router.get("/list", async (req, res) => {
  try {
    const websites = await DynamicWebsite.find().sort({ generatedAt: -1 });
    res.json({
      success: true,
      count: websites.length,
      websites: websites.map(w => ({
        id: w._id,
        topic: w.topic,
        sourceUrl: w.sourceUrl,
        zipUrl: w.zipUrl,
        previewUrl: `/website-codes/${w.folderName}/index.html`,
        generatedAt: w.generatedAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;