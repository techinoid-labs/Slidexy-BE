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
    description:
      "Generate a high-resolution, complex, and aesthetically-pleasing vertical poster or banner template with a sophisticated and appealing design. The visual theme and color palette should be intricately and clearly related to the topic.",
    topicPlaceholder: "${topic}",
    requirements: {
      noText:
        "The image must not contain any text, letters, numbers, or words of any kind.",
      contentPlaceholders:
        "All content placeholders must be abstract, dynamic, and visually interesting shapes and boxes.",
      leftSectionDesign:
        "The left section of the template should feature a visually complex with a nuanced color palette, inspired by the provided image.",
    },
    layoutDetails: {
      composition: "The template must be a single vertical composition.",
      rightSideSections: {
        arrangement: "Several distinct, stacked horizontal sections.",
        backgroundColor:
          "The background color of each section should be a different, carefully chosen, muted pastel shade that contributes to the overall aesthetic.",
      },
      rightSidePlaceholders: {
        type: "Visually prominent circular placeholder.",
        content:
          "A sharp, clear, symbolic illustration that is abstract yet powerfully evocative of the topic.",
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
