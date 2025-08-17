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
    let imgWidth, imgHeight, purpose;

    const topicOfImage = `Main topic the Image should be about: ${slide.slide_title}`;

    // Decide background vs element image
    if (el?.element_type === "image") {
      // Inline image element
      const { width, height } = el.properties || {};
      imgWidth = width || 300; // fallback for inline images
      imgHeight = height || 200;
      purpose = `This image will be placed inside the slide as a decorative or content image element.
              - Image must not include any textual inside of it
`;
    } else {
      // Background image (for slide.image_url)
      imgWidth = BASE_CANVAS_WIDTH;
      imgHeight = BASE_CANVAS_HEIGHT;
      purpose = `
      This image will be used as the full background of the slide.
      - Image must not include any textual inside of it
      `;
    }

    let finalPrompt = `
You are an expert presentation template designer of the modern era 2025 to be precise and you should know what types of designs are relevant to the current time (think Gamma.ai or SlidesGo) and must generate **pixel-perfect, fully detailed templates** so you will absolutely not generate some old style design of a presentaion template form 10-20 years goo like form 2006 it should be very modern and design driver with update date year 2025 standards, it should be something Users would find very appealing.

So basically based on the above the image generated here should be very strictly relevant to what is needed based on the ${topicOfImage}

Structure where the images would be added

object structure for sldies: {
${slide}
}

Follow these rules strictly as they are mandatory:

1. The topic of the image should be based on this prompt: ${topicOfImage}
2. Canvas size: exactly ${imgWidth}x${imgHeight} pixels. Do not stretch or crop.
3. Purpose: ${purpose}
4. MANDATORY RULE: **Never include any text in the image. No slide titles, bullet points, or any textual content. Use only aesthetic, decorative, or relevant visual elements like patterns, diagrams, icons, or abstract visuals. This rule has no exceptions.**
5. Style: Use only relevant graphics, patterns, diagrams, icons, or abstract visuals that enhance the slide theme.
6. Color theme: Match the overall presentation aesthetic.
7. Ensure clarity and readability of all slide elements on top of this image.
8. Do not include any sort of text on any image it is a big and very strict rule that should be followed always
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

    // Background → update slide.image_url
    if (!el || el.element_type !== "image") {
      slide.image_url = `data:image/png;base64,${base64Data}`;
      return slide.image_url;
    }

    // Inline image element → return base64 so caller can assign to element
    return `data:image/png;base64,${base64Data}`;
  } catch (err) {
    console.error(`Error generating image for slide ${slideId}:`, err);
    return null;
  }
}

module.exports = { generateTemplateImageService };
