const { textGenModel } = require("../utils/geminiModels");
const { fetchWebsiteText } = require("./fetchWebsiteText");
const { v4: uuidv4 } = require("uuid");

/**
 * Generate a presentation or proposal from website content
 * Uses fetchWebsiteText to extract website data, images, aesthetics, and stylesheets
 * Then uses Gemini 2.5 Flash to generate a structured Canva-style presentation
 * 
 * @param {string} url - Website URL to convert
 * @param {object} options - Configuration options
 * @param {string} options.presentationType - 'presentation' or 'proposal'
 * @param {number} options.slideCount - Number of slides to generate (3, 5, 7, or 10)
 * @param {object} options.meta - Additional metadata (goal, tone, audience, etc.)
 * @param {function} options.progressCallback - Progress callback function
 * @returns {Promise<object>} Generated presentation data
 */
async function generateWebToDeck(url, options = {}) {
  const {
    presentationType = 'presentation',
    slideCount = 5,
    meta = {},
    progressCallback = null
  } = options;

  try {
    // Step 1: Fetch website data
    if (progressCallback) progressCallback(0, slideCount, "Fetching website content...");
    
    const websiteData = await fetchWebsiteText(url);
    
    if (progressCallback) progressCallback(1, slideCount, "Analyzing website aesthetics...");

    // Step 2: Build comprehensive prompt for Gemini
    const prompt = buildWebToDeckPrompt(
      websiteData,
      presentationType,
      slideCount,
      meta
    );

    if (progressCallback) progressCallback(2, slideCount, "Generating presentation with AI...");

    // Step 3: Generate content with Gemini 2.5 Flash
    const result = await textGenModel.generateContent(prompt);
    const raw = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (progressCallback) progressCallback(Math.floor(slideCount * 0.6), slideCount, "Parsing AI response...");

    // Step 4: Parse and clean JSON response
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");

    if (firstBracket === -1 || lastBracket === -1) {
      throw new Error("No JSON array found in AI response");
    }

    const jsonString = cleaned.slice(firstBracket, lastBracket + 1);
    let aiSlides = JSON.parse(jsonString);

    if (progressCallback) progressCallback(Math.floor(slideCount * 0.7), slideCount, "Processing slides...");

    // Step 5: Validate and enhance slides with website aesthetics
    aiSlides = aiSlides.map((slide, index) => {
      if (progressCallback) {
        progressCallback(
          Math.floor(slideCount * 0.7) + index + 1,
          slideCount,
          `Processing slide ${index + 1}...`
        );
      }
      return enhanceSlideWithWebsiteData(slide, websiteData, index);
    });

    // Step 6: Transform to final slide format
    const slides = aiSlides.map((aiSlide, index) => {
      return transformWebSlideToFormat(aiSlide, websiteData, index, slideCount);
    });

    if (progressCallback) progressCallback(slideCount, slideCount, "Complete!");

    return {
      slides,
      meta: {
        ...meta,
        sourceUrl: url,
        websiteTitle: websiteData.raw?.metadata?.title,
        websiteType: websiteData.websiteType,
        generatedAt: new Date().toISOString(),
        slideCount: slides.length,
        presentationType,
        aesthetics: {
          colors: websiteData.aesthetics?.colors?.slice(0, 10) || [],
          fonts: websiteData.aesthetics?.fonts?.slice(0, 5) || [],
          primaryColor: websiteData.aesthetics?.rootColors?.primaryColor || "#6c5ce7",
          backgroundColor: websiteData.aesthetics?.rootColors?.backgroundColor || "#ffffff"
        }
      },
      websiteImages: websiteData.raw?.images?.slice(0, 10) || []
    };

  } catch (error) {
    console.error("Error in generateWebToDeck:", error);
    throw new Error(`Failed to generate presentation from website: ${error.message}`);
  }
}

/**
 * Build comprehensive prompt for Gemini based on website data
 */
