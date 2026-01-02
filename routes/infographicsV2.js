const express = require("express");
const router = express.Router();

// V2 Service with file support
const infographicV2 = require("../services/unit-services/generateInfographicV2Service");
const Infographic = require("../models/Infographics");

// Multer setup
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, TXT, DOC, and DOCX are allowed."), false);
    }
  },
});

// Middleware to handle multer errors cleanly
const uploadMiddleware = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File too large. Maximum size is 20MB." });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// POST /api/infographic - Generate infographic (text + optional file)
router.post("/", uploadMiddleware, async (req, res) => {
  console.log("Body fields:", req.body);
  console.log("File received:", req.file ? `${req.file.originalname} (${req.file.size} bytes)` : "No file");
  try {
    const { prompt, viewMode = "landscape" } = req.body;
    const file = req.file;

    if (!prompt && !file) {
      return res.status(400).json({
        error: "Either a text prompt or a file upload is required.",
      });
    }

    const fileData = file
      ? {
          buffer: file.buffer,
          mimetype: file.mimetype,
          originalname: file.originalname,
        }
      : null;

    const result = await infographicV2.generateInfographic(
      prompt || "",
      viewMode,
      fileData
    );

    const newInfographic = new Infographic({
      prompt: prompt || "(generated from uploaded file)",
      originalPrompt: prompt,
      fileAttached: !!file,
      fileOriginalName: file?.originalname,
      viewMode,
      type: result.data?.type || "generic",
      title: result.data?.title || "Untitled Infographic",
      subtitle: result.data?.subtitle || "",
      data: result.data,
      html: result.html,
      meta: result.meta,
    });

    await newInfographic.save();

    return res.json({
      success: true,
      infographic: newInfographic,
    });
  } catch (err) {
    console.error("Infographic V2 generation failed:", err);
    return res.status(500).json({
      error: err.message || "Failed to generate infographic",
    });
  }
});

// GET /api/infographic/:id - Fetch one
router.get("/:id", async (req, res) => {
  try {
    const infographic = await Infographic.findById(req.params.id);
    if (!infographic) {
      return res.status(404).json({ error: "Infographic not found" });
    }
    res.json({ success: true, infographic });
  } catch (error) {
    console.error("Error fetching infographic:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/infographic - List all (latest first)
router.get("/", async (req, res) => {
  try {
    const infographics = await Infographic.find().sort({ createdAt: -1 });
    res.json({ success: true, infographics });
  } catch (error) {
    console.error("Error listing infographics:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;