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
const { hasRegisteredFont, systemFontPath } = require("../services/templatePipeline/fonts");

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
  if (file) {
    if (!registeredFonts.has(family)) {
      try {
        registerFont(file, { family: canvasFamily(family) });
      } catch (error) {
        // Some Windows font collections cannot be registered by node-canvas.
        // Let the existing installed-font/fallback path handle that family.
        return hasRegisteredFont(family) ? systemFontPath(family) || true : null;
      }
      registeredFonts.add(family);
    }
    return file;
  }
  if (hasRegisteredFont(family)) return systemFontPath(family) || true;
  return null;
}

function prepareFonts() {
  knownFamilies().forEach((family) => ensureFont(family));
}

/** Preview-only aliases — PPTX still emits the design-system family name. */
const CANVAS_FONT_ALIASES = {
  Inter: "Segoe UI",
  "Playfair Display": "Georgia",
  Lora: "Georgia",
  "Space Grotesk": "Bahnschrift",
  Nunito: "Candara",
  Poppins: "Candara",
  "Open Sans": "Calibri",
  Orbitron: "Impact",
  "Arial Black": "Archivo Black",
};

function canvasPaintFamily(family) {
  const alias = CANVAS_FONT_ALIASES[String(family || "")];
  return alias || family;
}

function fontCss(style, family) {
  const size = Number(style.fontSize);
  const weight = Number(style.fontWeight);
  const paintFamily = canvasPaintFamily(family);
  // Faces that are already black/heavy break when canvas asks for "Family Bold".
  const alreadyHeavy = /black|heavy|impact|archivo black/i.test(String(family || "") + " " + String(paintFamily || ""));
  if (hasRegisteredFont(paintFamily) || hasRegisteredFont(family)) {
    const face = hasRegisteredFont(paintFamily) ? paintFamily : family;
    const bold = weight >= 600 && !alreadyHeavy ? "bold " : "";
    return bold + size + 'px "' + face + '"';
  }
  if (family === "Georgia" && weight >= 600) return "bold " + size + "px Georgia";
  if (fontFile(family)) return size + "px " + canvasFamily(family);
  if (weight && !alreadyHeavy) return weight + " " + size + 'px "' + family + '"';
  return size + 'px "' + family + '"';
}

const drawnFonts = new Map();

function drawFont(family, weight) {
  const w = Number(weight) || 400;
  const bucket = w >= 800 ? "black" : w >= 600 ? "bold" : "reg";
  const key = String(family || "") + ":" + bucket;
  if (drawnFonts.has(key)) return drawnFonts.get(key);
  let file = null;
  if (w >= 600) file = systemFontPath(family, w >= 800 ? 900 : 700);
  if (!file) file = fontFile(family);
  if (!file) file = systemFontPath(family, 400);
  if (!file || file === true || !fs.existsSync(file)) {
    drawnFonts.set(key, null);
    return null;
  }
  try {
    const font = opentype.parse(fs.readFileSync(file));
    drawnFonts.set(key, font);
    return font;
  } catch (error) {
    drawnFonts.set(key, null);
    return null;
  }
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

/** Advance width using the same OpenType face paintGlyphRun draws with. */
function glyphRunWidth(font, text, size, gap) {
  if (!font) return null;
  const scale = size / (font.unitsPerEm || 1000);
  const chars = Array.from(String(text));
  let width = 0;
  chars.forEach((char, index) => {
    let glyph;
    try {
      glyph = font.charToGlyph(char);
    } catch (error) {
      width += size * 0.55;
      if (index < chars.length - 1) width += gap;
      return;
    }
    width += (glyph.advanceWidth || 0) * scale;
    if (index < chars.length - 1) width += gap;
  });
  return width;
}

function shadeHex(hex, amount) {
  const raw = String(hex || "#000000").replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return hex || "#000000";
  const n = parseInt(raw, 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (n & 255) + amount));
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function paintGlyphRun(ctx, font, text, x, yTop, size, color, gap, hollow) {
  const scale = size / (font.unitsPerEm || 1000);
  const baseline = yTop + (font.ascender || font.unitsPerEm || 1000) * scale;
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
    if (hollow) {
      outline.fill = null;
      outline.stroke = color;
      outline.strokeWidth = 2;
    } else {
      outline.fill = color;
      outline.stroke = null;
    }
    outline.draw(ctx);
    cursor += (glyph.advanceWidth || 0) * scale;
    if (index < chars.length - 1) cursor += gap;
  });
}

