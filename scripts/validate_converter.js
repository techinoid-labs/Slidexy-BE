/**
 * Second-opinion check of pptxToDeck.js against pptxtojson.
 *
 *   node scripts/validate_converter.js <input.pptx> <deck-id>
 *
 * pptxtojson is a comparator. It does not replace the converter.
 */

const fs = require("fs");
const path = require("path");
const pptxtojson = require("pptxtojson/dist/index.cjs");
const { convertPptx } = require("../services/templatePipeline/convert/pptxToDeck");

const ROOT = path.join(__dirname, "..");

function arrayBufferOf(buffer) {
  if (buffer.byteOffset === 0 && buffer.byteLength === buffer.buffer.byteLength) return buffer.buffer;
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function normalizeText(value) {
  return decodeHtml(value).replace(/\s+/g, " ").trim();
}

function flatten(elements, out) {
  (elements || []).forEach((element) => {
    if (!element) return;
    if (element.type === "group" && Array.isArray(element.elements)) flatten(element.elements, out);
    else out.push(element);
  });
  return out;
}

function leaf(element) {
  if (element && element.type === "rotated" && element.element) return leaf(element.element);
  return element;
}

function ourText(element) {
  const node = leaf(element);
  if (!node || node.type !== "text") return "";
  const spans = node.textContent && node.textContent.spans;
  if (Array.isArray(spans) && spans.length) return normalizeText(spans.map((span) => span.text || "").join(""));
  return "";
}

function finiteBox(element) {
  return ["x", "y", "width", "height"].every((key) => Number.isFinite(Number(element[key])));
}

function referenceBox(element) {
  return ["left", "top", "width", "height"].every((key) => Number.isFinite(Number(element[key])));
}

function fullyOutside(element, slideW, slideH) {
  if (!referenceBox(element)) return false;
  const left = Number(element.left);
  const top = Number(element.top);
  const width = Number(element.width);
  const height = Number(element.height);
  return left + width <= 0 || top + height <= 0 || left >= slideW || top >= slideH;
}

function imageBearing(element) {
  if (!element) return false;
  if (element.type === "image") return true;
  return !!(element.fill && element.fill.type === "image");
}

function painted(element) {
  const fill = element.fill && element.fill.type;
  const border = Number(element.borderWidth) > 0;
  return fill === "color" || fill === "gradient" || fill === "pattern" || fill === "image" || border || element.type === "image";
}

function contentElement(element, slideW, slideH) {
  if (fullyOutside(element, slideW, slideH)) return false;
  if (normalizeText(element.content)) return true;
  return painted(element);
}

function ourImages(elements) {
  let count = 0;
  elements.forEach((element) => {
    const node = leaf(element);
    if (!node) return;
    if (node.type === "image" || node.type === "maskedImage") count += 1;
    if (node.type === "collage" && node.collageContent) count += (node.collageContent.cells || []).length;
  });
  return count;
}

function missingTexts(referenceTexts, ourTexts) {
  const combined = ourTexts.filter(Boolean).join(" ");
  const needed = new Map();
  referenceTexts.filter(Boolean).forEach((text) => needed.set(text, (needed.get(text) || 0) + 1));
  const missing = [];
  needed.forEach((count, text) => {
    let have = 0;
    let from = 0;
    while (from <= combined.length) {
      const at = combined.indexOf(text, from);
      if (at < 0) break;
      have += 1;
      from = at + text.length;
    }
    for (let i = have; i < count; i += 1) missing.push(text);
  });
  return missing;
}

function compare(ourDeck, referenceJson) {
  const slideW = referenceJson.size && referenceJson.size.width;
  const slideH = referenceJson.size && referenceJson.size.height;
  const slides = [];
  let missingElements = 0;
  let missingTextCount = 0;
  let imageMismatches = 0;
  let geometryFlags = 0;
  const referenceSlides = referenceJson.slides || [];
  ourDeck.layoutSequence.forEach((layoutId, index) => {
    const layout = ourDeck.layouts[layoutId];
    const ours = (layout && layout.elements) || [];
    const referenceSlide = referenceSlides[index] || { elements: [] };
    const flat = flatten(referenceSlide.elements, []);
    const content = flat.filter((element) => contentElement(element, slideW, slideH));
    const offCanvas = flat.filter((element) => fullyOutside(element, slideW, slideH)).length;
    const unpainted = flat.filter((element) => !fullyOutside(element, slideW, slideH) && !contentElement(element, slideW, slideH)).length;
    const shortfall = Math.max(0, content.length - ours.length);
    const referenceTexts = flat.map((element) => normalizeText(element.content)).filter(Boolean);
    const texts = ours.map(ourText).filter(Boolean);
    const droppedText = missingTexts(referenceTexts, texts);
    const referenceImages = flat.filter(imageBearing).length + ((referenceSlide.fill && referenceSlide.fill.type === "image") ? 1 : 0);
    const ourImageCount = ourImages(ours);
    const referenceHasBox = flat.some(referenceBox);
    const badGeometry = referenceHasBox
      ? ours.filter((element) => !finiteBox(element)).map((element) => element.id || null)
      : [];
    const hairlines = content.filter((element) => Number(element.width) === 0 || Number(element.height) === 0 || element.shapType === "line").length;
    const shadows = flat.filter((element) => element.shadow).length;
    missingElements += shortfall;
    missingTextCount += droppedText.length;
    if (referenceImages !== ourImageCount) imageMismatches += 1;
    geometryFlags += badGeometry.length;
    slides.push({
      slide: index + 1,
      layoutId,
      referenceTopLevel: (referenceSlide.elements || []).length,
      referenceFlattened: flat.length,
      referenceContent: content.length,
      referenceOffCanvas: offCanvas,
      referenceUnpainted: unpainted,
      ourElements: ours.length,
      missingElements: shortfall,
      referenceTexts: referenceTexts.length,
      ourTexts: texts.length,
      missingText: droppedText,
      referenceImages,
      ourImages: ourImageCount,
      imageMismatch: referenceImages !== ourImageCount,
      missingGeometry: badGeometry,
      referenceShadows: shadows,
      hairlines,
    });
  });
  const extraReferenceSlides = Math.max(0, referenceSlides.length - ourDeck.layoutSequence.length);
  return {
    deckId: ourDeck.id.replace(/^validate-/, ""),
    sourceSlides: referenceSlides.length,
    ourSlides: ourDeck.layoutSequence.length,
    extraReferenceSlides,
    missingElements,
    missingTextCount,
    imageMismatches,
    geometryFlags,
    blocker: missingElements > 3 || missingTextCount > 1 || extraReferenceSlides > 0,
    slides,
  };
}

function cleanup(deckId) {
  const jsonPath = path.join(ROOT, "app-library", "validate-" + deckId + ".json");
  const photoDir = path.join(ROOT, "generated-templates", "photos", "validate-" + deckId);
  if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath);
  fs.rmSync(photoDir, { recursive: true, force: true });
}

