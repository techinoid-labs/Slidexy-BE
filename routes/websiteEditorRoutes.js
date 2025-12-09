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

// POST /edit/:id
// Body: prompt (text)
// File: image (optional)
router.post("/", upload.single("image"), editWebsiteController);

module.exports = router;
