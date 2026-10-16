/**
 * Generates fresh decks with the current pipeline for the design audit.
 * Same generator and gates as a batch run, but nothing is written to the
 * catalog: decks go to audit/samples/ours/.
 *
 *   node services/templatePipeline/audit/sampleOurs.js [count]
 */

const fs = require("fs");
const path = require("path");
const { generateDeck } = require("../generateDeck");
const { judge, fingerprintsForGate, fingerprint } = require("../gates");
const store = require("../store");

const OUT = path.join(__dirname, "samples", "ours");

async function sampleOurs(count) {
  fs.mkdirSync(OUT, { recursive: true });
  const existing = fs.readdirSync(OUT).filter((name) => name.startsWith("gen-") && name.endsWith(".json"));
  const prints = fingerprintsForGate();
  const seen = new Set(store.takenGeometries());
  for (const name of existing) {
    const deck = JSON.parse(fs.readFileSync(path.join(OUT, name), "utf8"));
    prints.push(fingerprint(deck));
    seen.add(deck.geometry);
  }
  const reasons = {};
  let saved = existing.length;
  let attempts = 0;
  let seed = (Date.now() % 100000) || 1;
  const started = new Date().toISOString();
  while (saved < count && attempts < count * 6) {
    attempts += 1;
    seed += 1;
    let deck;
    try {
      deck = await generateDeck(seed);
    } catch (error) {
      const reason = error.tells ? "ai-tells" : error.status ? "invalid" : "error";
      reasons[reason] = (reasons[reason] || 0) + 1;
      console.log(`seed ${seed}: ${reason} (${error.message.slice(0, 120)})`);
      continue;
    }
    if (seen.has(deck.geometry)) {
      reasons.duplicate = (reasons.duplicate || 0) + 1;
      continue;
    }
    const result = judge(deck, prints);
    if (!result.ok) {
      reasons[result.reason] = (reasons[result.reason] || 0) + 1;
      console.log(`seed ${seed}: ${result.reason}`);
      continue;
    }
    deck.status = "audit-sample";
    deck.createdAt = new Date().toISOString();
    fs.writeFileSync(path.join(OUT, deck.id + ".json"), JSON.stringify(deck, null, 2) + "\n", "utf8");
    seen.add(deck.geometry);
    prints.push(fingerprint(deck));
    saved += 1;
    console.log(`seed ${seed}: saved ${deck.id} "${deck.name}" (${saved}/${count})`);
  }
  const run = { started, finished: new Date().toISOString(), wanted: count, saved, attempts, rejected: reasons };
  fs.writeFileSync(path.join(OUT, "_run.json"), JSON.stringify(run, null, 2) + "\n", "utf8");
  return run;
}

if (require.main === module) {
  sampleOurs(Number(process.argv[2]) || 20)
    .then((run) => console.log(JSON.stringify(run)))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { sampleOurs, OUT };
