// bridgeTemplate.js
const Ajv = require("ajv");
const schema = require("../utils/slideSchema");
const { layouts, selectLayout } = require('./layoutTemplate');
const ajv = new Ajv({ allErrors: true });

const DEFAULT_FONT = "Roboto, Inter, sans-serif";
const TITLE_FONT_SIZE = 32;
const BODY_FONT_SIZE = 18;
const MARGIN = 20;
const MAX_IMAGE_WIDTH = 768; // 80% of 960
const MAX_IMAGE_HEIGHT = 432; // 80% of 540

function normalizeElement(el, idx, slide) {
  const baseZ = (idx + 1) * 10;

  // Title
  if (el.element_type === "title") {
    el.text = el.text || slide.slide_title || "Untitled Slide";
    el.properties = {
      ...el.properties,
      fontSize: el.properties?.fontSize || TITLE_FONT_SIZE,
      fontFamily: el.properties?.fontFamily || DEFAULT_FONT,
      fontWeight: el.properties?.fontWeight || "bold",
      fill: el.properties?.fill || "#222222",
      align: el.properties?.align || "center",
      zIndex: 9999,
      x: el.properties?.x ?? MARGIN,
      y: el.properties?.y ?? MARGIN,
      width: el.properties?.width ?? 960 - 2 * MARGIN,
      height: el.properties?.height ?? 60,
    };
    return el;
  }

  // Text or Bullet Point
  if (["text", "bullet_point"].includes(el.element_type)) {
    el.text = el.text || "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
    el.properties = {
      ...el.properties,
      fontSize: el.properties?.fontSize || BODY_FONT_SIZE,
      fontFamily: el.properties?.fontFamily || DEFAULT_FONT,
      fill: el.properties?.fill || "#444444",
      align: el.properties?.align || "left",
      zIndex: el.properties?.zIndex || baseZ + 1000,
      x: el.properties?.x ?? MARGIN + 20,
      y: el.properties?.y ?? MARGIN + 80,
      width: el.properties?.width ?? 400,
      height: el.properties?.height ?? 100,
    };
    return el;
  }

  // Shape
  if (el.element_type === "shape") {
    const shapeType = el.konva_component?.split(".")[1] || "Rect";
    el.properties = {
      ...el.properties,
      fill: el.properties?.fill || "#E0E0E0",
      opacity: el.properties?.opacity ?? 0.5,
      cornerRadius: shapeType === "Rect" ? (el.properties?.cornerRadius ?? 15) : undefined,
      zIndex: el.properties?.zIndex || baseZ + 100,
      x: el.properties?.x ?? MARGIN,
      y: el.properties?.y ?? MARGIN + 80,
      width: el.properties?.width ?? 400,
      height: el.properties?.height ?? 300,
    };
    if (shapeType === "Ellipse") {
      el.properties.radiusX = el.properties.radiusX ?? el.properties.width / 2;
      el.properties.radiusY = el.properties.radiusY ?? el.properties.height / 2;
    }
    return el;
  }

  // Image
  if (el.element_type === "image") {
    el.properties = {
      ...el.properties,
      imageSrc: el.properties?.imageSrc || `https://placehold.co/${Math.min(el.properties?.width || 300, MAX_IMAGE_WIDTH)}x${Math.min(el.properties?.height || 200, MAX_IMAGE_HEIGHT)}`,
      zIndex: el.properties?.zIndex || baseZ + 10,
      width: Math.min(el.properties?.width || 300, MAX_IMAGE_WIDTH),
      height: Math.min(el.properties?.height || 200, MAX_IMAGE_HEIGHT),
      x: el.properties?.x ?? 960 - (el.properties?.width || 300) - MARGIN,
      y: el.properties?.y ?? MARGIN + 80,
      cornerRadius: el.properties?.cornerRadius ?? 15,
    };
    return el;
  }

  return el;
}

function normalizeSlide(slide, slideIndex) {
  // IDs
  slide.slide_id = slide.slide_id || `slide-${Date.now()}-${slideIndex}`;
  slide.image_url = slide.image_url || "";
  const layoutKey = selectLayout(slide);
  return layouts[layoutKey](slide);

  // Ensure elements array
  slide.elements = slide.elements || [];

  // Ensure title exists
  if (!slide.elements.find((e) => e.element_type === "title")) {
    slide.elements.unshift({
      element_type: "title",
      konva_component: "Konva.Text",
      text: slide.slide_title || `Slide ${slideIndex + 1}`,
      properties: {
        fontSize: TITLE_FONT_SIZE,
        fontFamily: DEFAULT_FONT,
        fontWeight: "bold",
        fill: "#222222",
        x: MARGIN,
        y: MARGIN,
        width: 960 - 2 * MARGIN,
        height: 60,
        align: "center",
        zIndex: 9999,
      },
    });
  }

  // Normalize elements
  slide.elements = slide.elements.map((el, idx) => normalizeElement(el, idx, slide));

  // Adjust shape sizes to fit text
  slide.elements.forEach((el, idx) => {
    if (el.element_type === "shape" && slide.elements.some((e) => ["text", "bullet_point"].includes(e.element_type))) {
      const textEls = slide.elements.filter((e) => ["text", "bullet_point"].includes(e.element_type) && e.properties.x >= el.properties.x && e.properties.y >= el.properties.y);
      if (textEls.length) {
        const maxTextWidth = Math.max(...textEls.map((e) => e.properties.width));
        const maxTextHeight = Math.max(...textEls.map((e) => e.properties.height));
        el.properties.width = Math.max(el.properties.width, maxTextWidth + 40);
        el.properties.height = Math.max(el.properties.height, maxTextHeight + 40);
      }
    }
  });

  return slide;
}

function bridgeTemplate(slides) {
  const validate = ajv.compile(schema);
  if (!validate(slides)) {
    console.warn("Schema validation failed, fixing...", validate.errors);
  }

  return slides.map((s, i) => normalizeSlide(s, i));
}

module.exports = { bridgeTemplate };