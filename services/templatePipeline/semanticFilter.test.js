/**
 * seedFitsPrompt keeps Illustration-heavy and disabled seeds off the wrong prompts.
 *
 *   node services/templatePipeline/semanticFilter.test.js
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { seedFitsPrompt } = require("./thematic");

const source = fs.readFileSync(path.join(__dirname, "thematic.js"), "utf8");
const tableMatch = source.match(/function industryMatch[\s\S]*?const lists = (\{[\s\S]*?\n  \});/);
assert.ok(tableMatch, "industryMatch keyword table was not found in thematic.js");
const lists = Function("return (" + tableMatch[1] + ")")();

assert.deepStrictEqual(lists.health, ["health", "medical", "medicine", "hospital", "doctor", "clinic"]);
assert.deepStrictEqual(lists.music, ["music", "musician", "orchestra"]);
assert.deepStrictEqual(lists.cinema, ["cinema", "film", "movie"]);
assert.deepStrictEqual(lists.fitness, ["fitness", "trainer", "gym"]);

const medical = {
  id: "health-medical",
  semanticType: "Illustration-heavy",
  industry: "health",
  disabled: true,
  recommendedUse: "Corporate",
  qualityScore: 100,
};

assert.strictEqual(
  seedFitsPrompt(medical, "Corporate", "A corporate payroll company"),
  false,
  "payroll must not use the medical seed"
);
assert.strictEqual(
  seedFitsPrompt(medical, "Corporate", "A hospital network"),
  true,
  "hospital must match health industry"
);

lists.health.forEach((word) => {
  assert.strictEqual(
    seedFitsPrompt(medical, "Corporate", "A " + word + " company"),
    true,
    "health keyword from thematic.js must accept: " + word
  );
});

const chrome = {
  id: "black-and-grey-3d-shapes",
  semanticType: "Illustration-heavy",
  industry: "",
  disabled: true,
  recommendedUse: "Corporate",
  qualityScore: 93,
};

assert.strictEqual(seedFitsPrompt(chrome, "Corporate", "A tech company"), false);
assert.strictEqual(seedFitsPrompt(chrome, "Corporate", "A 3D chrome tech company"), false);

assert.strictEqual(
  seedFitsPrompt(medical, "Corporate", "A medical clinic"),
  true,
  "disabled health seed stays available for a health prompt"
);

const abstract = {
  id: "beige-abstract",
  semanticType: "Abstract",
  industry: "",
  disabled: false,
  recommendedUse: "Corporate",
  qualityScore: 90,
};
const photo = {
  id: "white-photo",
  semanticType: "Photo-driven",
  industry: "",
  disabled: false,
  recommendedUse: "Corporate",
  qualityScore: 80,
};

assert.strictEqual(seedFitsPrompt(abstract, "Corporate", "A corporate payroll company"), true);
assert.strictEqual(seedFitsPrompt(photo, "Corporate", "A corporate payroll company"), true);
assert.strictEqual(seedFitsPrompt(abstract, "Text-heavy", "A strategy report"), true);
assert.strictEqual(seedFitsPrompt(photo, "Photo-heavy", "A travel magazine"), true);

console.log("semanticFilter test passed");
