/**
 * Reads the visual DNA of a converted deck.
 *
 *   node services/templatePipeline/dna/extract.js
 */

const fs = require("fs");
const path = require("path");
const { normHex } = require("./color");

const ROLES = ["bg", "surface", "ink", "muted", "accent", "card"];
const MOTIFS = ["rectangle", "roundedRect", "ellipse", "path", "arch"];
const SEEDS = ["health-medical", "cinema-neon", "company-minimal"];

function leaf(element) {
  if (element && element.type === "rotated" && element.element) return leaf(element.element);
  return element;
}

function eachElement(deck, visit) {
  const sequence = deck.layoutSequence || Object.keys(deck.layouts || {});
  for (const id of sequence) {
    const layout = deck.layouts && deck.layouts[id];
    if (!layout) continue;
    const canvas = layout.canvas || { width: 1600, height: 900 };
    for (const element of layout.elements || []) visit(element, canvas, id);
  }
}

function textSize(element) {
  const spans = element.textContent && element.textContent.spans;
  if (Array.isArray(spans)) {
    const sizes = spans.map((span) => Number(span.fontSize)).filter((size) => size > 0);
    if (sizes.length) return sizes[0];
  }
  const size = Number(element.textStyle && element.textStyle.fontSize);
  return size > 0 ? size : null;
}

function typeScale(deck) {
  const samples = [];
  eachElement(deck, (element) => {
    const node = leaf(element);
    if (!node || node.type !== "text") return;
    const size = textSize(node);
    if (size) samples.push(Math.round(size));
  });
  const empty = { h1_ratio: 1, h2_ratio: 1, h3_ratio: 1, body_ratio: 1 };
  if (!samples.length) return empty;
  const groups = [];
  samples.slice().sort((a, b) => a - b).forEach((size) => {
    const last = groups[groups.length - 1];
    if (last && Math.abs(size - last.size) <= 2) {
      last.total += size;
      last.count += 1;
      last.size = last.total / last.count;
    } else {
      groups.push({ size, total: size, count: 1 });
    }
  });
  groups.sort((a, b) => b.size - a.size);
  const bodyGroup = groups.slice().sort((a, b) => b.count - a.count || a.size - b.size)[0];
  const body = bodyGroup.size;
  const h1 = groups[0].size;
  const between = groups.filter((group) => group.size < h1 - 1 && group.size > body + 1);
  const h2 = between[0] ? between[0].size : h1;
  const h3 = between[1] ? between[1].size : (between[0] ? between[0].size : body);
  const ratio = (size) => Math.round((size / body) * 100) / 100;
  return {
    h1_ratio: ratio(h1),
    h2_ratio: ratio(h2),
    h3_ratio: ratio(h3),
    body_ratio: 1,
  };
}

function spacingGrid(deck) {
  const counts = new Map();
  eachElement(deck, (element, canvas) => {
    if (element.width >= canvas.width - 8 && element.height >= canvas.height - 8) return;
    const edges = [
      element.x,
      element.y,
      canvas.width - (element.x + element.width),
      canvas.height - (element.y + element.height),
    ];
    edges.forEach((value) => {
      if (value < 8 || value > 280) return;
      const snapped = Math.round(value / 4) * 4;
      counts.set(snapped, (counts.get(snapped) || 0) + 1);
    });
  });
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  const picked = ranked.filter((entry) => entry[1] >= 2).slice(0, 5);
  ranked.forEach((entry) => {
    if (picked.length >= 3) return;
    if (!picked.some((item) => item[0] === entry[0])) picked.push(entry);
  });
  return picked.slice(0, 5).map((entry) => entry[0]).sort((a, b) => a - b);
}

function ownColors(element) {
  const found = [];
  const look = (node, skipChild) => {
    if (!node || typeof node !== "object") return;
    const entries = Array.isArray(node) ? node.entries() : Object.entries(node);
    for (const [key, value] of entries) {
      if (skipChild && key === "element") continue;
      const hex = normHex(value);
      if (hex) found.push(hex);
      else if (value && typeof value === "object") look(value, false);
    }
  };
  look(element, element.type === "rotated");
  return found;
}

function palette(deck) {
  const tokens = (deck.tokens && deck.tokens.color) || {};
  const elements = [];
  eachElement(deck, (element) => elements.push(element));
  const total = elements.length || 1;
  const colors = {};
  ROLES.forEach((role) => {
    const hex = normHex(tokens[role]);
    let hits = 0;
    if (hex) {
      elements.forEach((element) => {
        if (ownColors(element).includes(hex)) hits += 1;
      });
    }
    colors[role] = {
      hex: hex || null,
      percent: Math.round((hits / total) * 1000) / 10,
    };
  });
  return colors;
}

function fullBleed(box, canvas) {
  const area = box.width * box.height;
  return area >= canvas.width * canvas.height * 0.75
    || (box.width >= canvas.width * 0.92 && box.height >= canvas.height * 0.75);
}

