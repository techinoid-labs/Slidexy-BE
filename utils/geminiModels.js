const OpenAI = require("openai");

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GOOGLE_API_KEY = process.env.API_KEY1;

if (!OPENROUTER_API_KEY && !GOOGLE_API_KEY) {
  throw new Error("No API keys configured! Set OPENROUTER_API_KEY or API_KEY1.");
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
  console.log("✅ OpenRouter client initialized (model: google/gemini-2.5-flash)");
}

// ---------------------------------------------------------------------------
// Fallback: direct Google Generative AI (original implementation)
// ---------------------------------------------------------------------------
let googleFallback = null;
if (GOOGLE_API_KEY) {
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  googleFallback = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  console.log("🔄 Google Gemini fallback ready");
}

// ---------------------------------------------------------------------------
// generateContent adapter – keeps the SAME interface the rest of the codebase
// expects:
//   const result = await textGenModel.generateContent(promptOrParts);
//   const text   = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;
// ---------------------------------------------------------------------------
async function generateContentViaOpenRouter(input) {
  // Build the user message from the input (string or multipart array)
  let userContent;

  if (typeof input === "string") {
    userContent = input;
  } else if (Array.isArray(input)) {
    // Multipart: [{text: "..."}, {inlineData: {data, mimeType}}]
    const parts = [];
    for (const part of input) {
      if (part.text) {
        parts.push({ type: "text", text: part.text });
      } else if (part.inlineData) {
        parts.push({
          type: "image_url",
          image_url: {
            url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
          },
        });
      }
    }
    userContent = parts;
  } else {
    userContent = String(input);
  }

  const completion = await openRouterClient.chat.completions.create({
    model: "google/gemini-2.5-flash",
    messages: [
      {
        role: "user",
        content: userContent,
      },
    ],
    max_tokens: 16384,
  });

  const responseText = completion.choices?.[0]?.message?.content || "";

  // Return in the same shape that the rest of the codebase expects
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
