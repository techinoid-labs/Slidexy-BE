const { validateDeck } = require("./generateDeck");
const { antiTells } = require("./antiTells");
const { textOverflow } = require("./fitText");
const { fingerprint, tooSimilar } = require("./similarity");
const { loadLibrary } = require("./library");

function fingerprintsForGate() {
  const store = require("./store");
  return loadLibrary().map(fingerprint).concat(store.readAll().map(fingerprint));
}

function judge(deck, fingerprints) {
  const invalid = validateDeck(deck);
  if (invalid.length) return { ok: false, reason: "invalid" };
  const tells = deck.tells || antiTells(deck, null, deck.taste && deck.taste.designLanguage);
  if (tells.length >= 3) return { ok: false, reason: "ai-tells" };
  if (textOverflow(deck).length) return { ok: false, reason: "text-overflow" };
  if (tooSimilar(deck, fingerprints || fingerprintsForGate())) return { ok: false, reason: "too-similar" };
  return { ok: true };
}

module.exports = { judge, fingerprintsForGate, fingerprint };
