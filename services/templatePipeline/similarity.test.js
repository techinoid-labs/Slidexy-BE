/**
 * A layout id is the phone app's role for a slide. The composition's
 * identity is the strategy. Two strategies may share a role.
 *
 *   node services/templatePipeline/similarity.test.js
 */

const assert = require("assert");
const { fingerprint, similarity } = require("./similarity");
const { PREFERRED_LAYOUT, LAYOUT_POOL } = require("./reasonDeck");

function slide(id, x) {
  return {
    elements: [
      { type: "text", x, y: 80, width: 400, height: 80, textContent: { binding: "title" } },
    ],
  };
}

function deck(layoutId, strategy, x) {
  return {
    reasoning: strategy ? [{ layoutId, strategy, job: strategy.split(".")[0], confidence: 1 }] : [],
    layoutSequence: [layoutId],
    layouts: { [layoutId]: slide(layoutId, x) },
  };
}

const bleed = deck("layoutFullBleedHero", "narrative.bleed", 0);
const corner = deck("layoutFullBleedHero", "emphasis.corner", 400);
assert.strictEqual(similarity(fingerprint(bleed), fingerprint(corner)), 0, "same role, different strategy, should not match");

const bleedOnAgenda = deck("layoutAgendaList", "narrative.bleed", 0);
assert.strictEqual(similarity(fingerprint(bleed), fingerprint(bleedOnAgenda)), 1, "same strategy and boxes should match across roles");

const oldA = deck("layoutTimeline", null, 0);
const oldB = deck("layoutTimeline", null, 0);
assert.strictEqual(similarity(fingerprint(oldA), fingerprint(oldB)), 1, "decks without a strategy still compare by role");

const roles = new Set(LAYOUT_POOL);
Object.values(PREFERRED_LAYOUT).forEach((id) => {
  assert.ok(roles.has(id), id + " is not a role the app already knows");
});
assert.ok(new Set(Object.values(PREFERRED_LAYOUT)).size < Object.keys(PREFERRED_LAYOUT).length, "strategies are allowed to share a role");

console.log("similarity identity test passed");
