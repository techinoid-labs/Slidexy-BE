const fs = require("fs");
const path = require("path");
const { rebuildTasteFromDecks } = require("./learn");

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

module.exports = {
  listTemplates,
  readTemplate,
  readAll,
  writeDeck,
  reviewTemplate,
  takenGeometries,
  DIR,
};
