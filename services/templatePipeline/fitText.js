/**
 * Checks that the sample title and bullets fit the box they are bound to.
 * Width comes from the font file for the deck's display font (titles) and
 * text font (body), not from a single average character width.
 * The files in ./fonts are Latin subsets used only for this measurement.
 */

const fs = require("fs");
const path = require("path");
const opentype = require("opentype.js");

const FILES = {
  "Fraunces": "fraunces.ttf",
  "Newsreader": "newsreader.ttf",
  "Libre Baskerville": "libre-baskerville.ttf",
  "Source Serif 4": "source-serif-4.ttf",
  "Literata": "literata.ttf",
  "Outfit": "outfit.ttf",
  "Familjen Grotesk": "familjen-grotesk.ttf",
  "Space Grotesk": "space-grotesk.ttf",
  "Syne": "syne.ttf",
  "Manrope": "manrope.ttf",
  "Instrument Serif": "instrument-serif.ttf",
  "DM Serif Display": "dm-serif-display.ttf",
  "Antonio": "antonio.ttf",
  "Antonio Bold": "antonio.ttf",
  "Archivo Black": "archivo-black.ttf",
  "Source Sans 3": "source-sans-3.ttf",
  "Nunito Sans": "nunito-sans.ttf",
  "Figtree": "figtree.ttf",
  "Sora": "sora.ttf",
  "Work Sans": "work-sans.ttf",
  "Spectral": "spectral.ttf",
  "Playfair Display": "playfair-display.ttf",
  "IBM Plex Sans": "ibm-plex-sans.ttf",
  "IBM Plex Mono": "ibm-plex-mono.ttf",
  "Poppins": "poppins-regular.ttf",
  "Poppins Bold": "poppins-bold.ttf",
  "Telegraf": "space-grotesk-regular.ttf",
  "Telegraf Bold": "space-grotesk-bold.ttf",
  "Open Sauce": "open-sauce-regular.ttf",
  "Open Sauce Light": "open-sauce-light.ttf",
  "Open Sauce Medium": "open-sauce-medium.ttf",
  "Open Sauce Bold": "open-sauce-bold.ttf",
  "Open Sauce Heavy": "open-sauce-black.ttf",
  "Canva Sans": "figtree-regular.ttf",
  "Canva Sans Bold": "figtree-bold.ttf",
  "Montserrat": "montserrat.ttf",
  "Inter": "inter.ttf",
  "Open Sans": "open-sans.ttf",
  "Open Sans Condensed": "open-sans.ttf",
  "Lato": "lato.ttf",
  "Roboto": "roboto.ttf",
};

const loaded = new Map();

function fontFile(family) {
  const file = FILES[family];
  return file ? path.join(__dirname, "fonts", file) : null;
}

function knownFamilies() {
  return Object.keys(FILES);
}

function fontOf(family) {
  if (loaded.has(family)) return loaded.get(family);
  const file = fontFile(family);
  if (!file) {
    const error = new Error("No measurement file for the font " + family + ".");
    error.status = 500;
    throw error;
  }
  const font = opentype.parse(fs.readFileSync(file));
  loaded.set(family, font);
  return font;
}

function fontSize(tokens, value) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.startsWith("{type.") && value.endsWith("}")) {
    const key = value.slice(6, -1);
    const size = tokens.type && tokens.type[key];
    if (typeof size === "number") return size;
  }
  return 28;
}

function widthOf(family, text, size) {
  const font = fontOf(family);
  const value = String(text);
  // Glyph advances only. getAdvanceWidth applies the ccmp lookup, and
  // opentype.js throws on lookup type 6 format 2, which Inter, Roboto,
  // Source Sans 3, and several other deck fonts contain.
  const scale = size / (font.unitsPerEm || 1000);
  let width = 0;
  for (const char of value) {
    try {
      const glyph = font.charToGlyph(char);
      width += (glyph.advanceWidth || 0) * scale;
    } catch (glyphError) {
      width += size * 0.55;
    }
  }
  return width;
}

