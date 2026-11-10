/**
 * Public catalog of decks published from the admin curator.
 * The download builds a native PPTX: text, shapes, and pictures stay separate objects.
 */

const fs = require("fs");
const path = require("path");
const { createCanvas, Image } = require("canvas");
const JSZip = require("jszip");
const PptxGenJS = require("pptxgenjs");
const { applyMotionOoxml, ENTRANCE_TEMPLATES } = require("./motionOoxml");

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

async function pptxBuffer(deck, deckId) {
  const sequence = deck.layoutSequence || Object.keys(deck.layouts || {});
  if (!sequence.length) throw fail(404, "This deck has no slides");
  const pptx = new PptxGenJS();
  pptx.title = deck.name || deckId || "deck";
  pptx.defineLayout({ name: "WIDE", width: SLIDE_W, height: SLIDE_H });
  pptx.layout = "WIDE";
  // Solid hex backgrounds only — never textured bg images (PPTX-friendly).
  const background = hexColor((deck.tokens && deck.tokens.color && deck.tokens.color.bg) || (deck.theme && deck.theme.backgroundColor)) || "F4F0E8";
  sequence.forEach((layoutId) => {
    const layout = deck.layouts && deck.layouts[layoutId];
    const slide = pptx.addSlide();
    slide.background = { color: background };
    const items = flattenElements(layout && layout.elements);
    items.forEach((item) => placeElement(slide, pptx, item.element, deck, deckId, item.rotate));
  });
  let buffer = Buffer.from(await pptx.write({ outputType: "nodebuffer" }));
  buffer = await applyNativePictureMasks(buffer);
  buffer = await groupNamedElements(buffer);
  buffer = await applyMotionOoxml(buffer, deck);
  return buffer;
}

async function buildPptx(id) {
  const safe = assertId(id);
  const deck = readDeck(safe);
  return {
    filename: safe + ".pptx",
    buffer: await pptxBuffer(deck, safe),
  };
}

async function exportDeckPptx(deck, file) {
  // Fail-fast schema gate before writing PPTX
  try {
    const { assertEngineSchemas } = require("../../engine/validateSchema");
    assertEngineSchemas();
  } catch (err) {
    if (err && err.name === "SchemaValidationError") throw err;
    // validateSchema may be TS-transpiled via require in scripts; rethrow always
    throw err;
  }
  const raw = await pptxBuffer(deck, (deck && deck.id) || "native");
  const data = await paintGradientFills(raw);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
  return file;
}

function gradientName(gradient) {
  const angle = Math.round(Number(gradient.angle) || 0);
  const parts = (gradient.stops || []).map((stop) => {
    const hex = String(stop.hex || stop.color || "").replace("#", "").toUpperCase();
    const pos = Math.round(Number(stop.pos) * 100);
    return hex + "-" + pos;
  });
  return "ngrad-" + angle + "-" + parts.join("-");
}

function parseGradientName(name) {
  const bits = String(name || "").split("-");
  if (bits[0] !== "ngrad" || bits.length < 4) return null;
  const stops = [];
  for (let index = 2; index + 1 < bits.length; index += 2) {
    const hex = bits[index];
    if (!/^[0-9A-F]{6}$/.test(hex)) return null;
    stops.push({ hex, pos: Number(bits[index + 1]) / 100 });
  }
  if (stops.length < 2) return null;
  return { angle: Number(bits[1]) || 0, stops };
}

function gradientXml(spec) {
  const stops = spec.stops.map((stop) => {
    const pos = Math.max(0, Math.min(100000, Math.round(stop.pos * 100000)));
    return `<a:gs pos="${pos}"><a:srgbClr val="${stop.hex}"/></a:gs>`;
  }).join("");
  let ang = Math.round((Number(spec.angle) || 0) * 60000);
  ang = ((ang % 21600000) + 21600000) % 21600000;
  return `<a:gradFill rotWithShape="1"><a:gsLst>${stops}</a:gsLst><a:lin ang="${ang}" scaled="1"/></a:gradFill>`;
}

