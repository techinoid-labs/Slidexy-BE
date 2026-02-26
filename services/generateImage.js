const { textGenModel } = require("../utils/geminiModels");
const crypto = require("crypto");
const sharp = require("sharp");
const axios = require("axios");
const { uploadToSpaces } = require("../utils/s3Uploader");
const { generateFluxImage } = require("../utils/generateFluxImage");
const { generateFallbackImage, generateWithGLM } = require("../services/fallbackImageGeneration");

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
if (!PEXELS_API_KEY) {
  console.error("PEXELS_API_KEY is not set in .env");
}

const PEXELS_BASE_URL = "https://api.pexels.com/v1";

// Simple in-memory tracking of recent requests (per hour)
const requestLog = [];
const MAX_REQUESTS_PER_HOUR = 190; // Stay under 200

function canMakeRequest() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const recent = requestLog.filter(t => t > oneHourAgo);
  return recent.length < MAX_REQUESTS_PER_HOUR;
}

function logRequest() {
  requestLog.push(Date.now());
  // Clean old entries
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  while (requestLog.length && requestLog[0] < oneHourAgo) requestLog.shift();
}

async function convertToWebP(base64Image) {
  const buffer = Buffer.from(base64Image.split(",")[1] || base64Image, "base64");
  const metadata = await sharp(buffer).metadata();

  let sharpInstance = sharp(buffer);
  const shouldResize = metadata.width < 1920 || metadata.height < 1080;
  if (shouldResize) {
    sharpInstance = sharpInstance.resize({
      width: 1920,
      height: 1088,
      fit: "cover",
      kernel: sharp.kernel.lanczos3,
    });
  }

  const webpBuffer = await sharpInstance
    .webp({ quality: 98, effort: 6 })
    .toBuffer();

  return `data:image/webp;base64,${webpBuffer.toString("base64")}`;
}

// Create a smaller WebP thumbnail (used for mobile / Flutter clients)
async function createThumbnailWebP(base64Image, width = 142, height = 160) {
  const buffer = Buffer.from(base64Image.split(",")[1] || base64Image, "base64");

  const webpBuffer = await sharp(buffer)
    .resize({
      width,
      height,
      fit: "cover",
      position: "center",
      kernel: sharp.kernel.lanczos3,
    })
    .webp({ quality: 95, effort: 6 })
    .toBuffer();

  return `data:image/webp;base64,${webpBuffer.toString("base64")}`;
}
async function searchPexelsPhotos(query, page = 1, perPage = 15) {
  if (!canMakeRequest()) {
    console.warn("Pexels rate limit near — skipping request");
    return null;
  }

  try {
    const response = await axios.get(`${PEXELS_BASE_URL}/search`, {
      headers: { Authorization: PEXELS_API_KEY },
      params: {
        query: query || "business presentation abstract",
        orientation: "landscape",
        size: "large",
        per_page: perPage,
        page,
      },
      timeout: 10000,
    });

    logRequest();
    return response.data;
  } catch (err) {
    console.error("Pexels search failed:", err.response?.data || err.message);
    return null;
  }
}

async function getPexelsFallbackImage({ query, index, slide }) {
  const searchQuery = query || slide.slide_title?.text || slide.topic || "professional presentation";

  // Try first page
  let data = await searchPexelsPhotos(searchQuery, 1, 30);
  if (!data || data.photos.length === 0) {
    // Fallback to curated if search gives nothing
    try {
      const curated = await axios.get(`${PEXELS_BASE_URL}/curated`, {
        headers: { Authorization: PEXELS_API_KEY },
        params: { per_page: 30, page: 1 },
        timeout: 10000,
      });
      logRequest();
      data = curated.data;
    } catch (e) {
      console.error("Pexels curated also failed");
      return null;
    }
  }

  if (!data || data.photos.length === 0) return null;

  // Pick a good photo (not too small, prefer large2x)
  const suitable = data.photos
    .filter(p => p.width >= 2000 || p.src.large2x)
    .sort((a, b) => b.width - a.width);

  const photo = suitable[0] || data.photos[0];

  return {
    image_url: photo.src.large2x || photo.src.large || photo.src.original,
    image_caption: photo.alt || `Photo by ${photo.photographer} on Pexels`,
    photographer: photo.photographer,
    pexels_url: photo.url,
    fallback_used: "pexels",
  };
}


