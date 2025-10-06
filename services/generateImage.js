const { imageGenLimiter } = require("../utils/limiter");
const { imageGenModel } = require("../utils/geminiModels");
const crypto = require("crypto");
const { uploadToSpaces, deleteFromSpaces } = require("../utils/s3Uploader");

function buildPrompt(slide, rawText = "") {
  const title = slide.slide_title?.text || slide.slide_title || "Untitled";
  const body = slide.body?.text || slide.body || "";
  let safeRawText =
    typeof rawText === "string" ? rawText : JSON.stringify(rawText, null, 2);
  const style =
    slide.imageStyle ||
    "professional, clean, 16:9 aspect ratio, modern slide illustration";

  return `
Create a text-free visual illustration only - NO TEXT ALLOWED.

Topic: "${title}"
Context: "${body}"
You must use this exact content to create the relevant text-free image for slides: CONTENT TO USE (do not ignore) Relevant content is marked between the triple backticks.:
\`\`\`
${safeRawText}
\`\`\`

CRITICAL REQUIREMENTS:
- Zero text, letters, numbers, words, labels, captions, titles, or any written content
- No logos, watermarks, signatures, or brand names
- Pure visual representation only
- Abstract concepts should be shown through symbols, metaphors, and visual elements
- Use colors, shapes, objects, and scenes to convey meaning
- Style: ${style}

VISUAL FOCUS:
- Create imagery that represents the concept through:
  * Relevant objects and symbols
  * Appropriate color schemes
  * Metaphorical representations
  * Scene compositions
  * Abstract visual elements

The image must tell the story purely through visual elements without any textual support.
`;
}

function buildAlternativePrompt(slide, rawText = "") {
  const title = slide.slide_title?.text || slide.slide_title || "Untitled";
  const body = slide.body?.text || slide.body || "";
  let safeRawText =
    typeof rawText === "string" ? rawText : JSON.stringify(rawText, null, 2);
  const style =
    slide.imageStyle ||
    "professional, clean, 16:9 aspect ratio, modern slide illustration";

  // Create more specific visual descriptions based on common topics
  const visualKeywords = extractVisualKeywords(title, body);

  return `
Generate a text-free illustration.

Visual Elements to Include: ${visualKeywords}
Style: ${style}
You must use this exact content to create the relevant text-free image for slides: CONTENT TO USE (do not ignore) Relevant content is marked between the triple backticks.:
\`\`\`
${safeRawText}
\`\`\`

Rules:
1. NO written content of any kind
2. Show concepts through:
   - Symbolic representations
   - Color associations  
   - Object compositions
   - Environmental scenes
   - Abstract patterns
3. Focus on visual storytelling without words
4. Clean, professional appearance
5. 16:9 aspect ratio suitable for presentations

Create pure visual content that communicates through imagery alone.
`;
}

function extractVisualKeywords(title, body) {
  const text = `${title} ${body}`.toLowerCase();

  // Define visual concept mappings
  const conceptMap = {
    business: "office buildings, graphs, handshakes, briefcases",
    technology: "circuits, gears, digital patterns, innovation symbols",
    growth: "ascending arrows, growing plants, expanding charts",
    success: "mountain peaks, trophies, celebration scenes",
    teamwork: "puzzle pieces, connected elements, collaboration",
    finance: "coins, charts, calculators, banking symbols",
    innovation: "lightbulbs, gears, creative sparks, modern designs",
    communication: "speech bubbles without text, connected nodes, networks",
    strategy: "chess pieces, pathways, planning layouts",
    security: "shields, locks, protection symbols",
  };

  let keywords = [];
  for (const [concept, visuals] of Object.entries(conceptMap)) {
    if (text.includes(concept)) {
      keywords.push(visuals);
    }
  }

  return keywords.length > 0
    ? keywords.join(", ")
    : "abstract professional symbols, clean geometric shapes";
}

async function generateImage(slide, index, rawText = "", planResponseType) {
  try {
    if (planResponseType === "predefined") {
      const fallback = `https://placehold.co/960x540?text=Image+Quota+Reached+-+Using+Placeholder`;
      return {
        ...slide,
        image_url: fallback,
        image_caption: "Placeholder image (trial image quota reached)",
      };
    }

    let prompt = slide.imagePrompt || buildPrompt(slide, rawText);
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      try {
        // Use alternative prompt on retry
        if (attempts === 1) {
          prompt = buildAlternativePrompt(slide, rawText);
          console.log(
            `Retry attempt ${attempts} for slide ${index} with alternative prompt`
          );
        }

        // Call Gemini with rate-limiter
        const response = await imageGenLimiter.schedule(() =>
          imageGenModel.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"], // Model requires both TEXT and IMAGE
              candidateCount: 1,
              // Additional parameters to discourage text
              temperature: 0.7,
              topP: 0.8,
            },
          })
        );

        // Extract base64 image from first valid candidate
        let imageBase64 = null;
        const candidates = response.response.candidates || [];

        for (const candidate of candidates) {
          const parts = candidate?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith("image/")) {
              imageBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              break;
            }
          }
          if (imageBase64) break;
        }

        if (!imageBase64) {
          throw new Error("No image data returned by model");
        }

        // Upload to Spaces
        const key = `slide_${crypto.randomUUID()}`;
        let fileUrl;

        try {
          fileUrl = await uploadToSpaces(imageBase64, key);
        } catch (uploadErr) {
          console.error(`Upload failed for slide ${index}:`, uploadErr.message);
          if (key) await deleteFromSpaces(key);
          throw uploadErr;
        }

        return {
          ...slide,
          image_url: fileUrl,
          image_caption: "",
          generation_attempt: attempts + 1,
        };
      } catch (attemptErr) {
        attempts++;
        console.error(
          `Attempt ${attempts} failed for slide ${index}:`,
          attemptErr.message
        );

        if (attempts >= maxAttempts) {
          throw attemptErr;
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  } catch (err) {
    console.error(`Failed to generate image for slide ${index}:`, err.message);
    const fallback = `https://placehold.co/960x540?text=Image+Unavailable`;
    return {
      ...slide,
      image_url: fallback,
      image_caption: "Image unavailable (quota exceeded or error)",
    };
  }
}

module.exports = { generateImage };
