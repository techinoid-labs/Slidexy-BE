/**
 * Public catalog of decks published from the admin curator.
 * The download builds a native PPTX: text, shapes, and pictures stay separate objects.
 */

const fs = require("fs");
const path = require("path");
const { createCanvas, Image } = require("canvas");
const PptxGenJS = require("pptxgenjs");

const ROOT = path.join(__dirname, "..", "..");
const PUBLISHED = path.join(ROOT, "app-library", "published");
const GENERATED = path.join(ROOT, "generated-templates");
const SLIDE_W = 13.333;
const SLIDE_H = 7.5;
const CANVAS_W = 1600;
const CANVAS_H = 900;

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function assertId(id) {
  const value = decodeURIComponent(String(id || ""));
  if (!/^[a-z0-9-]+$/.test(value)) throw fail(400, "Unknown deck");
  return value;
}

function deckFile(id) {
  const file = path.join(PUBLISHED, assertId(id) + ".json");
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) throw fail(404, "Deck not found");
  return file;
}

function readDeck(id) {
  return JSON.parse(fs.readFileSync(deckFile(id), "utf8"));
}

function slideNames(id) {
  const dir = path.join(PUBLISHED, assertId(id));
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return [];
  return fs.readdirSync(dir)
    .filter((name) => /^slide-\d{2}\.png$/.test(name))
    .sort();
}

function slideFile(id, name) {
  const safe = String(name || "");
  if (!/^slide-\d{2}\.png$/.test(safe)) throw fail(400, "Unknown slide");
  const file = path.join(PUBLISHED, assertId(id), safe);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) throw fail(404, "Slide not found");
  return file;
}

