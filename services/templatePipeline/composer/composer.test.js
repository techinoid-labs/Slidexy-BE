/**
 * Offline compose characterization (4f-1: plan-first, hard repairs, copyFill).
 *
 *   node services/templatePipeline/composer/composer.test.js
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { compose, collapseStacks, applySlotCopy } = require("./composeRuntime");
const {
  validatePlan,
  validateCopy,
  copyPrompt,
  slotsForSlide,
  listEmptySlots,
} = require("./brief");
const { composerHardFails } = require("./hardFails");

const ROOT = path.join(__dirname, "..", "..", "..");
const FIXTURE_PHOTO = path.join(ROOT, "generated-templates", "photos", "composer", "proof", "landscape-01.jpg");
const FALLBACK_PHOTO = path.join(ROOT, "generated-templates", "photos", "thematic", "phase-3-payroll", "landscape-01.jpg");
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, "design-system", "manifest.json"), "utf8"));

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

function baseCopy(role) {
  if (role === "Cover") return { title: "Cover title for payroll", body: "Cover body stays short.", kicker: "2026" };
  if (role === "Contents") {
    return {
      title: "Contents",
      "item-1": "About",
      "item-2": "Problem",
      "item-3": "Solution",
      "item-4": "Proof",
      "item-5": "Market",
      "item-6": "People",
    };
  }
  if (role === "Close") return { title: "Close title here", body: "Close body invite.", kicker: "Next" };
  if (role === "People") {
    return {
      title: "People title",
      "name-1": "Alex",
      "role-1": "CEO",
      "name-2": "Sam",
      "role-2": "CS",
      "name-3": "Casey",
      "role-3": "Eng",
      "name-4": "Riley",
      "role-4": "Finance",
    };
  }
  if (role === "Proof" || role === "Market") {
    return {
      title: "Proof title",
      body: "Proof body text under limit.",
      "stat-1": "47%",
      "stat-2": "12d",
      "stat-3": "98%",
      "label-1": "Churn",
      "label-2": "Close",
      "label-3": "On-time",
      number: "99.9%",
      label: "Accuracy",
      quote: "A short customer quote about payroll calm.",
      attribution: "Jordan Lee",
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
    "step-title-1": "Connect",
    "step-body-1": "Link systems once.",
    "step-title-2": "Configure",
    "step-body-2": "Map pay codes.",
    "step-title-3": "Run",
    "step-body-3": "Approve and fund.",
  };
}

function indexCopyFromPlan(plan, roleCopy) {
  const copy = {};
  (plan || []).forEach((slide, index) => {
    copy[String(index)] = Object.assign({}, roleCopy[slide.role] || baseCopy(slide.role));
  });
  return copy;
}

function cleanNinePlan() {
  return {
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
    mood: "confident",
  };
}

function photoDeps() {
  return {
    searchPexels: async () => [{ download: "file://" + FIXTURE_PHOTO, url: "file://" + FIXTURE_PHOTO }],
    downloadPhoto: async (url, file) => {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.copyFileSync(FIXTURE_PHOTO, file);
      return fs.statSync(file).size;
    },
  };
}

async function run() {
  ensureFixturePhoto();
  let calls = 0;
  const out = path.join(ROOT, "docs", "template-pipeline", "composer", "_test-compose");
  const nonce = "test-nonce-4f1";

  const stubPlan = cleanNinePlan();
  stubPlan.plan[2] = { role: "About", component: "not-a-real-component", variant: "photo-right" };

  const deps = Object.assign({
    inventDirection: async () => { calls += 1; return fixtureDirection(); },
    planBrief: async () => { calls += 1; return stubPlan; },
    copyBrief: async (prompt, direction, finalPlan) => {
      calls += 1;
      // Fill every required slot from the repaired plan (index-keyed).
      const copy = {};
      (finalPlan.plan || []).forEach((slide, index) => {
        const block = Object.assign({}, baseCopy(slide.role));
        if (slide.role === "Cover") {
          block.title = "Apex Payroll";
          block.body = "Y".repeat(200);
          block.kicker = "2026";
        }
        if (slide.role === "About" && slide.component === "split-copy") {
          block.title = "About Apex";
          block.body = "X".repeat(200);
        }
        if (slide.role === "Close") {
          block.title = "Let's talk";
          block.body = "Short close invite.";
          block.kicker = "Next";
        }
        copy[String(index)] = block;
      });
      return copy;
    },
  }, photoDeps());

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
  assert.strictEqual(calls, 3, "exactly 3 text-model stub calls (invent+plan+copy), got " + calls);
  assert.ok(replacements.copyFill && replacements.copyFill.fired === false, "copyFill not fired on clean fill");
  assert.ok(replacements.refinement && replacements.refinement.fired === false, "component-swap refinement removed");

  const fallbacks = replacements.fallbacks || [];
  assert.ok(fallbacks.some((f) => /component/.test(f.field) && f.got === "not-a-real-component"), "invalid component fallback");
  assert.ok(fallbacks.some((f) => /clamped/.test(String(f.used))), "overlong copy clamped");

  let photoFilled = 0;
  Object.keys(deck.layouts).forEach((id) => {
    (deck.layouts[id].elements || []).forEach((el) => {
      const content = el.imageContent || el.maskedImageContent;
      if (content && content.url) photoFilled += 1;
    });
  });
  assert.ok(photoFilled >= 1, "photo slots filled");
  assert.ok(result.analysis, "geometry/analysis reported");
  assert.ok(result.analysis.aesthetic, "aesthetic summary attached");
  console.log("compose offline ok score=" + (result.analysis && result.analysis.score) + " calls=" + calls);

  // Missing image hard fail
  calls = 0;
  const missingOut = path.join(ROOT, "docs", "template-pipeline", "composer", "_test-compose-missing");
  await compose({
    prompt: "A corporate payroll company",
    nonce: "test-nonce-missing",
    out: path.relative(ROOT, missingOut),
  }, {
    inventDirection: async () => { calls += 1; return fixtureDirection(); },
    planBrief: async () => { calls += 1; return cleanNinePlan(); },
    copyBrief: async (p, d, finalPlan) => {
      calls += 1;
      return indexCopyFromPlan(finalPlan.plan, {
        Cover: baseCopy("Cover"),
        Contents: baseCopy("Contents"),
        About: baseCopy("About"),
        Problem: Object.assign(baseCopy("Problem"), { statement: "Payroll should disappear into the workday." }),
        Solution: baseCopy("Solution"),
        Proof: Object.assign(baseCopy("Proof"), { number: "99.9%", label: "Accuracy" }),
        Market: baseCopy("Market"),
        People: baseCopy("People"),
        Close: baseCopy("Close"),
      });
    },
    searchPexels: async () => [{ download: "file://" + FIXTURE_PHOTO, url: "file://" + FIXTURE_PHOTO }],
    downloadPhoto: async () => 0,
  });
  const missingDeck = JSON.parse(fs.readFileSync(path.join(missingOut, "deck.json"), "utf8"));
  const missingFails = (missingDeck.qa && missingDeck.qa.failures) || [];
  assert.ok(missingFails.some((f) => /missing image/i.test(String(f))), "missing-image hard fail: " + JSON.stringify(missingFails));
  console.log("missing-image hard fail ok");

  // copyFill: two empty required slots → exactly one fill call listing those two
  calls = 0;
  let fillArgs = null;
  const fillOut = path.join(ROOT, "docs", "template-pipeline", "composer", "_test-copyfill");
  const fillPlan = cleanNinePlan();
  await compose({
    prompt: "A corporate payroll company",
    nonce: "test-copyfill-4f1",
    out: path.relative(ROOT, fillOut),
  }, Object.assign({
    inventDirection: async () => { calls += 1; return fixtureDirection(); },
    planBrief: async () => { calls += 1; return fillPlan; },
    copyBrief: async (p, d, finalPlan) => {
      calls += 1;
      const copy = indexCopyFromPlan(finalPlan.plan, {
        Cover: baseCopy("Cover"),
        Contents: baseCopy("Contents"),
        About: baseCopy("About"),
        Problem: Object.assign(baseCopy("Problem"), { statement: "Payroll should disappear into the workday." }),
        Solution: baseCopy("Solution"),
        Proof: Object.assign(baseCopy("Proof"), { number: "99.9%", label: "Accuracy" }),
        Market: baseCopy("Market"),
        People: baseCopy("People"),
        Close: baseCopy("Close"),
      });
      // Leave two required slots empty on About (index 2)
      const aboutIdx = String(finalPlan.plan.findIndex((s) => s.role === "About"));
      delete copy[aboutIdx]["bullet-2"];
      delete copy[aboutIdx]["bullet-3"];
      copy[aboutIdx]["bullet-2"] = "";
      copy[aboutIdx]["bullet-3"] = "";
      return copy;
    },
    copyFill: async (prompt, empties) => {
      calls += 1;
      fillArgs = empties;
      const out = {};
      empties.forEach((slot) => {
        if (!out[String(slot.index)]) out[String(slot.index)] = {};
        out[String(slot.index)][slot.key] = "Filled " + slot.key;
      });
      return out;
    },
  }, photoDeps()));
  const fillReport = JSON.parse(fs.readFileSync(path.join(fillOut, "replacements.json"), "utf8"));
  assert.ok(fillReport.copyFill && fillReport.copyFill.fired, "copyFill fired");
  assert.ok(Array.isArray(fillArgs) && fillArgs.length === 2, "copyFill listed exactly two slots, got " + JSON.stringify(fillArgs));
  const keys = fillArgs.map((s) => s.key).sort();
  assert.deepStrictEqual(keys, ["bullet-2", "bullet-3"], "empty slots are bullet-2 and bullet-3");
  assert.ok(fillArgs.every((s) => Number.isFinite(s.maxChars)), "copyFill slots include maxChars");
  assert.strictEqual(calls, 4, "invent+plan+copy+fill = 4, got " + calls);
  console.log("copyFill ok slots=" + fillReport.copyFill.slots.join(","));

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

  // Replay: zero network — migrate legacy role-keyed copy
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
      planBrief: async () => { throw new Error("planBrief should not run on replay"); },
      copyBrief: async () => { throw new Error("copyBrief should not run on replay"); },
      searchPexels: async () => { throw new Error("searchPexels should not run on replay"); },
      downloadPhoto: async () => { throw new Error("downloadPhoto should not run on replay"); },
    });
    assert.ok(replayed.report && replayed.report.replay === true, "replay flag");
    assert.strictEqual(replayed.report.textModelCalls, 0, "zero model calls on replay");
    console.log("replay zero-network ok score=" + (replayed.analysis && replayed.analysis.score));
  } finally {
    global.fetch = origFetch;
  }

  // Hard plan rules: each violation repaired + recorded
  {
    const noCover = {
      plan: [
        { role: "About", component: "statement", variant: "left" },
        { role: "Problem", component: "split-copy", variant: "photo-right" },
        { role: "Solution", component: "split-copy", variant: "photo-left" },
        { role: "Proof", component: "big-number", variant: "left" },
        { role: "Model", component: "process", variant: "three-step" },
        { role: "Close", component: "close", variant: "plain" },
      ],
      accentRole: "Proof",
      paletteBucket: "light-neutral",
      fontPair: "corp-calibri",
      density: "balanced",
      coverPattern: "oversized",
      signature: "frame",
    };
    const r1 = validatePlan(noCover, MANIFEST, "rule-cover", "n1");
    assert.strictEqual(r1.plan.plan[0].role, "Cover", "Cover first");
    assert.ok(r1.fallbacks.some((f) => /cover/i.test(f.field) || /Cover/.test(String(f.reason))), "Cover repair recorded");

    const noClose = {
      plan: [
        { role: "Cover", component: "cover", variant: "word" },
        { role: "Contents", component: "agenda", variant: "numbered-list" },
        { role: "About", component: "statement", variant: "left" },
        { role: "Problem", component: "split-copy", variant: "photo-right" },
        { role: "Solution", component: "split-copy", variant: "photo-left" },
        { role: "Proof", component: "big-number", variant: "left" },
        { role: "Model", component: "process", variant: "three-step" },
        { role: "People", component: "team-grid", variant: "three" },
      ],
      accentRole: "Proof",
      paletteBucket: "light-neutral",
      fontPair: "corp-calibri",
      density: "balanced",
      coverPattern: "oversized",
      signature: "frame",
    };
    const r2 = validatePlan(noClose, MANIFEST, "rule-close", "n2");
    assert.strictEqual(r2.plan.plan[r2.plan.plan.length - 1].role, "Close", "Close last");
    assert.ok(r2.fallbacks.some((f) => /close/i.test(f.field)), "Close repair recorded");

    const noContents = {
      plan: [
        { role: "Cover", component: "cover", variant: "word" },
        { role: "About", component: "statement", variant: "left" },
        { role: "Problem", component: "split-copy", variant: "photo-right" },
        { role: "Solution", component: "split-copy", variant: "photo-left" },
        { role: "Proof", component: "big-number", variant: "left" },
        { role: "Model", component: "process", variant: "three-step" },
        { role: "People", component: "team-grid", variant: "three" },
        { role: "Close", component: "close", variant: "plain" },
      ],
      accentRole: "Proof",
      paletteBucket: "light-neutral",
      fontPair: "corp-calibri",
      density: "balanced",
      coverPattern: "oversized",
      signature: "frame",
    };
    const r3 = validatePlan(noContents, MANIFEST, "rule-contents", "n3");
    assert.ok(r3.plan.plan.some((s) => s.role === "Contents"), "Contents present");
    assert.ok(r3.fallbacks.some((f) => /contents/i.test(f.field)), "Contents repair recorded");

    const dupProof = {
      plan: [
        { role: "Cover", component: "cover", variant: "word" },
        { role: "Contents", component: "agenda", variant: "numbered-list" },
        { role: "About", component: "statement", variant: "left" },
        { role: "Problem", component: "split-copy", variant: "photo-right" },
        { role: "Solution", component: "split-copy", variant: "photo-left" },
        { role: "Proof", component: "big-number", variant: "left" },
        { role: "Proof", component: "stat-row", variant: "three-up" },
        { role: "Model", component: "process", variant: "three-step" },
        { role: "Close", component: "close", variant: "plain" },
      ],
      accentRole: "Proof",
      paletteBucket: "light-neutral",
      fontPair: "corp-calibri",
      density: "balanced",
      coverPattern: "oversized",
      signature: "frame",
    };
    const r4 = validatePlan(dupProof, MANIFEST, "rule-dup", "n4");
    assert.strictEqual(r4.plan.plan.filter((s) => s.role === "Proof").length, 1, "Proof not duplicated");
    assert.ok(r4.fallbacks.some((f) => f.field === "plan.duplicateRole"), "duplicate role recorded");

    const thinAps = {
      plan: [
        { role: "Cover", component: "cover", variant: "word" },
        { role: "Contents", component: "agenda", variant: "numbered-list" },
        { role: "About", component: "statement", variant: "left" },
        { role: "Proof", component: "big-number", variant: "left" },
        { role: "Model", component: "process", variant: "three-step" },
        { role: "Close", component: "close", variant: "plain" },
      ],
      accentRole: "Proof",
      paletteBucket: "light-neutral",
      fontPair: "corp-calibri",
      density: "balanced",
      coverPattern: "oversized",
      signature: "frame",
    };
    const r5 = validatePlan(thinAps, MANIFEST, "rule-aps", "n5");
    assert.ok(r5.plan.plan.filter((s) => /About|Problem|Solution/.test(s.role)).length >= 3, "APS coverage");
    assert.ok(r5.fallbacks.some((f) => f.field === "plan.aps"), "APS repair recorded");

    // Missing About → inserted at index 2 (after Contents)
    const missingAbout = {
      plan: [
        { role: "Cover", component: "cover", variant: "word" },
        { role: "Contents", component: "agenda", variant: "numbered-list" },
        { role: "Problem", component: "statement", variant: "left" },
        { role: "Solution", component: "split-copy", variant: "photo-left" },
        { role: "Proof", component: "big-number", variant: "left" },
        { role: "Model", component: "process", variant: "three-step" },
        { role: "People", component: "team-grid", variant: "three" },
        { role: "Close", component: "close", variant: "plain" },
      ],
      accentRole: "Proof",
      paletteBucket: "light-neutral",
      fontPair: "corp-calibri",
      density: "balanced",
      coverPattern: "oversized",
      signature: "frame",
    };
    const rAbout = validatePlan(missingAbout, MANIFEST, "rule-about-slot", "nAbout");
    assert.strictEqual(rAbout.plan.plan[2].role, "About", "missing About inserted at index 2, got " + JSON.stringify(rAbout.plan.plan.map((s) => s.role)));
    assert.ok(rAbout.fallbacks.some((f) => f.field === "plan.aps" && /About@2/.test(String(f.used))), "About@2 fallback recorded");

    // About after Next → moved into narrative band (after Contents, before Proof/Market)
    const aboutAfterNext = {
      plan: [
        { role: "Cover", component: "cover", variant: "word" },
        { role: "Contents", component: "agenda", variant: "numbered-list" },
        { role: "Problem", component: "statement", variant: "left" },
        { role: "Solution", component: "split-copy", variant: "photo-left" },
        { role: "Proof", component: "big-number", variant: "left" },
        { role: "Model", component: "process", variant: "three-step" },
        { role: "People", component: "team-grid", variant: "three" },
        { role: "Next", component: "statement", variant: "with-kicker" },
        { role: "About", component: "split-copy", variant: "photo-right" },
        { role: "Close", component: "close", variant: "plain" },
      ],
      accentRole: "Proof",
      paletteBucket: "light-neutral",
      fontPair: "corp-calibri",
      density: "balanced",
      coverPattern: "oversized",
      signature: "frame",
    };
    const rMove = validatePlan(aboutAfterNext, MANIFEST, "rule-about-move", "nMove");
    const rolesMove = rMove.plan.plan.map((s) => s.role);
    const aboutIdx = rolesMove.indexOf("About");
    const proofIdx = rolesMove.findIndex((r) => r === "Proof" || r === "Market");
    const lateIdx = rolesMove.findIndex((r) => r === "Model" || r === "People" || r === "Next");
    assert.ok(aboutIdx > rolesMove.indexOf("Contents"), "About after Contents");
    assert.ok(proofIdx < 0 || aboutIdx < proofIdx, "About before Proof/Market: " + rolesMove.join(">"));
    assert.ok(lateIdx < 0 || aboutIdx < lateIdx, "About never after Model/People/Next: " + rolesMove.join(">"));
    assert.ok(rMove.fallbacks.some((f) => f.field === "plan.narrativeOrder"), "narrativeOrder fallback recorded");
    console.log("narrative band ok missingAbout@2 moveRoles=" + rolesMove.join(">"));

    // Narrative band sort About → Problem → Solution (repeats keep relative order)
    const unsorted = {
      plan: [
        { role: "Cover", component: "cover", variant: "word" },
        { role: "Contents", component: "agenda", variant: "numbered-list" },
        { role: "Solution", component: "split-copy", variant: "photo-left" },
        { role: "About", component: "statement", variant: "left" },
        { role: "Problem", component: "split-copy", variant: "photo-right" },
        { role: "About", component: "statement", variant: "with-kicker" },
        { role: "Proof", component: "big-number", variant: "left" },
        { role: "Model", component: "process", variant: "three-step" },
        { role: "Close", component: "close", variant: "plain" },
      ],
      accentRole: "Proof",
      paletteBucket: "light-neutral",
      fontPair: "corp-calibri",
      density: "balanced",
      coverPattern: "oversized",
      signature: "frame",
    };
    const rSort = validatePlan(unsorted, MANIFEST, "rule-narrative-sort", "nSort");
    const bandRoles = [];
    for (let i = 0; i < rSort.plan.plan.length; i += 1) {
      const role = rSort.plan.plan[i].role;
      if (role === "Proof" || role === "Market" || role === "Model" || role === "People" || role === "Next" || role === "Close") break;
      if (role === "About" || role === "Problem" || role === "Solution") bandRoles.push(role);
    }
    assert.deepStrictEqual(bandRoles, ["About", "About", "Problem", "Solution"], "APS sorted with repeats stable: " + bandRoles.join(">"));
    assert.ok(rSort.fallbacks.some((f) => f.field === "plan.narrativeSort"), "narrativeSort fallback recorded");
    console.log("narrative sort ok " + bandRoles.join(">"));

    const noProof = {
      plan: [
        { role: "Cover", component: "cover", variant: "word" },
        { role: "Contents", component: "agenda", variant: "numbered-list" },
        { role: "About", component: "statement", variant: "left" },
        { role: "Problem", component: "split-copy", variant: "photo-right" },
        { role: "Solution", component: "split-copy", variant: "photo-left" },
        { role: "Model", component: "process", variant: "three-step" },
        { role: "People", component: "team-grid", variant: "three" },
        { role: "Close", component: "close", variant: "plain" },
      ],
      accentRole: "About",
      paletteBucket: "light-neutral",
      fontPair: "corp-calibri",
      density: "balanced",
      coverPattern: "oversized",
      signature: "frame",
    };
    const r6 = validatePlan(noProof, MANIFEST, "rule-proof", "n6");
    assert.ok(r6.plan.plan.some((s) => s.role === "Proof" || s.role === "Market"), "Proof/Market present");
    assert.ok(r6.fallbacks.some((f) => f.field === "plan.proofMarket"), "Proof/Market repair recorded");

    const noModel = {
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
    };
    const r7 = validatePlan(noModel, MANIFEST, "rule-model", "n7");
    assert.ok(r7.plan.plan.some((s) => /Model|People|Next/.test(s.role)), "Model/People/Next present");
    assert.ok(r7.fallbacks.some((f) => f.field === "plan.modelPeopleNext"), "Model/People/Next repair recorded");

    const short = {
      plan: [
        { role: "Cover", component: "cover", variant: "word" },
        { role: "Contents", component: "agenda", variant: "numbered-list" },
        { role: "About", component: "statement", variant: "left" },
        { role: "Close", component: "close", variant: "plain" },
      ],
      accentRole: "About",
      paletteBucket: "light-neutral",
      fontPair: "corp-calibri",
      density: "balanced",
      coverPattern: "oversized",
      signature: "frame",
    };
    const r8 = validatePlan(short, MANIFEST, "rule-len", "n8");
    assert.ok(r8.plan.plan.length >= 9 && r8.plan.plan.length <= 11, "length 9-11 got " + r8.plan.plan.length);
    assert.ok(r8.fallbacks.some((f) => f.field === "plan.length" || f.field === "plan.aps" || f.field === "plan.proofMarket" || f.field === "plan.modelPeopleNext"), "length/coverage repairs recorded");

    const twoAccent = {
      plan: [
        { role: "Cover", component: "cover", variant: "word" },
        { role: "Contents", component: "agenda", variant: "numbered-list" },
        { role: "About", component: "statement", variant: "left" },
        { role: "Problem", component: "divider", variant: "accent-block" },
        { role: "Solution", component: "split-copy", variant: "photo-left" },
        { role: "Proof", component: "big-number", variant: "left" },
        { role: "Market", component: "divider", variant: "accent-block" },
        { role: "Model", component: "process", variant: "three-step" },
        { role: "Close", component: "close", variant: "plain" },
      ],
      accentRole: "Problem",
      paletteBucket: "light-neutral",
      fontPair: "corp-calibri",
      density: "balanced",
      coverPattern: "oversized",
      signature: "frame",
    };
    const r9 = validatePlan(twoAccent, MANIFEST, "rule-accent", "n9");
    const accentBlocks = r9.plan.plan.filter((s) => s.component === "divider" && s.variant === "accent-block");
    assert.ok(accentBlocks.length <= 1, "at most one accent-block");
    assert.ok(accentBlocks.every((s) => s.role === r9.plan.accentRole), "accent-block only on accentRole");
    assert.ok(r9.fallbacks.some((f) => /accent-block|accentRole|accentVariant/i.test(f.field + " " + (f.reason || ""))), "accent repair recorded");

    const dupVar = {
      plan: [
        { role: "Cover", component: "cover", variant: "word" },
        { role: "Contents", component: "agenda", variant: "numbered-list" },
        { role: "About", component: "split-copy", variant: "photo-right" },
        { role: "Problem", component: "split-copy", variant: "photo-right" },
        { role: "Solution", component: "statement", variant: "left" },
        { role: "Proof", component: "big-number", variant: "left" },
        { role: "Model", component: "process", variant: "three-step" },
        { role: "People", component: "team-grid", variant: "three" },
        { role: "Close", component: "close", variant: "plain" },
      ],
      accentRole: "Solution",
      paletteBucket: "light-neutral",
      fontPair: "corp-calibri",
      density: "balanced",
      coverPattern: "oversized",
      signature: "frame",
    };
    const r10 = validatePlan(dupVar, MANIFEST, "rule-rhythm", "n10");
    assert.ok(r10.fallbacks.some((f) => f.field === "rhythm.duplicateVariant" || f.field === "rhythm.duplicateComponent"), "consecutive dup repaired");
    assert.notStrictEqual(r10.plan.plan[3].variant, "photo-right", "second consecutive variant swapped");

    const photoHeavy = {
      plan: [
        { role: "Cover", component: "cover", variant: "split" },
        { role: "Contents", component: "agenda", variant: "numbered-list" },
        { role: "About", component: "split-copy", variant: "photo-right" },
        { role: "Problem", component: "split-copy", variant: "photo-left" },
        { role: "Solution", component: "split-copy", variant: "photo-wide" },
        { role: "Proof", component: "big-number", variant: "left" },
        { role: "People", component: "team-grid", variant: "three" },
        { role: "Next", component: "close", variant: "photo" },
        { role: "Close", component: "close", variant: "photo" },
      ],
      accentRole: "Proof",
      paletteBucket: "light-neutral",
      fontPair: "corp-calibri",
      density: "balanced",
      coverPattern: "split",
      signature: "frame",
    };
    const r11 = validatePlan(photoHeavy, MANIFEST, "rule-photo", "n11");
    assert.ok(r11.fallbacks.some((f) => f.field === "rhythm.photoCap") || r11.plan.plan.length <= 11, "photo cap path exercised");

    // Repaired plan's copy request lists repaired component slots
    const badComp = {
      plan: [
        { role: "Cover", component: "cover", variant: "word" },
        { role: "Contents", component: "agenda", variant: "numbered-list" },
        { role: "About", component: "not-a-real-component", variant: "photo-right" },
        { role: "Problem", component: "statement", variant: "left" },
        { role: "Solution", component: "split-copy", variant: "photo-left" },
        { role: "Proof", component: "big-number", variant: "left" },
        { role: "Model", component: "process", variant: "three-step" },
        { role: "People", component: "team-grid", variant: "three" },
        { role: "Close", component: "close", variant: "plain" },
      ],
      accentRole: "Proof",
      paletteBucket: "light-neutral",
      fontPair: "corp-calibri",
      density: "balanced",
      coverPattern: "oversized",
      signature: "frame",
      mood: "confident",
    };
    const repaired = validatePlan(badComp, MANIFEST, "copy-slots", "n12");
    const aboutSlide = repaired.plan.plan.find((s) => s.role === "About");
    assert.ok(aboutSlide && aboutSlide.component !== "not-a-real-component", "About component repaired");
    const promptText = copyPrompt("A corporate payroll company", fixtureDirection(), repaired.plan, MANIFEST);
    assert.ok(promptText.indexOf(aboutSlide.component) >= 0, "copy prompt names repaired component");
    const aboutSlots = slotsForSlide(MANIFEST, aboutSlide);
    assert.ok(aboutSlots.length > 0, "repaired component has slots");
    aboutSlots.forEach((slot) => {
      assert.ok(promptText.indexOf(slot.key) >= 0, "copy prompt lists slot " + slot.key);
      assert.ok(promptText.indexOf(String(slot.maxChars)) >= 0, "copy prompt lists maxChars for " + slot.key);
    });
    console.log("hard plan rules + copy prompt slots ok repairedAbout=" + aboutSlide.component);
  }

  // PPTX gate mismatch path
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

  // A0.b: alignX/alignY → pptxgen crop srcRect
  {
    const { exportDeckPptx } = require("../catalog");
    const { Image } = require("canvas");
    const JSZip = require("jszip");
    const photoAbs = FIXTURE_PHOTO;
    const img = new Image();
    img.src = fs.readFileSync(photoAbs);
    const iw = img.width;
    const ih = img.height;
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
    const left = num("l") / 100000;
    const top = num("t") / 100000;
    const expectedLeft = ox / scaledW;
    const expectedTop = oy / scaledH;
    assert.ok(Math.abs(left - expectedLeft) < 0.02, "srcRect l≈ox/scaledW got " + left + " want " + expectedLeft);
    assert.ok(Math.abs(top - expectedTop) < 0.02, "srcRect t≈oy/scaledH got " + top + " want " + expectedTop);
    console.log("alignX/alignY srcRect crop ok");
  }

  // 9-slide full coverage offline compose
  {
    const nine = cleanNinePlan();
    const nineOut = path.join(ROOT, "docs", "template-pipeline", "composer", "_test-nine");
    calls = 0;
    const nineResult = await compose({
      prompt: "A corporate payroll company",
      nonce: "test-nine-4f1",
      out: path.relative(ROOT, nineOut),
    }, Object.assign({
      inventDirection: async () => { calls += 1; return fixtureDirection(); },
      planBrief: async () => { calls += 1; return nine; },
      copyBrief: async (p, d, finalPlan) => {
        calls += 1;
        return indexCopyFromPlan(finalPlan.plan, {
          Cover: baseCopy("Cover"),
          Contents: baseCopy("Contents"),
          About: baseCopy("About"),
          Problem: Object.assign(baseCopy("Problem"), { statement: "Payroll should disappear into the workday." }),
          Solution: baseCopy("Solution"),
          Proof: Object.assign(baseCopy("Proof"), { number: "99.9%", label: "On-time accuracy", body: "Accuracy stays high across every local run." }),
          Market: baseCopy("Market"),
          People: baseCopy("People"),
          Close: baseCopy("Close"),
        });
      },
    }, photoDeps()));
    const nineGeo = nineResult.analysis;
    assert.ok(nineGeo, "nine analysis");
    assert.strictEqual(calls, 3, "nine clean run is 3 calls, got " + calls);
    assert.ok(!(nineGeo.failures || []).length || nineGeo.score === 100, "nine hard fails empty or score 100: " + JSON.stringify(nineGeo.failures));
    if (nineGeo.pptxGate && !nineGeo.pptxGate.skipped) {
      assert.ok(nineGeo.pptxGate.pass, "nine pptx gate pass");
    }
    console.log("nine-slide compose ok score=" + nineGeo.score + " calls=" + calls);
  }

  // validateCopy leaves empties empty + clamps
  {
    const plan = validatePlan(cleanNinePlan(), MANIFEST, "vc", "n").plan;
    const raw = indexCopyFromPlan(plan.plan, {
      Cover: baseCopy("Cover"),
      Contents: baseCopy("Contents"),
      About: Object.assign(baseCopy("About"), { body: "Z".repeat(400) }),
      Problem: Object.assign(baseCopy("Problem"), { statement: "Payroll should disappear into the workday." }),
      Solution: baseCopy("Solution"),
      Proof: Object.assign(baseCopy("Proof"), { number: "99.9%", label: "Accuracy" }),
      Market: baseCopy("Market"),
      People: baseCopy("People"),
      Close: baseCopy("Close"),
    });
    const aboutIdx = String(plan.plan.findIndex((s) => s.role === "About"));
    raw[aboutIdx]["bullet-2"] = "";
    const vc = validateCopy(raw, plan, MANIFEST);
    assert.strictEqual(vc.copy[aboutIdx]["bullet-2"], "", "missing required stays empty");
    assert.ok(vc.copy[aboutIdx].body.length <= 160, "overlong clamped");
    const empties = listEmptySlots(plan, vc.copy, MANIFEST);
    assert.ok(empties.some((e) => e.key === "bullet-2"), "listEmptySlots sees bullet-2");
  }

  console.log("composer.test passed");
}

run().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
