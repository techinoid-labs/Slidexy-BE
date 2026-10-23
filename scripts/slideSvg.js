/**
 * Draws one deck layout. Shared by the aesthetic scorer.
 * Images are read from generated-templates/. Illustrations are the path,
 * scaled from viewBox onto the element box. Text is wrapped to the box.
 */

const fs = require("fs");
const path = require("path");
const { createCanvas, Image, registerFont } = require("canvas");
const opentype = require("opentype.js");
const { measureWidth, fontFile, knownFamilies } = require("../services/templatePipeline/fitText");

const PHOTO_ROOT = path.join(__dirname, "..", "generated-templates");
const registeredFonts = new Set();
const imageCache = new Map();
let measureCtx = null;

function token(value, tokens) {
  if (typeof value !== "string") return value;
  const match = value.match(/^\{(\w+)\.(\w+)\}$/);
  if (!match) return value;
  const group = tokens && tokens[match[1]];
  return group && group[match[2]] !== undefined ? group[match[2]] : value;
}

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textOf(element, slide) {
  const content = element.textContent || {};
  if (Array.isArray(content.spans)) return content.spans.map((span) => span.text || "").join("");
  if (content.binding === "title") return slide.title || "";
  if (content.binding === "bullets" || content.binding === "bullet" || content.binding === "subtitle") {
    return (slide.bullets || []).join("  ");
  }
  return "";
}

function measureContext() {
  if (!measureCtx) measureCtx = createCanvas(16, 16).getContext("2d");
  return measureCtx;
}

function canvasFamily(family) {
  return String(family).replace(/[^A-Za-z0-9]+/g, "");
}

function ensureFont(family) {
  const file = fontFile(family);
  if (!file || registeredFonts.has(family)) return file;
  registerFont(file, { family: canvasFamily(family) });
  registeredFonts.add(family);
  return file;
}

function prepareFonts() {
  knownFamilies().forEach((family) => ensureFont(family));
}

function fontCss(style, family) {
  const size = Number(style.fontSize);
  const weight = Number(style.fontWeight);
  if (family === "Georgia" && weight >= 600) return "bold " + size + "px Georgia";
  if (fontFile(family)) return size + "px " + canvasFamily(family);
  if (weight) return weight + " " + size + 'px "' + family + '"';
  return size + 'px "' + family + '"';
}

const drawnFonts = new Map();

function drawFont(family) {
  if (drawnFonts.has(family)) return drawnFonts.get(family);
  const file = fontFile(family);
  if (!file) return null;
  const font = opentype.parse(fs.readFileSync(file));
  drawnFonts.set(family, font);
  return font;
}

function letterGap(style) {
  const gap = Number(style && style.letterSpacing);
  return Number.isFinite(gap) ? gap : 0;
}

function trackingExtra(text, style) {
  const gap = letterGap(style);
  if (!gap) return 0;
  return Math.max(0, Array.from(String(text)).length - 1) * gap;
}

function paintGlyphs(ctx, family, text, x, yTop, size, color, spacing) {
  const font = drawFont(family);
  if (!font) return false;
  const scale = size / (font.unitsPerEm || 1000);
  const baseline = yTop + (font.ascender || font.unitsPerEm || 1000) * scale;
  const gap = Number(spacing) || 0;
  const chars = Array.from(String(text));
  let cursor = x;
  chars.forEach((char, index) => {
    let glyph;
    try {
      glyph = font.charToGlyph(char);
    } catch (error) {
      cursor += size * 0.55;
      if (index < chars.length - 1) cursor += gap;
      return;
    }
    const outline = glyph.getPath(cursor, baseline, size);
    outline.fill = color;
    outline.stroke = null;
    outline.draw(ctx);
    cursor += (glyph.advanceWidth || 0) * scale;
    if (index < chars.length - 1) cursor += gap;
  });
  return true;
}

function paintFallbackText(ctx, text, x, y, style, family) {
  const gap = letterGap(style);
  if (!gap) {
    ctx.fillText(text, x, y);
    return;
  }
  const chars = Array.from(String(text));
  let cursor = x;
  chars.forEach((char, index) => {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width;
    if (index < chars.length - 1) cursor += gap;
  });
}

function parseViewBox(value) {
  if (value == null || value === "") return null;
  const parts = String(value).trim().split(/[\s,]+/).map(Number);
  if (parts.length < 4 || parts.some((part) => !Number.isFinite(part)) || !parts[2] || !parts[3]) return null;
  return { minX: parts[0], minY: parts[1], w: parts[2], h: parts[3] };
}

function pathTokens(d) {
  return String(d || "").match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g) || [];
}

