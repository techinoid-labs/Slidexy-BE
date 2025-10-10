const express = require("express");
const router = express.Router();
const path = require("path");
const { getDynamicInfographicService } = require("../services/unit-services/getDynamicInfographicService");

router.post("/", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // 1. Generate infographic
    const result = await getDynamicInfographicService(prompt);

     return res.json({
      success: true,
      infographic: {
        prompt,
        type: result.data?.type || "generic",
        title: result.data?.title || "Untitled",
        subtitle: result.data?.subtitle || "",
        data: result.data,
        html: result.html,
        meta: result.meta,
      },
    });

  } catch (err) {
    console.error("❌ Infographic generation failed:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
