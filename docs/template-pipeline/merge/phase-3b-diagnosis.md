# Pipeline merge — Phase 3b diagnosis

Offline diagnosis of the Phase 3 blue-and-white **55** (6/11). Vision stays off for new work; this report only reads what already happened.

## 0. What a score means now (vision disabled)

Vision gate wiring in `services/templatePipeline/thematic.js`:

```68:75:services/templatePipeline/thematic.js
function visionQaEnabled(options) {
  loadEnv();
  const settings = options || {};
  if (settings.vision === false || settings.qa === "manual") return false;
  if (settings.vision === true || settings.qa === true) return true;
  const raw = String(process.env.VISION_QA == null ? "0" : process.env.VISION_QA).trim().toLowerCase();
  if (raw === "1" || raw === "true" || raw === "on") return true;
  return false;
}
```

Default `VISION_QA` is treated as `"0"` → manual. `injectTheme` then runs one theme and analyzes with `vision: false`:

```1943:1948:services/templatePipeline/thematic.js
  if (settings.qa === "manual" || !visionQaEnabled(settings)) {
    const result = await runOnce(settings);
    const generated = JSON.parse(fs.readFileSync(path.join(result.outDir, "deck.json"), "utf8"));
    const analysis = await analyze(generated, result.slides || [], { vision: false });
    const summary = await writeQa(result, analysis, 1, "manual");
```

In `scoring/analyzeDeck.js`, when `options.vision === false`:

```275:278:services/templatePipeline/scoring/analyzeDeck.js
    if (!useVision) {
      slides.push({ slide: number, pass: true, score: 100, reasons: [], vision: null });
      continue;
    }
```

| Question | Answer |
| --- | --- |
| Geometry passes → vision? | Skipped |
| Slide marked? | **Passing**, `score: 100`, `vision: null` |
| Fixed quality_score? | No vision quality; synthetic slide score 100 |
| Deck score? | **Percent of slides that pass geometry** (same formula: `100 * passed / total`) |

### Were Phase 3 scores (55 / 100) vision-on or vision-off?

**Vision-on.** Evidence from the kept output `docs/template-pipeline/merge/phase-3-payroll/`:

- `deck.json` → `qa`: `{ score: 100, passed: 10, total: 10, failures: [], attempt: 2 }` — no `"mode": "manual"`.
- `replacements.json` → `analysis` matches that object; layout is beige (attempt 2).
- Manual QA (`mode: "manual"`) was added **after** that CLI run. Attempt fields and the 55 → retry → 100 pattern match the vision `QA_TRIES` loop, not the single-shot manual path.

So **55 and 100 are vision-era numbers**. Under today’s geometry-only gate they are not directly comparable.

## 1. Missing-path logger

`scripts/slideSvg.js` `loadPhoto` (360–384):

```360:384:scripts/slideSvg.js
function loadPhoto(url, warn, where) {
  ...
  const root = asset
    ? path.resolve(__dirname, "..", "assets", "decorations")
    : path.resolve(PHOTO_ROOT);
  const file = asset
    ? path.resolve(__dirname, "..", rel)
    : path.resolve(PHOTO_ROOT, rel);
  ...
  if (!fs.existsSync(file)) {
    warn(where + ": missing image file " + url);
    return null;
  }
```

`PHOTO_ROOT` (line 13): `path.join(__dirname, "..", "generated-templates")` — absolute from the script location, **not** `process.cwd()`.

When the file is absent: returns `null`. Callers draw a **hatch placeholder** in the image box and keep the element (url unchanged). They do not drop the element.

```801:813:scripts/slideSvg.js
  const photo = enabled ? loadPhoto(content.url, warn, where) : null;
  if (!enabled || !photo) {
    ...
      hatchCanvas(ctx, box);
    ...
    return;
  }
```

## 2. Blue-and-white seed photo refs vs disk

Source: `app-library/blue-and-white-modern-business-proposal-presentation.json`.

- Photo URLs under `photos/…`: **29** (all marked decoration / originalRole decoration in this seed).
- Resolved as `generated-templates/` + url via `PHOTO_ROOT`.
- **Exists: 0. Missing: 29.**
- Directory `generated-templates/photos/blue-and-white-modern-business-proposal-presentation` **does not exist**.

Sample missing:

- `photos/blue-and-white-modern-business-proposal-presentation/slide-1-img-1.jpeg`
- `…/slide-2-img-4.jpeg` … through slide-11 assets

## 3. Semantic-filtering corporate-payroll (the 91 run)