function traceArc(ctx, x1, y1, rx, ry, phiDeg, large, sweep, x2, y2) {
  if (!rx || !ry) {
    ctx.lineTo(x2, y2);
    return;
  }
  const phi = (phiDeg * Math.PI) / 180;
  const sin = Math.sin(phi);
  const cos = Math.cos(phi);
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cos * dx + sin * dy;
  const y1p = -sin * dx + cos * dy;
  let rx2 = rx * rx;
  let ry2 = ry * ry;
  const x1p2 = x1p * x1p;
  const y1p2 = y1p * y1p;
  const lam = x1p2 / rx2 + y1p2 / ry2;
  if (lam > 1) {
    const scale = Math.sqrt(lam);
    rx *= scale;
    ry *= scale;
    rx2 = rx * rx;
    ry2 = ry * ry;
  }
  const sign = large === sweep ? -1 : 1;
  const sq = Math.max(0, (rx2 * ry2 - rx2 * y1p2 - ry2 * x1p2) / (rx2 * y1p2 + ry2 * x1p2));
  const coef = sign * Math.sqrt(sq);
  const cxp = coef * ((rx * y1p) / ry);
  const cyp = coef * -((ry * x1p) / rx);
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2;
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const angle = (ux, uy, vx, vy) => {
    const dot = ux * vx + uy * vy;
    const len = Math.hypot(ux, uy) * Math.hypot(vx, vy) || 1;
    let a = Math.acos(Math.max(-1, Math.min(1, dot / len)));
    if (ux * vy - uy * vx < 0) a = -a;
    return a;
  };
  const theta1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let delta = angle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!sweep && delta > 0) delta -= Math.PI * 2;
  if (sweep && delta < 0) delta += Math.PI * 2;
  const segs = Math.max(1, Math.ceil(Math.abs(delta) / (Math.PI / 2)));
  for (let s = 0; s < segs; s += 1) {
    const t1 = theta1 + (delta * s) / segs;
    const t2 = theta1 + (delta * (s + 1)) / segs;
    const dt = t2 - t1;
    const alpha = (Math.sin(dt) * (Math.sqrt(4 + 3 * Math.tan(dt / 2) ** 2) - 1)) / 3;
    const point = (t) => ({
      x: cx + rx * Math.cos(t) * cos - ry * Math.sin(t) * sin,
      y: cy + rx * Math.cos(t) * sin + ry * Math.sin(t) * cos,
    });
    const p1 = point(t1);
    const p2 = point(t2);
    ctx.bezierCurveTo(
      p1.x - alpha * (rx * Math.sin(t1) * cos + ry * Math.cos(t1) * sin),
      p1.y - alpha * (rx * Math.sin(t1) * sin - ry * Math.cos(t1) * cos),
      p2.x + alpha * (rx * Math.sin(t2) * cos + ry * Math.cos(t2) * sin),
      p2.y + alpha * (rx * Math.sin(t2) * sin - ry * Math.cos(t2) * cos),
      p2.x,
      p2.y
    );
  }
}

function tracePath(ctx, d) {
  const tokens = pathTokens(d);
  let i = 0;
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let cmd = "";
  const num = () => Number(tokens[i++]);
  ctx.beginPath();
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    else if (!cmd || cmd.toUpperCase() === "Z") return false;
    const rel = cmd === cmd.toLowerCase();
    const op = cmd.toUpperCase();
    if (op === "M") {
      let x = num();
      let y = num();
      if (rel) { x += cx; y += cy; }
      ctx.moveTo(x, y);
      cx = sx = x;
      cy = sy = y;
      cmd = rel ? "l" : "L";
    } else if (op === "L") {
      let x = num();
      let y = num();
      if (rel) { x += cx; y += cy; }
      ctx.lineTo(x, y);
      cx = x;
      cy = y;
    } else if (op === "H") {
      let x = num();
      if (rel) x += cx;
      ctx.lineTo(x, cy);
      cx = x;
    } else if (op === "V") {
      let y = num();
      if (rel) y += cy;
      ctx.lineTo(cx, y);
      cy = y;
    } else if (op === "C") {
      let x1 = num();
      let y1 = num();
      let x2 = num();
      let y2 = num();
      let x = num();
      let y = num();
      if (rel) { x1 += cx; y1 += cy; x2 += cx; y2 += cy; x += cx; y += cy; }
      ctx.bezierCurveTo(x1, y1, x2, y2, x, y);
      cx = x;
      cy = y;
    } else if (op === "Q") {
      let x1 = num();
      let y1 = num();
      let x = num();
      let y = num();
      if (rel) { x1 += cx; y1 += cy; x += cx; y += cy; }
      ctx.quadraticCurveTo(x1, y1, x, y);
      cx = x;
      cy = y;
    } else if (op === "A") {
      const rx = num();
      const ry = num();
      const rot = num();
      const large = num();
      const sweep = num();
      let x = num();
      let y = num();
      if (rel) { x += cx; y += cy; }
      traceArc(ctx, cx, cy, rx, ry, rot, large, sweep, x, y);
      cx = x;
      cy = y;
    } else if (op === "Z") {
      ctx.closePath();
      cx = sx;
      cy = sy;
      cmd = "";
    } else {
      return false;
    }
  }
  return true;
}

function applyViewBox(ctx, element, viewBox) {
  ctx.translate(element.x, element.y);
  ctx.scale(element.width / viewBox.w, element.height / viewBox.h);
  ctx.translate(-viewBox.minX, -viewBox.minY);
}

function applyUniformViewBox(ctx, element, viewBox) {
  const scale = Math.min(element.width / viewBox.w, element.height / viewBox.h);
  const drawnW = viewBox.w * scale;
  const drawnH = viewBox.h * scale;
  ctx.translate(element.x + (element.width - drawnW) / 2, element.y + (element.height - drawnH) / 2);
  ctx.scale(scale, scale);
  ctx.translate(-viewBox.minX, -viewBox.minY);
}

function tracePreset(ctx, element, clip) {
  const x = element.x;
  const y = element.y;
  const w = element.width;
  const h = element.height;
  if (clip.kind === "ellipse") {
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w) / 2, Math.abs(h) / 2, 0, 0, Math.PI * 2);
    return true;
  }
  if (clip.kind === "arch") {
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + h * 0.38);
    ctx.quadraticCurveTo(x + w / 2, y, x + w, y + h * 0.38);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    return true;
  }
  if (clip.kind === "rect") {
    const radius = Math.max(0, Math.min(clip.cornerRadius || 0, Math.abs(w) / 2, Math.abs(h) / 2));
    ctx.beginPath();
    if (!radius) {
      ctx.rect(x, y, w, h);
      return true;
    }
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
    return true;
  }
  return false;
}

function mimeOf(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/png";
}

function loadPhoto(url, warn, where) {
  if (!url) {
    warn(where + ": missing url");
    return null;
  }
  const rel = String(url).replace(/\\/g, "/");
  const asset = rel.startsWith("assets/decorations/");
  const root = asset
    ? path.resolve(__dirname, "..", "assets", "decorations")
    : path.resolve(PHOTO_ROOT);
  const file = asset
    ? path.resolve(__dirname, "..", rel)
    : path.resolve(PHOTO_ROOT, rel);
  const relative = path.relative(root, file);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    warn(where + ": image url escapes generated-templates: " + url);
    return null;
  }
  if (!fs.existsSync(file)) {
    warn(where + ": missing image file " + url);
    return null;
  }
  if (imageCache.has(file)) return imageCache.get(file);
  try {
    const buffer = fs.readFileSync(file);
    const img = new Image();
    img.src = buffer;
    const loaded = { img, buffer, mime: mimeOf(file), file };
    imageCache.set(file, loaded);
    return loaded;
  } catch (error) {
    warn(where + ": unreadable image file " + url);
    return null;
  }
}