async function validate(pptxPath, deckId) {
  const input = path.resolve(pptxPath);
  const sideId = "validate-" + deckId;
  let report;
  try {
    convertPptx(input, sideId);
    const ourDeck = JSON.parse(fs.readFileSync(path.join(ROOT, "app-library", sideId + ".json"), "utf8"));
    const buffer = fs.readFileSync(input);
    const referenceJson = await pptxtojson.parse(arrayBufferOf(buffer), {
      imageMode: "base64",
      videoMode: "none",
      audioMode: "none",
    });
    report = compare(ourDeck, referenceJson);
    report.pptx = path.relative(ROOT, input).replace(/\\/g, "/");
    report.comparedAt = new Date().toISOString();
    report.notes = [
      "Element totals flatten pptxtojson groups and ignore fully off-canvas shapes and unpainted shapes with no text.",
      "Those unpainted rectangles are duplicates pptxtojson emits beside custom geometry. They are counted in referenceFlattened, not in missingElements.",
      "Text is present when the reference string occurs in the slide's text joined across elements. A paragraph split across boxes is not counted as dropped.",
      "Image totals count pptxtojson image elements, image fills, and a slide image background.",
    ];
  } finally {
    cleanup(deckId);
  }
  const outDir = path.join(ROOT, "docs", "template-pipeline", "converter-validation");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, deckId + ".json");
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({
    deckId,
    missingElements: report.missingElements,
    missingTextCount: report.missingTextCount,
    imageMismatches: report.imageMismatches,
    geometryFlags: report.geometryFlags,
    blocker: report.blocker,
    file: path.relative(ROOT, outFile),
  }));
  return report;
}

if (require.main === module) {
  const input = process.argv[2];
  const deckId = process.argv[3];
  if (!input || !deckId) {
    console.error("Usage: node scripts/validate_converter.js <input.pptx> <deck-id>");
    process.exit(1);
  }
  validate(input, deckId).then((report) => {
    if (report.blocker) process.exitCode = 2;
  }).catch((error) => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  });
}

module.exports = { validate };