`docs/template-pipeline/semantic-filtering/` **is absent** on disk now (`Test-Path` → False). No `deck.json`, no slide PNGs, no timestamps to compare.

`SEMANTIC_FILTERING_REPORT.md` is also gone from `docs/template-pipeline/`.

What remains related:

- `generated-templates/photos/thematic/phase-3-payroll/` — 10 Pexels files from the Phase 3 re-run (mtime 2026-10-27T13:35:25Z).
- No `blue-and-white-…` or `beige-and-brown-…` seed photo folders under `generated-templates/photos/`.

Inference: the 91-run output folder was deleted after that session (or never kept in this workspace checkout). The seed decoration binaries are also gone. Missing files are a **library asset** problem, not something introduced only in Phase 3 attempt 1.

## 4. Cwd / path base vs `pipeline.js`

`themeOnce` out dir:

```1802:1804:services/templatePipeline/thematic.js
  const outDir = options.out
    ? path.resolve(ROOT, options.out)
    : path.join(ROOT, "docs", "template-pipeline", "thematic-tests", slug(subject));
```

`ROOT` = `path.join(__dirname, "..", "..")` (Slidexy-BE). Relative `out` is always under that constant.

Pexels download dir uses the same `ROOT` (`generated-templates/photos/thematic/<slug>`).

`renderDeck` writes PNGs into the resolved `outDir`.

`pipeline.runPipeline` only forwards `out` into `injectTheme` — no path rewriting:

```27:36:services/templatePipeline/pipeline.js
  return injectTheme({
    prompt: settings.prompt,
    layout: settings.layout || "",
    autoLayout: mode === "auto",
    out: settings.out,
    qa,
    ...
  });
```

Admin still does `out: relative(dir)` → path relative to `ROOT`, then `path.resolve(ROOT, options.out)` in themeOnce — same as before the facade.

**`pipeline.js` changed nothing about cwd or photo path bases.** Missing files resolve the same way they would have on pre-merge thematic CLI.

## 5. Geometry-only gate (current automated score)

Script was inline (PowerShell here-string → node); no throwaway file left behind.

### A. `docs/template-pipeline/merge/phase-3-payroll/deck.json` (kept beige attempt 2)

| Slide | Result | Rule |
| --- | --- | --- |
| 1–10 | PASS | — |

Geometry score **100** (10/10). Matches the stored `qa.score` 100 for this deck under “geometry pass ⇒ pass” logic; the stored 100 was still produced with vision on, but this deck’s geometry is clean.

### B. `docs/template-pipeline/semantic-filtering/corporate-payroll/deck.json`

**File absent** — cannot geometry-score the 91 run.

### C. Raw `app-library/blue-and-white-modern-business-proposal-presentation.json`

| Slide | Result | Rule |
| --- | --- | --- |
| 1 | PASS | — |
| 2–10 | FAIL | `split word` |
| 11 | PASS | — |

Geometry score **18** (2/11).  
Note: DNA `qualityScore` 91 was measured on a **themed** “A company overview.” deck (`qa: false` + vision), not on this raw JSON. Raw split-word failures are often cleared when rewrite replaces span text.

## 6. Conclusion

**(c) The 55 was a vision-on number and does not reproduce under geometry-only scoring** — with a supporting **(a)** for the missing-path logs.

Evidence that decides it:

1. Phase 3 `qa` / `analysis` objects have `attempt: 2` and **no** `mode: "manual"` → vision loop was active when 55 and 100 were recorded.
2. All 29 blue-and-white seed photo files are missing today; `loadPhoto` uses absolute `PHOTO_ROOT` from `__dirname`; `pipeline.js` does not alter that → merge wiring did **not** invent a bad path base **(not b)**.
3. Missing file → hatch placeholder, element kept → geometry does not fail for “missing image”; vision would see hatched blanks and could mark slides broken/washed → consistent with a vision **55** while DNA/themed runs with assets present could still score high.
4. Under geometry-only, the kept Phase 3 deck is 100/100; the raw blue-and-white seed is 18% on `split word`, which is a different failure mode from the logged missing paths.

**Not (b).** Path resolution is unchanged and files are simply not on disk.

Part B (pinned regenerate + admin Generate) was **not** run: this session has no explicit confirmation that text-model credit is restored, and the task forbids probing APIs to find out.

## Stop

Phase 3b Part A complete. Do not start Phase 4 until asked. When text credit is confirmed, run steps 7–8 and append to this file.
