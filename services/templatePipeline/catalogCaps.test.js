/**
 * Generates 50 decks through the catalog sampler and asserts no capped
 * axis ends above 20%.
 *
 *   node services/templatePipeline/catalogCaps.test.js
 */

const assert = require("assert");
const {
  CAP, AXES, planGeneration, pickCapped, shares, readCatalog, nudgePalette, paletteBucket,
} = require("./catalogCaps");

const PALETTES = {
  "light-warm": { bg: "#f6efe6", accent: "#b85a2a", ink: "#24180f" },
  "light-cool": { bg: "#eef3f6", accent: "#2f6f8f", ink: "#142028" },
  "light-neutral": { bg: "#f3f1ee", accent: "#8a8175", ink: "#1c1916" },
  "dark-warm": { bg: "#1c1410", accent: "#d4784a", ink: "#f6efe6" },
  "dark-cool": { bg: "#12181c", accent: "#7eb0c8", ink: "#e7eef2" },
  "dark-neutral": { bg: "#161616", accent: "#b7b1a6", ink: "#f4f1ea" },
};

function deckFromPlan(plan, index) {
  return {
    id: "cap-" + index,
    taste: {
      cover: plan.cover,
      groundMode: plan.groundMode,
      designLanguage: plan.designLanguage,
    },
    tokens: {
      font: { display: plan.displayFont, text: plan.textFont },
      color: PALETTES[plan.paletteBucket],
    },
    layouts: {},
  };
}

function generate(start, count) {
  const decks = start.slice();
  for (let i = 0; i < count; i += 1) {
    decks.push(deckFromPlan(planGeneration(decks), i));
  }
  return decks;
}

function assertCaps(decks, label) {
  const report = shares(decks);
  const breaches = [];
  for (const axis of AXES) {
    const share = report[axis].topShare;
    if (share > CAP + 1e-9) breaches.push(`${axis} ${report[axis].top} ${(share * 100).toFixed(1)}%`);
  }
  assert.strictEqual(breaches.length, 0, label + " breached: " + breaches.join("; "));
  return report;
}

const fresh = generate([], 50);
assert.strictEqual(fresh.length, 50);
const freshReport = assertCaps(fresh, "50 new decks");

const stored = readCatalog();
const extended = generate(stored, 50);
assert.strictEqual(extended.length, stored.length + 50);
const extendedReport = assertCaps(extended, "stored catalog plus 50");

const nudged = nudgePalette(
  { bg: "#121418", surface: "#1c2128", card: "#242b33", ink: "#f4f1ea", accent: "#e2b15a", accent2: "#d4784a", onAccent: "#121418" },
  "light-cool",
);
assert.strictEqual(paletteBucket(nudged.bg, nudged.accent), "light-cool");

const dominated = [];
for (let i = 0; i < 9; i += 1) {
  dominated.push({
    tokens: { font: { display: "Fraunces", text: "Source Sans 3" }, color: PALETTES["light-warm"] },
    taste: { cover: "photo", groundMode: "flat", designLanguage: "editorial" },
  });
}
dominated.push({
  tokens: { font: { display: "Outfit", text: "Figtree" }, color: PALETTES["light-cool"] },
  taste: { cover: "band", groundMode: "noise", designLanguage: "technical" },
});
for (let i = 0; i < 12; i += 1) {
  const plan = planGeneration(dominated, () => 0);
  assert.notStrictEqual(plan.displayFont, "Fraunces", "a font at 90% was chosen again");
}

assert.throws(
  () => pickCapped({ A: 25, B: 25, C: 25, D: 25 }, 100, ["A", "B", "C", "D"], () => 0),
  (error) => error.code === "catalog-saturated",
);
assert.strictEqual(pickCapped({}, 0, ["A", "B"], () => 0), "A");

console.log("50 fresh decks, top share per axis:");
for (const axis of AXES) {
  const row = freshReport[axis];
  console.log(`  ${axis}: ${row.top} ${(row.topShare * 100).toFixed(1)}%`);
}
console.log(`stored ${stored.length} + 50, top share per axis:`);
for (const axis of AXES) {
  const row = extendedReport[axis];
  console.log(`  ${axis}: ${row.top} ${(row.topShare * 100).toFixed(1)}% of ${row.total}`);
}
console.log("catalog cap test passed");
