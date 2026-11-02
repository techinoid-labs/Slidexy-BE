const express = require("express");
const crypto = require("crypto");
const sharp = require("sharp");
const router = express.Router();
const { generateFluxImage } = require("../utils/generateFluxImage");
const {
  generateFallbackImageDetailed,
  imageProviderStatus,
} = require("../services/fallbackImageGeneration");
const { uploadToSpaces } = require("../utils/s3Uploader");

/**
 * Turns a base64 data URL into a hosted WebP.
 *
 * The chain hands back base64, and returning a megabyte of it in a JSON
 * body would be unkind to every client. Upload it and return a link,
 * which is what the flux path already did.
 */
async function hostDataUrl(dataUrl) {
  const base64 = dataUrl.split(",")[1] || dataUrl;
  const webp = await sharp(Buffer.from(base64, "base64"))
    .webp({ quality: 95, effort: 6 })
    .toBuffer();

  const filename = `generated_${crypto.randomUUID()}_${Date.now()}.webp`;
  return await uploadToSpaces(`data:image/webp;base64,${webp.toString("base64")}`, filename);
}

// GET /image-providers — which generators can run right now.
// Worth having: when images stop appearing, the first question is
// always whether anything is configured, and this answers it without
// reading the logs.
router.get("/image-providers", (req, res) => {
  res.json({ success: true, providers: imageProviderStatus() });
});

// POST /generate-image
router.post("/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "A valid 'prompt' is required." });
    }

    console.log(`Generating image for prompt: "${prompt}"`);

    const flux = await generateFluxImage({ prompt });
    if (flux?.image_url) {
      return res.json({ success: true, prompt, imageUrl: flux.image_url, provider: "fal" });
    }

    // fal is first because it was here first, but it is not the only
    // option any more. Fall through rather than giving up.
    const { image, provider } = await generateFallbackImageDetailed(prompt);
    const imageUrl = await hostDataUrl(image);

    res.json({ success: true, prompt, imageUrl, provider });
  } catch (err) {
    console.error("Image generation error:", err.message);
    res.status(502).json({
      error: err.message || "Failed to generate image",
      providers: imageProviderStatus(),
    });
  }
});

module.exports = router;
