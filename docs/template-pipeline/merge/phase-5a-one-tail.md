# Pipeline merge — Phase 5a one tail

One gate stack (`finishDeck`) and one `runPipeline` result shape for every mode. Vision off. Online only for the final composer smoke.

---

## 1. Builder returns → `GENERATE_TEMPLATE_FIELDS`

### Quotes (return objects)

**`themeOnce`** (`thematic.js`):

```js
return { outDir, slides, report, layout, name: deck.name, deckId: deck.id, selection };
```

**`injectTheme` manual branch** (returns `themeOnce` result after `writeQa`):

```js
const result = await runOnce(settings);
const analysis = await analyze(generated, result.slides || [], { vision: false });
await writeQa(result, analysis, 1, "manual");
return result; // + result.analysis from writeQa
```

**`assembleDeck`**:

```js
return {
  outDir: themed.outDir, slides: themed.slides, report: themed.report,
  layout: "assembled", name: themed.name, deckId: themed.deckId,
  assembly: saved.assembly, analysis: saved.assembly.analysis,
};
```

**`remixSeeds`**:

```js
return {
  outDir: themed.outDir, slides: themed.slides, report: themed.report,
  layout: seedA.id + "+" + seedB.id, name: themed.name, deckId: themed.deckId,
  remix: deck.remix, analysis: deck.remix.analysis,
};
```

**`thematic-native` `generate`**:

```js
return { outDir, slides, pptx, deck, copy, order, layout: "native" };
```

**`compose`** (`composeRuntime.js`):

```js
return {
  id: photoSlug, layoutId: "composer", layoutIdB: "", remix: null, assembly: null,
  analysis: chosen.analysis, prompt, vibe: chosen.report.bucket, name: chosen.name,
  deck: chosen.deck, slides: slideMeta, pptxUrl: "", outDir: chosen.outDir, report: chosen.report,
};
```

### Field map

| Normalized / HTTP field | themeOnce / inject | assemble | remix | native | compose | `GENERATE_TEMPLATE_FIELDS` |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | deckId (admin overrides with job id) | deckId | deckId | deck.id | id / photoSlug | `id` |
| `name` | name | name | name | deck.name | name | `name`, `deck.name` |
| `outDir` | outDir | outDir | outDir | outDir | outDir | (pipeline) |
| `deck` | from disk | from disk | from disk | deck | deck | `deck.id` |
| `slides[].url/name` | file paths → preview urls | same | same | same | same | `slides`, `slides[].url`, `slides[].name` |
| `analysis` | writeQa summary (+ finishDeck) | assembly.analysis | remix.analysis | finishDeck | chosen.analysis | `analysis*` |
| `vibe` | selection/report | assembly.designLanguage | report | "" / native | report.bucket | `vibe`, `assembly.designLanguage` |
| `layoutId` | layout | assembled | a+b | native | composer | `layoutId` |
| `plan` / `fallbacks` / `fits` / `nonce` | — | — | — | — | report | `composer-meta`, `nonce` |
| `pptxUrl` | admin after `.pptx` exists | same | same | same | same | `pptxUrl` |
| `mode` (UI) | — | — | — | — | — | `mode` |
| seed-assets line | — | — | — | — | — | `seed-assets` (dashboard) |

---

## 2. `adminCatalog.generateTemplate` — per-mode branches

**Before 5a:** separate calls for composer / native / assemble|remix|auto|pinned.

**After 5a:** argument mapping only, then one `runPipeline`:

```diff
- if (composer) { themed = await pipeline.runPipeline({ mode: "composer", ... }); }
- else if (native) { themed = await generate({ ... }); }
- else {
-   themed = assemble ? await assembleDeck(...)
-     : remix ? await remixSeeds(...)
-     : await pipeline.runPipeline({ mode: autoLayout ? "auto" : "pinned", ... });
- }
+ themed = await pipeline.runPipeline({
+   mode, prompt, nonce, layout: layoutId, layoutIdB,
+   out: relative(dir), creative, niche,
+   deps: pipeline.getTestDeps && pipeline.getTestDeps(),
+ });
```

Response is built from the normalized `themed` object (`id` stays the admin job id; slide urls remapped to `/api/admin/preview/...`).

---

