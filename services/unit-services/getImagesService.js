const { generateTemplateImageService } = require("../generateTemplateImageService");
const crypto = require("crypto");
const { textGenModel } = require("../../utils/geminiModels");
const JSON5 = require("json5");
const { GridFSBucket } = require("mongodb");
const connectMongo = require("../../db"); 


async function saveImageToGridFS(db, base64, filename) {
  if (!base64) return null;

  const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  const ext = matches ? matches[1].split("/")[1] : "png"; 
  const data = matches ? matches[2] : base64;

  return new Promise((resolve, reject) => {
    try {
      const bucket = new GridFSBucket(db, { bucketName: "slides" });
      const uploadStream = bucket.openUploadStream(`${filename}.${ext}`, {
        contentType: `image/${ext}`,
      });

      uploadStream.end(Buffer.from(data, "base64"));

      uploadStream.on("finish", () => resolve(uploadStream.id));
      uploadStream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}

async function getImagesService(topic, titles, meta = {}) {
  const db = await connectMongo(); // 👈 fetch global db

  const prompt = `
You are a visual designer for 2025 presentations (Canva/Gamma: high-res, abstract, no text in images, modern aesthetics like gradients/subtle patterns).
For topic "${topic}" and slide titles ${JSON.stringify(titles)}, generate:
- One background description per slide (for full 960x540 canvas, no text, thematic).
- 1-3 element image descriptions per slide (smaller accents, e.g., 300x200, related visuals).

Output ONLY JSON array of objects: 
[{backgroundDesc: "desc", elementDescs: ["desc1", "desc2"], caption: "short caption"}, ...]
One object per slide.
  `;

  const result = await textGenModel.generateContent(prompt);
  let cleaned = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  const jsonString = cleaned.slice(start, end + 1);
  const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";
  let imageData;

  try {
    imageData = JSON5.parse(jsonString);
  } catch (err) {
    throw new Error("Failed to parse image data from AI");
  }

  const slidesImages = [];
  for (let i = 0; i < titles.length; i++) {
    const slideData =
      imageData[i] || { backgroundDesc: `Placeholder for ${titles[i]}`, elementDescs: [] };

    // Background (save to GridFS)
    const bgBase64 = await generateTemplateImageService(crypto.randomUUID(), {
      slide: { slide_title: titles[i], description: slideData.backgroundDesc },
      element: null,
    });

    const bgFileId = bgBase64
      ? await saveImageToGridFS(db, bgBase64, `background_${crypto.randomUUID()}`)
      : null;

    // Element images
    const elementImages = [];
    for (const desc of slideData.elementDescs) {
      const elBase64 = await generateTemplateImageService(crypto.randomUUID(), {
        slide: { slide_title: titles[i] },
        element: { description: desc, properties: { width: 300, height: 200 } },
      });

      let elFileId = null;
      if (elBase64) {
        elFileId = await saveImageToGridFS(db, elBase64, `element_${crypto.randomUUID()}`);
      }

      elementImages.push({
        konva_component: "Konva.Image",
        element_type: "image",
        properties: {
          imageSrc: elFileId ? `${API_BASE_URL}/images/${elFileId}` : null,
          x: 0,
          y: 0,
          width: 300,
          height: 200,
          cornerRadius: 15,
          zIndex: 10,
        },
      });
    }

    slidesImages.push({
      image_url: bgFileId ? `${API_BASE_URL}/images/${bgFileId}` : null,
      image_caption: slideData.caption || `Visual for ${titles[i]}`,
      elementImages,
    });
  }

  return slidesImages;
}

module.exports = { getImagesService };
