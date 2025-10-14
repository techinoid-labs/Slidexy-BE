const { imageGenLimiter } = require("../utils/limiter");
const { imageGenModel, textGenModel } = require("../utils/geminiModels");
const crypto = require("crypto");
const { uploadToSpaces, deleteFromSpaces } = require("../utils/s3Uploader");

async function generateArtKnowledge(slide, rawText = "") {
  const title = slide.slide_title?.text || slide.slide_title || "Untitled";
  const subtitle = slide.subtitle?.text || "";
  const theme = slide.knowledge?.theme || "General";
  const characterType = slide.knowledge?.characterType || "professionals";
  
  let safeRawText = typeof rawText === "string" ? rawText : JSON.stringify(rawText, null, 2);

  // Enhanced Art Base with character focus
  const artBase = {
    styles: [
      "modern flat illustration with characters",
      "corporate illustration style",
      "friendly tech illustration",
      "professional scene illustration",
      "business narrative illustration"
    ],
    sceneTypes: [
      "office collaboration scene",
      "presentation meeting",
      "brainstorming session",
      "team working together",
      "professional consulting",
      "digital workspace"
    ],
    characterPoses: [
      "discussing at whiteboard",
      "working on laptops",
      "presenting charts",
      "team huddle",
      "analyzing data",
      "collaborative planning"
    ],
    colorSchemes: {
      business: ["#2c3e50", "#3498db", "#e74c3c", "#f39c12"],
      technology: ["#667eea", "#764ba2", "#f093fb", "#4facfe"],
      education: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A"],
      health: ["#06d6a0", "#118ab2", "#073b4c", "#ef476f"],
      finance: ["#264653", "#2a9d8f", "#e76f51", "#f4a261"],
      creative: ["#ff006e", "#8338ec", "#3a86ff", "#fb5607"],
      default: ["#6c5ce7", "#00b894", "#fdcb6e", "#e17055"]
    }
  };

  // Detect color scheme
  const topicLower = (title + " " + safeRawText).toLowerCase();
  let colorScheme = artBase.colorSchemes.default;
  for (const [key, colors] of Object.entries(artBase.colorSchemes)) {
    if (topicLower.includes(key)) {
      colorScheme = colors;
      break;
    }
  }

  const artJson = JSON.stringify(artBase, null, 2);

  const artPrompt = `
Based on slide content:
- Title: "${title}"
- Subtitle: "${subtitle}"
- Theme: "${theme}"
- Character Type: "${characterType}"
- Context: \`\`\`${safeRawText.slice(0, 300)}\`\`\`

Using ART BASE: ${artJson}

Generate specific art direction JSON:
- style: Choose from styles (match topic)
- sceneDescription: Detailed scene (2-3 sentences) with character count, poses, and setting
- characterDetails: Array of 2-4 character descriptions (ethnicity, role, attire)
- colorPalette: 4-5 hex colors
- mood: "professional", "innovative", "collaborative", etc.
- composition: "center-focused", "left-to-right", "triangular", etc.

Output ONLY JSON:
{
  "style": "...",
  "sceneDescription": "...",
  "characterDetails": ["...", "..."],
  "colorPalette": ["#...", "#...", "#...", "#..."],
  "mood": "...",
  "composition": "..."
}`;

  try {
    const artResult = await textGenModel.generateContent(artPrompt);
    const artRaw = artResult.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const artCleaned = artRaw.replace(/```json|```/g, "").trim();
    const firstBracket = artCleaned.indexOf("{");
    const lastBracket = artCleaned.lastIndexOf("}");
    
    if (firstBracket === -1 || lastBracket === -1) {
      throw new Error("No JSON in art knowledge");
    }
    
    const parsed = JSON.parse(artCleaned.slice(firstBracket, lastBracket + 1));
    
    // Validate and add defaults
    return {
      style: parsed.style || "modern flat illustration with characters",
      sceneDescription: parsed.sceneDescription || `${characterType} in professional setting`,
      characterDetails: parsed.characterDetails || ["diverse professional 1", "diverse professional 2"],
      colorPalette: parsed.colorPalette || colorScheme,
      mood: parsed.mood || "professional",
      composition: parsed.composition || "center-focused"
    };
  } catch (err) {
    console.error("Art knowledge generation failed:", err);
    return {
      style: "modern flat illustration with characters",
      sceneDescription: `${characterType} collaborating in modern office setting with clean backgrounds`,
      characterDetails: [
        "diverse professional with laptop",
        "team member presenting",
        "colleague analyzing data"
      ],
      colorPalette: colorScheme,
      mood: "professional",
      composition: "center-focused"
    };
  }
}

