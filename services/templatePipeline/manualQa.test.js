/**
 * Manual QA skips vision and keeps geometry-only scoring.
 *
 *   node services/templatePipeline/manualQa.test.js
 */

const assert = require("assert");
const { analyzeDeck, checkGeometry } = require("./scoring/analyzeDeck");
const { visionQaEnabled } = require("./thematic");

assert.strictEqual(visionQaEnabled({ qa: "manual" }), false);
assert.strictEqual(visionQaEnabled({ qa: true }), true);
assert.strictEqual(visionQaEnabled({ vision: false }), false);

const deck = {
  layoutSequence: ["slide-1", "slide-2"],
  layouts: {
    "slide-1": {
      elements: [
        { type: "shape", x: 0, y: 0, width: 1600, height: 900, shapeContent: { fill: "#FFFFFF" } },
        { type: "text", x: 80, y: 80, width: 400, height: 80, textContent: { spans: [{ text: "Title", fontSize: 40, fill: "#111111" }] } },
      ],
    },
    "slide-2": {
      elements: [
        { type: "text", x: -50, y: 80, width: 400, height: 80, textContent: { spans: [{ text: "Off", fontSize: 40, fill: "#111111" }] } },
      ],
    },
  },
  tokens: { color: { bg: "#FFFFFF", ink: "#111111" } },
};

assert.strictEqual(checkGeometry(deck, "slide-1").pass, true);

async function main() {
  const analysis = await analyzeDeck(deck, [], { vision: false });
  assert.strictEqual(analysis.vision, false);
  assert.strictEqual(analysis.total, 2);
  assert.strictEqual(analysis.passed, 1);
  assert.strictEqual(analysis.score, 50);
  assert.strictEqual(analysis.slides[0].vision, null);
  assert.strictEqual(analysis.slides[0].pass, true);
  assert.strictEqual(analysis.slides[1].pass, false);
  console.log("manualQa test passed");
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
