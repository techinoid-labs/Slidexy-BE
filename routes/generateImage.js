const express = require("express");
const router = express.Router();
const { generateFluxImage } = require("../utils/generateFluxImage");

// POST /generate-image
router.post("/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "A valid 'prompt' is required." });
    }

    console.log(`🖼️ Generating image for prompt: "${prompt}"`);

    const result = await generateFluxImage({ prompt });

    if (!result?.image_url) {
      return res.status(500).json({ error: "Failed to generate image." });
    }

    res.json({
      success: true,
      prompt,
      imageUrl: result.image_url,
    });
  } catch (err) {
    console.error("❌ Image generation error:", err.message);
    res.status(500).json({
      error: err.message || "Failed to generate image",
    });
  }
});

module.exports = router;