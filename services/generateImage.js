const { imageGenLimiter } = require("../utils/limiter");
const { imageGenModel } = require("../utils/geminiModels");
const { GridFSBucket } = require("mongodb");
const crypto = require("crypto");
const connectMongo = require("../db");

async function saveImageToGridFS(db, base64, filename) {
  if (!base64) return null;

  const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  const ext = matches ? matches[1].split("/")[1] : "png";
  const data = matches ? matches[2] : base64;

  const buffer = Buffer.from(data, "base64");

  return new Promise((resolve, reject) => {
    try {
      const bucket = new GridFSBucket(db, { bucketName: "slides" });
      const uploadStream = bucket.openUploadStream(`${filename}.${ext}`, {
        contentType: `image/${ext}`,
      });

      uploadStream.end(buffer);
      uploadStream.on("finish", () => resolve(uploadStream.id));
      uploadStream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}

async function generateImage(slide, index) {
  try {
    const db = await connectMongo();
    const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";

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

    // ✅ Save image into GridFS
    const fileId = await saveImageToGridFS(db, imageBase64, `slide_${crypto.randomUUID()}`);

    return {
      ...slide,
      image_url: `${API_BASE_URL}/images/${fileId}`, // GridFS URL
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