function replaceShapeFill(block) {
  const found = block.match(/name="(ngrad-[^"]+)"/);
  if (!found) return block;
  const spec = parseGradientName(found[1]);
  if (!spec) return block;
  const paint = gradientXml(spec);
  const lineAt = block.indexOf("<a:ln");
  const fillAt = block.indexOf("<a:solidFill>");
  if (fillAt >= 0 && (lineAt < 0 || fillAt < lineAt)) {
    return block.replace(/<a:solidFill>[\s\S]*?<\/a:solidFill>/, paint);
  }
  if (lineAt >= 0) return block.slice(0, lineAt) + paint + block.slice(lineAt);
  return block.replace("</p:spPr>", paint + "</p:spPr>");
}

async function paintGradientFills(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const names = Object.keys(zip.files).filter((name) => /ppt\/slides\/slide\d+\.xml$/.test(name));
  let changed = false;
  for (let index = 0; index < names.length; index += 1) {
    const name = names[index];
    const xml = await zip.file(name).async("string");
    if (xml.indexOf("ngrad-") < 0) continue;
    const next = xml.replace(/<p:sp\b[\s\S]*?<\/p:sp>/g, replaceShapeFill);
    if (next !== xml) {
      zip.file(name, next);
      changed = true;
    }
  }
  if (!changed) return buffer;
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

function inches(px, axis) {
  const size = axis === "x" ? SLIDE_W / CANVAS_W : SLIDE_H / CANVAS_H;
  return (Number(px) || 0) * size;
}

/** Engine canvas px → PowerPoint font points (for fontSize). */
function points(px) {
  const n = Number(px);
  const value = Number.isFinite(n) ? n : 16;
  return Math.max(1, Math.round(value * 72 * SLIDE_W / CANVAS_W));
}

/** Engine canvas px → PPT char spacing (points). Allows 0 and negative tracking. */
function trackingPoints(px) {
  const n = Number(px);
  if (!Number.isFinite(n) || n === 0) return 0;
  return Math.round(n * 72 * SLIDE_W / CANVAS_W * 100) / 100;
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

/** PPTX-safe face map — bundled preview fonts often aren't installed in Office. */
const PPTX_FONT_FALLBACKS = {
  "Archivo Black": "Arial Black",
  Inter: "Segoe UI",
  "Playfair Display": "Georgia",
  Lora: "Georgia",
  "Space Grotesk": "Bahnschrift",
  Nunito: "Candara",
  Poppins: "Candara",
  "Open Sans": "Calibri",
  Orbitron: "Impact",
  Fraunces: "Georgia",
  Manrope: "Arial",
  Syne: "Arial Black",
  "DM Serif Display": "Georgia",
  "Instrument Serif": "Georgia",
  "Poppins Bold": "Segoe UI Black",
  Antonio: "Arial Narrow",
  "IBM Plex Mono": "Consolas",
  "IBM Plex Sans": "Arial",
  Fraunces: "Georgia",
};

function fontOf(value, tokens) {
  const text = String(value || "").trim();
  const token = text.match(/^\{font\.([a-z0-9]+)\}$/i);
  const resolved = token
    ? String((tokens && tokens.font && tokens.font[token[1]]) || "Arial")
    : text || "Arial";
  return PPTX_FONT_FALLBACKS[resolved] || resolved;
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
  if (rel.startsWith("assets/cache/")) {
    const file = path.resolve(ROOT, rel);
    const root = path.resolve(ROOT, "assets", "cache");
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
  else if (element.type === "table") addTable(slide, element, deck.tokens);
  else if (element.type === "chart") addChart(slide, pptx, element, deck.tokens);
  else if (element.type === "image") addPicture(slide, element, element.imageContent || {}, deckId, rotate);
  else if (element.type === "smartAsset") {
    // Prefer pre-resolved imageContent from render.ts; otherwise attempt inline data URI / path
    const content = element.imageContent || {};
    if (content.url || content.data) {
      addPicture(slide, Object.assign({}, element, { type: "image" }), content, deckId, rotate);
    } else if (content.dataUri && String(content.dataUri).indexOf("base64,") >= 0) {
      const box = boxOf(element);
      const raw = String(content.dataUri);
      const payload = raw.indexOf("base64,") >= 0 ? raw.slice(raw.indexOf("base64,") + 7) : raw;
      slide.addImage(Object.assign({ data: "image/png;base64," + payload }, box));
    }
  }
  else if (element.type === "maskedImage") addPicture(slide, element, element.maskedImageContent || {}, deckId, rotate);
  else if (element.type === "collage") addCollage(slide, element, deckId);
  else if (element.type === "illustration") addIllustration(slide, element, deck.tokens);
}

/**
 * Max value the chart axis must cover so stacked / multi-series data
 * never paints outside the element bounding box.
 */
function chartAxisCeiling(kind, series, labelCount) {
  const rows = Array.isArray(series) ? series : [];
  const n = Math.max(1, Number(labelCount) || 1);
  const stacked = kind.indexOf("stack") >= 0 || kind === "stackedbar" || kind === "stacked";
  if (stacked) {
    let maxStack = 0;
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let s = 0; s < rows.length; s++) {
        const vals = (rows[s] && rows[s].values) || [];
        sum += Number(vals[i]) || 0;
      }
      if (sum > maxStack) maxStack = sum;
    }
    return maxStack > 0 ? maxStack * 1.08 : 1;
  }
  let maxV = 0;
  rows.forEach((row) => {
    (Array.isArray(row && row.values) ? row.values : []).forEach((v) => {
      const n = Number(v) || 0;
      if (n > maxV) maxV = n;
    });
  });
  return maxV > 0 ? maxV * 1.08 : 1;
}

/**
 * Native editable PPTX charts (donut / line / stackedBar).
 * PowerPoint: right-click → Edit Data.
 * Charts must stay inside the element box — axis max scales to data.
 */
function addChart(slide, pptx, element, tokens) {
  const content = element.chartContent || {};
  const kind = String(content.chartType || content.type || "line").toLowerCase();
  const labels = Array.isArray(content.labels) ? content.labels.map(String) : [];
  const series = Array.isArray(content.series) ? content.series : [];
  if (!labels.length || !series.length) return;

  let chartType = pptx.ChartType.line;
  if (kind === "donut" || kind === "doughnut") chartType = pptx.ChartType.doughnut;
  else if (kind === "stackedbar" || kind === "stacked" || kind === "bar") chartType = pptx.ChartType.bar;
  else chartType = pptx.ChartType.line;

  const accent = colorOf(content.color || (tokens && tokens.color && tokens.color.accent), tokens) || "1D4ED8";
  const ink = colorOf(content.ink || (tokens && tokens.color && tokens.color.ink), tokens) || "152238";
  const muted = colorOf(content.muted || (tokens && tokens.color && tokens.color.muted), tokens) || "4C5B70";
  const palette = Array.isArray(content.colors)
    ? content.colors.map((c) => colorOf(c, tokens) || accent)
    : [accent, muted, ink, "0F8A7A", "C45C26"];

  const data = series.map((s, i) => ({
    name: String((s && s.name) || "Series " + (i + 1)),
    labels,
    values: Array.isArray(s && s.values) ? s.values.map((v) => Number(v) || 0) : [],
  }));

  // Inset slightly so axis/legend never spill into neighboring title chrome
  const box = boxOf(element);
  const inset = 0.02;
  const options = {
    x: box.x + box.w * inset * 0.25,
    y: box.y + box.h * inset * 0.5,
    w: box.w * (1 - inset * 0.5),
    h: box.h * (1 - inset),
    showTitle: false,
    showLegend: content.showLegend !== false,
    legendPos: content.legendPos || "b",
    chartColors: palette,
    chartData: true,
    color: ink,
    showValue: false,
  };

  if (chartType === pptx.ChartType.doughnut) {
    options.holeSize = content.holeSize != null ? Number(content.holeSize) : 50;
    options.showPercent = content.showPercent !== false;
    options.showValue = false;
  } else if (chartType === pptx.ChartType.bar) {
    options.barGrouping = kind.indexOf("stack") >= 0 || kind === "stackedbar" ? "stacked" : "clustered";
    options.barGapWidthPct = 40;
    // Strict fit: axis ceiling = stacked column max (never break container)
    const ceiling = chartAxisCeiling(kind, data, labels.length);
    options.valAxisMinValue = 0;
    options.valAxisMaxValue = ceiling;
    options.valAxisHidden = false;
    options.catAxisHidden = false;
  } else {
    options.lineDataSymbol = "circle";
    options.lineDataSymbolSize = 8;
    const ceiling = chartAxisCeiling(kind, data, labels.length);
    options.valAxisMinValue = 0;
    options.valAxisMaxValue = ceiling;
  }

  const objectName = groupObjectName(element);
  if (objectName) options.objectName = objectName;
  slide.addChart(chartType, data, options);
}

/** Native PPTX table for data-dense report kits (4×4 / 5×5). */
function addTable(slide, element, tokens) {
  const content = element.tableContent || {};
  const rows = Array.isArray(content.rows) ? content.rows : [];
  if (!rows.length) return;
  const fontFace = fontOf(content.fontFamily, tokens) || "Calibri";
  const fontSize = points(content.fontSize || 14);
  const color = colorOf(content.color, tokens) || "1A1612";
  const headerFill = colorOf(content.headerFill, tokens) || "F4F7FB";
  const headerColor = colorOf(content.headerColor, tokens) || color;
  const borderColor = colorOf(content.borderColor, tokens) || "D0D7E2";
  const pad = Number(content.cellPadding) >= 0 ? Number(content.cellPadding) : 4;
  const verticalBorders = content.verticalBorders === true;
  const horizontalBorders = content.horizontalBorders !== false;
  const altRow = content.altRowFill ? String(content.altRowFill).replace(/^#/, "").toUpperCase() : "";
  const edge = (side) => {
    if (side === "left" || side === "right") {
      return verticalBorders ? { pt: 0.5, color: borderColor } : { pt: 0, color: borderColor };
    }
    return horizontalBorders ? { pt: 0.5, color: borderColor } : { pt: 0, color: borderColor };
  };
  const tableRows = rows.map((row, rowIndex) => {
    const cells = (Array.isArray(row) ? row : [row]).map((cell) => {
      const text = cell && typeof cell === "object" ? String(cell.text != null ? cell.text : "") : String(cell != null ? cell : "");
      const isHeader = rowIndex === 0;
      const rowFill = isHeader
        ? headerFill
        : altRow && rowIndex % 2 === 0
          ? altRow
          : "FFFFFF";
      return {
        text: text || " ",
        options: {
          fontFace,
          fontSize,
          color: isHeader ? headerColor : color,
          bold: isHeader || !!(cell && cell.bold),
          align: content.align || "left",
          valign: "middle",
          fill: { color: rowFill },
          margin: [pad * 0.4, pad, pad * 0.4, pad],
          border: [edge("top"), edge("right"), edge("bottom"), edge("left")],
        },
      };
    });
    return cells;
  });
  const options = Object.assign(boxOf(element), {
    colW: undefined,
    border: [{ pt: 0.5, color: borderColor }],
    fontFace,
    fontSize,
    color,
  });
  const cols = Math.max.apply(
    null,
    tableRows.map((r) => r.length).concat([1])
  );
  const totalW = options.w;
  options.colW = Array.from({ length: cols }, () => totalW / cols);
  const objectName = groupObjectName(element);
  if (objectName) options.objectName = objectName;
  slide.addTable(tableRows, options);
}

function groupObjectName(element, maskTag) {
  const parts = [];
  // !!morph:id forces PowerPoint Morph object matching across keyframes
  if (element && element.morphId) {
    parts.push("!!morph:" + String(element.morphId));
  } else if (element && element.pptxGroup) {
    parts.push("grp:" + String(element.pptxGroup) + ":" + String(element.id || "el"));
  }
  if (element && (element.shapeTreatment === "depth" || (element.shapeContent && element.shapeContent.depth))) {
    parts.push("depth:1");
  }
  if (maskTag) parts.push(maskTag);
  return parts.length ? parts.join("|") : undefined;
}

/** Encode native Crop-to-Shape hint for OOXML post-process. */
function pictureMaskTag(clip, element) {
  if (!clip || !clip.kind) return "";
  if (clip.kind === "ellipse" || clip.kind === "circle") return "mask:ellipse";
  // Pill = stadium (fully rounded ends). Arch = soft editorial roundRect.
  if (clip.kind === "pill") return "mask:roundRect:50000";
  if (clip.kind === "arch") {
    const adj = Number(clip.cornerRadius) > 0
      ? Math.max(12000, Math.min(40000, Math.round(Number(clip.cornerRadius))))
      : 28000;
    return "mask:arch:" + adj;
  }
  if (clip.kind === "rect" && Number(clip.cornerRadius) > 0) {
    const w = Math.max(1, Number(element && element.width) || 1);
    const h = Math.max(1, Number(element && element.height) || 1);
    const r = Number(clip.cornerRadius) || 24;
    // OOXML roundRect adj: 0–50000 (half-side = 50000). Map px radius → adj.
    const adj = Math.max(500, Math.min(50000, Math.round((r / Math.min(w, h)) * 100000)));
    return "mask:roundRect:" + adj;
  }
  return "";
}

function shadeHexPptx(hex, amount) {
  const raw = String(hex || "000000").replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return raw || "000000";
  const n = parseInt(raw, 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (n & 255) + amount));
  return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function buildTextRuns(element, tokens, forceColor) {
  const style = element.textStyle || {};
  const spans = (element.textContent && element.textContent.spans) || [];
  const accentHex = colorOf(tokens && tokens.color && tokens.color.accent, tokens) || "1D4ED8";
  const runs = [];
  spans.forEach((span) => {
    const raw = String(span && span.text != null ? span.text : "");
    if (!raw) return;
    const weight = span.fontWeight == null ? style.fontWeight : span.fontWeight;
    const spacing = Number(span.letterSpacing != null ? span.letterSpacing : style.letterSpacing) || 0;
    const parts = raw.split("\n");
    parts.forEach((part, partIndex) => {
      const text = part.length ? part : " ";
      const highlighted = !!(span && (span.highlight || span.typeTreatment === "highlight"));
      const runOptions = {
        fontFace: fontOf(span.fontFamily || style.fontFamily, tokens),
        fontSize: points(span.fontSize || style.fontSize || 18),
        color: forceColor
          ? forceColor
          : highlighted
            ? accentHex
            : colorOf(span.color || style.color, tokens) || "1A1612",
        bold: highlighted || Number(weight) >= 600,
      };
      if (spacing) runOptions.charSpacing = trackingPoints(spacing);
      const opacity = Number(element.opacity);
      if (Number.isFinite(opacity) && opacity > 0 && opacity < 1) {
        runOptions.transparency = Math.round((1 - opacity) * 100);
      }
      if (partIndex < parts.length - 1) runOptions.breakLine = true;
      runs.push({ text, options: runOptions });
    });
  });
  return runs;
}

function addText(slide, element, tokens, rotate) {
  const style = element.textStyle || {};
  const treatment = String(style.typeTreatment || "solid");
  const baseColor = colorOf(style.color, tokens) || "1A1612";
  const runs = buildTextRuns(element, tokens);
  if (!runs.length) return;

  const makeOptions = (dxEngine, dyEngine, objectSuffix) => {
    const box = boxOf(element);
    // Position offsets must stay in inches — never reuse points() (font-size units).
    const options = Object.assign({}, box, {
      x: box.x + inches(dxEngine || 0, "x"),
      y: box.y + inches(dyEngine || 0, "y"),
      align: style.textAlign || "left",
      valign: style.verticalAlign === "middle" ? "middle" : "top",
      margin: 0,
      wrap: true,
      rotate: rotate || 0,
      fontFace: fontOf(style.fontFamily, tokens),
      fontSize: points(style.fontSize || 18),
      color: baseColor,
    });
    const objectName = groupObjectName(element);
    if (objectName) options.objectName = objectName + (objectSuffix || "");
    const lineHeight = Number(style.lineHeight);
    if (Number.isFinite(lineHeight) && lineHeight >= 1) {
      options.lineSpacingMultiple = lineHeight;
    }
    return options;
  };

  // Fake depth with editable layered text (keeps PPTX native, not text-as-image).
  // Only for short single-line titles — multi-line / long copy stays flat (engine already guards).
  const plain = runs.map((r) => r.text).join("").replace(/\s+/g, " ").trim();
  const allowDepth =
    (treatment === "offset-3d" || treatment === "long-shadow") &&
    plain.length <= 14 &&
    !/\n/.test(runs.map((r) => r.text).join("\n"));
  if (allowDepth) {
    const steps =
      treatment === "long-shadow"
        ? Math.min(10, Math.ceil((Number(style.shadowLength) || 48) / (Number(style.shadowStep) || 6)))
        : Math.max(3, Math.min(8, Number(style.offsetSteps) || 6));
    const dx = treatment === "long-shadow" ? 0.7 * (Number(style.shadowStep) || 6) : Number(style.offsetX) || 6;
    const dy = treatment === "long-shadow" ? 0.7 * (Number(style.shadowStep) || 6) : Number(style.offsetY) || 6;
    for (let i = steps; i >= 1; i--) {
      // Near-black faces use pure black extrusion so the stack reads chunky, not muddy.
      const n = parseInt(String(baseColor).replace("#", ""), 16);
      const lum = Number.isFinite(n) ? (((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255)) / 3 : 0;
      const shade = lum < 60 ? "000000" : shadeHexPptx(baseColor, -24 - i * 12);
      const layerRuns = buildTextRuns(element, tokens, shade);
      // Same box origin as the face — layers share alignment (left/center/right).
      slide.addText(layerRuns, makeOptions(dx * i, dy * i, ":depth" + i));
    }
  }

  // Always native editable text runs — never outlines or text-as-image.
  slide.addText(runs, makeOptions(0, 0, ""));
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
  const objectName = groupObjectName(element);
  const gradient = shape.gradient && Array.isArray(shape.gradient.stops) ? shape.gradient : null;
  if (gradient && gradient.stops.length > 1) {
    // Prefer solid fills for non-designer PPTX; keep gradient name only if already present.
    const first = colorOf(gradient.stops[0].hex || gradient.stops[0].color, tokens) || fill;
    options.fill = { color: first || "000000" };
    options.objectName = gradientName(gradient);
  } else if (fill) {
    options.fill = { color: fill };
    // Solid overlays at 60–80% for overlap plates — never frosted glass / blur.
    const opacity = Number(element.opacity);
    if (Number.isFinite(opacity) && opacity >= 0 && opacity < 1) {
      options.fill.transparency = Math.round((1 - opacity) * 100);
    }
  } else options.fill = { type: "none" };
  if (objectName && !options.objectName) options.objectName = objectName;
  if (stroke && Number(shape.strokeWidth) > 0) options.line = { color: stroke, width: points(shape.strokeWidth) };
  // Floating 3D cards / global card_shadow token
  const shadow = shape.shadow || (element.card ? shape.shadow : null);
  if (element.shapeTreatment === "depth" || shape.depth) {
    options.shadow = {
      type: "outer",
      color: "000000",
      blur: 14,
      offset: 7,
      opacity: 0.35,
    };
  } else if (shadow && typeof shadow === "object") {
    options.shadow = {
      type: "outer",
      color: String(shadow.color || "#0F172A").replace(/^#/, ""),
      blur: Number(shadow.blur) || 24,
      offset: Number(shadow.offset) || 8,
      opacity: shadow.opacity != null ? Number(shadow.opacity) : 0.12,
    };
  }
  slide.addShape(kind, options);
}

function addPicture(slide, element, content, deckId, rotate) {
  const file = imageFile(deckId, content && content.url);
  if (!file) return;
  const clip = (content && content.clip) || {};
  const box = boxOf(element);
  const maskTag = pictureMaskTag(clip, element);
  const objectName = groupObjectName(element, maskTag);
  const base = { path: file, rotate: rotate || 0 };
  if (objectName) base.objectName = objectName;
  if (element.shapeTreatment === "depth") {
    base.shadow = {
      type: "outer",
      color: "000000",
      blur: 14,
      offset: 7,
      opacity: 0.35,
    };
  }
  if (content && content.fit === "contain" && !clip.kind) {
    slide.addImage(Object.assign(base, box));
    return;
  }
  // Native PPTX Crop to Shape only — never bake masked PNGs (designer must swap photos).
  // circle → pptxgenjs rounding (ellipse prstGeom); roundRect/arch → OOXML post-process.
  if (clip.kind === "ellipse" || clip.kind === "circle") {
    slide.addImage(Object.assign(base, { rounding: true }, box, coverSizing(box, content, file)));
    return;
  }
  if (
    clip.kind === "arch" ||
    clip.kind === "pill" ||
    (clip.kind === "rect" && Number(clip.cornerRadius) > 0)
  ) {
    slide.addImage(Object.assign(base, box, coverSizing(box, content, file)));
    return;
  }
  slide.addImage(Object.assign(base, box, coverSizing(box, content, file)));
}

function coverSizing(box, content, file) {
  const hasAlign = content && (content.alignX != null || content.alignY != null);
  if (!hasAlign || !file) {
    return { sizing: { type: "cover", x: 0, y: 0, w: box.w, h: box.h } };
  }
  const ax = content.alignX == null ? 0.5 : Number(content.alignX);
  const ay = content.alignY == null ? 0.5 : Number(content.alignY);
  let iw = 0;
  let ih = 0;
  try {
    const image = loadImage(file);
    iw = image.naturalWidth || image.width || 0;
    ih = image.naturalHeight || image.height || 0;
  } catch (error) {
    iw = 0;
    ih = 0;
  }
  if (!(iw > 0 && ih > 0 && box.w > 0 && box.h > 0)) {
    return { sizing: { type: "cover", x: 0, y: 0, w: box.w, h: box.h } };
  }
  const zoomRaw = content.zoom != null ? Number(content.zoom) : 1;
  const zoom = Number.isFinite(zoomRaw) && zoomRaw > 1 ? Math.min(2.5, zoomRaw) : 1;
  const scale = Math.max(box.w / iw, box.h / ih) * zoom;
  const scaledW = iw * scale;
  const scaledH = ih * scale;
  const ox = Math.max(0, (scaledW - box.w) * (Number.isFinite(ax) ? ax : 0.5));
  const oy = Math.max(0, (scaledH - box.h) * (Number.isFinite(ay) ? ay : 0.5));
  return {
    w: scaledW,
    h: scaledH,
    sizing: { type: "crop", w: box.w, h: box.h, x: ox, y: oy },
  };
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
  // Arch intentionally NOT drawn as a blob — PPTX safety maps it to rounded rect.
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

/**
 * Apply native PowerPoint Crop-to-Shape (prstGeom ellipse / roundRect) on pictures
 * tagged with mask:* in objectName — keeps source photos swappable by designers.
 */
async function applyNativePictureMasks(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const names = Object.keys(zip.files).filter((name) => /ppt\/slides\/slide\d+\.xml$/.test(name));
  let changed = false;
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    let xml = await zip.file(name).async("string");
    const next = xml.replace(/<p:pic\b[\s\S]*?<\/p:pic>/g, applyMaskToPicXml);
    if (next !== xml) {
      zip.file(name, next);
      changed = true;
    }
  }
  if (!changed) return buffer;
  return Buffer.from(await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

function applyMaskToPicXml(pic) {
  const nameMatch = pic.match(/name="([^"]+)"/);
  if (!nameMatch) return pic;
  const maskPart = String(nameMatch[1])
    .split("|")
    .find((p) => p.indexOf("mask:") === 0);
  if (!maskPart) return pic;
  let geom = "";
  if (maskPart === "mask:ellipse") {
    geom = '<a:prstGeom prst="ellipse"><a:avLst/></a:prstGeom>';
  } else {
    const m =
      maskPart.match(/^mask:roundRect:(\d+)$/) ||
      maskPart.match(/^mask:arch:(\d+)$/) ||
      maskPart.match(/^mask:pill:(\d+)$/);
    if (!m) return pic;
    geom = `<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val ${m[1]}"/></a:avLst></a:prstGeom>`;
  }
  if (/<a:prstGeom[\s\S]*?<\/a:prstGeom>/.test(pic)) {
    return pic.replace(/<a:prstGeom[\s\S]*?<\/a:prstGeom>/, geom);
  }
  if (/<\/a:xfrm>/.test(pic)) {
    return pic.replace(/<\/a:xfrm>/, "</a:xfrm>" + geom);
  }
  return pic;
}

/**
 * Wrap pptxgenjs objects that share `grp:<groupId>:` objectName into OOXML groups
 * so title+plate+photo overlaps (and collages) move together in PowerPoint.
 */
async function groupNamedElements(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const names = Object.keys(zip.files).filter((name) => /ppt\/slides\/slide\d+\.xml$/.test(name));
  let changed = false;
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    let xml = await zip.file(name).async("string");
    const next = wrapGroupsInSlideXml(xml);
    if (next !== xml) {
      zip.file(name, next);
      changed = true;
    }
  }
  if (!changed) return buffer;
  return Buffer.from(await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

function wrapGroupsInSlideXml(xml) {
  // Collect top-level graphic frames (sp / pic / graphicFrame) with grp: names
  const spTreeMatch = xml.match(/<p:spTree>([\s\S]*?)<\/p:spTree>/);
  if (!spTreeMatch) return xml;
  const tree = spTreeMatch[1];
  const pieceRe = /<(p:sp|p:pic|p:graphicFrame)\b[\s\S]*?<\/\1>/g;
  const pieces = [];
  let m;
  while ((m = pieceRe.exec(tree))) pieces.push(m[0]);
  if (pieces.length < 2) return xml;

  const byGroup = new Map();
  pieces.forEach((piece, index) => {
    const nm = piece.match(/name="([^"]+)"/);
    if (!nm) return;
    const grpToken = String(nm[1])
      .split("|")
      .find((p) => p.indexOf("grp:") === 0);
    if (!grpToken) return;
    const groupId = grpToken.split(":")[1];
    if (!groupId) return;
    if (!byGroup.has(groupId)) byGroup.set(groupId, []);
    byGroup.get(groupId).push({ index, piece, name: grpToken });
  });

  let rebuilt = tree;
  byGroup.forEach((items, groupId) => {
    if (items.length < 2) return;
    // Replace first occurrence with group; remove the rest
    const kids = items.map((it) => it.piece).join("");
    const grp =
      `<p:grpSp>` +
      `<p:nvGrpSpPr><p:cNvPr id="900${Math.abs(hashStr(groupId) % 900)}" name="grp:${groupId}"/>` +
      `<p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>` +
      `<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="12192000" cy="6858000"/>` +
      `<a:chOff x="0" y="0"/><a:chExt cx="12192000" cy="6858000"/></a:xfrm></p:grpSpPr>` +
      kids +
      `</p:grpSp>`;
    rebuilt = rebuilt.replace(items[0].piece, grp);
    for (let k = 1; k < items.length; k++) {
      rebuilt = rebuilt.replace(items[k].piece, "");
    }
  });
  if (rebuilt === tree) return xml;
  return xml.replace(spTreeMatch[0], "<p:spTree>" + rebuilt + "</p:spTree>");
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
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

module.exports = {
  listCatalog,
  readCatalog,
  slideFile,
  buildPptx,
  exportDeckPptx,
  ENTRANCE_TEMPLATES,
  applyMotionOoxml,
};
