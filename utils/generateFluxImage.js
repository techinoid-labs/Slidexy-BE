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

/*
 * fal answers 403 "User is locked. Reason: TOP_UP." once the balance
 * runs out, and it answers it for every slide in the deck. There is no
 * point paying a round trip per slide to be told the same thing, so the
 * first account-level refusal closes this path for the life of the
 * process and the caller drops straight to the fallback chain. A restart
 * after a top-up reopens it.
 */
let accountClosed = null;

function isAccountLevelFailure(err) {
  const status = err?.status || err?.response?.status;
  if (status === 401 || status === 403 || status === 402) return true;
  const body = JSON.stringify(err?.body || err?.response?.data || err?.message || "");
  return /locked|TOP_UP|insufficient|exhausted|quota/i.test(body);
}

async function generateFluxImage({ prompt, artStyle, artPalette, layoutType }) {
  if (!FAL_CREDENTIALS) return null;

  if (accountClosed) {
    console.warn(`Skipping fal: ${accountClosed}`);
    return null;
  }

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
    const message = err.message || String(err);

    if (isAccountLevelFailure(err)) {
      accountClosed =
        "the fal.ai account is not usable (" +
        message.slice(0, 120) +
        "). Top up at fal.ai and restart the server to use it again.";
      console.error("fal.ai is out of action for this process: " + accountClosed);
    } else {
      console.error("Flux generation failed:", message);
    }

    return null;
  }
}

module.exports = { generateFluxImage };

