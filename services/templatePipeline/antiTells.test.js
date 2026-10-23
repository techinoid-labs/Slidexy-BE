/**
 * Editorial decks may pair a serif with a warm ground.
 * The same pairing is still a tell for every other design language.
 *
 *   node services/templatePipeline/antiTells.test.js
 */

const assert = require("assert");
const { antiTells } = require("./antiTells");

const SERIFS = ["Fraunces", "Newsreader", "Libre Baskerville", "Source Serif 4", "Cormorant Garamond"];
const GROUNDS = ["#F8E6C8", "#F6F1E8", "#F4E4C8", "#F7E8D4", "#F3E2C4", "#F8EBD6", "#F5E6CC", "#F6E4C6", "#F9E7D0", "#F4E8D8"];

function deck(index, designLanguage) {
  return {
    taste: { designLanguage },
    tokens: {
      font: { display: SERIFS[index % SERIFS.length], text: "Source Sans 3" },
      color: { bg: GROUNDS[index], ink: "#24180f" },
    },
    layoutSequence: ["layoutTitleFocus"],
    layouts: { layoutTitleFocus: { elements: [] } },
    previewSlides: [{ title: "Field notes", bullets: ["A line"] }],
  };
}

for (let i = 0; i < 10; i += 1) {
  const tells = antiTells(deck(i, "editorial"), null, "editorial");
  assert.ok(!tells.includes("serif-on-cream"), "editorial deck " + i + " was rejected for serif-on-cream");
}

const flagged = antiTells(deck(0, "photographic"), null, "photographic");
assert.ok(flagged.includes("serif-on-cream"), "a non-editorial serif on a warm ground should still be flagged");

console.log("antiTells editorial test passed");
