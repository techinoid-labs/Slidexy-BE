// utils/layoutApplier.js
const { v4: uuidv4 } = require("uuid");
const { createCoverSlide } = require("./layouts/coverSlide");
const { createContentRightImageSlide } = require("./layouts/contentRightImageSlide");
const { createContentLeftImageSlide } = require("./layouts/contentLeftImageSlide");
const { createSplitContentSlide } = require("./layouts/splitContentSlide");
const { createConclusionSlide } = require("./layouts/conclusionSlide");
const { createFullImageTextOverlaySlide } = require("./layouts/fullImageTextOverlaySlide");
const { createQuoteSlide } = require("./layouts/quoteSlide");
const { createTimelineSlide } = require("./layouts/timelineSlide");
const { createComparisonSlide } = require("./layouts/comparisonSlide");
const { createInfographicBulletsSlide } = require("./layouts/infographicBulletsSlide");

const hexToRgba = (hex, alpha) => {
  const normalized = hex.startsWith('#') ? hex : `#${hex}`;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const generateThemeColors = (artPalette) => {
  const primary = artPalette[0] || "#2c3e50";
  const secondary = artPalette[1] || "#3498db";
  const accent = artPalette[2] || "#e74c3c";
  const light = artPalette[3] || "#ecf0f1";
  
  return {
    primary,
    secondary,
    accent,
    light,
    background: light,
    surface: "#ffffff",
    text: "#2c3e50",
    textLight: "#7f8c8d"
  };
};

const getContrastingTextColor = (bgColor) => {
  // Simple contrast calculation
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#2c3e50' : '#ffffff';
};

const layoutTemplates = {
  "cover-hero": createCoverSlide,
  "content-right-image": createContentRightImageSlide,
  "content-left-image": createContentLeftImageSlide,
  "split-content": createSplitContentSlide,
  "conclusion": createConclusionSlide,
  "full-image-text-overlay": createFullImageTextOverlaySlide,
  "quote-slide": createQuoteSlide,
  "timeline-slide": createTimelineSlide,
  "comparison-slide": createComparisonSlide,
  "infographic-bullets": createInfographicBulletsSlide
};

function applyLayoutToSlide(slide, variantIndex = 0) {
  const layoutType = slide.layout_type;
  const template = layoutTemplates[layoutType];
  
  if (!template) {
    console.warn(`No layout template found for: ${layoutType}`);
    return slide;
  }

  const variantKeys = Object.keys(template);
  const variantKey = variantKeys[Math.min(variantIndex, variantKeys.length - 1)];
  const variantFunction = template[variantKey];

  if (typeof variantFunction !== 'function') {
    console.warn(`Invalid variant function for: ${layoutType}.${variantKey}`);
    return slide;
  }

  try {
    // Generate colors from art palette
    const colors = generateThemeColors(slide.art_palette || ["#2c3e50", "#3498db", "#e74c3c", "#ecf0f1"]);
    const textColor = getContrastingTextColor(colors.background);
    
    // Apply layout variant
    const enhancedSlide = variantFunction(slide, colors, textColor, 960, 540);
    
    // Preserve critical metadata
    return {
      ...enhancedSlide,
      slide_id: slide.slide_id,
      layout_type: slide.layout_type,
      layout_variant: variantKey,
      visual_suggestion: slide.visual_suggestion,
      art_style: slide.art_style,
      art_palette: slide.art_palette,
      knowledge: slide.knowledge,
      image_url: slide.image_url,
      image_caption: slide.image_caption,
      content_metadata: slide.content_metadata
    };
  } catch (error) {
    console.error(`Error applying layout ${layoutType}.${variantKey}:`, error);
    return slide;
  }
}

// NEW: Generate all 5 layout variants for a slide, populating full elements for storage
function generateAllVariantsForSlide(slide) {
  const layoutType = slide.layout_type;
  const template = layoutTemplates[layoutType];
  
  if (!template) {
    console.warn(`No layout template found for: ${layoutType}`);
    return { layouts: [], defaultSlide: slide };
  }

  const artPalette = slide.art_palette || ["#2c3e50", "#3498db", "#e74c3c", "#ecf0f1"];
  const colors = generateThemeColors(artPalette);
  const textColor = getContrastingTextColor(colors.background);

  const variants = [];
  let defaultSlide = slide;

  for (let v = 0; v < 5; v++) {
    try {
      const enhanced = applyLayoutToSlide(slide, v);
      const variant = {
        name: `variant${v + 1}`,
        canvas: { width: 960, height: 540 },
        background: {
          type: "solid",
          color: colors.background || "#ffffff",
          gradient: { direction: "linear" }
        },
        elements: enhanced.elements || []  // Full elements including backgrounds, shapes, etc.
      };
      variants.push(variant);

      if (v === 0) {
        defaultSlide = enhanced;  // Use variant1 as default for slide.elements and slide_title
      }
    } catch (error) {
      console.error(`Error generating variant ${v + 1} for ${layoutType}:`, error);
      // Fallback empty variant
      variants.push({
        name: `variant${v + 1}`,
        canvas: { width: 960, height: 540 },
        background: { type: "solid", color: "#ffffff", gradient: { direction: "linear" } },
        elements: []
      });
    }
  }

  return { layouts: variants, defaultSlide };
}

function applyLayoutsToPresentation(slides, variantStrategy = 'balanced') {
  // Ignore strategy for now since we generate all variants anyway
  return slides.map((slide) => {
    const { layouts, defaultSlide } = generateAllVariantsForSlide(slide);
    return {
      ...defaultSlide,
      layouts,
      layout_variant: "variant1",  // Default to first variant
      applied_layout: true
    };
  });
}

module.exports = {
  applyLayoutToSlide,
  applyLayoutsToPresentation,
  generateAllVariantsForSlide,  // Export for direct use in controller
  layoutTemplates,
  generateThemeColors,
  getContrastingTextColor
};