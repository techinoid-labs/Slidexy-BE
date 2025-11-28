/**
 * =============================================================================
 * UNIFIED WEB DECK SERVICE
 * =============================================================================
 * 
 * Purpose: Orchestrates all 3 web deck services (Raw Text, Image, Stylesheet)
 *          and combines their results into a single Presentation object.
 * 
 * CEO Requirement: Create a final unified service that:
 * 1. Calls Raw Text Deck Service → Gets text-based slides
 * 2. Calls Image Deck Service → Gets image-based slides
 * 3. Calls Stylesheet Deck Service → Gets design system slides
 * 4. Combines all results into a MongoDB Presentation document
 * 
 * Architecture:
 * - Imports the 3 individual deck services directly
 * - Combines their Konva objects into a unified slides array
 * - Returns a complete Presentation schema-compliant object
 * - Handles errors gracefully with fallbacks
 * 
 * Created: 2025-11-14
 * =============================================================================
 */

const crypto = require("crypto");
const { generateRawTextDeck } = require("./rawTextDeck");
const { generateImageDeck } = require("./imageDeck");
const { generateStylesheetDeck } = require("./stylesheetDeck");
const { fetchWebsiteText } = require("./fetchWebsiteTextNoCode");

/**
 * Generate a unified presentation from a URL by calling all 3 services
 * @param {string} url - The website URL to scrape and analyze
 * @returns {Promise<Object>} Complete presentation object ready for MongoDB
 */