function depthShade(color, stepIndex) {
  // Keep extrusion readable on near-black ink: step toward pure black, not muddy midtones.
  const raw = String(color || "#000000").replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return "#000000";
  const n = parseInt(raw, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = (r + g + b) / 3;
  if (lum < 60) return "#000000";
  return shadeHex(color, -24 - stepIndex * 12);
}

function paintGlyphs(ctx, family, text, x, yTop, size, color, spacing, treatment, style) {
  const font = drawFont(family, style && style.fontWeight);
  if (!font) return false;
  const gap = Number(spacing) || 0;
  const hollow = treatment === "outline";
  if (treatment === "offset-3d") {
    const steps = Math.max(3, Math.min(8, Number(style && style.offsetSteps) || 6));
    const dx = Number(style && style.offsetX) || 6;
    const dy = Number(style && style.offsetY) || 6;
    // Back → front: every layer shares the same origin as the face (no per-layer recenter).
    for (let i = steps; i >= 1; i--) {
      paintGlyphRun(ctx, font, text, x + dx * i, yTop + dy * i, size, depthShade(color, i), gap, false);
    }
    paintGlyphRun(ctx, font, text, x, yTop, size, color, gap, false);
    return true;
  }
  if (treatment === "long-shadow") {
    const length = Math.max(12, Number(style && style.shadowLength) || 48);
    const step = Math.max(2, Number(style && style.shadowStep) || 3);
    const shade = depthShade(color, 3);
    for (let d = length; d >= step; d -= step) {
      paintGlyphRun(ctx, font, text, x + d * 0.7, yTop + d * 0.7, size, shade, gap, false);
    }
    paintGlyphRun(ctx, font, text, x, yTop, size, color, gap, false);
    return true;
  }
  paintGlyphRun(ctx, font, text, x, yTop, size, color, gap, hollow);
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
  if (clip.kind === "pill") {
    const r = Math.min(Math.abs(w), Math.abs(h)) / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
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
  const assetDecor = rel.startsWith("assets/decorations/");
  const assetCache = rel.startsWith("assets/cache/");
  const asset = assetDecor || assetCache;
  const root = assetDecor
    ? path.resolve(__dirname, "..", "assets", "decorations")
    : assetCache
      ? path.resolve(__dirname, "..", "assets", "cache")
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
    const zoomRaw = content.zoom != null ? Number(content.zoom) : 1;
    const zoom = Number.isFinite(zoomRaw) && zoomRaw > 1 ? Math.min(2.5, zoomRaw) : 1;
    const scale = Math.max(box.width / iw, box.height / ih) * zoom;
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
  if (hasRegisteredFont(style.fontFamily)) return style.fontFamily;
  if (style.fontFamily === "Georgia") return "Georgia";
  const fallback = fallbackFamily(style.fontFamily);
  warn(where + ': font "' + style.fontFamily + '" falls back to ' + fallback + " because the font is not installed");
  return fallback;
}

function widthOfText(text, style, family) {
  const size = Number(style.fontSize);
  const gap = letterGap(style);
  // Prefer OpenType advances whenever glyph paint will use the same face —
  // node-canvas measureText often resolves a different system metric on Windows,
  // which under-reports width and collapses word spacing (e.g. "Tonight's board").
  const face = drawFont(family, style && style.fontWeight);
  const glyphWidth = glyphRunWidth(face, text, size, gap);
  if (glyphWidth != null) return glyphWidth;
  const base = fontFile(family)
    ? measureWidth(family, text, size)
    : measured(text, style, family);
  return base + trackingExtra(text, style);
}

function measured(text, style, family) {
  const ctx = measureContext();
  ctx.font = fontCss(style, family);
  return ctx.measureText(text).width;
}

function spanBoundaryNeedsSpace(prevText, curText) {
  const a = String(prevText || "");
  const b = String(curText || "");
  if (!a || !b) return false;
  if (/\s$/.test(a) || /^\s/.test(b)) return true;
  const left = a[a.length - 1];
  const right = b.replace(/^\s+/, "")[0] || "";
  if (!right || /\s/.test(left)) return false;
  if (/[([{“"'`]/.test(right) || /[,.;:!?…)\]}”"']/.test(left)) return false;
  return /[\w$%€£¥]/.test(left) && /[\w$%€£¥]/.test(right);
}

function elementRuns(element, slide, tokens) {
  const base = element.textStyle || {};
  const spans = element.textContent && element.textContent.spans;
  const source = Array.isArray(spans) && spans.length
    ? spans
    : [{ text: textOf(element, slide) }];
  const runs = [];
  source.forEach((span, spanIndex) => {
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
      typeTreatment: span.typeTreatment || base.typeTreatment || "solid",
      strokeWidth: span.strokeWidth != null ? span.strokeWidth : base.strokeWidth,
      offsetSteps: base.offsetSteps,
      offsetX: base.offsetX,
      offsetY: base.offsetY,
      shadowLength: base.shadowLength,
      shadowStep: base.shadowStep,
    };
    const raw = String(span.text == null ? "" : span.text);
    const parts = raw.split("\n");
    let firstWordInSpan = true;
    parts.forEach((part, index) => {
      if (index > 0) runs.push({ break: true, style });
      const leadingSpace = /^\s/.test(part);
      const words = part.trim().split(/\s+/).filter(Boolean);
      words.forEach((word, wordIndex) => {
        const crossSpan =
          firstWordInSpan &&
          spanIndex > 0 &&
          spanBoundaryNeedsSpace(source[spanIndex - 1].text, raw);
        runs.push({
          word,
          spaceBefore: wordIndex > 0 || leadingSpace || crossSpan,
          style,
        });
        firstWordInSpan = false;
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
  // Hard typographic floor: never preview below ~14pt body / ~24pt display (engine canvas units)
  const baseSizes = runs.filter((run) => run.word).map((run) => Number(run.style.fontSize) || 0);
  const baseSize = baseSizes[0] || 16;
  const isDisplay = Number(baseSize) >= 36 || (element.textStyle && Number(element.textStyle.fontWeight) >= 700 && Number(baseSize) >= 32);
  const hardFloor = isDisplay ? 40 : 24; // 24pt / 14pt true → engine
  const minScale = Math.min(1, hardFloor / Math.max(1, baseSize));
  if (scale < minScale) {
    scale = minScale;
    lines = prepare(scale);
  }
  if (scale < 0.999) {
    warn(where + ": auto-fit font size from " + baseSize + " to " + (baseSize * scale).toFixed(1));
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
  if (
    clip.kind === "ellipse" ||
    clip.kind === "arch" ||
    clip.kind === "pill" ||
    clip.kind === "rect"
  ) {
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
  let baseTreatment = (element.textStyle && element.textStyle.typeTreatment) || "solid";
  // Multi-line depth stacks collide — force a flat fallback at paint time.
  const plain = lines.map((line) => line.map((p) => p.text).join("")).join("\n");
  if ((baseTreatment === "offset-3d" || baseTreatment === "long-shadow") && (lines.length > 1 || Array.from(plain.replace(/\s+/g, " ").trim()).length > 14)) {
    baseTreatment = "solid";
    lines.forEach((line) => line.forEach((piece) => {
      piece.style = Object.assign({}, piece.style, { typeTreatment: "solid" });
    }));
  }
  const pad =
    baseTreatment === "offset-3d"
      ? Math.max(18, (Number(element.textStyle.offsetSteps) || 6) * Math.max(Number(element.textStyle.offsetX) || 6, Number(element.textStyle.offsetY) || 6))
      : baseTreatment === "long-shadow"
        ? Math.max(24, Number(element.textStyle.shadowLength) || 48)
        : 0;
  ctx.beginPath();
  ctx.rect(element.x - 2, element.y - 2, element.width + pad + 4, element.height + pad + 4);
  ctx.clip();
  ctx.textBaseline = "top";
  const missing = { logged: false };
  let y = element.y;
  lines.forEach((line) => {
    const align = line[0].style.textAlign;
    const lineWidth = line.reduce((sum, piece) => sum + piece.width, 0);
    // Shared line origin — every depth layer uses this same aligned start.
    let x = element.x;
    if (align === "center") x = element.x + (element.width - lineWidth) / 2;
    else if (align === "right") x = element.x + element.width - lineWidth;
    const lineOriginX = x;
    line.forEach((piece) => {
      if (!piece.style.color) {
        warn(where + ": missing text color");
        return;
      }
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      const size = Number(piece.style.fontSize);
      const treatment = piece.style.typeTreatment || baseTreatment;
      const canGlyph = !!(fontFile(piece.family) || systemFontPath(piece.family, piece.style.fontWeight));
      const painted = canGlyph
        && paintGlyphs(
          ctx,
          piece.family,
          piece.text,
          x,
          y,
          size,
          piece.style.color,
          letterGap(piece.style),
          treatment,
          piece.style
        );
      if (!painted) {
        ctx.font = fontCss(piece.style, piece.family);
        if (treatment === "outline") {
          ctx.strokeStyle = piece.style.color;
          ctx.lineWidth = 2;
          ctx.strokeText(piece.text, x, y + size * 0.8);
        } else if (treatment === "offset-3d" || treatment === "long-shadow") {
          const steps = treatment === "long-shadow"
            ? Math.ceil((Number(piece.style.shadowLength) || 48) / (Number(piece.style.shadowStep) || 3))
            : Math.max(3, Number(piece.style.offsetSteps) || 6);
          const dx = treatment === "long-shadow" ? 0.7 * (Number(piece.style.shadowStep) || 3) : (Number(piece.style.offsetX) || 6);
          const dy = treatment === "long-shadow" ? 0.7 * (Number(piece.style.shadowStep) || 3) : (Number(piece.style.offsetY) || 6);
          // Layers share the same piece origin (aligned with face); do not re-center per layer.
          for (let i = steps; i >= 1; i--) {
            ctx.fillStyle = depthShade(piece.style.color, i);
            paintFallbackText(ctx, piece.text, x + dx * i, y + dy * i, piece.style, piece.family);
          }
          ctx.fillStyle = piece.style.color;
          paintFallbackText(ctx, piece.text, x, y, piece.style, piece.family);
        } else {
          ctx.fillStyle = piece.style.color;
          paintFallbackText(ctx, piece.text, x, y, piece.style, piece.family);
        }
      }
      x += piece.width;
    });
    // Silence unused warning for lineOriginX kept for alignment clarity in reviews.
    void lineOriginX;
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

/** Preview-only chart paint (PPTX uses native editable addChart). Strict bbox clip. */
function paintChart(ctx, element, tokens) {
  const content = element.chartContent || {};
  const kind = String(content.chartType || content.type || "line").toLowerCase();
  const labels = Array.isArray(content.labels) ? content.labels : [];
  const series = Array.isArray(content.series) ? content.series : [];
  const x = Number(element.x) || 0;
  const y = Number(element.y) || 0;
  const w = Number(element.width) || 100;
  const h = Number(element.height) || 100;
  const colors = Array.isArray(content.colors) && content.colors.length
    ? content.colors.map((c) => token(c, tokens) || String(c))
    : [
        token(content.color, tokens) || "#1D4ED8",
        token(content.muted, tokens) || "#64748B",
        "#0F8A7A",
        "#C45C26",
        "#7C3AED",
      ];
  const ink = token(content.ink, tokens) || "#152238";
  ctx.save();
  // Hard clip — chart geometry must never paint outside the element box
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#E2E8F0";
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  if (!labels.length || !series.length) {
    ctx.fillStyle = ink;
    ctx.font = "400 22px Calibri";
    ctx.fillText("Chart", x + 24, y + h / 2);
    ctx.restore();
    return;
  }

  const values = series.map((s) =>
    (Array.isArray(s && s.values) ? s.values : []).map((v) => Number(v) || 0)
  );
  const stacked = kind === "stackedbar" || kind === "stacked" || kind.indexOf("stack") >= 0;
  // Scale to stacked column totals (or series max) so high values shrink the whole chart
  let maxV = 1;
  if (stacked) {
    for (let i = 0; i < labels.length; i++) {
      let sum = 0;
      for (let s = 0; s < values.length; s++) sum += values[s][i] || 0;
      if (sum > maxV) maxV = sum;
    }
  } else {
    values.forEach((vals) => vals.forEach((v) => { if (v > maxV) maxV = v; }));
  }

  const padTop = Math.max(16, h * 0.06);
  const padBottom = Math.max(28, h * 0.12);
  const padX = Math.max(24, w * 0.06);
  const plotH = Math.max(40, h - padTop - padBottom);
  const plotTop = y + padTop;
  const plotBottom = plotTop + plotH;

  if (kind === "donut" || kind === "doughnut") {
    const vals = values[0] || [];
    const total = vals.reduce((a, b) => a + b, 0) || 1;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const r = Math.min(w, h) * 0.32;
    let angle = -Math.PI / 2;
    vals.forEach((v, i) => {
      const sweep = (v / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle, angle + sweep);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      angle += sweep;
    });
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.55, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
  } else if (kind === "stackedbar" || kind === "stacked" || kind === "bar") {
    const n = labels.length;
    const gap = padX;
    const slot = (w - gap * 2) / Math.max(1, n);
    const barW = slot * 0.62;
    for (let i = 0; i < n; i++) {
      let stack = 0;
      const bx = x + gap + i * slot + (slot - barW) / 2;
      for (let s = 0; s < values.length; s++) {
        const v = values[s][i] || 0;
        // 0.92 headroom keeps the tallest stack inside the clipped box
        const bh = (v / maxV) * plotH * 0.92;
        ctx.fillStyle = colors[s % colors.length];
        const seriesW = stacked ? barW : barW / values.length;
        ctx.fillRect(bx + (stacked ? 0 : s * seriesW), plotBottom - (stacked ? stack : 0) - bh, seriesW, bh);
        if (stacked) stack += bh;
        if (!stacked) {
          ctx.fillStyle = ink;
          ctx.font = "400 18px Calibri";
          ctx.textAlign = "center";
          ctx.fillText(String(v), bx + s * seriesW + seriesW / 2, plotBottom - bh - 5);
        }
      }
      ctx.fillStyle = ink;
      ctx.font = "400 18px Calibri";
      ctx.textAlign = "center";
      ctx.fillText(String(labels[i]), bx + barW / 2, Math.min(y + h - 8, plotBottom + 22));
    }
    if (content.showLegend !== false && !stacked) {
      series.forEach((s, i) => {
        const lx = x + padX + i * (w - padX * 2) / series.length;
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(lx, y + h - 23, 18, 12);
        ctx.fillStyle = ink; ctx.textAlign = "left"; ctx.font = "400 17px Calibri";
        ctx.fillText(String(s.name || "Series"), lx + 26, y + h - 12);
      });
    }
  } else {
    const plotW = w - padX * 2;
    ctx.strokeStyle = "#CBD5E1";
    ctx.beginPath();
    ctx.moveTo(x + padX, plotTop);
    ctx.lineTo(x + padX, plotBottom);
    ctx.lineTo(x + w - padX, plotBottom);
    ctx.stroke();
    values.forEach((vals, s) => {
      ctx.strokeStyle = colors[s % colors.length];
      ctx.lineWidth = 3;
      ctx.beginPath();
      vals.forEach((v, i) => {
        const px = x + padX + (i / Math.max(1, labels.length - 1)) * plotW;
        const py = plotBottom - (v / maxV) * plotH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      vals.forEach((v, i) => {
        const px = x + padX + (i / Math.max(1, labels.length - 1)) * plotW;
        const py = plotBottom - (v / maxV) * plotH;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = colors[s % colors.length];
        ctx.fill();
      });
    });
  }
  ctx.restore();
}

function paintTable(ctx, element, tokens) {
  const content = element.tableContent || {};
  const rows = Array.isArray(content.rows) ? content.rows : [];
  if (!rows.length) return;
  const cols = Math.max.apply(
    null,
    rows.map((r) => (Array.isArray(r) ? r.length : 1)).concat([1])
  );
  const x = Number(element.x) || 0;
  const y = Number(element.y) || 0;
  const w = Number(element.width) || 100;
  const h = Number(element.height) || 100;
  const rowH = h / rows.length;
  const colW = w / cols;
  const ink = token(content.color, tokens) || "#1A1612";
  const headerFill = token(content.headerFill, tokens) || "#F4F7FB";
  const headerColor = token(content.headerColor, tokens) || ink;
  const border = token(content.borderColor, tokens) || "#D0D7E2";
  const fontSize = Number(content.fontSize) || 24;
  const fontFamily = String(content.fontFamily || "Calibri");
  const pad = Number(content.cellPadding) >= 0 ? Number(content.cellPadding) : 6;
  const altFill = content.altRowFill || null;
  const verticalBorders = content.verticalBorders === true;
  const horizontalBorders = content.horizontalBorders !== false;
  ctx.save();
  rows.forEach((row, ri) => {
    const cells = Array.isArray(row) ? row : [row];
    for (let ci = 0; ci < cols; ci++) {
      const cell = cells[ci];
      const text =
        cell && typeof cell === "object"
          ? String(cell.text != null ? cell.text : "")
          : String(cell != null ? cell : "");
      const cx = x + ci * colW;
      const cy = y + ri * rowH;
      const fill =
        ri === 0 ? headerFill : altFill && ri % 2 === 0 ? altFill : "#FFFFFF";
      ctx.fillStyle = fill;
      ctx.fillRect(cx, cy, colW, rowH);
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      if (horizontalBorders) {
        ctx.beginPath();
        ctx.moveTo(cx, cy + rowH);
        ctx.lineTo(cx + colW, cy + rowH);
        ctx.stroke();
      }
      if (verticalBorders) {
        ctx.strokeRect(cx + 0.5, cy + 0.5, colW - 1, rowH - 1);
      }
      ctx.fillStyle = ri === 0 ? headerColor : ink;
      ctx.font = (ri === 0 ? "600 " : "400 ") + fontSize + "px " + fontFamily;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const label = String(text || " ").slice(0, 48);
      ctx.fillText(label, cx + pad + 4, cy + rowH / 2, colW - pad * 2 - 8);
    }
  });
  ctx.restore();
}

function paintShape(ctx, element, tokens) {
  const shape = element.shapeContent || {};
  const fill = token(shape.fill, tokens) || "none";
  if (shape.kind === "wave") {
    ctx.save();
    ctx.translate(element.x, element.y);
    ctx.scale(element.width / 2000, element.height / 180);
    ctx.beginPath();
    for (const [kind, ...p] of require("../engine/waveGeometry").waveCommands()) {
      if (kind === "M") ctx.moveTo(...p);
      else if (kind === "C") ctx.bezierCurveTo(...p);
      else if (kind === "L") ctx.lineTo(...p);
      else ctx.closePath();
    }
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();
    return;
  }
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
  if (
    shape.kind === "triangle" ||
    shape.kind === "chevron" ||
    shape.kind === "diamond" ||
    shape.kind === "hexagon"
  ) {
    ctx.beginPath();
    if (shape.kind === "triangle") {
      ctx.moveTo(element.x + element.width / 2, element.y);
      ctx.lineTo(element.x + element.width, element.y + element.height);
      ctx.lineTo(element.x, element.y + element.height);
    } else if (shape.kind === "chevron") {
      // chevron pointing right
      const mid = element.y + element.height / 2;
      const notch = Math.min(element.width * 0.35, element.height * 0.5);
      ctx.moveTo(element.x, element.y);
      ctx.lineTo(element.x + element.width - notch, element.y);
      ctx.lineTo(element.x + element.width, mid);
      ctx.lineTo(element.x + element.width - notch, element.y + element.height);
      ctx.lineTo(element.x, element.y + element.height);
      ctx.lineTo(element.x + notch, mid);
    } else if (shape.kind === "diamond") {
      const cx = element.x + element.width / 2;
      const cy = element.y + element.height / 2;
      ctx.moveTo(cx, element.y);
      ctx.lineTo(element.x + element.width, cy);
      ctx.lineTo(cx, element.y + element.height);
      ctx.lineTo(element.x, cy);
    } else {
      // flat-top hexagon
      const x0 = element.x;
      const y0 = element.y;
      const w = element.width;
      const h = element.height;
      const inset = w * 0.25;
      ctx.moveTo(x0 + inset, y0);
      ctx.lineTo(x0 + w - inset, y0);
      ctx.lineTo(x0 + w, y0 + h / 2);
      ctx.lineTo(x0 + w - inset, y0 + h);
      ctx.lineTo(x0 + inset, y0 + h);
      ctx.lineTo(x0, y0 + h / 2);
    }
    ctx.closePath();
    if (fill && fill !== "none" && fill !== "transparent") {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    const triStroke = token(shape.stroke || shape.strokeColor, tokens);
    if (triStroke && triStroke !== "none" && shape.strokeWidth) {
      ctx.strokeStyle = triStroke;
      ctx.lineWidth = Number(shape.strokeWidth);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  if (shape.shadow && typeof shape.shadow === "object") {
    const sh = shape.shadow;
    ctx.save();
    ctx.shadowColor = String(sh.color || "#0F172A");
    ctx.shadowBlur = Number(sh.blur) || 24;
    ctx.shadowOffsetY = Number(sh.offset) || 8;
    ctx.globalAlpha *= sh.opacity != null ? Number(sh.opacity) : 0.12;
    ctx.fillStyle = fill !== "none" ? fill : "#FFFFFF";
    tracePreset(ctx, element, { kind: shape.kind === "circle" || shape.kind === "ellipse" ? "ellipse" : "rect", cornerRadius: radius });
    ctx.fill();
    ctx.restore();
  }
  tracePreset(ctx, element, {
    kind: shape.kind === "circle" || shape.kind === "ellipse" ? "ellipse" : "rect",
    cornerRadius: radius,
  });
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
    if (element.type === "table") {
      paintTable(ctx, element, deck.tokens);
      return;
    }
    if (element.type === "chart") {
      paintChart(ctx, element, deck.tokens);
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
  if (
    element.type !== "shape" &&
    element.type !== "text" &&
    element.type !== "image" &&
    element.type !== "maskedImage" &&
    element.type !== "table" &&
    element.type !== "chart" &&
    element.type !== "primitive"
  ) {
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