// Enhanced art style definitions with clear character policies
const ART_STYLE_PROFILES = {
  "Concept Art": {
    needsCharacters: false,
    styleDesc:
      "Epic cinematic concept art masterpiece with dramatic volumetric lighting, atmospheric depth, intricate environmental details, and professional matte painting quality. Rich color grading, subtle fog effects, and compelling visual narrative through environment alone.",
    sceneElements: [
      "majestic architectural structures",
      "sweeping environmental vistas",
      "volumetric god rays",
      "layered atmospheric depth",
      "intricate surface details",
      "dramatic sky formations",
    ],
    technicalSpecs:
      "professional digital matte painting, 8K ultra resolution, cinematic color grading, atmospheric perspective, detailed textures, dramatic three-point lighting, depth of field bokeh",
  },
  "3D Render / CGI": {
    needsCharacters: false,
    styleDesc:
      "Ultra-photorealistic 3D CGI rendering with physically accurate ray-traced lighting, perfect material properties (metalness, roughness, subsurface scattering), crisp reflections, and studio-quality presentation. Showcases geometric precision and flawless surfaces.",
    sceneElements: [
      "pristine geometric architecture",
      "reflective glass and polished metal",
      "product-display pedestals",
      "minimalist modern interiors",
      "precision-engineered objects",
      "clean gradient backgrounds",
    ],
    technicalSpecs:
      "path-traced global illumination, PBR materials with 4K textures, anti-aliased edges, studio HDRI lighting, orthographic or perspective camera, 8K render quality, subtle ambient occlusion",
  },
  "Watercolor Illustration": {
    needsCharacters: false,
    styleDesc:
      "Delicate watercolor painting with translucent color washes, natural pigment bleeding, visible paper grain texture, soft wet-on-wet blending, and organic fluid movement. Ethereal quality with gentle color transitions and artistic spontaneity.",
    sceneElements: [
      "flowing botanical elements",
      "soft organic landscapes",
      "abstract color washes",
      "delicate floral patterns",
      "dreamy atmospheric scenes",
      "gentle natural forms",
    ],
    technicalSpecs:
      "wet-on-wet watercolor technique, granulation effects, color bleeding and blooming, cold-press paper texture, soft diffused edges, transparent layering, natural pigment variation",
  },
  "AI Collage / Mixed Media": {
    needsCharacters: false,
    styleDesc:
      "Contemporary mixed media collage combining photographic elements, geometric shapes, textures, and abstract forms in a harmonious composition.",
    sceneElements: [
      "layered textures",
      "geometric overlays",
      "photographic fragments",
      "abstract shapes",
      "pattern mixing",
    ],
    technicalSpecs:
      "layered composition, varied textures, balanced asymmetry, depth through overlap",
  },
  "Digital Painting": {
    needsCharacters: false,
    styleDesc:
      "Rich digital painting with visible brush strokes, color variation, atmospheric effects, and artistic interpretation. Semi-realistic to stylized approach.",
    sceneElements: [
      "painterly environments",
      "expressive brush work",
      "color harmony",
      "atmospheric effects",
      "artistic interpretation",
    ],
    technicalSpecs:
      "visible brush strokes, color blending, texture variation, dynamic composition",
  },
  "Fantasy / Sci-Fi Style": {
    needsCharacters: false,
    styleDesc:
      "Imaginative fantasy or science fiction scene with futuristic technology, alien landscapes, magical elements, or otherworldly environments. Rich in creative details.",
    sceneElements: [
      "futuristic architecture",
      "alien flora",
      "energy effects",
      "technological devices",
      "surreal landscapes",
    ],
    technicalSpecs:
      "imaginative design, glowing elements, atmospheric effects, dramatic composition",
  },
  "Minimal Abstract": {
    needsCharacters: false,
    styleDesc:
      "Clean minimalist abstract composition with geometric shapes, limited color palette, negative space, and balanced simplicity.",
    sceneElements: [
      "geometric forms",
      "color blocks",
      "clean lines",
      "negative space",
      "simple patterns",
    ],
    technicalSpecs:
      "minimal elements, balanced composition, flat design, precise geometry",
  },
  "Flat Illustration": {
    needsCharacters: true,
    styleDesc:
      "Modern flat design illustration with simple shapes, bold colors, clean lines, and minimal shading. Professional and approachable style.",
    sceneElements: [
      "simple shapes",
      "clean icons",
      "workspace elements",
      "technology devices",
      "interface elements",
    ],
    technicalSpecs:
      "flat colors, no gradients, simple shadows, vector-style clarity",
  },
  "Line Art / Outline": {
    needsCharacters: true,
    styleDesc:
      "Clean line art with continuous flowing lines, minimal detail, and elegant simplicity. Emphasis on form and gesture.",
    sceneElements: [
      "continuous line work",
      "simplified forms",
      "gesture-based",
      "minimal detail",
      "flowing curves",
    ],
    technicalSpecs:
      "single or varied line weight, clean outlines, minimal fill, elegant simplicity",
  },
  "Material Design": {
    needsCharacters: true,
    styleDesc:
      "Google Material Design principles with layered depth, subtle shadows, bold colors, and clean geometric layouts.",
    sceneElements: [
      "layered cards",
      "bold geometry",
      "shadow depth",
      "interface elements",
      "modern workspace",
    ],
    technicalSpecs:
      "elevation shadows, bold colors, grid-based layout, clean typography spaces",
  },
  "Photorealistic / Stock Style": {
    needsCharacters: true,
    styleDesc:
      "Professional stock photography style with perfect lighting, diverse professionals, modern workspace, and polished commercial aesthetic.",
    sceneElements: [
      "modern office",
      "professional workspace",
      "clean backgrounds",
      "natural lighting",
      "business setting",
    ],
    technicalSpecs:
      "professional photography, perfect lighting, sharp focus, commercial quality",
  },
  Isometric: {
    needsCharacters: true,
    styleDesc:
      "Isometric perspective illustration with 30-degree angles, miniature world aesthetic, clean geometric buildings and objects.",
    sceneElements: [
      "isometric buildings",
      "tiny workspace",
      "geometric structures",
      "organized layout",
      "miniature scale",
    ],
    technicalSpecs:
      "30-degree isometric angle, no perspective distortion, clean geometry, organized grid",
  },
  "Corporate Futurism": {
    needsCharacters: true,
    styleDesc:
      "Sleek corporate futuristic style with glass, steel, holographic interfaces, and professional high-tech atmosphere.",
    sceneElements: [
      "glass architecture",
      "holographic displays",
      "modern technology",
      "sleek interiors",
      "professional setting",
    ],
    technicalSpecs:
      "clean futuristic design, glowing interfaces, reflective materials, high-tech aesthetic",
  },
  "Minimalist White Space": {
    needsCharacters: true,
    styleDesc:
      "Airy minimalist design with abundant white space, subtle elements, clean lines, and sophisticated simplicity.",
    sceneElements: [
      "sparse elements",
      "clean workspace",
      "subtle objects",
      "organized simplicity",
      "breathing room",
    ],
    technicalSpecs:
      "90% white space, minimal elements, subtle colors, clean lines, sophisticated restraint",
  },
  "Cinematic Still Frame": {
    needsCharacters: false,
    styleDesc:
      "Film-quality cinematic frame with dramatic lighting, depth of field, color grading, and storytelling composition.",
    sceneElements: [
      "dramatic lighting",
      "environmental storytelling",
      "depth layers",
      "cinematic framing",
      "mood-rich scenes",
    ],
    technicalSpecs:
      "shallow depth of field, color grading, cinematic aspect ratio, professional lighting",
  },
  "Documentary Realism": {
    needsCharacters: false,
    styleDesc:
      "Authentic documentary photography style with natural lighting, real-world environments, and journalistic authenticity.",
    sceneElements: [
      "real environments",
      "natural settings",
      "authentic spaces",
      "environmental context",
      "everyday scenes",
    ],
    technicalSpecs:
      "natural lighting, authentic composition, documentary approach, real-world aesthetic",
  },
  "Color-Graded Film Look": {
    needsCharacters: false,
    styleDesc:
      "Cinematic color grading with teal-orange tones, crushed blacks, film grain, and professional color science.",
    sceneElements: [
      "color-rich environments",
      "atmospheric scenes",
      "mood lighting",
      "textured surfaces",
      "cinematic spaces",
    ],
    technicalSpecs:
      "LUT color grading, film grain, contrast curves, cinematic color palette",
  },
  "Storyboard Sketch": {
    needsCharacters: false,
    styleDesc:
      "Loose sketchy storyboard style with quick gestural lines, minimal detail, and dynamic composition blocking.",
    sceneElements: [
      "rough environments",
      "gestural forms",
      "composition thumbnails",
      "loose rendering",
      "scene blocking",
    ],
    technicalSpecs:
      "sketchy lines, loose rendering, quick marks, composition focus, minimal detail",
  },
  "Moody Monochrome": {
    needsCharacters: false,
    styleDesc:
      "Black and white or limited monochrome palette with dramatic contrast, deep shadows, and strong graphic quality.",
    sceneElements: [
      "high contrast scenes",
      "shadow play",
      "geometric forms",
      "textured surfaces",
      "dramatic lighting",
    ],
    technicalSpecs:
      "monochrome or duo-tone, high contrast, deep blacks, dramatic shadows",
  },
  "Cyberpunk / Neon": {
    needsCharacters: false,
    styleDesc:
      "Futuristic cyberpunk aesthetic with neon lights, urban dystopia, rain-slicked surfaces, and high-tech low-life atmosphere.",
    sceneElements: [
      "neon signs",
      "urban decay",
      "holographic ads",
      "rain effects",
      "tech-noir environments",
    ],
    technicalSpecs:
      "neon glow, dark atmosphere, rain reflections, cyan-magenta palette, gritty urban",
  },
  "Photojournalistic Style": {
    needsCharacters: false,
    styleDesc:
      "Authentic photojournalism with candid moments, environmental context, natural lighting, and storytelling documentation.",
    sceneElements: [
      "authentic environments",
      "contextual settings",
      "natural scenes",
      "documentary moments",
      "real-world spaces",
    ],
    technicalSpecs:
      "natural light, authentic composition, environmental context, documentary style",
  },
};