function bucketFor(content, box, canvas, masked) {
  const treatment = content && content.treatment;
  const clip = content && content.clip;
  if (treatment === "duotone") return "duotoned";
  if (treatment === "mat" || treatment === "frame") return "matted";
  if (masked || (clip && clip.kind && clip.kind !== "rect")) return "masked";
  if (clip && clip.kind === "rect" && Number(clip.cornerRadius) > 0) return "masked";
  if (fullBleed(box, canvas)) return "full_bleed";
  return "plain";
}

function photoTreatments(deck) {
  const buckets = { full_bleed: 0, masked: 0, matted: 0, duotoned: 0, plain: 0 };
  eachElement(deck, (element, canvas) => {
    const node = leaf(element);
    if (!node) return;
    if (node.type === "image") buckets[bucketFor(node.imageContent, element, canvas, false)] += 1;
    if (node.type === "maskedImage") buckets[bucketFor(node.maskedImageContent, element, canvas, true)] += 1;
    if (node.type === "collage") {
      const cells = (node.collageContent && node.collageContent.cells) || [];
      cells.forEach((cell) => {
        const box = {
          x: element.x + cell.x,
          y: element.y + cell.y,
          width: cell.width,
          height: cell.height,
        };
        buckets[bucketFor(cell, box, canvas, false)] += 1;
      });
    }
  });
  const total = Object.values(buckets).reduce((sum, n) => sum + n, 0) || 1;
  const share = {};
  Object.keys(buckets).forEach((key) => {
    share[key] = Math.round((buckets[key] / (Object.values(buckets).reduce((sum, n) => sum + n, 0) || 1)) * 1000) / 10;
  });
  if (!Object.values(buckets).some((n) => n > 0)) {
    return { full_bleed: 0, masked: 0, matted: 0, duotoned: 0, plain: 0 };
  }
  return share;
}

function motifOf(element) {
  const node = leaf(element);
  if (!node) return null;
  if (node.type === "illustration") return "path";
  if (node.type === "shape") {
    const body = node.shapeContent || {};
    const kind = body.kind || "rectangle";
    if (kind === "ellipse") return "ellipse";
    if (kind === "arch") return "arch";
    if (kind === "path" || kind === "custom") return "path";
    if (kind === "roundRect" || kind === "roundedRect" || Number(body.cornerRadius) > 0) return "roundedRect";
    return "rectangle";
  }
  if (node.type === "maskedImage") {
    const clip = node.maskedImageContent && node.maskedImageContent.clip;
    if (!clip) return null;
    if (clip.kind === "arch") return "arch";
    if (clip.kind === "ellipse") return "ellipse";
    if (clip.kind === "path") return "path";
    if (clip.kind === "rect" && Number(clip.cornerRadius) > 0) return "roundedRect";
    if (clip.kind === "rect") return "rectangle";
  }
  return null;
}

function motifSignature(deck) {
  const counts = {};
  MOTIFS.forEach((kind) => { counts[kind] = 0; });
  eachElement(deck, (element) => {
    const kind = motifOf(element);
    if (kind && counts[kind] != null) counts[kind] += 1;
  });
  return MOTIFS.map((kind) => ({ kind, count: counts[kind] }));
}

function extractDna(deck) {
  return {
    id: deck.id,
    typeScale: typeScale(deck),
    spacingGrid: spacingGrid(deck),
    palette: palette(deck),
    photoTreatments: photoTreatments(deck),
    motifSignature: motifSignature(deck),
  };
}

function librarySeedIds(library) {
  if (!fs.existsSync(library)) return [];
  return fs.readdirSync(library)
    .filter((name) => name.endsWith(".json") && !name.endsWith(".dna.json"))
    .map((name) => name.slice(0, -".json".length))
    .sort();
}

function writeSeedDna(root) {
  const library = path.join(root, "app-library");
  return librarySeedIds(library).map((id) => {
    const deck = JSON.parse(fs.readFileSync(path.join(library, id + ".json"), "utf8"));
    const dna = extractDna(deck);
    const file = path.join(library, id + ".dna.json");
    if (fs.existsSync(file)) {
      try {
        const previous = JSON.parse(fs.readFileSync(file, "utf8"));
        ["qualityScore", "recommendedUse", "scoreFailures", "disabled", "scoredAt", "scorePrompt", "scoreMethod"].forEach((key) => {
          if (previous[key] != null) dna[key] = previous[key];
        });
      } catch (error) { /* keep the fresh extract */ }
    }
    fs.writeFileSync(file, JSON.stringify(dna, null, 2) + "\n");
    return dna;
  });
}

if (require.main === module) {
  const root = path.join(__dirname, "..", "..", "..");
  const written = writeSeedDna(root);
  written.forEach((dna) => console.log(JSON.stringify(dna)));
}

module.exports = {
  extractDna,
  writeSeedDna,
  eachElement,
  leaf,
  textSize,
  SEEDS,
  ROLES,
};
