// const { imageGenLimiter } = require("../utils/limiter");
// const { imageGenModel } = require("../utils/geminiModels");

// async function generateImage(slide, index) {
//   const prompt =
//     slide.imagePrompt ||
//     `Generate a high-quality image for "${slide.slide_title.text}"...`;
//   const response = await imageGenLimiter.schedule(() =>
//     imageGenModel.generateContent({
//       contents: [{ role: "user", parts: [{ text: prompt }] }],
//       generationConfig: {
//         responseModalities: ["IMAGE", "TEXT"],
//       },
//     })
//   );

//   let imageUrl = null;
//   const parts = response.response.candidates?.[0]?.content?.parts || [];
//   for (const part of parts) {
//     if (part.inlineData?.mimeType?.startsWith("image/")) {
//       imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
//     }
//   }

//   return {
//     ...slide,
//     image_url: imageUrl,
//     image_caption: "",
//   };
// }

// module.exports = { generateImage };

const { imageGenLimiter } = require("../utils/limiter");
const { imageGenModel } = require("../utils/geminiModels");

async function generateImage(slide, index) {
  try {
    const prompt =
      slide.imagePrompt ||
      `Generate a high-quality image based on the following topic or information: "${
        slide.slide_title?.text || slide.slide_title
      } " Absolutely do not include any text data in the image`;

    const response = await imageGenLimiter.schedule(() =>
      imageGenModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
        },
      })
    );

    let imageUrl = null;
    const parts = response.response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      throw new Error("No image data returned by model");
    }

    return {
      ...slide,
      image_url: imageUrl,
      image_caption: "",
    };
  } catch (err) {
    console.error(
      `⚠️ Failed to generate image for slide ${index}:`,
      err.message
    );

    // ✅ fallback placeholder
    const width = 960;
    const height = 540;
    const fallback = `https://placehold.co/${width}x${height}?text=Image+Unavailable`;

    return {
      ...slide,
      image_url: fallback,
      image_caption: "⚠️ Image unavailable (quota exceeded or error)",
    };
  }
}

module.exports = { generateImage };
