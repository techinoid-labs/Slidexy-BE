/**
 * Score one seed with the hybrid scorer.
 *
 *   node scripts/score_seeds.js <layout-id>
 *   node scripts/score_seeds.js --all
 *   node scripts/score_seeds.js --all --resume
 *
 * Generates a deck for "A company overview.", then analyzeDeck.js.
 * A slide passes only when geometry, vision, and quality_score >= 0.6 all pass.
 * qualityScore is the percentage of passing slides. scoreFailures lists why the rest failed.
 * scoreMethod "hybrid-v2" is the bleed-aware scorer. --resume skips seeds already scored that way
 * and overwrites an older hybrid score.
 * Existing DNA fields are kept.
 */

const fs = require("fs");
const path = require("path");
const { injectTheme } = require("../services/templatePipeline/thematic");
const { analyzeDeck } = require("../services/templatePipeline/scoring/analyzeDeck");

const ROOT = path.join(__dirname, "..");
const LIBRARY = path.join(ROOT, "app-library");
const PROMPT = "A company overview.";
const KEEP = ["qualityScore", "recommendedUse", "scoreFailures", "disabled", "scoredAt", "scorePrompt", "scoreMethod"];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function walk(elements, visit) {
  (elements || []).forEach((element) => {
    if (!element) return;
    visit(element);
    if (element.type === "rotated" && element.element) walk([element.element], visit);
    if (Array.isArray(element.children)) walk(element.children, visit);
  });
}

function recommendedUse(deck) {
  const slides = (deck.layoutSequence || Object.keys(deck.layouts || {})).length || 1;
  let imageArea = 0;
  let textCount = 0;
  let fullBleed = false;
  (deck.layoutSequence || Object.keys(deck.layouts || {})).forEach((id) => {
    const layout = deck.layouts && deck.layouts[id];
    walk(layout && layout.elements, (element) => {
      const width = Number(element.width) || 0;
      const height = Number(element.height) || 0;
      if (element.type === "text") textCount += 1;
      if (element.type === "image" || element.type === "maskedImage") {
        imageArea += width * height;
        const x = Number(element.x) || 0;
        const y = Number(element.y) || 0;
        if (x <= 8 && y <= 8 && x + width >= 1592 && y + height >= 892) fullBleed = true;
      }
    });
  });
  const ratio = imageArea / (1600 * 900 * slides);
  if (fullBleed || ratio >= 0.25) return "Photo-heavy";
  if (textCount / slides >= 8 && ratio < 0.18) return "Text-heavy";
  return "Corporate";
}

function writeScore(layoutId, fields) {
  const file = path.join(LIBRARY, layoutId + ".dna.json");
  let dna = { id: layoutId };
  if (fs.existsSync(file)) {
    try {
      const previous = readJson(file);
      if (previous && typeof previous === "object") dna = previous;
    } catch (error) { /* start a new dna file */ }
  }
  dna.id = dna.id || layoutId;
  KEEP.forEach((key) => {
    if (fields[key] != null) dna[key] = fields[key];
  });
  fs.writeFileSync(file, JSON.stringify(dna, null, 2) + "\n");
  return dna;
}

async function scoreSeed(layoutId) {
  const deckFile = path.join(LIBRARY, layoutId + ".json");
  if (!fs.existsSync(deckFile)) throw new Error("Layout not found: " + layoutId);
  const deck = readJson(deckFile);
  const use = recommendedUse(deck);
  const out = path.join(ROOT, "docs", "template-pipeline", "seed-scores", layoutId);
  fs.mkdirSync(out, { recursive: true });
  let qualityScore = 0;
  let error = null;
  let failures = [];
  let reviewed = 0;
  try {
    const result = await injectTheme({ prompt: PROMPT, layout: layoutId, out });
    const generated = readJson(path.join(out, "deck.json"));
    const analysis = await analyzeDeck(generated, result.slides || []);
    qualityScore = analysis.score;
    failures = analysis.failures;
    reviewed = analysis.slides.filter((slide) => slide.vision).length;
    analysis.slides.forEach((slide) => {
      const label = slide.pass ? "pass" : "fail";
      const why = slide.reasons.length ? " (" + slide.reasons.join(", ") + ")" : "";
      console.log("  slide " + String(slide.slide).padStart(2, "0") + " " + label + why);
    });
    failures.forEach((reason) => console.log("  Failed because of " + reason));
  } catch (failure) {
    error = failure && failure.message ? failure.message : String(failure);
    failures = [error];
    console.error("  score failed: " + error);
  }
  writeScore(layoutId, {
    qualityScore,
    recommendedUse: use,
    scoreFailures: failures,
    scoredAt: new Date().toISOString(),
    scorePrompt: PROMPT,
    scoreMethod: "hybrid-v2",
  });
  const summary = { id: layoutId, qualityScore, recommendedUse: use, reviewed, failures, error };
  console.log("score " + layoutId + " " + qualityScore + " " + use);
  return summary;
}

function hybridDone(layoutId) {
  const file = path.join(LIBRARY, layoutId + ".dna.json");
  if (!fs.existsSync(file)) return false;
  try {
    const dna = readJson(file);
    return dna.scoreMethod === "hybrid-v2" && Number.isFinite(Number(dna.qualityScore));
  } catch (error) {
    return false;
  }
}

function layoutIds() {
  return fs.readdirSync(LIBRARY)
    .filter((name) => name.endsWith(".json") && !name.endsWith(".dna.json"))
    .map((name) => name.replace(/\.json$/, ""))
    .sort();
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: node scripts/score_seeds.js <layout-id> | --all");
    process.exit(1);
  }
  const ids = arg === "--all" ? layoutIds() : [arg];
  const resume = process.argv.includes("--resume");
  for (const id of ids) {
    if (resume && hybridDone(id)) {
      console.log("skip " + id);
      continue;
    }
    await scoreSeed(id);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error && error.message ? error.message : error);
    process.exit(1);
  });
}

module.exports = { scoreSeed, recommendedUse, PROMPT };
