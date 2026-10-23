/**
 * One signature device per deck, painted behind the type.
 * The same geometry lives in Slidexy-FE/src/templates/signature.ts.
 */

const CANVAS_W = 1600;
const CANVAS_H = 900;
const FRAME = 2;
const RAIL = 48;
const DEVICES = ["frame", "rail"];

function pickIndex(seed, count) {
  let hash = 2166136261;
  const text = String(seed || "");
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % count;
}

function pickSignature(prompt) {
  return DEVICES[pickIndex("sig:deck:" + String(prompt || ""), DEVICES.length)];
}

function bar(id, x, y, width, height, fill, zIndex) {
  return {
    id,
    type: "shape",
    x,
    y,
    width,
    height,
    zIndex,
    shapeContent: { kind: "rect", fill, cornerRadius: 0 },
  };
}

function signatureElements(device, accent, slideId) {
  const color = accent || "#1C1916";
  const suffix = slideId ? "-" + slideId : "";
  if (device === "rail") {
    return [bar("signature-rail" + suffix, 0, 0, RAIL, CANVAS_H, color, 3)];
  }
  return [
    bar("signature-frame-top" + suffix, 0, 0, CANVAS_W, FRAME, color, 40),
    bar("signature-frame-bottom" + suffix, 0, CANVAS_H - FRAME, CANVAS_W, FRAME, color, 40),
    bar("signature-frame-left" + suffix, 0, 0, FRAME, CANVAS_H, color, 40),
    bar("signature-frame-right" + suffix, CANVAS_W - FRAME, 0, FRAME, CANVAS_H, color, 40),
  ];
}

function injectSignature(deck, prompt, palette) {
  const device = pickSignature(prompt);
  const accent = (palette && (palette.accent || palette.ink)) || "#1C1916";
  const ids = deck.layoutSequence || Object.keys(deck.layouts || {});
  ids.forEach((id) => {
    const layout = deck.layouts && deck.layouts[id];
    if (!layout) return;
    const existing = layout.elements || [];
    layout.elements = signatureElements(device, accent, id).concat(existing.filter((element) => {
      const name = String(element && element.id || "");
      return name.indexOf("signature-") !== 0;
    }));
  });
  return device;
}

module.exports = {
  FRAME,
  RAIL,
  DEVICES,
  pickSignature,
  signatureElements,
  injectSignature,
};
