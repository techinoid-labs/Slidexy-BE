const { validateDeck } = require("./generateDeck");
const { antiTells } = require("./antiTells");
const { textOverflow } = require("./fitText");
const { fingerprint, tooSimilar } = require("./similarity");
const { loadLibrary } = require("./library");
const { assess, gateFailures, ceilingFlags } = require("./decorations/measure");

function fingerprintsForGate() {
  const store = require("./store");
  return loadLibrary().map(fingerprint).concat(store.readAll().map(fingerprint));
}

function judge(deck, fingerprints) {
  const invalid = validateDeck(deck);
  if (invalid.length) return { ok: false, reason: "invalid" };
  const tells = deck.tells || antiTells(deck, null, deck.taste && deck.taste.designLanguage);
  if (tells.length >= 3) return { ok: false, reason: "ai-tells" };
  let overflow = false;
  try {
    overflow = textOverflow(deck).length > 0;
  } catch (error) {
    overflow = false;
  }
  if (overflow) return { ok: false, reason: "text-overflow" };
  const design = gateFailures(deck);
  if (design.length) return { ok: false, reason: design[0], measures: assess(deck) };
  if (tooSimilar(deck, fingerprints || fingerprintsForGate())) return { ok: false, reason: "too-similar" };
  const flags = ceilingFlags(deck);
  if (flags.includes("high-overlap")) {
    console.error("high-overlap " + (deck.id || "deck"));
  }
  return { ok: true, flags, measures: assess(deck) };
}

module.exports = { judge, fingerprintsForGate, fingerprint, assess, gateFailures };
