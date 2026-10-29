/**
 * Facade for the live template builders.
 * Run 2: only Engine v1 kit path (`kit-v1` / generateKitV1).
 * Seed rewrite / native / composer / assemble / remix are no longer callable here.
 */

const fs = require("fs");
const path = require("path");
const thematic = require("./thematic");
const { assembleDeck } = require("./assemble_deck");
const { generate: generateNative } = require("./thematic-native");
const { remixSeeds } = require("./mutate_layout");
const { finishDeck, listSlideFiles } = require("./composer/finishDeck");

const ROOT = path.join(__dirname, "..", "..");

/** In-process test stubs (themeOnce / inventDirection / Pexels / compose deps). */
let testDeps = null;
function setTestDeps(deps) {
  testDeps = deps || null;
  try {
    require("./composer/composeRuntime").setTestDeps(deps);
  } catch (error) { /* composeRuntime optional during early load */ }
}
function getTestDeps() {
  return testDeps;
}

function slideEntries(slides, outDir) {
  if (Array.isArray(slides) && slides.length) {
    return slides.map((item, index) => {
      if (item && typeof item === "object") {
        const name = item.name || path.basename(item.url || item.path || ("slide-" + String(index + 1).padStart(2, "0") + ".png"));
        return { name, url: item.url || item.path || path.join(outDir, name) };
      }
      const file = String(item);
      return { name: path.basename(file), url: file };
    });
  }
  return listSlideFiles(outDir).map((file) => ({ name: path.basename(file), url: file }));
}

/**
 * Map any builder return into the shared Phase 5a result shape.
 */
function normalizeResult(mode, raw) {
  const source = raw || {};
  const outDir = source.outDir ? path.resolve(ROOT, source.outDir) : "";
  let deck = source.deck || null;
  if (!deck && outDir && fs.existsSync(path.join(outDir, "deck.json"))) {
    deck = JSON.parse(fs.readFileSync(path.join(outDir, "deck.json"), "utf8"));
  }
  if (!deck) deck = {};
  const report = source.report || {};
  const slides = slideEntries(source.slides, outDir);
  const analysis = source.analysis || deck.qa || null;
  const vibe = source.vibe
    || report.bucket
    || report.vibe
    || (source.selection && source.selection.vibe)
    || (source.assembly && source.assembly.designLanguage)
    || (report.mood && report.mood.bucket)
    || "";
  const layoutId = source.layoutId || source.layout || (mode === "composer" ? "composer" : "") || "";
  return {
    id: source.id || source.deckId || deck.id || "",
    name: source.name || deck.name || "",
    outDir: source.outDir || outDir,
    deck,
    slides,
    analysis,
    vibe,
    layoutId,
    layoutIdB: source.layoutIdB || "",
    remix: source.remix || null,
    assembly: source.assembly || null,
    pptxUrl: source.pptxUrl || "",
    prompt: source.prompt || report.prompt || "",
    plan: source.plan || (report.brief && report.brief.plan) || undefined,
    fallbacks: source.fallbacks || report.fallbacks || undefined,
    fits: source.fits || report.fits || undefined,
    nonce: source.nonce != null ? source.nonce : report.nonce,
    report,
  };
}

async function runPipeline(options) {
  const settings = options || {};
  const mode = settings.mode;

  if (mode && mode !== "kit-v1" && process.env.ENGINE_V1 !== "true") {
    throw new Error(
      "unsupported mode '" +
        mode +
        "' — seed rewrite / native / composer / assemble / remix were removed in run 2; use kit-v1"
    );
  }

  require("ts-node/register/transpile-only");
  const { generateKitV1 } = require("../../engine/generateKitV1");
  const deckType = settings.deckType || settings.deck_type || "Pitch";
  const outDir = settings.out
    ? (path.isAbsolute(settings.out) ? settings.out : path.join(ROOT, settings.out))
    : path.join(ROOT, "docs", "template-pipeline", "admin-dashboard", "tmp", "kit-v1-" + Date.now().toString(36));
  const result = await generateKitV1(settings.prompt || "", deckType, {
    outDir,
    id: path.basename(outDir),
  });
  return normalizeResult("kit-v1", {
    outDir,
    deck: result.deck,
    slides: fs.readdirSync(outDir).filter((n) => /^slide-\d+\.png$/.test(n)).map((n) => path.join(outDir, n)),
    analysis: { score: result.gates && result.gates.pass ? 90 : 50, gates: result.gates },
    name: result.deck.name,
    deckId: result.deck.id,
    report: { engine: "v1", repaired: result.repaired, failedAfterRepair: result.failedAfterRepair || null },
  });
}

module.exports = {
  injectTheme: thematic.injectTheme,
  chooseLayout: thematic.chooseLayout,
  seedFitsPrompt: thematic.seedFitsPrompt,
  classifyVibe: thematic.classifyVibe,
  visionQaEnabled: thematic.visionQaEnabled,
  assembleDeck,
  generateNative,
  remixSeeds,
  runPipeline,
  normalizeResult,
  setTestDeps,
  getTestDeps,
  finishDeck,
};
