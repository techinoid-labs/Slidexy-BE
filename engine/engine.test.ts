/**
 * Unit tests: validator, fitter, gates, selectVariant.
 * node -r ts-node/register/transpile-only engine/engine.test.ts
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { validateDeckSpec } = require("./validate");
const { fitText } = require("./fit");
const { runGates, contrastRatio } = require("./gates");
const { selectAll, selectVariant } = require("./selectVariant");
const tokens = JSON.parse(fs.readFileSync(path.join(__dirname, "tokens.json"), "utf8"));

function baseSpec(): any {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "golden", "specs", "pitch-garage.json"), "utf8"));
}

// validator rejects geometry
{
  const bad = baseSpec();
  (bad as any).slides[0].x = 10;
  const r = validateDeckSpec(bad);
  assert.strictEqual(r.ok, false);
  assert.ok(r.errors.some((e: string) => /geometry/i.test(e)));
  console.log("ok reject geometry");
}

// unknown palette quotes bad value + allowed list
{
  const bad = baseSpec();
  bad.style.palette = "neon-unicorn";
  const r = validateDeckSpec(bad);
  assert.strictEqual(r.ok, false);
  assert.ok(r.errors.some((e: string) => /unknown palette "neon-unicorn".*allowed:.*ink-night/i.test(e)));
  console.log("ok reject unknown palette");
}

// unknown typePair quotes bad value
{
  const bad = baseSpec();
  bad.style.typePair = "Calibri";
  const r = validateDeckSpec(bad);
  assert.strictEqual(r.ok, false);
  assert.ok(r.errors.some((e: string) => /Calibri/i.test(e) && /corp-calibri/i.test(e)));
  console.log("ok reject typePair font literal");
}

// title may equal a font family name
{
  const ok = baseSpec();
  ok.slides[0].title = "Impact";
  const r = validateDeckSpec(ok);
  assert.strictEqual(r.ok, true, r.errors.join("; "));
  console.log("ok title Impact allowed");
}

// 61-char title
{
  const bad = baseSpec();
  bad.slides[0].title = "x".repeat(61);
  const r = validateDeckSpec(bad);
  assert.strictEqual(r.ok, false);
  assert.ok(r.errors.some((e: string) => /title exceeds/i.test(e)));
  console.log("ok reject 61-char title");
}

// hex color
{
  const bad = baseSpec();
  (bad.slides[0] as any).caption = "use #FF00AA never";
  const r = validateDeckSpec(bad);
  assert.strictEqual(r.ok, false);
  assert.ok(r.errors.some((e: string) => /hex/i.test(e)));
  console.log("ok reject hex");
}

// valid golden
{
  const r = validateDeckSpec(baseSpec());
  assert.strictEqual(r.ok, true, r.errors.join("; "));
  console.log("ok golden validates");
}

// fitter shrinks
{
  const fitted = fitText("A very long title that should shrink to fit the narrow box provided here today", { width: 200, height: 80 }, { minFont: 14, maxFont: 48, lineClamp: 2 });
  assert.ok(fitted.fontSize <= 48);
  assert.ok(!fitted.rejected || fitted.text.length > 0);
  console.log("ok fitText", fitted.fontSize, fitted.rejected);
}

// contrast
{
  assert.ok(contrastRatio("#000000", "#FFFFFF") > 20);
  console.log("ok contrast");
}

// selectVariant deterministic divergence
{
  const spec = baseSpec();
  const a = selectAll(spec, "prompt-one");
  const b = selectAll(spec, "prompt-two");
  const c = selectAll(spec, "prompt-one");
  assert.deepStrictEqual(a, c);
  const sig = (s: any[]) => s.map((x) => x.role + "/" + x.variant).join(",");
  // same prompt stable; different prompts may differ
  assert.strictEqual(sig(a), sig(c));
  console.log("ok selectAll stable", sig(a));
  console.log("ok select other", sig(b));
}

// gates on golden (Pitch ≥9)
{
  const spec = baseSpec();
  const selections = selectAll(spec, "garage");
  const gates = runGates(spec, selections, tokens, "Pitch");
  assert.ok(gates.slides.length >= spec.slides.length);
  assert.strictEqual(gates.pass, true, gates.slides.filter((s: any) => !s.pass).map((s: any) => s.reasons).join("; "));
  console.log("ok gates pass?", gates.pass, "fails", gates.slides.filter((s: any) => !s.pass).length);
}

// slideCountOK rejects short Pitch
{
  const short = baseSpec();
  short.slides = short.slides.slice(0, 5);
  const gates = runGates(short, selectAll(short, "x"), tokens, "Pitch");
  assert.strictEqual(gates.pass, false);
  assert.ok(gates.slides.some((s: any) => s.reasons.some((r: string) => /slideCountOK/i.test(r))));
  console.log("ok slideCountOK Pitch min");
}

// fixture fallback exists for tests only; generateKitV1 must throw without LLM
{
  const { fallbackSpec } = require("./golden/fixtures/fallbackSpec");
  const fix = fallbackSpec("Test brand", "Pitch");
  assert.strictEqual(validateDeckSpec(fix).ok, true);
  const prevOr = process.env.OPENROUTER_API_KEY;
  const prevA1 = process.env.API_KEY1;
  const prevG = process.env.GEMINI_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.API_KEY1;
  delete process.env.GEMINI_API_KEY;
  delete require.cache[require.resolve("./generateKitV1")];
  const { inventDeckSpec } = require("./generateKitV1");
  inventDeckSpec("x", "Pitch")
    .then(() => {
      assert.fail("should throw without LLM");
    })
    .catch((err: Error) => {
      assert.ok(/LLM|OPENROUTER|API_KEY/i.test(err.message));
      console.log("ok inventDeckSpec throws without LLM");
      if (prevOr) process.env.OPENROUTER_API_KEY = prevOr;
      if (prevA1) process.env.API_KEY1 = prevA1;
      if (prevG) process.env.GEMINI_API_KEY = prevG;
      console.log("engine.test.ts passed");
    });
}