async function generateUnifiedWebDeck(url) {
  console.log("\n=== 🚀 UNIFIED WEB DECK GENERATION STARTED ===");
  console.log(`📍 Target URL: ${url}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

  try {
    // Validate URL
    if (!url || typeof url !== "string") {
      throw new Error("Invalid URL provided");
    }

    const urlPattern = /^(https?:\/\/).+/i;
    if (!urlPattern.test(url)) {
      throw new Error("URL must start with http:// or https://");
    }

    console.log("\n📡 Step 1/3: Calling Raw Text Deck Service...");
    let rawTextResult = null;
    try {
      rawTextResult = await generateRawTextDeck(url);
      console.log("✅ Raw Text Deck: SUCCESS");
      console.log(`   - Konva Object: ${rawTextResult.konvaObject ? "Generated" : "Missing"}`);
    } catch (error) {
      console.error("❌ Raw Text Deck: FAILED -", error.message);
      rawTextResult = null; // Continue with other services
    }

    console.log("\n🖼️  Step 2/3: Calling Image Deck Service...");
    let imageResult = null;
    try {
      imageResult = await generateImageDeck(url);
      console.log("✅ Image Deck: SUCCESS");
      console.log(`   - Konva Object: ${imageResult.konvaObject ? "Generated" : "Missing"}`);
    } catch (error) {
      console.error("❌ Image Deck: FAILED -", error.message);
      imageResult = null; // Continue with other services
    }

    console.log("\n🎨 Step 3/3: Calling Stylesheet Deck Service...");
    let stylesheetResult = null;
    try {
      stylesheetResult = await generateStylesheetDeck(url);
      console.log("✅ Stylesheet Deck: SUCCESS");
      console.log(`   - Konva Object: ${stylesheetResult.konvaObject ? "Generated" : "Missing"}`);
    } catch (error) {
      console.error("❌ Stylesheet Deck: FAILED -", error.message);
      stylesheetResult = null; // Continue with combination
    }

    // Check if at least one service succeeded
    if (!rawTextResult && !imageResult && !stylesheetResult) {
      throw new Error("All 3 services failed. Cannot generate unified presentation.");
    }

    console.log("\n🔄 Combining results into unified presentation...");

    // Try to fetch raw website data once so we can populate headings / image arrays / aesthetics
    let websiteData = null;
    try {
      websiteData = await fetchWebsiteText(url);
    } catch (err) {
      console.warn("Could not fetch websiteData for metadata augmentation:", err.message);
      websiteData = null;
    }

    // Combine all Konva objects into slides array
    const slides = [];
    let slideNumber = 1;

    // Add Raw Text Slide (if available)
    if (rawTextResult && rawTextResult.konvaObject) {
      const rawTextSlide = convertKonvaToSlide(
        rawTextResult.konvaObject,
        slideNumber++,
        "raw-text-content",
        "Text Content",
        websiteData,
        stylesheetResult?.konvaObject
      );
      slides.push(rawTextSlide);
      console.log(`   ✓ Added Raw Text slide (${rawTextSlide.slide_id})`);
    }

    // Add Image Slide (if available)
    if (imageResult && imageResult.konvaObject) {
      const imageSlide = convertKonvaToSlide(
        imageResult.konvaObject,
        slideNumber++,
        "image-content",
        "Visual Content",
        websiteData,
        stylesheetResult?.konvaObject
      );
      slides.push(imageSlide);
      console.log(`   ✓ Added Image slide (${imageSlide.slide_id})`);
    }

    // Add Stylesheet/Design Slide (if available)
    if (stylesheetResult && stylesheetResult.konvaObject) {
      const stylesheetSlide = convertKonvaToSlide(
        stylesheetResult.konvaObject,
        slideNumber++,
        "design-system",
        "Design System",
        websiteData,
        stylesheetResult.konvaObject
      );
      slides.push(stylesheetSlide);
      console.log(`   ✓ Added Stylesheet slide (${stylesheetSlide.slide_id})`);
    }

    // Extract metadata from results
    const metadata = {
      rawTextMeta: rawTextResult?.metadata || null,
      imageMeta: imageResult?.metadata || null,
      stylesheetMeta: stylesheetResult?.metadata || null,
      sourceUrl: url,
      generatedAt: new Date().toISOString(),
      servicesUsed: {
        rawText: !!rawTextResult,
        image: !!imageResult,
        stylesheet: !!stylesheetResult,
      },
    };

    // Extract color palette from stylesheet result (if available)
    const artPalette = stylesheetResult?.konvaObject?.colorPalette || (websiteData?.aesthetics?.colors || []) || [
      "#6c5ce7",
      "#00b894",
      "#fdcb6e",
      "#e17055",
      "#74b9ff",
    ];

    // Create unified presentation object (MongoDB schema compliant)
    const presentation = {
      presentation_id: crypto.randomUUID(),
      topic: extractTopicFromUrl(url),
      meta: metadata,
      // attach real headings (top 25) if available
      headings: websiteData?.raw?.headings?.map(h => h.text) || websiteData?.headings?.map(h => h.text) || [],
      slides: slides,
      slide_count: slides.length,
      template_used: "unified-web-deck",
      // Prefer stylesheet's human-friendly title or typography primary font for art_style
      art_style: stylesheetResult?.konvaObject?.title || stylesheetResult?.konvaObject?.typography?.primaryFont || "web-extracted-design",
      art_palette: artPalette,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("\n✅ UNIFIED PRESENTATION CREATED");
    console.log(`   - Presentation ID: ${presentation.presentation_id}`);
    console.log(`   - Total Slides: ${presentation.slide_count}`);
    console.log(`   - Topic: ${presentation.topic}`);
    console.log(`   - Art Palette: ${presentation.art_palette.join(", ")}`);
    console.log("=== 🎉 UNIFIED WEB DECK GENERATION COMPLETE ===\n");

    return {
      success: true,
      presentation: presentation,
      metadata: metadata,
      individualResults: {
        rawText: rawTextResult ? { success: true, konvaObject: rawTextResult.konvaObject } : { success: false },
        image: imageResult ? { success: true, konvaObject: imageResult.konvaObject } : { success: false },
        stylesheet: stylesheetResult ? { success: true, konvaObject: stylesheetResult.konvaObject } : { success: false },
      },
    };

  } catch (error) {
    console.error("\n❌ UNIFIED WEB DECK GENERATION FAILED");
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    throw error;
  }
}

/**
 * Convert Konva object to Presentation slide schema
 * @param {Object} konvaObject - The Konva object from individual service
 * @param {number} slideNumber - Slide number in presentation
 * @param {string} contentType - Type of content (e.g., 'raw-text-content', 'image-content')
 * @param {string} layoutType - Layout type for the slide
 * @returns {Object} Slide object compliant with Presentation schema
 */
function convertKonvaToSlide(konvaObject, slideNumber, contentType, layoutType, websiteData = null, globalStylesheet = null) {
  const slideId = `slide-${crypto.randomUUID()}`;

  // Base slide structure
  const slide = {
    slide_id: slideId,
    // Normalize layout_type to follow generateSlideText conventions
    layout_type: normalizeLayoutType(layoutType, konvaObject, contentType),
    content_type: contentType,
    visual_suggestion: konvaObject.image?.description || "",
    knowledge: {},
    // Prefer explicit art style/palette from konva object, then stylesheet, then website aesthetics
    art_style: konvaObject.art_style || globalStylesheet?.title || globalStylesheet?.typography?.primaryFont || "web-extracted",
    art_palette: konvaObject.colorPalette || globalStylesheet?.colorPalette || websiteData?.aesthetics?.colors || [],
    slide_title: {
      text: konvaObject.title || "Untitled Slide",
    },
    elements: [],
    image_url: null,
    image_urls: [],
    image_caption: "",
    image_placeholder: {
      x: 520,
      y: 40,
      width: 400,
      height: 460,
    },
    content_metadata: {
      bullet_count: 0,
      has_quote: false,
      has_data: false,
    },
    slide_number: slideNumber,
    total_slides: 3, // Will be updated by caller
    created_at: new Date(),
    updated_at: new Date(),
  };

  // Attach headings (if available) to the slide for richer context
  if (websiteData && websiteData.raw && Array.isArray(websiteData.raw.headings)) {
    slide.headings = websiteData.raw.headings.map(h => ({ level: h.level, text: h.text }));
  }

  // Handle Raw Text Content (bullet points)
  if (konvaObject.bullet && Array.isArray(konvaObject.bullet)) {
    slide.elements = konvaObject.bullet.map((bulletText) => ({
      id: crypto.randomUUID(),
      element_type: "bullet_point",
      text: bulletText,
    }));
    slide.content_metadata.bullet_count = konvaObject.bullet.length;
  }

  // Handle Image Content
  // Fill image fields: prefer konvaObject.imageUrl; also populate image_urls from websiteData
  if (konvaObject.imageUrl) {
    slide.image_url = konvaObject.imageUrl;
    slide.image_caption = konvaObject.imageCaption || "";
    slide.image_urls = [konvaObject.imageUrl];
  }

  // If websiteData provides images, attach top images array (objects with src/alt/width/height)
  if (websiteData && websiteData.raw && Array.isArray(websiteData.raw.images) && websiteData.raw.images.length > 0) {
    const topImages = websiteData.raw.images.slice(0, 8).map(img => ({
      src: img.src || img.src || img.url || null,
      alt: img.alt || img.title || "",
      width: img.width || null,
      height: img.height || null
    }));
    // Merge into image_urls if empty
    if (!slide.image_url && topImages.length > 0) {
      slide.image_url = topImages[0].src;
      slide.image_caption = topImages[0].alt || "";
    }
    slide.image_urls = Array.from(new Set([...(slide.image_urls || []), ...topImages.map(i => i.src)])).filter(Boolean);
    // also attach images array for richer metadata
    slide.images = topImages;
  }

  // Handle Design System Content (Typography as text elements)
  if (konvaObject.typography) {
    const typo = konvaObject.typography;
    slide.elements.push({
      id: crypto.randomUUID(),
      element_type: "description",
      text: `Primary Font: ${typo.primaryFont || "Not specified"}`,
    });
    slide.elements.push({
      id: crypto.randomUUID(),
      element_type: "description",
      text: `Font Style: ${typo.fontStyle || "Not specified"}`,
    });
    // Handle fontSizes - it can be either string or array
    if (typo.fontSizes) {
      const fontSizesText = Array.isArray(typo.fontSizes) 
        ? typo.fontSizes.join(", ") 
        : typo.fontSizes.toString();
      slide.elements.push({
        id: crypto.randomUUID(),
        element_type: "description",
        text: `Font Sizes: ${fontSizesText}`,
      });
    }
  }

  // Handle Color Palette (add as visual metadata)
  if (konvaObject.colorPalette && Array.isArray(konvaObject.colorPalette) && konvaObject.colorPalette.length > 0) {
    slide.art_palette = konvaObject.colorPalette;
    slide.elements.push({
      id: crypto.randomUUID(),
      element_type: "description",
      text: `Color Palette: ${konvaObject.colorPalette.join(", ")}`,
    });
  }

  // If art_palette still empty, inherit from global stylesheet or website aesthetics
  if ((!slide.art_palette || slide.art_palette.length === 0) && globalStylesheet) {
    slide.art_palette = globalStylesheet.colorPalette || globalStylesheet.colorPalette || (websiteData?.aesthetics?.colors || []);
  }

  return slide;
}

/**
 * Extract a topic name from URL
 * @param {string} url - The website URL
 * @returns {string} Extracted topic
 */
function extractTopicFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace("www.", "");
    const pathParts = urlObj.pathname.split("/").filter((part) => part.length > 0);

    if (pathParts.length > 0) {
      // Use last meaningful path segment
      const lastPart = pathParts[pathParts.length - 1];
      return lastPart.replace(/[-_]/g, " ").substring(0, 100);
    }

    // Fallback to hostname
    return hostname.substring(0, 100);
  } catch (error) {
    return "Web Content Presentation";
  }
}

/**
 * Normalize human-friendly layout labels to standard slide types used across services
 */
function normalizeLayoutType(layoutType, konvaObject, contentType) {
  const lt = (layoutType || "").toString().toLowerCase();

  // If layoutType already appears to be a standard type, return as-is
  const standardTypes = [
    "cover-hero",
    "content-right-image",
    "content-left-image",
    "content-split",
    "quote-slide",
    "infographic-bullets",
    "call-to-action",
    "conclusion",
    "design-system"
  ];
  if (standardTypes.includes(layoutType)) return layoutType;

  // Heuristic mapping
  if (lt.includes("text") || contentType === "raw-text-content") {
    // prefer content-right-image when there are bullets or an image
    if (konvaObject && ((konvaObject.bullet && konvaObject.bullet.length > 0) || konvaObject.imageUrl)) {
      return "content-right-image";
    }
    return "cover-hero";
  }

  if (lt.includes("visual") || contentType === "image-content") {
    return "content-right-image";
  }

  if (lt.includes("design") || contentType === "design-system") {
    return "content-split";
  }

  // Fallback
  return "content-right-image";
}

/**
 * Generate unified presentation from pre-extracted data
 * (Alternative method if you already have data from fetchWebsiteText)
 * @param {Object} rawData - Raw text data
 * @param {Array} images - Array of image objects
 * @param {Object} stylesheetData - Stylesheet and aesthetics data
 * @returns {Promise<Object>} Complete presentation object
 */
async function generateUnifiedWebDeckFromData(rawData, images, stylesheetData) {
  console.log("\n=== 🚀 UNIFIED WEB DECK FROM DATA STARTED ===");

  try {
    // Note: Individual services don't have "from data" methods yet
    // This is a placeholder for future implementation
    throw new Error("generateUnifiedWebDeckFromData not yet implemented. Use generateUnifiedWebDeck with URL.");
  } catch (error) {
    console.error("\n❌ UNIFIED WEB DECK FROM DATA FAILED");
    console.error(`   Error: ${error.message}`);
    throw error;
  }
}

module.exports = {
  generateUnifiedWebDeck,
  generateUnifiedWebDeckFromData,
};
