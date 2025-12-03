const express = require("express");
const router = express.Router();
const {
  generateDynamic,
  getDynamicWebsiteById,
} = require("../controllers/dynamicWebsiteController");

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