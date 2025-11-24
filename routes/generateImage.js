const express = require("express");
const router = express.Router();
const { imageGenModel } = require("../utils/geminiModels");

// POST /generate-image
router.post("/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "A valid 'prompt' is required." });
    }

    console.log(`🖼️ Generating image for prompt: "${prompt}"`);

    // Use your safe image generator
    const result = await imageGenModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
        candidateCount: 1,
        temperature: 0.80,
        topP: 0.95,
        topK: 50,
      },
    })

    // Extract the image data
    const imageData = result?.response?.candidates?.[0]?.content?.parts?.[0]?.inlineData;

    if (!imageData) {
      return res.status(500).json({ error: "Failed to generate image." });
    }

    // Convert to a base64 image URL for easy frontend rendering
    const base64 = imageData.data;
    const mimeType = imageData.mimeType || "image/png";
    const imageUrl = `data:${mimeType};base64,${base64}`;

    res.json({
      success: true,
      prompt,
      imageUrl,
    });
  } catch (err) {
    console.error("❌ Image generation error:", err.message);
    res.status(500).json({
      error: err.message || "Failed to generate image",
    });
  }
});

module.exports = router;