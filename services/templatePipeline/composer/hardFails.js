/**
 * Composer-local hard fails (no network). Appended beside geometry analysis.
 */

const fs = require("fs");
const path = require("path");
const { countCanvasLines } = require("./canvasLines");

const PHOTO_ROOT = path.join(__dirname, "..", "..", "..", "generated-templates");

function boxOf(el) {
  const x = Number(el.x) || 0;
  const y = Number(el.y) || 0;
  return { x, y, right: x + (Number(el.width) || 0), bottom: y + (Number(el.height) || 0), w: Number(el.width) || 0, h: Number(el.height) || 0 };
}

function overlap(a, b) {
  const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y));
  return x * y;
}

function resolvePhoto(url) {
  const rel = String(url || "").replace(/\\/g, "/").replace(/^generated-templates\//, "");
  if (!rel || rel.indexOf("photos/") !== 0) return null;
  const file = path.resolve(PHOTO_ROOT, rel);
  const relative = path.relative(PHOTO_ROOT, file);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return { exists: false, file };
  return { exists: fs.existsSync(file), file };
}

function spanText(el) {
  const spans = (el.textContent && el.textContent.spans) || [];
  return spans.map((s) => String(s && s.text != null ? s.text : "")).join("").trim();
}

function isOptionalSlot(el) {
  if (el.slot && el.slot.optional) return true;
  const role = el.slot && el.slot.dataRole;
  if (role === "kicker") return true;
  if (/^item-[56]$/.test(String(el.id || "").replace(/^composer-[^-]+-/, ""))) return true;
  return false;
}

function composerHardFails(deck, layoutId) {
  const layout = deck.layouts && deck.layouts[layoutId];
  const elements = (layout && layout.elements) || [];
  const reasons = [];
  const texts = elements.filter((el) => el && el.type === "text");
  const pictures = elements.filter((el) => el && (el.type === "image" || el.type === "maskedImage"));
  const shapes = elements.filter((el) => el && el.type === "shape");

  texts.forEach((el) => {
    if (!el.slot) return;
    if (isOptionalSlot(el)) return;
    if (!spanText(el)) reasons.push("unfilled slot " + el.id);
  });

  texts.forEach((el) => {
    const measured = el.textMeasure && el.textMeasure.lines;
    if (!Number.isFinite(measured)) return;
    if (!spanText(el)) return;
    const canvas = countCanvasLines(el, deck.tokens);
    if (canvas.lines > measured) {
      reasons.push("wrap mismatch on " + el.id + " (canvas " + canvas.lines + " > measure " + measured + ")");
    }
  });

  texts.forEach((text) => {
    const tb = boxOf(text);
    pictures.forEach((pic) => {
      if (overlap(tb, boxOf(pic)) <= 0) return;
      const tz = Number(text.zIndex) || 0;
      const pz = Number(pic.zIndex) || 0;
      if (pz > tz) reasons.push("text under picture (" + text.id + " under " + pic.id + ")");
    });
  });

  pictures.forEach((pic) => {
    const pb = boxOf(pic);
    const picArea = Math.max(1, pb.w * pb.h);
    shapes.forEach((shape) => {
      if (shape.isDecoration || shape.originalRole === "decoration") return;
      const op = Number(shape.opacity);
      if (Number.isFinite(op) && op < 0.5) return;
      const fill = shape.shapeContent && shape.shapeContent.fill;
      if (!fill || fill === "none") return;
      const sz = Number(shape.zIndex) || 0;
      const pz = Number(pic.zIndex) || 0;
      if (sz <= pz) return;
      const share = overlap(pb, boxOf(shape)) / picArea;
      if (share > 0.6) reasons.push("photo under shape (" + pic.id + " under " + shape.id + ")");
    });
  });

  elements.forEach((el) => {
    const content = el && (el.imageContent || el.maskedImageContent);
    if (!content || !content.url) return;
    const resolved = resolvePhoto(content.url);
    if (resolved && !resolved.exists) reasons.push("missing image " + content.url);
  });

  return { pass: reasons.length === 0, reasons };
}

function applyComposerFails(analysis, deck) {
  const next = Object.assign({}, analysis || {});
  const slides = Array.isArray(next.slides) ? next.slides.slice() : [];
  const failures = Array.isArray(next.failures) ? next.failures.slice() : [];
  const sequence = deck.layoutSequence || Object.keys(deck.layouts || {});
  sequence.forEach((layoutId, index) => {
    const hard = composerHardFails(deck, layoutId);
    const slide = slides[index] || { slide: index + 1, pass: true, score: 100, reasons: [], vision: null };
    if (!hard.pass) {
      slide.pass = false;
      slide.score = 0;
      slide.reasons = (slide.reasons || []).concat(hard.reasons);
      hard.reasons.forEach((reason) => failures.push(reason + " on slide " + (index + 1)));
    }
    slides[index] = slide;
  });
  const total = slides.length || 1;
  const passed = slides.filter((s) => s.pass).length;
  next.slides = slides;
  next.failures = failures;
  next.passed = passed;
  next.total = slides.length;
  next.score = Math.round((100 * passed) / total);
  next.composer = true;
  return next;
}

module.exports = { composerHardFails, applyComposerFails, resolvePhoto };
