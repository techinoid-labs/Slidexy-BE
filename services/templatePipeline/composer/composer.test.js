/**
 * Offline compose characterization (4d2: collapse, unfilled, photo-under-shape).
 *
 *   node services/templatePipeline/composer/composer.test.js
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { compose, collapseStacks, applySlotCopy } = require("./composeRuntime");
const { validateBrief } = require("./brief");
const { composerHardFails } = require("./hardFails");

const ROOT = path.join(__dirname, "..", "..", "..");
const FIXTURE_PHOTO = path.join(ROOT, "generated-templates", "photos", "composer", "proof", "landscape-01.jpg");
const FALLBACK_PHOTO = path.join(ROOT, "generated-templates", "photos", "thematic", "phase-3-payroll", "landscape-01.jpg");

function ensureFixturePhoto() {
  if (!fs.existsSync(FIXTURE_PHOTO)) {
    fs.mkdirSync(path.dirname(FIXTURE_PHOTO), { recursive: true });
    fs.copyFileSync(FALLBACK_PHOTO, FIXTURE_PHOTO);
  }
}

function fixtureDirection() {
  return {
    profile: { brand: "Apex Payroll", industry: "payroll" },
    mood: "confident",
    keywords: ["office", "team", "desk"],
    query: "office team desk",
    model: "stub",
  };
}

function fixtureBrief() {
  return {
    plan: [
      { role: "Cover", component: "cover", variant: "split" },
      { role: "About", component: "not-a-real-component", variant: "photo-right" },
      { role: "Proof", component: "stat-row", variant: "three-up" },
      { role: "Close", component: "close", variant: "plain" },
    ],
    paletteBucket: "light-neutral",
    fontPair: "corp-calibri",
    density: "balanced",
    coverPattern: "oversized",
    signature: "frame",
    mood: "confident",
    copy: {
      Cover: { title: "Apex Payroll", body: "Y".repeat(200), kicker: "2026" },
      About: {
        title: "About Apex",
        body: "X".repeat(200),
        "bullet-1": "One",
        "bullet-2": "Two",
        "bullet-3": "Three",
      },
      Proof: {
        title: "Proof numbers",
        body: "Supporting proof body under the limit.",
        "stat-1": "47%",
        "stat-2": "12d",
        "stat-3": "98%",
        "label-1": "Churn",
        "label-2": "Close",
        "label-3": "On-time",
      },
      Close: { title: "Let's talk", body: "Short close invite.", kicker: "Next" },
    },
  };
}

async function run() {
  ensureFixturePhoto();
  let calls = 0;
  const out = path.join(ROOT, "docs", "template-pipeline", "composer", "_test-compose");
  const nonce = "test-nonce-4d";
  const deps = {
    inventDirection: async () => { calls += 1; return fixtureDirection(); },
    designBrief: async () => { calls += 1; return fixtureBrief(); },
    searchPexels: async () => [{ download: "file://" + FIXTURE_PHOTO, url: "file://" + FIXTURE_PHOTO }],
    downloadPhoto: async (url, file) => {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.copyFileSync(FIXTURE_PHOTO, file);
      return fs.statSync(file).size;
    },
  };

  const result = await compose({
    prompt: "A corporate payroll company",
    nonce,
    out: path.relative(ROOT, out),
  }, deps);

  const deck = JSON.parse(fs.readFileSync(path.join(out, "deck.json"), "utf8"));
  const replacements = JSON.parse(fs.readFileSync(path.join(out, "replacements.json"), "utf8"));

  assert.ok(result.layoutId === "composer", "layoutId composer");
  assert.ok(deck.qa && deck.qa.mode === "manual", "qa mode manual");
  assert.strictEqual(replacements.nonce, nonce, "nonce in replacements");
  assert.ok(Array.isArray(replacements.fits), "fits array");
  assert.ok(Array.isArray(replacements.collapses), "collapses array");
  assert.strictEqual(calls, 2, "exactly 2 text-model stub calls without refinement, got " + calls);

  const fallbacks = replacements.fallbacks || [];
  assert.ok(fallbacks.some((f) => /component/.test(f.field) && f.got === "not-a-real-component"), "invalid component fallback");
  assert.ok(fallbacks.some((f) => /clamped/.test(String(f.used))), "overlong copy clamped");
  const about = replacements.brief.copy.About || {};
  if (about.body != null) assert.ok(String(about.body).length <= 160, "body length clamped when body slot kept");

  let photoFilled = 0;
  Object.keys(deck.layouts).forEach((id) => {
    (deck.layouts[id].elements || []).forEach((el) => {
      const content = el.imageContent || el.maskedImageContent;
      if (content && content.url) photoFilled += 1;
    });
  });
  assert.ok(photoFilled >= 1, "photo slots filled");

  const again = validateBrief(fixtureBrief(), JSON.parse(fs.readFileSync(path.join(ROOT, "design-system", "manifest.json"), "utf8")), "A corporate payroll company", nonce);
  const again2 = validateBrief(fixtureBrief(), JSON.parse(fs.readFileSync(path.join(ROOT, "design-system", "manifest.json"), "utf8")), "A corporate payroll company", nonce);
  assert.deepStrictEqual(again.fallbacks, again2.fallbacks, "same nonce same fallbacks");
  assert.ok(result.analysis, "geometry/analysis reported");
  assert.ok(result.analysis.aesthetic, "aesthetic summary attached");
  console.log("compose offline ok score=" + (result.analysis && result.analysis.score) + " calls=" + calls);

  const missingDeps = Object.assign({}, deps, {
    inventDirection: async () => { calls += 1; return fixtureDirection(); },
    designBrief: async () => { calls += 1; return fixtureBrief(); },
    refineBrief: async () => { calls += 1; return fixtureBrief(); },
    downloadPhoto: async () => 0,
  });
  calls = 0;
  const missingOut = path.join(ROOT, "docs", "template-pipeline", "composer", "_test-compose-missing");
  const missing = await compose({
    prompt: "A corporate payroll company",
    nonce: "test-nonce-missing",
    out: path.relative(ROOT, missingOut),
  }, missingDeps);
  const failures = (missing.analysis && missing.analysis.failures) || [];
  assert.ok(failures.some((f) => /missing image/i.test(String(f))), "missing-image hard fail: " + JSON.stringify(failures));
  console.log("missing-image hard fail ok");

  // Unfilled slot: brief missing bullet-2
  calls = 0;
  const unfilledBrief = JSON.parse(JSON.stringify(fixtureBrief()));
  unfilledBrief.plan[1].component = "split-copy";
  delete unfilledBrief.copy.About["bullet-2"];
  unfilledBrief.copy.About.body = "Short about body.";
  const unfilledOut = path.join(ROOT, "docs", "template-pipeline", "composer", "_test-unfilled");
  const unfilled = await compose({
    prompt: "A corporate payroll company",
    nonce: "test-unfilled-bullet2",
    out: path.relative(ROOT, unfilledOut),
  }, {
    inventDirection: async () => { calls += 1; return fixtureDirection(); },
    designBrief: async () => { calls += 1; return unfilledBrief; },
    refineBrief: async () => {
      calls += 1;
      const fixed = JSON.parse(JSON.stringify(unfilledBrief));
      fixed.copy.About["bullet-2"] = "Filled two";
      return fixed;
    },
    searchPexels: async () => [{ download: "file://" + FIXTURE_PHOTO, url: "file://" + FIXTURE_PHOTO }],
    downloadPhoto: async (url, file) => {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.copyFileSync(FIXTURE_PHOTO, file);
      return 1;
    },
  });
  const attempt1Fail = JSON.parse(fs.readFileSync(path.join(unfilledOut, "attempt-1", "replacements.json"), "utf8"));
  const a1fails = (((attempt1Fail.analysis && attempt1Fail.analysis.failures) || [])
    .concat((attempt1Fail.analysis && attempt1Fail.analysis.slides || []).flatMap((s) => s.reasons || [])));
  const unfilledHit = JSON.stringify(attempt1Fail.analysis || unfilled.analysis).match(/unfilled slot/i);
  assert.ok(unfilledHit, "unfilled slot fires when bullet-2 missing");
  console.log("unfilled slot hard fail ok");

  // Collapse: short body shifts bullets up
  const compiled = JSON.parse(fs.readFileSync(path.join(ROOT, "app-library", "native", "composer", "split-copy-photo-right-corp-calibri.json"), "utf8"));
  assert.ok(Array.isArray(compiled.layout.stacks) && compiled.layout.stacks.length, "compiled stacks present");
  const collapseDeck = {
    schemaVersion: 2,
    id: "collapse-test",
    tokens: {
      color: { bg: "#f3f1ee", ink: "#1c1916", muted: "#5c564e" },
      font: { display: "Calibri", text: "Calibri" },
    },
    layoutSequence: ["slide-1"],
    layouts: {
      "slide-1": {
        version: 2,
        id: "slide-1",
        canvas: { width: 1600, height: 900, aspectRatio: "16:9" },
        elements: JSON.parse(JSON.stringify(compiled.layout.elements)),
        stacks: JSON.parse(JSON.stringify(compiled.layout.stacks)),
      },
    },
  };
  applySlotCopy(collapseDeck.layouts["slide-1"].elements, "About", {
    title: "Short Title",
    body: "One short body line.",
    "bullet-1": "First",
    "bullet-2": "Second",
    "bullet-3": "Third",
  }, "split-copy");
  const beforeBulletY = collapseDeck.layouts["slide-1"].elements.find((e) => e.id === "composer-split-copy-bullet-1").y;
  const bodyEl = collapseDeck.layouts["slide-1"].elements.find((e) => e.id === "composer-split-copy-body");
  const capacityBodyH = bodyEl.height;
  const collapses = collapseStacks(collapseDeck);
  const afterBulletY = collapseDeck.layouts["slide-1"].elements.find((e) => e.id === "composer-split-copy-bullet-1").y;
  const afterBodyH = collapseDeck.layouts["slide-1"].elements.find((e) => e.id === "composer-split-copy-body").height;
  assert.ok(afterBodyH < capacityBodyH, "body height shrunk from capacity");
  assert.ok(afterBulletY < beforeBulletY, "bullets shift up when body is short: " + beforeBulletY + " -> " + afterBulletY);
  assert.ok(collapses.length >= 1, "collapse recorded");
  console.log("collapse shifts bullets up ok delta=" + (afterBulletY - beforeBulletY));

  // Photo under shape fixture
  const photoShapeDeck = {
    layouts: {
      "slide-1": {
        elements: [
          {
            id: "pic",
            type: "image",
            x: 0,
            y: 0,
            width: 800,
            height: 900,
            zIndex: 1,
            imageContent: { url: "photos/composer/proof/landscape-01.jpg" },
          },
          {
            id: "cover-shape",
            type: "shape",
            x: 0,
            y: 0,
            width: 800,
            height: 900,
            zIndex: 5,
            opacity: 1,
            shapeContent: { kind: "rect", fill: "#112233" },
          },
        ],
      },
    },
  };
  const hard = composerHardFails(photoShapeDeck, "slide-1");
  assert.ok(hard.reasons.some((r) => /photo under shape/i.test(r)), "photo under shape fires: " + JSON.stringify(hard.reasons));
  console.log("photo under shape hard fail ok");

  // Replay: zero network — fetch must throw if touched
  const payrollReplay = path.join(ROOT, "docs", "template-pipeline", "composer", "proof-payroll");
  assert.ok(fs.existsSync(path.join(payrollReplay, "replacements.json")), "proof-payroll replacements exist");
  const origFetch = global.fetch;
  global.fetch = async () => { throw new Error("network forbidden during replay"); };
  try {
    const replayOut = path.join(ROOT, "docs", "template-pipeline", "composer", "_test-replay");
    const replayed = await compose({
      prompt: "A corporate payroll company",
      replay: path.relative(ROOT, payrollReplay),
      out: path.relative(ROOT, replayOut),
    }, {
      inventDirection: async () => { throw new Error("inventDirection should not run on replay"); },
      designBrief: async () => { throw new Error("designBrief should not run on replay"); },
      searchPexels: async () => { throw new Error("searchPexels should not run on replay"); },
      downloadPhoto: async () => { throw new Error("downloadPhoto should not run on replay"); },
    });
    assert.ok(replayed.report && replayed.report.replay === true, "replay flag");
    assert.strictEqual(replayed.report.textModelCalls, 0, "zero model calls on replay");
    console.log("replay zero-network ok score=" + (replayed.analysis && replayed.analysis.score));
  } finally {
    global.fetch = origFetch;
  }

  // Refinement triggered via missing image on photo cover, then word cover
  calls = 0;
  const failBrief = {
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
      Cover: { title: "Cover", body: "Body", kicker: "K" },
      About: {
        title: "About title short",
        body: "About body short enough.",
        "bullet-1": "b1",
        "bullet-2": "b2",
        "bullet-3": "b3",
      },
      Close: { title: "Close", body: "Bye", kicker: "N" },
    },
  };
  const refineBriefBody = {
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
    copy: failBrief.copy,
  };
  const firstBrief = {
    plan: [
      { role: "Cover", component: "cover", variant: "split" },
      { role: "About", component: "split-copy", variant: "photo-right" },
      { role: "Close", component: "close", variant: "plain" },
    ],
    paletteBucket: "light-neutral",
    fontPair: "corp-calibri",
    density: "balanced",
    coverPattern: "split",
    signature: "frame",
    mood: "confident",
    copy: failBrief.copy,
  };
  const refineOut = path.join(ROOT, "docs", "template-pipeline", "composer", "_test-refine");
  const refined = await compose({
    prompt: "A corporate payroll company",
    nonce: "test-refine-4d",
    out: path.relative(ROOT, refineOut),
  }, {
    inventDirection: async () => { calls += 1; return fixtureDirection(); },
    designBrief: async () => { calls += 1; return firstBrief; },
    refineBrief: async () => { calls += 1; return refineBriefBody; },
    searchPexels: async () => [{ download: "file://" + FIXTURE_PHOTO, url: "file://" + FIXTURE_PHOTO }],
    downloadPhoto: async (url, file) => {
      // First attempt: write nothing so missing-image fires; after refine to word cover, fewer photos
      if (calls < 3) return 0;
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.copyFileSync(FIXTURE_PHOTO, file);
      return 1;
    },
  });
  assert.ok(fs.existsSync(path.join(refineOut, "attempt-1", "deck.json")), "attempt-1 kept on disk");
  assert.ok(refined.report.refinement && refined.report.refinement.fired, "refinement fired");
  assert.strictEqual(calls, 3, "exactly 3 text-model stub calls with refinement, got " + calls);
  console.log("refinement ok attempts calls=" + calls + " score=" + (refined.analysis && refined.analysis.score));

  // PPTX gate: forced line-budget mismatch vs soffice-skip path
  const { runPptxGate, findSoffice } = require("./pptxGate");
  const gateDeckPath = path.join(ROOT, "docs", "template-pipeline", "composer", "proof-payroll-4d2-online", "deck.json");
  assert.ok(fs.existsSync(gateDeckPath), "4d2-online deck for pptx gate");
  const mismatchDeck = JSON.parse(fs.readFileSync(gateDeckPath, "utf8"));
  const seq = mismatchDeck.layoutSequence || Object.keys(mismatchDeck.layouts || {});
  let forced = false;
  seq.forEach((layoutId) => {
    const layout = mismatchDeck.layouts[layoutId];
    (layout.elements || []).forEach((el) => {
      if (forced || !el || el.type !== "text") return;
      const text = ((el.textContent && el.textContent.spans) || []).map((s) => s.text || "").join("");
      if (text.length < 40) return;
      el.textMeasure = Object.assign({}, el.textMeasure || {}, { lines: 1 });
      forced = true;
    });
  });
  assert.ok(forced, "forced textMeasure.lines=1 on a long body");
  const mismatchOut = path.join(ROOT, "docs", "template-pipeline", "composer", "_test-pptx-mismatch");
  fs.mkdirSync(mismatchOut, { recursive: true });
  const mismatchGate = await runPptxGate(mismatchDeck, mismatchOut);
  if (mismatchGate.skipped) {
    assert.ok(/pptx gate skipped/i.test(mismatchGate.reason || ""), "skip reason");
    console.log("pptx gate skipped path ok (no soffice/tools)");
  } else {
    assert.strictEqual(mismatchGate.pass, false, "forced lines=1 must fail pptx mismatch");
    assert.ok((mismatchGate.failures || []).some((f) => /pptx mismatch/i.test(f)), "pptx mismatch in failures");
    console.log("pptx mismatch hard fail ok");
  }

  const replayOnline = path.join(ROOT, "docs", "template-pipeline", "composer", "proof-payroll-4d2-online");
  const onlineOut = path.join(ROOT, "docs", "template-pipeline", "composer", "_test-pptx-online");
  global.fetch = async () => { throw new Error("network forbidden during replay"); };
  try {
    const online = await compose({
      prompt: "A corporate payroll company",
      replay: path.relative(ROOT, replayOnline),
      out: path.relative(ROOT, onlineOut),
    }, {
      inventDirection: async () => { throw new Error("inventDirection should not run on replay"); },
      designBrief: async () => { throw new Error("designBrief should not run on replay"); },
      searchPexels: async () => { throw new Error("searchPexels should not run on replay"); },
      downloadPhoto: async () => { throw new Error("downloadPhoto should not run on replay"); },
    });
    assert.ok(fs.existsSync(path.join(onlineOut, "deck.pptx")) || (online.analysis && online.analysis.pptxGate && online.analysis.pptxGate.skipped), "deck.pptx or skipped gate");
    if (online.analysis && online.analysis.pptxGate && online.analysis.pptxGate.skipped) {
      console.log("4d2-online replay pptx gate skipped ok");
    } else {
      const fails = (online.analysis && online.analysis.failures) || [];
      assert.ok(!fails.some((f) => /pptx mismatch/i.test(String(f))), "4d2-online replay must not pptx-mismatch: " + JSON.stringify(fails));
      console.log("4d2-online replay pptx gate pass ok soffice=" + Boolean(findSoffice()));
    }
  } finally {
    global.fetch = origFetch;
  }

  // A0.b: alignX/alignY → pptxgen crop srcRect matches coverSizing arithmetic
  {
    const { exportDeckPptx } = require("../catalog");
    const { Image } = require("canvas");
    const JSZip = require("jszip");
    const photoAbs = FIXTURE_PHOTO;
    const img = new Image();
    img.src = fs.readFileSync(photoAbs);
    const iw = img.width;
    const ih = img.height;
    // Wide short box so cover leaves vertical overflow (ay matters).
    const elBox = { x: 100, y: 50, width: 800, height: 300 };
    const ax = 0.2;
    const ay = 0.8;
    const scale = Math.max(elBox.width / iw, elBox.height / ih);
    const scaledW = iw * scale;
    const scaledH = ih * scale;
    const ox = Math.max(0, (scaledW - elBox.width) * ax);
    const oy = Math.max(0, (scaledH - elBox.height) * ay);
    const alignDeck = {
      schemaVersion: 2,
      id: "align-crop-test",
      tokens: { color: { bg: "#ffffff", ink: "#000000" }, font: { display: "Calibri", text: "Calibri" } },
      layoutSequence: ["slide-1"],
      layouts: {
        "slide-1": {
          version: 2,
          id: "slide-1",
          canvas: { width: 1600, height: 900, aspectRatio: "16:9" },
          elements: [{
            id: "crop-photo",
            type: "image",
            x: elBox.x,
            y: elBox.y,
            width: elBox.width,
            height: elBox.height,
            zIndex: 1,
            imageContent: {
              url: "photos/composer/proof/" + path.basename(photoAbs),
              fit: "cover",
              alignX: ax,
              alignY: ay,
            },
          }],
        },
      },
    };
    const alignOut = path.join(ROOT, "docs", "template-pipeline", "composer", "_test-align-crop");
    fs.mkdirSync(alignOut, { recursive: true });
    const pptxPath = path.join(alignOut, "deck.pptx");
    await exportDeckPptx(alignDeck, pptxPath);
    const zip = await JSZip.loadAsync(fs.readFileSync(pptxPath));
    const slideXml = await zip.file("ppt/slides/slide1.xml").async("string");
    assert.ok(/srcRect/i.test(slideXml), "slide1.xml has srcRect");
    const src = slideXml.match(/srcRect\b([^>]*)/i);
    assert.ok(src, "srcRect attributes present");
    const attrs = src[1];
    const num = (name) => {
      const m = attrs.match(new RegExp(name + "=\"([^\"]+)\"", "i"));
      return m ? Number(m[1]) : 0;
    };
    // pptxgenjs encodes crop as percentages × 100000 of the source image.
    const left = num("l") / 100000;
    const top = num("t") / 100000;
    const expectedLeft = ox / scaledW;
    const expectedTop = oy / scaledH;
    console.log("coverSizing numbers", JSON.stringify({
      iw, ih, elBox, ax, ay, scale, scaledW, scaledH, ox, oy,
      expectedLeft, expectedTop, srcRect: { l: num("l"), t: num("t"), r: num("r"), b: num("b") },
    }));
    assert.ok(Math.abs(left - expectedLeft) < 0.02, "srcRect l≈ox/scaledW got " + left + " want " + expectedLeft);
    assert.ok(Math.abs(top - expectedTop) < 0.02, "srcRect t≈oy/scaledH got " + top + " want " + expectedTop);
    console.log("alignX/alignY srcRect crop ok");
  }

  // Rhythm repairs
  {
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "design-system", "manifest.json"), "utf8"));
    const baseCopy = (role) => {
      if (role === "Cover") return { title: "Cover title for payroll", body: "Cover body stays short.", kicker: "2026" };
      if (role === "Contents") return { title: "Contents", "item-1": "One", "item-2": "Two", "item-3": "Three", "item-4": "Four" };
      if (role === "Close") return { title: "Close title here", body: "Close body invite.", kicker: "Next" };
      if (role === "People") return { title: "People title", "name-1": "Alex", "role-1": "CEO", "name-2": "Sam", "role-2": "CS", "name-3": "Casey", "role-3": "Eng" };
      if (role === "Proof" || role === "Market") {
        return {
          title: "Proof title", body: "Proof body text under limit.",
          "stat-1": "47%", "stat-2": "12d", "stat-3": "98%",
          "label-1": "Churn", "label-2": "Close", "label-3": "On-time",
          number: "99.9%", label: "Accuracy", quote: "A short customer quote about payroll calm.", attribution: "Jordan Lee",
          statement: "Payroll should disappear into the workday.",
        };
      }
      return {
        title: "Section title for " + role,
        body: "Body copy for " + role + " under one hundred sixty.",
        "bullet-1": "First bullet point under eighty characters",
        "bullet-2": "Second bullet point under eighty characters",
        "bullet-3": "Third bullet point under eighty characters",
        statement: "Payroll should disappear into the workday.",
        kicker: "Note",
        "step-title-1": "Connect", "step-body-1": "Link systems once.",
        "step-title-2": "Configure", "step-body-2": "Map pay codes.",
        "step-title-3": "Run", "step-body-3": "Approve and fund.",
      };
    };

    const dup = {
      plan: [
        { role: "Cover", component: "cover", variant: "word" },
        { role: "About", component: "split-copy", variant: "photo-right" },
        { role: "Problem", component: "split-copy", variant: "photo-right" },
        { role: "Close", component: "close", variant: "plain" },
      ],
      accentRole: "About",
      paletteBucket: "light-neutral",
      fontPair: "corp-calibri",
      density: "balanced",
      coverPattern: "oversized",
      signature: "frame",
      copy: { Cover: baseCopy("Cover"), About: baseCopy("About"), Problem: baseCopy("Problem"), Close: baseCopy("Close") },
    };
    const dupV = validateBrief(dup, manifest, "rhythm-dup", "n1");
    assert.ok(dupV.fallbacks.some((f) => f.field === "rhythm.duplicateVariant"), "duplicate variant repaired");
    assert.notStrictEqual(dupV.brief.plan[2].variant, "photo-right", "second variant swapped");

    const photoHeavy = {
      plan: [
        { role: "Cover", component: "cover", variant: "split" },
        { role: "About", component: "split-copy", variant: "photo-right" },
        { role: "Problem", component: "split-copy", variant: "photo-left" },
        { role: "Solution", component: "split-copy", variant: "photo-wide" },
        { role: "Close", component: "close", variant: "photo" },
      ],
      accentRole: "About",
      paletteBucket: "light-neutral",
      fontPair: "corp-calibri",
      density: "balanced",
      coverPattern: "split",
      signature: "frame",
      copy: {
        Cover: baseCopy("Cover"), About: baseCopy("About"), Problem: baseCopy("Problem"),
        Solution: baseCopy("Solution"), Close: baseCopy("Close"),
      },
    };
    const ph = validateBrief(photoHeavy, manifest, "rhythm-photo", "n2");
    assert.ok(ph.fallbacks.some((f) => f.field === "rhythm.photoCap"), "photo cap repaired");

    const noMoment = {
      plan: [
        { role: "Cover", component: "cover", variant: "word" },
        { role: "About", component: "split-copy", variant: "photo-right" },
        { role: "Problem", component: "split-copy", variant: "photo-left" },
        { role: "Close", component: "close", variant: "plain" },
      ],
      accentRole: "Missing",
      paletteBucket: "light-neutral",
      fontPair: "corp-calibri",
      density: "balanced",
      coverPattern: "oversized",
      signature: "frame",
      copy: { Cover: baseCopy("Cover"), About: baseCopy("About"), Problem: baseCopy("Problem"), Close: baseCopy("Close") },
    };
    const nm = validateBrief(noMoment, manifest, "rhythm-moment", "n3");
    assert.ok(nm.fallbacks.some((f) => f.field === "rhythm.accentMoment" || f.field === "accentRole"), "accent moment/role repaired");
    assert.ok(nm.brief.plan.some((s) => s.component === "statement" || s.component === "big-number" || s.component === "divider"), "moment present");

    const clean = {
      plan: [
        { role: "Cover", component: "cover", variant: "word" },
        { role: "Contents", component: "agenda", variant: "numbered-list" },
        { role: "About", component: "statement", variant: "left" },
        { role: "Problem", component: "split-copy", variant: "photo-right" },
        { role: "Solution", component: "split-copy", variant: "photo-left" },
        { role: "Proof", component: "big-number", variant: "left" },
        { role: "Close", component: "close", variant: "plain" },
      ],
      accentRole: "Proof",
      paletteBucket: "light-neutral",
      fontPair: "corp-calibri",
      density: "balanced",
      coverPattern: "oversized",
      signature: "frame",
      copy: {
        Cover: baseCopy("Cover"), Contents: baseCopy("Contents"), About: Object.assign(baseCopy("About"), { statement: "Payroll should disappear into the workday." }),
        Problem: baseCopy("Problem"), Solution: baseCopy("Solution"),
        Proof: Object.assign(baseCopy("Proof"), { number: "99.9%", label: "Accuracy", body: "Proof body text under limit." }),
        Close: baseCopy("Close"),
      },
    };
    const cl = validateBrief(clean, manifest, "rhythm-clean", "n4");
    const rhythmFields = (cl.fallbacks || []).filter((f) => /^rhythm\.|^accentRole$/.test(f.field));
    assert.strictEqual(rhythmFields.length, 0, "clean brief has no rhythm repairs: " + JSON.stringify(rhythmFields));
    console.log("rhythm rules ok");

    // 9-slide full coverage offline compose
    const nine = {
      plan: [
        { role: "Cover", component: "cover", variant: "word" },
        { role: "Contents", component: "agenda", variant: "numbered-list" },
        { role: "About", component: "split-copy", variant: "photo-right" },
        { role: "Problem", component: "statement", variant: "left" },
        { role: "Solution", component: "split-copy", variant: "photo-left" },
        { role: "Proof", component: "big-number", variant: "left" },
        { role: "Market", component: "stat-row", variant: "three-up" },
        { role: "People", component: "team-grid", variant: "three" },
        { role: "Close", component: "close", variant: "plain" },
      ],
      accentRole: "Proof",
      paletteBucket: "light-neutral",
      fontPair: "corp-calibri",
      density: "balanced",
      coverPattern: "oversized",
      signature: "frame",
      copy: {
        Cover: baseCopy("Cover"),
        Contents: Object.assign(baseCopy("Contents"), { "item-1": "About", "item-2": "Problem", "item-3": "Solution", "item-4": "Proof", "item-5": "Market", "item-6": "People" }),
        About: baseCopy("About"),
        Problem: Object.assign(baseCopy("Problem"), { statement: "Payroll should disappear into the workday." }),
        Solution: baseCopy("Solution"),
        Proof: Object.assign(baseCopy("Proof"), { number: "99.9%", label: "On-time accuracy", body: "Accuracy stays high across every local run." }),
        Market: baseCopy("Market"),
        People: baseCopy("People"),
        Close: baseCopy("Close"),
      },
    };
    const nineOut = path.join(ROOT, "docs", "template-pipeline", "composer", "_test-nine");
    const nineResult = await compose({
      prompt: "A corporate payroll company",
      nonce: "test-nine-4f",
      out: path.relative(ROOT, nineOut),
    }, {
      inventDirection: async () => fixtureDirection(),
      designBrief: async () => nine,
      searchPexels: async () => [{ download: "file://" + FIXTURE_PHOTO, url: "file://" + FIXTURE_PHOTO }],
      downloadPhoto: async (url, file) => {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.copyFileSync(FIXTURE_PHOTO, file);
        return 1;
      },
    });
    const nineGeo = nineResult.analysis;
    assert.ok(nineGeo, "nine analysis");
    assert.ok(!(nineGeo.failures || []).length || nineGeo.score === 100, "nine hard fails empty or score 100: " + JSON.stringify(nineGeo.failures));
    if (nineGeo.pptxGate && !nineGeo.pptxGate.skipped) {
      assert.ok(nineGeo.pptxGate.pass, "nine pptx gate pass");
    }
    console.log("nine-slide compose ok score=" + nineGeo.score);
  }

  console.log("composer.test passed");
}

run().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
