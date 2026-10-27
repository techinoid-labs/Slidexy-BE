/**
 * injectTheme QA loop via the deps seam (themeOnce / analyzeDeck stubs).
 *
 *   node services/templatePipeline/qaLoop.test.js
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { injectTheme, QA_SCORE, QA_TRIES } = require("./thematic");

assert.strictEqual(QA_SCORE, 80);
assert.strictEqual(QA_TRIES, 3);

function makeOut(label) {
  const os = require("os");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "qa-loop-" + label + "-"));
  fs.writeFileSync(path.join(dir, "deck.json"), JSON.stringify({ id: "fixture", layouts: {} }, null, 2) + "\n");
  return dir;
}

function stubThemeOnce(calls, layoutForCall, bucketForCall) {
  return async function themeOnceStub(options) {
    const index = calls.length;
    const outDir = makeOut(String(index + 1));
    const layout = typeof layoutForCall === "function" ? layoutForCall(index, options) : (layoutForCall || "seed-a");
    const bucket = typeof bucketForCall === "function" ? bucketForCall(index, options) : (bucketForCall || "light-neutral");
    const result = {
      outDir,
      slides: [],
      layout,
      report: {
        mood: { bucket },
        analysis: null,
      },
      selection: { vibe: "Corporate", model: "stub" },
    };
    calls.push({ options: JSON.parse(JSON.stringify(options)), result });
    return result;
  };
}

function stubAnalyze(scores) {
  const queue = scores.slice();
  const calls = [];
  async function analyzeDeckStub(deck, pngs, options) {
    calls.push({ deck: Boolean(deck), pngs, options: options || {} });
    const score = queue.length ? queue.shift() : 0;
    return {
      score,
      passed: score >= 80 ? 1 : 0,
      total: 1,
      failures: score < 80 ? ["stub fail"] : [],
      vision: options && options.vision === false ? false : true,
    };
  }
  analyzeDeckStub.calls = calls;
  return analyzeDeckStub;
}

async function main() {
  // qa: false → one themeOnce, no analyze
  {
    const calls = [];
    const analyze = stubAnalyze([99]);
    const result = await injectTheme({ prompt: "x", qa: false, layout: "seed-a" }, {
      themeOnce: stubThemeOnce(calls),
      analyzeDeck: analyze,
    });
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(analyze.calls.length, 0);
    assert.ok(result.outDir);
    fs.rmSync(result.outDir, { recursive: true, force: true });
  }

  // manual qa → one themeOnce, analyze once with vision: false; under-80 keeps out dir (no throw, no retry)
  {
    const calls = [];
    const analyze = stubAnalyze([40]);
    const result = await injectTheme({ prompt: "x", qa: "manual", layout: "seed-a" }, {
      themeOnce: stubThemeOnce(calls, "seed-a", "light-neutral"),
      analyzeDeck: analyze,
    });
    assert.strictEqual(calls.length, 1, "manual themeOnce once");
    assert.strictEqual(analyze.calls.length, 1, "manual analyzeDeck once");
    assert.strictEqual(analyze.calls[0].options.vision, false);
    assert.strictEqual(result.analysis.mode, "manual");
    assert.strictEqual(result.analysis.score, 40);
    assert.strictEqual(result.analysis.attempt, 1);
    assert.ok(fs.existsSync(result.outDir), "manual mode keeps out dir under QA_SCORE");
    fs.rmSync(result.outDir, { recursive: true, force: true });
  }

  // score 85 on try 1 → one themeOnce (vision gate)
  {
    const calls = [];
    const analyze = stubAnalyze([85]);
    const result = await injectTheme({ prompt: "x", qa: true, layout: "seed-a" }, {
      themeOnce: stubThemeOnce(calls, "seed-a", "light-neutral"),
      analyzeDeck: analyze,
    });
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(analyze.calls.length, 1);
    assert.strictEqual(result.analysis.score, 85);
    assert.ok(fs.existsSync(result.outDir));
    fs.rmSync(result.outDir, { recursive: true, force: true });
  }

  // three scores under 80 → three tries, out dir removed, throw
  {
    const calls = [];
    const analyze = stubAnalyze([70, 70, 70]);
    let lastOut = "";
    await assert.rejects(
      () => injectTheme({ prompt: "x", qa: true, layout: "seed-a" }, {
        themeOnce: async (options) => {
          const run = stubThemeOnce(calls, "seed-a", "light-neutral");
          const result = await run(options);
          lastOut = result.outDir;
          return result;
        },
        analyzeDeck: analyze,
      }),
      /No deck scored 80 or above \(last score 70\)/
    );
    assert.strictEqual(calls.length, 3);
    assert.strictEqual(analyze.calls.length, 3);
    assert.ok(lastOut);
    assert.strictEqual(fs.existsSync(lastOut), false);
  }

  // failed layout id goes into excludeLayouts on the next try
  {
    const calls = [];
    const analyze = stubAnalyze([70, 85]);
    const result = await injectTheme({ prompt: "x", qa: true, layout: "seed-a" }, {
      themeOnce: stubThemeOnce(calls, (index) => (index === 0 ? "seed-a" : "seed-b"), "light-neutral"),
      analyzeDeck: analyze,
    });
    assert.strictEqual(calls.length, 2);
    assert.deepStrictEqual(calls[0].options.excludeLayouts, []);
    assert.ok(calls[1].options.excludeLayouts.indexOf("seed-a") >= 0);
    fs.rmSync(result.outDir, { recursive: true, force: true });
  }

  // "assembled" and remix "a+b" are not added to excludeLayouts
  {
    const calls = [];
    const analyze = stubAnalyze([70, 70, 85]);
    const layouts = ["assembled", "seedA+seedB", "seed-c"];
    const result = await injectTheme({ prompt: "x", qa: true }, {
      themeOnce: stubThemeOnce(calls, (index) => layouts[index], "light-neutral"),
      analyzeDeck: analyze,
    });
    assert.strictEqual(calls.length, 3);
    assert.deepStrictEqual(calls[1].options.excludeLayouts, []);
    assert.deepStrictEqual(calls[2].options.excludeLayouts, []);
    fs.rmSync(result.outDir, { recursive: true, force: true });
  }

  // forcedBucket on try 2/3 differs from the bucket that failed
  {
    const calls = [];
    const analyze = stubAnalyze([70, 70, 85]);
    const result = await injectTheme({ prompt: "x", qa: true, layout: "seed-a" }, {
      themeOnce: stubThemeOnce(calls, "seed-a", (index) => {
        if (index === 0) return "light-neutral";
        if (index === 1) return "light-warm";
        return "dark-neutral";
      }),
      analyzeDeck: analyze,
    });
    assert.strictEqual(calls.length, 3);
    assert.strictEqual(calls[0].options.forcedBucket, "");
    assert.strictEqual(calls[1].options.forcedBucket, "light-warm");
    assert.notStrictEqual(calls[1].options.forcedBucket, "light-neutral");
    assert.strictEqual(calls[2].options.forcedBucket, "dark-neutral");
    assert.notStrictEqual(calls[2].options.forcedBucket, "light-warm");
    fs.rmSync(result.outDir, { recursive: true, force: true });
  }

  console.log("qaLoop test passed");
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
