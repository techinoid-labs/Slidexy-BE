/**
 * Pins the generate-template response fields the admin dashboard reads.
 * Also stubs a composer generateTemplate call (no network).
 *
 *   node services/templatePipeline/generateTemplateShape.test.js
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { generateTemplate } = require("./adminCatalog");

const ROOT = path.join(__dirname, "..", "..");
const htmlPath = path.join(ROOT, "docs", "template-pipeline", "admin-dashboard", "index.html");
const html = fs.readFileSync(htmlPath, "utf8");
const lines = html.split(/\r?\n/);

function lineOf(snippet) {
  const index = lines.findIndex((line) => line.indexOf(snippet) >= 0);
  assert.ok(index >= 0, "dashboard missing snippet: " + snippet);
  return index + 1;
}

const GENERATE_TEMPLATE_FIELDS = [
  { field: "id", line: lineOf("currentId = data.id"), note: "job id kept for publish/discard" },
  { field: "name", line: lineOf("data.name || (data.deck && data.deck.name)"), note: "deck title" },
  { field: "deck.name", line: lineOf("data.name || (data.deck && data.deck.name)"), note: "fallback title" },
  { field: "deck.id", line: lineOf("data.deck && data.deck.id ? data.deck.id : data.id"), note: "saved json name" },
  { field: "slides", line: lineOf("(data.slides || []).forEach"), note: "preview figures" },
  { field: "slides[].url", line: lineOf("image.src = slide.url"), note: "preview image src" },
  { field: "slides[].name", line: lineOf("image.alt = slide.name"), note: "caption / alt" },
  { field: "analysis", line: lineOf("data.analysis"), note: "optional QA summary" },
  { field: "analysis.score", line: lineOf("data.analysis.score"), note: "qa score" },
  { field: "analysis.passed", line: lineOf("data.analysis.passed"), note: "passed slide count" },
  { field: "analysis.total", line: lineOf("data.analysis.total"), note: "total slide count" },
  { field: "vibe", line: lineOf("data.vibe || (data.assembly && data.assembly.designLanguage)"), note: "vibe line" },
  { field: "assembly.designLanguage", line: lineOf("data.assembly && data.assembly.designLanguage"), note: "assemble fallback vibe" },
  { field: "pptxUrl", line: lineOf("downloadLink.href = \"/api/admin/download/\" + data.id"), note: "download always offered; PPTX built on GET" },
  { field: "layoutId", line: lineOf("data.layoutId || \"\""), note: "status layout name" },
  { field: "mode", line: lineOf("name=\"mode\""), note: "Mode selector" },
  { field: "nonce", line: lineOf("name=\"nonce\""), note: "Composer nonce field" },
  { field: "composer-meta", line: lineOf("composer-meta"), note: "plan / fits / collapses" },
  { field: "seed-assets", line: lineOf("seed assets missing"), note: "missing-image guidance" },
];

GENERATE_TEMPLATE_FIELDS.forEach((item) => {
  assert.ok(Number.isInteger(item.line) && item.line > 0, item.field + " has no line");
});

assert.ok(GENERATE_TEMPLATE_FIELDS.some((item) => item.field === "id"));
assert.ok(GENERATE_TEMPLATE_FIELDS.some((item) => item.field === "slides"));
assert.ok(GENERATE_TEMPLATE_FIELDS.some((item) => item.field === "vibe"));
assert.ok(GENERATE_TEMPLATE_FIELDS.some((item) => item.field === "layoutId"));
assert.ok(GENERATE_TEMPLATE_FIELDS.some((item) => item.field === "assembly.designLanguage"));
assert.ok(GENERATE_TEMPLATE_FIELDS.some((item) => item.field === "analysis"));
assert.ok(GENERATE_TEMPLATE_FIELDS.some((item) => item.field === "pptxUrl"));
assert.ok(html.indexOf("value=\"composer\" selected") >= 0 || html.indexOf("selected>Composer") >= 0, "Composer is default Mode");

const FIXTURE_PHOTO = path.join(ROOT, "generated-templates", "photos", "composer", "proof", "landscape-01.jpg");
const FALLBACK_PHOTO = path.join(ROOT, "generated-templates", "photos", "thematic", "phase-3-payroll", "landscape-01.jpg");
if (!fs.existsSync(FIXTURE_PHOTO)) {
  fs.mkdirSync(path.dirname(FIXTURE_PHOTO), { recursive: true });
  fs.copyFileSync(FALLBACK_PHOTO, FIXTURE_PHOTO);
}

function fixtureBrief() {
  return {
    plan: [
      { role: "Cover", component: "cover", variant: "word" },
      { role: "About", component: "split-copy", variant: "photo-right" },
      { role: "Close", component: "close", variant: "plain" },
    ],
    paletteBucket: "light-neutral",
    fontPair: "corp-calibri",
    density: "balanced",
    coverPattern: "oversized",
    signature: "frame",
    mood: "confident",
    copy: {
      "0": { title: "Apex Payroll", body: "Short cover body.", kicker: "2026" },
      "1": {
        title: "About Apex",
        body: "About body under the limit for the slot.",
        "bullet-1": "One",
        "bullet-2": "Two",
        "bullet-3": "Three",
      },
      "2": { title: "Let's talk", body: "Short close invite.", kicker: "Next" },
    },
  };
}

function assertHttpShape(result, mode) {
  assert.ok(result.id, mode + " id");
  assert.ok(result.name || (result.deck && result.deck.name), mode + " name");
  assert.ok(result.deck && typeof result.deck === "object", mode + " deck");
  assert.ok(Array.isArray(result.slides) && result.slides.length >= 1, mode + " slides");
  assert.ok(result.slides[0].url && result.slides[0].name, mode + " slides[].url and name");
  assert.ok(result.analysis && typeof result.analysis.score === "number", mode + " analysis.score");
  assert.ok(typeof result.analysis.passed === "number", mode + " analysis.passed");
  assert.ok(typeof result.analysis.total === "number", mode + " analysis.total");
  assert.ok(typeof result.vibe === "string", mode + " vibe");
  assert.ok(result.layoutId, mode + " layoutId");
  assert.ok(result.pptxUrl === "" || /\/api\/admin\/download\//.test(result.pptxUrl), mode + " pptxUrl");
}

function stubBuilderResult(outDir, extras) {
  fs.mkdirSync(outDir, { recursive: true });
  const deck = {
    id: "shape-deck",
    name: "Shape Deck",
    layoutSequence: ["s1"],
    layouts: { s1: { elements: [] } },
    qa: { score: 100, passed: 1, total: 1, failures: [], mode: "manual", attempt: 1 },
  };
  fs.writeFileSync(path.join(outDir, "deck.json"), JSON.stringify(deck, null, 2));
  fs.writeFileSync(path.join(outDir, "slide-01.png"), Buffer.from([137, 80, 78, 71]));
  return Object.assign({
    outDir,
    slides: [path.join(outDir, "slide-01.png")],
    report: { vibe: "light-neutral" },
    layout: "stub-layout",
    name: deck.name,
    deckId: deck.id,
    analysis: deck.qa,
    deck,
  }, extras || {});
}

async function assertComposerShape() {
  const { setTestDeps } = require("./pipeline");
  setTestDeps({
    inventDirection: async () => ({
      profile: { brand: "Apex Payroll", industry: "payroll" },
      mood: "confident",
      keywords: ["office"],
      query: "office",
      model: "stub",
    }),
    planBrief: async () => fixtureBrief(),
    copyBrief: async () => ({ copy: fixtureBrief().copy }),
    searchPexels: async () => [{ download: "file://" + FIXTURE_PHOTO, url: "file://" + FIXTURE_PHOTO }],
    downloadPhoto: async (url, file) => {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.copyFileSync(FIXTURE_PHOTO, file);
      return 1;
    },
  });
  let result;
  try {
    result = await generateTemplate({
      prompt: "A corporate payroll company",
      mode: "composer",
      nonce: "shape-test-4e",
    });
  } finally {
    setTestDeps(null);
  }

  assertHttpShape(result, "composer");
  assert.strictEqual(result.layoutId, "composer", "layoutId composer");
  const { discardTemplate } = require("./adminCatalog");
  discardTemplate(result.id);
  console.log("composer generateTemplate shape ok id=" + result.id + " vibe=" + result.vibe + " score=" + result.analysis.score);
}

async function assertModeShape(mode, body, installDeps) {
  const { setTestDeps } = require("./pipeline");
  setTestDeps(installDeps);
  let result;
  try {
    result = await generateTemplate(Object.assign({ prompt: "A corporate payroll company" }, body));
  } finally {
    setTestDeps(null);
  }
  assertHttpShape(result, mode);
  const { discardTemplate } = require("./adminCatalog");
  discardTemplate(result.id);
  console.log(mode + " generateTemplate shape ok id=" + result.id);
}

module.exports = { GENERATE_TEMPLATE_FIELDS };

(async () => {
  console.log("generateTemplateShape fields: " + GENERATE_TEMPLATE_FIELDS.map((item) => item.field + "@" + item.line).join(", "));
  await assertComposerShape();

  await assertModeShape("pinned", { mode: "pinned", layoutId: "blue-and-white-modern-business-proposal-presentation" }, {
    skipFinishDeck: true,
    injectTheme: async (options) => stubBuilderResult(path.resolve(ROOT, options.out), {
      layout: "blue-and-white-modern-business-proposal-presentation",
      selection: { vibe: "light-neutral" },
      report: { vibe: "light-neutral" },
    }),
  });
  await assertModeShape("auto", { mode: "auto" }, {
    skipFinishDeck: true,
    injectTheme: async (options) => stubBuilderResult(path.resolve(ROOT, options.out), {
      layout: "auto-seed",
      selection: { vibe: "light-warm" },
      report: { vibe: "light-warm" },
    }),
  });
  await assertModeShape("assemble", { mode: "assemble" }, {
    skipFinishDeck: true,
    assembleDeck: async (prompt, options) => stubBuilderResult(path.resolve(ROOT, options.out), {
      layout: "assembled",
      assembly: { designLanguage: "assembled" },
    }),
  });
  await assertModeShape("remix", {
    mode: "remix",
    layoutId: "blue-and-white-modern-business-proposal-presentation",
    layoutIdB: "black-and-white-minimalist-pitch-deck-presentation",
  }, {
    skipFinishDeck: true,
    remixSeeds: async (a, b, options) => stubBuilderResult(path.resolve(ROOT, options.out), {
      layout: a + "+" + b,
      remix: { strategies: [] },
    }),
  });
  await assertModeShape("native", { mode: "native" }, {
    skipFinishDeck: true,
    generateNative: async (options) => stubBuilderResult(path.resolve(ROOT, options.out), {
      layout: "native",
      vibe: "native",
    }),
  });

  console.log("generateTemplateShape test passed");
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
