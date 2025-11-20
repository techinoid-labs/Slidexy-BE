const { generateImageWithRetry } = require("../utils/runwareImageGen");
const { imageGenLimiter } = require("../utils/limiter");

async function generateImageSuggestions(prompt, count) {
  const imageUrls = [];

  for (let i = 0; i < count; i++) {
    console.log(`Scheduling image generation for suggestion ${i + 1}...`);

    try {
      const imageUrl = await imageGenLimiter.schedule(() =>
        generateImageWithRetry(prompt, {
         width: 1344,
      height: 768,
          steps: 25,
          CFGScale: 7,
          negativePrompt: "text, watermark, signature, letters, words, blurry, low quality, distorted",
          model: "runware:100@1",
        }, 1) // 1 retry for suggestions
      );

      if (imageUrl) {
        imageUrls.push(imageUrl);
        console.log(`✓ Generated suggestion image ${i + 1}`);
      }
    } catch (error) {
      console.error(`Failed to generate suggestion ${i + 1}:`, error.message);
      // Continue to next image even if one fails
    }
  }

  return imageUrls;
}

module.exports = { generateImageSuggestions };
