const { imageGenLimiter } = require("../utils/limiter");
const { imageGenModel } = require("../utils/geminiModels");
const crypto = require("crypto");
const { uploadToSpaces, deleteFromSpaces } = require("../utils/s3Uploader");

function buildPrompt(slide) {
  const title = slide.slide_title?.text || slide.slide_title || "Untitled";
  const body = slide.body?.text || slide.body || "";
  const style =
    slide.imageStyle ||
    "professional, clean, 16:9 aspect ratio, modern slide illustration";

  return `
You are creating an illustration for a presentation slide.

Topic: "${title}"
Details/context: "${body}"

Guidelines:
- Generate a ${style} image.
- The image should be highly relevant to the topic and context.
- Avoid text, numbers, letters, watermarks, or logos.
- Focus on clarity, professionalism, and visual appeal.
`;
}

async function generateImage(slide, index) {
  try {
    const prompt = slide.imagePrompt || buildPrompt(slide);

    // Call Gemini with rate-limiter
    const response = await imageGenLimiter.schedule(() =>
      imageGenModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
          candidateCount: 2, // request multiple candidates for higher chance of relevance
        },
      })
    );

    // Extract base64 image from first valid candidate
    let imageBase64 = null;
    const candidates = response.response.candidates || [];
    for (const candidate of candidates) {
      const parts = candidate?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith("image/")) {
          imageBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
      if (imageBase64) break;
    }

    if (!imageBase64) {
      throw new Error("No image data returned by model");
    }

    // Upload to Spaces
    const key = `slide_${crypto.randomUUID()}`;
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