function buildPrompt(slide, rawText = "", artKnowledge = {}) {
  const title = slide.slide_title?.text || slide.slide_title || "Untitled";
  const subtitle = slide.subtitle?.text || "";
  const visualSuggestion = slide.visual_suggestion || "";
  
  const {
    style = "modern flat illustration",
    sceneDescription = "professional scene",
    characterDetails = [],
    colorPalette = [],
    mood = "professional",
    composition = "center-focused"
  } = artKnowledge;

  const chars = characterDetails.join(", ");
  const colors = colorPalette.join(", ");

  return `
Create a high-quality illustration for a presentation slide.

CRITICAL REQUIREMENTS:
✓ Include 2-4 HUMAN CHARACTERS (no text, no labels)
✓ Characters must be clearly visible, well-defined, and professionally dressed
✓ Modern, clean illustration style (NOT abstract, NOT surreal)
✓ 16:9 aspect ratio (960x540px)

SCENE DETAILS:
Style: ${style}
Scene: ${sceneDescription}
Characters: ${chars}
Composition: ${composition} layout
Mood: ${mood}

COLOR PALETTE: ${colors}

TOPIC CONTEXT:
- Title: "${title}"
${subtitle ? `- Subtitle: "${subtitle}"` : ""}
- Visual theme: ${visualSuggestion}

ARTISTIC DIRECTION:
- Clean, professional illustration
- Characters should be diverse, realistic proportions
- Include relevant props (laptops, charts, whiteboards, documents)
- Modern office/workspace environment
- Soft shadows, good lighting
- Minimal background details (focus on characters)

FORBIDDEN:
✗ NO text, words, labels, letters, numbers
✗ NO abstract shapes without characters
✗ NO overly stylized/cartoon characters
✗ NO cluttered backgrounds

Goal: Professional presentation illustration with clear character focus.
`;
}

function buildAlternativePrompt(slide, rawText = "", artKnowledge = {}) {
  const title = slide.slide_title?.text || slide.slide_title || "Untitled";
  const {
    sceneDescription = "professional scene",
    characterDetails = [],
    colorPalette = [],
    mood = "professional"
  } = artKnowledge;

  return `
Generate a presentation-quality illustration with human characters.

MANDATORY ELEMENTS:
1. 3-4 diverse professional characters
2. Clear, modern illustration style (similar to Slack, Dropbox, Figma illustrations)
3. Professional setting relevant to: "${title}"
4. Clean, uncluttered composition
5. 16:9 landscape format

CHARACTER REQUIREMENTS:
- ${characterDetails[0] || "Professional in business attire"}
- ${characterDetails[1] || "Team member with laptop"}
- ${characterDetails[2] || "Colleague with documents"}

SCENE: ${sceneDescription}

COLOR SCHEME: ${colorPalette.join(", ")}

MOOD: ${mood}, approachable, modern

STYLE REFERENCE: Corporate illustration, flat design with depth, professional tech company style

NO TEXT OR LABELS - pure visual storytelling through characters and scene.
`;
}

async function generateImage(slide, index, rawText = "", planResponseType) {
  try {
    if (planResponseType === "predefined") {
      const fallback = `https://placehold.co/960x540/6c5ce7/ffffff?text=Slide+${index + 1}`;
      return {
        ...slide,
        image_url: fallback,
        image_caption: "Placeholder image (trial quota reached)",
      };
    }

    // Generate Art Knowledge
    const artKnowledge = await generateArtKnowledge(slide, rawText);
    console.log(`Art knowledge for slide ${index}:`, artKnowledge);

    let prompt = buildPrompt(slide, rawText, artKnowledge);
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      try {
        if (attempts === 1) {
          prompt = buildAlternativePrompt(slide, rawText, artKnowledge);
          console.log(`Retry ${attempts} for slide ${index} with alternative prompt`);
        }

        const response = await imageGenLimiter.schedule(() =>
          imageGenModel.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"],
              candidateCount: 1,
              temperature: 0.7,
              topP: 0.9,
            },
          })
        );

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
          throw new Error("No image data returned");
        }

        // Upload
        const key = `slide_${slide.slide_id || crypto.randomUUID()}_${Date.now()}.png`;
        let fileUrl;
        try {
          fileUrl = await uploadToSpaces(imageBase64, key);
          console.log(`Image uploaded for slide ${index}: ${fileUrl}`);
        } catch (uploadErr) {
          if (key) await deleteFromSpaces(key);
          throw uploadErr;
        }

        return {
          ...slide,
          image_url: fileUrl,
          image_caption: artKnowledge.sceneDescription || "",
          generation_attempt: attempts + 1,
          art_style: artKnowledge.style,
          art_palette: artKnowledge.colorPalette,
        };
      } catch (attemptErr) {
        attempts++;
        console.error(`Attempt ${attempts} failed for slide ${index}:`, attemptErr.message);
        if (attempts >= maxAttempts) {
          throw attemptErr;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  } catch (err) {
    console.error(`Failed to generate image for slide ${index}:`, err.message);
    const fallback = `https://placehold.co/960x540/6c5ce7/ffffff?text=Slide+${index + 1}`;
    return {
      ...slide,
      image_url: fallback,
      image_caption: "Image unavailable",
    };
  }
}

module.exports = { generateImage };