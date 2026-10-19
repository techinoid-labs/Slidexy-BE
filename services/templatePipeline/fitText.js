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
  "Archivo Black": "archivo-black.ttf",
  "Source Sans 3": "source-sans-3.ttf",
  "Nunito Sans": "nunito-sans.ttf",
  "Figtree": "figtree.ttf",
  "Sora": "sora.ttf",
  "Work Sans": "work-sans.ttf",
  "Spectral": "spectral.ttf",
  "IBM Plex Sans": "ibm-plex-sans.ttf",
  "IBM Plex Mono": "ibm-plex-mono.ttf",
  "Poppins": "poppins.ttf",
  "Montserrat": "montserrat.ttf",
  "Inter": "inter.ttf",
  "Open Sans": "open-sans.ttf",
  "Lato": "lato.ttf",
  "Roboto": "roboto.ttf",
};

const loaded = new Map();

function fontOf(family) {
  if (loaded.has(family)) return loaded.get(family);
  const file = FILES[family];
  if (!file) {
    const error = new Error("No measurement file for the font " + family + ".");
    error.status = 500;
    throw error;
  }
  const font = opentype.parse(fs.readFileSync(path.join(__dirname, "fonts", file)));
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
  try {
    return font.getAdvanceWidth(value, size);
  } catch (error) {
    const scale = size / font.unitsPerEm;
    let width = 0;
    for (const char of value) {
      const glyph = font.charToGlyph(char);
      width += (glyph.advanceWidth || 0) * scale;
    }
    return width;
  }
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

module.exports = { textOverflow };
