// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Centralized list of your API keys (store in .env)
const apiKeys = [
  process.env.API_KEY1,
  process.env.API_KEY2,
  process.env.API_KEY3,
  process.env.API_KEY4,
  process.env.API_KEY5,
  process.env.API_KEY6,
  process.env.API_KEY7,
  process.env.API_KEY8,
  process.env.API_KEY9,
  process.env.API_KEY10,
  process.env.API_KEY11,
  process.env.API_KEY12,
].filter(Boolean); // filter out undefined

// const genAI = new GoogleGenerativeAI(
//   process.env.API_KEY
// );

if (apiKeys.length === 0) {
  throw new Error("No API keys configured!");
}

let currentKeyIndex = 0;

/**
 * Get the next key in round-robin order
 */
function getNextKey() {
  const key = apiKeys[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
  return key;
}

/**
 * Wrapper for generating content with key rotation on 429 errors.
 */
async function safeGenerateContent(modelName, config, tried = new Set()) {
  const key = getNextKey();

  // Prevent infinite loops if all keys have been tried
  if (tried.has(key)) {
    throw new Error("All API keys exhausted or rate-limited.");
  }
  tried.add(key);

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: modelName });

    const response = await model.generateContent(config);
    return response;
  } catch (error) {
    if (
      error.statusCode === 429 ||
      (error.message && error.message.includes("429"))
    ) {
      console.warn(`Quota exceeded for key: ${key}. Rotating to next key...`);
      return await safeGenerateContent(modelName, config, tried); // try next key
    }
    throw error;
  }
}
function createModelWrapper(modelName) {
  return {
    async generateContent(config) {
      // Ensure config contains `contents`
      if (!config.contents) {
        throw new Error("generateContent config must include contents");
      }
      return await safeGenerateContent(modelName, config);
    },
  };
}

// Expose models
const textGenModel = {
  generateContent: (config) => safeGenerateContent("gemini-2.0-flash", config),
};

const imageGenModel = {
  generateContent: (config) =>
    safeGenerateContent("gemini-2.0-flash-preview-image-generation", config),
};

module.exports = { textGenModel, imageGenModel, safeGenerateContent };
