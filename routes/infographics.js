const express = require("express");
const router = express.Router();
const path = require("path");
const { getInfographicService } = require("../services/unit-services/getInfographicService");
const Infographic = require("../models/Infographics");
router.post("/", async (req, res) => {
  try {
    const { prompt, useReferences = true } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Build full paths to your static images
    let referenceImagePaths = [];
    if (useReferences) {
      referenceImagePaths = [
        path.resolve(__dirname, "../images/reference-image-1.jpg"),
        path.resolve(__dirname, "../images/reference-image-2.jpg"),
        path.resolve(__dirname, "../images/reference-image-3.jpg"),
        path.resolve(__dirname, "../images/reference-image-4.jpg"),
      ];
    }

    // 1. Generate infographic
    const result = await getInfographicService(prompt, { referenceImagePaths });

    // 2. Save infographic in MongoDB
    const newInfographic = new Infographic({
      prompt,
      type: result.data?.type || "generic", // fallback if Gemini doesn't return type
      title: result.data?.title || "Untitled",
      subtitle: result.data?.subtitle || "",
      data: result.data,
      html: result.html,
      meta: result.meta,
    });

    await newInfographic.save();

    // 3. Respond with saved doc
    return res.json({ success: true, infographic: newInfographic });

  } catch (err) {
    console.error("Infographic generation failed:", err);
    return res.status(500).json({ error: err.message });
  }
});



// GET /api/infographic/:id → fetch by ID
router.get("/:id", async (req, res) => {
  try {
    const infographic = await Infographic.findById(req.params.id);
    if (!infographic) return res.status(404).json({ error: "Not found" });
    res.json({ success: true, infographic });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/infographic → list all
router.get("/", async (req, res) => {
  try {
    const infographics = await Infographic.find().sort({ createdAt: -1 });
    res.json({ success: true, infographics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