function listCatalog() {
  if (!fs.existsSync(PUBLISHED)) return [];
  return fs.readdirSync(PUBLISHED)
    .filter((name) => name.endsWith(".json") && fs.statSync(path.join(PUBLISHED, name)).isFile())
    .map((name) => {
      const id = name.replace(/\.json$/, "");
      let deck = {};
      try {
        deck = JSON.parse(fs.readFileSync(path.join(PUBLISHED, name), "utf8"));
      } catch (error) {
        deck = {};
      }
      const cover = slideNames(id).find((slide) => slide === "slide-01.png") || slideNames(id)[0] || "";
      return {
        id,
        name: deck.name || id,
        description: deck.description || "",
        thumbnailUrl: cover ? "/api/catalog/" + id + "/slides/" + cover : "",
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function readCatalog(id) {
  const deck = readDeck(id);
  const slides = slideNames(id).map((name) => ({
    name,
    url: "/api/catalog/" + assertId(id) + "/slides/" + name,
  }));
  return { deck, slides };
}

async function buildPptx(id) {
  const safe = assertId(id);
  const deck = readDeck(safe);
  const sequence = deck.layoutSequence || Object.keys(deck.layouts || {});
  if (!sequence.length) throw fail(404, "This deck has no slides");
  const pptx = new PptxGenJS();
  pptx.title = deck.name || safe;
  pptx.defineLayout({ name: "WIDE", width: SLIDE_W, height: SLIDE_H });
  pptx.layout = "WIDE";
  const background = hexColor((deck.tokens && deck.tokens.color && deck.tokens.color.bg) || (deck.theme && deck.theme.backgroundColor)) || "F4F0E8";
  sequence.forEach((layoutId) => {
    const layout = deck.layouts && deck.layouts[layoutId];
    const slide = pptx.addSlide();
    slide.background = { color: background };
    const items = flattenElements(layout && layout.elements);
    items.forEach((item) => placeElement(slide, pptx, item.element, deck, safe, item.rotate));
  });
  const data = await pptx.write({ outputType: "nodebuffer" });
  return {
    filename: safe + ".pptx",
    buffer: Buffer.from(data),
  };
}

function inches(px, axis) {
  const size = axis === "x" ? SLIDE_W / CANVAS_W : SLIDE_H / CANVAS_H;
  return (Number(px) || 0) * size;
}

function points(px) {
  return Math.max(1, Math.round((Number(px) || 16) * 72 * SLIDE_W / CANVAS_W));
}

function hexColor(value) {
  const text = String(value || "").trim();
  const token = text.match(/^\{color\.([a-z0-9]+)\}$/i);
  return /^#[0-9a-f]{6}$/i.test(text) ? text.slice(1).toUpperCase() : (token ? "" : "");
}

function colorOf(value, tokens) {
  const text = String(value || "").trim();
  const token = text.match(/^\{color\.([a-z0-9]+)\}$/i);
  if (token) return hexColor(tokens && tokens.color && tokens.color[token[1]]);
  return hexColor(text);
}

function fontOf(value, tokens) {
  const text = String(value || "").trim();
  const token = text.match(/^\{font\.([a-z0-9]+)\}$/i);
  if (token) return String((tokens && tokens.font && tokens.font[token[1]]) || "Arial");
  return text || "Arial";
}

function boxOf(element) {
  return {
    x: inches(element.x, "x"),
    y: inches(element.y, "y"),
    w: Math.max(0.05, inches(element.width, "x")),
    h: Math.max(0.05, inches(element.height, "y")),
  };
}

function flattenElements(elements) {
  const list = [];
  (elements || []).forEach((element) => {
    if (!element) return;
    if (element.type === "rotated" && element.element) {
      list.push({ element: element.element, rotate: Number(element.degrees) || 0, z: Number(element.zIndex) || 0 });
      return;
    }
    list.push({ element, rotate: 0, z: Number(element.zIndex) || 0 });
    if (Array.isArray(element.children)) list.push.apply(list, flattenElements(element.children));
  });
  list.sort((a, b) => a.z - b.z);
  return list;
}

function imageFile(deckId, url) {
  const rel = String(url || "").replace(/\\/g, "/");
  if (!rel || rel.indexOf("://") >= 0) return "";
  if (rel.startsWith("assets/decorations/")) {
    const file = path.resolve(ROOT, rel);
    const root = path.resolve(ROOT, "assets", "decorations");
    const relative = path.relative(root, file);
    if (!relative.startsWith("..") && !path.isAbsolute(relative) && fs.existsSync(file) && fs.statSync(file).isFile()) return file;
    return "";
  }
  const candidates = [
    path.resolve(PUBLISHED, deckId, rel),
    path.resolve(GENERATED, rel),
  ];
  const roots = [path.resolve(PUBLISHED, deckId), path.resolve(GENERATED)];
  for (let index = 0; index < candidates.length; index += 1) {
    const file = candidates[index];
    const relative = path.relative(roots[index], file);
    if (relative.startsWith("..") || path.isAbsolute(relative)) continue;
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  }
  return "";
}

function placeElement(slide, pptx, element, deck, deckId, rotate) {
  if (element.type === "text" || element.type === "textMaskedImage") addText(slide, element, deck.tokens, rotate);
  else if (element.type === "shape") addShape(slide, pptx, element, deck.tokens);
  else if (element.type === "image") addPicture(slide, element, element.imageContent || {}, deckId, rotate);
  else if (element.type === "maskedImage") addPicture(slide, element, element.maskedImageContent || {}, deckId, rotate);
  else if (element.type === "collage") addCollage(slide, element, deckId);
  else if (element.type === "illustration") addIllustration(slide, element, deck.tokens);
}

function addText(slide, element, tokens, rotate) {
  const style = element.textStyle || {};
  const spans = (element.textContent && element.textContent.spans) || [];
  const runs = [];
  spans.forEach((span) => {
    const text = String(span && span.text != null ? span.text : "");
    if (!text) return;
    const weight = span.fontWeight == null ? style.fontWeight : span.fontWeight;
    runs.push({
      text,
      options: {
        fontFace: fontOf(span.fontFamily || style.fontFamily, tokens),
        fontSize: points(span.fontSize || style.fontSize || 18),
        color: colorOf(span.color || style.color, tokens) || "1A1612",
        bold: Number(weight) >= 600,
      },
    });
  });
  if (!runs.length) return;
  slide.addText(runs, Object.assign(boxOf(element), {
    align: style.textAlign || "left",
    valign: "top",
    margin: 0,
    wrap: true,
    rotate: rotate || 0,
    fontFace: fontOf(style.fontFamily, tokens),
    fontSize: points(style.fontSize || 18),
    color: colorOf(style.color, tokens) || "1A1612",
  }));
}

function addShape(slide, pptx, element, tokens) {
  const shape = element.shapeContent || {};
  const fill = colorOf(shape.fill, tokens);
  const stroke = colorOf(shape.stroke || shape.strokeColor, tokens);
  const radius = Number(shape.cornerRadius) || 0;
  const options = boxOf(element);
  let kind = pptx.ShapeType.rect;
  if (shape.kind === "circle" || shape.kind === "ellipse") kind = pptx.ShapeType.ellipse;
  else if (radius > 0) {
    kind = pptx.ShapeType.roundRect;
    const minSide = Math.min(Number(element.width) || 1, Number(element.height) || 1);
    options.rectRadius = Math.max(0, Math.min(1, (radius * 2) / minSide));
  }
  if (fill) options.fill = { color: fill };
  else options.fill = { type: "none" };
  if (stroke && Number(shape.strokeWidth) > 0) options.line = { color: stroke, width: points(shape.strokeWidth) };
  slide.addShape(kind, options);
}

function addPicture(slide, element, content, deckId, rotate) {
  const file = imageFile(deckId, content && content.url);
  if (!file) return;
  const clip = (content && content.clip) || {};
  const box = boxOf(element);
  if (clip.kind === "ellipse") {
    slide.addImage(Object.assign({ path: file, rounding: true, rotate: rotate || 0 }, box, coverSizing(box)));
    return;
  }
  if (clip.kind === "arch" || (clip.kind === "rect" && Number(clip.cornerRadius) > 0)) {
    const png = maskedImage(file, element, clip, content);
    if (!png) return;
    slide.addImage(Object.assign({ data: "image/png;base64," + png.toString("base64"), rotate: rotate || 0 }, box));
    return;
  }
  slide.addImage(Object.assign({ path: file, rotate: rotate || 0 }, box, coverSizing(box)));
}

function coverSizing(box) {
  return { sizing: { type: "cover", x: 0, y: 0, w: box.w, h: box.h } };
}

function addCollage(slide, element, deckId) {
  const cells = (element.collageContent && element.collageContent.cells) || [];
  cells.forEach((cell) => {
    addPicture(slide, {
      x: (Number(element.x) || 0) + (Number(cell.x) || 0),
      y: (Number(element.y) || 0) + (Number(cell.y) || 0),
      width: cell.width,
      height: cell.height,
    }, cell, deckId, 0);
  });
}

function addIllustration(slide, element, tokens) {
  const png = illustrationPng(element, tokens);
  if (!png) return;
  slide.addImage(Object.assign({ data: "image/png;base64," + png.toString("base64") }, boxOf(element)));
}

function loadImage(file) {
  const image = new Image();
  image.src = fs.readFileSync(file);
  return image;
}

function coverDraw(ctx, image, width, height, content) {
  const iw = image.naturalWidth || image.width;
  const ih = image.naturalHeight || image.height;
  if (!iw || !ih) return;
  const fit = content && content.fit;
  if (fit === "contain") {
    const scale = Math.min(width / iw, height / ih);
    const w = iw * scale;
    const h = ih * scale;
    ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
    return;
  }
  const scale = Math.max(width / iw, height / ih);
  const sw = width / scale;
  const sh = height / scale;
  const sx = Math.max(0, (iw - sw) / 2);
  const sy = Math.max(0, (ih - sh) / 2);
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
}

function clipShape(ctx, width, height, clip) {
  ctx.beginPath();
  if (clip.kind === "arch") {
    ctx.moveTo(0, height);
    ctx.lineTo(0, height * 0.38);
    ctx.quadraticCurveTo(width / 2, 0, width, height * 0.38);
    ctx.lineTo(width, height);
    ctx.closePath();
    return;
  }
  const radius = Math.max(0, Math.min(Number(clip.cornerRadius) || 0, width / 2, height / 2));
  if (!radius) {
    ctx.rect(0, 0, width, height);
    return;
  }
  ctx.moveTo(radius, 0);
  ctx.arcTo(width, 0, width, height, radius);
  ctx.arcTo(width, height, 0, height, radius);
  ctx.arcTo(0, height, 0, 0, radius);
  ctx.arcTo(0, 0, width, 0, radius);
  ctx.closePath();
}

function maskedImage(file, element, clip, content) {
  const width = Math.max(1, Math.round(Number(element.width) || 1));
  const height = Math.max(1, Math.round(Number(element.height) || 1));
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.save();
  clipShape(ctx, width, height, clip);
  ctx.clip();
  coverDraw(ctx, loadImage(file), width, height, content);
  ctx.restore();
  return canvas.toBuffer("image/png");
}

function pathTokens(d) {
  return String(d || "").match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || [];
}

function illustrationPng(element, tokens) {
  const body = element.illustrationContent || {};
  if (!body.d) return null;
  const view = String(body.viewBox || "0 0 100 100").trim().split(/[\s,]+/).map(Number);
  if (view.length < 4 || view.some((item) => !Number.isFinite(item))) return null;
  const width = Math.max(1, Math.round(Number(element.width) || 1));
  const height = Math.max(1, Math.round(Number(element.height) || 1));
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const scale = Math.min(width / view[2], height / view[3]);
  const drawnW = view[2] * scale;
  const drawnH = view[3] * scale;
  ctx.translate((width - drawnW) / 2, (height - drawnH) / 2);
  ctx.scale(scale, scale);
  ctx.translate(-view[0], -view[1]);
  if (!tracePath(ctx, body.d)) return null;
  const fill = colorOf(body.fill, tokens);
  const stroke = colorOf(body.stroke, tokens);
  if (fill && body.fill !== "none") {
    ctx.fillStyle = "#" + fill;
    ctx.fill();
  }
  if (stroke && body.stroke !== "none" && Number(body.strokeWidth) > 0) {
    ctx.strokeStyle = "#" + stroke;
    ctx.lineWidth = Number(body.strokeWidth);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  }
  return canvas.toBuffer("image/png");
}

function tracePath(ctx, d) {
  const tokens = pathTokens(d);
  let index = 0;
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let cmd = "";
  const num = () => Number(tokens[index += 1] && tokens[index - 1]);
  ctx.beginPath();
  while (index < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[index])) cmd = tokens[index++];
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

module.exports = { listCatalog, readCatalog, slideFile, buildPptx };
