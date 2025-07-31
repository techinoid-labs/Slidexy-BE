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
Create a high-quality poster design with detailed and artistic visual elements strictly positioned around the **four corners** of the poster canvas. 
The illustrations and decorations should be related to the topic: "${topic}".

🟩 BLANK CENTER:
- Keep the entire center area completely blank or minimal.
- Do NOT place any text, graphics, logos, or illustrations in the center.

🔲 EDGE PLACEMENT:
- Focus all visual elements only in the four corners of the image.
- Leave the edges between corners light or empty.

🎨 STYLE:
- Use a modern, artistic, and clean design style.
- Avoid adding title text or labels — only visual design.

Output should be visually balanced and suitable as a poster background with corner visuals only.
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
