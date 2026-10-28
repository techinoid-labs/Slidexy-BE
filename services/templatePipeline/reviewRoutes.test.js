/**
 * Review console route helpers (offline).
 *
 *   node services/templatePipeline/reviewRoutes.test.js
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const assert = require("assert");

const ROOT = path.join(__dirname, "..", "..");
const COMPOSER = path.join(ROOT, "docs", "template-pipeline", "composer");
const REVIEWS = path.join(COMPOSER, "reviews");
const FLAGS = path.join(COMPOSER, "gallery", "flags.json");

async function run() {
  const origFetch = global.fetch;
  global.fetch = async () => { throw new Error("network forbidden in reviewRoutes.test"); };

  const rc = require("./composer/reviewConsole");

  // Fixture job under composer (resolveJobDir finds it)
  const fixtureId = "proof-review-fixture-" + Date.now().toString(36);
  const fixtureDir = path.join(COMPOSER, fixtureId);
  fs.mkdirSync(fixtureDir, { recursive: true });
  const deck = {
    schemaVersion: 2,
    id: fixtureId,
    name: "Fixture Review Deck",
    qa: { score: 100, passed: 1, total: 1, failures: [], mode: "manual" },
    layoutSequence: ["slide-1"],
    layouts: { "slide-1": { elements: [] } },
  };
  const replacements = {
    nonce: "fixture-nonce",
    prompt: "A corporate payroll company",
    direction: {
      profile: { brand: "Fixture Co" },
      mood: "test",
      keywords: ["office"],
      query: "office",
      model: "stub",
    },
    brief: {
      plan: [
        { role: "Cover", component: "cover", variant: "word" },
        { role: "Contents", component: "agenda", variant: "numbered-list" },
        { role: "About", component: "statement", variant: "left" },
        { role: "Close", component: "close", variant: "plain" },
      ],
      accentRole: "About",
    },
    fallbacks: [],
    fits: [],
    textModelCalls: 0,
    copy: { "0": { title: "T" }, "1": { title: "C" }, "2": { statement: "S" }, "3": { title: "X" } },
  };
  fs.writeFileSync(path.join(fixtureDir, "deck.json"), JSON.stringify(deck, null, 2) + "\n");
  fs.writeFileSync(path.join(fixtureDir, "replacements.json"), JSON.stringify(replacements, null, 2) + "\n");
  fs.writeFileSync(path.join(fixtureDir, "slide-01.png"), Buffer.from([137, 80, 78, 71]));
  fs.mkdirSync(path.join(fixtureDir, "_pptx-gate"), { recursive: true });
  fs.writeFileSync(path.join(fixtureDir, "_pptx-gate", "lo-slide-1.png"), Buffer.from([137, 80, 78, 71]));

  try {
    // 1. GET review payload
    const payload = rc.getReviewPayload(fixtureId);
    assert.strictEqual(payload.id, fixtureId);
    assert.strictEqual(payload.qa.score, 100);
    assert.ok(payload.plan.length >= 1);
    assert.strictEqual(payload.nonce, "fixture-nonce");
    assert.ok(payload.slides.length >= 1);
    assert.ok(payload.loSlides.length >= 1);
    console.log("getReviewPayload ok");

    // POST review
    const submitted = rc.submitReview(fixtureId, {
      stockText: false,
      spacing: true,
      coverPhoto: false,
      belowBox: false,
      readsDesigned: true,
      worstThree: "none",
      fixType: "none",
      kept: true,
    });
    assert.ok(submitted.ok);
    assert.ok(fs.existsSync(path.join(REVIEWS, fixtureId + ".json")));
    const stored = JSON.parse(fs.readFileSync(path.join(REVIEWS, fixtureId + ".json"), "utf8"));
    assert.strictEqual(stored.kept, true);
    assert.strictEqual(stored.spacing, true);
    assert.ok(stored.replacements && stored.replacements.nonce === "fixture-nonce");
    const listed = rc.listReviews();
    assert.ok(listed.some((r) => r.id === fixtureId && r.kept));
    console.log("submitReview + listReviews ok");

    // 2. Replay with stubbed compose (zero network)
    const replayed = await rc.replayReview(fixtureId, {
      inventDirection: async () => { throw new Error("no invent on replay"); },
      planBrief: async () => { throw new Error("no plan on replay"); },
      copyBrief: async () => { throw new Error("no copy on replay"); },
      searchPexels: async () => { throw new Error("no pexels"); },
      downloadPhoto: async () => { throw new Error("no download"); },
    });
    assert.ok(replayed.id);
    assert.ok(replayed.outDir && /replays\//.test(replayed.outDir));
    assert.strictEqual(replayed.textModelCalls, 0);
    assert.ok(fs.existsSync(path.join(ROOT, replayed.outDir, "deck.json")));
    console.log("replayReview ok id=" + replayed.id + " score=" + (replayed.qa && replayed.qa.score));

    // 3. Gallery + flag
    const gallery = await rc.getGallery();
    assert.ok(gallery.entries && gallery.entries.length > 0);
    const first = gallery.entries[0];
    const flagged = rc.setGalleryFlag({ component: first.component, variant: first.variant, weak: true });
    assert.ok(flagged.flags[first.component + "/" + first.variant]);
    assert.ok(fs.existsSync(FLAGS));
    rc.setGalleryFlag({ component: first.component, variant: first.variant, weak: false });
    console.log("gallery + flag ok count=" + gallery.count);

    // 4. Panel + git-status; panel run stubbed
    const panel = rc.getPanel();
    assert.ok(panel.panel.prompts.length === 10);
    assert.ok(panel.callCostPerDeck);
    const git = rc.gitDirtyCount();
    assert.ok(Number.isFinite(git.count));
    console.log("panel + git-status ok dirty=" + git.count);

    const panelResult = await rc.runPanel({
      compose: async (opts) => ({
        id: "stub-" + opts.nonce,
        analysis: { score: 100, failures: [] },
        report: { textModelCalls: 3, brief: { plan: [{ role: "Cover" }] } },
        outDir: path.join(ROOT, "docs", "template-pipeline", "admin-dashboard", "tmp", "panel-" + opts.nonce),
        deck: { qa: { score: 100 } },
      }),
    });
    assert.strictEqual(panelResult.status, "done");
    assert.strictEqual(panelResult.results.length, 10);
    console.log("panel run stub ok results=" + panelResult.results.length);

    console.log("reviewRoutes.test passed");
  } finally {
    global.fetch = origFetch;
    try { fs.rmSync(fixtureDir, { recursive: true, force: true }); } catch (e) { /* */ }
    try { fs.unlinkSync(path.join(REVIEWS, fixtureId + ".json")); } catch (e) { /* */ }
  }
}

run().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
