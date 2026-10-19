const fs = require("fs");
const path = require("path");
const { generateDeck } = require("./generateDeck");
const { judge, fingerprintsForGate } = require("./gates");
const { rebuildTasteFromDecks } = require("./learn");
const { scoreDeckFile } = require("./aestheticScore");

const DIR = path.join(__dirname, "..", "..", "generated-templates");

function ensureDir() {
  fs.mkdirSync(DIR, { recursive: true });
}

function files() {
  ensureDir();
  return fs.readdirSync(DIR).filter((name) => name.endsWith(".json") && name !== "rejects.json" && name !== "taste.json");
}

function readAll() {
  return files().map((name) => JSON.parse(fs.readFileSync(path.join(DIR, name), "utf8")));
}

function summary(deck) {
  return {
    id: deck.id,
    name: deck.name,
    description: deck.description,
    seed: deck.seed,
    geometry: deck.geometry,
    status: deck.status || "candidate",
    accent: deck.tokens && deck.tokens.color && deck.tokens.color.accent,
    bg: deck.tokens && deck.tokens.color && deck.tokens.color.bg,
  };
}

function listTemplates(status) {
  return readAll()
    .map(summary)
    .filter((item) => !status || item.status === status);
}

function readTemplate(id) {
  const file = path.join(DIR, id + ".json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function takenGeometries() {
  return new Set(readAll().map((deck) => deck.geometry).filter(Boolean));
}

function writeDeck(deck) {
  ensureDir();
  if (!deck.status) deck.status = "candidate";
  if (!deck.createdAt) deck.createdAt = new Date().toISOString();
  fs.writeFileSync(
    path.join(DIR, deck.id + ".json"),
    JSON.stringify(deck, null, 2) + "\n",
    "utf8",
  );
  return deck;
}

function reviewTemplate(id, status) {
  if (status !== "ship" && status !== "discard" && status !== "candidate") {
    const error = new Error("Status must be ship, discard, or candidate");
    error.status = 400;
    throw error;
  }
  const deck = readTemplate(id);
  if (!deck) return null;
  deck.status = status;
  deck.reviewedAt = new Date().toISOString();
  const saved = writeDeck(deck);
  rebuildTasteFromDecks(readAll());
  return saved;
}

/**
 * Writes one template that passes the gates.
 * Skips seeds that fail, or that repeat a layout already saved.
 */
function wantedScore(options) {
  return Boolean(options && options.score) || process.argv.includes("--score");
}

async function createTemplate(seed, options) {
  ensureDir();
  const prints = fingerprintsForGate();
  const start = Number.isFinite(Number(seed)) ? (Number(seed) >>> 0) || 1 : (Date.now() % 100000) || 1;
  const taken = takenGeometries();
  const reasons = {};
  let chosen = null;
  for (let step = 0; step < 4; step += 1) {
    const candidateSeed = (start + step) >>> 0 || 1;
    let deck;
    try {
      deck = await generateDeck(candidateSeed);
    } catch (error) {
      const reason = error.tells ? "ai-tells" : "invalid";
      reasons[reason] = (reasons[reason] || 0) + 1;
      if (error.tells || error.status) continue;
      throw error;
    }
    if (!deck || taken.has(deck.geometry)) {
      reasons.duplicate = (reasons.duplicate || 0) + 1;
      continue;
    }
    const result = judge(deck, prints);
    if (!result.ok) {
      reasons[result.reason] = (reasons[result.reason] || 0) + 1;
      continue;
    }
    chosen = deck;
    break;
  }
  if (!chosen) {
    const top = Object.entries(reasons).sort((a, b) => b[1] - a[1])[0];
    const error = new Error(
      top
        ? "No template passed the checks. Most were rejected for " + top[0] + "."
        : "No template passed the checks.",
    );
    error.status = 409;
    throw error;
  }
  const saved = writeDeck(chosen);
  if (!wantedScore(options)) return saved;
  try {
    const scores = scoreDeckFile(path.join(DIR, saved.id + ".json"));
    if (!scores) return saved;
    saved.scores = scores;
    writeDeck(saved);
    judge(saved);
  } catch (error) {
    process.stderr.write(String(error && error.message || error) + "\n");
  }
  return saved;
}

module.exports = {
  listTemplates,
  readTemplate,
  readAll,
  createTemplate,
  writeDeck,
  reviewTemplate,
  takenGeometries,
  DIR,
};
