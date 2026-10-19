/**
 * The old assembler and the unused body-layout builders are gone.
 * Validation stays.
 *
 *   node services/templatePipeline/deadCode.test.js
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = __dirname;
assert.ok(!fs.existsSync(path.join(root, "assembleDeck.js")), "assembleDeck.js is still present");

const generateDeck = require("./generateDeck");
assert.strictEqual(typeof generateDeck.validateDeck, "function");
assert.strictEqual(typeof generateDeck.generateDeck, "function");
assert.strictEqual(generateDeck.buildSimpleDeck, undefined);
assert.strictEqual(generateDeck.PALETTES, undefined);
assert.strictEqual(generateDeck.FONT_PAIRS, undefined);

const compose = fs.readFileSync(path.join(root, "composeDeck.js"), "utf8");
["function agenda(", "function timeline(", "function stat(", "const builders", "previewCopy"].forEach((needle) => {
  assert.ok(!compose.includes(needle), "composeDeck still contains " + needle);
});
assert.ok(compose.includes("function ideaCover("));
assert.ok(compose.includes("function close("));
assert.ok(compose.includes("buildStrategy"));

const invalid = generateDeck.validateDeck({ schemaVersion: 1, layoutSequence: ["layoutTitleFocus"] });
assert.ok(invalid.some((error) => /schemaVersion/.test(error)));

console.log("dead code test passed");
