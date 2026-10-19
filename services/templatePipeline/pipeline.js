const path = require("path");
const { generateDeck } = require("./generateDeck");
const { judge, fingerprintsForGate, fingerprint } = require("./gates");
const store = require("./store");
const { scoreDeckFile } = require("./aestheticScore");

function wantedScore(options) {
  return Boolean(options && options.score) || process.argv.includes("--score");
}

function writeScored(deck, score) {
  store.writeDeck(deck);
  if (!score) return deck;
  try {
    const scores = scoreDeckFile(path.join(store.DIR, deck.id + ".json"));
    if (!scores) return deck;
    deck.scores = scores;
    store.writeDeck(deck);
    judge(deck);
  } catch (error) {
    process.stderr.write(String(error && error.message || error) + "\n");
  }
  return deck;
}

async function runBatch(count, options) {
  const wanted = Math.min(50, Math.max(1, Number(count) || 20));
  const saved = [];
  const reasons = {};
  const seen = new Set(store.takenGeometries());
  const prints = fingerprintsForGate();
  let seed = (Date.now() % 100000) || 1;

  for (let attempt = 0; attempt < wanted * 8 && saved.length < wanted; attempt += 1) {
    seed += 1;
    let deck;
    try {
      deck = await generateDeck(seed);
    } catch (error) {
      const reason = error.tells ? "ai-tells" : "invalid";
      reasons[reason] = (reasons[reason] || 0) + 1;
      continue;
    }
    if (!deck || seen.has(deck.geometry)) {
      reasons.duplicate = (reasons.duplicate || 0) + 1;
      continue;
    }
    const result = judge(deck, prints);
    if (!result.ok) {
      reasons[result.reason] = (reasons[result.reason] || 0) + 1;
      continue;
    }
    deck.status = "candidate";
    writeScored(deck, wantedScore(options));
    seen.add(deck.geometry);
    prints.push(fingerprint(deck));
    saved.push({ id: deck.id, name: deck.name, seed: deck.seed, status: deck.status });
  }

  const rejected = Object.values(reasons).reduce((sum, n) => sum + n, 0);
  return { saved, rejected, reasons };
}

module.exports = { runBatch };