function placement(img, box, content, warn, where) {
  const alignX = content.alignX;
  const alignY = content.alignY;
  const ax = alignX == null ? 0 : Number(alignX);
  const ay = alignY == null ? 0 : Number(alignY);
  if (alignX == null) warn(where + ": missing alignX; image anchored to the left of the box");
  if (alignY == null) warn(where + ": missing alignY; image anchored to the top of the box");
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) {
    warn(where + ": image has no pixel size");
    return null;
  }
  if (content.fit !== "cover" && content.fit !== "contain") {
    warn(where + ": missing fit");
    return { x: box.x, y: box.y, w: iw, h: ih };
  }
  if (content.fit === "cover") {
    const scale = Math.max(box.width / iw, box.height / ih);
    const sw = box.width / scale;
    const sh = box.height / scale;
    return {
      crop: true,
      sx: Math.max(0, Math.min(iw - sw, (iw - sw) * ax)),
      sy: Math.max(0, Math.min(ih - sh, (ih - sh) * ay)),
      sw,
      sh,
      x: box.x,
      y: box.y,
      w: box.width,
      h: box.height,
    };
  }
  const scale = Math.min(box.width / iw, box.height / ih);
  const w = iw * scale;
  const h = ih * scale;
  return {
    x: box.x + (box.width - w) * ax,
    y: box.y + (box.height - h) * ay,
    w,
    h,
  };
}

function hatchCanvas(ctx, box) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.width, box.height);
  ctx.clip();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(box.x, box.y, box.width, box.height);
  ctx.strokeStyle = "#e10600";
  ctx.lineWidth = 5;
  const step = 16;
  for (let offset = -box.height; offset < box.width + box.height; offset += step) {
    ctx.beginPath();
    ctx.moveTo(box.x + offset, box.y);
    ctx.lineTo(box.x + offset + box.height, box.y + box.height);
    ctx.stroke();
  }
  ctx.strokeStyle = "#e10600";
  ctx.lineWidth = 3;
  ctx.strokeRect(box.x + 1.5, box.y + 1.5, Math.max(0, box.width - 3), Math.max(0, box.height - 3));
  ctx.restore();
}

const SUBSTITUTES = {
  "Telegraf": ["Space Grotesk", "Telegraf is not available"],
  "Telegraf Bold": ["Space Grotesk", "Telegraf is not available"],
  "Canva Sans": ["Figtree", "Canva Sans is not available"],
  "Canva Sans Bold": ["Figtree", "Canva Sans is not available"],
};

function isSerifFamily(name) {
  const value = String(name || "");
  if (/sans/i.test(value)) return false;
  return /serif|georgia|times|garamond|baskerville|bodoni|didot|merriweather|playfair|cambria|palatino|constantia|antiqua|caslon|spectral|fraunces|newsreader|literata|crimson|lora|cardo|vollkorn|cochin|bookman|minion|sabon|^forum$/i.test(value);
}

function fallbackFamily(name) {
  return isSerifFamily(name) ? "Georgia" : "Arial";
}

function resolvedFamily(style, warn, where) {
  if (!style.fontFamily) {
    warn(where + ": missing fontFamily");
    return null;
  }
  if (!Number(style.fontSize)) {
    warn(where + ": missing fontSize");
    return null;
  }
  const substitute = SUBSTITUTES[style.fontFamily];
  if (substitute) {
    warn(where + ': font "' + style.fontFamily + '" substituted with ' + substitute[0] + " because " + substitute[1]);
  }
  if (ensureFont(style.fontFamily)) return style.fontFamily;
  if (style.fontFamily === "Georgia") return "Georgia";
  const fallback = fallbackFamily(style.fontFamily);
  warn(where + ': font "' + style.fontFamily + '" falls back to ' + fallback + " because the font is not installed");
  return fallback;
}

function widthOfText(text, style, family) {
  const base = fontFile(family)
    ? measureWidth(family, text, Number(style.fontSize))
    : measured(text, style, family);
  return base + trackingExtra(text, style);
}

function measured(text, style, family) {
  const ctx = measureContext();
  ctx.font = fontCss(style, family);
  return ctx.measureText(text).width;
}

function elementRuns(element, slide, tokens) {
  const base = element.textStyle || {};
  const spans = element.textContent && element.textContent.spans;
  const source = Array.isArray(spans) && spans.length
    ? spans
    : [{ text: textOf(element, slide) }];
  const runs = [];
  source.forEach((span) => {
    const style = {
      fontFamily: token(span.fontFamily || base.fontFamily, tokens),
      fontSize: token(span.fontSize || base.fontSize, tokens),
      fontWeight: span.fontWeight == null ? base.fontWeight : span.fontWeight,
      color: token(span.color || base.color, tokens),
      textAlign: base.textAlign,
      lineHeight: base.lineHeight,
      letterSpacing: span.letterSpacing == null ? (base.letterSpacing || 0) : span.letterSpacing,
      highlight: !!span.highlight,
      shadowColor: span.shadowColor || base.shadowColor || "",
    };
    const parts = String(span.text == null ? "" : span.text).split("\n");
    parts.forEach((part, index) => {
      if (index > 0) runs.push({ break: true, style });
      part.split(" ").forEach((word, wordIndex) => {
        if (!word) return;
        runs.push({ word, spaceBefore: wordIndex > 0, style });
      });
    });
  });
  return runs;
}

