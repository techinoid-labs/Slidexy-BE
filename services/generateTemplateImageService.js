// // const { imageGenLimiter } = require("../utils/limiter");
// // const { imageGenModel } = require("../utils/geminiModels");

// // const BASE_CANVAS_WIDTH = 960;
// // const BASE_CANVAS_HEIGHT = 540;

// // async function generateTemplateImageService(
// //   prompt,
// //   slideId,
// //   { slide, element: el }
// // ) {
// //   try {
// //     let imgWidth, imgHeight, purpose;

// //     const topicOfImage = `Main topic the Image should be about: ${slide.slide_title}`;

// //     // Decide background vs element image
// //     if (el?.element_type === "image") {
// //       // Inline image element
// //       const { width, height } = el.properties || {};
// //       imgWidth = width || 300; // fallback for inline images
// //       imgHeight = height || 200;
// //       purpose = `This image will be placed inside the slide as a decorative or content image element.
// //               - Image must not include any textual inside of it
// // `;
// //     } else {
// //       // Background image (for slide.image_url)
// //       imgWidth = BASE_CANVAS_WIDTH;
// //       imgHeight = BASE_CANVAS_HEIGHT;
// //       purpose = `
// //       This image will be used as the full background of the slide.
// //       - Image must not include any textual inside of it
// //       `;
// //     }

// //     let finalPrompt = `
// // You are an expert presentation template designer of the modern era 2025 to be precise and you should know what types of designs are relevant to the current time (think Gamma.ai or SlidesGo) and must generate **pixel-perfect, fully detailed templates** so you will absolutely not generate some old style design of a presentaion template form 10-20 years goo like form 2006 it should be very modern and design driver with update date year 2025 standards, it should be something Users would find very appealing.

// // So basically based on the above the image generated here should be very strictly relevant to what is needed based on the ${topicOfImage}

// // IMPORTANT NOTE: Generated images needs to be precisely based on the underleying topic and theme not just basic stuff or minimalist graphics and needs to match what the ${topicOfImage} is talking about.

// // Structure where the images would be added

// // object structure for sldies: {
// // ${slide}
// // }

// // Follow these rules strictly as they are mandatory:

// // 1. The topic of the image should be based on this prompt: ${topicOfImage}
// // 2. Canvas size: exactly ${imgWidth}x${imgHeight} pixels. Do not stretch or crop.
// // 3. Purpose: ${purpose}
// // 4. MANDATORY RULE: **Never include any text in the image. No slide titles, bullet points, or any textual content. Use only aesthetic, decorative, or relevant visual elements like patterns, diagrams, icons, or abstract visuals. This rule has no exceptions.**
// // 5. Style: Use only relevant graphics, patterns, diagrams, icons, or abstract visuals that enhance the slide theme.
// // 6. Color theme: Match the overall presentation aesthetic.
// // 7. Ensure clarity and readability of all slide elements on top of this image.
// // 8. Do not include any sort of text on any image it is a big and very strict rule that should be followed always
// // `;

// //     // Call the image generation API
// // const response = await imageGenLimiter.schedule(() =>
// //   imageGenModel.generateContent({
// //     contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
// //     generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
// //   })
// // );

// //     // Extract base64 image
// //     let base64Data = null;
// //     const parts = response.response.candidates?.[0]?.content?.parts || [];
// //     for (const part of parts) {
// //       if (part.inlineData?.mimeType?.startsWith("image/")) {
// //         base64Data = part.inlineData.data;
// //         break;
// //       }
// //     }

// //     if (!base64Data) throw new Error("No image data returned by model");

// //     // Background → update slide.image_url
// //     if (!el || el.element_type !== "image") {
// //       slide.image_url = `data:image/png;base64,${base64Data}`;
// //       return slide.image_url;
// //     }

// //     // Inline image element → return base64 so caller can assign to element
// //     return `data:image/png;base64,${base64Data}`;
// //   } catch (err) {
// //     console.error(`Error generating image for slide ${slideId}:`, err);
// //     return null;
// //   }
// // }

// // module.exports = { generateTemplateImageService };

// const { imageGenLimiter } = require("../utils/limiter");
// const { imageGenModel } = require("../utils/geminiModels");

// const BASE_CANVAS_WIDTH = 960;
// const BASE_CANVAS_HEIGHT = 540;

// async function generateTemplateImageService(
//   prompt,
//   slideId,
//   { slide, element: el }
// ) {
//   try {
//     let imgWidth, imgHeight, purpose;

//     const topicOfImage = `Main topic the Image should be about: ${slide.slide_title}`;

//     if (el?.element_type === "image") {
//       const { width, height } = el.properties || {};
//       imgWidth = width || 300;
//       imgHeight = height || 200;
//       purpose = "Inline image element (decorative/content). No text inside.";
//     } else {
//       imgWidth = BASE_CANVAS_WIDTH;
//       imgHeight = BASE_CANVAS_HEIGHT;
//       purpose = "Full background image. No text inside.";
//     }

//     let finalPrompt = `
// You are an expert presentation template designer of the modern era 2025 to be precise and you should know what types of designs are relevant to the current time (think Gamma.ai or SlidesGo) and must generate **pixel-perfect, fully detailed templates** so you will absolutely not generate some old style design of a presentaion template form 10-20 years goo like form 2006 it should be very modern and design driver with update date year 2025 standards, it should be something Users would find very appealing.

// So basically based on the above the image generated here should be very strictly relevant to what is needed based on the following prompt ${topicOfImage}

