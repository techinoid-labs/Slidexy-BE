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
["Fraunces", "IBM Plex Mono"].forEach((font) => {
  const problems = textOverflow(deck(font, tooWide));
  assert.ok(problems.length > 0, font + " did not catch a string wider than the box");
  assert.strictEqual(textOverflow(deck(font, "Hi")).length, 0, font + " flagged a short title");
});

console.log("fitText measurement test passed");

const { composeDeck } = require("./composeDeck");

function suppliedIdea() {
  return {
    name: "Harbor radio",
    title: "Harbor",
    subtitle: "Night watch",
    cover: "band",
    close: "left",
    density: "balanced",
    align: "left",
    designLanguage: "editorial",
    groundMode: "flat",
    photo: "",
    palette: {
      name: "Harbor",
      bg: "#F4F7F8",
      surface: "#E6EEEF",
      card: "#FFFFFF",
      ink: "#122026",
      muted: "#4C626A",
      rule: "#D0DEE2",
      accent: "#0E4D6C",
      accent2: "#C46B2F",
      onAccent: "#F4F7F8",
    },
    fonts: { display: "Fraunces", text: "Source Sans 3" },
  };
}

async function composedOverflow() {
  const deck = await composeDeck(7, suppliedIdea());
  const problems = textOverflow(deck);
  assert.ok(Array.isArray(problems), "textOverflow should return an array");
  assert.strictEqual(problems.length, 0, "a normal deck overflowed: " + problems.join(", "));
  deck.previewSlides[0].title = "M".repeat(80);
  const caught = textOverflow(deck);
  assert.ok(caught.some((item) => item.endsWith(" title")), "an oversized title was not caught");
  console.log("composed deck overflow test passed");
}

composedOverflow().catch((error) => {
  console.error(error);
  process.exit(1);
});
