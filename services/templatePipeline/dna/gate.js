const { contrast, hexToHsl, hueDistance, normHex } = require("./color");
const { extractDna, eachElement, leaf, textSize, ROLES } = require("./extract");

function dominantColors(deck) {
  let bg = null;
  let bgArea = -1;
  const textCounts = new Map();
  const fillCounts = new Map();
  eachElement(deck, (element) => {
    const node = leaf(element);
    if (!node) return;
    if (node.type === "shape" && node.shapeContent) {
      const hex = normHex(node.shapeContent.fill);
      if (hex) {
        fillCounts.set(hex, (fillCounts.get(hex) || 0) + 1);
        const area = element.width * element.height;
        if (area > bgArea) {
          bgArea = area;
          bg = hex;
        }
      }
    }
    if (node.type === "illustration" && node.illustrationContent) {
      const hex = normHex(node.illustrationContent.fill);
      if (hex) fillCounts.set(hex, (fillCounts.get(hex) || 0) + 1);
    }
    if (node.type === "text") {
      const spans = node.textContent && node.textContent.spans;
      let hex = null;
      if (Array.isArray(spans)) {
        spans.some((span) => {
          hex = normHex(span.color);
          return Boolean(hex);
        });
      }
      if (!hex) hex = normHex(node.textStyle && node.textStyle.color);
      if (hex) textCounts.set(hex, (textCounts.get(hex) || 0) + 1);
    }
  });
  const ink = [...textCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const accent = [...fillCounts.entries()]
    .filter(([hex]) => hex !== bg && hexToHsl(hex).s >= 0.15)
    .sort((a, b) => b[1] - a[1])[0];
  return { bg, ink: ink ? ink[0] : null, accent: accent ? accent[0] : null };
}

function near(a, b, tolerance) {
  return Math.abs(Number(a) - Number(b)) <= tolerance;
}

function structureRows(deck) {
  const rows = [];
  eachElement(deck, (element) => {
    const node = leaf(element) || {};
    const clip = node.maskedImageContent && node.maskedImageContent.clip;
    const image = node.imageContent || node.maskedImageContent || {};
    rows.push([
      element.type,
      Math.round(element.x),
      Math.round(element.y),
      Math.round(element.width),
      Math.round(element.height),
      textSize(node) || "",
      (node.illustrationContent && node.illustrationContent.d) || "",
      (clip && clip.kind) || "",
      image.alignX == null ? "" : image.alignX,
      image.alignY == null ? "" : image.alignY,
    ].join("|"));
  });
  return rows;
}

function gateAgainstDna(variant, seed) {
  const failures = [];
  const got = extractDna(variant);
  const want = extractDna(seed);
  ["h1_ratio", "h2_ratio", "h3_ratio", "body_ratio"].forEach((key) => {
    if (!near(got.typeScale[key], want.typeScale[key], 0.02)) {
      failures.push("typeScale." + key + " is " + got.typeScale[key] + ", seed is " + want.typeScale[key]);
    }
  });
  if (got.spacingGrid.join(",") !== want.spacingGrid.join(",")) {
    failures.push("spacingGrid changed from [" + want.spacingGrid.join(", ") + "] to [" + got.spacingGrid.join(", ") + "]");
  }
  got.motifSignature.forEach((item, index) => {
    const seedItem = want.motifSignature[index];
    if (item.count !== seedItem.count) {
      failures.push("motif " + item.kind + " is " + item.count + ", seed is " + seedItem.count);
    }
  });
  Object.keys(want.photoTreatments).forEach((key) => {
    if (!near(got.photoTreatments[key], want.photoTreatments[key], 0.6)) {
      failures.push("photoTreatments." + key + " is " + got.photoTreatments[key] + ", seed is " + want.photoTreatments[key]);
    }
  });
  ROLES.forEach((role) => {
    if (!near(got.palette[role].percent, want.palette[role].percent, 0.6)) {
      failures.push("palette." + role + " usage is " + got.palette[role].percent + "%, seed is " + want.palette[role].percent + "%");
    }
  });
  const seedRows = structureRows(seed);
  const variantRows = structureRows(variant);
  if (seedRows.join("\n") !== variantRows.join("\n")) {
    failures.push("positions, font sizes, mask shapes, or illustration paths changed");
  }
  const seedColor = (seed.tokens && seed.tokens.color) || {};
  const nextColor = (variant.tokens && variant.tokens.color) || {};
  const paintBefore = dominantColors(seed);
  const paintAfter = dominantColors(variant);
  [
    ["token ink/bg", seedColor.ink, seedColor.bg, nextColor.ink, nextColor.bg],
    ["token accent/bg", seedColor.accent, seedColor.bg, nextColor.accent, nextColor.bg],
    ["ink/bg", paintBefore.ink, paintBefore.bg, paintAfter.ink, paintAfter.bg],
    ["accent/bg", paintBefore.accent, paintBefore.bg, paintAfter.accent, paintAfter.bg],
  ].forEach(([label, beforeFg, beforeBg, afterFg, afterBg]) => {
    if (!beforeFg || !beforeBg || !afterFg || !afterBg) return;
    const delta = Math.abs(contrast(afterFg, afterBg) - contrast(beforeFg, beforeBg));
    if (delta > 0.5 + 1e-6) failures.push(label + " contrast moved by " + delta.toFixed(2));
  });
  ROLES.forEach((role) => {
    const before = normHex(seedColor[role]);
    const after = normHex(nextColor[role]);
    if (!before || !after) return;
    const from = hexToHsl(before);
    const to = hexToHsl(after);
    if (from.s < 0.12) {
      if (to.s >= 0.2) failures.push(role + " left the neutral family");
      return;
    }
    const distance = hueDistance(from.h, to.h);
    if (distance > 40) failures.push(role + " hue moved " + Math.round(distance) + " degrees, past an adjacent hue");
  });
  [
    ["background", paintBefore.bg, paintAfter.bg],
    ["ink", paintBefore.ink, paintAfter.ink],
    ["accent", paintBefore.accent, paintAfter.accent],
  ].forEach(([label, before, after]) => {
    if (!before || !after) return;
    const from = hexToHsl(before);
    const to = hexToHsl(after);
    if (from.s < 0.12) {
      if (to.s >= 0.2) failures.push(label + " left the neutral family");
      return;
    }
    const distance = hueDistance(from.h, to.h);
    if (distance > 40) failures.push(label + " hue moved " + Math.round(distance) + " degrees, past an adjacent hue");
  });
  return { ok: failures.length === 0, failures, dna: got };
}

module.exports = { gateAgainstDna, dominantColors };
