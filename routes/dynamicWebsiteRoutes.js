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

// Configure Multer with disk storage to preserve extensions
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Edit by ID (RESTful PUT for updates)
// Updated to delegate ID lookup to the controller (ambidextrous model support)
router.put("/:id", upload.single("image"), editWebsiteController);

// Generate new dynamic website
router.post("/generate", generateDynamic);

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

// Get dynamic website by ID
router.get("/:id", getDynamicWebsiteById);  // Consistent with static

module.exports = router;