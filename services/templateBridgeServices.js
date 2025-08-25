const Ajv = require("ajv");
const schema = require("../utils/slideSchema");
const { templateJSONService } = require("./templateJSONService");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const ajv = new Ajv({ allErrors: true });

const DEFAULT_FONT = "Montserrat, sans-serif";
const TITLE_FONT_SIZE = 36;
const BODY_FONT_SIZE = 18;
const MARGIN = 40;
const MAX_IMAGE_WIDTH = 768;
const MAX_IMAGE_HEIGHT = 432;

function normalizeElement(el, idx, slide) {
  const baseZ = (idx + 1) * 10;

  if (el.element_type === "title") {
    el.text = el.text || slide.slide_title || "Untitled Slide";
    el.properties = {
      ...el.properties,
      fontSize: el.properties?.fontSize || TITLE_FONT_SIZE,
      fontFamily: el.properties?.fontFamily || DEFAULT_FONT,
      fontWeight: el.properties?.fontWeight || "bold",
      fill: el.properties?.fill || "#1F2937",
      align: el.properties?.align || "center",
      zIndex: 9999,
      x: el.properties?.x ?? MARGIN,
      y: el.properties?.y ?? MARGIN,
      width: el.properties?.width ?? 960 - 2 * MARGIN,
      height: el.properties?.height ?? 80,
    };
    return el;
  }

  if (["text", "bullet_point"].includes(el.element_type)) {
    el.text = el.text || "Lorem ipsum dolor sit amet.";
    el.properties = {
      ...el.properties,
      fontSize: el.properties?.fontSize || BODY_FONT_SIZE,
      fontFamily: el.properties?.fontFamily || DEFAULT_FONT,
      fill: el.properties?.fill || "#4B5563",
      align: el.properties?.align || "left",
      zIndex: el.properties?.zIndex || baseZ + 1000,
      x: el.properties?.x ?? MARGIN + 20,
      y: el.properties?.y ?? MARGIN + 100,
      width: el.properties?.width ?? 400,
      height: el.properties?.height ?? 100,
    };
    return el;
  }

  if (el.element_type === "shape") {
    const shapeType = el.konva_component?.split(".")[1] || "Rect";
    el.properties = {
      ...el.properties,
      fill: el.properties?.fill || "#E5E7EB",
      opacity: el.properties?.opacity ?? 0.7,
      cornerRadius: shapeType === "Rect" ? (el.properties?.cornerRadius ?? 15) : undefined,
      zIndex: el.properties?.zIndex || baseZ + 100,
      x: el.properties?.x ?? MARGIN,
      y: el.properties?.y ?? MARGIN + 100,
      width: el.properties?.width ?? 400,
      height: el.properties?.height ?? 300,
    };
    if (shapeType === "Ellipse") {
      el.properties.radiusX = el.properties.radiusX ?? el.properties.width / 2;
      el.properties.radiusY = el.properties.radiusY ?? el.properties.height / 2;
    }
    return el;
  }

  if (el.element_type === "image") {
    el.properties = {
      ...el.properties,
      imageSrc: el.properties?.imageSrc || `https://placehold.co/${Math.min(el.properties?.width || 300, MAX_IMAGE_WIDTH)}x${Math.min(el.properties?.height || 200, MAX_IMAGE_HEIGHT)}`,
      zIndex: el.properties?.zIndex || baseZ + 10,
      width: Math.min(el.properties?.width || 300, MAX_IMAGE_WIDTH),
      height: Math.min(el.properties?.height || 200, MAX_IMAGE_HEIGHT),
      x: el.properties?.x ?? 960 - (el.properties?.width || 300) - MARGIN,
      y: el.properties?.y ?? MARGIN + 100,
      cornerRadius: el.properties?.cornerRadius ?? 15,
    };
    return el;
  }

  return el;
}

function normalizeSlide(slide, slideIndex) {
  slide.slide_id = slide.slide_id || `slide-${Date.now()}-${slideIndex}`;
  slide.image_url = slide.image_url || "";
  slide.elements = slide.elements || [];

  if (!slide.elements.find((e) => e.element_type === "title")) {
    slide.elements.unshift({
      element_type: "title",
      konva_component: "Konva.Text",
      text: slide.slide_title || `Slide ${slideIndex + 1}`,
      properties: {
        fontSize: TITLE_FONT_SIZE,
        fontFamily: DEFAULT_FONT,
        fontWeight: "bold",
        fill: "#1F2937",
        x: MARGIN,
        y: MARGIN,
        width: 960 - 2 * MARGIN,
        height: 80,
        align: "center",
        zIndex: 9999,
      },
    });
  }

  slide.elements = slide.elements.map((el, idx) => normalizeElement(el, idx, slide));

  return slide;
}


async function refineWithGemini(slides, topic, meta) {
  const prompt = createGeminiPrompt(slides, topic, meta);
  const refinedSlides = await templateJSONService(topic, meta, slides.length, prompt);
  return refinedSlides;
}


async function bridgeTemplate(slides, topic, meta) {
  const validate = ajv.compile(schema);
  if (!validate(slides)) {
    console.warn("Schema validation failed, fixing...", validate.errors);
  }

  // Step 1: Normalize
  let normalizedSlides = slides.map((s, i) => normalizeSlide(s, i));

  // Step 2: Gemini refinement
  //let refinedSlides = await refineWithGemini(normalizedSlides, topic, meta);

  // Step 3: Normalize again
  refinedSlides = normalizedSlides.map((s, i) => normalizeSlide(s, i));

  // Step 5: Final normalize
  finalSlides = normalizedSlides.map((s, i) => normalizeSlide(s, i));

  return finalSlides;
}

module.exports = { bridgeTemplate };
