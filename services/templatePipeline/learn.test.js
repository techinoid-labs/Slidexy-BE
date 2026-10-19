/**
 * A shipped strategy name is recorded. A role id still goes in the role bucket.
 *
 *   node services/templatePipeline/learn.test.js
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { recordReview, STRATEGY_NAMES } = require("./learn");

const file = path.join(__dirname, "..", "..", "generated-templates", "taste.json");
const previous = fs.existsSync(file) ? fs.readFileSync(file) : null;

try {
  if (fs.existsSync(file)) fs.unlinkSync(file);
  const shipped = recordReview({
    taste: { cover: "photo", density: "balanced", align: "left", slides: ["sequence.rail"] },
  }, "ship");
  assert.strictEqual(shipped.strategy["sequence.rail"], 1);
  assert.strictEqual(shipped.slide["sequence.rail"], undefined);
  assert.strictEqual(STRATEGY_NAMES.length, 19);
  assert.ok(STRATEGY_NAMES.includes("sequence.rail"));

  const role = recordReview({
    taste: { cover: "photo", density: "balanced", align: "left", slides: ["layoutTimeline"] },
  }, "ship");
  assert.ok(role.slide.layoutTimeline >= 1);
  assert.strictEqual(role.strategy.layoutTimeline, undefined);
} finally {
  if (previous) fs.writeFileSync(file, previous);
  else if (fs.existsSync(file)) fs.unlinkSync(file);
}

console.log("strategy taste test passed");
