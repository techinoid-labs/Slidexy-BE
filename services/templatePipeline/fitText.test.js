/**
 * A string that cannot fit its box is caught for a wide serif and for a mono.
 * fitDeckText shrinks or clamps overflowing seed-style spans.
 *
 *   node services/templatePipeline/fitText.test.js
 */

const assert = require("assert");
const { textOverflow, fitDeckText, overflows } = require("./fitText");

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

const seedDeck = {
  tokens: { font: { display: "Amiko", text: "Roboto" } },
  layoutSequence: ["slide-1"],
  layouts: {
    "slide-1": {
      elements: [{
        id: "title",
        type: "text",
        x: 40,
        y: 40,
        width: 200,
        height: 48,
        textStyle: { fontSize: 36, lineHeight: 1.1, fontFamily: "Amiko" },
        textContent: {
          spans: [{ text: "Redefining limits of mechanical precision through aerodynamic excellence", fontSize: 36 }],
        },
      }],
    },
  },
};
assert.ok(
  overflows(
    seedDeck.layouts["slide-1"].elements[0].textContent.spans[0].text,
    200,
    48,
    36,
    1.1,
    "Roboto"
  ),
  "fixture should overflow before fit"
);
const actions = fitDeckText(seedDeck);
assert.ok(actions.length > 0, "fitDeckText should act on overflow");
const after = seedDeck.layouts["slide-1"].elements[0];
const afterSize = Number(after.textStyle.fontSize);
const afterText = after.textContent.spans.map((span) => span.text).join("");
assert.ok(
  !overflows(afterText, 200, 48, afterSize, 1.1, "Roboto"),
  "text should fit after fitDeckText"
);

const hugeTitle = {
  tokens: { font: { display: "Roboto", text: "Roboto" } },
  layoutSequence: ["slide-1"],
  layouts: {
    "slide-1": {
      elements: [{
        id: "s4-e5-t",
        type: "text",
        width: 604,
        height: 211,
        textStyle: { fontSize: 106.67, lineHeight: 1.07 },
        textContent: { spans: [{ text: "OUR SOLUTION", fontSize: 106.67 }] },
      }],
    },
  },
};
const comfort = fitDeckText(hugeTitle);
assert.ok(comfort.length > 0, "oversized title should get a comfort shrink");
assert.ok(Number(hugeTitle.layouts["slide-1"].elements[0].textStyle.fontSize) <= 64, "title comfort cap is 64");

console.log("fitText measurement test passed");
