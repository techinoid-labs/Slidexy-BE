const { fal } = require("@fal-ai/client");

// Prefer FAL_API_KEY, but keep backward compatibility with FAL_KEY
const FAL_CREDENTIALS = process.env.FAL_API_KEY || process.env.FAL_KEY;

if (!FAL_CREDENTIALS) {
  console.warn("⚠️  FAL_API_KEY (or FAL_KEY) is not set. Flux image generation will fail.");
}

fal.config({
  credentials: FAL_CREDENTIALS,
});

async function generateFluxImage({ prompt, artStyle, artPalette }) {
  try {
    // Keep the prompt as-is — it is already a concise natural-language description
    // built by generateDetailedImagePrompt. Only append style/palette if not already
    // present so we don't dilute the subject-specific content that comes first.
    const styleSuffix = artStyle && !prompt.toLowerCase().includes(artStyle.toLowerCase())
      ? `, ${artStyle} style`
      : "";
    const paletteSuffix = artPalette && Array.isArray(artPalette) && artPalette.length
      ? `, colors ${artPalette.slice(0, 3).join(", ")}`
      : "";

    const fluxPrompt = `${prompt.trim()}${styleSuffix}${paletteSuffix}`;

    console.log("Sending Flux request with prompt:", fluxPrompt);

    const result = await fal.subscribe("fal-ai/flux-1/schnell", {
      input: {
        prompt: fluxPrompt,
        // Ask Flux for a landscape 16:9 frame; we still normalize to 1920x1080 later
        image_size: "landscape_16_9",
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    const imageUrl = result.data?.images?.[0]?.url || null;
    if (!imageUrl) throw new Error("Flux returned no image URL");

    return {
      image_url: imageUrl,
      raw: result.data,
    };
  } catch (err) {
    console.error("Flux generation failed:", err.message || err);
    return null;
  }
}

module.exports = { generateFluxImage };

