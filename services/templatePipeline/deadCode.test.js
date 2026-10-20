/**
 * The generator is gone. Validation stays.
 *
 *   node services/templatePipeline/deadCode.test.js
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = __dirname;
assert.ok(!fs.existsSync(path.join(root, "assembleDeck.js")), "assembleDeck.js is still present");
assert.ok(!fs.existsSync(path.join(root, "composeDeck.js")), "composeDeck.js is still present");

const generateDeck = require("./generateDeck");
assert.strictEqual(typeof generateDeck.validateDeck, "function");
assert.strictEqual(generateDeck.generateDeck, undefined);
assert.strictEqual(generateDeck.buildSimpleDeck, undefined);

const reason = require("./reasonDeck");
assert.strictEqual(reason.buildStrategy, undefined);

const invalid = generateDeck.validateDeck({ schemaVersion: 1, layoutSequence: ["layoutTitleFocus"] });
assert.ok(invalid.some((error) => /schemaVersion/.test(error)));

console.log("dead code test passed");