function buildWebToDeckPrompt(websiteData, presentationType, slideCount, meta) {
  const { raw, aesthetics, websiteType, presentationHints } = websiteData;
  const { goal, tone, audience } = meta;

  // Extract key information
  const title = raw?.metadata?.title || "Website Presentation";
  const description = raw?.metadata?.description || "";
  const headings = raw?.headings?.slice(0, 10) || [];
  const paragraphs = raw?.paragraphs?.slice(0, 20) || [];
  const images = raw?.images?.slice(0, 10) || [];
  
  // Color and font information
  const primaryColors = aesthetics?.colors?.slice(0, 8) || [];
  const fonts = aesthetics?.fonts?.slice(0, 3) || [];
  const brandColors = {
    primary: aesthetics?.rootColors?.primaryColor || "#6c5ce7",
    secondary: aesthetics?.rootColors?.secondaryColor || "#00b894",
    background: aesthetics?.rootColors?.backgroundColor || "#ffffff",
    text: aesthetics?.rootColors?.color || "#000000"
  };

  const prompt = `
You are an expert presentation designer creating a ${presentationType} from website content.

WEBSITE INFORMATION:
Title: ${title}
Description: ${description}
Website Type: ${websiteType}
URL: ${raw?.metadata?.url}

WEBSITE AESTHETICS (USE THESE FOR DESIGN CONSISTENCY):
Primary Colors: ${primaryColors.join(", ")}
Brand Colors:
  - Primary: ${brandColors.primary}
  - Secondary: ${brandColors.secondary}
  - Background: ${brandColors.background}
  - Text: ${brandColors.text}
Fonts: ${fonts.join(", ")}

KEY HEADINGS FROM WEBSITE:
${headings.map(h => `${h.level}: ${h.text}`).join("\n")}

MAIN CONTENT:
${paragraphs.slice(0, 15).join("\n")}

AVAILABLE IMAGES (${images.length} total):
${images.slice(0, 5).map((img, i) => `Image ${i + 1}: ${img.src}\n  Alt: ${img.alt}\n  Size: ${img.width}x${img.height}`).join("\n")}

PRESENTATION CONTEXT:
${goal ? `Goal: ${goal}` : `Goal: Convert website content into compelling ${presentationType}`}
${tone ? `Tone: ${tone}` : `Tone: Professional and engaging`}
${audience ? `Audience: ${audience}` : `Audience: Business professionals`}
Slide Count: ${slideCount}
Presentation Type: ${presentationType}

CREATE EXACTLY ${slideCount} SLIDES following these rules:

1. SLIDE TYPES AND STRUCTURE:
   - Slide 1: ALWAYS "cover-hero" with title + subtitle
   - Slide 2-${slideCount - 1}: Mix of "content-right-image", "content-left-image", "content-split", "quote-slide", "infographic-bullets"
   - Slide ${slideCount}: ALWAYS "call-to-action" or "conclusion"

2. CONTENT REQUIREMENTS:
   - All titles: 3-6 words, compelling and clear
   - cover-hero: title + subtitle (one sentence, no bullets)
   - content-right-image/content-left-image: title + 3-4 bullets (6-12 words each)
   - content-split: title + 4-6 bullets (for split layout)
   - quote-slide: title + quote (20-50 words) + author + context
   - infographic-bullets: title + 3-4 bullets in "Value - explanation" format
   - call-to-action: title + 1-2 action bullets + description

3. DESIGN INTEGRATION:
   - Reference website images by their URL for relevant slides
   - Use the website's color palette (${brandColors.primary}, ${brandColors.secondary})
   - Maintain visual consistency with website brand
   - Suggest which website images to use for each slide

4. CONTENT STRATEGY FOR ${presentationType.toUpperCase()}:
${presentationType === 'proposal' 
  ? `   - Focus on problem/solution, value proposition, credibility
   - Include data points and concrete benefits
   - End with clear call-to-action and next steps`
  : `   - Focus on key information and storytelling
   - Highlight main features and benefits
   - Create engaging narrative flow`}

OUTPUT FORMAT - Return ONLY valid JSON array with exactly ${slideCount} objects:

For cover-hero:
{
  "slide_number": 1,
  "layout_type": "cover-hero",
  "title": "${title}",
  "subtitle": "Compelling subtitle from website description",
  "suggested_image": "URL from available images or website meta image",
  "color_scheme": {
    "primary": "${brandColors.primary}",
    "secondary": "${brandColors.secondary}",
    "background": "${brandColors.background}"
  }
}

For content slides with bullets:
{
  "slide_number": 2,
  "layout_type": "content-right-image",
  "title": "Key Feature or Benefit",
  "bullets": [
    "First important point from website content",
    "Second key insight with specific details",
    "Third compelling value proposition",
    "Fourth supporting detail (if needed)"
  ],
  "suggested_image": "URL from available images that matches content",
  "visual_suggestion": "Description of ideal image based on content",
  "color_scheme": {
    "primary": "${brandColors.primary}",
    "accent": "${brandColors.secondary}"
  }
}

For quote-slide:
{
  "slide_number": 5,
  "layout_type": "quote-slide",
  "title": "Client Success or Expert Insight",
  "quote": "Compelling quote from website content or testimonial (20-50 words)",
  "author": "Source or attribution from website",
  "context": "Why this quote matters for the presentation",
  "color_scheme": {
    "primary": "${brandColors.primary}",
    "background": "${brandColors.background}"
  }
}

For call-to-action:
{
  "slide_number": ${slideCount},
  "layout_type": "call-to-action",
  "title": "Next Steps",
  "bullets": [
    "Primary action for audience",
    "Secondary follow-up action"
  ],
  "description": "Summary of expected outcomes",
  "suggested_image": "Relevant closing image from website",
  "color_scheme": {
    "primary": "${brandColors.primary}",
    "accent": "${brandColors.secondary}"
  }
}

IMPORTANT:
- Use ACTUAL content from the website provided above
- Reference REAL image URLs from the available images list
- Match the website's visual identity with color schemes
- Ensure ${slideCount} slides with logical narrative flow
- All text must be derived from website content, not generic placeholders

Generate the ${slideCount} slides now:`;

  return prompt;
}