// IMPORTANT NOTE: Generated images needs to be precisely based on the underleying topic and theme not just basic stuff or minimalist graphics and needs to match what the ${topicOfImage} is talking about, Image can be of anything relavent, not only something minimalist or aesthetic only can be anything but should be relevant to the information provided.

// Structure where the images would be added

// object structure for sldies: {
// ${slide}
// }

// Follow these rules strictly as they are mandatory:

// 1. The topic of the image should be based on this prompt: ${topicOfImage}, NO TEXT DATA INSIDE
// 2. Canvas size: exactly ${imgWidth}x${imgHeight} pixels. Do not stretch or crop.
// 3. Purpose: ${purpose}
// 4. MANDATORY RULE: **Never include any text in the image. No slide titles, bullet points, or any textual content. Use only relevant visual elements like patterns, diagrams, icons, or abstract visuals, but can be any object as well for example if the topic is surrounding cars then we can add cars or if a story then we can also add an image of the character as well. This rule has no exceptions.**
// 5. Ensure clarity and readability of all slide elements on top of this image.
// 6. Do not include any sort of text on any image it is a big and very strict rule that should be followed always
// `;

//     const response = await imageGenLimiter.schedule(() =>
//       imageGenModel.generateContent({
//         contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
//         generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
//       })
//     );

//     let base64Data = null;
//     const parts = response.response.candidates?.[0]?.content?.parts || [];
//     for (const part of parts) {
//       if (part.inlineData?.mimeType?.startsWith("image/")) {
//         base64Data = part.inlineData.data;
//         break;
//       }
//     }

//     if (!base64Data) throw new Error("No image data returned by model");

//     const dataUrl = `data:image/png;base64,${base64Data}`;

//     if (!el || el.element_type !== "image") {
//       slide.image_url = dataUrl;
//       return dataUrl;
//     }
//     return dataUrl;
//   } catch (err) {
//     console.error(
//       `⚠️ Error generating image for slide ${slideId}:`,
//       err.message
//     );

//     // ✅ fallback: return placeholder
//     const fallback = `https://placehold.co/${
//       el?.properties?.width || BASE_CANVAS_WIDTH
//     }x${el?.properties?.height || BASE_CANVAS_HEIGHT}?text=Image+Unavailable`;

//     if (!el || el.element_type !== "image") {
//       slide.image_url = fallback;
//     }
//     return fallback;
//   }
// }
// module.exports = { generateTemplateImageService };
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
    let slideJson = JSON.stringify(slide, null, 2);
 
    if (el?.element_type === "image") {
      const { width, height } = el.properties || {};
      imgWidth = width || 300;
      imgHeight = height || 200;
      purpose = `
     
      Inline image element.
      dimensions: ${imgWidth}x${imgHeight}
     ${topicOfImage}
 
      Look at this below structure and understand that this structure is the slide where this image will need to be used as an inner element image of a slide in the image_url field, so based on the elements which will be placed on the slide canvas above the background image based on x and y positions the generated image should be detailed and have relavent image or any graphics, visual or picture like image for any object relevant to the topic (example if the topic is on lion king then generate a relevant image related to Lion king) DO NOT TAKE THE EXAMPLE LITERALLY AND ALWAYS GENERATE LION KING REALTED IMAGE.
     
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
 
      Look at this below structure and understand that this structure is the slide where this image will need to be used as a background in the image_url field, so based on the elements which will be placed on the slide canvas above the background image based on x and y positions the generated background image should be detailed and have relavent image or any graphics, visual or picture like image for any object relevant to the topic (example if the topic is on lion king then generate a relevant image related to Lion king) DO NOT TAKE THE EXAMPLE LITERALLY AND ALWAYS GENERATE LION KING REALTED IMAGE, it should also take into account the positions of the elemtns so the generated visuals do not overlap behind the elements too much and should be visible, some shapes might be full canvas dimensions but will be lower opacity so they should not be a problem
     
      object structure for the slide: {
          ${slideJson}
          }
      `;
    }
 
    let finalPrompt = `
Follow these rules strictly as they are MANDATORY:
 
1. The topic of the image should be based on this prompt: ${topicOfImage},ABSOLUTELY NO TEXT DATA INSIDE THE IMAGE.
2. Canvas size: exactly ${imgWidth}x${imgHeight} pixels. Do not stretch or crop.
3. MANDATORY RULE: **Never include any text in the image. No slide titles, bullet points, or any textual content. Use only relevant visual elements like patterns, diagrams, icons, or abstract visuals, but can be any object as well for example if the topic is surrounding cars then we can add cars or if a story then we can also add an image of the character as well. This rule has no exceptions.**
4. Ensure clarity and readability of all slide elements on top of this image.
5. Do not include any sort of text on any image it is a big and very strict rule that should be followed always
 
You are an expert presentation template designer of the modern era 2025 to be precise and you should know what types of designs are relevant to the current time (think Gamma.ai or SlidesGo) and must generate **pixel-perfect, fully detailed templates usable images** so you will absolutely not generate some old style design of a presentaion template form 10-20 years ago like form 2006 it should be very modern and design driven with modern design patterns with update date year 2025 standards, it should be something Users would find very appealing.
 
 
Purpose of the image: ${purpose}.
 
`;
 
    // console.log(finalPrompt);
 
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
 
    // below is for testing and no image output
    // const dataUrl = !base64Data
    //   ? `data:image/png;base64,${base64Data}`
    //   : `https://placehold.co/${el?.properties?.width || BASE_CANVAS_WIDTH}x${
    //       el?.properties?.height || BASE_CANVAS_HEIGHT
    //     }?text=Image+Unavailable`;
 
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
 
    // ✅ fallback: return placeholder
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