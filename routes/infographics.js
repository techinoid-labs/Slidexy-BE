const express = require("express");
const router = express.Router();
const { getInfographicService } = require("../services/unit-services/getInfographicService");
const Infographic = require("../models/Infographics");
router.post("/", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    const result = await getInfographicService(prompt);

    const infographic = await Infographic.create({
      prompt,
      title: result.data.title,
      subtitle: result.data.subtitle,
      type: result.data.type,
      data: result.data.data,
      html: result.html, 
      meta: { ...result.meta, source: "AI Generated" },
    });

    res.status(201).json({ success: true, infographic });
  } catch (error) {
    console.error("Infographic POST error:", error);
    res.status(500).json({ error: error.message });
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
