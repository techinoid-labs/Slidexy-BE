const { imageGenLimiter } = require("../utils/limiter");
const { imageGenModel, textGenModel } = require("../utils/geminiModels");
const crypto = require("crypto");
const sharp = require("sharp");
const { uploadToSpaces, deleteFromSpaces } = require("../utils/s3Uploader");

async function convertToWebP(base64Image) {
  const buffer = Buffer.from(base64Image.split(",")[1], "base64");
  
  // Get image metadata to check original dimensions
  const metadata = await sharp(buffer).metadata();
  console.log(`Original image: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);
  
  // Only resize if image is smaller than target, otherwise keep original size
  const shouldResize = metadata.width < 1920 || metadata.height < 1080;
  
  let sharpInstance = sharp(buffer);
  
  if (shouldResize) {
    sharpInstance = sharpInstance.resize({
      width: 1920,
      height: 1080,
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
    styleDesc: "Epic cinematic concept art masterpiece with dramatic volumetric lighting, atmospheric depth, intricate environmental details, and professional matte painting quality. Rich color grading, subtle fog effects, and compelling visual narrative through environment alone.",
    sceneElements: ["majestic architectural structures", "sweeping environmental vistas", "volumetric god rays", "layered atmospheric depth", "intricate surface details", "dramatic sky formations"],
    technicalSpecs: "professional digital matte painting, 8K ultra resolution, cinematic color grading, atmospheric perspective, detailed textures, dramatic three-point lighting, depth of field bokeh"
  },
  "3D Render / CGI": {
    needsCharacters: false,
    styleDesc: "Ultra-photorealistic 3D CGI rendering with physically accurate ray-traced lighting, perfect material properties (metalness, roughness, subsurface scattering), crisp reflections, and studio-quality presentation. Showcases geometric precision and flawless surfaces.",
    sceneElements: ["pristine geometric architecture", "reflective glass and polished metal", "product-display pedestals", "minimalist modern interiors", "precision-engineered objects", "clean gradient backgrounds"],
    technicalSpecs: "path-traced global illumination, PBR materials with 4K textures, anti-aliased edges, studio HDRI lighting, orthographic or perspective camera, 8K render quality, subtle ambient occlusion"
  },
  "Watercolor Illustration": {
    needsCharacters: false,
    styleDesc: "Delicate watercolor painting with translucent color washes, natural pigment bleeding, visible paper grain texture, soft wet-on-wet blending, and organic fluid movement. Ethereal quality with gentle color transitions and artistic spontaneity.",
    sceneElements: ["flowing botanical elements", "soft organic landscapes", "abstract color washes", "delicate floral patterns", "dreamy atmospheric scenes", "gentle natural forms"],
    technicalSpecs: "wet-on-wet watercolor technique, granulation effects, color bleeding and blooming, cold-press paper texture, soft diffused edges, transparent layering, natural pigment variation"
  },
  "AI Collage / Mixed Media": {
    needsCharacters: false,
    styleDesc: "Contemporary mixed media collage combining photographic elements, geometric shapes, textures, and abstract forms in a harmonious composition.",
    sceneElements: ["layered textures", "geometric overlays", "photographic fragments", "abstract shapes", "pattern mixing"],
    technicalSpecs: "layered composition, varied textures, balanced asymmetry, depth through overlap"
  },
  "Digital Painting": {
    needsCharacters: false,
    styleDesc: "Rich digital painting with visible brush strokes, color variation, atmospheric effects, and artistic interpretation. Semi-realistic to stylized approach.",
    sceneElements: ["painterly environments", "expressive brush work", "color harmony", "atmospheric effects", "artistic interpretation"],
    technicalSpecs: "visible brush strokes, color blending, texture variation, dynamic composition"
  },
  "Fantasy / Sci-Fi Style": {
    needsCharacters: false,
    styleDesc: "Imaginative fantasy or science fiction scene with futuristic technology, alien landscapes, magical elements, or otherworldly environments. Rich in creative details.",
    sceneElements: ["futuristic architecture", "alien flora", "energy effects", "technological devices", "surreal landscapes"],
    technicalSpecs: "imaginative design, glowing elements, atmospheric effects, dramatic composition"
  },
  "Minimal Abstract": {
    needsCharacters: false,
    styleDesc: "Clean minimalist abstract composition with geometric shapes, limited color palette, negative space, and balanced simplicity.",
    sceneElements: ["geometric forms", "color blocks", "clean lines", "negative space", "simple patterns"],
    technicalSpecs: "minimal elements, balanced composition, flat design, precise geometry"
  },
  "Flat Illustration": {
    needsCharacters: true,
    styleDesc: "Modern flat design illustration with simple shapes, bold colors, clean lines, and minimal shading. Professional and approachable style.",
    sceneElements: ["simple shapes", "clean icons", "workspace elements", "technology devices", "interface elements"],
    technicalSpecs: "flat colors, no gradients, simple shadows, vector-style clarity"
  },
  "Line Art / Outline": {
    needsCharacters: true,
    styleDesc: "Clean line art with continuous flowing lines, minimal detail, and elegant simplicity. Emphasis on form and gesture.",
    sceneElements: ["continuous line work", "simplified forms", "gesture-based", "minimal detail", "flowing curves"],
    technicalSpecs: "single or varied line weight, clean outlines, minimal fill, elegant simplicity"
  },
  "Material Design": {
    needsCharacters: true,
    styleDesc: "Google Material Design principles with layered depth, subtle shadows, bold colors, and clean geometric layouts.",
    sceneElements: ["layered cards", "bold geometry", "shadow depth", "interface elements", "modern workspace"],
    technicalSpecs: "elevation shadows, bold colors, grid-based layout, clean typography spaces"
  },
  "Photorealistic / Stock Style": {
    needsCharacters: true,
    styleDesc: "Professional stock photography style with perfect lighting, diverse professionals, modern workspace, and polished commercial aesthetic.",
    sceneElements: ["modern office", "professional workspace", "clean backgrounds", "natural lighting", "business setting"],
    technicalSpecs: "professional photography, perfect lighting, sharp focus, commercial quality"
  },
  "Isometric": {
    needsCharacters: true,
    styleDesc: "Isometric perspective illustration with 30-degree angles, miniature world aesthetic, clean geometric buildings and objects.",
    sceneElements: ["isometric buildings", "tiny workspace", "geometric structures", "organized layout", "miniature scale"],
    technicalSpecs: "30-degree isometric angle, no perspective distortion, clean geometry, organized grid"
  },
  "Corporate Futurism": {
    needsCharacters: true,
    styleDesc: "Sleek corporate futuristic style with glass, steel, holographic interfaces, and professional high-tech atmosphere.",
    sceneElements: ["glass architecture", "holographic displays", "modern technology", "sleek interiors", "professional setting"],
    technicalSpecs: "clean futuristic design, glowing interfaces, reflective materials, high-tech aesthetic"
  },
  "Minimalist White Space": {
    needsCharacters: true,
    styleDesc: "Airy minimalist design with abundant white space, subtle elements, clean lines, and sophisticated simplicity.",
    sceneElements: ["sparse elements", "clean workspace", "subtle objects", "organized simplicity", "breathing room"],
    technicalSpecs: "90% white space, minimal elements, subtle colors, clean lines, sophisticated restraint"
  },
  "Cinematic Still Frame": {
    needsCharacters: false,
    styleDesc: "Film-quality cinematic frame with dramatic lighting, depth of field, color grading, and storytelling composition.",
    sceneElements: ["dramatic lighting", "environmental storytelling", "depth layers", "cinematic framing", "mood-rich scenes"],
    technicalSpecs: "shallow depth of field, color grading, cinematic aspect ratio, professional lighting"
  },
  "Documentary Realism": {
    needsCharacters: false,
    styleDesc: "Authentic documentary photography style with natural lighting, real-world environments, and journalistic authenticity.",
    sceneElements: ["real environments", "natural settings", "authentic spaces", "environmental context", "everyday scenes"],
    technicalSpecs: "natural lighting, authentic composition, documentary approach, real-world aesthetic"
  },
  "Color-Graded Film Look": {
    needsCharacters: false,
    styleDesc: "Cinematic color grading with teal-orange tones, crushed blacks, film grain, and professional color science.",
    sceneElements: ["color-rich environments", "atmospheric scenes", "mood lighting", "textured surfaces", "cinematic spaces"],
    technicalSpecs: "LUT color grading, film grain, contrast curves, cinematic color palette"
  },
  "Storyboard Sketch": {
    needsCharacters: false,
    styleDesc: "Loose sketchy storyboard style with quick gestural lines, minimal detail, and dynamic composition blocking.",
    sceneElements: ["rough environments", "gestural forms", "composition thumbnails", "loose rendering", "scene blocking"],
    technicalSpecs: "sketchy lines, loose rendering, quick marks, composition focus, minimal detail"
  },
  "Moody Monochrome": {
    needsCharacters: false,
    styleDesc: "Black and white or limited monochrome palette with dramatic contrast, deep shadows, and strong graphic quality.",
    sceneElements: ["high contrast scenes", "shadow play", "geometric forms", "textured surfaces", "dramatic lighting"],
    technicalSpecs: "monochrome or duo-tone, high contrast, deep blacks, dramatic shadows"
  },
  "Cyberpunk / Neon": {
    needsCharacters: false,
    styleDesc: "Futuristic cyberpunk aesthetic with neon lights, urban dystopia, rain-slicked surfaces, and high-tech low-life atmosphere.",
    sceneElements: ["neon signs", "urban decay", "holographic ads", "rain effects", "tech-noir environments"],
    technicalSpecs: "neon glow, dark atmosphere, rain reflections, cyan-magenta palette, gritty urban"
  },
  "Photojournalistic Style": {
    needsCharacters: false,
    styleDesc: "Authentic photojournalism with candid moments, environmental context, natural lighting, and storytelling documentation.",
    sceneElements: ["authentic environments", "contextual settings", "natural scenes", "documentary moments", "real-world spaces"],
    technicalSpecs: "natural light, authentic composition, environmental context, documentary style"
  }
};

function getStyleProfile(artStyle) {
  return ART_STYLE_PROFILES[artStyle] || {
    needsCharacters: true,
    styleDesc: "Professional modern illustration with clean design and balanced composition.",
    sceneElements: ["workspace", "modern setting", "clean design"],
    technicalSpecs: "professional quality, clean composition"
  };
}

async function generateArtKnowledge(slide, rawText = "", artStyle = null) {
  const title = slide.slide_title?.text || slide.slide_title || "Untitled";
  const subtitle = slide.subtitle?.text || "";
  const theme = slide.knowledge?.theme || "General";

  let safeRawText = typeof rawText === "string" ? rawText : JSON.stringify(rawText, null, 2);
  
  // Get style profile
  const styleProfile = getStyleProfile(artStyle);
  
  // Smart color palette based on topic
  const colorSchemes = {
    business: ["#2c3e50", "#3498db", "#e74c3c", "#f39c12"],
    technology: ["#667eea", "#764ba2", "#f093fb", "#4facfe"],
    education: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A"],
    health: ["#06d6a0", "#118ab2", "#073b4c", "#ef476f"],
    finance: ["#264653", "#2a9d8f", "#e76f51", "#f4a261"],
    creative: ["#ff006e", "#8338ec", "#3a86ff", "#fb5607"],
    default: ["#6c5ce7", "#00b894", "#fdcb6e", "#e17055"]
  };

  const topicLower = (title + " " + safeRawText).toLowerCase();
  let colorScheme = colorSchemes.default;
  for (const [key, colors] of Object.entries(colorSchemes)) {
    if (topicLower.includes(key)) {
      colorScheme = colors;
      break;
    }
  }

  const numCharacters = styleProfile.needsCharacters ? 2 : 0;
  
  const artPrompt = `Generate art direction for a presentation slide image.

SLIDE CONTEXT:
- Title: "${title}"
- Subtitle: "${subtitle}"
- Theme: "${theme}"
- Content: ${safeRawText.slice(0, 300)}

REQUIRED STYLE: ${artStyle}
Style Profile: ${styleProfile.styleDesc}

REQUIREMENTS:
${numCharacters === 0 ? 
  '- ABSOLUTELY NO human characters, figures, or people\n- Focus on environments, objects, abstract elements, or landscapes\n- Scene must be compelling without any human presence' :
  '- Include exactly 2 diverse professional characters\n- Characters should be diverse in ethnicity and gender\n- Professional attire and poses relevant to the topic'
}

Generate JSON with:
{
  "style": "${artStyle}",
  "sceneDescription": "Detailed 2-3 sentence description of the scene ${numCharacters === 0 ? 'WITHOUT any people' : 'with characters naturally integrated'}",
  "characterDetails": ${numCharacters === 0 ? '[]' : '["description of character 1", "description of character 2"]'},
  "numCharacters": ${numCharacters},
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "mood": "professional/innovative/collaborative/etc",
  "composition": "center-focused/left-to-right/triangular/etc",
  "sceneElements": ["element1", "element2", "element3"]
}

Output ONLY valid JSON, no markdown or explanations.`;

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

    return {
      style: artStyle || parsed.style,
      sceneDescription: parsed.sceneDescription || (numCharacters === 0 ? 
        `${theme} themed environment without people` : 
        `Professional ${theme} scene with collaboration`),
      characterDetails: numCharacters === 0 ? [] : (parsed.characterDetails || [
        "diverse professional in modern attire",
        "team member in business casual"
      ]),
      numCharacters: numCharacters,
      colorPalette: parsed.colorPalette || colorScheme,
      mood: parsed.mood || "professional",
      composition: parsed.composition || "center-focused",
      sceneElements: parsed.sceneElements || styleProfile.sceneElements,
      styleProfile: styleProfile
    };
  } catch (err) {
    console.error("Art knowledge generation failed:", err);
    return {
      style: artStyle || "modern illustration",
      sceneDescription: numCharacters === 0 ? 
        `${theme} environment focusing on space and objects` : 
        `Professional ${theme} workspace with team collaboration`,
      characterDetails: numCharacters === 0 ? [] : [
        "diverse professional with laptop",
        "team member analyzing data"
      ],
      numCharacters: numCharacters,
      colorPalette: colorScheme,
      mood: "professional",
      composition: "center-focused",
      sceneElements: styleProfile.sceneElements,
      styleProfile: styleProfile
    };
  }
}

async function generateDetailedImagePrompt(slide, artKnowledge, rawText = "") {
  const { style, sceneDescription, characterDetails, numCharacters, colorPalette, mood, composition, sceneElements, styleProfile } = artKnowledge;
  const title = slide.slide_title?.text || slide.slide_title || "Untitled";
  const subtitle = slide.subtitle?.text || "";

  let safeRawText = typeof rawText === "string" ? rawText.slice(0, 400) : "";

  // Build comprehensive prompt with extreme detail
  const characterSection = numCharacters === 0 ? 
    `🚫 ABSOLUTE RESTRICTION: ZERO human figures, characters, people, persons, silhouettes, shadows of people, or any humanoid forms whatsoever. Not even in the background, reflections, or suggestions. This is a PEOPLE-FREE ZONE. Focus 100% on environmental elements, objects, architecture, nature, technology, or abstract forms.` :
    `👥 CHARACTER REQUIREMENTS: Integrate exactly ${numCharacters} photorealistic diverse professionals naturally into the scene:
${characterDetails.map((char, i) => `   ${i + 1}. ${char} - realistic anatomy, natural pose, appropriate scale`).join('\n')}

Character quality standards:
- Photorealistic skin tones and facial features
- Natural body proportions and anatomically correct poses
- Diverse representation: varied ethnicities (Asian, African, Caucasian, Hispanic, Middle Eastern), genders, ages
- Professional attire appropriate to context
- Authentic expressions and gestures
- Proper depth placement in scene
- Natural interaction with environment`;

  const qualityKeywords = [
    "masterpiece quality",
    "professional presentation grade",
    "ultra high definition 8K resolution",
    "magazine-quality composition",
    "award-winning visual design",
    "crisp clarity and sharpness",
    "rich color depth",
    "perfect exposure balance",
    "intricate fine details"
  ];

  const textProhibitions = [
    "🚫 CRITICAL: ABSOLUTELY ZERO text, letters, numbers, words, labels, captions, titles, symbols, logos, watermarks, signatures, or any form of readable typography",
    "🚫 NO user interface elements, buttons, menus, or text-based graphics",
    "🚫 NO signs, posters, books with visible text, computer screens with readable content",
    "🚫 NO copyright symbols, brand names, or written language of any kind",
    "🚫 If objects like books, screens, or signs appear, they must be blank, blurred, or show abstract patterns only"
  ];

  const prompt = `Generate an absolutely stunning, professional-grade presentation slide visual in EXACT 16:9 landscape aspect ratio (1920x1080 pixels).

═══════════════════════════════════════════════════════════════
🎯 PRIMARY STYLE DIRECTIVE (HIGHEST PRIORITY)
═══════════════════════════════════════════════════════════════
Style Name: ${style}

Style Description: ${styleProfile.styleDesc}

Technical Execution: ${styleProfile.technicalSpecs}

Visual DNA: This image must BREATHE the essence of ${style}. Every pixel, color choice, lighting decision, and compositional element should scream "${style}" to anyone viewing it.

═══════════════════════════════════════════════════════════════
🖼️ SCENE & COMPOSITION
═══════════════════════════════════════════════════════════════
Scene Description: ${sceneDescription}

Emotional Atmosphere: ${mood} - infuse the entire scene with this mood through lighting, color temperature, and environmental storytelling.

Compositional Structure: ${composition} layout with expert visual weight distribution. Use rule of thirds, leading lines, and balanced negative space.

Key Visual Elements to Feature:
${sceneElements.map(el => `   • ${el}`).join('\n')}

═══════════════════════════════════════════════════════════════
🎨 COLOR & LIGHTING MASTERY
═══════════════════════════════════════════════════════════════
Primary Color Palette: ${colorPalette.join(', ')}

Color Application Strategy:
- Dominant color: ${colorPalette[0]} (60% of image)
- Secondary color: ${colorPalette[1]} (30% of image)  
- Accent colors: ${colorPalette.slice(2).join(', ')} (10% for highlights and interest points)
- Use natural gradients and color transitions
- Ensure harmony through complementary or analogous color relationships

Lighting Design:
- Professional multi-point lighting setup
- Key light, fill light, and rim light consideration
- Appropriate shadows with soft falloff
- Highlights that add dimension without overexposure
- Ambient lighting that supports the mood
- Light direction that guides viewer's eye to focal points

═══════════════════════════════════════════════════════════════
👤 CHARACTER & HUMAN ELEMENTS
═══════════════════════════════════════════════════════════════
${characterSection}

═══════════════════════════════════════════════════════════════
📝 TEXT PROHIBITION (CRITICAL - ENFORCE STRICTLY)
═══════════════════════════════════════════════════════════════
${textProhibitions.join('\n')}

═══════════════════════════════════════════════════════════════
🎯 CONTENT CONTEXT & RELEVANCE
═══════════════════════════════════════════════════════════════
Slide Title: "${title}"
${subtitle ? `Slide Subtitle: "${subtitle}"` : ''}

Topic Context: ${safeRawText || 'General presentation content'}

Visual Metaphor: Create imagery that SYMBOLICALLY represents the topic. If the topic is about "growth," show upward motion, expanding forms, or thriving environments. If about "connection," show linking elements, networks, or bridges. Make the visual tell the story without words.

═══════════════════════════════════════════════════════════════
✨ QUALITY & TECHNICAL REQUIREMENTS
═══════════════════════════════════════════════════════════════
Resolution & Format:
- Exact 16:9 aspect ratio (1920x1080 pixels minimum)
- Edge-to-edge frame filling - no letterboxing or pillarboxing
- Ultra-high resolution rendering
- Print-quality clarity at 300 DPI equivalent

Image Quality Standards:
${qualityKeywords.map(kw => `✓ ${kw}`).join('\n')}

Technical Excellence:
- Tack-sharp focus on primary subject
- Appropriate depth of field (shallow for portraits, deep for environments)
- No chromatic aberration or digital artifacts
- Smooth gradients without banding
- Rich shadows with detail retention
- Bright highlights without clipping
- Professional color grading and tonal range

═══════════════════════════════════════════════════════════════
🚫 CRITICAL AVOIDANCES
═══════════════════════════════════════════════════════════════
DO NOT INCLUDE:
✗ Any text, typography, or readable characters (CRITICAL)
✗ Generic stock photography clichés (unless Photorealistic style specifically)
✗ Cluttered or visually noisy compositions
✗ Awkward cropping or incomplete subjects at frame edges
✗ Unrealistic proportions or distorted perspective (unless stylistically intentional)
✗ Muddy or unclear color relationships
✗ Watermarks, signatures, or copyright notices
✗ Overused visual tropes (handshakes, light bulbs, arrows unless contextually perfect)
✗ AI artifacts (warped hands, weird anatomy, melted objects)

═══════════════════════════════════════════════════════════════
🎨 CREATIVE DIRECTION SUMMARY
═══════════════════════════════════════════════════════════════
Create a UNIQUE, MEMORABLE, PROFESSIONAL presentation slide visual that:

1. Perfectly embodies the "${style}" aesthetic with technical precision
2. Tells a visual story related to "${title}" without any text
3. Uses the specified color palette harmoniously
4. Maintains ${mood} mood throughout
5. Features ${numCharacters === 0 ? 'ZERO people - pure environmental/abstract/object focus' : `exactly ${numCharacters} diverse professionals naturally integrated`}
6. Achieves gallery-quality visual excellence
7. Commands attention and enhances the presentation message
8. Stands out as a unique piece, not a generic template

This should be a show-stopping visual that makes viewers stop and appreciate its craft. Make it AMAZING.`;

  return prompt;
}

async function generateImage(slide, index, rawText = "", planResponseType, artStyle = null) {
  try {
    if (planResponseType === "predefined") {
      const fallback = `https://placehold.co/960x540/6c5ce7/ffffff?text=Slide+${index + 1}`;
      return {
        ...slide,
        image_url: fallback,
        image_caption: "Placeholder image (trial quota reached)",
      };
    }

    // Generate Art Knowledge with user-selected artStyle
    const artKnowledge = await generateArtKnowledge(slide, rawText, artStyle);
    console.log(`Art knowledge for slide ${index}:`, {
      style: artKnowledge.style,
      chars: artKnowledge.numCharacters,
      mood: artKnowledge.mood
    });

    // Generate detailed prompt
    let detailedPrompt = await generateDetailedImagePrompt(artKnowledge, artKnowledge, rawText);
    console.log(`Generated prompt for slide ${index} (${artKnowledge.style})`);

    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      try {
        if (attempts === 1) {
          // Variation for retry
          const variations = [
            "alternative perspective",
            "different lighting angle", 
            "varied composition approach",
            "fresh visual interpretation"
          ];
          const variation = variations[Math.floor(Math.random() * variations.length)];
          detailedPrompt = detailedPrompt.replace('composition', `${variation} composition`) + 
            `\n\nIMPORTANT: Create a distinctly different variation from previous attempt while maintaining style integrity.`;
          console.log(`Retry ${attempts} for slide ${index}`);
        }

        const response = await imageGenLimiter.schedule(() =>
          imageGenModel.generateContent({
            contents: [{ role: "user", parts: [{ text: detailedPrompt }] }],
            generationConfig: {
              responseModalities: ["IMAGE", "TEXT"],
              candidateCount: 1,
              temperature: attempts === 0 ? 0.65 : 0.80,
              topP: 0.95,
              topK: 50,
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
        let fileUrl;
        let key;
        try {
          imageBase64 = await convertToWebP(imageBase64);
          key = `slide_${slide.slide_id || crypto.randomUUID()}_${Date.now()}.webp`;
          fileUrl = await uploadToSpaces(imageBase64, key);
          console.log(`✓ Image uploaded for slide ${index}: ${artKnowledge.style}`);
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