function wrapRuns(runs, maxWidth, scale) {
  const lines = [];
  let line = [];
  let width = 0;
  const commit = () => {
    lines.push(line);
    line = [];
    width = 0;
  };
  const sized = (style) => {
    const next = Object.assign({}, style, { fontSize: Number(style.fontSize) * scale });
    if (style.letterSpacing) next.letterSpacing = Number(style.letterSpacing) * scale;
    return next;
  };
  runs.forEach((run) => {
    if (run.break) {
      commit();
      return;
    }
    const style = sized(run.style);
    const family = run.family;
    if (!family) return;
    const text = line.length && run.spaceBefore ? " " + run.word : run.word;
    const wordWidth = widthOfText(text, style, family);
    if (line.length && width + wordWidth > maxWidth + 0.5) {
      commit();
      const alone = widthOfText(run.word, style, family);
      line.push({ text: run.word, style, family, width: alone });
      width = alone;
      return;
    }
    line.push({ text, style, family, width: wordWidth });
    width += wordWidth;
  });
  if (line.length) lines.push(line);
  return lines.filter((item) => item.length);
}

function lineSize(line) {
  return Math.max(...line.map((piece) => Number(piece.style.fontSize) || 0));
}

function lineLead(line, missingLineHeight, where, warn) {
  const size = lineSize(line);
  const raw = line[0] && line[0].style.lineHeight;
  if (raw == null || raw === "") {
    if (!missingLineHeight.logged) {
      warn(where + ": missing lineHeight; lines advanced by the font size");
      missingLineHeight.logged = true;
    }
    return size;
  }
  return size * Number(raw);
}

function inkHeight(line) {
  let ink = lineSize(line);
  line.forEach((piece) => {
    const size = Number(piece.style.fontSize) || 0;
    const font = drawFont(piece.family);
    if (font) {
      const upem = font.unitsPerEm || 1000;
      const extent = (Math.abs(font.ascender || 0) + Math.abs(font.descender || 0)) * (size / upem);
      if (extent > ink) ink = extent;
      return;
    }
    const ctx = measureContext();
    ctx.font = fontCss(piece.style, piece.family);
    const metrics = ctx.measureText(piece.text || "Hg");
    const box = (metrics.actualBoundingBoxAscent || 0) + (metrics.actualBoundingBoxDescent || 0);
    if (box > ink) ink = box;
  });
  return ink;
}

function lineWidthOf(line) {
  return line.reduce((sum, piece) => sum + piece.width, 0);
}

function linesFit(lines, width, height, missingLineHeight, where, warn) {
  let y = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const size = Math.max(lineSize(lines[i]), inkHeight(lines[i]));
    if (lineWidthOf(lines[i]) > width + 0.5) return false;
    if (y + size > height + 0.5) return false;
    y += lineLead(lines[i], missingLineHeight, where, warn);
  }
  return true;
}

function widestLine(lines) {
  return lines.reduce((max, line) => Math.max(max, lineWidthOf(line)), 0);
}

function layoutText(element, slide, warn, where, wrap, tokens) {
  const runs = elementRuns(element, slide, tokens);
  runs.forEach((run) => {
    if (run.break) return;
    run.family = resolvedFamily(run.style, warn, where);
  });
  if (!runs.some((run) => run.word)) return [];
  if (element.textStyle && element.textStyle.textAlign == null) {
    warn(where + ": missing textAlign; text starts at the left of the box");
  }
  const missingLineHeight = { logged: false };
  const prepare = (scale) => wrapRuns(runs, element.width, scale);
  const fits = (lines) => linesFit(lines, element.width, element.height, missingLineHeight, where, warn);
  if (!wrap) {
    const words = runs.filter((run) => run.word && run.family);
    if (!words.length) return [];
    const style = Object.assign({}, words[0].style);
    const family = "Georgia";
    const shown = words.map((run) => run.word).join(" ");
    let size = Number(style.fontSize) || 1;
    while (size > 1 && widthOfText(shown, Object.assign({}, style, { fontSize: size }), family) > element.width) {
      size *= 0.92;
    }
    style.fontSize = size;
    return [[{ text: shown, style, family, width: widthOfText(shown, style, family) }]];
  }
  let lines = prepare(1);
  if (fits(lines)) return lines;
  let low = 0.05;
  let high = 1;
  let best = 0;
  for (let step = 0; step < 16; step += 1) {
    const mid = (low + high) / 2;
    const attempt = prepare(mid);
    if (linesFit(attempt, element.width, element.height, missingLineHeight, where, () => {})) {
      best = mid;
      low = mid;
    } else {
      high = mid;
    }
  }
  let scale = best > 0 ? best : 0.05;
  lines = prepare(scale);
  let guard = 0;
  while (widestLine(lines) > element.width + 0.5 && scale > 0.012 && guard < 12) {
    scale *= (element.width / Math.max(widestLine(lines), 1)) * 0.96;
    lines = prepare(scale);
    guard += 1;
  }
  guard = 0;
  while (!linesFit(lines, element.width, element.height, missingLineHeight, where, () => {}) && scale > 0.012 && guard < 14) {
    scale *= 0.86;
    lines = prepare(scale);
    guard += 1;
  }
  if (scale < 0.999) {
    const from = runs.filter((run) => run.word).map((run) => Number(run.style.fontSize));
    warn(where + ": auto-fit font size from " + from[0] + " to " + (from[0] * scale).toFixed(1));
  }
  if (linesFit(lines, element.width, element.height, missingLineHeight, where, warn)) return lines;
  let y = 0;
  const kept = [];
  for (let i = 0; i < lines.length; i += 1) {
    const size = Math.max(lineSize(lines[i]), inkHeight(lines[i]));
    if (y + size > element.height + 0.5 && kept.length) break;
    kept.push(lines[i]);
    y += lineLead(lines[i], missingLineHeight, where, warn);
  }
  if (!kept.length && lines.length) kept.push(lines[0]);
  warn(where + ": wrapped lines exceed height");
  return kept.length ? kept : lines;
}

