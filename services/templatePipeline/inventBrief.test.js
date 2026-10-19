/**
 * A model response that ignores the reserved fonts is rejected.
 *
 *   node services/templatePipeline/inventBrief.test.js
 */

const assert = require("assert");
const { parseBrief } = require("./inventBrief");

const structure = { slides: ["layoutTextOnly"], density: "balanced", align: "left", preferredCover: "photo" };
const plan = { displayFont: "Fraunces", textFont: "Source Sans 3" };

function raw(display, text) {
  return JSON.stringify({
    idea: "Harbor radio",
    title: "Harbor radio",
    subtitle: "The night watch",
    cover: "photo",
    photoQuery: "harbor radio room",
    palette: {
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
    fonts: { display, text },
  });
}

assert.throws(
  () => parseBrief(raw("Inter", "Roboto"), structure, plan),
  /catalog reserved/,
  "a response with different fonts should be rejected",
);

const brief = parseBrief(raw("Fraunces", "Source Sans 3"), structure, plan);
assert.strictEqual(brief.fonts.display, "Fraunces");
assert.strictEqual(brief.fonts.text, "Source Sans 3");

console.log("inventBrief font test passed");
