const { imageGenLimiter } = require("../utils/limiter");
const { generateImageWithRetry } = require("../utils/runwareImageGen");

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

    ${presentationThemePrompt.outputDetails.jsonFormat}
    ${presentationThemePrompt.outputDetails.colorAndFontMatching}
  `;

  let imageUrl;
  try {
    imageUrl = await imageGenLimiter.schedule(() =>
      generateImageWithRetry(prompt, {
        width: 1344,
      height: 768,
        steps: 30,
        CFGScale: 7.5,
        negativePrompt: "text, watermark, signature, letters, typography, words, readable content, blurry, low quality",
        model: "runware:100@1",
      }, 2)
    );
  } catch (error) {
    console.error("Error generating content for theme:", error);
    throw new Error("Failed to generate theme content from model.");
  }

  if (!imageUrl) {
    throw new Error("No image URL returned by Runware for theme generation.");
  }

  // Since Runware doesn't return JSON metadata with the image,
  // you'll need to generate theme metadata separately using your textGenModel
  // Here's an approach:
  
  const { textGenModel } = require("../utils/geminiModels");
  
  let themeData = {
    image_base64: imageUrl, // Store the URL or convert to base64 if needed
    font: "Inter",
    primaryColor: "#2A2A2A",
    secondaryColor: "#7F8C8D",
    backgroundColor: "#F8F8F8",
    textColor: "#111111",
  };

  // Generate color scheme and font using text model
  try {
    const metadataPrompt = `Based on this presentation theme: "${promptText}"
    
    Generate a JSON object with appropriate design choices:
    {
      "font": "font name (Google Fonts compatible)",
      "primaryColor": "#hexcolor",
      "secondaryColor": "#hexcolor", 
      "backgroundColor": "#hexcolor",
      "textColor": "#hexcolor"
    }
    
    Choose colors that match the theme. Output ONLY the JSON, no other text.`;

    const metadataResponse = await textGenModel.generateContent({
      contents: [{ role: "user", parts: [{ text: metadataPrompt }] }],
    });

    const metadataText = metadataResponse.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const match = metadataText.match(/\{[\s\S]*?\}/);
    
    if (match) {
      const json = JSON.parse(match[0]);
      themeData.font = json.font || themeData.font;
      themeData.primaryColor = json.primaryColor || themeData.primaryColor;
      themeData.secondaryColor = json.secondaryColor || themeData.secondaryColor;
      themeData.backgroundColor = json.backgroundColor || themeData.backgroundColor;
      themeData.textColor = json.textColor || themeData.textColor;
    }
  } catch (e) {
    console.warn("Failed to generate theme metadata, using defaults:", e.message);
  }

  // If you need base64 instead of URL, fetch and convert:
  if (imageUrl.startsWith('http')) {
    try {
      const fetch = require('node-fetch');
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.buffer();
      const base64 = imageBuffer.toString('base64');
      themeData.image_base64 = `data:image/png;base64,${base64}`;
    } catch (fetchError) {
      console.warn("Failed to convert URL to base64, keeping URL:", fetchError.message);
      // Keep the URL as is
    }
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
