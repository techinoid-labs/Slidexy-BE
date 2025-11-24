const express = require("express");
const router = express.Router();
const path = require("path");

// NEW V2 SERVICE
const infographicV2 = require("../services/unit-services/generateInfographicV2Service");

const Infographic = require("../models/Infographics");

// POST /api/infographic → generate infographic
router.post("/", async (req, res) => {
  try {
    const { prompt, viewMode = "landscape"} = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // 1️⃣ Generate infographic using V2 system
    const result = await infographicV2.generateInfographic(prompt, viewMode);

    const newInfographic = new Infographic({
      prompt,
      type: result.data?.type || "generic",
      title: result.data?.title || "Untitled",
      subtitle: result.data?.subtitle || "",
      data: result.data,
      html: result.html,
      meta: result.meta,
    });

    await newInfographic.save();

    // 3️⃣ Respond with saved infographic
    return res.json({ success: true, infographic: newInfographic });

  } catch (err) {
    console.error("Infographic generation (V2) failed:", err);
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