function getStyleProfile(artStyle) {
  return (
    ART_STYLE_PROFILES[artStyle] || {
      needsCharacters: true,
      styleDesc:
        "Professional modern illustration with clean design and balanced composition.",
      sceneElements: ["workspace", "modern setting", "clean design"],
      technicalSpecs: "professional quality, clean composition",
    }
  );
}
function getDefaultMood(slideType) {
  const moods = {
    "cover-hero": "inspirational",
    "content-right-image": "professional",
    "content-left-image": "informative",
    "content-split": "balanced",
    "quote-slide": "thoughtful",
    "data-visual": "analytical",
    "call-to-action": "motivational",
    conclusion: "summary",
  };
  return moods[slideType] || "professional";
}

async function generateArtKnowledge(slide, rawText = "", artStyle = null) {
  const title = slide.slide_title?.text || slide.slide_title || "Untitled";
  const subtitle = slide.subtitle?.text || "";
  const theme = slide.knowledge?.theme || "General";
  const slideType = slide.layout_type || "content-right-image";
  const contentType = slide.knowledge?.contentType || "general";

  let safeRawText =
    typeof rawText === "string" ? rawText : JSON.stringify(rawText, null, 2);

  // Get style profile
  const styleProfile = getStyleProfile(artStyle);

  // Enhanced color palette based on slide type and content
  const colorSchemes = {
    "cover-hero": ["#2c3e50", "#3498db", "#e74c3c", "#f39c12"],
    "content-right-image": ["#667eea", "#764ba2", "#f093fb", "#4facfe"],
    "content-left-image": ["#06d6a0", "#118ab2", "#073b4c", "#ef476f"],
    "content-split": ["#264653", "#2a9d8f", "#e76f51", "#f4a261"],
    "quote-slide": ["#6c5ce7", "#00b894", "#fdcb6e", "#e17055"],
    "data-visual": ["#ff006e", "#8338ec", "#3a86ff", "#fb5607"],
    "call-to-action": ["#3498db", "#2c3e50", "#e74c3c", "#f39c12"],
    conclusion: ["#6c5ce7", "#00b894", "#fdcb6e", "#74b9ff"],
  };

  const topicLower = (title + " " + safeRawText).toLowerCase();
  let colorScheme =
    colorSchemes[slideType] || colorSchemes["content-right-image"];

  // Adjust based on content
  if (topicLower.includes("tech") || topicLower.includes("digital")) {
    colorScheme = ["#667eea", "#764ba2", "#f093fb", "#4facfe"];
  } else if (topicLower.includes("health") || topicLower.includes("wellness")) {
    colorScheme = ["#06d6a0", "#118ab2", "#073b4c", "#ef476f"];
  }

  const numCharacters = styleProfile.needsCharacters ? 2 : 0;

  // Enhanced prompt based on slide type
  const slideTypeContext = {
    "cover-hero":
      "heroic, attention-grabbing scene that represents the main theme",
    "content-right-image": "supporting visual that illustrates the key points",
    "content-left-image": "complementary imagery that enhances understanding",
    "content-split": "balanced visual that works with divided content",
    "quote-slide": "atmospheric background that supports the quote's emotion",
    "data-visual": "data-centric environment with analytical elements",
    "call-to-action": "motivational scene that inspires action",
    conclusion: "summary imagery that reinforces key messages",
  };

  const artPrompt = `Generate art direction for a ${slideType} presentation slide.

SLIDE CONTEXT:
- Type: ${slideType} (${slideTypeContext[slideType]})
- Title: "${title}"
- Subtitle: "${subtitle}"
- Theme: "${theme}"
- Content Type: ${contentType}
- Key Content: ${safeRawText.slice(0, 300)}

REQUIRED STYLE: ${artStyle}
Style Profile: ${styleProfile.styleDesc}

VISUAL REQUIREMENTS:
${numCharacters === 0
      ? "- NO human characters, figures, or people\n- Focus on environments, objects, abstract elements\n- Create compelling scene without human presence"
      : "- Include exactly 2 diverse professional characters\n- Characters should reflect the content context\n- Professional attire and relevant poses"
    }

SLIDE-SPECIFIC NEEDS:
${slideType === "cover-hero"
      ? "- Heroic, attention-grabbing composition\n- Strong visual hierarchy\n- Memorable first impression"
      : ""
    }
${slideType === "quote-slide"
      ? "- Emotional, atmospheric setting\n- Supports quote tone and message\n- Subtle, non-distracting elements"
      : ""
    }
${slideType === "data-visual"
      ? "- Data-friendly environment\n- Analytical, precise elements\n- Clear, organized composition"
      : ""
    }
${slideType === "call-to-action"
      ? "- Motivational, forward-looking\n- Inspires action and movement\n- Clear focal point for CTA"
      : ""
    }

Generate JSON with:
{
  "style": "${artStyle}",
  "sceneDescription": "Detailed scene description ${numCharacters === 0 ? "WITHOUT any people" : "with integrated characters"
    }",
  "characterDetails": ${numCharacters === 0
      ? "[]"
      : '["professional character 1", "professional character 2"]'
    },
  "numCharacters": ${numCharacters},
  "colorPalette": ${JSON.stringify(colorScheme)},
  "mood": "appropriate emotional tone",
  "composition": "slide-appropriate layout",
  "sceneElements": ["primary element", "secondary element", "supporting element"],
  "slideType": "${slideType}",
  "contentFocus": "${contentType}"
}

Output ONLY valid JSON:`;

  try {
    const artResult = await textGenModel.generateContent(artPrompt);
    const artRaw =
      artResult.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const artCleaned = artRaw.replace(/```json|```/g, "").trim();
    const firstBracket = artCleaned.indexOf("{");
    const lastBracket = artCleaned.lastIndexOf("}");

    if (firstBracket === -1 || lastBracket === -1) {
      throw new Error("No JSON in art knowledge");
    }

    const parsed = JSON.parse(artCleaned.slice(firstBracket, lastBracket + 1));

    return {
      style: artStyle || parsed.style,
      sceneDescription:
        parsed.sceneDescription ||
        `${slideType} scene for ${theme} ${numCharacters === 0 ? "without people" : "with professionals"
        }`,
      characterDetails:
        numCharacters === 0
          ? []
          : parsed.characterDetails || [
            "diverse professional in context-appropriate attire",
            "supporting team member or colleague",
          ],
      numCharacters: numCharacters,
      colorPalette: parsed.colorPalette || colorScheme,
      mood: parsed.mood || getDefaultMood(slideType),
      composition: parsed.composition || "balanced",
      sceneElements: parsed.sceneElements || styleProfile.sceneElements,
      styleProfile: styleProfile,
      slideType: slideType,
      contentFocus: parsed.contentFocus || contentType,
    };
  } catch (err) {
    console.error("Art knowledge generation failed:", err);
    return {
      style: artStyle || "modern illustration",
      sceneDescription: `${slideType} scene for ${theme}`,
      characterDetails:
        numCharacters === 0
          ? []
          : ["professional business person", "colleague or team member"],
      numCharacters: numCharacters,
      colorPalette: colorScheme,
      mood: getDefaultMood(slideType),
      composition: "center-focused",
      sceneElements: styleProfile.sceneElements,
      styleProfile: styleProfile,
      slideType: slideType,
      contentFocus: contentType,
    };
  }
}