/**
 * Enhance slide with website-specific data
 */
function enhanceSlideWithWebsiteData(slide, websiteData, index) {
  const { aesthetics, raw } = websiteData;

  // Ensure color scheme exists
  if (!slide.color_scheme) {
    slide.color_scheme = {
      primary: aesthetics?.rootColors?.primaryColor || "#6c5ce7",
      secondary: aesthetics?.rootColors?.secondaryColor || "#00b894",
      background: aesthetics?.rootColors?.backgroundColor || "#ffffff",
      text: aesthetics?.rootColors?.color || "#000000"
    };
  }

  // Validate suggested image URL
  if (slide.suggested_image) {
    // Check if it's a valid URL from the website images
    const imageExists = raw?.images?.some(img => img.src === slide.suggested_image);
    if (!imageExists) {
      // Fallback to website meta image or first available image
      slide.suggested_image = raw?.metadata?.image || raw?.images?.[0]?.src || null;
    }
  } else if (index === 0 && raw?.metadata?.image) {
    // For cover slide, use meta image if available
    slide.suggested_image = raw.metadata.image;
  }

  // Add visual suggestion if not present
  if (!slide.visual_suggestion && slide.title) {
    slide.visual_suggestion = generateVisualSuggestionFromTitle(slide.title);
  }

  return slide;
}

/**
 * Transform AI slide to final format compatible with frontend
 */