function clipMask(ctx, element, clip, warn, where) {
  ctx.beginPath();
  ctx.rect(element.x, element.y, element.width, element.height);
  ctx.clip();
  if (!clip || !clip.kind) {
    warn(where + ": missing clip.kind");
    return;
  }
  if (clip.kind === "path") {
    if (!clip.d) {
      warn(where + ": missing clip.d");
      return;
    }
    const viewBox = parseViewBox(clip.viewBox);
    if (!viewBox) {
      warn(where + ": missing clip.viewBox");
      return;
    }
    ctx.save();
    applyViewBox(ctx, element, viewBox);
    const ok = tracePath(ctx, clip.d);
    ctx.restore();
    if (!ok) {
      warn(where + ": unsupported clip path command");
      return;
    }
    ctx.clip();
    return;
  }
  if (clip.kind === "ellipse" || clip.kind === "arch" || clip.kind === "rect") {
    tracePreset(ctx, element, clip);
    ctx.clip();
    return;
  }
  warn(where + ": unknown clip kind " + clip.kind);
}

function textBoxes(element, slide, tokens) {
  prepareFonts();
  const lines = layoutText(element, slide, () => {}, element.id || "text", true, tokens);
  const placed = [];
  const missing = { logged: false };
  let y = element.y;
  lines.forEach((line) => {
    const align = line[0].style.textAlign;
    const lineWidth = line.reduce((sum, piece) => sum + piece.width, 0);
    let x = element.x;
    if (align === "center") x = element.x + (element.width - lineWidth) / 2;
    else if (align === "right") x = element.x + element.width - lineWidth;
    const size = lineSize(line);
    line.forEach((piece) => {
      let left = x;
      let width = piece.width;
      if (piece.style.highlight && piece.text.charAt(0) === " ") {
        const gap = widthOfText(" ", piece.style, piece.family);
        left += gap;
        width -= gap;
      }
      placed.push({
        text: piece.text.replace(/^\s+/, ""),
        x: left,
        y,
        width,
        height: size,
        highlight: !!piece.style.highlight,
      });
      x += piece.width;
    });
    y += lineLead(line, missing, "", () => {});
  });
  return placed;
}

function paintImage(ctx, element, content, warn, where, enabled) {
  ctx.save();
  if (element.opacity != null) ctx.globalAlpha *= Number(element.opacity);
  const box = { x: element.x, y: element.y, width: element.width, height: element.height };
  if (content.shadow) {
    ctx.save();
    ctx.shadowBlur = 40;
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.fillStyle = "#000000";
    ctx.fillRect(box.x, box.y, box.width, box.height);
    ctx.restore();
  }
  if (content.clip) clipMask(ctx, element, content.clip, warn, where);
  else {
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.width, box.height);
    ctx.clip();
  }
  const photo = enabled ? loadPhoto(content.url, warn, where) : null;
  if (!enabled || !photo) {
    if (!enabled) {
      ctx.fillStyle = "#8ea4b0";
      ctx.fillRect(box.x, box.y, box.width, box.height);
      ctx.fillStyle = "#3d4a3c";
      ctx.globalAlpha *= 0.85;
      ctx.fillRect(box.x, box.y + box.height * 0.62, box.width, box.height * 0.38);
    } else {
      hatchCanvas(ctx, box);
    }
    ctx.restore();
    return;
  }
  const placed = placement(photo.img, box, content, warn, where);
  if (placed && placed.crop) ctx.drawImage(photo.img, placed.sx, placed.sy, placed.sw, placed.sh, placed.x, placed.y, placed.w, placed.h);
  else if (placed) ctx.drawImage(photo.img, placed.x, placed.y, placed.w, placed.h);
  ctx.restore();
}

function rgba(hex, alpha) {
  const h = String(hex || "#000000").replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = alpha == null ? 1 : Number(alpha);
  return "rgba(" + (r || 0) + "," + (g || 0) + "," + (b || 0) + "," + (Number.isFinite(a) ? a : 1) + ")";
}

function linearFill(ctx, element, gradient) {
  const angle = (Number(gradient.angle) || 0) * Math.PI / 180;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const cx = element.x + element.width / 2;
  const cy = element.y + element.height / 2;
  const half = Math.abs(element.width * dx) / 2 + Math.abs(element.height * dy) / 2;
  const paint = ctx.createLinearGradient(cx - dx * half, cy - dy * half, cx + dx * half, cy + dy * half);
  let last = -1;
  (gradient.stops || []).slice().sort((a, b) => Number(a.pos) - Number(b.pos)).forEach((stop) => {
    let pos = Number(stop.pos);
    if (!Number.isFinite(pos)) pos = 0;
    if (pos <= last) pos = Math.min(1, last + 0.0001);
    last = pos;
    paint.addColorStop(Math.max(0, Math.min(1, pos)), rgba(stop.hex, stop.alpha));
  });
  return paint;
}

function paintIllustration(ctx, element, body, warn, where, enabled, tokens) {
  ctx.save();
  if (element.opacity != null) ctx.globalAlpha *= Number(element.opacity);
  const fill = body.fill == null || body.fill === "" ? "none" : token(body.fill, tokens);
  const stroke = token(body.stroke, tokens);
  if (!enabled) {
    ctx.fillStyle = !fill || fill === "none" ? "#3d4a3c" : fill;
    ctx.fillRect(element.x, element.y, element.width, element.height);
    ctx.restore();
    return;
  }
  if (!body.d) {
    warn(where + ": missing illustrationContent.d");
    ctx.restore();
    return;
  }
  const viewBox = parseViewBox(body.viewBox);
  if (!viewBox) {
    warn(where + ": missing illustrationContent.viewBox");
    ctx.restore();
    return;
  }
  ctx.save();
  applyUniformViewBox(ctx, element, viewBox);
  const ok = tracePath(ctx, body.d);
  ctx.restore();
  if (!ok) {
    warn(where + ": unsupported illustration path command");
    ctx.restore();
    return;
  }
  const hasFill = fill && fill !== "none" && fill !== "transparent";
  const hasStroke = stroke && stroke !== "none" && Number(body.strokeWidth) > 0;
  if (!hasFill && !hasStroke) warn(where + ": missing illustration fill and stroke");
  if (hasFill) {
    ctx.fillStyle = body.gradient && body.gradient.stops ? linearFill(ctx, element, body.gradient) : fill;
    ctx.fill();
  }
  if (hasStroke) {
    const previous = ctx.globalAlpha;
    if (body.strokeOpacity != null) ctx.globalAlpha = previous * Number(body.strokeOpacity);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = Number(body.strokeWidth);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.globalAlpha = previous;
  }
  ctx.restore();
}

