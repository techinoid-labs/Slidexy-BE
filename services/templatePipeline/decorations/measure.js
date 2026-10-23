/**
 * Deck-level checks for the decoration layer.
 * A full-slide field (the background or a wash) is not decoration,
 * and text sitting on a panel is not intentional overlap.
 */

const W = 1600;
const H = 900;

function isField(element) {
  return element.width >= 1500 && element.height >= 800;
}

function motifsOf(layout) {
  return ((layout && layout.elements) || []).filter((element) => {
    const params = element.shapeContent && element.shapeContent.decorParams;
    return params && params.family && !isField(element);
  });
}

function box(element) {
  return { x: element.x, y: element.y, w: element.width, h: element.height };
}

function area(a, b) {
  const width = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return width * height;
}

function touchesEdge(element) {
  return element.x <= 1 || element.y <= 1 || element.x + element.width >= W - 1 || element.y + element.height >= H - 1;
}

function partners(elements) {
  return elements.filter((element) => element.type !== "text" && !isField(element));
}

function hasOverlap(elements) {
  const list = partners(elements);
  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) {
      const motif = motifsOf({ elements: [list[i], list[j]] }).length > 0;
      if (motif && area(box(list[i]), box(list[j])) >= 24) return true;
    }
  }
  return false;
}

function hasEdge(elements) {
  return motifsOf({ elements }).some(touchesEdge);
}

function isPlainImage(element, elements) {
  const content = element.imageContent || {};
  if (["frame", "bleed", "cutout", "duotone", "mat", "offset"].includes(content.treatment)) return false;
  if (content.mask && content.mask !== "rect" && content.mask !== "rounded") return false;
  const framed = (elements || []).some((other) => other.shapeContent && other.shapeContent.treatment === "offset" && other.id === element.id + "-offset");
  return !framed;
}

function assess(deck) {
  const sequence = deck.layoutSequence || [];
  const content = sequence.slice(1, Math.max(1, sequence.length - 1));
  const density = content.length
    ? content.reduce((sum, id) => sum + motifsOf(deck.layouts[id]).length, 0) / content.length
    : 0;
  let overlapSlides = 0;
  let edgeSlides = 0;
  let images = 0;
  let plain = 0;
  sequence.forEach((id) => {
    const elements = (deck.layouts[id] && deck.layouts[id].elements) || [];
    if (hasOverlap(elements)) overlapSlides += 1;
    if (hasEdge(elements)) edgeSlides += 1;
    elements.filter((element) => element.type === "image").forEach((element) => {
      images += 1;
      if (isPlainImage(element, elements)) plain += 1;
    });
  });
  return {
    density,
    overlap: sequence.length ? overlapSlides / sequence.length : 0,
    bleed: sequence.length ? edgeSlides / sequence.length : 0,
    plainImages: images ? plain / images : 0,
    imageCount: images,
    contentSlides: content.length,
  };
}

function auditContent(deck) {
  const { readDeck } = require("../audit/fromDeck");
  const { analyzeDeck } = require("../audit/metrics");
  const result = analyzeDeck(readDeck(deck));
  return {
    decoration: result.decoration.perContentSlide || 0,
    motifs: result.decoration.groupsPerContentSlide || 0,
    overlap: result.composition.overlapShare || 0,
  };
}

function gateFailures(deck) {
  const measured = assess(deck);
  const content = auditContent(deck);
  const reasons = [];
  if (!(measured.density >= 3)) reasons.push("thin-decoration");
  if (content.decoration > 7) reasons.push("dense-decoration");
  if (content.motifs > 4) reasons.push("dense-motifs");
  if (!(measured.overlap >= 0.1)) reasons.push("low-overlap");
  if (content.overlap > 0.7) reasons.push("high-overlap");
  if (!(measured.bleed >= 0.1)) reasons.push("low-bleed");
  if (measured.imageCount > 0 && measured.plainImages > 0.4) reasons.push("plain-images");
  return reasons;
}

function ceilingFlags(deck) {
  const content = auditContent(deck);
  if (content.overlap >= 0.6 && content.overlap <= 0.7) return ["high-overlap"];
  return [];
}

module.exports = { assess, gateFailures, ceilingFlags, motifsOf, isPlainImage, auditContent };
