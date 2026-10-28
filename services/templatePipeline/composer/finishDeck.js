/**
 * Shared post-render tail: hard fails + pptx gate + writeQa(manual).
 * Used by composer composeRuntime and by runPipeline for every other mode.
 */

const fs = require("fs");
const path = require("path");
const { writeQa } = require("../thematic");
const { analyzeDeck } = require("../scoring/analyzeDeck");
const { applyComposerFails } = require("./hardFails");
const { runPptxGate, applyPptxGate } = require("./pptxGate");
const { attachAesthetics } = require("./aesthetics");

function listSlideFiles(outDir) {
  if (!fs.existsSync(outDir)) return [];
  return fs.readdirSync(outDir)
    .filter((name) => /^slide-\d{2}\.png$/.test(name))
    .sort()
    .map((name) => path.join(outDir, name));
}

/**
 * @param {object} deck
 * @param {string} outDir
 * @param {object} [options]
 * @param {string[]} [options.slides]
 * @param {object} [options.analysis] geometry analysis already computed
 * @param {object} [options.report]
 * @param {number} [options.attempt]
 * @param {string} [options.layout]
 * @returns {Promise<{ deck, analysis, slides, outDir, report, name, deckId }>}
 */
async function finishDeck(deck, outDir, options) {
  const settings = options || {};
  const slides = settings.slides && settings.slides.length
    ? settings.slides
    : listSlideFiles(outDir);
  let analysis = settings.analysis;
  if (!analysis) {
    analysis = await analyzeDeck(deck, slides, { vision: false });
  }
  analysis = applyComposerFails(analysis, deck);
  const pptxGate = await runPptxGate(deck, outDir);
  analysis = applyPptxGate(analysis, pptxGate);
  analysis = attachAesthetics(analysis, deck);
  analysis.attempt = settings.attempt || analysis.attempt || 1;

  const result = {
    outDir,
    slides,
    report: settings.report || null,
    layout: settings.layout,
    name: deck.name,
    deckId: deck.id,
    analysis: null,
    deck,
  };
  await writeQa(result, analysis, analysis.attempt, "manual");
  if (result.analysis && typeof result.analysis === "object") {
    result.analysis.aesthetic = analysis.aesthetic;
    result.analysis.slides = analysis.slides;
    result.analysis.composer = analysis.composer;
    if (analysis.pptxGate) result.analysis.pptxGate = analysis.pptxGate;
  }
  if (result.report) result.report.analysis = result.analysis;

  const deckPath = path.join(outDir, "deck.json");
  if (fs.existsSync(deckPath)) {
    const written = JSON.parse(fs.readFileSync(deckPath, "utf8"));
    if (written.qa) {
      written.qa.aesthetic = analysis.aesthetic;
      if (analysis.pptxGate) written.qa.pptxGate = analysis.pptxGate;
      fs.writeFileSync(deckPath, JSON.stringify(written, null, 2) + "\n");
    }
    result.deck = written;
  }
  return result;
}

module.exports = { finishDeck, listSlideFiles };