function paintText(ctx, element, slide, warn, where, wrap, tokens) {
  const lines = layoutText(element, slide, warn, where, wrap, tokens);
  if (!lines.length) return;
  ctx.save();
  if (element.opacity != null) ctx.globalAlpha *= Number(element.opacity);
  ctx.beginPath();
  ctx.rect(element.x, element.y, element.width, element.height);
  ctx.clip();
  ctx.textBaseline = "top";
  const missing = { logged: false };
  let y = element.y;
  lines.forEach((line) => {
    const align = line[0].style.textAlign;
    const lineWidth = line.reduce((sum, piece) => sum + piece.width, 0);
    let x = element.x;
    if (align === "center") x = element.x + (element.width - lineWidth) / 2;
    else if (align === "right") x = element.x + element.width - lineWidth;
    line.forEach((piece) => {
      if (!piece.style.color) {
        warn(where + ": missing text color");
        return;
      }
      if (piece.style.shadowColor) {
        ctx.shadowColor = piece.style.shadowColor;
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      } else {
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      const size = Number(piece.style.fontSize);
      const painted = fontFile(piece.family)
        && paintGlyphs(ctx, piece.family, piece.text, x, y, size, piece.style.color, letterGap(piece.style));
      if (!painted) {
        ctx.font = fontCss(piece.style, piece.family);
        ctx.fillStyle = piece.style.color;
        paintFallbackText(ctx, piece.text, x, y, piece.style, piece.family);
      }
      x += piece.width;
    });
    y += lineLead(line, missing, where, warn);
  });
  ctx.restore();
}

function thickenFallback(style) {
  if (!style || !style.fontFamily || fontFile(style.fontFamily)) return false;
  style.fontWeight = 900;
  return true;
}

function maskFontCss(style, family) {
  const size = Number(style.fontSize);
  if (!style.fontFamily || !fontFile(style.fontFamily)) return "900 " + size + 'px "' + (family || "Arial") + '"';
  const weight = Number(style.fontWeight) || 400;
  return weight + " " + size + "px " + canvasFamily(style.fontFamily);
}

function patternTextWidth(ctx, text, style) {
  const gap = letterGap(style);
  const chars = Array.from(String(text));
  if (!gap) return ctx.measureText(text).width;
  let width = 0;
  chars.forEach((char, index) => {
    width += ctx.measureText(char).width;
    if (index < chars.length - 1) width += gap;
  });
  return width;
}

function paintPatternText(ctx, text, x, y, style) {
  const gap = letterGap(style);
  if (!gap) {
    ctx.fillText(text, x, y);
    return;
  }
  const chars = Array.from(String(text));
  let cursor = x;
  chars.forEach((char, index) => {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width;
    if (index < chars.length - 1) cursor += gap;
  });
}

function paintTextMaskedImage(ctx, element, slide, warn, where, tokens, enabled) {
  const body = element.textMaskedImageContent || {};
  thickenFallback(element.textStyle);
  const spans = element.textContent && element.textContent.spans;
  if (Array.isArray(spans)) spans.forEach((span) => thickenFallback(span));
  const lines = layoutText(element, slide, warn, where, true, tokens);
  if (!lines.length) return;
  const w = Math.max(1, Math.ceil(element.width));
  const h = Math.max(1, Math.ceil(element.height));
  const photoLayer = createCanvas(w, h);
  const photoCtx = photoLayer.getContext("2d");
  const local = { x: 0, y: 0, width: element.width, height: element.height };
  const photo = enabled ? loadPhoto(body.url, warn, where) : null;
  if (!enabled || !photo) hatchCanvas(photoCtx, local);
  else {
    const placed = placement(photo.img, local, body, warn, where);
    if (placed && placed.crop) photoCtx.drawImage(photo.img, placed.sx, placed.sy, placed.sw, placed.sh, placed.x, placed.y, placed.w, placed.h);
    else if (placed) photoCtx.drawImage(photo.img, placed.x, placed.y, placed.w, placed.h);
  }
  const scratch = createCanvas(w, h);
  const pen = scratch.getContext("2d");
  const pattern = pen.createPattern(photoLayer, "no-repeat");
  pen.fillStyle = pattern || "#000000";
  pen.textBaseline = "top";
  let y = 0;
  const missing = { logged: false };
  lines.forEach((line) => {
    const align = line[0].style.textAlign;
    const widths = line.map((piece) => {
      pen.font = maskFontCss(piece.style, piece.family);
      return patternTextWidth(pen, piece.text, piece.style);
    });
    const lineWidth = widths.reduce((sum, width) => sum + width, 0);
    let x = 0;
    if (align === "center") x = (element.width - lineWidth) / 2;
    else if (align === "right") x = element.width - lineWidth;
    line.forEach((piece, index) => {
      pen.font = maskFontCss(piece.style, piece.family);
      pen.fillStyle = pattern || "#000000";
      paintPatternText(pen, piece.text, x, y, piece.style);
      x += widths[index];
    });
    y += lineLead(line, missing, where, warn);
  });
  ctx.save();
  if (element.opacity != null) ctx.globalAlpha *= Number(element.opacity);
  ctx.drawImage(scratch, element.x, element.y);
  ctx.restore();
}

function paintNoise(ctx, element) {
  const w = Math.max(1, Math.round(element.width));
  const h = Math.max(1, Math.round(element.height));
  const scratch = createCanvas(w, h);
  const noise = scratch.getContext("2d").createImageData(w, h);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const v = Math.floor((n - Math.floor(n)) * 255);
      const i = (y * w + x) * 4;
      noise.data[i] = v;
      noise.data[i + 1] = v;
      noise.data[i + 2] = v;
      noise.data[i + 3] = 255;
    }
  }
  scratch.getContext("2d").putImageData(noise, 0, 0);
  ctx.drawImage(scratch, element.x, element.y, element.width, element.height);
}

