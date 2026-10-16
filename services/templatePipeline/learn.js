/**
 * Learns from Ship / Discard. Next templates lean toward covers, densities,
 * alignments, and slide kinds that were shipped, and away from discarded ones.
 */

const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "..", "generated-templates");
const TASTE_FILE = path.join(DIR, "taste.json");

const BODY_SLIDES = [
  "layoutAgendaList",
  "layoutTimeline",
  "layoutStatHighlight",
  "layoutThreeUp",
  "layoutComparison",
  "layoutTeam",
  "layoutImageLeft",
  "layoutTextOnly",
  "layoutQuoteBanner",
];

const COVER_STYLES = ["photo", "band", "split", "browser", "type", "stack"];
const DENSITIES = ["airy", "balanced", "dense"];
const ALIGNS = ["left", "center", "asymmetric"];

function emptyBucket(keys) {
  return Object.fromEntries(keys.map((key) => [key, 0]));
}

function emptyTaste() {
  return {
    cover: emptyBucket(COVER_STYLES),
    density: emptyBucket(DENSITIES),
    align: emptyBucket(ALIGNS),
    slide: emptyBucket(BODY_SLIDES),
    reviews: 0,
  };
}

function ensureDir() {
  fs.mkdirSync(DIR, { recursive: true });
}

function loadTaste() {
  ensureDir();
  if (!fs.existsSync(TASTE_FILE)) return emptyTaste();
  try {
    const data = JSON.parse(fs.readFileSync(TASTE_FILE, "utf8"));
    const base = emptyTaste();
    ["cover", "density", "align", "slide"].forEach((group) => {
      Object.keys(base[group]).forEach((key) => {
        base[group][key] = Number(data[group] && data[group][key]) || 0;
      });
    });
    base.reviews = Number(data.reviews) || 0;
    return base;
  } catch (error) {
    return emptyTaste();
  }
}

function saveTaste(taste) {
  ensureDir();
  fs.writeFileSync(TASTE_FILE, JSON.stringify(taste, null, 2) + "\n", "utf8");
}

function featuresFromDeck(deck) {
  if (deck && deck.taste) {
    return {
      cover: deck.taste.cover,
      density: deck.taste.density,
      align: deck.taste.align,
      slides: Array.isArray(deck.taste.slides) ? deck.taste.slides : [],
    };
  }
  const parts = String((deck && deck.geometry) || "").split(".");
  const cover = COVER_STYLES.includes(parts[0]) ? parts[0] : null;
  const density = DENSITIES.includes(parts[1]) ? parts[1] : null;
  const align = ALIGNS.includes(parts[2]) ? parts[2] : null;
  const slides = (deck.layoutSequence || []).filter((id) => BODY_SLIDES.includes(id));
  return { cover, density, align, slides };
}

function bump(bucket, key, delta) {
  if (!key || !(key in bucket)) return;
  bucket[key] = (bucket[key] || 0) + delta;
}

function recordReview(deck, status) {
  if (status !== "ship" && status !== "discard") return loadTaste();
  const taste = loadTaste();
  const feat = featuresFromDeck(deck);
  const delta = status === "ship" ? 1 : -1;
  bump(taste.cover, feat.cover, delta);
  bump(taste.density, feat.density, delta);
  bump(taste.align, feat.align, delta);
  feat.slides.forEach((id) => bump(taste.slide, id, delta));
  taste.reviews += 1;
  saveTaste(taste);
  return taste;
}

function rebuildTasteFromDecks(decks) {
  const taste = emptyTaste();
  (decks || []).forEach((deck) => {
    const status = deck.status;
    if (status !== "ship" && status !== "discard") return;
    const feat = featuresFromDeck(deck);
    const delta = status === "ship" ? 1 : -1;
    bump(taste.cover, feat.cover, delta);
    bump(taste.density, feat.density, delta);
    bump(taste.align, feat.align, delta);
    feat.slides.forEach((id) => bump(taste.slide, id, delta));
    taste.reviews += 1;
  });
  saveTaste(taste);
  return taste;
}

function weightedPick(scores, keys) {
  const weights = keys.map((key) => Math.max(0.15, 1 + (scores[key] || 0)));
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < keys.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return keys[i];
  }
  return keys[keys.length - 1];
}

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function biasedStructure() {
  const taste = loadTaste();
  const density = weightedPick(taste.density, DENSITIES);
  const align = weightedPick(taste.align, ALIGNS);
  const count = 3 + Math.floor(Math.random() * 4);
  const ranked = BODY_SLIDES
    .slice()
    .sort((a, b) => (taste.slide[b] || 0) - (taste.slide[a] || 0) || Math.random() - 0.5);
  // Keep exploration: mix top preferred with a shuffled rest.
  const preferred = ranked.slice(0, 5);
  const rest = shuffle(ranked.slice(5));
  const pool = shuffle(preferred.concat(rest)).slice(0, Math.max(count, 3));
  const slides = shuffle(pool).slice(0, count);
  return { slides, density, align, preferredCover: weightedPick(taste.cover, COVER_STYLES) };
}

function topKeys(bucket, minScore) {
  return Object.entries(bucket)
    .filter(([, score]) => score >= minScore)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);
}

function bottomKeys(bucket, maxScore) {
  return Object.entries(bucket)
    .filter(([, score]) => score <= maxScore)
    .sort((a, b) => a[1] - b[1])
    .map(([key]) => key);
}

function tasteHints() {
  const taste = loadTaste();
  if (!taste.reviews) return "";
  const preferCover = topKeys(taste.cover, 1).slice(0, 2);
  const avoidCover = bottomKeys(taste.cover, -1).slice(0, 2);
  const preferSlide = topKeys(taste.slide, 1).slice(0, 3);
  const avoidSlide = bottomKeys(taste.slide, -1).slice(0, 3);
  const lines = ["Review taste from Ship/Discard (follow when it fits the subject):"];
  if (preferCover.length) lines.push("Prefer cover styles: " + preferCover.join(", ") + ".");
  if (avoidCover.length) lines.push("Avoid cover styles: " + avoidCover.join(", ") + ".");
  if (preferSlide.length) lines.push("Slide kinds that were shipped often: " + preferSlide.join(", ") + ".");
  if (avoidSlide.length) lines.push("Slide kinds that were discarded often: " + avoidSlide.join(", ") + ".");
  lines.push("Still invent a fresh subject and palette. Do not copy a past template.");
  return lines.join("\n");
}

module.exports = {
  BODY_SLIDES,
  COVER_STYLES,
  featuresFromDeck,
  recordReview,
  rebuildTasteFromDecks,
  biasedStructure,
  tasteHints,
  loadTaste,
};
