const fs = require("fs");
const path = require("path");

const DECK_DIR = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "slidesX-Flutter-POC",
  "assets",
  "templates",
  "decks",
);

const NEEDED = ["bg", "ink", "accent"];

let cache = null;

function loadLibrary() {
  if (cache) return cache;
  if (!fs.existsSync(DECK_DIR)) {
    cache = [];
    return cache;
  }
  cache = fs
    .readdirSync(DECK_DIR)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(fs.readFileSync(path.join(DECK_DIR, name), "utf8")))
    .filter((deck) => {
      const color = deck.tokens && deck.tokens.color;
      const font = deck.tokens && deck.tokens.font;
      const layouts = deck.layouts || {};
      if (!color || !font || !font.display || !font.text) return false;
      if (!NEEDED.every((key) => typeof color[key] === "string")) return false;
      return Boolean(layouts.layoutTitleFocus) && Object.keys(layouts).length >= 6;
    });
  return cache;
}

module.exports = { loadLibrary, DECK_DIR };
