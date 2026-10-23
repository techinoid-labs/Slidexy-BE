/**
 * A string that cannot fit its box is caught for a wide serif and for a mono.
 *
 *   node services/templatePipeline/fitText.test.js
 */

const assert = require("assert");
const { textOverflow } = require("./fitText");

function deck(font, title) {
  return {
    tokens: { font: { display: font, text: font } },
    previewSlides: [{ layout: "layoutTextOnly", title, bullets: [] }],
    layouts: {
      layoutTextOnly: {
        elements: [{
          type: "text",
          width: 160,
          height: 40,
          textStyle: { fontSize: 28, lineHeight: 1.15 },
          textContent: { binding: "title" },
        }],
      },
    },
  };
}

const tooWide = "M".repeat(20);
["Fraunces", "IBM Plex Mono", "Inter", "Source Sans 3"].forEach((font) => {
  const problems = textOverflow(deck(font, tooWide));
  assert.ok(problems.length > 0, font + " did not catch a string wider than the box");
  assert.strictEqual(textOverflow(deck(font, "Hi")).length, 0, font + " flagged a short title");
  assert.strictEqual(textOverflow(deck(font, "A—B")).length, 0, font + " threw on a dash");
});

console.log("fitText measurement test passed");