function overflows(text, boxWidth, boxHeight, size, lineHeight, family) {
  const raw = String(text || "").trim();
  if (!raw) return false;
  const leading = size * (lineHeight || 1.2);
  const maxLines = Math.max(1, Math.floor(boxHeight / leading));
  const words = raw.split(/\s+/);
  let lines = 1;
  let line = "";
  for (const word of words) {
    if (widthOf(family, word, size) > boxWidth) return true;
    const trial = line ? line + " " + word : word;
    if (widthOf(family, trial, size) <= boxWidth) {
      line = trial;
    } else {
      lines += 1;
      line = word;
      if (lines > maxLines) return true;
    }
  }
  return false;
}

function textOverflow(deck) {
  const problems = [];
  const fonts = (deck.tokens && deck.tokens.font) || {};
  (deck.previewSlides || []).forEach((slide) => {
    const layout = deck.layouts && deck.layouts[slide.layout];
    if (!layout) return;
    (layout.elements || []).forEach((element) => {
      if (element.type !== "text") return;
      const binding = element.textContent && element.textContent.binding;
      const size = fontSize(deck.tokens, element.textStyle && element.textStyle.fontSize);
      const lineHeight = element.textStyle && element.textStyle.lineHeight;
      const family = binding === "bullets" ? fonts.text : fonts.display;
      const check = (text, label) => {
        if (overflows(text, element.width, element.height, size, lineHeight, family || fonts.display)) {
          problems.push(slide.layout + " " + label);
        }
      };
      if (binding === "title") check(slide.title || "", "title");
      if (binding === "bullets") check((slide.bullets || []).join(" "), "body");
    });
  });
  return problems;
}

function measurableFamily(name, fonts) {
  const raw = String(name || "").trim();
  if (raw && fontFile(raw)) return raw;
  if (fonts && fontFile(fonts.text)) return fonts.text;
  if (fonts && fontFile(fonts.display)) return fonts.display;
  if (fontFile("Roboto")) return "Roboto";
  if (fontFile("Inter")) return "Inter";
  return knownFamilies()[0] || "Inter";
}

function resolveFamily(element, deck) {
  const fonts = (deck && deck.tokens && deck.tokens.font) || {};
  const style = element.textStyle || {};
  const spans = element.textContent && element.textContent.spans;
  const span = Array.isArray(spans) ? spans.find((item) => item && item.fontFamily) : null;
  let family = (span && span.fontFamily) || style.fontFamily || fonts.display || fonts.text || "";
  if (typeof family === "string" && family.startsWith("{font.") && family.endsWith("}")) {
    const key = family.slice(6, -1);
    family = fonts[key] || family;
  }
  return measurableFamily(family, fonts);
}

function currentText(element) {
  const spans = element && element.textContent && element.textContent.spans;
  if (!Array.isArray(spans) || !spans.length) return "";
  return spans.map((span) => String(span && span.text != null ? span.text : "")).join("");
}

function setCurrentText(element, text) {
  const spans = element && element.textContent && element.textContent.spans;
  if (!Array.isArray(spans) || !spans.length) return;
  spans[0].text = text;
  for (let index = 1; index < spans.length; index += 1) spans[index].text = "";
}

function currentSize(element, deck) {
  const spans = element.textContent && element.textContent.spans;
  const span = Array.isArray(spans) ? spans.find((item) => item && Number(item.fontSize)) : null;
  const raw = (span && span.fontSize) || (element.textStyle && element.textStyle.fontSize);
  return fontSize(deck.tokens || {}, raw);
}

function setCurrentSize(element, size) {
  if (!element.textStyle) element.textStyle = {};
  element.textStyle.fontSize = size;
  const spans = (element.textContent && element.textContent.spans) || [];
  spans.forEach((span) => {
    if (span) span.fontSize = size;
  });
}

function shortenWords(text, boxWidth, boxHeight, size, lineHeight, family) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  let next = words.slice();
  while (next.length > 1 && overflows(next.join(" "), boxWidth, boxHeight, size, lineHeight, family)) {
    next.pop();
  }
  return next.join(" ");
}

