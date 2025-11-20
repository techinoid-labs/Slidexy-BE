const { imageGenLimiter } = require("../utils/limiter");
const { generateImageWithRetry } = require("../utils/runwareImageGen");

const BASE_CANVAS_WIDTH = 960;
const BASE_CANVAS_HEIGHT = 540;

async function generateTemplateImageService(slideId, { slide, element: el }) {
  try {
    let imgWidth, imgHeight, purpose;

    const topicOfImage = `Absolutely No Text should be embedded inside the generated Image but the image should be related to the main topic and the Image should be about: ${slide.slide_title} and image should describe the actual topic`;
    let slideJson = JSON.stringify(slide, null, 2);

    if (el?.element_type === "image") {
      const { width, height } = el.properties || {};
      imgWidth = width || 300;
      imgHeight = height || 200;
      purpose = `
      Inline image element.
      dimensions: ${imgWidth}x${imgHeight}
      ${topicOfImage}

      `;
    } else {
      imgWidth = BASE_CANVAS_WIDTH;
      imgHeight = BASE_CANVAS_HEIGHT;
      purpose = `
      Full background image.
      dimensions: ${imgWidth}x${imgHeight}
      ${topicOfImage}

   
      `;
    }

    let finalPrompt = `
You are an expert interprater wo canwho can understand detailed or simple instructions and create relevant images on specific topics and adhear to rules defined especially the rule "NO TEXT, CHARACTER or other TEXTUAL data in the IMAGE"

Follow these rules strictly as they are MANDATORY:

STRICT RULES:
- Do not generate any words, letters, logos, captions, or text in any form.
- Do not simulate handwriting, fonts, signs, or user interface screenshots.
- The image must be 100% text-free.
- The image must only contain objects, scenery, patterns, characters, objects or illustrations.

1. MANDATORY RULE: **Never include any text in the image. No slide titles, bullet points, or any textual content. Use only relevant visual elements like patterns, diagrams, icons, or abstract visuals, but can be any object as well for example if the topic is surrounding cars then we can add cars or if a story then we can also add an image of the character as well. This rule has no exceptions.**
2. The topic of the image should be based on this prompt: ${topicOfImage}, ABSOLUTELY NO TEXT DATA INSIDE THE IMAGE.
3. Image size: exactly ${imgWidth}x${imgHeight} pixels. Do not stretch or crop.
4. Ensure clarity and readability of all slide elements on top of this image.
5. Do not include any sort of text data inside of any image it is a big and very strict rule that should be followed always!

"IMPORTANT BELOW"
*Purpose of the image:* ${purpose}.
`;

    const response = await imageGenLimiter.schedule(() =>
      generateImageWithRetry(finalPrompt, {
        width: 1344,
      height: 768,
        steps: 25,
        CFGScale: 7,
        negativePrompt: "text, watermark, signature, letters, words, blurry, low quality",
        model: "runware:100@1",
      }, 2)
    );

    let base64Data = null;
    const parts = response.response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        base64Data = part.inlineData.data;
        break;
      }
    }

    if (!base64Data) throw new Error("No image data returned by model");

    const dataUrl = `data:image/png;base64,${base64Data}`;

    if (!el || el.element_type !== "image") {
      slide.image_url = dataUrl;
      return dataUrl;
    }
    return dataUrl;
  } catch (err) {
    console.error(
      `⚠️ Error generating image for slide ${slideId}:`,
      err.message
    );

    const fallback = `https://placehold.co/${el?.properties?.width || BASE_CANVAS_WIDTH
      }x${el?.properties?.height || BASE_CANVAS_HEIGHT}?text=Image+Unavailable`;

    if (!el || el.element_type !== "image") {
      slide.image_url = fallback;
    }
    return fallback;
  }
}

module.exports = { generateTemplateImageService };
