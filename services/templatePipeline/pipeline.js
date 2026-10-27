/**
 * Facade for the live template builders.
 * This is not the old inventor (inventBrief / reasonDeck / generateDeck / learn).
 * Convert a deck with services/templatePipeline/convert/pptxToDeck.js.
 * Mutate a seed with services/templatePipeline/mutate.js.
 */

const thematic = require("./thematic");
const { assembleDeck } = require("./assemble_deck");
const { generate: generateNative } = require("./thematic-native");
const { remixSeeds } = require("./mutate_layout");

async function runPipeline(options) {
  const settings = options || {};
  const mode = settings.mode;
  if (mode !== "auto" && mode !== "pinned" && mode !== "composer") {
    throw new Error("unsupported mode");
  }
  if (mode === "composer") {
    const { compose } = require("./composer/composeRuntime");
    return compose(settings, settings.deps);
  }
  if (mode === "pinned" && !settings.layout) {
    throw new Error("layout is required for mode pinned");
  }
  const { injectTheme, visionQaEnabled } = require("./thematic");
  let qa = settings.qa;
  if (qa === undefined || qa === "") {
    qa = visionQaEnabled() ? true : "manual";
  }
  return injectTheme({
    prompt: settings.prompt,
    layout: settings.layout || "",
    autoLayout: mode === "auto",
    out: settings.out,
    qa,
    forcedBucket: settings.forcedBucket,
    excludeLayouts: settings.excludeLayouts,
    density: settings.density,
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
};
