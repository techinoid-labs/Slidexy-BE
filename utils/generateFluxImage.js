const { fal } = require("@fal-ai/client");

// Prefer FAL_API_KEY, but keep backward compatibility with FAL_KEY
const FAL_CREDENTIALS = process.env.FAL_API_KEY || process.env.FAL_KEY;

if (!FAL_CREDENTIALS) {
  console.warn("⚠️  FAL_API_KEY (or FAL_KEY) is not set. Flux image generation will fail.");
}

fal.config({
  credentials: FAL_CREDENTIALS,
});

/*
 * Map slide layout type to best Flux image_size:
 *  - Side-panel layouts (cover, content-*): square_hd fills portrait panels
 *    without awkward landscape cropping
 *  - Full-background layouts: landscape_16_9 is perfect
 */
function getFluxImageSize(layoutType) {
  const panelLayouts = [
    "cover-hero",
    "content-right-image",
    "content-left-image",
    "content-split",
    "infographic-bullets",
    "quote-slide",
    "timeline-slide",
    "comparison-slide",
    "conclusion",
    "call-to-action",
  ];
  if (panelLayouts.includes(layoutType)) return "square_hd";
  if (layoutType === "full-image-text-overlay") return "landscape_16_9";
  return "landscape_16_9";
}

async function generateFluxImage({ prompt, artStyle, artPalette, layoutType }) {
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
    const imageSize = getFluxImageSize(layoutType);

    console.log(`Sending Flux request [${imageSize}] with prompt:`, fluxPrompt);

    const result = await fal.subscribe("fal-ai/flux-1/schnell", {
      input: {
        prompt: fluxPrompt,
        image_size: imageSize,
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

