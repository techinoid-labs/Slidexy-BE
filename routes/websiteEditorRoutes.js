const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { editWebsiteController } = require("../controllers/websiteEditorController");

// Configure Multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure this directory exists in your main server setup
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

// POST / - Generate/Create new website (existing functionality)
// Body: prompt, url, etc.
// This is used by the generation flow, DO NOT MODIFY
router.post("/", upload.single("image"), editWebsiteController);

// PUT /:id - Edit existing website by ID
// Body: prompt (text), history, clickedElementId
// File: image (optional)
// This is for the AI Editor feature
router.put("/:id", upload.single("image"), editWebsiteController);

module.exports = router;
