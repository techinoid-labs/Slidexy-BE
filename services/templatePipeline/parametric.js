/**
 * Turns one seed into a different layout: a new cover, a density scale,
 * a signature device, and a fixed title/body contrast.
 */

const { checkGeometry } = require("./scoring/analyzeDeck");
const { injectSignature } = require("./signature");

const CANVAS_W = 1600;
const CANVAS_H = 900;
const COVER_PATTERNS = [
  { id: "oversized", name: "Oversized Word" },
  { id: "fullBleed", name: "Full-Bleed" },
  { id: "split", name: "Split Field" },
];

function pickIndex(seed, count) {
  let hash = 2166136261;
  const text = String(seed || "");
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % count;
}

function pickCover(prompt) {
  return COVER_PATTERNS[pickIndex("deck:" + String(prompt || ""), COVER_PATTERNS.length)];
}

function round(value) {
  return Math.round(value * 100) / 100;
}

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

function contrast(hexA, hexB) {
  const a = luminance(hexA);
  const b = luminance(hexB);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

function inkFor(against, palette) {
  const colors = [palette.ink, palette.onAccent, palette.bg, "#F6F1E8", "#1A1612"].filter(Boolean);
  const passing = colors.find((color) => contrast(color, against) >= 4.5);
  return passing || colors[0];
}

function coverTitle(brand, subject) {
  const value = String(brand || subject || "Title").replace(/\u2014|\u2013/g, " ").replace(/\s+/g, " ").trim();
  const words = value.split(" ").filter(Boolean);
  if (words.length > 6) return words.slice(0, 4).join(" ");
  return value || "Title";
}

function rect(id, x, y, width, height, fill, zIndex, opacity) {
  const element = {
    id,
    type: "shape",
    x,
    y,
    width,
    height,
    zIndex,
    shapeContent: { kind: "rect", fill, cornerRadius: 0 },
  };
  if (opacity != null) element.opacity = opacity;
  return element;
}

function photo(id, x, y, width, height, url, zIndex) {
  return {
    id,
    type: "image",
    x,
    y,
    width,
    height,
    zIndex,
    imageContent: { url: url || "", fit: "cover", alignX: 0.5, alignY: 0.5 },
  };
}

function titleText(id, x, y, width, height, value, style) {
  return {
    id,
    type: "text",
    x,
    y,
    width,
    height,
    zIndex: style.zIndex || 6,
    textStyle: {
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      color: style.color,
      textAlign: style.textAlign || "left",
      lineHeight: style.lineHeight || 0.95,
      letterSpacing: 0,
    },
    textContent: {
      spans: [{
        text: value,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        color: style.color,
      }],
    },
  };
}

function buildCover(pattern, title, photoUrl, palette, fonts) {
  const bg = palette.bg || "#FBD523";
  const accent = palette.accent || "#1E3A32";
  const display = fonts.display || "Poppins Bold";
  const weight = fonts.displayWeight || 800;
  if (pattern.id === "fullBleed") {
    const scrim = "#000000";
    const elements = [];
    if (photoUrl) elements.push(photo("cover-photo", 0, 0, CANVAS_W, CANVAS_H, photoUrl, 1));
    else elements.push(rect("cover-field", 0, 0, CANVAS_W, CANVAS_H, accent, 1));
    elements.push(rect("cover-scrim", 0, 520, CANVAS_W, 380, scrim, 2, 0.55));
    elements.push(titleText("cover-title", 48, 620, 1100, 200, title, {
      fontFamily: display,
      fontSize: 72,
      fontWeight: weight,
      color: inkFor(scrim, palette),
      zIndex: 6,
      lineHeight: 0.95,
    }));
    return elements;
  }
  if (pattern.id === "split") {
    return [
      rect("cover-panel", 0, 0, 800, CANVAS_H, accent, 1),
      photoUrl
        ? photo("cover-photo", 800, 0, 800, CANVAS_H, photoUrl, 1)
        : rect("cover-field", 800, 0, 800, CANVAS_H, bg, 1),
      titleText("cover-title", 56, 250, 680, 400, title, {
        fontFamily: display,
        fontSize: 80,
        fontWeight: weight,
        color: inkFor(accent, palette),
        zIndex: 6,
        lineHeight: 0.95,
      }),
    ];
  }
  return [
    rect("cover-field", 0, 0, CANVAS_W, CANVAS_H, bg, 0),
    titleText("cover-title", 0, 250, CANVAS_W, 420, title, {
      fontFamily: display,
      fontSize: 150,
      fontWeight: weight,
      color: inkFor(bg, palette),
      zIndex: 6,
      lineHeight: 0.92,
    }),
  ];
}

function replaceCover(deck, prompt, title, photoUrl, palette, fonts) {
  const pattern = pickCover(prompt);
  const id = (deck.layoutSequence || [])[0];
  const layout = id && deck.layouts && deck.layouts[id];
  if (!layout) return pattern;
  layout.elements = buildCover(pattern, title, photoUrl, palette, fonts);
  layout.generatedCover = pattern.id;
  if (Array.isArray(deck.previewSlides) && deck.previewSlides[0]) deck.previewSlides[0].title = title;
  return pattern;
}

function walkTexts(elements, found) {
  (elements || []).forEach((element) => {
    if (!element) return;
    if (element.type === "text") found.push(element);
    if (element.type === "rotated" && element.element) walkTexts([element.element], found);
    if (Array.isArray(element.children)) walkTexts(element.children, found);
  });
  return found;
}

function readSize(node) {
  const spans = node.textContent && node.textContent.spans;
  const span = Array.isArray(spans) ? spans.find((item) => item && Number(item.fontSize)) : null;
  const size = Number((span && span.fontSize) || (node.textStyle && node.textStyle.fontSize) || 0);
  return Number.isFinite(size) ? size : 0;
}

function readFamily(node) {
  const spans = node.textContent && node.textContent.spans;
  const span = Array.isArray(spans) ? spans.find((item) => item && item.fontFamily) : null;
  return (span && span.fontFamily) || (node.textStyle && node.textStyle.fontFamily) || "";
}

function writeStyle(node, patch) {
  node.textStyle = Object.assign({}, node.textStyle, patch);
  const spans = node.textContent && node.textContent.spans;
  if (!Array.isArray(spans)) return;
  spans.forEach((span) => {
    if (!span) return;
    if (patch.fontSize != null) span.fontSize = patch.fontSize;
    if (patch.fontWeight != null) span.fontWeight = patch.fontWeight;
    if (patch.fontFamily) span.fontFamily = patch.fontFamily;
  });
}

function regularFamily(family) {
  const value = String(family || "").replace(/\s+Bold$/i, "").trim();
  return value || family;
}

function seedTypefaces(deck) {
  const tokens = (deck.tokens && deck.tokens.font) || {};
  const texts = [];
  const ids = deck.layoutSequence || Object.keys(deck.layouts || {});
  ids.forEach((id) => {
    const layout = deck.layouts && deck.layouts[id];
    walkTexts(layout && layout.elements, texts);
  });
  let display = { size: 0, family: tokens.display || "Poppins Bold" };
  const bodyCount = {};
  texts.forEach((node) => {
    const size = readSize(node);
    const family = readFamily(node);
    if (!family || !size) return;
    if (size > display.size) display = { size, family };
  });
  texts.forEach((node) => {
    const size = readSize(node);
    const family = readFamily(node);
    if (!family || !size || size >= display.size * 0.75) return;
    bodyCount[family] = (bodyCount[family] || 0) + 1;
  });
  const bodyFamily = Object.keys(bodyCount).sort((a, b) => bodyCount[b] - bodyCount[a])[0] || tokens.text || display.family;
  return {
    display: display.family,
    text: regularFamily(bodyFamily),
    displayWeight: /minimal/i.test("") ? 300 : 800,
  };
}

function pageFill(element) {
  const width = Number(element.width) || 0;
  const height = Number(element.height) || 0;
  return width >= CANVAS_W * 0.9 && height >= CANVAS_H * 0.9;
}

function bleeds(element) {
  const x = Number(element.x) || 0;
  const y = Number(element.y) || 0;
  const right = x + (Number(element.width) || 0);
  const bottom = y + (Number(element.height) || 0);
  return x < -1 || y < -1 || right > CANVAS_W + 1 || bottom > CANVAS_H + 1;
}

function boxesOf(elements) {
  const items = [];
  (elements || []).forEach((element) => {
    if (!element || pageFill(element) || bleeds(element)) return;
    const width = Number(element.width) || 0;
    const height = Number(element.height) || 0;
    if (width < 8 || height < 8) return;
    items.push({
      el: element,
      x: Number(element.x) || 0,
      y: Number(element.y) || 0,
      w: width,
      h: height,
      origX: Number(element.x) || 0,
      origY: Number(element.y) || 0,
      origW: width,
      origH: height,
    });
  });
  return items;
}

function containedBy(item, other) {
  if (item === other) return false;
  const area = other.origW * other.origH;
  if (area <= item.origW * item.origH * 1.08) return false;
  if (area > CANVAS_W * CANVAS_H * 0.72) return false;
  const cx = item.origX + item.origW / 2;
  const cy = item.origY + item.origH / 2;
  return cx >= other.origX - 1 && cy >= other.origY - 1 && cx <= other.origX + other.origW + 1 && cy <= other.origY + other.origH + 1;
}

function smallestParent(item, items) {
  let best = null;
  let bestArea = Infinity;
  items.forEach((other) => {
    if (!containedBy(item, other)) return;
    const area = other.origW * other.origH;
    if (area < bestArea) {
      best = other;
      bestArea = area;
    }
  });
  return best;
}

function sameBand(a, b, axis) {
  const aOrigin = axis === "x" ? a.origY : a.origX;
  const aSize = axis === "x" ? a.origH : a.origW;
  const bOrigin = axis === "x" ? b.origY : b.origX;
  const bSize = axis === "x" ? b.origH : b.origW;
  const aMid = aOrigin + aSize / 2;
  const bMid = bOrigin + bSize / 2;
  const band = Math.min(aSize, bSize) * 0.6;
  return Math.abs(aMid - bMid) <= Math.max(18, band);
}

function cluster(items, axis) {
  const groups = [];
  items.forEach((item) => {
    const group = groups.find((existing) => existing.some((other) => sameBand(other, item, axis)));
    if (group) group.push(item);
    else groups.push([item]);
  });
  let merged = true;
  while (merged) {
    merged = false;
    for (let left = 0; left < groups.length; left += 1) {
      for (let right = left + 1; right < groups.length; right += 1) {
        const linked = groups[left].some((a) => groups[right].some((b) => sameBand(a, b, axis)));
        if (!linked) continue;
        groups[left] = groups[left].concat(groups[right]);
        groups.splice(right, 1);
        merged = true;
        break;
      }
      if (merged) break;
    }
  }
  return groups;
}

function packGroup(group, factor, axis) {
  const origin = axis === "x" ? "x" : "y";
  const sizeKey = axis === "x" ? "w" : "h";
  const canvas = axis === "x" ? CANVAS_W : CANVAS_H;
  const ordered = group.slice().sort((a, b) => a[origin] - b[origin]);
  if (!ordered.length) return;
  const lead = Math.max(0, ordered[0][origin]);
  const internals = [];
  for (let index = 1; index < ordered.length; index += 1) {
    internals.push(ordered[index][origin] - (ordered[index - 1][origin] + ordered[index - 1][sizeKey]));
  }
  const tailEnd = ordered[ordered.length - 1][origin] + ordered[ordered.length - 1][sizeKey];
  const tail = Math.max(0, canvas - tailEnd);
  const internalMax = internals.reduce((max, gap) => Math.max(max, gap), 0);
  const leadSlack = lead > 160 && lead > tail * 2 && lead > internalMax * 2;
  const tailSlack = tail > 160 && tail > lead * 2 && tail > internalMax * 2;
  const raw = [lead].concat(internals, [tail]);
  const widthSum = ordered.reduce((sum, item) => sum + item[sizeKey], 0);
  const gapsFor = (applied) => raw.map((gap, index) => {
    const slack = (index === 0 && leadSlack) || (index === raw.length - 1 && tailSlack);
    if (slack || gap < 4) return gap;
    return gap * applied;
  });
  const reserved = (gaps) => gaps.reduce((sum, gap, index) => {
    if (index === 0 && leadSlack) return sum;
    if (index === gaps.length - 1 && tailSlack) return sum;
    return sum + gap;
  }, 0);
  let applied = factor;
  if (factor > 1) {
    let low = 1;
    let high = factor;
    for (let step = 0; step < 14; step += 1) {
      const mid = (low + high) / 2;
      if (widthSum + reserved(gapsFor(mid)) <= canvas + 1) low = mid;
      else high = mid;
    }
    applied = low;
  }
  const gaps = gapsFor(applied);
  if (leadSlack && !tailSlack) {
    let cursor = canvas - gaps[gaps.length - 1];
    for (let index = ordered.length - 1; index >= 0; index -= 1) {
      cursor -= ordered[index][sizeKey];
      ordered[index][origin] = cursor;
      cursor -= gaps[index];
    }
    return;
  }
  let cursor = gaps[0];
  ordered.forEach((item, index) => {
    item[origin] = cursor;
    cursor += item[sizeKey] + gaps[index + 1];
  });
}

function placeChild(child, parent) {
  child.x = parent.x + (child.origX - parent.origX);
  child.y = parent.y + (child.origY - parent.origY);
  child.w = child.origW;
  child.h = child.origH;
}

function scaleSlide(elements, factor) {
  const items = boxesOf(elements);
  items.forEach((item) => {
    item.parent = smallestParent(item, items);
  });
  const roots = items.filter((item) => !item.parent);
  cluster(roots, "x").forEach((group) => packGroup(group, factor, "x"));
  cluster(roots, "y").forEach((group) => packGroup(group, factor, "y"));
  const pending = items.filter((item) => item.parent);
  let guard = 0;
  while (pending.length && guard < 6) {
    guard += 1;
    for (let index = pending.length - 1; index >= 0; index -= 1) {
      const child = pending[index];
      if (pending.indexOf(child.parent) >= 0) continue;
      placeChild(child, child.parent);
      pending.splice(index, 1);
    }
  }
  items.forEach((item) => {
    if (item.el.type === "text") {
      if (item.x < 0) item.x = 0;
      if (item.y < 0) item.y = 0;
      if (item.x + item.w > CANVAS_W) item.x = Math.max(0, CANVAS_W - item.w);
      if (item.y + item.h > CANVAS_H) item.y = Math.max(0, CANVAS_H - item.h);
    }
    item.el.x = round(item.x);
    item.el.y = round(item.y);
    item.el.width = round(Math.max(12, item.w));
    item.el.height = round(Math.max(12, item.h));
    const inner = item.el.type === "rotated" && item.el.element;
    if (!inner) return;
    const same = Math.abs((Number(inner.x) || 0) - item.origX) < 2 && Math.abs((Number(inner.y) || 0) - item.origY) < 2;
    if (!same) return;
    inner.x = item.el.x;
    inner.y = item.el.y;
    inner.width = item.el.width;
    inner.height = item.el.height;
  });
}

function scaleLineHeights(elements, factor) {
  walkTexts(elements, []).forEach((node) => {
    if (!node.textStyle) node.textStyle = {};
    const current = Number(node.textStyle.lineHeight) || 1.15;
    node.textStyle.lineHeight = round(current * factor);
  });
}

function textSample(layout) {
  const texts = walkTexts(layout && layout.elements, []);
  const node = texts.find((item) => (Number(item.x) || 0) > 8) || texts[0];
  if (!node) return null;
  return {
    id: node.id,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    lineHeight: node.textStyle ? node.textStyle.lineHeight : null,
  };
}

function applyDensity(deck, density) {
  const name = density === "airy" || density === "dense" ? density : "balanced";
  const factor = name === "airy" ? 1.25 : name === "dense" ? 0.8 : 1;
  const lineFactor = name === "airy" ? 1.1 : 1;
  const sequence = deck.layoutSequence || Object.keys(deck.layouts || {});
  const reverted = [];
  const revertReasons = [];
  let sample = null;
  sequence.forEach((id, index) => {
    if (index === 0) return;
    const layout = deck.layouts && deck.layouts[id];
    if (!layout || factor === 1) return;
    if (index === 1) sample = { before: textSample(layout) };
    const before = JSON.stringify(layout.elements);
    const beforeGeometry = checkGeometry(deck, id);
    scaleSlide(layout.elements, factor);
    if (lineFactor !== 1) scaleLineHeights(layout.elements, lineFactor);
    const geometry = checkGeometry(deck, id);
    const introduced = (reason) => geometry.reasons.indexOf(reason) >= 0 && beforeGeometry.reasons.indexOf(reason) < 0;
    const added = ["text overlap", "bounds", "contrast"].filter(introduced);
    if (added.length) {
      layout.elements = JSON.parse(before);
      reverted.push(index + 1);
      revertReasons.push({ slide: index + 1, reasons: added });
    }
    if (index === 1 && sample) sample.after = textSample(layout);
  });
  if (factor === 1 && sequence[1] && deck.layouts[sequence[1]]) {
    const box = textSample(deck.layouts[sequence[1]]);
    sample = { before: box, after: box };
  }
  return {
    density: name,
    marginFactor: factor,
    lineHeightFactor: lineFactor,
    reverted,
    revertReasons,
    sample,
  };
}

function growBox(node, size) {
  const leading = size * (Number(node.textStyle && node.textStyle.lineHeight) || 1.05);
  const spans = node.textContent && node.textContent.spans;
  const text = Array.isArray(spans) ? spans.map((span) => String(span && span.text || "")).join(" ") : "";
  const words = text.split(/\s+/).filter(Boolean).length || 1;
  const lines = Math.max(1, Math.min(3, Math.ceil(words / 3)));
  const needed = Math.ceil(leading * lines);
  const y = Number(node.y) || 0;
  const room = CANVAS_H - y - 8;
  if (room > node.height) node.height = round(Math.min(Math.max(node.height, needed), room));
}

function applyTypeContrast(deck, fonts, subject) {
  const displayWeight = /minimal/i.test(subject || "") ? 300 : 800;
  const bodyWeight = 400;
  const shortfalls = [];
  const sequence = deck.layoutSequence || Object.keys(deck.layouts || {});
  sequence.forEach((id, index) => {
    const layout = deck.layouts && deck.layouts[id];
    if (!layout) return;
    const texts = walkTexts(layout.elements, []);
    const sizes = texts.map(readSize).filter((size) => size > 0);
    if (!sizes.length) return;
    const titleSize = Math.max.apply(null, sizes);
    const titleCut = titleSize * 0.92;
    texts.forEach((node) => {
      const title = readSize(node) >= titleCut;
      writeStyle(node, {
        fontWeight: title ? displayWeight : bodyWeight,
        fontFamily: title ? fonts.display : fonts.text,
      });
    });
    const bodySizes = sizes.filter((size) => size < titleCut);
    if (!bodySizes.length) return;
    const bodySize = Math.max.apply(null, bodySizes);
    if (titleSize >= bodySize * 3 - 0.5) return;
    const shrunk = Math.max(13, round(titleSize / 3));
    texts.forEach((node) => {
      const size = readSize(node);
      if (size < titleCut) writeStyle(node, { fontSize: Math.min(size, shrunk) });
    });
    const remaining = texts.map(readSize).filter((size) => size > 0 && size < titleCut);
    const nextBody = remaining.length ? Math.max.apply(null, remaining) : shrunk;
    if (titleSize >= nextBody * 3 - 0.5) return;
    const before = JSON.stringify(layout.elements);
    const grown = Math.round(nextBody * 3);
    texts.forEach((node) => {
      if (readSize(node) < titleCut) return;
      writeStyle(node, { fontSize: grown });
      growBox(node, grown);
    });
    const geometry = checkGeometry(deck, id);
    if (geometry.reasons.indexOf("text overlap") >= 0 || geometry.reasons.indexOf("bounds") >= 0) {
      layout.elements = JSON.parse(before);
      shortfalls.push(index + 1);
    }
  });
  return { displayWeight, bodyWeight, shortfalls };
}

function auditGeometry(deck) {
  const sequence = deck.layoutSequence || Object.keys(deck.layouts || {});
  return sequence.map((id, index) => {
    const geometry = checkGeometry(deck, id);
    return { slide: index + 1, pass: geometry.pass, reasons: geometry.reasons };
  });
}

function applyParametric(deck, options) {
  const prompt = String(options.prompt || "");
  const palette = options.seedTokens && options.seedTokens.color ? options.seedTokens.color : ((deck.tokens && deck.tokens.color) || {});
  const fonts = seedTypefaces(deck);
  fonts.displayWeight = /minimal/i.test(prompt) ? 300 : 800;
  const density = applyDensity(deck, options.density || "balanced");
  const title = coverTitle(options.title, prompt);
  const cover = replaceCover(deck, prompt, title, options.photoUrl || "", palette, fonts);
  const signature = injectSignature(deck, prompt, palette);
  const type = applyTypeContrast(deck, fonts, prompt);
  const geometry = auditGeometry(deck);
  const overlaps = geometry.filter((slide) => slide.reasons.indexOf("text overlap") >= 0).map((slide) => slide.slide);
  deck.parametric = {
    cover: cover.id,
    coverName: cover.name,
    coverTitle: title,
    density: density.density,
    marginFactor: density.marginFactor,
    lineHeightFactor: density.lineHeightFactor,
    densityReverted: density.reverted,
    densityRevertReasons: density.revertReasons,
    marginSample: density.sample,
    signature,
    displayFont: fonts.display,
    bodyFont: fonts.text,
    displayWeight: type.displayWeight,
    bodyWeight: type.bodyWeight,
    typeShortfalls: type.shortfalls,
    geometry,
    textOverlaps: overlaps,
  };
  return deck.parametric;
}

module.exports = {
  COVER_PATTERNS,
  pickCover,
  applyDensity,
  applyParametric,
  auditGeometry,
};
