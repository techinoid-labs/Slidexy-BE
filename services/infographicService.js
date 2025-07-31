const { imageGenLimiter } = require("../utils/limiter");
const { imageGenModel } = require("../utils/geminiModels");

/**
 * Generates a dynamic poster template image with visual chunks around the corners
 * related to a provided topic, and a blank central space for editable text.
 *
 * @param {string} topic - The topic for which to generate related visual elements in the corners.
 * @returns {Promise<string>} The URL (base64 or direct URI) of the generated image.
 */

async function generatePosterTemplateImage(topic) {
  if (!topic) {
    throw new Error("Topic is required for poster generation.");
  }

  const posterTemplatePrompt = `
Design a **high-resolution**, **photo-realistic**, and visually appealing **poster or vertical banner background**.

🎯 TOPIC:
- All visuals should be based on the topic: "${topic}".
- Use detailed, realistic, and artistic illustrations or photo-based elements.

📐 LAYOUT:
- Keep the entire **center area completely blank** — do NOT place any text, artwork, patterns, or background fills in the center.
- The central area should be visually clean (white or light background), and intended for **editable text** or user content.

🖼️ CORNER IMAGE PLACEMENT:
- Place small **clusters or blocks of visuals ONLY in the four corners**:
  - 🔹 Top-left
  - 🔹 Top-right
  - 🔹 Bottom-left
  - 🔹 Bottom-right
- Each corner should have a compact, balanced group of related images or tiles.
- Do **not** place images along the side edges, top edge, or bottom edge — **only in the corners**.

🎨 STYLE:
- Use a **modern**, **3D**, and **photo-realistic** design style.
- Make visuals vivid, sharp, and creative — but localized to the corners only.
- Do not add any title text or labels — the design should serve as a background.

📸 QUALITY:
- Render at high resolution with sharp detail, realistic lighting, and artistic composition.
- Make sure the poster looks clean, professional, and perfect for overlaying custom text in the center.

🧠 IMPORTANT:
- Do **not** fill the entire poster with artwork.
- **Only decorate the four corners** — keep the rest of the canvas blank and clean.

The final design should look like a **polished poster template** with small, creative visual clusters in the top-left, top-right, bottom-left, and bottom-right corners — and a **blank, editable center**.
`;



  // Logging for debugging
  console.log("🚀 Generating poster for topic:", topic);
  console.log("📝 Prompt being sent:\n", posterTemplatePrompt);

  const response = await imageGenLimiter.schedule(() =>
    imageGenModel.generateContent({
      contents: [{ role: "user", parts: [{ text: posterTemplatePrompt }] }],
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
    } else if (part.imageUri) {
      imageUrl = part.imageUri;
      break;
    }
  }

  if (!imageUrl) {
    throw new Error(
      `No image data or URI found in the Gemini API response for topic "${topic}".`
    );
  }

  console.log("✅ Image generated successfully.");
  return imageUrl;
}

module.exports = { generatePosterTemplateImage };
