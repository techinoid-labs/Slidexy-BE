const express = require("express");
const router = express.Router();
const {
  generateImprovedDynamic,
  getImprovedDynamicWebsiteById,
} = require("../controllers/improvedDynamicWebsiteController");

// Generate new improved dynamic website
router.post("/generate", generateImprovedDynamic);

// Get improved dynamic website by ID
router.get("/:id", getImprovedDynamicWebsiteById);

// Optional: List all improved dynamic websites
router.get("/list", async (req, res) => {
  try {
    const DynamicWebsite = require("../models/DynamicWebsite");
    const websites = await DynamicWebsite.find({ improved: true }).sort({ generatedAt: -1 });
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
        improved: true,
        qualityChecked: w.qualityChecked,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
