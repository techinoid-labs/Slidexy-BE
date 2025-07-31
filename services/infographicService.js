const { imageGenLimiter } = require("../utils/limiter");
const { imageGenModel } = require("../utils/geminiModels");

/**
 * Generates a poster with visuals in the four corners and maps given content paragraphs to each zone.
 *
 * @param {string} topic - The topic to generate poster visuals for.
 * @param {string[]} paragraphs - Array of up to 5 paragraphs (top-left, top-right, bottom-left, bottom-right, center).
 * @returns {Promise<{ imageUrl: string, textLayout: object }>}
 */
async function generatePosterTemplateWithContent(topic, paragraphs = []) {
  if (!topic) throw new Error("Topic is required.");

  const posterTemplatePrompt = `
Design a **high-resolution**, **photo-realistic** poster layout for the topic "${topic}".

Layout Instructions:
- Keep the center area completely blank and white for editable text.
- Add small, creative **visual clusters only in the four corners**:
  - 🔹 Top-left
  - 🔹 Top-right
  - 🔹 Bottom-left
  - 🔹 Bottom-right
- Each corner should reflect the topic visually but avoid clutter.
- No images or patterns outside of corners.
- Do NOT include any text in the visuals. Only image design.
- The center must remain empty — clean background only.

Style:
- Modern, artistic, high-quality.
- Clean white center.
- Vivid visuals in corners only.
`;

  const response = await imageGenLimiter.schedule(() =>
    imageGenModel.generateContent({
      contents: [{ role: "user", parts: [{ text: posterTemplatePrompt }] }],
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
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
    throw new Error("No image found in Gemini response.");
  }

  // Map paragraphs to locations
  const locations = [
    "topLeft",
    "topRight",
    "bottomLeft",
    "bottomRight",
    "center",
  ];
  const textLayout = {};

  paragraphs.slice(0, 5).forEach((text, i) => {
    textLayout[locations[i]] = text;
  });

  return { imageUrl, textLayout };
}

module.exports = { generatePosterTemplateWithContent };
