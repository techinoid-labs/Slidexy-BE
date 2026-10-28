/**
 * normalizeResult maps each builder fixture into the shared Phase 5a shape.
 *
 *   node services/templatePipeline/pipelineShape.test.js
 */

const assert = require("assert");
const path = require("path");
const os = require("os");
const fs = require("fs");
const { normalizeResult } = require("./pipeline");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pipeline-shape-"));

function writeDeck(name) {
  const outDir = path.join(tmp, name);
  fs.mkdirSync(outDir, { recursive: true });
  const deck = {
    id: name,
    name: "Deck " + name,
    layoutSequence: ["s1"],
    layouts: { s1: { elements: [] } },
    qa: { score: 90, passed: 1, total: 1, failures: [], mode: "manual", attempt: 1 },
  };
  fs.writeFileSync(path.join(outDir, "deck.json"), JSON.stringify(deck, null, 2));
  fs.writeFileSync(path.join(outDir, "slide-01.png"), Buffer.from([137, 80, 78, 71]));
  return { outDir, deck };
}

function assertShape(mode, result) {
  assert.ok(result.id, mode + " id");
  assert.ok(result.name, mode + " name");
  assert.ok(result.outDir, mode + " outDir");
  assert.ok(result.deck && typeof result.deck === "object", mode + " deck");
  assert.ok(Array.isArray(result.slides) && result.slides.length >= 1, mode + " slides");
  assert.ok(result.slides[0].name && result.slides[0].url != null, mode + " slides[].name/url");
  assert.ok(result.analysis && typeof result.analysis.score === "number", mode + " analysis.score");
  assert.ok(typeof result.vibe === "string", mode + " vibe");
  assert.ok(result.layoutId, mode + " layoutId");
}

const fixtures = {
  pinned: (() => {
    const { outDir, deck } = writeDeck("pinned");
    return {
      outDir,
      slides: [path.join(outDir, "slide-01.png")],
      report: { vibe: "light-neutral", prompt: "x" },
      layout: "blue-seed",
      name: deck.name,
      deckId: deck.id,
      selection: { vibe: "light-neutral" },
      analysis: deck.qa,
    };
  })(),
  auto: (() => {
    const { outDir, deck } = writeDeck("auto");
    return {
      outDir,
      slides: [path.join(outDir, "slide-01.png")],
      report: { vibe: "light-warm" },
      layout: "auto-seed",
      name: deck.name,
      deckId: deck.id,
      selection: { vibe: "light-warm" },
      analysis: deck.qa,
    };
  })(),
  assemble: (() => {
    const { outDir, deck } = writeDeck("assemble");
    return {
      outDir,
      slides: [path.join(outDir, "slide-01.png")],
      report: {},
      layout: "assembled",
      name: deck.name,
      deckId: deck.id,
      assembly: { designLanguage: "assembled-vibe" },
      analysis: deck.qa,
    };
  })(),
  remix: (() => {
    const { outDir, deck } = writeDeck("remix");
    return {
      outDir,
      slides: [path.join(outDir, "slide-01.png")],
      report: {},
      layout: "a+b",
      name: deck.name,
      deckId: deck.id,
      remix: { strategies: [] },
      analysis: deck.qa,
    };
  })(),
  native: (() => {
    const { outDir, deck } = writeDeck("native");
    return {
      outDir,
      slides: [path.join(outDir, "slide-01.png")],
      deck,
      layout: "native",
      name: deck.name,
      analysis: deck.qa,
    };
  })(),
  composer: (() => {
    const { outDir, deck } = writeDeck("composer");
    return {
      id: "brand",
      outDir,
      slides: [{ name: "slide-01.png", url: path.join(outDir, "slide-01.png") }],
      deck,
      layoutId: "composer",
      name: deck.name,
      vibe: "light-neutral",
      analysis: deck.qa,
      report: {
        brief: { plan: [{ role: "Cover", component: "cover", variant: "word" }] },
        fallbacks: [],
        fits: [],
        nonce: "n1",
      },
      plan: [{ role: "Cover", component: "cover", variant: "word" }],
      fallbacks: [],
      fits: [],
      nonce: "n1",
    };
  })(),
};

Object.keys(fixtures).forEach((mode) => {
  const result = normalizeResult(mode, fixtures[mode]);
  assertShape(mode, result);
  if (mode === "assemble") assert.ok(result.vibe === "assembled-vibe" || result.assembly, "assemble vibe/assembly");
  if (mode === "composer") {
    assert.strictEqual(result.layoutId, "composer");
    assert.ok(result.plan || (result.report && result.report.brief), "composer plan");
    assert.strictEqual(result.nonce, "n1");
  }
  console.log("normalizeResult " + mode + " ok");
});

console.log("pipelineShape test passed");
