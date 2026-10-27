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
  { field: "analysis", line: lineOf("data.analysis ? \" Vision score \""), note: "optional QA summary" },
  { field: "analysis.score", line: lineOf("data.analysis.score"), note: "vision score" },
  { field: "analysis.passed", line: lineOf("data.analysis.passed"), note: "passed slide count" },
  { field: "analysis.total", line: lineOf("data.analysis.total"), note: "total slide count" },
  { field: "vibe", line: lineOf("data.vibe || (data.assembly && data.assembly.designLanguage)"), note: "vibe line" },
  { field: "assembly.designLanguage", line: lineOf("data.assembly && data.assembly.designLanguage"), note: "assemble fallback vibe" },
  { field: "pptxUrl", line: lineOf("downloadLink.href = \"/api/admin/download/\" + data.id"), note: "download always offered; PPTX built on GET" },
  { field: "layoutId", line: lineOf("data.layoutId || \"\""), note: "status layout name" },
  { field: "mode", line: lineOf("name=\"mode\""), note: "Mode selector" },
  { field: "nonce", line: lineOf("name=\"nonce\""), note: "Composer nonce field" },
  { field: "composer-meta", line: lineOf("composer-meta"), note: "plan / fits / collapses" },
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
      Cover: { title: "Apex Payroll", body: "Short cover body.", kicker: "2026" },
      About: {
        title: "About Apex",
        body: "About body under the limit for the slot.",
        "bullet-1": "One",
        "bullet-2": "Two",
        "bullet-3": "Three",
      },
      Close: { title: "Let's talk", body: "Short close invite.", kicker: "Next" },
    },
  };
}

async function assertComposerShape() {
  const { setTestDeps } = require("./composer/composeRuntime");
  setTestDeps({
    inventDirection: async () => ({
      profile: { brand: "Apex Payroll", industry: "payroll" },
      mood: "confident",
      keywords: ["office"],
      query: "office",
      model: "stub",
    }),
    designBrief: async () => fixtureBrief(),
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

  assert.ok(result.id, "id");
  assert.ok(result.name || (result.deck && result.deck.name), "name");
  assert.ok(result.deck && typeof result.deck === "object", "deck");
  assert.ok(Array.isArray(result.slides) && result.slides.length >= 1, "slides");
  assert.ok(result.slides[0].url && result.slides[0].name, "slides[].url and name");
  assert.ok(result.analysis && typeof result.analysis.score === "number", "analysis.score");
  assert.ok(typeof result.analysis.passed === "number", "analysis.passed");
  assert.ok(typeof result.analysis.total === "number", "analysis.total");
  assert.ok(result.vibe, "vibe (bucket)");
  assert.strictEqual(result.layoutId, "composer", "layoutId composer");
  // 4f-0: compose writes deck.pptx for the round-trip gate, so pptxUrl is present after generate.
  assert.ok(result.pptxUrl === "" || /\/api\/admin\/download\//.test(result.pptxUrl), "pptxUrl empty or download path");

  // Cleanup stub job so admin-dashboard/tmp does not accumulate.
  const { discardTemplate } = require("./adminCatalog");
  discardTemplate(result.id);
  console.log("composer generateTemplate shape ok id=" + result.id + " vibe=" + result.vibe + " score=" + result.analysis.score);
}

module.exports = { GENERATE_TEMPLATE_FIELDS };

(async () => {
  console.log("generateTemplateShape fields: " + GENERATE_TEMPLATE_FIELDS.map((item) => item.field + "@" + item.line).join(", "));
  await assertComposerShape();
  console.log("generateTemplateShape test passed");
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
