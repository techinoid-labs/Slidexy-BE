const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { getDynamicInfographicService } = require("../services/unit-services/getDynamicInfographicService");
const Infographic = require("../models/Infographics"); 

// POST: Generate new infographic
router.post("/", async (req, res) => {
  try {
    const { prompt, viewMode } = req.body;  // Default to landscape if missing

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // 1. Generate infographic using your service
    const result = await getDynamicInfographicService(prompt, viewMode);

    // 2. Map response data to Mongoose model
    const newInfographic = new Infographic({
      prompt,
      viewMode,
      type: result.data?.type || "generic",
      title: result.data?.title || "Untitled",
      subtitle: result.data?.subtitle || "",
      data: result.data,
      html: result.html,  // Object with landscape/portrait
      meta: result.meta,
    });

    const savedInfographic = await newInfographic.save();

    return res.json({
      success: true,
      infographic: savedInfographic,
    });

  } catch (err) {
    console.error("❌ Infographic generation failed:", err);
    return res.status(500).json({ error: err.message });
  }
});

// GET: Fetch existing infographic by ID
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid infographic ID format" });
    }

    const infographic = await Infographic.findById(req.params.id);
    if (!infographic) {
      return res.status(404).json({ error: "Infographic not found" });
    }
    return res.json({ success: true, infographic });
  } catch (err) {
    console.error("Error fetching infographic:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;