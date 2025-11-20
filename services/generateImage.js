const { imageGenLimiter } = require("../utils/limiter");
const { textGenModel } = require("../utils/geminiModels");
const { generateImageWithRetry } = require("../utils/runwareImageGen");
const crypto = require("crypto");
const sharp = require("sharp");
const { uploadToSpaces, deleteFromSpaces } = require("../utils/s3Uploader");
const { getFallbackImage } = require("../utils/imageFallback");

async function convertToWebP(base64Image) {
  const buffer = Buffer.from(base64Image.split(",")[1], "base64");

  // Get image metadata to check original dimensions
  const metadata = await sharp(buffer).metadata();
  console.log(
    `Original image: ${metadata.width}x${metadata.height}, format: ${metadata.format}`
  );

  // Only resize if image is smaller than target, otherwise keep original size
  const shouldResize = metadata.width < 1920 || metadata.height < 1080;

  let sharpInstance = sharp(buffer);

  if (shouldResize) {
    sharpInstance = sharpInstance.resize({
      width: 1920,
      height: 1088,
      fit: "cover",
      kernel: sharp.kernel.lanczos3,
    });
  }

  const webpBuffer = await sharpInstance
    .webp({
      quality: 98,
      effort: 6,
      lossless: false,
      nearLossless: false,
      smartSubsample: false,
    })
    .toBuffer();

  console.log(`Converted to WebP: ${webpBuffer.length} bytes`);
  return `data:image/webp;base64,${webpBuffer.toString("base64")}`;
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
  try {
    // Predefined (trial/quota) - keep existing logic
    if (planResponseType === "predefined") {
      try {
        const fallbackQuery =
          slide?.slide_title.text ||
          slide?.topic ||
          slide?.title ||
          rawText?.substring(0, 50) ||
          "presentation";

        const unsplashResult = await getFallbackImage({
          query: fallbackQuery,
          index,
          slide,
        });

        if (unsplashResult && unsplashResult.image_url) {
          console.log(`✅ Unsplash image used for predefined slide ${index}`);
          return {
            ...slide,
            image_url: unsplashResult.image_url,
            image_caption: unsplashResult.image_caption,
            fallback_used: unsplashResult.fallback_used,
          };
        }
      } catch (unsplashErr) {
        console.warn(
          `⚠️ Unsplash fallback failed for predefined slide ${index}:`,
          unsplashErr.message
        );
      }

      const fallback = `https://placehold.co/960x540/6c5ce7/ffffff?text=Slide+${index + 1}`;
      return {
        ...slide,
        image_url: fallback,
        image_caption: "Placeholder image (trial quota reached)",
        fallback_used: "placeholder",
      };
    }

    // 🟦 RUNWARE AI image generation flow
    if (progressCallback && currentSlideNum && totalSlides) {
      progressCallback(currentSlideNum, totalSlides, 'generating');
    }

    const artKnowledge = await generateArtKnowledge(slide, rawText, artStyle);
    console.log(`Art knowledge for slide ${index}:`, {
      style: artKnowledge.style,
      chars: artKnowledge.numCharacters,
      mood: artKnowledge.mood,
    });

    const detailedPrompt = await generateDetailedImagePrompt(
      slide,
      artKnowledge,
      rawText
    );
    console.log(`Generated prompt for slide ${index} (${artKnowledge.style})`);

    // 🔥 Use Runware instead of Gemini
    console.log(`Generating image with Runware for slide ${index}...`);

    const imageUrl = await imageGenLimiter.schedule(() =>
      generateImageWithRetry(detailedPrompt, {
        width: 1344,
        height: 768,
        steps: 25,
        CFGScale: 7,
        negativePrompt: "text, watermark, signature, letters, words, typography, blurry, distorted, low quality, artifacts, ugly, bad anatomy, deformed",
        model: "runware:100@1", // You can change this to other Runware models
      }, 2) // 2 retries
    );

    console.log(`Runware image generated for slide ${index}: ${imageUrl}`);

    // Convert and upload
    let finalUrl;
    let key;
    try {
      if (progressCallback && currentSlideNum && totalSlides) {
        progressCallback(currentSlideNum, totalSlides, 'uploading');
      }

      console.log(`Converting image to WebP for slide ${index}...`);
      const webpImage = await convertToWebP(imageUrl);

      key = `slide_${slide.slide_id || crypto.randomUUID()}_${Date.now()}.webp`;
      console.log(`Uploading image for slide ${index}: ${key}`);

      finalUrl = await uploadToSpaces(webpImage, key);
      console.log(`Image uploaded for slide ${index}: ${artKnowledge.style} -> ${finalUrl}`);
    } catch (uploadErr) {
      console.error(`Upload failed for slide ${index}:`, uploadErr);
      if (key) await deleteFromSpaces(key);
      throw uploadErr;
    }

    return {
      ...slide,
      image_url: finalUrl,
      image_caption: artKnowledge.sceneDescription || "",
      art_style: artKnowledge.style,
      art_palette: artKnowledge.colorPalette,
    };

  } catch (err) {
    console.error(`Failed to generate image for slide ${index}:`, {
      error: err.message,
      stack: err.stack?.substring(0, 300),
    });

    // Try Unsplash before placeholder
    try {
      const fallbackQuery =
        slide?.slide_title.text ||
        slide?.topic ||
        slide?.title ||
        rawText?.substring(0, 50) ||
        "presentation";

      const unsplashResult = await getFallbackImage({
        query: fallbackQuery,
        index,
        slide,
      });

      if (unsplashResult && unsplashResult.image_url) {
        console.log(`Unsplash fallback used for failed slide ${index}`);
        return {
          ...slide,
          image_url: unsplashResult.image_url,
          image_caption: unsplashResult.image_caption,
          fallback_used: unsplashResult.fallback_used,
        };
      }
    } catch (unsplashErr) {
      console.warn(
        `Unsplash fallback failed for slide ${index}:`,
        unsplashErr.message
      );
    }

    // Final fallback placeholder
    const fallback = `https://placehold.co/960x540/6c5ce7/ffffff?text=Slide+${index + 1}`;
    return {
      ...slide,
      image_url: fallback,
      image_caption: "Image unavailable",
      fallback_used: "placeholder",
      error: err.message,
    };
  }
}

module.exports = { generateImage };
