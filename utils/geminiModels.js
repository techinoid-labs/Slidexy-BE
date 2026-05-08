const OpenAI = require("openai");

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GOOGLE_API_KEY = process.env.API_KEY1;

if (!OPENROUTER_API_KEY) {
  console.warn("⚠️  OPENROUTER_API_KEY not configured. Using Google Generative AI as primary.");
}

if (!GOOGLE_API_KEY && !OPENROUTER_API_KEY) {
  throw new Error("No API keys configured! Set API_KEY1 (Google) and/or OPENROUTER_API_KEY.");
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
async function generateContentViaOpenRouter(input) {
  const messages = normalizeToMessages(input);

  const completion = await openRouterClient.chat.completions.create({
    model: "google/gemini-2.5-flash-lite",
    messages,
    max_tokens: 4096,
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
async function generateContentViaGoogle(input) {
  if (!googleFallback) {
    throw new Error("Google Gemini fallback not configured");
  }
  return await googleFallback.generateContent(input);
}

// ---------------------------------------------------------------------------
// Main generateContent – tries OpenRouter first, falls back to Google
// ---------------------------------------------------------------------------
async function generateContent(input) {
  if (openRouterClient) {
    try {
      return await generateContentViaOpenRouter(input);
    } catch (err) {
      console.error("⚠️  OpenRouter request failed:", err.message);
      if (googleFallback) {
        console.log("🔄 Falling back to direct Google Gemini...");
        return await generateContentViaGoogle(input);
      }
      throw err;
    }
  }

  // No OpenRouter key – use Google directly
  return await generateContentViaGoogle(input);
}

module.exports = {
  textGenModel: { generateContent },
};