function wordCount(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function isDisplayTitle(element, text, size) {
  const id = String(element && element.id || "").toLowerCase();
  if (/title|heading|cover|thank|welcome/.test(id)) return true;
  if (size >= 48) return true;
  if (size >= 32 && wordCount(text) <= 6) return true;
  return false;
}

/** Target size so titles leave padding and do not dominate the box. */
function comfortCap(text, width, height, lineHeight, family, fromSize, display) {
  if (!display) return fromSize;
  const words = wordCount(text);
  const lh = lineHeight || 1.2;
  // Prefer one line for short titles, two for longer labels.
  const targetLines = words <= 3 ? 1 : 2;
  const heightCap = (height * 0.55) / (lh * targetLines);
  // Absolute caps: body-slide titles stay under 64; huge closing titles under 96.
  const absoluteCap = fromSize >= 160 || height >= 300 ? 96 : 64;
  let cap = Math.min(fromSize, heightCap, absoluteCap);
  // Width comfort: short all-caps titles should not force ultra-tight tracking visually.
  const floor = Math.max(18, Math.min(fromSize, height * 0.28));
  while (cap > floor && widthOf(family, text, cap) > width * 0.92) {
    cap = Math.max(floor, Math.round(cap * 0.92 * 10) / 10);
  }
  return Math.round(Math.max(floor, cap) * 10) / 10;
}

/**
 * Shrink or shorten text so seed/thematic boxes do not overflow,
 * and pull oversized display titles down to a comfortable size even when they "fit".
 * Boxes never grow. Returns a list of fit actions for logging.
 */
function fitDeckText(deck) {
  const fits = [];

  function visit(element, slideIndex) {
    if (!element) return;
    if (element.type === "rotated" && element.element) {
      visit(element.element, slideIndex);
      return;
    }
    if (element.type !== "text") {
      if (Array.isArray(element.children)) element.children.forEach((child) => visit(child, slideIndex));
      return;
    }
    const text = currentText(element).trim();
    if (!text) return;
    const width = Number(element.width) || 0;
    const height = Number(element.height) || 0;
    if (width < 8 || height < 8) return;
    const lineHeight = Number(element.textStyle && element.textStyle.lineHeight) || 1.2;
    const family = resolveFamily(element, deck);
    let size = currentSize(element, deck);
    const fromSize = size;
    const display = isDisplayTitle(element, text, size);
    const usableHeight = height * (display ? 0.85 : 1);
    const comfort = comfortCap(text, width, height, lineHeight, family, size, display);
    if (comfort < size - 0.05) size = comfort;

    const floor = display
      ? Math.max(18, Math.round(fromSize * 0.35 * 10) / 10)
      : Math.max(10, Math.round(fromSize * 0.55 * 10) / 10);
    while (size > floor && overflows(text, width, usableHeight, size, lineHeight, family)) {
      size = Math.max(floor, Math.round(size * 0.9 * 10) / 10);
    }

    if (size < fromSize - 0.05) {
      setCurrentSize(element, size);
      fits.push({
        slide: slideIndex + 1,
        elementId: element.id || "",
        action: display ? "titleComfort" : "fontShrink",
        from: fromSize,
        to: size,
      });
    } else if (!overflows(text, width, height, size, lineHeight, family)) {
      return;
    }

    if (!overflows(text, width, usableHeight, size, lineHeight, family)
      && !overflows(text, width, height, size, lineHeight, family)) {
      return;
    }

    const shortened = shortenWords(text, width, usableHeight, size, lineHeight, family);
    if (shortened && shortened !== text) {
      setCurrentText(element, shortened);
      fits.push({
        slide: slideIndex + 1,
        elementId: element.id || "",
        action: "clamp",
        from: text.length,
        to: shortened.length,
      });
    }
  }

  (deck.layoutSequence || Object.keys(deck.layouts || {})).forEach((layoutId, slideIndex) => {
    const layout = deck.layouts && deck.layouts[layoutId];
    (layout && layout.elements || []).forEach((element) => visit(element, slideIndex));
  });
  return fits;
}

module.exports = {
  textOverflow,
  measureWidth: widthOf,
  fontFile,
  knownFamilies,
  overflows,
  fitDeckText,
  resolveFamily,
};
