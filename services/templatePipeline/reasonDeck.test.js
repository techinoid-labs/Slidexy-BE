/**
 * The reasoning step must give a deck four different jobs, and the
 * compositions for one job must not share a screen.
 *
 *   node services/templatePipeline/reasonDeck.test.js
 */

const assert = require("assert");
const { planReasoning, STRATEGIES } = require("./reasonDeck");

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const decks = [];
for (let i = 0; i < 24; i += 1) {
  const reasoning = planReasoning(decks, mulberry32(i + 3));
  assert.strictEqual(reasoning.length, 4, "a deck has four body slides");
  assert.strictEqual(new Set(reasoning.map((step) => step.job)).size, 4, "jobs do not repeat inside a deck");
  assert.strictEqual(new Set(reasoning.map((step) => step.layoutId)).size, 4, "layout ids do not repeat");
  decks.push({ reasoning });
}

const strategyCounts = {};
let steps = 0;
decks.forEach((deck) => {
  deck.reasoning.forEach((step) => {
    strategyCounts[step.strategy] = (strategyCounts[step.strategy] || 0) + 1;
    steps += 1;
  });
});
const top = Math.max(...Object.values(strategyCounts));
assert.ok(top / steps <= 0.4, "a composition is more than 40% of body slides: " + top + "/" + steps);

const jobSets = decks.map((deck) => deck.reasoning.map((step) => step.job).sort().join("+"));
assert.ok(new Set(jobSets).size >= 4, "decks keep the same four jobs");

const coverCounts = {};
Object.values(STRATEGIES).flat().forEach((name) => { coverCounts[name] = 0; });
for (let seed = 1; seed <= 10; seed += 1) {
  planReasoning([], mulberry32(seed)).forEach((step) => {
    coverCounts[step.strategy] += 1;
  });
}
Object.entries(coverCounts).forEach(([name, times]) => {
  assert.ok(times >= 1, name + " was not planned from an empty catalog");
  assert.ok(times <= 3, name + " was planned " + times + " times");
});

console.log("reasoning test passed");
console.log("empty-catalog counts", coverCounts);
console.log("distinct job mixes in 24 decks:", new Set(jobSets).size);
console.log("busiest composition:", (top / steps * 100).toFixed(0) + "%");
