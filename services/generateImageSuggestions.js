const { imageGenModel } = require("../utils/geminiModels");
const { imageGenLimiter } = require("../utils/limiter");

async function generateImageSuggestions(prompt, count) {
  const imageUrls = [];

  for (let i = 0; i < count; i++) {
    console.log(`Scheduling image generation for suggestion ${i + 1}...`);

    const imageResponse = await imageGenLimiter.schedule(() =>
      imageGenModel.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      })
    );

    const responseParts =
      imageResponse.response.candidates?.[0]?.content?.parts;
    if (responseParts) {
      for (const part of responseParts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith("image/")) {
          imageUrls.push(
            `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
          );
          break;
        }
      }
    }
  }

  return imageUrls;
}

module.exports = { generateImageSuggestions };