async function generateDetailedImagePrompt(slide, artKnowledge, rawText = "") {
  const {
    style,
    sceneDescription,
    characterDetails,
    numCharacters,
    colorPalette,
    mood,
    composition,
    sceneElements,
    styleProfile,
    slideType,
    contentFocus,
  } = artKnowledge;
  const title = slide.slide_title?.text || slide.slide_title || "Untitled";
  const subtitle = slide.subtitle?.text || "";
  const visualContext = slide.image_placeholder?.visual_context || {};

  let safeRawText = typeof rawText === "string" ? rawText.slice(0, 400) : "";

  // Enhanced character section based on slide type
  const characterSection =
    numCharacters === 0
      ? `🚫 ABSOLUTE RESTRICTION: ZERO human figures, characters, people, persons, silhouettes, or any humanoid forms. Focus 100% on environmental elements, objects, architecture, nature, technology, or abstract forms that support ${slideType} content.`
      : `👥 CHARACTER INTEGRATION: Include exactly ${numCharacters} photorealistic diverse professionals:
${characterDetails
        .map(
          (char, i) =>
            `   ${i + 1}. ${char} - realistic, natural, context-appropriate`
        )
        .join("\n")}

Character Guidelines:
- Photorealistic diversity in ethnicity, gender, age
- Natural body proportions and professional poses
- Authentic interaction with environment
- Proper scale and depth placement
- Reflects ${contentFocus} context`;

  // Slide-type specific enhancements
  const slideTypeEnhancements = {
    "cover-hero": `
COVER SLIDE EXCELLENCE:
- Heroic, attention-grabbing composition
- Strong visual hierarchy with clear focal point
- Memorable first-impression quality
- Professional yet innovative aesthetic
- Perfect balance between impact and professionalism`,

    "quote-slide": `
QUOTE SLIDE ATMOSPHERE:
- Emotional, reflective background setting
- Supports the quote's tone and message
- Subtle, non-distracting elements
- Creates appropriate mood for contemplation
- Enhances without competing with text`,

    "data-visual": `
DATA VISUALIZATION CONTEXT:
- Analytical, precise environment
- Data-friendly elements and metaphors
- Clean, organized composition
- Supports metrics and statistics
- Professional analytical setting`,

    "call-to-action": `
CALL-TO-ACTION ENERGY:
- Motivational, forward-looking scene
- Inspires action and movement
- Clear focal point for CTA emphasis
- Energetic yet professional tone
- Encourages next steps and engagement`,

    conclusion: `
CONCLUSION REINFORCEMENT:
- Summary-oriented imagery
- Reinforces key messages and takeaways
- Professional closure atmosphere
- Balanced, resolved composition
- Leaves lasting positive impression`,
  };

  const prompt = `Generate a stunning professional presentation slide visual in EXACT 16:9 aspect ratio (1920x1080 pixels).

═══════════════════════════════════════════════════════════════
🎯 SLIDE-SPECIFIC DIRECTION
═══════════════════════════════════════════════════════════════
Slide Type: ${slideType}
Content Focus: ${contentFocus}
Primary Mood: ${mood}

${slideTypeEnhancements[slideType] || ""}

═══════════════════════════════════════════════════════════════
🎨 VISUAL STYLE & EXECUTION
═══════════════════════════════════════════════════════════════
Style: ${style}
Style DNA: ${styleProfile.styleDesc}
Technical Execution: ${styleProfile.technicalSpecs}

This image must perfectly embody ${style} aesthetic while serving as effective ${slideType} visual support.

═══════════════════════════════════════════════════════════════
🖼️ SCENE COMPOSITION
═══════════════════════════════════════════════════════════════
Scene Description: ${sceneDescription}

Composition Strategy: ${composition} layout optimized for ${slideType}
Visual Hierarchy: Clear focal point supporting slide content

Key Visual Elements:
${sceneElements.map((el) => `   • ${el}`).join("\n")}
${visualContext.elements?.map((el) => `   • ${el}`).join("\n") || ""}

═══════════════════════════════════════════════════════════════
🎨 COLOR & LIGHTING STRATEGY
═══════════════════════════════════════════════════════════════
Color Palette: ${colorPalette.join(", ")}

Color Application:
- Dominant: ${colorPalette[0]} (establishes base tone)
- Secondary: ${colorPalette[1]} (supports visual interest)
- Accents: ${colorPalette.slice(2).join(", ")} (highlights and details)
- Professional color relationships and harmony

Lighting Design:
- Multi-point professional lighting
- Mood-appropriate lighting (${mood})
- Supports ${slideType} requirements
- Clear visual hierarchy through lighting
- Professional shadow and highlight balance

═══════════════════════════════════════════════════════════════
👤 CHARACTER & ELEMENTS
═══════════════════════════════════════════════════════════════
${characterSection}

═══════════════════════════════════════════════════════════════
📝 TEXT PROHIBITION (STRICTLY ENFORCED)
═══════════════════════════════════════════════════════════════
🚫 ABSOLUTELY ZERO text, letters, numbers, words, labels, or readable typography
🚫 NO user interface elements with visible text
🚫 NO signs, posters, books, or screens with readable content
🚫 NO copyright symbols, brand names, or written language
🚫 If text-like elements appear, they must be abstract patterns only

═══════════════════════════════════════════════════════════════
🎯 CONTEXT & RELEVANCE
═══════════════════════════════════════════════════════════════
Slide Title: "${title}"
${subtitle ? `Slide Subtitle: "${subtitle}"` : ""}
Content Context: ${safeRawText || "Professional presentation content"}

Visual Metaphor: Create imagery that symbolically represents "${title}" and supports ${contentFocus} without literal translation.

═══════════════════════════════════════════════════════════════
✨ QUALITY & TECHNICAL EXCELLENCE
═══════════════════════════════════════════════════════════════
Technical Standards:
- Exact 16:9 aspect ratio (1920x1080 pixels minimum)
- Ultra-high resolution rendering
- Professional presentation quality
- Print-ready clarity and sharpness
- No digital artifacts or distortions

Quality Benchmarks:
✓ Masterpiece professional quality
✓ Perfect exposure and color balance
✓ Appropriate depth of field
✓ Rich detail and texture
✓ Professional color grading
✓ Flawless technical execution

═══════════════════════════════════════════════════════════════
🚫 CRITICAL AVOIDANCES
═══════════════════════════════════════════════════════════════
DO NOT INCLUDE:
✗ Any text, typography, or readable characters
✗ Generic stock photography clichés
✗ Awkward cropping or incomplete subjects
✗ Unrealistic proportions (unless stylistically intentional)
✗ Watermarks, signatures, or copyright notices
✗ AI artifacts (warped elements, melted objects)
✗ Overused visual tropes without context

═══════════════════════════════════════════════════════════════
🎨 FINAL CREATIVE DIRECTION
═══════════════════════════════════════════════════════════════
Create a UNIQUE, PROFESSIONAL ${slideType} visual that:

1. Perfectly executes ${style} aesthetic with technical precision
2. Supports "${title}" content as effective ${slideType} imagery
3. Uses ${colorPalette.join(", ")} palette harmoniously
4. Maintains ${mood} atmosphere throughout
5. Features ${numCharacters === 0
      ? "ZERO people - pure environmental focus"
      : `${numCharacters} integrated professionals`
    }
6. Achieves presentation-grade visual excellence
7. Enhances slide impact without distracting
8. Stands as unique, professional artwork

This should be a show-stopping visual that makes the ${slideType} more impactful and memorable.`;

  return prompt;
}

