const { imageGenLimiter } = require("../utils/limiter");
const { imageGenModel } = require("../utils/geminiModels");
const crypto = require("crypto");
const { uploadToSpaces, deleteFromSpaces } = require("../utils/s3Uploader");

async function generateImage(slide, index) {
  try {
    const prompt =
      slide.imagePrompt ||
      `Generate a high-quality image based on the following topic or information: "${slide.slide_title?.text || slide.slide_title
      }" Absolutely do not include any text data in the image.`;

    // Call Gemini with rate-limiter
    const response = await imageGenLimiter.schedule(() =>
      imageGenModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
        },
      })
    );

    // Extract base64 image
    let imageBase64 = null;
    const parts = response.response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        imageBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageBase64) {
      throw new Error("No image data returned by model");
    }


    const key = `slide_${crypto.randomUUID()}.png`;
    let fileUrl;
    try {
      fileUrl = await uploadToSpaces(imageBase64, key);
    } catch (uploadErr) {
      console.error(`Upload failed for slide ${index}:`, uploadErr.message);
      if (key) await deleteFromSpaces(key);
      throw uploadErr;
    }

    return { ...slide, image_url: fileUrl, image_caption: "" };
  } catch (err) {
    console.error(`Failed to generate image for slide ${index}:`, err.message);

    const fallback = `https://placehold.co/960x540?text=Image+Unavailable`;
    return {
      ...slide,
      image_url: fallback,
      image_caption: "Image unavailable (quota exceeded or error)",
    };
  }
}

module.exports = { generateImage };
