const { validateDeck } = require("./generateDeck");
const { antiTells } = require("./antiTells");
const { textOverflow } = require("./fitText");
const { fingerprint, tooSimilar } = require("./similarity");
const { loadLibrary } = require("./library");

function fingerprintsForGate() {
  const store = require("./store");
  return loadLibrary().map(fingerprint).concat(store.readAll().map(fingerprint));
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  if (sorted.length === 1) return sorted[0];
  const index = p * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return sorted[lower] * (1 - (index - lower)) + sorted[upper] * (index - lower);
}

function aestheticFlag(deck) {
  const score = deck.scores && deck.scores.aesthetic_mean;
  if (typeof score !== "number") return null;
  const store = require("./store");
  const means = store.readAll()
    .filter((item) => item.id !== deck.id && item.scores && typeof item.scores.aesthetic_mean === "number")
    .map((item) => item.scores.aesthetic_mean)
    .sort((a, b) => a - b);
  const boundary = percentile(means, 0.25);
  if (boundary == null || !(score < boundary)) return null;
  return boundary;
}

function judge(deck, fingerprints) {
  const invalid = validateDeck(deck);
  if (invalid.length) return { ok: false, reason: "invalid" };
  const tells = deck.tells || antiTells(deck, null, deck.taste && deck.taste.designLanguage);
  if (tells.length >= 3) return { ok: false, reason: "ai-tells" };
  if (textOverflow(deck).length) return { ok: false, reason: "text-overflow" };
  if (tooSimilar(deck, fingerprints || fingerprintsForGate())) return { ok: false, reason: "too-similar" };
  const flags = [];
  const boundary = aestheticFlag(deck);
  if (boundary != null) {
    flags.push("low-aesthetic");
    console.error("low-aesthetic " + (deck.id || "deck") + " " + deck.scores.aesthetic_mean + " below " + boundary);
  }
  return { ok: true, flags };
}

module.exports = { judge, fingerprintsForGate, fingerprint };
