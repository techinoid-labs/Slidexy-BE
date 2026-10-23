/**
 * Prints each scored deck in generated-templates, lowest mean first,
 * and the 25th, 50th, and 75th percentile boundaries.
 *
 *   node scripts/report_aesthetic_scores.js
 */

const { readAll } = require("../services/templatePipeline/store");

function percentile(sorted, p) {
  if (!sorted.length) return null;
  if (sorted.length === 1) return sorted[0];
  const index = p * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return sorted[lower] * (1 - (index - lower)) + sorted[upper] * (index - lower);
}

const decks = readAll()
  .filter((deck) => deck.scores && typeof deck.scores.aesthetic_mean === "number")
  .sort((a, b) => a.scores.aesthetic_mean - b.scores.aesthetic_mean);

if (!decks.length) {
  console.log("No scored decks in generated-templates.");
  process.exit(0);
}

const means = decks.map((deck) => deck.scores.aesthetic_mean);
console.log("decks " + decks.length);
console.log("p25 " + percentile(means, 0.25).toFixed(4));
console.log("p50 " + percentile(means, 0.5).toFixed(4));
console.log("p75 " + percentile(means, 0.75).toFixed(4));
decks.forEach((deck) => {
  console.log(deck.scores.aesthetic_mean.toFixed(4) + "  " + deck.id + "  " + (deck.name || ""));
});