function paintShape(ctx, element, tokens) {
  const shape = element.shapeContent || {};
  const fill = token(shape.fill, tokens) || "none";
  const params = shape.decorParams || {};
  ctx.save();
  if (element.opacity != null) ctx.globalAlpha *= Number(element.opacity);
  if (fill === "noise") {
    paintNoise(ctx, element);
    ctx.restore();
    return;
  }
  if (shape.kind === "decor" && shape.decorName === "svg" && params.d) {
    const viewBox = parseViewBox(params.viewBox || "0 0 100 100");
    if (viewBox) {
      ctx.save();
      applyViewBox(ctx, element, viewBox);
      tracePath(ctx, params.d);
      ctx.restore();
      const stroke = params.paint === "stroke";
      if (!stroke && fill !== "none") {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke && fill !== "none") {
        ctx.strokeStyle = fill;
        ctx.lineWidth = params.strokeWidth || 3;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }
    ctx.restore();
    return;
  }
  const radius = shape.kind === "circle" ? Math.min(element.width, element.height) / 2 : (shape.cornerRadius || 0);
  tracePreset(ctx, element, { kind: "rect", cornerRadius: radius });
  if (fill && fill !== "none" && fill !== "transparent") {
    ctx.fillStyle = shape.gradient && shape.gradient.stops ? linearFill(ctx, element, shape.gradient) : fill;
    ctx.fill();
  }
  const stroke = token(shape.stroke || shape.strokeColor, tokens);
  if (stroke && stroke !== "none" && shape.strokeWidth) {
    const previous = ctx.globalAlpha;
    if (shape.strokeOpacity != null) ctx.globalAlpha = previous * Number(shape.strokeOpacity);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = Number(shape.strokeWidth);
    ctx.stroke();
    ctx.globalAlpha = previous;
  }
  ctx.restore();
}

function axisBounds(element) {
  const width = Number(element.width) || 0;
  const height = Number(element.height) || 0;
  const x = Number(element.x) || 0;
  const y = Number(element.y) || 0;
  if (element.type !== "rotated") return { x, y, r: x + width, b: y + height };
  const cx = x + width / 2;
  const cy = y + height / 2;
  const rad = (Number(element.degrees) || 0) * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const corners = [[x, y], [x + width, y], [x, y + height], [x + width, y + height]];
  const pts = corners.map(([px, py]) => {
    const dx = px - cx;
    const dy = py - cy;
    return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
  });
  const xs = pts.map((pt) => pt[0]);
  const ys = pts.map((pt) => pt[1]);
  return { x: Math.min.apply(null, xs), y: Math.min.apply(null, ys), r: Math.max.apply(null, xs), b: Math.max.apply(null, ys) };
}

function pictureElement(element) {
  const node = element && element.type === "rotated" && element.element ? element.element : element;
  return Boolean(node && (node.type === "image" || node.type === "maskedImage"));
}

function oneWord(element) {
  const spans = element.textContent && element.textContent.spans;
  const text = (Array.isArray(spans) ? spans.map((span) => String(span && span.text || "")).join("") : "").trim();
  return Boolean(text) && text.split(/\s+/).length === 1;
}

function openSpan(element, elements, word) {
  if (!oneWord(element)) return null;
  const box = axisBounds(element);
  const height = box.b - box.y;
  const blocks = [];
  elements.forEach((other) => {
    if (other === element || !pictureElement(other)) return;
    if ((Number(other.zIndex) || 0) <= (Number(element.zIndex) || 0)) return;
    const bounds = axisBounds(other);
    const overlap = Math.min(box.b, bounds.b) - Math.max(box.y, bounds.y);
    if (overlap < height * 0.4) return;
    const left = Math.max(box.x, bounds.x);
    const right = Math.min(box.r, bounds.r);
    if (right - left > 1) blocks.push([left, right]);
  });
  if (!blocks.length) return null;
  blocks.sort((a, b) => a[0] - b[0]);
  const merged = [];
  blocks.forEach(([left, right]) => {
    const last = merged[merged.length - 1];
    if (!last || left > last[1]) merged.push([left, right]);
    else last[1] = Math.max(last[1], right);
  });
  if (word && !merged.some(([left, right]) => word.r > left + 1 && word.x < right - 1)) return null;
  const gaps = [];
  let cursor = box.x;
  merged.forEach(([left, right]) => {
    if (left - cursor > 8) gaps.push([cursor, left]);
    cursor = Math.max(cursor, right);
  });
  if (box.r - cursor > 8) gaps.push([cursor, box.r]);
  if (!gaps.length) return null;
  gaps.sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]));
  const width = gaps[0][1] - gaps[0][0];
  if (width >= (box.r - box.x) - 1 || width < (box.r - box.x) * 0.42) return null;
  return { x: gaps[0][0], width };
}

