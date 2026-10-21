/**
 * Hybrid score for one generated deck.
 *
 * Layer 1 is geometry and typography. A slide that fails it scores 0 and
 * is not sent to the vision model. Photos and shapes may bleed up to 20%
 * past the canvas. A title split across two boxes is allowed. Auto-fit
 * that keeps the text on the canvas passes.
 * Layer 2 is reviewer.js. washed_out or broken_layout fails the slide.
 * A slide passes only when layer 1 passes, layer 2 passes, and quality_score >= 0.6.
 * The deck score is the percentage of passing slides.
 */

const { textWasClipped } = require("../../../scripts/slideSvg");
const { reviewSlide } = require("../reviewer");

const CANVAS_W = 1600;
const CANVAS_H = 900;
const BLEED_X = CANVAS_W * 0.2;
const BLEED_Y = CANVAS_H * 0.2;

function rgb(hex) {
  const h = String(hex || "").replace("#", "");
  if (h.length < 6) return [0, 0, 0];
  return [0, 2, 4].map((index) => parseInt(h.slice(index, index + 2), 16) || 0);
}

function luminance(hex) {
  const channels = rgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

function resolveColor(value, deck) {
  const text = String(value || "").trim();
  const token = text.match(/^\{color\.([a-z0-9]+)\}$/i);
  if (token) {
    const palette = deck.tokens && deck.tokens.color;
    const next = palette && palette[token[1]];
    return /^#[0-9a-f]{6}$/i.test(next || "") ? next : "";
  }
  return /^#[0-9a-f]{6}$/i.test(text) ? text : "";
}

function walk(elements, visit) {
  (elements || []).forEach((element) => {
    if (!element) return;
    visit(element);
    if (element.type === "rotated" && element.element) walk([element.element], visit);
    if (Array.isArray(element.children)) walk(element.children, visit);
  });
}

function solidFill(element, deck) {
  if (!element) return "";
  if (element.type === "shape") return resolveColor(element.shapeContent && element.shapeContent.fill, deck);
  if (element.type === "illustration") return resolveColor(element.illustrationContent && element.illustrationContent.fill, deck);
  return "";
}

function contains(element, x, y) {
  const left = Number(element.x) || 0;
  const top = Number(element.y) || 0;
  return x >= left && x <= left + (Number(element.width) || 0) && y >= top && y <= top + (Number(element.height) || 0);
}

function backgroundFor(elements, element, deck) {
  const x = (Number(element.x) || 0) + (Number(element.width) || 0) / 2;
  const y = (Number(element.y) || 0) + (Number(element.height) || 0) / 2;
  const under = elements.filter((other) => other !== element
    && (Number(other.zIndex) || 0) <= (Number(element.zIndex) || 0)
    && contains(other, x, y)
    && solidFill(other, deck));
  under.sort((a, b) => (Number(b.zIndex) || 0) - (Number(a.zIndex) || 0));
  if (under.length) return solidFill(under[0], deck);
  return resolveColor((deck.tokens && deck.tokens.color && deck.tokens.color.bg) || (deck.theme && deck.theme.backgroundColor), deck);
}

function textOf(element) {
  const spans = element.textContent && element.textContent.spans;
  if (!Array.isArray(spans)) return "";
  return spans.map((span) => String(span.text == null ? "" : span.text)).join("");
}

function splitBoundary(left, right) {
  const from = String(left || "");
  const to = String(right || "");
  if (!from.trim() || !to.trim()) return false;
  const end = from[from.length - 1];
  const start = to[0];
  if (/\s/.test(end) || /\s/.test(start)) return false;
  return /[A-Za-z0-9]/.test(end) && /[A-Za-z0-9]/.test(start);
}

function boxOf(element) {
  const x = Number(element.x) || 0;
  const y = Number(element.y) || 0;
  return {
    x,
    y,
    right: x + (Number(element.width) || 0),
    bottom: y + (Number(element.height) || 0),
  };
}

function offCanvas(box) {
  return box.x < -1 || box.y < -1 || box.right > CANVAS_W + 1 || box.bottom > CANVAS_H + 1;
}

function excessiveBleed(box) {
  return box.x < -BLEED_X || box.y < -BLEED_Y || box.right > CANVAS_W + BLEED_X || box.bottom > CANVAS_H + BLEED_Y;
}

function checkGeometry(deck, layoutId) {
  const layout = deck.layouts && deck.layouts[layoutId];
  const elements = (layout && layout.elements) || [];
  const flat = [];
  walk(elements, (element) => flat.push(element));
  const reasons = [];

  flat.forEach((element) => {
    const box = boxOf(element);
    if (element.type === "text") {
      if (offCanvas(box)) reasons.push("bounds");
      return;
    }
    if (excessiveBleed(box)) reasons.push("bounds");
  });

  const texts = flat.filter((element) => element.type === "text");
  texts.forEach((element) => {
    const box = boxOf(element);
    if (textWasClipped(element, deck.tokens) && offCanvas(box)) reasons.push("text overflow");
    const spans = (element.textContent && element.textContent.spans) || [];
    for (let index = 0; index < spans.length - 1; index += 1) {
      if (splitBoundary(spans[index].text, spans[index + 1].text)) reasons.push("split word");
    }
    const color = resolveColor((spans[0] && spans[0].color) || (element.textStyle && element.textStyle.color), deck);
    const background = backgroundFor(flat, element, deck);
    if (color && background && String(textOf(element)).trim() && contrastRatio(color, background) < 4.5) {
      reasons.push("contrast");
    }
  });

  const unique = [];
  reasons.forEach((reason) => {
    if (unique.indexOf(reason) < 0) unique.push(reason);
  });
  return { pass: unique.length === 0, reasons: unique };
}

async function analyzeDeck(deck, pngs) {
  const sequence = deck.layoutSequence || Object.keys(deck.layouts || {});
  const slides = [];
  const failures = [];
  for (let index = 0; index < sequence.length; index += 1) {
    const layoutId = sequence[index];
    const number = index + 1;
    const geometry = checkGeometry(deck, layoutId);
    if (!geometry.pass) {
      geometry.reasons.forEach((reason) => failures.push(reason + " on slide " + number));
      slides.push({ slide: number, pass: false, score: 0, reasons: geometry.reasons, vision: null });
      continue;
    }
    const file = pngs && pngs[index];
    let vision = null;
    let visionError = "";
    try {
      vision = await reviewSlide(file);
    } catch (error) {
      visionError = error && error.message ? error.message : String(error);
    }
    const washed = Boolean(vision && vision.washed_out);
    const broken = Boolean(vision && vision.broken_layout);
    const quality = vision ? Number(vision.quality_score) || 0 : 0;
    const pass = Boolean(vision) && !washed && !broken && quality >= 0.6;
    const reasons = [];
    if (!vision) reasons.push(visionError || "vision unavailable");
    if (washed) reasons.push("washed out");
    if (broken) reasons.push("broken layout");
    if (vision && quality < 0.6) reasons.push("quality " + quality);
    if (!pass) failures.push(reasons[0] + " on slide " + number);
    slides.push({ slide: number, pass, score: pass ? Math.round(quality * 100) : 0, reasons, vision });
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  const total = slides.length || 1;
  const passed = slides.filter((slide) => slide.pass).length;
  return {
    score: Math.round((100 * passed) / total),
    passed,
    total: slides.length,
    failures,
    slides,
  };
}

module.exports = { analyzeDeck, checkGeometry, contrastRatio };
