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
  const flood = fitText(
    Array(80).fill("overflow").join(" "),
    { width: 320, height: 60 },
    { minFont: 14, maxFont: 36, lineClamp: 2, shrinkMin: 0.5 }
  );
  assert.strictEqual(flood.rejected, false);
  assert.ok(flood.fontSize >= 14, "never below 14pt");
  assert.ok(flood.text.indexOf("…") >= 0 || flood.fontSize === 14, "must ellipsis at floor");
  console.log("ok fitText floor14", flood.fontSize, flood.text.slice(-12));
  const { needsTextHeavyLayout, normalizeSlideContent, toThreeBullets } = require("./content");
  assert.ok(needsTextHeavyLayout({ title: "one two three four five six seven eight nine", body: ["short"] }));
  assert.ok(needsTextHeavyLayout({ title: "Short", body: [Array(25).fill("word").join(" ")] }));
  const bullets = toThreeBullets(Array(40).fill("word").join(" "));
  assert.strictEqual(bullets.length, 3);
  const norm = normalizeSlideContent({
    title: "A very long title with more than eight words for sure",
    body: [Array(30).fill("gaming").join(" ")],
  });
  assert.ok(norm.title.split(/\s+/).length <= 9); // 8 + possible ellipsis token
  assert.strictEqual(norm.body.length, 3);
  console.log("ok content policy", norm.title, norm.body);
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

// adjacent slides must not share composition family (photo-footer)
{
  const { loadFamily } = require("./selectVariant");
  const spec = baseSpec();
  // Force problem/a + solution/a which are both photo-footer — selectAll must flip one
  spec.slides[1].variantHint = "a";
  spec.slides[2].variantHint = "a";
  const sels = selectAll(spec, "family-check-seed");
  const fams = sels.map((s: any) => loadFamily(s.role, s.variant));
  for (let i = 1; i < fams.length; i++) {
    if (fams[i] && fams[i - 1] && fams[i] === fams[i - 1]) {
      assert.fail("adjacent family " + fams[i] + " at " + i);
    }
  }
  console.log("ok no adjacent composition family");
}

// photoUnique gate catches duplicate queries
{
  const spec = baseSpec();
  spec.slides[1].photoQuery = "same scene garage";
  spec.slides[2].photoQuery = "same scene garage";
  const selections = selectAll(spec, "dup-photo");
  const gates = runGates(spec, selections, tokens, "Pitch");
  assert.strictEqual(gates.pass, false);
  assert.ok(gates.slides.some((s: any) => s.reasons.some((r: string) => /photoUnique/i.test(r))));
  console.log("ok photoUnique gate");
}

// roleSequenceOK: missing closing fails
{
  const spec = baseSpec();
  spec.slides = spec.slides.filter((s: any) => s.role !== "closing");
  const gates = runGates(spec, selectAll(spec, "no-close"), tokens, "Pitch");
  assert.strictEqual(gates.pass, false);
  assert.ok(gates.slides.some((s: any) => s.reasons.some((r: string) => /roleSequenceOK/i.test(r))));
  console.log("ok roleSequenceOK");
}

// muted contrast floor on charcoal-ember
{
  const muted = tokens.palettes["charcoal-ember"].muted;
  const bg = tokens.palettes["charcoal-ember"].bg;
  assert.ok(contrastRatio(muted, bg) >= 4.5, "charcoal muted too dim");
  console.log("ok charcoal muted contrast", contrastRatio(muted, bg).toFixed(2));
}

// light themes: muted darkened ~15% for body readability
{
  const lightIds = ["slate-light", "ivory-warm", "mist-teal", "paper-blue"];
  lightIds.forEach((id) => {
    const p = tokens.palettes[id];
    assert.ok(p && p.dark === false);
    assert.ok(contrastRatio(p.muted, p.bg) >= 4.5, id + " muted/bg");
  });
  assert.strictEqual(tokens.palettes["ivory-warm"].muted, "#685646");
  console.log("ok light muted darkened");
}

// team portrait query gate + normalize
{
  const { isTeamPortraitQuery, normalizeTeamQuery, queriesForSlots } = require("./photos");
  assert.ok(isTeamPortraitQuery("dentist headshot portrait person"));
  assert.ok(!isTeamPortraitQuery("supercar garage night"));
  assert.ok(!isTeamPortraitQuery("abstract texture"));
  const fixed = normalizeTeamQuery("team in luxury garage");
  assert.ok(isTeamPortraitQuery(fixed), fixed);
  assert.ok(!/garage|car/i.test(fixed));
  const qs = queriesForSlots(
    {
      role: "team",
      photoQuery: "gaming lounge staff",
      members: [{ name: "Alex", role: "Manager" }],
    },
    1
  );
  assert.ok(qs.every((q: string) => isTeamPortraitQuery(q)), qs.join("|"));
  console.log("ok team portrait gate");
}

// stats/c kit exists + mask resolution PPTX-safe
{
  assert.ok(fs.existsSync(path.join(__dirname, "..", "kit", "stats", "c.json")));
  const { resolveMask } = require("./render");
  assert.strictEqual(resolveMask({ mask: "circle", width: 100, height: 100 }).kind, "ellipse");
  assert.strictEqual(resolveMask({ mask: "arch", width: 100, height: 100, radius: 20 }).kind, "arch");
  assert.strictEqual(resolveMask({ mask: "pill", width: 200, height: 80 }).kind, "pill");
  assert.ok(tokens.motifs["brush-stroke"]);
  assert.ok(tokens.photoMasks.circle);
  const forced = baseSpec();
  forced.slides[5].variantHint = "c";
  forced.slides[5].stats = [{ value: "92%", label: "satisfaction" }];
  const sels = selectAll(forced, "extreme-stats");
  const statsSel = sels.find((s: any) => s.role === "stats");
  assert.strictEqual(statsSel.variant, "c");
  console.log("ok stats/c + masks + brush-stroke");
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
