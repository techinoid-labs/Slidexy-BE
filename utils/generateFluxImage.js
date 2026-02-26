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
    const fluxPrompt = `
${prompt}
Style: ${artStyle || "modern presentation illustration"}
Color palette: ${Array.isArray(artPalette) ? artPalette.join(", ") : (artPalette || "clean, professional")}

CRITICAL VISUAL RULES:
- ABSOLUTELY NO text, letters, numbers, words, logos, or typography of any kind. this includes random gibberish, pseudo-text, or any character-like marks.
- NO UI screenshots, dashboards, charts with labels, or anything that looks like interface text.
- If something might look like text (signs, posters, screens), replace it with abstract shapes, gradients, or icons only.
- Focus purely on abstract shapes, environments, objects, characters, and lighting.
- Should you see any letters or words in the output, regenerate immediately (they are forbidden).

Framing:
- High quality, 16:9, clean presentation background.
- Composition must work even when center-cropped to a small 142x160 thumbnail.
`;

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

