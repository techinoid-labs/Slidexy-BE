/**
 * Creative operators. The pipeline applies highlight_word, text_mask_image,
 * and overlap_depth to a pptx-viewer-core model and saves with handler.save().
 * The deck JSON helpers remain for the older creative batch.
 *
 *   node services/templatePipeline/mutate.js --mode=unified
 */

const fs = require("fs");
const path = require("path");
const { CANVAS } = require("./deckSchema");
const { textSize, leaf } = require("./dna/extract");
const { fontFile } = require("./fitText");
const { renderSlidePng, textBoxes } = require("../../scripts/slideSvg");
const { addElement } = require("ooxml-core/pptx/automation");

const ROOT = path.join(__dirname, "..", "..");
const SKIP = new Set(["a", "an", "the", "of", "and", "or", "for", "to", "in", "on", "at", "by"]);

function clone(deck) {
  return JSON.parse(JSON.stringify(deck));
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function layoutsOf(deck) {
  const ids = deck.layoutSequence || Object.keys(deck.layouts || {});
  return ids.map((id) => ({ id, layout: deck.layouts[id] })).filter((item) => item.layout);
}

function slideOf(deck, layoutId) {
  return (deck.previewSlides || []).find((item) => item.layout === layoutId) || { title: "", bullets: [] };
}

function area(element) {
  return Math.abs(Number(element.width) || 0) * Math.abs(Number(element.height) || 0);
}

function largestText(layout) {
  return layout.elements
    .filter((element) => leaf(element).type === "text")
    .slice()
    .sort((a, b) => (textSize(leaf(b)) || 0) - (textSize(leaf(a)) || 0) || area(b) - area(a))[0] || null;
}

function largestImage(layout) {
  return layout.elements
    .filter((element) => {
      const type = leaf(element).type;
      return type === "image" || type === "maskedImage";
    })
    .slice()
    .sort((a, b) => area(b) - area(a))[0] || null;
}

function plainText(element) {
  const node = leaf(element);
  const spans = node.textContent && node.textContent.spans;
  if (Array.isArray(spans) && spans.length) return spans.map((span) => span.text || "").join("");
  return "";
}

function pickWord(text) {
  const words = String(text).match(/[A-Za-z0-9][A-Za-z0-9'’-]*/g) || [];
  const useful = words.filter((word) => word.length > 2 && !SKIP.has(word.toLowerCase()));
  const pool = useful.length ? useful : words;
  return pool.slice().sort((a, b) => b.length - a.length)[0] || null;
}

function colorsOf(deck) {
  const color = (deck.tokens && deck.tokens.color) || {};
  return {
    bg: color.bg || (deck.theme && deck.theme.backgroundColor) || "#F4F7F8",
    accent: color.accent || "#1E3A32",
  };
}

function highlightWord(deck) {
  const notes = [];
  const colors = colorsOf(deck);
  layoutsOf(deck).forEach(({ id, layout }) => {
    const element = largestText(layout);
    const node = element && leaf(element);
    const text = node ? plainText(node) : "";
    const word = text && pickWord(text);
    if (!node || !word) {
      notes.push({ slide: id, applied: false });
      return;
    }
    const spans = node.textContent.spans || [];
    const span = spans.find((item) => String(item.text || "").indexOf(word) >= 0) || spans[0];
    const index = String(span.text || "").indexOf(word);
    let before = String(span.text || "").slice(0, index);
    let after = String(span.text || "").slice(index + word.length);
    let shown = word;
    if (before.endsWith(" ")) {
      before = before.slice(0, -1);
      shown = " " + word;
    }
    const base = {
      fontFamily: span.fontFamily,
      fontSize: span.fontSize,
      fontWeight: span.fontWeight,
      letterSpacing: span.letterSpacing || 0,
    };
    node.textContent.spans = [
      Object.assign({}, base, { text: before, color: span.color }),
      Object.assign({}, base, { text: shown, color: colors.bg, highlight: true }),
      Object.assign({}, base, { text: after, color: span.color }),
    ];
    const boxes = textBoxes(node, slideOf(deck, id), deck.tokens);
    const hit = boxes.find((box) => box.highlight);
    if (!hit) {
      notes.push({ slide: id, applied: false, word });
      return;
    }
    const padX = Math.max(4, hit.height * 0.08);
    const padY = Math.max(2, hit.height * 0.06);
    const shape = {
      id: node.id + "-highlight",
      type: "shape",
      x: round(Math.max(0, hit.x - padX)),
      y: round(Math.max(0, hit.y - padY)),
      width: round(Math.min(CANVAS.width, hit.width + padX * 2)),
      height: round(hit.height + padY * 2),
      zIndex: element.zIndex == null ? 4 : element.zIndex,
      shapeContent: {
        kind: "rectangle",
        fill: colors.accent,
        cornerRadius: 0,
      },
    };
    const at = layout.elements.indexOf(element);
    layout.elements.splice(at, 0, shape);
    notes.push({ slide: id, applied: true, word, accent: colors.accent, text: colors.bg });
  });
  return notes;
}

function imageContent(element) {
  const node = leaf(element);
  return node.imageContent || node.maskedImageContent || null;
}

function textMaskImage(deck) {
  const notes = [];
  layoutsOf(deck).forEach(({ id, layout }) => {
    const title = largestText(layout);
    const image = largestImage(layout);
    const titleNode = title && leaf(title);
    const content = image && imageContent(image);
    const text = titleNode ? plainText(titleNode) : "";
    if (!titleNode || !content || !content.url || !text.trim()) {
      notes.push({ slide: id, applied: false });
      return;
    }
    const top = Math.max(Number(title.zIndex) || 0, Number(image.zIndex) || 0) + 1;
    titleNode.opacity = 0;
    const family = titleNode.textStyle && titleNode.textStyle.fontFamily;
    const fallback = !fontFile(family);
    const textStyle = Object.assign({}, titleNode.textStyle);
    const textContent = JSON.parse(JSON.stringify(titleNode.textContent));
    if (fallback) {
      textStyle.fontWeight = 900;
      if (Array.isArray(textContent.spans)) textContent.spans.forEach((span) => { span.fontWeight = 900; });
    }
    layout.elements.push({
      id: titleNode.id + "-mask",
      type: "textMaskedImage",
      x: titleNode.x,
      y: titleNode.y,
      width: titleNode.width,
      height: titleNode.height,
      zIndex: top,
      opacity: 1,
      textStyle,
      textContent,
      textMaskedImageContent: {
        url: content.url,
        fit: content.fit || "cover",
        alignX: content.alignX,
        alignY: content.alignY,
      },
    });
    notes.push({
      slide: id,
      applied: true,
      text,
      fontFamily: family,
      fontWeight: fallback ? 900 : textStyle.fontWeight,
      fallback,
      url: content.url,
    });
  });
  return notes;
}

function overlapAmount(a, b) {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  if (right <= x || bottom <= y) return 0;
  const smaller = Math.min(a.width * a.height, b.width * b.height);
  if (!smaller) return 0;
  return ((right - x) * (bottom - y)) / smaller;
}

function gapBetween(image, text) {
  if (image.x + image.width <= text.x) return { axis: "x", gap: text.x - (image.x + image.width), sign: 1 };
  if (text.x + text.width <= image.x) return { axis: "x", gap: image.x - (text.x + text.width), sign: -1 };
  if (image.y + image.height <= text.y) return { axis: "y", gap: text.y - (image.y + image.height), sign: 1 };
  if (text.y + text.height <= image.y) return { axis: "y", gap: image.y - (text.y + text.height), sign: -1 };
  return null;
}

function shift(element, dx, dy) {
  element.x = round(element.x + dx);
  element.y = round(element.y + dy);
  if (element.element) {
    element.element.x = round(element.element.x + dx);
    element.element.y = round(element.element.y + dy);
  }
}

function overlapDepth(deck) {
  const notes = [];
  layoutsOf(deck).forEach(({ id, layout }) => {
    const text = largestText(layout);
    const image = largestImage(layout);
    const content = image && imageContent(image);
    if (!text || !content) {
      notes.push({ slide: id, applied: false });
      return;
    }
    const before = overlapAmount(image, text);
    const gap = gapBetween(image, text);
    let moved = 0;
    if (gap && before < 0.15) {
      const span = gap.axis === "x" ? Math.min(image.width, text.width) : Math.min(image.height, text.height);
      moved = gap.gap + span * 0.15;
      if (gap.axis === "x") shift(image, gap.sign * moved, 0);
      else shift(image, 0, gap.sign * moved);
    }
    content.shadow = true;
    notes.push({
      slide: id,
      applied: true,
      moved: round(moved),
      overlapBefore: round(before),
      overlapAfter: round(overlapAmount(image, text)),
    });
  });
  return notes;
}

function textureOverlay(deck) {
  const notes = [];
  layoutsOf(deck).forEach(({ id, layout }) => {
    const canvas = layout.canvas || CANVAS;
    const top = layout.elements.reduce((max, element) => Math.max(max, Number(element.zIndex) || 0), 0) + 1;
    layout.elements.push({
      id: id + "-noise",
      type: "shape",
      x: 0,
      y: 0,
      width: canvas.width || CANVAS.width,
      height: canvas.height || CANVAS.height,
      zIndex: top,
      opacity: 0.05,
      shapeContent: { kind: "rectangle", fill: "noise", cornerRadius: 0 },
    });
    notes.push({ slide: id, applied: true, opacity: 0.05, zIndex: top });
  });
  return notes;
}

function syncPptxBox(element, data) {
  if (!element || !data || !data.width || !data.height) return;
  const sx = data.widthEmu / data.width;
  const sy = data.heightEmu / data.height;
  if (Number.isFinite(sx) && Number.isFinite(element.x)) element.xEmu = Math.round(element.x * sx);
  if (Number.isFinite(sy) && Number.isFinite(element.y)) element.yEmu = Math.round(element.y * sy);
  if (Number.isFinite(sx) && Number.isFinite(element.width)) element.widthEmu = Math.round(element.width * sx);
  if (Number.isFinite(sy) && Number.isFinite(element.height)) element.heightEmu = Math.round(element.height * sy);
}

function walkPlaced(slide, visit) {
  function children(elements, originX, originY, topIndex) {
    (elements || []).forEach((element) => {
      const x = originX + (Number(element.x) || 0);
      const y = originY + (Number(element.y) || 0);
      visit(element, x, y, topIndex);
      if (element && element.type === "group") children(element.children, x, y, topIndex);
    });
  }
  (slide.elements || []).forEach((element, topIndex) => {
    visit(element, Number(element.x) || 0, Number(element.y) || 0, topIndex);
    if (element && element.type === "group") children(element.children, Number(element.x) || 0, Number(element.y) || 0, topIndex);
  });
}

function pptxText(element) {
  return String(element && element.text || "").trim();
}

function largestPlaced(slide, test, rank) {
  let best = null;
  walkPlaced(slide, (element, x, y, topIndex) => {
    if (!test(element)) return;
    const score = rank(element);
    if (!best || score > best.score) best = { element, x, y, topIndex, score };
  });
  return best;
}

function writeRunColor(style, color) {
  if (!style) return;
  style.color = color;
  if (style.colorXml && style.colorXml["a:srgbClr"]) style.colorXml["a:srgbClr"]["@_val"] = color.replace("#", "").toUpperCase();
  if (style.authoredRunStyle && style.authoredRunStyle !== style) {
    style.authoredRunStyle.color = color;
    if (style.authoredRunStyle.colorXml && style.authoredRunStyle.colorXml["a:srgbClr"]) {
      style.authoredRunStyle.colorXml["a:srgbClr"]["@_val"] = color.replace("#", "").toUpperCase();
    }
  }
}

function themeColor(data, key, fallback) {
  const scheme = data.theme && data.theme.colorScheme;
  const value = scheme && scheme[key];
  return typeof value === "string" && value.charAt(0) === "#" ? value : fallback;
}

function highlightWordPptx(data) {
  const notes = [];
  let added = 0;
  const accent = themeColor(data, "accent1", "#1E3A32");
  const wordColor = themeColor(data, "lt1", "#FFFFFF");
  data.slides.forEach((slide, slideIndex) => {
    const placed = largestPlaced(slide, (element) => element && element.type === "text" && pptxText(element), (element) => {
      const size = Number(element.textStyle && element.textStyle.fontSize) || 0;
      return size * 1000000 + Math.abs(element.width || 0) * Math.abs(element.height || 0);
    });
    const word = placed && pickWord(placed.element.text);
    if (!placed || !word) {
      notes.push({ slide: slideIndex + 1, applied: false });
      return;
    }
    const element = placed.element;
    const segments = element.textSegments && element.textSegments.length
      ? element.textSegments.slice()
      : [{ text: element.text, style: JSON.parse(JSON.stringify(element.textStyle || {})) }];
    const hit = segments.findIndex((segment) => String(segment.text || "").indexOf(word) >= 0);
    if (hit < 0) {
      notes.push({ slide: slideIndex + 1, applied: false, word });
      return;
    }
    const source = segments[hit];
    const raw = String(source.text || "");
    const index = raw.indexOf(word);
    let before = raw.slice(0, index);
    let shown = word;
    const after = raw.slice(index + word.length);
    if (before.endsWith(" ")) {
      before = before.slice(0, -1);
      shown = " " + word;
    }
    const baseStyle = JSON.parse(JSON.stringify(source.style || element.textStyle || {}));
    const wordStyle = JSON.parse(JSON.stringify(baseStyle));
    writeRunColor(wordStyle, wordColor);
    const family = baseStyle.fontFamily || (element.textStyle && element.textStyle.fontFamily) || "Arial";
    const spanOf = (text, color, highlight) => ({
      text,
      fontFamily: family,
      fontSize: baseStyle.fontSize,
      fontWeight: baseStyle.bold ? 700 : 400,
      color,
      letterSpacing: baseStyle.letterSpacing || 0,
      highlight: !!highlight,
    });
    const spans = [];
    if (before) spans.push(spanOf(before, baseStyle.color || "#000000", false));
    spans.push(spanOf(shown, wordColor, true));
    if (after) spans.push(spanOf(after, baseStyle.color || "#000000", false));
    let bar = null;
    try {
      const measured = textBoxes({
        id: element.id,
        type: "text",
        x: placed.x,
        y: placed.y,
        width: element.width,
        height: element.height,
        textStyle: {
          fontFamily: family,
          fontSize: baseStyle.fontSize,
          fontWeight: baseStyle.bold ? 700 : 400,
          color: baseStyle.color || "#000000",
          textAlign: baseStyle.align || (element.textStyle && element.textStyle.align) || "left",
          lineHeight: 1.15,
          letterSpacing: baseStyle.letterSpacing || 0,
        },
        textContent: { spans },
      }, {}, {});
      const mark = measured.find((box) => box.highlight);
      if (mark) {
        const padX = Math.max(4, mark.height * 0.08);
        const padY = Math.max(2, mark.height * 0.06);
        bar = {
          x: Math.max(0, mark.x - padX),
          y: Math.max(0, mark.y - padY),
          width: mark.width + padX * 2,
          height: mark.height + padY * 2,
        };
      }
    } catch (error) {
      notes.push({ slide: slideIndex + 1, applied: false, word, measure: error && error.message ? error.message : String(error) });
      return;
    }
    if (!bar) {
      notes.push({ slide: slideIndex + 1, applied: false, word, measure: "no highlight box" });
      return;
    }
    const next = [];
    if (before) next.push({ text: before, style: JSON.parse(JSON.stringify(baseStyle)) });
    next.push({ text: shown, style: wordStyle });
    if (after) next.push({ text: after, style: JSON.parse(JSON.stringify(baseStyle)) });
    segments.splice(hit, 1, ...next);
    element.textSegments = segments;
    bar.width = Math.min(bar.width, Math.max(1, data.width - bar.x));
    bar.height = Math.min(bar.height, Math.max(1, data.height - bar.y));
    const created = addElement({ pptxData: data }, {
      slideIndex,
      type: "shape",
      x: Math.round(bar.x),
      y: Math.round(bar.y),
      width: Math.round(Math.max(1, bar.width)),
      height: Math.round(Math.max(1, bar.height)),
      shapeType: "rect",
      fillColor: accent,
    });
    const shape = slide.elements.find((item) => item.id === created.result.elementId);
    if (shape) {
      const from = slide.elements.indexOf(shape);
      slide.elements.splice(from, 1);
      slide.elements.splice(placed.topIndex, 0, shape);
      syncPptxBox(shape, data);
      added += 1;
    }
    notes.push({ slide: slideIndex + 1, applied: true, word, accent, text: wordColor });
  });
  return { operator: "highlight_word", added, notes };
}

function findEmbed(node, depth) {
  if (!node || typeof node !== "object" || depth > 10) return null;
  if (typeof node["@_r:embed"] === "string" && node["@_r:embed"]) return node["@_r:embed"];
  const keys = Object.keys(node);
  for (let i = 0; i < keys.length; i += 1) {
    const found = findEmbed(node[keys[i]], depth + 1);
    if (found) return found;
  }
  return null;
}

function textMaskImagePptx(data) {
  const notes = [];
  data.slides.forEach((slide, slideIndex) => {
    const text = largestPlaced(slide, (element) => element && element.type === "text" && pptxText(element), (element) => {
      const size = Number(element.textStyle && element.textStyle.fontSize) || 0;
      return size * 1000000 + Math.abs(element.width || 0) * Math.abs(element.height || 0);
    });
    const image = largestPlaced(slide, (element) => element && (element.type === "picture" || element.type === "image") && element.imagePath, (element) => Math.abs(element.width || 0) * Math.abs(element.height || 0));
    if (!text || !image) {
      notes.push({ slide: slideIndex + 1, applied: false });
      return;
    }
    const family = (text.element.textStyle && text.element.textStyle.fontFamily) || "";
    const fallback = !fontFile(family);
    const embed = findEmbed(image.element.rawXml, 0);
    if (!embed) {
      notes.push({ slide: slideIndex + 1, applied: false, reason: "picture has no embed id" });
      return;
    }
    const blipXml = {
      "a:blip": { "@_r:embed": embed },
      "a:stretch": { "a:fillRect": {} },
    };
    const segments = text.element.textSegments && text.element.textSegments.length
      ? text.element.textSegments
      : [{ text: text.element.text, style: JSON.parse(JSON.stringify(text.element.textStyle || {})) }];
    segments.forEach((segment, index) => {
      segment.style = segment.style || {};
      segment.style.textFillBlipXml = blipXml;
      segment.style.textFillBlipUrl = image.element.imagePath;
      segment.style.textFillBlipMode = "stretch";
      segment.style.textFillNone = false;
      segment.style.dirty = index === 0;
      segment.style.color = "";
      segment.style.colorXml = void 0;
      if (fallback) segment.style.bold = true;
      segment.style.authoredRunStyle = segment.style.authoredRunStyle || {};
      segment.style.authoredRunStyle.textFillBlipXml = blipXml;
      segment.style.authoredRunStyle.dirty = index === 0;
      segment.style.authoredRunStyle.color = "";
      segment.style.authoredRunStyle.colorXml = void 0;
      if (fallback) segment.style.authoredRunStyle.bold = true;
    });
    if (segments.length === 1 && String(segments[0].text || "").length > 1) {
      const only = segments[0];
      const raw = String(only.text || "");
      const restStyle = JSON.parse(JSON.stringify(only.style));
      restStyle.dirty = false;
      if (restStyle.authoredRunStyle) restStyle.authoredRunStyle.dirty = false;
      segments.splice(0, 1, { text: raw.slice(0, 1), style: only.style }, { text: raw.slice(1), style: restStyle });
    }
    text.element.textSegments = segments;
    if (text.element.textStyle) {
      text.element.textStyle.color = "";
      text.element.textStyle.textFillBlipXml = blipXml;
      text.element.textStyle.textFillBlipMode = "stretch";
      if (fallback) text.element.textStyle.bold = true;
    }
    notes.push({
      slide: slideIndex + 1,
      applied: true,
      image: image.element.imagePath,
      fontFamily: family,
      fallback,
      fontWeight: fallback ? 900 : undefined,
    });
  });
  return { operator: "text_mask_image", added: 0, notes };
}

function boxesOverlap(a, b) {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  if (right <= x || bottom <= y) return 0;
  const smaller = Math.min(a.width * a.height, b.width * b.height);
  if (!smaller) return 0;
  return ((right - x) * (bottom - y)) / smaller;
}

function placedGap(image, text) {
  if (image.x + image.width <= text.x) return { axis: "x", gap: text.x - (image.x + image.width), sign: 1 };
  if (text.x + text.width <= image.x) return { axis: "x", gap: image.x - (text.x + text.width), sign: -1 };
  if (image.y + image.height <= text.y) return { axis: "y", gap: text.y - (image.y + image.height), sign: 1 };
  if (text.y + text.height <= image.y) return { axis: "y", gap: image.y - (text.y + text.height), sign: -1 };
  return null;
}

function clampAbs(value, size, limit) {
  return Math.min(Math.max(0, value), Math.max(0, limit - size));
}

function overlapDepthPptx(data) {
  const notes = [];
  data.slides.forEach((slide, slideIndex) => {
    const text = largestPlaced(slide, (element) => element && element.type === "text" && pptxText(element), (element) => {
      const size = Number(element.textStyle && element.textStyle.fontSize) || 0;
      return size * 1000000 + Math.abs(element.width || 0) * Math.abs(element.height || 0);
    });
    const image = largestPlaced(slide, (element) => element && (element.type === "picture" || element.type === "image"), (element) => Math.abs(element.width || 0) * Math.abs(element.height || 0));
    if (!text || !image) {
      notes.push({ slide: slideIndex + 1, applied: false });
      return;
    }
    const imageBox = { x: image.x, y: image.y, width: image.element.width, height: image.element.height };
    const textBox = { x: text.x, y: text.y, width: text.element.width, height: text.element.height };
    const before = boxesOverlap(imageBox, textBox);
    const gap = placedGap(imageBox, textBox);
    let moved = 0;
    let appliedDx = 0;
    let appliedDy = 0;
    if (gap && before < 0.15) {
      const span = gap.axis === "x" ? Math.min(imageBox.width, textBox.width) : Math.min(imageBox.height, textBox.height);
      moved = gap.gap + span * 0.15;
      if (gap.axis === "x") {
        const next = clampAbs(image.x + gap.sign * moved, image.element.width, data.width);
        appliedDx = next - image.x;
        image.element.x += appliedDx;
      } else {
        const next = clampAbs(image.y + gap.sign * moved, image.element.height, data.height);
        appliedDy = next - image.y;
        image.element.y += appliedDy;
      }
      syncPptxBox(image.element, data);
    }
    image.element.shapeStyle = image.element.shapeStyle || {};
    image.element.shapeStyle.shadowBlur = 40;
    image.element.shapeStyle.shadowColor = "#000000";
    image.element.shapeStyle.shadowOpacity = 0.6;
    image.element.shapeStyle.shadowOffsetX = 0;
    image.element.shapeStyle.shadowOffsetY = 12;
    image.element.shapeStyle.shadowDistance = 12;
    const after = boxesOverlap({
      x: image.x + appliedDx,
      y: image.y + appliedDy,
      width: image.element.width,
      height: image.element.height,
    }, textBox);
    notes.push({
      slide: slideIndex + 1,
      applied: true,
      moved: round(moved),
      overlapBefore: round(before),
      overlapAfter: round(after),
      shadow: true,
    });
  });
  return { operator: "overlap_depth", added: 0, notes };
}

async function applyCreativePptx(pptxPath, operator) {
  const { applyOperator } = require("./mutate_safe");
  return applyOperator(pptxPath, operator);
}

const OPERATORS = {
  highlight_word: highlightWord,
  text_mask_image: textMaskImage,
  overlap_depth: overlapDepth,
  texture_overlay: textureOverlay,
};

function applyCreative(deck, operator) {
  const run = OPERATORS[operator];
  if (!run) throw new Error("unknown operator " + operator);
  const next = clone(deck);
  next.id = deck.id + "-" + operator.replace(/_/g, "-");
  next.name = (deck.name || deck.id) + " / " + operator;
  const notes = run(next);
  next.creative = { operator, notes };
  return next;
}

function renderDeck(deck, dir) {
  fs.mkdirSync(dir, { recursive: true });
  deck.layoutSequence.forEach((layoutId, index) => {
    const file = path.join(dir, "slide-" + String(index + 1).padStart(2, "0") + ".png");
    renderSlidePng(deck, layoutId, file);
  });
}

function main() {
  const jobs = [
    ["health-medical", "highlight_word"],
    ["cinema-neon", "text_mask_image"],
    ["company-minimal", "overlap_depth"],
  ];
  const outDir = path.join(ROOT, "docs", "template-pipeline", "creativity");
  const jsonDir = path.join(ROOT, "generated-templates", "creativity");
  fs.mkdirSync(jsonDir, { recursive: true });
  jobs.forEach(([id, operator]) => {
    const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "app-library", id + ".json"), "utf8"));
    const deck = applyCreative(seed, operator);
    textureOverlay(deck);
    const file = path.join(jsonDir, id + ".json");
    fs.writeFileSync(file, JSON.stringify(deck, null, 2) + "\n");
    console.log("render " + id + " " + operator);
    renderDeck(deck, path.join(outDir, id));
    console.log(JSON.stringify({ id, operator, notes: deck.creative.notes }));
  });
}

if (require.main === module) main();

module.exports = {
  applyCreative,
  applyCreativePptx,
  OPERATORS,
  highlightWord,
  textMaskImage,
  overlapDepth,
  textureOverlay,
  highlightWordPptx,
  textMaskImagePptx,
  overlapDepthPptx,
};