// Add this improved error handling in your generateImage function
// Replace the image generation section (around line 430-470)

async function generateImage(
  slide,
  index,
  rawText = "",
  planResponseType,
  artStyle = null,
  progressCallback = null,
  currentSlideNum = null,
  totalSlides = null
) {
  // prepare a richly described prompt for the image service so results are more relevant
  const artKnowledge = await generateArtKnowledge(slide, rawText, artStyle);
  const detailedPrompt = await generateDetailedImagePrompt(slide, artKnowledge, rawText);
  let promptToUse = detailedPrompt;

  // === PREDEFINED / TRIAL MODE → Use Pexels directly ===
  // if (planResponseType === "predefined") {
  //   const result = await getPexelsFallbackImage({
  //     query: slide?.slide_title?.text || rawText?.substring(0, 50) || "presentation",
  //     index,
  //     slide,
  //   });

  //   if (result) {
  //     console.log(`Pexels image used for predefined slide ${index + 1}`);
  //     return {
  //       image_url: result.image_url,
  //       image_caption: result.image_caption,
  //       photographer: result.photographer,
  //       pexels_url: result.pexels_url,
  //       fallback_used: result.fallback_used,
  //       art_style: slide.art_style,
  //       art_palette: slide.art_palette,
  //     };
  //   }

  //   // Final placeholder
  //   const placeholder = `https://placehold.co/1920x1080/6366f1/ffffff?text=Slide+${index + 1}&font=roboto`;
  //   return {
  //     image_url: placeholder,
  //     image_caption: "Placeholder (Pexels unavailable)",
  //     fallback_used: "placeholder",
  //   };
  // }

  // === PAID PLAN → FLUX IMAGE GENERATION ===
  // if (planResponseType === "paid") {
  try {
    let webpData;
    if (progressCallback)
      progressCallback(currentSlideNum, totalSlides, "generating-ai-image");

    const prompt = promptToUse;

    const fluxResult = await generateFluxImage({
      prompt,
      artStyle: slide.art_style,
      artPalette: slide.art_palette,
    });

    console.log("FLUX RAW RESULT:", fluxResult);

    if (!fluxResult) {
      throw new Error("Flux returned empty response");
    }

    if (fluxResult.image_url) {
      const response = await axios.get(fluxResult.image_url, {
        responseType: "arraybuffer",
        timeout: 20000,
      });

      webpData = await convertToWebP(
        `data:image/png;base64,${Buffer.from(response.data).toString("base64")}`
      );
    }
    else {
      throw new Error("Flux returned no usable image data");
    }

    if (progressCallback)
      progressCallback(currentSlideNum, totalSlides, "uploading");

    const baseFilename = `slide_ai_${slide.slide_id || crypto.randomUUID()}_${Date.now()}.webp`;
    const finalUrl = await uploadToSpaces(webpData, baseFilename);

    // Also create a smaller 142x160 thumbnail variant for mobile clients
    let mobileUrl = null;
    try {
      const mobileWebpData = await createThumbnailWebP(webpData, 142, 160);
      const mobileFilename = `slide_ai_mobile_${slide.slide_id || crypto.randomUUID()}_${Date.now()}_142x160.webp`;
      mobileUrl = await uploadToSpaces(mobileWebpData, mobileFilename);
    } catch (thumbErr) {
      console.error("Failed to create/upload mobile thumbnail:", thumbErr.message);
    }

    return {
      image_url: finalUrl,
      image_mobile_url: mobileUrl || finalUrl,
      image_caption: slide.slide_title?.text || "AI-generated image",
      fallback_used: "flux",
      art_style: slide.art_style,
      art_palette: slide.art_palette,
    };
  } catch (fluxError) {
    console.error("❌ Flux generation failed:", fluxError.message);
    console.log("🔄 Activating fallback image generation chain...");

    // === FALLBACK CHAIN: GLM → Pollinations → Unsplash → Hugging Face → Replicate ===
    try {
      const prompt = promptToUse; // reuse the detailed description generated earlier

      console.log(`\n📊 Starting fallback cascade for slide ${index + 1}...`);

      if (progressCallback)
        progressCallback(currentSlideNum, totalSlides, "generating-fallback-image");

      // Try GLM Image first (highest quality paid alternative)
      let fallbackImageData = null;
      try {
        console.log("🎨 Attempting GLM Image generation...");
        fallbackImageData = await generateWithGLM(prompt);
        console.log("✅ GLM Image succeeded");
      } catch (glmError) {
        console.warn("⚠️  GLM Image failed, trying other services...");

        // Fall through to other services if GLM fails
        try {
          console.log("🔄 Using multi-service fallback cascade...");
          fallbackImageData = await generateFallbackImage(prompt);
          console.log("✅ Fallback cascade succeeded");
        } catch (cascadeError) {
          console.warn("⚠️  All AI image services failed:", cascadeError.message);
          fallbackImageData = null;
        }
      }

      if (fallbackImageData) {
        // Got image from fallback - process and upload
        if (progressCallback)
          progressCallback(currentSlideNum, totalSlides, "uploading");

        const webpData = fallbackImageData.includes('data:image/webp')
          ? fallbackImageData
          : await convertToWebP(fallbackImageData);

        const baseFilename = `slide_fallback_${slide.slide_id || crypto.randomUUID()}_${Date.now()}.webp`;
        const finalUrl = await uploadToSpaces(webpData, baseFilename);

        // Mobile-sized thumbnail
        let mobileUrl = null;
        try {
          const mobileWebpData = await createThumbnailWebP(webpData, 142, 160);
          const mobileFilename = `slide_fallback_mobile_${slide.slide_id || crypto.randomUUID()}_${Date.now()}_142x160.webp`;
          mobileUrl = await uploadToSpaces(mobileWebpData, mobileFilename);
        } catch (thumbErr) {
          console.error("Failed to create/upload mobile thumbnail (fallback):", thumbErr.message);
        }

        return {
          image_url: finalUrl,
          image_mobile_url: mobileUrl || finalUrl,
          image_caption: slide.slide_title?.text || "AI-generated image (fallback)",
          fallback_used: "glm-or-cascade",
          art_style: slide.art_style,
          art_palette: slide.art_palette,
        };
      }

      // If all AI services fail, try Pexels
      console.log("⚠️  All AI services exhausted, trying Pexels stock photos...");

      if (progressCallback && currentSlideNum && totalSlides) {
        progressCallback(currentSlideNum, totalSlides, 'fetching-pexels-fallback');
      }

      const fallbackResult = await getPexelsFallbackImage({
        query: promptToUse || slide.slide_title?.text || rawText?.substring(0, 100),
        index,
        slide,
      });

      if (fallbackResult) {
        try {
          if (progressCallback) progressCallback(currentSlideNum, totalSlides, 'uploading');

          const response = await axios.get(fallbackResult.image_url, {
            responseType: "arraybuffer",
            timeout: 15000,
          });
          const webpData = await convertToWebP(
            `data:${response.headers["content-type"] || "image/jpeg"};base64,${Buffer.from(response.data).toString("base64")}`
          );

          const baseFilename = `slide_pexels_${slide.slide_id || crypto.randomUUID()}_${Date.now()}.webp`;
          const finalUrl = await uploadToSpaces(webpData, baseFilename);

          // Mobile-sized thumbnail derived from the uploaded WebP
          let mobileUrl = null;
          try {
            const mobileWebpData = await createThumbnailWebP(webpData, 142, 160);
            const mobileFilename = `slide_pexels_mobile_${slide.slide_id || crypto.randomUUID()}_${Date.now()}_142x160.webp`;
            mobileUrl = await uploadToSpaces(mobileWebpData, mobileFilename);
          } catch (thumbErr) {
            console.error("Failed to create/upload mobile thumbnail (pexels):", thumbErr.message);
          }

          return {
            image_url: finalUrl,
            image_mobile_url: mobileUrl || finalUrl,
            image_caption: fallbackResult.image_caption,
            photographer: fallbackResult.photographer,
            pexels_url: fallbackResult.pexels_url,
            fallback_used: "pexels-uploaded",
            art_style: slide.art_style,
            art_palette: slide.art_palette,
          };
        } catch (uploadErr) {
          console.error("Failed to upload Pexels image:", uploadErr.message);
          // Fall back to direct URL
          return {
            image_url: fallbackResult.image_url,
            image_caption: fallbackResult.image_caption,
            photographer: fallbackResult.photographer,
            pexels_url: fallbackResult.pexels_url,
            fallback_used: "pexels-direct",
            art_style: slide.art_style,
            art_palette: slide.art_palette,
          };
        }
      }

      // === LAST RESORT: Placeholder ===
      console.warn("⚠️  All image sources exhausted, using placeholder");
      const placeholder = `https://placehold.co/1920x1080/6366f1/ffffff?text=Slide+${index + 1}&font=roboto`;
      const mobilePlaceholder = `https://placehold.co/142x160/6366f1/ffffff?text=Slide+${index + 1}&font=roboto`;
      return {
        image_url: placeholder,
        image_mobile_url: mobilePlaceholder,
        image_caption: "Image unavailable - placeholder",
        fallback_used: "placeholder",
        art_style: slide.art_style,
        art_palette: slide.art_palette,
      };
    } catch (fallbackError) {
      console.error("❌ Critical error in fallback chain:", fallbackError.message);

      // Ultimate fallback: return placeholder
      const placeholder = `https://placehold.co/1920x1080/6366f1/ffffff?text=Slide+${index + 1}&font=roboto`;
      return {
        image_url: placeholder,
        image_mobile_url: placeholder,
        image_caption: "Image generation failed",
        fallback_used: "placeholder",
        art_style: slide.art_style,
        art_palette: slide.art_palette,
      };
    }
  }
}

module.exports = { generateImage };
