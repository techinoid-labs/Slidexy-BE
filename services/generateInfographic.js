const { textGenModel} = require("../utils/geminiModels");
const { generateImageWithRetry } = require("../utils/runwareImageGen");

const generateImageFromPrompt = async (prompt) => {
  try {
    const imageUrl = await generateImageWithRetry(prompt, {
    width: 1344,
      height: 768,
      steps: 25,
      CFGScale: 7,
      negativePrompt: "text, watermark, signature, letters, words, blurry, low quality, distorted",
      model: "runware:100@1",
    }, 2);

    if (!imageUrl) {
      throw new Error("No image URL returned from Runware");
    }

    return imageUrl;
  } catch (error) {
    console.error("Error generating image from prompt:", error);
    throw new Error(`Failed to generate image: ${error.message}`);
  }
};

const generateInfographicFromText = async (text) => {
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
        slideObj.image_url = await generateImageFromPrompt(slide.imagePrompt);
        slideObj.image_caption = slide.imagePrompt;
      } catch {
        slideObj.image_url = null;
        slideObj.image_caption = "";
      }
    }

    slides.push(slideObj);
  }

  return { slides };
};

module.exports = { generateInfographicFromText };
