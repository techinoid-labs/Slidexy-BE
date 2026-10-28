/**
 * Offline themeOnce stub for Phase 5a pinned browser/API proof.
 * Loads a seed layout, keeps its photo urls (missing on disk), renders, no network.
 * Enable with PIPELINE_5A_STUB=1 (pipeline.setTestDeps on curator boot).
 */

const fs = require("fs");
const path = require("path");
const { renderSlidePng } = require("../../../scripts/slideSvg");

const ROOT = path.join(__dirname, "..", "..", "..");
const LIBRARY = path.join(ROOT, "app-library");

function loadLayout(layoutId) {
  const id = String(layoutId || "").replace(/\.json$/i, "");
  const file = path.join(LIBRARY, id + ".json");
  if (!fs.existsSync(file)) throw new Error("stub layout missing: " + id);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function renderDeck(deck, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const slides = [];
  (deck.layoutSequence || Object.keys(deck.layouts || {})).forEach((layoutId, index) => {
    const file = path.join(outDir, "slide-" + String(index + 1).padStart(2, "0") + ".png");
    renderSlidePng(deck, layoutId, file);
    slides.push(file);
  });
  return slides;
}

async function themeOnce(options) {
  const layout = options.layout || "blue-and-white-modern-business-proposal-presentation";
  const deck = loadLayout(layout);
  function walk(elements, fn) {
    (elements || []).forEach((el) => {
      fn(el);
      if (el && Array.isArray(el.children)) walk(el.children, fn);
      if (el && Array.isArray(el.elements)) walk(el.elements, fn);
    });
  }
  // Mark seed elements so geometry exemptions hold; leave photo urls unresolved → missing image.
  // Normalize spans / z-order so only missing-image hard fails remain (seed-assets status line).
  (deck.layoutSequence || Object.keys(deck.layouts || {})).forEach((id) => {
    const layoutObj = deck.layouts[id];
    walk(layoutObj.elements, (el) => {
      if (!el || typeof el !== "object") return;
      el.seedOrigin = true;
      if (el.type === "image" || el.type === "maskedImage") el.zIndex = 1;
      else if (el.type === "shape") {
        el.zIndex = 0;
        el.opacity = 0.15;
      } else if (el.type === "text") {
        el.zIndex = 100;
        // Empty text so pptx line-count / split-word cannot mix into failures;
        // seed-assets status requires every failure to be "missing image".
        if (el.textContent) el.textContent.spans = [{ text: "" }];
      }
    });
  });
  deck.name = "5a pinned stub: " + (options.prompt || layout);
  deck.description = "Phase 5a offline pinned stub (no inventDirection / Pexels)";
  const outDir = options.out
    ? path.resolve(ROOT, options.out)
    : path.join(ROOT, "docs", "template-pipeline", "composer", "_5a-pinned-stub");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "deck.json"), JSON.stringify(deck, null, 2) + "\n");
  const slides = renderDeck(deck, outDir);
  const report = {
    prompt: options.prompt || "",
    layout,
    vibe: "light-neutral",
    stub: "PIPELINE_5A_STUB",
    autoLayout: Boolean(options.autoLayout),
  };
  fs.writeFileSync(path.join(outDir, "replacements.json"), JSON.stringify(report, null, 2) + "\n");
  return {
    outDir,
    slides,
    report,
    layout,
    name: deck.name,
    deckId: deck.id,
    selection: { vibe: "light-neutral", model: "stub-5a" },
    deck,
  };
}

module.exports = { themeOnce };
