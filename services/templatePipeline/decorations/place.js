/**
 * Places 3 or 4 motifs from one family on every slide.
 * About 40% of slides overlap two motifs. The rest stay clear of content.
 * Motifs stay inside the canvas.
 */

const { FAMILIES, byFamily } = require("./library");
const { CANVAS } = require("../deckSchema");

const FUNCTIONS = ["emphasis", "grouping", "rhythm", "texture", "transition"];
const W = CANVAS.width;
const H = CANVAS.height;

function clamp(x, y, w, h) {
  const width = Math.max(16, Math.min(w, W));
  const height = Math.max(12, Math.min(h, H));
  return {
    x: Math.round(Math.max(0, Math.min(W - width, x))),
    y: Math.round(Math.max(0, Math.min(H - height, y))),
    w: Math.round(width),
    h: Math.round(height),
  };
}

function textBoxes(elements) {
  return elements.filter((element) => element.type === "text").map((element) => ({
    x: element.x, y: element.y, w: element.width, h: element.height,
  }));
}

function overlapArea(a, b) {
  const width = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return width * height;
}

function hitsText(box, texts) {
  return texts.some((text) => overlapArea(box, text) > box.w * box.h * 0.12);
}

function hitsContent(box, elements) {
  return (elements || []).some((element) => {
    if (element.type === "text" || element.id === "bg") return false;
    if (element.width >= 1500 && element.height >= 800) return false;
    const other = { x: element.x, y: element.y, w: element.width, h: element.height };
    return overlapArea(box, other) >= 24;
  });
}

function touchesEdge(box) {
  return box.x <= 1 || box.y <= 1 || box.x + box.w >= W - 1 || box.y + box.h >= H - 1;
}

function elementFor(motif, box, index, fill) {
  return {
    id: "motif-" + index,
    type: "shape",
    x: box.x,
    y: box.y,
    width: box.w,
    height: box.h,
    zIndex: 6,
    opacity: motif.paint === "stroke" ? 0.9 : 0.42,
    shapeContent: {
      kind: "decor",
      decorName: "svg",
      fill,
      decorParams: {
        family: motif.family,
        elementId: motif.id,
        function: FUNCTIONS[index % FUNCTIONS.length],
        d: motif.d,
        viewBox: motif.viewBox,
        paint: motif.paint,
        strokeWidth: motif.strokeWidth,
      },
    },
  };
}

function sizeFor(motif, rng) {
  const long = rng() < 0.5 ? 72 : 128;
  let w;
  let h;
  if (motif.aspect >= 1) {
    w = Math.round(long * Math.min(motif.aspect, 3.2));
    h = Math.round(w / motif.aspect);
  } else {
    h = Math.round(long * Math.min(1 / motif.aspect, 3.2));
    w = Math.round(h * motif.aspect);
  }
  return { w: Math.max(18, Math.min(340, w)), h: Math.max(12, Math.min(240, h)) };
}

function spotsFor(box, rng, placed, forceEdge, overlap) {
  const spots = [];
  if (forceEdge) {
    spots.push([0, rng() * (H - box.h)]);
    spots.push([W - box.w, rng() * (H - box.h)]);
    spots.push([rng() * (W - box.w), 0]);
    spots.push([rng() * (W - box.w), H - box.h]);
  }
  if (overlap && placed.length) {
    const host = placed[Math.floor(rng() * placed.length)];
    spots.push([host.x + host.w * 0.35, host.y + host.h * 0.28]);
  }
  spots.push([rng() * (W - box.w), rng() * (H - box.h)]);
  spots.push([W - box.w, 24]);
  spots.push([24, H - box.h]);
  return spots;
}

function placeOnLayout(layout, catalog, rng, family, overlap) {
  const texts = textBoxes(layout.elements || []);
  const want = 3 + Math.floor(rng() * 2);
  const placed = [];
  let guard = 0;
  while (placed.length < want && guard < 100) {
    guard += 1;
    const motif = catalog[Math.floor(rng() * catalog.length)];
    const size = sizeFor(motif, rng);
    const forceEdge = !placed.some((item) => touchesEdge(item.box));
    const spots = spotsFor(size, rng, placed, forceEdge || rng() < 0.5, overlap);
    let chosen = null;
    for (let i = 0; i < spots.length; i += 1) {
      const box = clamp(spots[i][0], spots[i][1], size.w, size.h);
      if (hitsText(box, texts)) continue;
      if (!overlap && hitsContent(box, layout.elements)) continue;
      chosen = box;
      if (forceEdge && touchesEdge(box)) break;
    }
    if (!chosen) {
      const fallbacks = [
        clamp(0, 0, 48, 16),
        clamp(W - 48, 0, 48, 16),
        clamp(0, H - 20, 48, 16),
        clamp(W - 48, H - 20, 48, 16),
      ];
      chosen = fallbacks.find((box) => !hitsText(box, texts) && (overlap || !hitsContent(box, layout.elements))) || fallbacks[guard % fallbacks.length];
    }
    placed.push({ motif, box: chosen });
  }
  if (!placed.some((item) => touchesEdge(item.box))) {
    const w = Math.min(placed[0].box.w, 64);
    const h = Math.min(placed[0].box.h, 64);
    const edges = [clamp(0, 0, w, h), clamp(W - w, 0, w, h), clamp(0, H - h, w, h), clamp(W - w, H - h, w, h)];
    const clear = edges.find((box) => !hitsText(box, texts) && !hitsContent(box, layout.elements));
    if (clear) placed[0].box = clear;
  }
  const overlapped = placed.some((item, index) => placed.some((other, otherIndex) => index !== otherIndex && overlapArea(item.box, other.box) >= 24));
  if (overlap && !overlapped && placed.length > 1) {
    const host = placed[0].box;
    const cover = clamp(host.x + Math.min(16, host.w * 0.35), host.y + Math.min(8, host.h * 0.25), Math.min(placed[1].box.w, 72), Math.min(placed[1].box.h, 48));
    if (!hitsText(cover, texts)) placed[1].box = cover;
  }
  const decor = placed.map((item, index) => {
    const fill = "{color.accent}";
    const element = elementFor(item.motif, item.box, index, fill);
    return { element, record: {
      id: element.id,
      family,
      elementId: item.motif.id,
      function: element.shapeContent.decorParams.function,
      x: item.box.x,
      y: item.box.y,
      width: item.box.w,
      height: item.box.h,
    } };
  });
  layout.elements = (layout.elements || []).concat(decor.map((item) => item.element));
  layout.decor = decor.map((item) => item.record);
}

function placeDecorations(deck) {
  return (deck && deck.decorationFamily) || "";
}

module.exports = { placeDecorations, FUNCTIONS };