## 3. `composer/finishDeck.js`

Factored from `composeRuntime.runOnce`: `analyzeDeck` (optional if analysis provided) → `applyComposerFails` → `runPptxGate` → `applyPptxGate` → `attachAesthetics` → `writeQa(..., "manual")`.

Hard fails: unfilled slot / wrap mismatch skip elements without `slot` / `textMeasure.lines`. Missing image, text under picture, photo under shape apply to all.

`pptxGate` line check: `textMeasure.lines` when present, else `countCanvasLines`.

### Composer unchanged (replay)

| out | deck.qa | textModelCalls |
| --- | ---: | ---: |
| `proof-5a-a-replay` (from `proof-4f1-a-replay`) | **100**, failures `[]` | **0** |
| `proof-5a-b-replay` (from `proof-4f1-b-replay`) | **100**, failures `[]` | **0** |

`deck.qa` matched stored proofs.

---

## 4. `pipeline.js`

- `normalizeResult(mode, raw)` → shared shape `{ id, name, outDir, deck, slides, analysis, vibe, layoutId, plan?, fallbacks?, fits?, nonce?, … }`.
- `runPipeline` modes: `composer`, `auto`, `pinned`, `assemble`, `remix`, `native`.
- Non-composer: builder → `finishDeck` → `normalizeResult`.
- Composer: `compose` (already calls `finishDeck`) → `normalizeResult`.
- `setTestDeps` / `getTestDeps` for offline stubs; optional `PIPELINE_5A_STUB=1` arms `composer/pinnedStub5a.js` `themeOnce`.
- thematic.js CLI wrapper unchanged (`require("./pipeline").runPipeline`).

---

## 5. `adminCatalog` + `generateTemplateShape.test.js`

One `runPipeline` call site (see §2). Shape test stubs builders for all **six** modes (`skipFinishDeck` for seed stubs). **Passed.**

---

## 6. Tests

- `pipelineShape.test.js` — fixture return per builder through `normalizeResult`. **Passed.**
- `finishDeck.test.js` — seed-shaped deck (`s1-e1`, `seedOrigin`, missing photo url): missing image fires; unfilled/wrap do not; geometry exemptions hold; pptx `checkSlide` uses canvas lines. **Passed.**

---

## 7. Dashboard + browser proof (zero text-model)

- Result handling reads normalized fields; review form + LO/File toggle for **every** mode.
- When every analysis failure is `missing image`, status appends:  
  `seed assets missing; restore generated-templates/photos/<id>/ or use Composer.`

### Stub how

Restart curator with `PIPELINE_5A_STUB=1` → `pipeline.setTestDeps({ themeOnce: pinnedStub5a.themeOnce })`. Stub loads `blue-and-white-modern-business-proposal-presentation`, keeps seed photo urls (disk missing), no inventDirection / Pexels.

### Clicks (`http://127.0.0.1:5055/`)

1. **Reviews** → Load `proof-4f1-a-replay` → Score 100 · 9 LO thumbs · review form visible.
2. **Generate** → Mode Pinned → layout `blue-and-white-modern-business-proposal-presentation` → prompt payroll → Generate.
3. Rendered: **11** canvas thumbs, review form + thumb toggle, **HTTP 200** (no 422), score **0 (0/11)**, failures all `missing image` (29), status includes **seed assets missing; restore generated-templates/photos/<id>/ or use Composer.**

---

## 8. Smoke (online)

Composer, `"A corporate payroll company"`, nonce `"5a-smoke"`:

| field | value |
| --- | --- |
| score | **100** (9/9) |
| textModelCalls | **3** |
| layoutId | `composer` |
| response fields | id, name, slides, analysis, vibe, layoutId, pptxUrl, plan, fallbacks, fits, nonce present |

No 402.

---

## 9. Characterization tests

```
qaLoop test passed
semanticFilter test passed
chooseLayout test passed
dead code test passed
manualQa test passed
composer.test passed
safeRm test passed
generateTemplateShape test passed
catalogGolden test passed (stripped 10, unstripped 10)
reviewRoutes.test passed
pipelineShape test passed
finishDeck test passed
```

No file named `assembleDeck.js` or `composeDeck.js`.

---

Stop. Do not start 5b.
