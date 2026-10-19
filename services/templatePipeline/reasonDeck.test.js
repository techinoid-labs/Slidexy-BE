/**
 * The reasoning step must give a deck four different jobs, and the
 * compositions for one job must not share a screen.
 *
 *   node services/templatePipeline/reasonDeck.test.js
 */

const assert = require("assert");
const { planReasoning, buildStrategy, STRATEGIES } = require("./reasonDeck");

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

function shape(id, x, y, w, h, fill, z, radius) {
  return { id, type: "shape", x, y, width: w, height: h, zIndex: z, shapeContent: { fill, cornerRadius: radius } };
}

function text(id, x, y, w, h, style, content, extra) {
  return {
    id, type: "text", x, y, width: w, height: h, zIndex: 8,
    textStyle: { fontSize: style.size },
    textContent: content,
    ...(extra || {}),
  };
}

function item(binding, index) {
  return { content: { binding }, extra: { itemIndex: index, visibleWhen: "hasLabeledItem" } };
}

function photo(id, x, y, w, h, url, z) {
  return { id, type: "image", x, y, width: w, height: h, zIndex: z, imageContent: { url } };
}

const kit = {
  ground: () => [shape("bg", 0, 0, 1600, 900, "#fff", 0)],
  shape, text, photo, item,
  m: 96, r: 8, W: 1600, H: 900,
  D: "Fraunces", F: "Source Sans 3",
  ink: "#111", muted: "#666", accent: "#b85a2a", card: "#f4efe6", bg: "#f7f4ee", on: "#fff",
  photoUrl: "https://example.test/photo.jpg",
};

function fingerprint(elements) {
  return elements
    .filter((element) => element.type === "text" || element.type === "image" || (element.type === "shape" && element.id !== "bg"))
    .map((element) => [element.type, element.id, element.x, element.y, element.width, element.height].join(":"))
    .sort()
    .join("|");
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

Object.entries(STRATEGIES).forEach(([job, names]) => {
  const prints = names.map((name) => fingerprint(buildStrategy(name, kit)));
  assert.strictEqual(new Set(prints).size, names.length, job + " strategies share a screen");
  names.forEach((name) => {
    buildStrategy(name, kit).forEach((element) => {
      assert.ok(element.x >= 0 && element.y >= 0, name + " " + element.id + " is above or left of the canvas");
      assert.ok(element.x + element.width <= 1601 && element.y + element.height <= 901, name + " " + element.id + " leaves the canvas");
    });
  });
});

const jobSets = decks.map((deck) => deck.reasoning.map((step) => step.job).sort().join("+"));
assert.ok(new Set(jobSets).size >= 4, "decks keep the same four jobs");

console.log("reasoning test passed");
console.log("distinct job mixes in 24 decks:", new Set(jobSets).size);
console.log("busiest composition:", (top / steps * 100).toFixed(0) + "%");
