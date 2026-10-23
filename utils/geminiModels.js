const OpenAI = require("openai");

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

/**
 * Two tiers, because not every call is worth the same.
 *
 * UTILITY is the cheap mechanical work: classification, tidying an image
 * prompt, extracting a field. A small model is correct there.
 *
 * QUALITY is anything the user actually reads -- slide copy above all.
 * The deck IS the product. Generating it with the cheapest model in the
 * family to save a fraction of a cent is a false economy, and it is the
 * likely reason output lost to competitors despite a strong prompt: a
 * detailed multi-rule prompt needs a model large enough to honour it.
 *
 * The default is the MIDDLE rung, not the most expensive one: roughly an
 * order of magnitude cheaper than a frontier model and still large enough
 * to follow the prompt. Run `node scripts/compare-models.js` to see the
 * ladder priced against its own output and move up only if the samples
 * justify it.
 */
const QUALITY_MODEL =
  process.env.OPENROUTER_QUALITY_MODEL || "google/gemini-2.5-flash";
const UTILITY_MODEL = process.env.OPENROUTER_UTILITY_MODEL || "google/gemini-2.5-flash-lite";
const GOOGLE_API_KEY = process.env.API_KEY1 || process.env.GEMINI_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.warn("⚠️  OPENROUTER_API_KEY not configured. Using Google Generative AI as primary.");
}

if (!GOOGLE_API_KEY && !OPENROUTER_API_KEY) {
  throw new Error("No API keys configured. Set API_KEY1 or GEMINI_API_KEY, and optionally OPENROUTER_API_KEY, in .env.");
}

// ---------------------------------------------------------------------------
// OpenRouter client (OpenAI-compatible)
// ---------------------------------------------------------------------------
let openRouterClient = null;
if (OPENROUTER_API_KEY) {
  openRouterClient = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: OPENROUTER_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": "https://slidexy.ai",
      "X-Title": "Slidexy Neuro Engine",
    },
  });
  console.log("✅ OpenRouter client initialized (model: google/gemini-2.5-flash-lite)");
}

// ---------------------------------------------------------------------------
// Fallback: direct Google Generative AI (original implementation)
// ---------------------------------------------------------------------------
let googleFallback = null;
if (GOOGLE_API_KEY) {
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  googleFallback = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  console.log("🔄 Google Gemini text generation ready (gemini-2.5-flash-lite)");
}

// ---------------------------------------------------------------------------
// Normalize ANY input format into OpenAI messages array
//
// The codebase uses 3 distinct calling patterns:
//
//   Pattern 1 (String):   textGenModel.generateContent("prompt text")
//   Pattern 2 (Array):    textGenModel.generateContent([{text: "..."}, {inlineData: {...}}])
//   Pattern 3 (Object):   textGenModel.generateContent({contents: [{role: "user", parts: [{text: "..."}]}]})
//
// This function handles ALL three and converts to OpenAI messages format.
// ---------------------------------------------------------------------------
function normalizeToMessages(input) {
  // Pattern 3: Object with `contents` array (Gemini native format)
  if (input && typeof input === "object" && !Array.isArray(input) && input.contents) {
    return input.contents.map((contentItem) => {
      const role = contentItem.role === "model" ? "assistant" : (contentItem.role || "user");
      const parts = contentItem.parts || [];
      const contentParts = [];

      for (const part of parts) {
        if (part.text) {
          contentParts.push({ type: "text", text: part.text });
        } else if (part.inlineData) {
          contentParts.push({
            type: "image_url",
            image_url: {
              url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
            },
          });
        }
      }

      // If only one text part, simplify to plain string content
      if (contentParts.length === 1 && contentParts[0].type === "text") {
        return { role, content: contentParts[0].text };
      }

      return { role, content: contentParts };
    });
  }

  // Pattern 2: Array of parts [{text: "..."}, {inlineData: {...}}]
  if (Array.isArray(input)) {
    const contentParts = [];
    for (const part of input) {
      if (part.text) {
        contentParts.push({ type: "text", text: part.text });
      } else if (part.inlineData) {
        contentParts.push({
          type: "image_url",
          image_url: {
            url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
          },
        });
      }
    }

    // If only text parts, simplify
    if (contentParts.length === 1 && contentParts[0].type === "text") {
      return [{ role: "user", content: contentParts[0].text }];
    }

    return [{ role: "user", content: contentParts }];
  }

  // Pattern 1: Plain string
  return [{ role: "user", content: String(input) }];
}

// ---------------------------------------------------------------------------
// generateContent via OpenRouter
// ---------------------------------------------------------------------------
async function generateContentViaOpenRouter(input, opts = {}) {
  const messages = normalizeToMessages(input);

  const completion = await openRouterClient.chat.completions.create({
    model: opts.model || UTILITY_MODEL,
    messages,
    // A deck of real slide copy does not fit in 4096 tokens. It gets cut
    // mid-JSON, the parser then retries at a lower temperature, and the
    // result reads as "the AI writes short, generic slides".
    max_tokens: opts.maxTokens || 4096,
    ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
  });

  const responseText = completion.choices?.[0]?.message?.content || "";

  // Return in the same shape the rest of the codebase expects:
  //   result.response.candidates[0].content.parts[0].text
  return {
    response: {
      candidates: [
        {
          content: {
            parts: [{ text: responseText }],
          },
        },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// generateContent via direct Google fallback
// ---------------------------------------------------------------------------
async function generateContentViaGoogle(input, opts = {}) {
  if (!googleFallback) {
    throw new Error("Google Gemini fallback not configured");
  }
  if (opts.model && opts.model !== UTILITY_MODEL) {
    // The direct Google client is pinned to one small model, so a quality
    // request landing here is degraded. Say so rather than fail silently.
    console.warn("Quality request fell back to gemini-2.5-flash-lite - output will be weaker");
  }
  return await googleFallback.generateContent(input);
}

// ---------------------------------------------------------------------------
// Main generateContent – tries OpenRouter first, falls back to Google
// ---------------------------------------------------------------------------
async function generateContent(input, opts = {}) {
  if (openRouterClient) {
    try {
      return await generateContentViaOpenRouter(input, opts);
    } catch (err) {
      console.error("⚠️  OpenRouter request failed:", err.message);
      if (googleFallback) {
        console.log("🔄 Falling back to direct Google Gemini...");
        return await generateContentViaGoogle(input, opts);
      }
      throw err;
    }
  }

  // No OpenRouter key – use Google directly
  return await generateContentViaGoogle(input, opts);
}

module.exports = {
  /** Cheap tier. Classification, extraction, prompt tidying. */
  textGenModel: { generateContent },

  /**
   * Quality tier, for anything a user reads. Same interface, so a caller
   * switches by swapping the import.
   */
  qualityGenModel: {
    generateContent: (input, opts = {}) =>
      generateContent(input, { model: QUALITY_MODEL, maxTokens: 16000, ...opts }),
  },

  QUALITY_MODEL,
  UTILITY_MODEL,
};
