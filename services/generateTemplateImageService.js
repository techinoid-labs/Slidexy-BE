const { imageGenLimiter } = require("../utils/limiter");
const { imageGenModel } = require("../utils/geminiModels");

const BASE_CANVAS_WIDTH = 960;
const BASE_CANVAS_HEIGHT = 540;

async function generateTemplateImageService(
  prompt,
  slideId,
  { slide, element: el, theme }
) {
  try {
    let imgWidth, imgHeight, purpose;

    const topicOfImage = `Main topic the Image should be about: ${slide.slide_title}`;
    let slideJson = JSON.stringify(slide, null, 2);

    if (el?.element_type === "image") {
      const { width, height } = el.properties || {};
      imgWidth = width || 300;
      imgHeight = height || 200;
      purpose = `
      Inline image element.
      dimensions: ${imgWidth}x${imgHeight}
      ${topicOfImage}

      Look at this below structure and understand that this structure is the slide where this image will need to be used as an inner element image of a slide in the image_url field, so based on the elements which will be placed on the slide canvas above the background image based on x and y positions the generated image should be detailed and have relevant image or any graphics, visual or picture like image for any object relevant to the topic (example if the topic is on lion king then generate a relevant image related to Lion king) DO NOT TAKE THE EXAMPLE LITERALLY AND ALWAYS GENERATE LION KING RELATED IMAGE.

      object structure for the slide: {
          ${slideJson}
      }
      `;
    } else {
      imgWidth = BASE_CANVAS_WIDTH;
      imgHeight = BASE_CANVAS_HEIGHT;
      purpose = `
      Full background image.
      dimensions: ${imgWidth}x${imgHeight}
      ${topicOfImage}

      Look at this below structure and understand that this structure is the slide where this image will need to be used as a background in the image_url field, so based on the elements which will be placed on the slide canvas above the background image based on x and y positions the generated background image should be detailed and have relevant image or any graphics, visual or picture like image for any object relevant to the topic (example if the topic is on lion king then generate a relevant image related to Lion king) DO NOT TAKE THE EXAMPLE LITERALLY AND ALWAYS GENERATE LION KING RELATED IMAGE, it should also take into account the positions of the elements so the generated visuals do not overlap behind the elements too much and should be visible, some shapes might be full canvas dimensions but will be lower opacity so they should not be a problem

      object structure for the slide: {
          ${slideJson}
      }
      `;
    }

    let finalPrompt = `
Follow these rules strictly as they are MANDATORY:

1. The topic of the image should be based on this prompt: ${topicOfImage}, ABSOLUTELY NO TEXT DATA INSIDE THE IMAGE.
2. Canvas size: exactly ${imgWidth}x${imgHeight} pixels. Do not stretch or crop.
3. MANDATORY RULE: **Never include any text in the image. No slide titles, bullet points, or any textual content. Use only relevant visual elements like patterns, diagrams, icons, or abstract visuals, but can be any object as well for example if the topic is surrounding cars then we can add cars or if a story then we can also add an image of the character as well. This rule has no exceptions.**
4. Ensure clarity and readability of all slide elements on top of this image.
5. Do not include any sort of text on any image it is a big and very strict rule that should be followed always
6. Use the following theme for consistency:
   - Font: ${theme?.font || 'Inter'}
   - Primary Color: ${theme?.primaryColor || '#2A2A2A'}
   - Secondary Color: ${theme?.secondaryColor || '#7F8C8D'}
   - Background Color: ${theme?.backgroundColor || '#F8F8F8'}
   - Text Color: ${theme?.textColor || '#111111'}

You are an expert presentation template designer of the modern era 2025 to be precise and you should know what types of designs are relevant to the current time (think Gamma.ai or SlidesGo) and must generate **pixel-perfect, fully detailed templates usable images** so you will absolutely not generate some old style design of a presentation template from 10-20 years ago like from 2006 it should be very modern and design driven with modern design patterns with up-to-date year 2025 standards, it should be something Users would find very appealing.

Purpose of the image: ${purpose}.
`;

    const response = await imageGenLimiter.schedule(() =>
      imageGenModel.generateContent({
        contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      })
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

    const fallback = `https://placehold.co/${
      el?.properties?.width || BASE_CANVAS_WIDTH
    }x${el?.properties?.height || BASE_CANVAS_HEIGHT}?text=Image+Unavailable`;

    if (!el || el.element_type !== "image") {
      slide.image_url = fallback;
    }
    return fallback;
  }
}

module.exports = { generateTemplateImageService };