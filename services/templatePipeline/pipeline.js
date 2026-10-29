/**
 * Facade for the live template builders.
 * This is not the old inventor (inventBrief / reasonDeck / generateDeck / learn).
 * Convert a deck with services/templatePipeline/convert/pptxToDeck.js.
 * Mutate a seed with services/templatePipeline/mutate.js.
 *
 * Phase 5a: every mode returns one normalized result shape; non-composer modes
 * share composer/finishDeck after their existing geometry analyze.
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

async function applyFinishTail(raw, mode) {
  const outDir = path.resolve(ROOT, raw.outDir);
  const deck = raw.deck || JSON.parse(fs.readFileSync(path.join(outDir, "deck.json"), "utf8"));
  const slides = raw.slides && raw.slides.length
    ? (Array.isArray(raw.slides) && typeof raw.slides[0] === "string"
      ? raw.slides
      : raw.slides.map((s) => (typeof s === "string" ? s : (s.path || s.url))).filter(Boolean))
    : listSlideFiles(outDir);
  const finished = await finishDeck(deck, outDir, {
    slides,
    analysis: raw.analysis || null,
    report: raw.report || null,
    attempt: (raw.analysis && raw.analysis.attempt) || 1,
    layout: raw.layout || mode,
  });
  return Object.assign({}, raw, {
    outDir: finished.outDir,
    slides: finished.slides,
    analysis: finished.analysis,
    deck: finished.deck,
    report: finished.report || raw.report,
    name: finished.name || raw.name,
    deckId: finished.deckId || raw.deckId,
  });
}

async function runPipeline(options) {
  const settings = options || {};
  const mode = settings.mode;
  const deps = settings.deps || testDeps || null;

  // Engine v1 kit path — default when ENGINE_V1=true (no new public mode name).
  if (process.env.ENGINE_V1 === "true" || mode === "kit-v1") {
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

  const allowed = {
    auto: true,
    pinned: true,
    composer: true,
    assemble: true,
    remix: true,
    native: true,
  };
  if (!allowed[mode]) {
    throw new Error("unsupported mode");
  }

  if (mode === "composer") {
    const { compose } = require("./composer/composeRuntime");
    const raw = await compose(settings, deps);
    return normalizeResult("composer", raw);
  }

  if (mode === "pinned" && !settings.layout) {
    throw new Error("layout is required for mode pinned");
  }

  let raw;
  if (mode === "assemble") {
    const runAssemble = (deps && deps.assembleDeck) || assembleDeck;
    raw = await runAssemble(settings.prompt, {
      out: settings.out,
      creative: settings.creative,
    });
  } else if (mode === "remix") {
    const runRemix = (deps && deps.remixSeeds) || remixSeeds;
    raw = await runRemix(settings.layout, settings.layoutIdB || settings.layoutB, {
      prompt: settings.prompt,
      out: settings.out,
    });
  } else if (mode === "native") {
    const runNative = (deps && deps.generateNative) || generateNative;
    raw = await runNative({
      prompt: settings.prompt,
      out: settings.out,
      creative: settings.creative === true || settings.creative === "true",
      niche: settings.niche || "",
    });
  } else {
    const { injectTheme, visionQaEnabled } = require("./thematic");
    let qa = settings.qa;
    if (qa === undefined || qa === "") {
      qa = visionQaEnabled() ? true : "manual";
    }
    const runInject = (deps && deps.injectTheme) || injectTheme;
    raw = await runInject({
      prompt: settings.prompt,
      layout: settings.layout || "",
      autoLayout: mode === "auto",
      out: settings.out,
      qa,
      forcedBucket: settings.forcedBucket,
      excludeLayouts: settings.excludeLayouts,
      density: settings.density,
    }, deps || {});
  }

  if (!(deps && deps.skipFinishDeck)) {
    raw = await applyFinishTail(raw, mode);
  }
  return normalizeResult(mode, raw);
}

if (process.env.PIPELINE_5A_STUB === "1") {
  try {
    const stub = require("./composer/pinnedStub5a");
    setTestDeps({ themeOnce: stub.themeOnce });
    console.log("PIPELINE_5A_STUB: pinned themeOnce stub armed (zero network)");
  } catch (error) {
    console.log("PIPELINE_5A_STUB failed to load: " + (error && error.message ? error.message : error));
  }
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
