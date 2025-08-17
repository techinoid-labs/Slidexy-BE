const { imageGenLimiter } = require("../utils/limiter");
const { imageGenModel } = require("../utils/geminiModels");

const BASE_CANVAS_WIDTH = 960;
const BASE_CANVAS_HEIGHT = 540;

async function generateTemplateImageService(
  prompt,
  slideId,
  { slide, element: el }
) {
  try {
    const { width, height } = el.properties || {};
    const imgWidth = width || BASE_CANVAS_WIDTH;
    const imgHeight = height || BASE_CANVAS_HEIGHT;

    let finalPrompt = `
You are generating a professional, modern presentation image. Follow these rules strictly:

1. Canvas size: exactly ${imgWidth}x${imgHeight} pixels. Do not stretch or crop.
2. Purpose: This image is a background or decorative element for a slide. 
3. MANDATORY RULE: **Never include any text in the image. No slide titles, bullet points, or any textual content. Use only aesthetic, decorative, or relevant visual elements like patterns, diagrams, icons, or abstract visuals. This rule has no exceptions.**
4. Avoid overlapping or interfering with any existing text, shapes, or other slide elements.
`;

    // Handle full-canvas avoid areas
    const isFullCanvas =
      imgWidth === BASE_CANVAS_WIDTH && imgHeight === BASE_CANVAS_HEIGHT;

    if (isFullCanvas && slide) {
      const avoidAreas = [];

      // Include title
      if (slide.slide_title?.text) {
        const p = slide.slide_title.properties || {};
        avoidAreas.push({
          x: p.x || 0,
          y: p.y || 0,
          w: p.width || 0,
          h: p.height || 0,
        });
      }

      // Include all text & shape elements
      (slide.elements || []).forEach((sEl) => {
        if (["text", "bullet_point", "shape"].includes(sEl.element_type)) {
          const p = sEl.properties || {};
          avoidAreas.push({
            x: p.x || 0,
            y: p.y || 0,
            w: p.width || 0,
            h: p.height || 0,
          });
        }
      });

      if (avoidAreas.length > 0) {
        const avoidDesc = avoidAreas
          .map((a) => `x:${a.x}px→${a.x + a.w}px, y:${a.y}px→${a.y + a.h}px`)
          .join("; ");
        finalPrompt += `
Important: Keep these areas visually simple. Do not place any text or elements here that could interfere with slide content: ${avoidDesc}.`;
      }
    }

    // Add creative instructions for the image
    finalPrompt += `
5. Content style: Use only relevant graphics, patterns, diagrams, icons, or abstract visuals that enhance the slide theme.
6. Color theme: Match the overall presentation aesthetic.
7. Full-slide images (≈960x540) must be purely visual, without any text.
8. Ensure clarity and readability of all slide elements on top of this image.
`;

    // Call the image generation API
    const response = await imageGenLimiter.schedule(() =>
      imageGenModel.generateContent({
        contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      })
    );

    // Extract base64 image
    let base64Data = null;
    const parts = response.response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        base64Data = part.inlineData.data;
        break;
      }
    }

    if (!base64Data) throw new Error("No image data returned by model");

    return `data:image/png;base64,${base64Data}`;
  } catch (err) {
    console.error(`Error generating image for element ${slideId}:`, err);
    return null;
  }
}

module.exports = { generateTemplateImageService };
