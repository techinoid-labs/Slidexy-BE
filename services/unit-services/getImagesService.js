const { generateTemplateImageService } = require("../generateTemplateImageService");
const crypto = require("crypto");
const { textGenModel } = require("../../utils/geminiModels");
const JSON5 = require("json5");
const { uploadToSpaces, deleteFromSpaces } = require("../../utils/s3Uploader");

async function getImagesService(topic, titles, meta = {}) {
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

  let imageData;
  try {
    imageData = JSON5.parse(jsonString);
  } catch (err) {
    throw new Error("Failed to parse image data from AI");
  }

  const slidesImages = [];
  const fallback = (w, h, text = "Image Unavailable") =>
    `https://placehold.co/${w}x${h}?text=${encodeURIComponent(text)}`;

  for (let i = 0; i < titles.length; i++) {
    const slideData =
      imageData[i] || { backgroundDesc: `Placeholder for ${titles[i]}`, elementDescs: [] };

    let bgUrl = fallback(960, 540);
      try {
         const bgBase64 = await generateTemplateImageService(crypto.randomUUID(), {
           slide: { slide_title: titles[i], description: slideData.backgroundDesc },
           element: null,
         });
   
         if (bgBase64) {
           bgKey = `background_${crypto.randomUUID()}.png`;
           bgUrl = await uploadToSpaces(bgBase64, bgKey);
         }
       } catch (err) {
         console.error(`Background failed for slide ${i}:`, err.message);
         if (bgKey) await deleteFromSpaces(bgKey); 
       }

    // Element images
    const elementImages = [];
     for (const desc of slideData.elementDescs) {
          let elUrl = fallback(300, 200);
          let elKey = null;
    
          try {
            const elBase64 = await generateTemplateImageService(crypto.randomUUID(), {
              slide: { slide_title: titles[i] },
              element: { description: desc, properties: { width: 300, height: 200 } },
            });
    
            if (elBase64) {
              elKey = `element_${crypto.randomUUID()}.png`;
              elUrl = await uploadToSpaces(elBase64, elKey);
            }
          } catch (err) {
            console.error(`Element failed for slide ${i}:`, err.message);
            if (elKey) await deleteFromSpaces(elKey);
          }
    
          elementImages.push({
            konva_component: "Konva.Image",
            element_type: "image",
            properties: {
              imageSrc: elUrl,
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
      image_url: bgUrl,
      image_caption: slideData.caption || `Visual for ${titles[i]}`,
      elementImages,
    });
  }

  return slidesImages;
}

module.exports = { getImagesService };
