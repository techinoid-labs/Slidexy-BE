/**
 * Cross a layout seed with a style seed.
 *
 * Geometry, mask shapes, and image positions stay on the layout.
 * Color and type come from the style seed's tokens, with painted
 * slide colors and fonts standing in when a token is an unused
 * converter default.
 *
 *   node services/templatePipeline/hybridize.js
 */

const fs = require("fs");
const path = require("path");
const { normHex, hexToHsl, hslToHex, contrast, fitContrast } = require("./dna/color");
const { validateDeck } = require("./generateDeck");
const { textBoxes } = require("../../scripts/slideSvg");

const ROOT = path.join(__dirname, "..", "..");
const LIBRARY = path.join(ROOT, "app-library");
const DEFAULT_ACCENT = "#1E3A32";
const DEFAULT_FONT = "calibri";

function loadDeck(id) {
  const file = path.join(LIBRARY, id + ".json");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function hexToRgb(hex) {
  const raw = normHex(hex).slice(1);
  return [
    parseInt(raw.slice(0, 2), 16),
    parseInt(raw.slice(2, 4), 16),
    parseInt(raw.slice(4, 6), 16),
  ];
}

function near(a, b) {
  const left = normHex(a);
  const right = normHex(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const [r1, g1, b1] = hexToRgb(left);
  const [r2, g2, b2] = hexToRgb(right);
  return Math.hypot(r1 - r2, g1 - g2, b1 - b2) <= 42;
}

function addCount(map, key, amount) {
  if (!key || !amount) return;
  map.set(key, (map.get(key) || 0) + amount);
}

function solidFill(element) {
  if (!element) return null;
  if (element.shapeContent) {
    const fill = normHex(element.shapeContent.fill);
    if (fill) return fill;
  }
  if (element.illustrationContent) {
    const fill = normHex(element.illustrationContent.fill);
    if (fill) return fill;
  }
  return null;
}

function eachNode(deck, visit) {
  const ids = deck.layoutSequence || Object.keys(deck.layouts || {});
  ids.forEach((id) => {
    const layout = deck.layouts && deck.layouts[id];
    if (!layout) return;
    const canvas = layout.canvas || { width: 1600, height: 900 };
    function visitElement(element) {
      visit(element, canvas, layout, id);
      if (element.type === "rotated" && element.element) visitElement(element.element);
      if (Array.isArray(element.children)) element.children.forEach(visitElement);
    }
    (layout.elements || []).forEach(visitElement);
  });
}

function collect(deck) {
  const fills = new Map();
  const full = new Map();
  const text = new Map();
  const fonts = new Map();
  eachNode(deck, (element, canvas) => {
    const area = Math.abs((Number(element.width) || 0) * (Number(element.height) || 0));
    const canvasArea = (canvas.width || 1600) * (canvas.height || 900);
    const fill = solidFill(element);
    if (fill && area > 0) {
      addCount(fills, fill, area);
      if (area >= canvasArea * 0.5) addCount(full, fill, area);
    }
    if (element.type !== "text") return;
    const spans = element.textContent && element.textContent.spans;
    if (!Array.isArray(spans)) return;
    spans.forEach((span) => {
      const chars = String(span.text || "").replace(/\s+/g, "").length || 1;
      const color = normHex(span.color) || normHex(element.textStyle && element.textStyle.color);
      addCount(text, color, chars);
      const family = span.fontFamily || (element.textStyle && element.textStyle.fontFamily);
      const size = Number(span.fontSize || (element.textStyle && element.textStyle.fontSize) || 0);
      if (!family) return;
      const info = fonts.get(family) || { chars: 0, maxSize: 0 };
      info.chars += chars;
      info.maxSize = Math.max(info.maxSize, size);
      fonts.set(family, info);
    });
  });
  return { fills, full, text, fonts };
}

function largestKey(map) {
  let best = null;
  let score = -1;
  for (const [key, value] of map) {
    if (value > score) {
      best = key;
      score = value;
    }
  }
  return best;
}

function readableOn(bg) {
  const white = contrast("#FFFFFF", bg);
  const black = contrast("#000000", bg);
  return white >= black ? "#FFFFFF" : "#000000";
}

function ensureAccent(bg, accent) {
  if (contrast(accent, bg) >= 3) return accent;
  const hsl = hexToHsl(accent);
  const saturated = Math.max(hsl.s, 0.55);
  const fitted = fitContrast(bg, hslToHex(hsl.h, saturated, hsl.l), 3.15);
  if (contrast(fitted, bg) >= 3) return fitted;
  const dark = fitContrast(bg, hslToHex(hsl.h, saturated, 0.18), 4.5);
  const light = fitContrast(bg, hslToHex(hsl.h, saturated, 0.86), 4.5);
  const pick = contrast(dark, bg) >= contrast(light, bg) ? dark : light;
  if (contrast(pick, bg) >= 3) return pick;
  return readableOn(bg);
}

function chooseBg(tokens, stats) {
  const painted = largestKey(stats.full) || largestKey(stats.fills);
  const token = normHex(tokens.bg);
  if (token && painted && token === painted) return { color: token, painted, source: "token" };
  if (token && painted && token !== painted) return { color: painted, painted, source: "painted" };
  return { color: token || painted || "#FFFFFF", painted, source: token ? "token" : "painted" };
}

function chooseAccent(tokens, stats, bg) {
  let painted = null;
  let best = -1;
  for (const [hex, area] of stats.fills) {
    if (near(hex, bg)) continue;
    if (hexToHsl(hex).s < 0.18) continue;
    if (area > best) {
      painted = hex;
      best = area;
    }
  }
  if (!painted) {
    let chars = -1;
    for (const [hex, count] of stats.text) {
      if (near(hex, bg) || hexToHsl(hex).s < 0.18) continue;
      if (count > chars) {
        painted = hex;
        chars = count;
      }
    }
  }
  const token = normHex(tokens.accent);
  const tokenUsed = token && ((stats.fills.get(token) || 0) > 0 || (stats.text.get(token) || 0) > 0);
  if (tokenUsed && token !== DEFAULT_ACCENT) return { color: token, painted, source: "token" };
  return { color: painted || token || DEFAULT_ACCENT, painted, source: painted ? "painted" : "token" };
}

function chooseInk(tokens, stats, bg, accent) {
  const ranked = [...stats.text.entries()].sort((a, b) => b[1] - a[1]);
  const passing = ranked.filter(([hex]) => contrast(hex, bg) >= 4.5 && !near(hex, accent) && !near(hex, bg));
  const painted = (passing[0] || ranked.find(([hex]) => !near(hex, accent)) || ranked[0] || [])[0];
  const token = normHex(tokens.ink);
  const tokenUsed = token && (stats.text.get(token) || 0) > 0;
  if (tokenUsed && contrast(token, bg) >= 4.5 && !near(token, accent)) {
    return { color: token, painted, source: "token" };
  }
  if (painted && contrast(painted, bg) >= 4.5) return { color: painted, painted, source: "painted" };
  return { color: readableOn(bg), painted, source: "contrast" };
}

function chooseFonts(fontTokens, stats) {
  let displayFamily = null;
  let maxSize = -1;
  let textFamily = null;
  let textChars = -1;
  for (const [family, info] of stats.fonts) {
    if (info.maxSize > maxSize) {
      maxSize = info.maxSize;
      displayFamily = family;
    }
  }
  for (const [family, info] of stats.fonts) {
    if (family === displayFamily) continue;
    if (info.chars > textChars) {
      textChars = info.chars;
      textFamily = family;
    }
  }
  const unused = (name) => !name || String(name).trim().toLowerCase() === DEFAULT_FONT;
  const display = unused(fontTokens.display) ? (displayFamily || fontTokens.display || "Calibri") : fontTokens.display;
  const text = unused(fontTokens.text) ? (textFamily || display) : fontTokens.text;
  return {
    display,
    text,
    displayFamily: displayFamily || display,
    displaySource: unused(fontTokens.display) ? "painted" : "token",
    textSource: unused(fontTokens.text) ? "painted" : "token",
  };
}

function readStyle(deck) {
  const stats = collect(deck);
  const tokens = (deck.tokens && deck.tokens.color) || {};
  const fontTokens = (deck.tokens && deck.tokens.font) || {};
  const bg = chooseBg(tokens, stats);
  const accent = chooseAccent(tokens, stats, bg.color);
  const ink = chooseInk(tokens, stats, bg.color, accent.color);
  const fonts = chooseFonts(fontTokens, stats);
  return {
    id: deck.id,
    color: {
      bg: bg.color,
      surface: bg.color,
      card: "#FFFFFF",
      ink: ink.color,
      muted: ink.color,
      accent: accent.color,
      accent2: accent.color,
      onAccent: readableOn(accent.color),
      rule: ink.color,
    },
    font: { display: fonts.display, text: fonts.text },
    displayFamily: fonts.displayFamily,
    source: {
      bg: bg.source,
      accent: accent.source,
      ink: ink.source,
      display: fonts.displaySource,
      text: fonts.textSource,
    },
    painted: {
      bg: bg.painted,
      accent: accent.painted,
      ink: ink.painted,
      display: fonts.displayFamily,
      text: fonts.text,
    },
    token: {
      bg: normHex(tokens.bg),
      accent: normHex(tokens.accent),
      ink: normHex(tokens.ink),
      display: fontTokens.display || "",
      text: fontTokens.text || "",
    },
  };
}

function prepareStyle(style) {
  const color = Object.assign({}, style.color);
  const adjustments = [];
  if (contrast(color.ink, color.bg) < 4.5) {
    const next = readableOn(color.bg);
    adjustments.push({
      role: "ink",
      from: color.ink,
      to: next,
      ratio: Math.round(contrast(next, color.bg) * 100) / 100,
    });
    color.ink = next;
    color.muted = next;
    color.rule = next;
  }
  if (contrast(color.accent, color.bg) < 3) {
    const next = ensureAccent(color.bg, color.accent);
    adjustments.push({
      role: "accent",
      from: color.accent,
      to: next,
      ratio: Math.round(contrast(next, color.bg) * 100) / 100,
    });
    color.accent = next;
    color.accent2 = next;
    color.onAccent = readableOn(next);
  }
  return Object.assign({}, style, { color, adjustments });
}

function paintHex(value, remap) {
  const key = normHex(value);
  if (!key) return value;
  return remap(key);
}

function fillRemap(from, to) {
  return (hex) => {
    if (near(hex, from.color.bg)) return to.color.bg;
    if (near(hex, from.color.accent)) return to.color.accent;
    const hsl = hexToHsl(hex);
    if (hsl.s >= 0.18) return to.color.accent;
    if (hsl.l >= 0.88) return to.color.card;
    return to.color.ink;
  };
}

function textRemap(from, to) {
  return (hex) => {
    const hsl = hexToHsl(hex);
    if (near(hex, from.color.accent) || (hsl.s >= 0.18 && !near(hex, from.color.bg))) return to.color.accent;
    if (near(hex, from.color.bg)) return to.color.bg;
    return to.color.ink;
  };
}

function applyLook(element, from, to) {
  const fills = fillRemap(from, to);
  const texts = textRemap(from, to);
  if (element.shapeContent) {
    element.shapeContent.fill = paintHex(element.shapeContent.fill, fills);
    element.shapeContent.stroke = paintHex(element.shapeContent.stroke, fills);
  }
  if (element.illustrationContent) {
    element.illustrationContent.fill = paintHex(element.illustrationContent.fill, fills);
    element.illustrationContent.stroke = paintHex(element.illustrationContent.stroke, fills);
  }
  if (element.type !== "text") return;
  const pick = (family) => {
    if (!family) return family;
    if (family === from.displayFamily) return to.font.display;
    return to.font.text;
  };
  if (element.textStyle) {
    if (element.textStyle.fontFamily) element.textStyle.fontFamily = pick(element.textStyle.fontFamily);
    if (element.textStyle.color) element.textStyle.color = paintHex(element.textStyle.color, texts);
  }
  const spans = element.textContent && element.textContent.spans;
  if (Array.isArray(spans)) {
    spans.forEach((span) => {
      if (span.fontFamily) span.fontFamily = pick(span.fontFamily);
      if (span.color) span.color = paintHex(span.color, texts);
    });
  }
}

function fingerprint(deck) {
  const rows = [];
  eachNode(deck, (element) => {
    const content = element.imageContent || element.maskedImageContent || {};
    const clip = content.clip || {};
    rows.push([
      element.id,
      element.x,
      element.y,
      element.width,
      element.height,
      content.url || "",
      clip.kind || "",
      clip.d || "",
      clip.viewBox || "",
    ].join("|"));
  });
  return rows.join("\n");
}

function topCover(layout, element, x, y, skipHighlight) {
  const z = Number(element.zIndex) || 0;
  let best = null;
  let bestZ = -Infinity;
  for (const other of layout.elements || []) {
    if (other === element) continue;
    if (skipHighlight && String(other.id || "").endsWith("-highlight")) continue;
    const oz = Number(other.zIndex) || 0;
    if (oz > z) continue;
    if (x < other.x || y < other.y || x > other.x + other.width || y > other.y + other.height) continue;
    const fill = solidFill(other);
    const image = other.type === "image" || other.type === "maskedImage";
    if (!fill && !image) continue;
    if (oz < bestZ) continue;
    bestZ = oz;
    best = fill ? { kind: "shape", fill } : { kind: "image" };
  }
  return best;
}

function voteFill(layout, element, boxes, skipHighlight, fallback) {
  const counts = new Map();
  const points = boxes.length
    ? boxes
    : [{ x: element.x + element.width / 2, y: element.y + element.height / 2, width: 0, height: 0 }];
  let images = 0;
  points.forEach((box) => {
    const cover = topCover(layout, element, box.x + (box.width || 0) / 2, box.y + (box.height || 0) / 2, skipHighlight);
    if (!cover) addCount(counts, fallback, 1);
    else if (cover.kind === "image") images += 1;
    else addCount(counts, cover.fill, 1);
  });
  if (images > points.length / 2 && counts.size === 0) return null;
  let best = fallback;
  let score = -1;
  for (const [fill, count] of counts) {
    if (count > score) {
      best = fill;
      score = count;
    }
  }
  return best;
}

function fixTextContrast(deck) {
  const fallback = (deck.tokens && deck.tokens.color && deck.tokens.color.bg) || "#FFFFFF";
  let spans = 0;
  const slides = [];
  const ids = deck.layoutSequence || Object.keys(deck.layouts || {});
  ids.forEach((id) => {
    const layout = deck.layouts && deck.layouts[id];
    if (!layout) return;
    let changed = 0;
    (layout.elements || []).forEach((element) => {
      const node = element.type === "rotated" && element.element && element.element.type === "text"
        ? element.element
        : element;
      if (node.type !== "text") return;
      const list = node.textContent && node.textContent.spans;
      if (!Array.isArray(list) || !list.length) return;
      let boxes = [];
      try {
        boxes = textBoxes(node, { title: "", bullets: [] }, deck.tokens);
      } catch (error) {
        boxes = [];
      }
      const plainBg = voteFill(layout, element, boxes.filter((box) => !box.highlight), true, fallback);
      const markedBg = voteFill(layout, element, boxes.filter((box) => box.highlight), false, plainBg || fallback);
      list.forEach((span) => {
        const bg = span.highlight ? markedBg : plainBg;
        const current = normHex(span.color) || normHex(node.textStyle && node.textStyle.color);
        if (!bg || !current) return;
        if (contrast(current, bg) >= 4.5) return;
        const next = readableOn(bg);
        if (next === current) return;
        span.color = next;
        if (!span.highlight && node.textStyle) node.textStyle.color = next;
        spans += 1;
        changed += 1;
      });
    });
    if (changed) slides.push({ slide: id, spans: changed });
  });
  return { spans, slides };
}

function contrastErrors(errors) {
  return (errors || []).filter((error) => error.indexOf("too faint") >= 0);
}

function hybridize(layoutDeck, styleDeck) {
  const deck = JSON.parse(JSON.stringify(layoutDeck));
  const before = fingerprint(deck);
  const from = readStyle(layoutDeck);
  const to = prepareStyle(readStyle(styleDeck));
  eachNode(deck, (element) => applyLook(element, from, to));
  deck.tokens = deck.tokens || {};
  deck.tokens.color = {
    bg: to.color.bg,
    surface: to.color.bg,
    card: to.color.card,
    ink: to.color.ink,
    muted: to.color.ink,
    rule: to.color.ink,
    accent: to.color.accent,
    accent2: to.color.accent,
    onAccent: readableOn(to.color.accent),
  };
  deck.tokens.font = { display: to.font.display, text: to.font.text };
  deck.theme = Object.assign({}, deck.theme, {
    backgroundColor: to.color.bg,
    fontFamily: to.font.display,
    titleColor: to.color.ink,
    bodyColor: to.color.ink,
  });
  const textFix = fixTextContrast(deck);
  const after = fingerprint(deck);
  if (before !== after) throw new Error("hybridize moved geometry, a mask, or an image");
  deck.id = layoutDeck.id + "__" + styleDeck.id;
  deck.hybrid = {
    layout: layoutDeck.id,
    style: styleDeck.id,
    color: deck.tokens.color,
    font: deck.tokens.font,
    source: to.source,
    tokenAdjustments: to.adjustments,
  };
  const errors = validateDeck(deck);
  return {
    deck,
    from,
    style: to,
    textFix,
    errors,
    contrastErrors: contrastErrors(errors),
  };
}

if (require.main === module) {
  const ids = process.argv.slice(2);
  const list = ids.length ? ids : ["health-medical", "cinema-neon", "company-minimal"];
  list.forEach((id) => {
    const style = readStyle(loadDeck(id));
    const prepared = prepareStyle(style);
    console.log(JSON.stringify({
      id,
      color: prepared.color,
      font: prepared.font,
      source: prepared.source,
      token: style.token,
      adjustments: prepared.adjustments,
    }));
  });
}

module.exports = {
  loadDeck,
  readStyle,
  hybridize,
  fixTextContrast,
  LIBRARY,
};
