/**
 * Reported-only aesthetic metrics for composer decks. No effect on analysis.score.
 */

const fs = require("fs");
const path = require("path");

const DESIGN = path.join(__dirname, "..", "..", "..", "design-system");

function loadTypeScale() {
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(DESIGN, "manifest.json"), "utf8"));
    return Array.isArray(manifest.typeScale) ? manifest.typeScale : [];
  } catch (error) {
    return [];
  }
}

function boxOf(el) {
  const x = Number(el.x) || 0;
  const y = Number(el.y) || 0;
  const w = Number(el.width) || 0;
  const h = Number(el.height) || 0;
  return { x, y, right: x + w, bottom: y + h, w, h, area: w * h };
}

function isDecoration(el) {
  return Boolean(el && (el.isDecoration || el.originalRole === "decoration" || /^signature-/.test(String(el.id || ""))));
}

function isBleed(box) {
  return box.x <= 2 && box.y <= 2 && box.w >= 1590 && box.h >= 890;
}

function round8(n) {
  return Math.round(Number(n) / 8) * 8;
}

function unionArea(boxes) {
  // Grid sample for union (deterministic, good enough for whitespace)
  const W = 1600;
  const H = 900;
  const step = 8;
  let covered = 0;
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      const hit = boxes.some((b) => x >= b.x && x < b.right && y >= b.y && y < b.bottom);
      if (hit) covered += step * step;
    }
  }
  return covered;
}

function slideAesthetic(deck, layoutId, typeScale) {
  const layout = deck.layouts && deck.layouts[layoutId];
  const elements = (layout && layout.elements) || [];
  const content = elements.filter((el) => el && !isDecoration(el));
  const boxes = content.map(boxOf);
  const nonBleed = boxes.filter((b) => !isBleed(b));

  const lefts = new Set();
  const rights = new Set();
  const tops = new Set();
  nonBleed.forEach((b) => {
    lefts.add(round8(b.x));
    rights.add(round8(b.right));
    tops.add(round8(b.y));
  });

  let minL = 1600;
  let minR = 1600;
  let minT = 900;
  let minB = 900;
  nonBleed.forEach((b) => {
    minL = Math.min(minL, b.x);
    minR = Math.min(minR, 1600 - b.right);
    minT = Math.min(minT, b.y);
    minB = Math.min(minB, 900 - b.bottom);
  });
  if (!nonBleed.length) {
    minL = minR = minT = minB = 0;
  }

  const whitespace = 1 - unionArea(nonBleed.length ? nonBleed : boxes) / (1600 * 900);

  const texts = elements.filter((el) => el && el.type === "text");
  let minFont = Infinity;
  let minArea = Infinity;
  let chars = 0;
  const sizes = [];
  texts.forEach((el) => {
    const style = el.textStyle || {};
    const size = Number(style.fontSize) || 0;
    sizes.push(size);
    if (size > 0) minFont = Math.min(minFont, size);
    const b = boxOf(el);
    if (b.area > 0) minArea = Math.min(minArea, b.area);
    const spans = (el.textContent && el.textContent.spans) || [];
    spans.forEach((s) => { chars += String(s && s.text != null ? s.text : "").length; });
  });
  if (!Number.isFinite(minFont)) minFont = 0;
  if (!Number.isFinite(minArea)) minArea = 0;

  const scale = typeScale || loadTypeScale();
  const onScale = sizes.length === 0 || sizes.every((s) => scale.indexOf(s) >= 0 || scale.indexOf(Math.round(s)) >= 0);

  // stackGap: max consecutive member gap minus compiled stack gap (0 if no stacks).
  let stackGap = 0;
  const byId = {};
  elements.forEach((el) => { byId[el.id] = el; });
  (layout.stacks || []).forEach((stack) => {
    const blocksById = {};
    (stack.blocks || []).forEach((b) => { blocksById[b.id] = b; });
    const members = (stack.order || []).map((id) => {
      if (byId[id]) return { y: Number(byId[id].y) || 0, height: Number(byId[id].height) || 0 };
      if (blocksById[id]) return { y: Number(blocksById[id].y) || 0, height: Number(blocksById[id].height) || 0 };
      return null;
    }).filter(Boolean);
    const compiledGap = Number(stack.gap) || 0;
    for (let i = 0; i < members.length - 1; i += 1) {
      const a = members[i];
      const b = members[i + 1];
      const gap = b.y - (a.y + a.height);
      stackGap = Math.max(stackGap, gap - compiledGap);
    }
  });
  stackGap = Math.round(stackGap * 100) / 100;

  // coverVisualMass: area share of pictures + accent-filled shapes on Cover slides only.
  let coverVisualMass = null;
  const role = layout.role || "";
  if (role === "Cover" || layout.component === "cover") {
    let mass = 0;
    elements.forEach((el) => {
      if (!el) return;
      const b = boxOf(el);
      if (el.type === "image" || el.type === "maskedImage") {
        mass += b.area;
        return;
      }
      if (el.type !== "shape") return;
      const fill = el.shapeContent && el.shapeContent.fill;
      if (!fill) return;
      const isAccent = fill === "{color.accent}" || fill === "{color.accent2}"
        || /accent/i.test(String(el.id || ""));
      if (isAccent) mass += b.area;
    });
    coverVisualMass = Math.round((mass / (1600 * 900)) * 1000) / 1000;
  }

  return {
    edgeAlignment: { left: lefts.size, right: rights.size, top: tops.size },
    margin: { left: round(minL), right: round(minR), top: round(minT), bottom: round(minB) },
    whitespaceRatio: Math.round(whitespace * 1000) / 1000,
    minTextBox: { fontSize: minFont, area: Math.round(minArea) },
    typeScaleOk: onScale,
    textDensity: chars,
    stackGap,
    coverVisualMass,
  };
}

function round(n) {
  return Math.round(Number(n) * 100) / 100;
}

function attachAesthetics(analysis, deck) {
  const typeScale = loadTypeScale();
  const next = Object.assign({}, analysis || {});
  const slides = Array.isArray(next.slides) ? next.slides.slice() : [];
  const sequence = deck.layoutSequence || Object.keys(deck.layouts || {});
  const perSlide = [];
  sequence.forEach((layoutId, index) => {
    const aesthetic = slideAesthetic(deck, layoutId, typeScale);
    perSlide.push(aesthetic);
    const slide = slides[index] || { slide: index + 1, pass: true, score: 100, reasons: [], vision: null };
    slide.aesthetic = aesthetic;
    slides[index] = slide;
  });
  const summary = {
    slides: perSlide.length,
    avgWhitespace: perSlide.length
      ? Math.round((perSlide.reduce((s, a) => s + a.whitespaceRatio, 0) / perSlide.length) * 1000) / 1000
      : 0,
    avgTextDensity: perSlide.length
      ? Math.round(perSlide.reduce((s, a) => s + a.textDensity, 0) / perSlide.length)
      : 0,
    typeScaleAllOk: perSlide.every((a) => a.typeScaleOk),
    minFontSeen: perSlide.reduce((m, a) => Math.min(m, a.minTextBox.fontSize || m), Infinity),
  };
  if (!Number.isFinite(summary.minFontSeen)) summary.minFontSeen = 0;
  next.slides = slides;
  next.aesthetic = summary;
  return next;
}

module.exports = { slideAesthetic, attachAesthetics, loadTypeScale };
