/**
 * Checks that a deck is a valid schemaVersion 2 deck.
 * Decks come from pptxToDeck.js or mutate.js.
 */

const { CANVAS, BINDINGS, CLIP_KINDS } = require("./deckSchema");

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

function onCanvas(element) {
  return element.x >= 0 && element.y >= 0
    && element.x + element.width <= CANVAS.width + 1
    && element.y + element.height <= CANVAS.height + 1;
}

function rotatedAabb(element) {
  const rad = (Number(element.degrees) || 0) * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const cx = element.x + element.width / 2;
  const cy = element.y + element.height / 2;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const dx of [-element.width / 2, element.width / 2]) {
    for (const dy of [-element.height / 2, element.height / 2]) {
      const x = cx + dx * cos - dy * sin;
      const y = cy + dx * sin + dy * cos;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function bleedsTooFar(box) {
  const overflowX = Math.max(0, -box.x, box.x + box.width - CANVAS.width);
  const overflowY = Math.max(0, -box.y, box.y + box.height - CANVAS.height);
  const visibleX = Math.min(box.x + box.width, CANVAS.width) - Math.max(box.x, 0);
  const visibleY = Math.min(box.y + box.height, CANVAS.height) - Math.max(box.y, 0);
  return overflowX > CANVAS.width * 0.2 + 1
    || overflowY > CANVAS.height * 0.2 + 1
    || visibleX <= 0
    || visibleY <= 0;
}

function checkElement(layoutId, element, errors, depth) {
  const where = layoutId + " " + (element.id || "element");
  const box = [element.x, element.y, element.width, element.height];
  if (box.some((n) => typeof n !== "number")) {
    errors.push(where + " has a bad box");
    return;
  }
  const params = element.shapeContent && element.shapeContent.decorParams;
  const mayHang = (element.type === "shape" && params && params.bleed)
    || element.type === "collage"
    || element.type === "maskedImage"
    || element.type === "illustration";
  if (element.type === "rotated") {
    if (bleedsTooFar(rotatedAabb(element))) errors.push(where + " bleeds too far");
  } else if (mayHang && !onCanvas(element)) {
    if (bleedsTooFar(element)) errors.push(where + " bleeds too far");
  } else if (!onCanvas(element)) {
    errors.push(where + " sits outside the slide");
  }
  const binding = element.textContent && element.textContent.binding;
  if (binding && !BINDINGS.has(binding)) errors.push("unknown binding " + binding);
  const imageBinding = element.imageContent && element.imageContent.binding;
  if (imageBinding && !BINDINGS.has(imageBinding)) errors.push("unknown binding " + imageBinding);
  if (element.type === "illustration") {
    const body = element.illustrationContent || {};
    if (typeof body.d !== "string" || !body.d.trim()) errors.push(where + " illustration needs a path");
    if ((!body.fill || body.fill === "none") && (!body.stroke || body.stroke === "none")) {
      errors.push(where + " illustration needs a fill or a stroke");
    }
    if (element.opacity != null && (element.opacity < 0 || element.opacity > 1)) errors.push(where + " opacity is out of range");
  }
  if (element.type === "maskedImage") {
    const body = element.maskedImageContent || {};
    const clip = body.clip || {};
    if (!CLIP_KINDS.includes(clip.kind)) errors.push(where + " mask kind is unknown");
    if (clip.kind === "path" && (typeof clip.d !== "string" || !clip.d.trim())) errors.push(where + " mask path is empty");
    if (!body.url && !(body.binding && BINDINGS.has(body.binding))) errors.push(where + " masked image needs a picture");
  }
  if (element.type === "rotated") {
    if (typeof element.degrees !== "number" || !Number.isFinite(element.degrees)) errors.push(where + " rotation needs degrees");
    if (!element.element || element.element.type === "rotated" || depth > 0) errors.push(where + " rotation needs one element");
    else checkElement(layoutId, element.element, errors, depth + 1);
  }
  if (element.type === "collage") {
    const cells = element.collageContent && element.collageContent.cells;
    if (!Array.isArray(cells) || cells.length < 2 || cells.length > 6) errors.push(where + " collage needs 2 to 6 images");
    (cells || []).forEach((cell, index) => {
      const cellBox = [cell.x, cell.y, cell.width, cell.height];
      if (cellBox.some((n) => typeof n !== "number")) {
        errors.push(where + " cell " + index + " has a bad box");
        return;
      }
      if (cell.x < -1 || cell.y < -1 || cell.x + cell.width > element.width + 1 || cell.y + cell.height > element.height + 1) {
        errors.push(where + " cell " + index + " sits outside the collage");
      }
      if (!cell.url && !(cell.binding && BINDINGS.has(cell.binding))) errors.push(where + " cell " + index + " needs a picture");
    });
  }
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
      checkElement(layoutId, element, errors, 0);
    }
  }
  const color = deck.tokens && deck.tokens.color;
  if (color && contrast(color.ink, color.bg) < 4.5) errors.push("ink on background is too faint");
  if (color && contrast(color.accent, color.bg) < 3) errors.push("accent on background is too faint");
  return errors;
}

module.exports = {
  validateDeck,
};
