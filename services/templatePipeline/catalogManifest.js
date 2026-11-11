/**
 * Shared catalog manifest for web + mobile sync.
 * Written on publish; also rebuilt by listCatalog / bake scripts.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const PUBLISHED = path.join(ROOT, "app-library", "published");
const MANIFEST_FILE = path.join(PUBLISHED, "_manifest.json");

const TIER_A_HINTS = ["mask", "typeTreatment", "layoutSequenceMotion", "cameraPan", "morph"];

function assertId(id) {
  const value = String(id || "");
  if (!/^[a-z0-9-]+$/.test(value)) throw new Error("Unknown deck");
  return value;
}

function slideNames(id) {
  const dir = path.join(PUBLISHED, assertId(id));
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => /^slide-\d{2}\.png$/.test(name))
    .sort();
}

function detectTier(deck) {
  const raw = JSON.stringify(deck || {});
  const hasMask = /"mask"\s*:/.test(raw) || /maskedImageContent/.test(raw);
  const hasFancyType = /"typeTreatment"\s*:\s*"(outline|long-shadow|offset-3d)"/.test(raw);
  const hasMotion =
    Boolean(deck && deck.motion && (deck.motion.morph || deck.motion.cameraPan || deck.motion.scatter)) ||
    /"-pan-"|-scatter-/.test(raw);
  if (hasMask || hasFancyType || hasMotion) return "A";
  return "B";
}

function capabilitiesFor(deck, id, tier) {
  const caps = ["pptx", "catalogPreview"];
  // Mobile caps only after an explicit Tier-B bake — raw published decks are not Firestore-ready.
  if (deck && deck.tierB && deck.tierB.baked) {
    caps.push("firestore", "generateDynamic");
  }
  if (slideNames(id).length) caps.push("slidePng");
  return caps;
}

function entryFromDeck(id, deck) {
  const tier = (deck && deck.mobileTier) || detectTier(deck);
  const cover = slideNames(id).find((slide) => slide === "slide-01.png") || slideNames(id)[0] || "";
  return {
    id,
    name: (deck && deck.name) || id,
    family: (deck && deck.family) || "",
    description: (deck && deck.description) || "",
    slideCount: Array.isArray(deck && deck.layoutSequence) ? deck.layoutSequence.length : slideNames(id).length,
    previewUrl: cover ? "/api/catalog/" + id + "/slides/" + cover : "",
    thumbnailUrl: cover ? "/api/catalog/" + id + "/slides/" + cover : "",
    tier,
    capabilities: capabilitiesFor(deck, id, tier),
    publishedAt: (deck && deck.publishedAt) || null,
    updatedAt: (deck && deck.publishedAt) || new Date().toISOString(),
    source: "be-published",
  };
}

function buildManifest() {
  if (!fs.existsSync(PUBLISHED)) {
    return { version: 1, updatedAt: new Date().toISOString(), decks: [] };
  }
  const decks = fs
    .readdirSync(PUBLISHED)
    .filter((name) => name.endsWith(".json") && name !== "_manifest.json" && fs.statSync(path.join(PUBLISHED, name)).isFile())
    .map((name) => {
      const id = name.replace(/\.json$/, "");
      let deck = {};
      try {
        deck = JSON.parse(fs.readFileSync(path.join(PUBLISHED, name), "utf8"));
      } catch (_) {
        deck = {};
      }
      return entryFromDeck(id, deck);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    rule: "BE app-library/published is SoT. Mobile requires Tier-B bake before Firestore.",
    decks,
  };
}

function writeManifest(manifest) {
  fs.mkdirSync(PUBLISHED, { recursive: true });
  const data = manifest || buildManifest();
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(data, null, 2) + "\n");
  return data;
}

function readManifest() {
  if (fs.existsSync(MANIFEST_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf8"));
    } catch (_) {
      /* rebuild */
    }
  }
  return writeManifest();
}

module.exports = {
  MANIFEST_FILE,
  PUBLISHED,
  TIER_A_HINTS,
  detectTier,
  entryFromDeck,
  buildManifest,
  writeManifest,
  readManifest,
  capabilitiesFor,
};
