// const { GoogleGenerativeAI } = require("@google/generative-ai");

// const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// const textGenModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
// const imageGenModel = genAI.getGenerativeModel({
//   model: "gemini-2.0-flash-preview-image-generation",
// });

// module.exports = { textGenModel, imageGenModel };

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// const { GoogleGenerativeAI } = require("@google/generative-ai");

// // Centralized list of your API keys
// // You should store these securely (e.g., in a .env file)
// const apiKeys = [
//   process.env.API_KEY1,
//   // process.env.API_KEY2,
//   // process.env.API_KEY3,
//   // process.env.API_KEY4,
// ];

// let currentKeyIndex = 0;

// // This function manages the key rotation and retries for a single API call
// async function safeGenerateContent(modelName, config) {
//   for (let i = 0; i < apiKeys.length; i++) {
//     const currentKey = apiKeys[currentKeyIndex];
//     if (!currentKey) {
//       console.error(`Missing API key at index ${currentKeyIndex}.`);
//       break; // Exit the loop if a key is not defined
//     }

//     try {
//       const genAI = new GoogleGenerativeAI(currentKey);
//       const model = genAI.getGenerativeModel({ model: modelName });

//       const response = await model.generateContent(config);
//       return response; // Success! Return the response
//     } catch (error) {
//       if (
//         error.statusCode === 429 ||
//         (error.message && error.message.includes("429"))
//       ) {
//         console.warn(
//           `Quota exceeded for key ${
//             currentKeyIndex + 1
//           }. Rotating to next key...`
//         );
//         currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length; // Rotate the key
//       } else {
//         // Re-throw any other type of error
//         throw error;
//       }
//     }
//     console.log({ currentKey });
//   }

//   // If the loop completes, all keys have been exhausted
//   throw new Error("Image quotas have been exhausted for the day.");
// }

// // Create a proxy object for each model that will handle the logic internally
// const textGenModel = {
//   generateContent: (config) => safeGenerateContent("gemini-2.0-flash", config),
//   // If you need other methods (e.g., generateContentStream), add them here:
//   // generateContentStream: (config) => safeGenerateContent("gemini-2.0-flash", config, "stream")
// };

// const imageGenModel = {
//   generateContent: (config) =>
//     safeGenerateContent("gemini-2.0-flash-preview-image-generation", config),
// };

// module.exports = { textGenModel, imageGenModel };

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

// Expose models
const textGenModel = {
  generateContent: (config) => safeGenerateContent("gemini-2.0-flash", config),
};

const imageGenModel = {
  generateContent: (config) =>
    safeGenerateContent("gemini-2.0-flash-preview-image-generation", config),
};

module.exports = { textGenModel, imageGenModel };
