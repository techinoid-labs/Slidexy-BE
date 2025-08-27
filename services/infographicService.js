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

  const posterTemplatePrompt = {
    description: `Design a clean, vertical infographic-style poster template with four stacked sections. Each section must include an empty content block and a cartoon-style symbolic illustration. The sections should be connected visually with curved arrows to indicate a step-by-step or timeline progression. The overall design should be soft, friendly, modern, and directly reflect the topic "${topic}".`,

    requirements: {
      noText:
        "The image must not contain any text, letters, numbers, or placeholder words. No titles, labels, or numbered steps should be visible.",
      contentPlaceholders:
        "Each of the four sections must contain a pastel-colored content box or rectangle that is completely empty. These areas should be visually distinct and designed to hold text later, but must be blank in the generated image.",
      leftSectionDesign:
        "Use flowing, curved arrows or path connectors between each section to visually guide the viewer from top to bottom. Decorative accents like abstract shapes or light patterns may be included to enhance visual appeal, but avoid clutter. Maintain generous vertical spacing between sections.",
    },

    layoutDetails: {
      composition: "The template must be a single vertical infographic layout.",
      rightSideSections: {
        arrangement:
          "Four stacked content sections arranged vertically with consistent spacing and visual connectors between them.",
        backgroundColor:
          "Use soft, muted pastel shades (e.g., pale yellow, blush pink, lavender, mint) for each content box to distinguish them while maintaining a cohesive and friendly aesthetic.",
      },
      rightSidePlaceholders: {
        type: "Cartoon-style symbolic illustrations that relate directly to the topic.",
        content: `Each section should contain one stylized, symbolic illustration placed beside, above, or below the content box. Illustrations must visually represent the topic "${topic}" in a simplified and friendly way.

If the topic is environmental (e.g., air pollution), use symbols like factories, trees, lungs, wind, smog, or people in nature.

If the topic is technological, use icons like laptops, clouds, network diagrams, data flows, or secure locks.

All illustrations must be clear, unique per section, and styled consistently. Avoid realism—keep them minimal, modern, and visually appealing.`,
      },
    },
  };

  // Dynamically construct the prompt string from the JSON object.
  // This ensures the JSON is the single source of truth for the prompt's content.
  const promptText = `
    ${posterTemplatePrompt.description} The topic is: "${topic}".
    
    STRICT REQUIREMENTS:
    - ${posterTemplatePrompt.requirements.noText}
    - ${posterTemplatePrompt.requirements.contentPlaceholders}
    - ${posterTemplatePrompt.requirements.leftSectionDesign}
    - ${posterTemplatePrompt.requirements.resolution}

    Layout Details:
    - ${posterTemplatePrompt.layoutDetails.composition}
    - ${posterTemplatePrompt.layoutDetails.rightSideSections.arrangement}
    - ${posterTemplatePrompt.layoutDetails.rightSideSections.backgroundColor}
    - On the right side of each section, there must be a ${posterTemplatePrompt.layoutDetails.rightSidePlaceholders.type} containing a sharp, clear, symbolic illustration that is abstract yet powerfully evocative of the "${topic}".
  `;

  const response = await imageGenLimiter.schedule(() =>
    imageGenModel.generateContent({
      contents: [{ role: "user", parts: [{ text: promptText }] }],
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
