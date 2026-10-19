/**
 * Builds one deck template from a numeric seed.
 * The model invents the idea and a reasoning step composes the body.
 * This module checks that the result is a valid schemaVersion 2 deck.
 */

const { CANVAS, BINDINGS } = require("./deckSchema");

async function generateDeck(seed) {
  return require("./composeDeck").composeDeck(seed);
}

function contrast(hexA, hexB) {
  const lum = (hex) => {
    const h = hex.replace("#", "");
    const channels = [0, 2, 4].map((i) => {
      const c = parseInt(h.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const a = lum(hexA);
  const b = lum(hexB);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

function validateDeck(deck) {
  const errors = [];
  if (deck.schemaVersion !== 2) errors.push("schemaVersion must be 2");
  if (!Array.isArray(deck.layoutSequence) || deck.layoutSequence.length < 2) {
    errors.push("layoutSequence is too short");
  }
  for (const layoutId of deck.layoutSequence || []) {
    const body = deck.layouts && deck.layouts[layoutId];
    if (!body) {
      errors.push("missing layout " + layoutId);
      continue;
    }
    for (const element of body.elements || []) {
      const box = [element.x, element.y, element.width, element.height];
      if (box.some((n) => typeof n !== "number")) {
        errors.push(layoutId + " " + element.id + " has a bad box");
        continue;
      }
      if (element.x < 0 || element.y < 0 || element.x + element.width > CANVAS.width + 1 || element.y + element.height > CANVAS.height + 1) {
        errors.push(layoutId + " " + element.id + " sits outside the slide");
      }
      const binding = element.textContent && element.textContent.binding;
      if (binding && !BINDINGS.has(binding)) errors.push("unknown binding " + binding);
      const imageBinding = element.imageContent && element.imageContent.binding;
      if (imageBinding && !BINDINGS.has(imageBinding)) errors.push("unknown binding " + imageBinding);
    }
  }
  const color = deck.tokens && deck.tokens.color;
  if (color && contrast(color.ink, color.bg) < 4.5) errors.push("ink on background is too faint");
  if (color && contrast(color.accent, color.bg) < 3) errors.push("accent on background is too faint");
  return errors;
}

module.exports = {
  generateDeck,
  validateDeck,
};
