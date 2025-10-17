const express = require("express");
const router = express.Router();
const { getDynamicInfographicService } = require("../services/unit-services/getDynamicInfographicService");
const Infographic = require("../models/Infographics"); 
const { htmlToPng } = require("../utils/htmlToPng");

router.post("/", async (req, res) => {
  try {
    const { prompt, viewMode } = req.body;

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
      html: result.html,
      meta: result.meta,
    });

    const savedInfographic = await newInfographic.save();
    const { base64, path: imagePath } = await htmlToPng(result.html, savedInfographic._id.toString(),result.viewMode);

    return res.json({
      success: true,
      infographic: savedInfographic,
      imageBase64: `data:image/png;base64,${base64}`,
      imagePath,
    });

  } catch (err) {
    console.error("❌ Infographic generation failed:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
