const { textGenModel, imageGenModel } = require("../utils/geminiModels");

const generateImageFromPrompt = async (prompt) => {
  const result = await imageGenModel.generateContent(prompt);
  const response = await result.response;

  const mediaPart = response.candidates?.[0]?.content?.parts?.find((part) =>
    part.inline_data?.mime_type?.startsWith("image/")
  );

  if (!mediaPart) throw new Error("No image returned");

  return `data:${mediaPart.inline_data.mime_type};base64,${mediaPart.inline_data.data}`;
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
