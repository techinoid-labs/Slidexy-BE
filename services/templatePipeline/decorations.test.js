/**
 * Decoration library and the hard design gates on an empty deck.
 *
 *   node services/templatePipeline/decorations.test.js
 */

const assert = require("assert");
const { FAMILIES, elements, counts } = require("./decorations/library");
const { gateFailures } = require("./decorations/measure");

function bareDeck() {
  const slide = (id, elements) => ({ version: 2, id, canvas: { width: 1600, height: 900 }, elements });
  const text = { id: "title", type: "text", x: 80, y: 80, width: 400, height: 80, textContent: { binding: "title" } };
  const image = { id: "photo", type: "image", x: 80, y: 200, width: 400, height: 300, imageContent: { binding: "image" } };
  return {
    schemaVersion: 2,
    layoutSequence: ["layoutTitleFocus", "layoutTextOnly", "layoutClosingCta"],
    layouts: {
      layoutTitleFocus: slide("layoutTitleFocus", [text, image]),
      layoutTextOnly: slide("layoutTextOnly", [text, image]),
      layoutClosingCta: slide("layoutClosingCta", [text]),
    },
    tokens: { color: { ink: "#122026", bg: "#F4F7F8", accent: "#0E4D6C" } },
  };
}

function main() {
  assert.ok(elements.length >= 100, "library has " + elements.length);
  FAMILIES.forEach((family) => {
    assert.ok(counts[family] >= 12, family + " has " + counts[family]);
    elements.filter((item) => item.family === family).forEach((item) => {
      assert.ok(item.d.includes("M"), item.id + " has no path");
    });
  });

  const thin = bareDeck();
  const failed = gateFailures(thin);
  assert.ok(failed.includes("thin-decoration"), failed.join(","));
  assert.ok(failed.includes("low-overlap"), failed.join(","));
  assert.ok(failed.includes("low-bleed"), failed.join(","));
  assert.ok(failed.includes("plain-images"), failed.join(","));
  console.log("decorations ok", JSON.stringify(counts), "total", elements.length);
}

main();
