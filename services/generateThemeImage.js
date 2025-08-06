const { imageGenLimiter } = require("../utils/limiter");
const { imageGenModel } = require("../utils/geminiModels");

const presentationThemePrompt = {
  description:
    "Generate a high-resolution, visually rich slide background with a clean, modern, and professional aesthetic. The design must be suitable for high-end presentation templates, drawing inspiration from platforms like Gamma AI, corporate branding, tech keynotes, and minimalist editorial layouts. Each theme should visually reflect the topic in a refined and sophisticated way, using thoughtful visual metaphors, balanced composition, and elegant abstraction. Designs must feel dynamic, premium, and presentation-ready.",

  slideFormatDetails: {
    aspectRatio: "16:9",
    dimensions: {
      width: 960,
      height: 540,
    },
    layoutComposition:
      "Design must accommodate dynamic placement of titles, bullet points, images, and shapes, with clear negative space or soft gradients ensuring clarity. Balance form and function: visuals should enhance, not distract from, content overlays.",
  },

  visualThemeAndColorPalette:
    'Curate the visual theme and color palette to harmoniously reflect the topic: "${promptText}". Use refined tones, elegant gradients, and contrast-aware color choices to subtly express the topic’s tone. The background should guide how font colors are chosen: If the background is dark, use light font colors (e.g., #FFFFFF, #F0F0F0). If the background is light, use dark font colors (e.g., #111111, #333333). This ensures high readability of titles and bullet points.',

  imageClarity:
    "The image must be crystal clear, rendered in high resolution (960x540), and polished with professional-grade quality, suitable for creative or corporate slide usage.",

  strictRequirements: {
    noText:
      "ABSOLUTELY DO NOT embed any visible text, phrases, words, typographic elements, or any form of readable characters into the background image. The background must be purely visual, using only color, abstract forms, gradients, or textures. All text (like titles and bullet points) will be added later via frontend overlay. If any text or readable characters are visible in the background, the result is INVALID.",

    layoutGuidance:
      "Design must smartly reserve content space. Ensure areas with soft gradients or clean negative space exist to support placement of headers, bullet points, and imagery.",
    composition:
      "Use a distinct and well-balanced visual strategy: bold focal points with soft text zones, asymmetry with clarity, abstract geometry or minimalist textures — each theme should feel unique and premium. Avoid repeating visual motifs. Ensure visual hierarchy: one area should hold interest (e.g., abstract element), and the other remain soft for content. Stay clean, not cluttered.",
    contentPlaceholders:
      "Subtly embed abstract symbols or soft-focus imagery to evoke the topic without competing with on-slide content. The focus is on supportive background, not literal representation.",
  },

  outputDetails: {
    jsonFormat:
      '**REQUIRED: Respond ONLY with a JSON block in the exact format shown below. DO NOT include any explanation or additional text outside the JSON block. DO NOT describe the image. This JSON will be parsed automatically.**\n```json\n{\n  "image_base64": "base64 image string (DO NOT populate this field, it will be handled separately by the system)",\n  "font": "FontName",\n  "primaryColor": "#xxxxxx",\n  "secondaryColor": "#xxxxxx",\n  "backgroundColor": "#xxxxxx",\n  "textColor": "#xxxxxx"\n}\n```',

    colorAndFontMatching:
      "Choose a modern, legible font such as Inter, Raleway, or Roboto to complement the visual style. Analyze the brightness of the backgroundColor and choose an appropriate textColor for legibility. Use light text colors (e.g., #FFFFFF, #EAEAEA) for dark backgrounds, and dark text colors (e.g., #111111, #333333) for light backgrounds. This textColor will be applied to all on-slide content, including titles and bullet points. Ensure the final colors and fonts feel elegant and intentional.",
  },
};

async function generateSingleTheme(promptText) {
  const generationConfig = {
    responseModalities: ["IMAGE", "TEXT"],
  };

  const safetySettings = [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
  ];

  const prompt = `
    ${presentationThemePrompt.description}
    ${presentationThemePrompt.visualThemeAndColorPalette.replace(
      /\${promptText}/g,
      promptText
    )}
    ${presentationThemePrompt.imageClarity}
    
    STRICT REQUIREMENTS:
    - ${presentationThemePrompt.strictRequirements.noText}
    - ${presentationThemePrompt.strictRequirements.layoutGuidance}
    - ${presentationThemePrompt.strictRequirements.composition}
    - ${presentationThemePrompt.strictRequirements.contentPlaceholders}
    - ${presentationThemePrompt.visualExamplesToAvoid}

    ${presentationThemePrompt.outputDetails.jsonFormat}
    ${presentationThemePrompt.outputDetails.colorAndFontMatching}
  `;

  let response;
  try {
    response = await imageGenLimiter.schedule(() =>
      imageGenModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings,
      })
    );
  } catch (error) {
    console.error("Error generating content for theme:", error);
    throw new Error("Failed to generate theme content from model.");
  }

  const candidates = response.response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("No candidates returned by model for theme generation.");
  }

  const parts = candidates[0]?.content?.parts;
  if (!parts) {
    throw new Error("No content parts returned by model for theme generation.");
  }

  let themeData = {
    image_base64: null,
    font: "Inter",
    primaryColor: "#2A2A2A",
    secondaryColor: "#7F8C8D",
    backgroundColor: "#F8F8F8",
    textColor: "#111111", // Default fallback
  };

  let imageMimeType = null;

  for (const part of parts) {
    if (
      part.inlineData &&
      typeof part.inlineData.mimeType === "string" &&
      part.inlineData.mimeType.startsWith("image/")
    ) {
      themeData.image_base64 = part.inlineData.data;
      imageMimeType = part.inlineData.mimeType;
    } else if (part.text) {
      try {
        const match = part.text.match(/\{[\s\S]*?\}/);
        if (match) {
          const json = JSON.parse(match[0]);
          themeData.font = json.font || themeData.font;
          themeData.primaryColor = json.primaryColor || themeData.primaryColor;
          themeData.secondaryColor =
            json.secondaryColor || themeData.secondaryColor;
          themeData.backgroundColor =
            json.backgroundColor || themeData.backgroundColor;
          themeData.textColor = json.textColor || themeData.textColor;

          if (json.image_base64 && !themeData.image_base64) {
            themeData.image_base64 = json.image_base64;
            imageMimeType = imageMimeType || "image/png";
          }
        } else {
          console.warn(
            "No JSON block found in text part for theme:",
            part.text
          );
        }
      } catch (e) {
        console.warn(
          "Failed to parse JSON part of theme metadata.",
          e,
          "Text content:",
          part.text
        );
      }
    }
  }

  if (themeData.image_base64 && imageMimeType) {
    themeData.image_base64 = `data:${imageMimeType};base64,${themeData.image_base64}`;
  } else {
    throw new Error(
      "No complete image data (base64 and MIME type) found in the model's response for the theme."
    );
  }

  return themeData;
}

async function generateMultipleThemes(promptText, count = 2) {
  const themePromises = Array.from({ length: count }, (_, i) =>
    generateSingleTheme(`${promptText} variant ${i + 1}`)
      .then((theme) => (theme?.image_base64 ? theme : null))
      .catch((err) => {
        console.warn(`Theme ${i + 1} failed:`, err.message);
        return null;
      })
  );

  const allResults = await Promise.all(themePromises);
  return allResults.filter(Boolean);
}

module.exports = {
  generateThemeImage: generateSingleTheme,
  generateMultipleThemes,
};
