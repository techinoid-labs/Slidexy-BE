/**
 * node-canvas line counts using the wrapRuns path behind textWasClipped
 * (textLineWidths → wrapRuns at scale 1).
 */

const { textLineWidths } = require("../../../scripts/slideSvg");

function countCanvasLines(element, tokens) {
  if (!element || element.type !== "text") return { lines: 0 };
  const widths = textLineWidths(element, tokens || {});
  return {
    lines: widths.length,
    lineWidths: widths,
    chromeMeasure: element.textMeasure && element.textMeasure.lines,
  };
}

function countDeckCanvasLines(deck, layoutId) {
  const layout = deck.layouts && deck.layouts[layoutId || (deck.layoutSequence || [])[0]];
  const out = {};
  (layout && layout.elements || []).forEach((el) => {
    if (!el || el.type !== "text") return;
    out[el.id] = countCanvasLines(el, deck.tokens);
  });
  return out;
}

module.exports = { countCanvasLines, countDeckCanvasLines };
