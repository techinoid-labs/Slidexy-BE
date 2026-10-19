/**
 * Generic faces may be the body font. They may not be the display font.
 *
 *   node services/templatePipeline/fontRoles.test.js
 */

const assert = require("assert");
const { planGeneration, DISPLAY_FONTS, TEXT_FONTS } = require("./catalogCaps");

const BODY_ONLY = ["Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins"];

for (const font of BODY_ONLY) {
  assert.ok(TEXT_FONTS.includes(font), font + " should be available as a body font");
  assert.ok(!DISPLAY_FONTS.includes(font), font + " should not be a display font");
}
assert.ok(DISPLAY_FONTS.includes("Antonio"));
assert.ok(DISPLAY_FONTS.includes("Archivo Black"));

function deck(textFont) {
  return {
    tokens: {
      font: { display: "Fraunces", text: textFont },
      color: { bg: "#F4F7F8", accent: "#0E4D6C" },
    },
    taste: { cover: "photo", groundMode: "flat", designLanguage: "editorial" },
  };
}

const crowded = TEXT_FONTS.filter((font) => font !== "Montserrat").map(deck);
const chosen = planGeneration(crowded, () => 0);
assert.strictEqual(chosen.textFont, "Montserrat");
assert.ok(!BODY_ONLY.includes(chosen.displayFont), chosen.displayFont);

for (let step = 0; step < 80; step += 1) {
  const plan = planGeneration([], () => (step % 19) / 19);
  assert.ok(!BODY_ONLY.includes(plan.displayFont), plan.displayFont + " was chosen as the display font");
}

console.log("font role test passed");