function paintSlide(ctx, deck, layoutId, warn, options) {
  const flags = Object.assign({ images: true, paths: true, wrap: true }, options || {});
  const slide = (deck.previewSlides || []).find((item) => item.layout === layoutId) || { title: "", bullets: [] };
  const layerOf = (element) => {
    const z = Number(element && element.zIndex);
    return Number.isFinite(z) ? z : 0;
  };
  const elements = [((deck.layouts[layoutId] || {}).elements || [])].flat().slice()
    .sort((a, b) => layerOf(a) - layerOf(b));
  ctx.fillStyle = token("{color.bg}", deck.tokens) || "#f4f7f8";
  ctx.fillRect(0, 0, 1600, 900);

  const draw = (element) => {
    const where = layoutId + " " + (element.id || element.type);
    if (element.type === "rotated" && element.element) {
      const cx = element.x + element.width / 2;
      const cy = element.y + element.height / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((Number(element.degrees) || 0) * Math.PI / 180);
      ctx.translate(-cx, -cy);
      draw(element.element);
      ctx.restore();
      return;
    }
    if (element.type === "collage") {
      const cells = (element.collageContent && element.collageContent.cells) || [];
      cells.forEach((cell, index) => {
        paintImage(ctx, {
          x: element.x + cell.x,
          y: element.y + cell.y,
          width: cell.width,
          height: cell.height,
          opacity: element.opacity,
          id: (element.id || "collage") + "-cell-" + index,
        }, { url: cell.url, fit: cell.fit, alignX: cell.alignX, alignY: cell.alignY }, warn, where + " cell " + index, flags.images);
      });
      return;
    }
    if (element.type === "illustration") {
      paintIllustration(ctx, element, element.illustrationContent || {}, warn, where, flags.paths, deck.tokens);
      return;
    }
    if (element.type === "maskedImage") {
      const content = element.maskedImageContent || {};
      paintImage(ctx, element, content, warn, where, flags.images);
      return;
    }
    if (element.type === "image") {
      const content = Object.assign({}, element.imageContent || {});
      if (content.treatment === "cutout" && !content.clip) content.clip = { kind: "arch" };
      paintImage(ctx, element, content, warn, where, flags.images);
      return;
    }
    if (element.type === "shape") {
      paintShape(ctx, element, deck.tokens);
      return;
    }
    if (element.type === "textMaskedImage") {
      paintTextMaskedImage(ctx, element, slide, warn, where, deck.tokens, flags.images);
      return;
    }
    if (element.type === "text") {
      const probe = layoutText(element, slide, () => {}, where, flags.wrap, deck.tokens);
      let word = null;
      if (probe.length === 1 && probe[0].length === 1) {
        const ink = probe[0][0].width;
        const align = probe[0][0].style.textAlign;
        let left = element.x;
        if (align === "center") left = element.x + (element.width - ink) / 2;
        else if (align === "right") left = element.x + element.width - ink;
        word = { x: left, r: left + ink };
      }
      const gap = openSpan(element, elements, word);
      if (!gap) {
        paintText(ctx, element, slide, warn, where, flags.wrap, deck.tokens);
        return;
      }
      const savedX = element.x;
      const savedWidth = element.width;
      element.x = gap.x;
      element.width = gap.width;
      try {
        paintText(ctx, element, slide, warn, where, flags.wrap, deck.tokens);
      } finally {
        element.x = savedX;
        element.width = savedWidth;
      }
      return;
    }
  };

  elements.forEach(draw);
}

function assertNativeElement(layoutId, element) {
  if (!element) return;
  // Corporate and creative layouts share this path: solid shapes, text, and photos.
  // Full-bleed boxes, stacked overlap, and a translucent shape are painted as themselves.
  if (element.type !== "shape" && element.type !== "text" && element.type !== "image" && element.type !== "maskedImage") {
    throw new Error("Native layout " + layoutId + " cannot render " + element.type + " (" + (element.id || "element") + ")");
  }
  const clip = element.maskedImageContent && element.maskedImageContent.clip;
  if (element.type === "maskedImage" && clip && (clip.kind === "path" || clip.d)) {
    throw new Error("Native layout " + layoutId + " cannot render a clipped path (" + (element.id || "element") + ")");
  }
}

function renderNativeDeck(deck, dir) {
  if (!deck || !deck.layouts) throw new Error("Native deck has no layouts");
  const sequence = deck.layoutSequence || [];
  if (!sequence.length) throw new Error("Native deck has no slides");
  fs.mkdirSync(dir, { recursive: true });
  return sequence.map((layoutId, index) => {
    const layout = deck.layouts[layoutId];
    if (!layout) throw new Error("Missing native layout " + layoutId);
    (layout.elements || []).forEach((element) => assertNativeElement(layoutId, element));
    const file = path.join(dir, "slide-" + String(index + 1).padStart(2, "0") + ".png");
    renderSlidePng(deck, layoutId, file);
    return file;
  });
}

function renderSlidePng(deck, layoutId, file, options) {
  const warnings = [];
  const seen = new Set();
  const warn = (message) => {
    if (seen.has(message)) return;
    seen.add(message);
    warnings.push(message);
    console.warn(message);
  };
  prepareFonts();
  const canvas = createCanvas(1600, 900);
  paintSlide(canvas.getContext("2d"), deck, layoutId, warn, options);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, canvas.toBuffer("image/png"));
  return warnings;
}

function renderSlideBuffer(deck, layoutId, options) {
  prepareFonts();
  const canvas = createCanvas(1600, 900);
  paintSlide(canvas.getContext("2d"), deck, layoutId, () => {}, options);
  return canvas.toBuffer("image/png");
}

function slideSvg(deck, layoutId) {
  const file = path.join(require("os").tmpdir(), "slidexy-" + layoutId + "-" + process.pid + ".png");
  renderSlidePng(deck, layoutId, file);
  const href = "data:image/png;base64," + fs.readFileSync(file).toString("base64");
  try { fs.unlinkSync(file); } catch (error) { /* temp preview */ }
  return '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">'
    + '<image href="' + href + '" width="1600" height="900"/></svg>\n';
}

function textLineWidths(element, tokens) {
  const runs = elementRuns(element, {}, tokens || {});
  runs.forEach((run) => {
    if (run.break) return;
    run.family = resolvedFamily(run.style, () => {}, "");
  });
  if (!runs.some((run) => run.word)) return [];
  return wrapRuns(runs, Number(element.width) || 0, 1).map((line) => line.reduce((sum, piece) => sum + piece.width, 0));
}

function textWasClipped(element, tokens) {
  const notes = [];
  layoutText(element, {}, (message) => notes.push(message), "text", true, tokens || {});
  return notes.some((message) => message.indexOf("clipped with ellipsis") >= 0);
}

module.exports = { slideSvg, renderSlidePng, renderSlideBuffer, renderNativeDeck, textBoxes, textLineWidths, textWasClipped };
