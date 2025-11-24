/**
 * Generate Infographic Service
 *
 * Now uses the new template-based V2 system as primary generator.
 * The V2 system provides:
 * - Automatic layout analysis based on content
 * - Template-based rendering (cards, timeline, comparison, etc)
 * - Consistent visual quality
 * - Multi-view support (landscape/portrait)
 * - Better error handling with retry logic
 *
 * Legacy support:
 * - Old generateInfographicFromText is preserved as generateInfographicFromTextLegacy
 * - Can be used via fallback if needed
 */

const infographicV2Service = require("./unit-services/generateInfographicV2Service");
const { textGenModel, imageGenModel } = require("../utils/geminiModels");

/**
 * MAIN: Generate infographic using V2 template-based system
 * @param {string} text - Topic/prompt for the infographic
 * @param {object} options - Optional parameters
 * @param {string} options.viewMode - 'landscape' (default) or 'portrait'
 * @returns {Promise<object>} { data, html, meta }
 */
const generateInfographicFromText = async (text, options = {}) => {
  try {
    const { viewMode = "landscape" } = options;

    console.log(`\n📊 [generateInfographic] Using V2 Template-Based System`);
    console.log(`📌 Topic: "${text.substring(0, 60)}..."`);
    console.log(`📱 View Mode: ${viewMode}\n`);

    // Use the new V2 template-based system
    const result = await infographicV2Service.generateInfographic(
      text,
      viewMode
    );

    // Return the result in the expected format
    return {
      html: result.html,
      data: result.data,
      meta: result.meta,
      success: true,
    };
  } catch (error) {
    console.error(
      `\n❌ [generateInfographic] V2 System Error: ${error.message}`
    );
    throw error;
  }
};

/**
 * Generate infographic with custom options
 * @param {string} text - Topic/prompt
 * @param {object} customOptions - Custom parameters
 * @returns {Promise<object>} Infographic result
 */
const generateInfographicWithOptions = async (text, customOptions = {}) => {
  return generateInfographicFromText(text, customOptions);
};

/**
 * Generate multiple view modes for the same topic
 * @param {string} text - Topic/prompt
 * @param {string[]} viewModes - Array of view modes ['landscape', 'portrait']
 * @returns {Promise<object>} { landscape, portrait, ... }
 */
const generateInfographicMultiView = async (
  text,
  viewModes = ["landscape", "portrait"]
) => {
  console.log(
    `\n📊 [generateInfographic] Generating multiple views for: "${text.substring(
      0,
      40
    )}..."\n`
  );

  return infographicV2Service.generateMultiView(text, viewModes);
};

/**
 * LEGACY: Old HTML generation method (preserved for backward compatibility)
 * @deprecated Use generateInfographicFromText instead
 */
const generateInfographicFromTextLegacy = async (text) => {
  const prompt = `
Convert this topic into an infographic slide deck with 4–6 slides.

Each slide should include:
- title
- bulletPoints (max 5)
- imagePrompt (for visual generation)

Topic: "${text}"

Return JSON:
[
  {
    "title": "Slide Title",
    "bulletPoints": ["...", "..."],
    "imagePrompt": "Visual prompt for image"
  }
]
`;

  const result = await textGenModel.generateContent(prompt);
  const response = await result.response;
  const raw = await response.text();

  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  const rawSlides = JSON.parse(cleaned);

  const slides = [];

  for (let i = 0; i < rawSlides.length; i++) {
    const slide = rawSlides[i];

    // Create normalized structure
    const slideObj = {
      slide_id: `slide-${i + 1}`,
      slide_title: {
        text: slide.title,
        konva_component: "Konva.Text",
        properties: {
          fontSize: 48,
          fontFamily: "Inter",
          fill: "#333",
          fontStyle: "bold",
          x: 0,
          y: 0,
        },
      },
      elements: (slide.bulletPoints || []).map((bp, idx) => ({
        element_type: "bullet_point",
        text: bp,
        konva_component: "Konva.Text",
        properties: {
          fontSize: 26,
          fontFamily: "Inter",
          fill: "#444",
          fontStyle: "normal",
          // x/y will be computed in frontend unless overridden
        },
      })),
      image_url: null,
      image_caption: "",
      visual_description: slide.imagePrompt ?? "",
      imagePrompt: slide.imagePrompt ?? "",
    };

    // Attempt to generate image
    if (slide.imagePrompt) {
      try {
        const imageResult = await imageGenModel.generateContent(
          slide.imagePrompt
        );
        const imageResponse = await imageResult.response;
        const mediaPart = imageResponse.candidates?.[0]?.content?.parts?.find(
          (part) => part.inline_data?.mime_type?.startsWith("image/")
        );
        if (mediaPart) {
          slideObj.image_url = `data:${mediaPart.inline_data.mime_type};base64,${mediaPart.inline_data.data}`;
          slideObj.image_caption = slide.imagePrompt;
        }
      } catch {
        slideObj.image_url = null;
        slideObj.image_caption = "";
      }
    }

    slides.push(slideObj);
  }

  return { slides };
};

module.exports = {
  generateInfographicFromText, // Main: V2 Template-Based
  generateInfographicWithOptions, // With custom options
  generateInfographicMultiView, // Generate multiple views
  generateInfographicFromTextLegacy, // Legacy: Old HTML generation
};