function transformWebSlideToFormat(aiSlide, websiteData, index, totalSlides) {
  const slideId = `slide-${uuidv4()}`;
  const layoutType = aiSlide.layout_type || "content-right-image";

  // Base slide structure
  const slide = {
    slide_id: slideId,
    layout_type: layoutType,
    visual_suggestion: aiSlide.visual_suggestion || generateVisualSuggestionFromTitle(aiSlide.title),
    knowledge: {
      theme: aiSlide.title || "Website Presentation",
      slideNumber: index + 1,
      totalSlides: totalSlides,
      contentType: getContentType(layoutType),
      sourceWebsite: websiteData.raw?.metadata?.url
    },
    art_style: "modern illustration matching website aesthetic",
    art_palette: aiSlide.color_scheme ? 
      [aiSlide.color_scheme.primary, aiSlide.color_scheme.secondary, aiSlide.color_scheme.accent].filter(Boolean) :
      websiteData.aesthetics?.colors?.slice(0, 4) || ["#6c5ce7", "#00b894", "#fdcb6e", "#e17055"],
    elements: [],
    image_url: aiSlide.suggested_image || null,
    image_caption: aiSlide.suggested_image ? (websiteData.raw?.images?.find(img => img.src === aiSlide.suggested_image)?.alt || "") : "",
    image_placeholder: { x: 520, y: 40, width: 400, height: 460 },
    content_metadata: {
      title: aiSlide.title || "",
      subtitle: aiSlide.subtitle || "",
      bullet_count: 0,
      has_quote: !!aiSlide.quote,
      has_data: layoutType === "infographic-bullets",
      color_scheme: aiSlide.color_scheme || {}
    },
    slide_number: index + 1,
    total_slides: totalSlides,
    created_at: { $date: { $numberLong: Date.now().toString() } },
    updated_at: { $date: { $numberLong: Date.now().toString() } }
  };

  // Add title (required for all slides)
  slide.slide_title = {
    text: aiSlide.title || `Slide ${index + 1}`,
    _id: { $oid: uuidv4().replace(/-/g, '').slice(0, 24) }
  };

  // Handle subtitle for cover-hero
  if (layoutType === "cover-hero" && aiSlide.subtitle) {
    slide.subtitle = {
      text: aiSlide.subtitle,
      _id: { $oid: uuidv4().replace(/-/g, '').slice(0, 24) }
    };
    slide.content_metadata.subtitle = aiSlide.subtitle;
  }

  // Add elements based on slide type
  switch (layoutType) {
    case "cover-hero":
      // No additional elements for cover
      break;

    case "quote-slide":
      if (aiSlide.quote) {
        slide.elements.push({
          element_type: "quote",
          text: aiSlide.quote,
          element_id: `element-${uuidv4()}`,
          id: uuidv4()
        });
      }
      if (aiSlide.author) {
        slide.elements.push({
          element_type: "author",
          text: aiSlide.author,
          element_id: `element-${uuidv4()}`,
          id: uuidv4()
        });
      }
      if (aiSlide.context) {
        slide.elements.push({
          element_type: "context",
          text: aiSlide.context,
          element_id: `element-${uuidv4()}`,
          id: uuidv4()
        });
      }
      break;

    case "call-to-action":
      if (aiSlide.bullets) {
        aiSlide.bullets.forEach((bullet) => {
          slide.elements.push({
            element_type: "bullet_point",
            text: bullet,
            id: uuidv4()
          });
        });
      }
      if (aiSlide.description) {
        slide.elements.push({
          element_type: "description",
          text: aiSlide.description,
          id: uuidv4()
        });
      }
      break;

    default: // Content slides with bullets
      if (aiSlide.bullets && aiSlide.bullets.length > 0) {
        aiSlide.bullets.forEach((bullet) => {
          slide.elements.push({
            element_type: "bullet_point",
            text: bullet,
            id: uuidv4()
          });
        });
      }
  }

  // Update bullet count
  slide.content_metadata.bullet_count = slide.elements.filter(
    el => el.element_type === "bullet_point"
  ).length;

  return slide;
}

/**
 * Helper function to generate visual suggestions from titles
 */
function generateVisualSuggestionFromTitle(title) {
  if (!title) return "professional business imagery";
  
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes("team") || titleLower.includes("people")) {
    return "diverse team collaboration in modern workspace";
  } else if (titleLower.includes("data") || titleLower.includes("analytics")) {
    return "data visualization with charts and analytics";
  } else if (titleLower.includes("growth") || titleLower.includes("success")) {
    return "upward trending graph with success imagery";
  } else if (titleLower.includes("technology") || titleLower.includes("innovation")) {
    return "modern technology environment with innovative elements";
  } else if (titleLower.includes("strategy") || titleLower.includes("planning")) {
    return "strategic planning session with professional setting";
  } else {
    return "professional business imagery relevant to content";
  }
}

/**
 * Get content type for slide
 */
function getContentType(slideType) {
  const types = {
    "cover-hero": "introduction",
    "content-right-image": "key points",
    "content-left-image": "supporting details",
    "content-split": "comparison",
    "quote-slide": "testimonial",
    "infographic-bullets": "metrics",
    "call-to-action": "summary",
    "conclusion": "summary"
  };
  return types[slideType] || "content";
}

module.exports = { generateWebToDeck };
