# Pipeline merge — Phase 4a cover proof

Offline. No LLM, no Pexels, no npm install. Aesthetic metrics not in this phase.

## 1. Deletion inventory (Slidexy-BE, exclude node_modules / website-codes DOM `.remove`)

Relevant filesystem deletes:

| File | Line | Expression | Resolves (trace) | Worst case |
| --- | ---: | --- | --- | --- |
| `thematic.js` | 1829→safeRm | `photoDir` = `ROOT/generated-templates/photos/thematic/` + `slug(basename(outDir))` | `outDir` = `path.resolve(ROOT, options.out)` or `docs/template-pipeline/thematic-tests/<slug(subject)>` | Empty `out` → thematic-tests slug from prompt. Basename `"photos"` / `"thematic"` → deletes `…/photos/thematic/photos` or `…/thematic/thematic` (slug leaf only — **not** `generated-templates/photos`). `..` in `out` still under resolve; safeRm refuses escape outside allowlist. |
| `thematic.js` | 1906→safeRm | `path.join(outDir, slide-NN.png)` | Same `outDir` | Individual PNGs under out dir. If `out` outside allowlist, safeRm throws (CLI defaults under `docs/template-pipeline/`). |
| `thematic.js` | 1988→safeRm | `lastDir` = last `result.outDir` after vision QA fail | Same | Vision path only; removes failed attempt dir. |
| `adminCatalog.js` | 98→safeRm | `UPLOADS/<id>.pptx` | `docs/template-pipeline/admin-dashboard/uploads/` | Ingest cleanup. |
| `adminCatalog.js` | 101 | `LIBRARY/<id>.dna.json` | `app-library/*.dna.json` | **Not wrapped** — outside allowlist; ingest only (not generate/discard). |
| `adminCatalog.js` | 218–219→safeRm | `jobDir(id)`, `photos/(native\|thematic)/<id>` | `docs/…/admin-dashboard/tmp/<id>`; photo slug = generate `id` | Generate catch cleanup. Empty id blocked by `assertId` / `slug`. |
| `adminCatalog.js` | 298–299→safeRm | job dir + `thematicPhotoDirs` | publish cleanup | Photo dirs from URL match `photos/(thematic\|native)/<slug>/`. |
| `adminCatalog.js` | 315–316→safeRm | job dir + thematic/native `<id>` | discard | Same. |
| `qaLoop.test.js` | cleanup | stub `outDir` | now under `docs/…/admin-dashboard/tmp/qa-loop-*` | Test only. |
| `mutate.js` / `mutate_safe.js` / `validate_converter.js` / `render_shipping.js` / `learn.test.js` / `slideSvg.js` unlink | various | work dirs | Not generate/discard/disable admin path | **Not wrapped** this phase (not in generate/discard/disable/cleanup list for admin/theme). |
| `package-lock` rimraf | dep of puppeteer | n/a | n/a | Not our call sites. |

`setLayoutDisabled` writes DNA only — no delete.

## 2. `safeRm` + wraps

New `services/templatePipeline/safeRm.js`: resolves target; allows only

- `docs/template-pipeline/<name>/…`
- `generated-templates/photos/{thematic,native,composer}/<slug>/…`
- `app-library/published/<id>/…`

Refuses ROOT, `generated-templates`, `generated-templates/photos`, `app-library`, `app-library/native`, `docs`, `docs/template-pipeline` alone, `..` escape, empty/undefined.

### Diffs (wrap only)

**thematic.js** — photo wipe / slide wipe / QA lastDir:

```diff
-  fs.rmSync(photoDir, { recursive: true, force: true });
+  const { safeRm } = require("./safeRm");
+  safeRm(photoDir, { recursive: true, force: true });

-    …forEach((name) => fs.rmSync(path.join(outDir, name)));
+    …forEach((name) => safeRmSlides(path.join(outDir, name), { force: true }));

-  if (lastDir) fs.rmSync(lastDir, { recursive: true, force: true });
+  if (lastDir) { safeRmLast(lastDir, { recursive: true, force: true }); }
```

**adminCatalog.js** — `require("./safeRm")`; ingest upload pptx, generate catch, publish, discard use `safeRm(…)` instead of `fs.rmSync`. DNA `fs.rmSync` left unchanged.

**qaLoop.test.js** — `makeOut` writes under `docs/template-pipeline/admin-dashboard/tmp/` so vision-fail cleanup stays allowlisted.

## 3. `safeRm.test.js`

Covers empty/undefined, ROOT, generated-templates, photos root, app-library, native, docs, template-pipeline alone, thematic without slug, published without id, `..` escape; allows docs job dir, thematic/native/composer slug dirs, published id, nested file. Output: `safeRm test passed`.

## 4. git log / mtimes (read-only)

`git log --all --diff-filter=D --name-only -- generated-templates .gitignore`:

- Commit `824fa794` (2026-10-22): deleted `generated-templates/rendered/harbor-*.pptx` (empty-library reset).

`.gitignore` coverage of `generated-templates`:

| When | Change |
| --- | --- |
| `9e72ecd` 2026-10-17 | added `generated-templates/*.json` |
| `824fa794` 2026-10-22 | added `generated-templates/photos/` |

Current ignore still lists both. Mtimes (this machine):

| Path | LastWriteTime |
| --- | --- |
| `generated-templates/` | 2026-10-27 18:33:43 |
| `generated-templates/photos/` | 2026-10-27 18:33:43 |
| `docs/template-pipeline/` | 2026-10-27 16:41:13 |

## 5. Fonts (GDI+ InstalledFontCollection)

```
Family     Installed
------     ---------
Poppins    False
Figtree    False
Calibri    True
Arial      True
Georgia    True
Segoe UI   True
```

**v1 composer fontPair allowlist** (both faces installed):

| id | display | body |
| --- | --- | --- |
| `corp-calibri` | Calibri | Calibri |
| `corp-arial` | Arial | Arial |
| `editorial` | Georgia | Calibri |
| `modern` | Segoe UI | Segoe UI |

Poppins / Figtree **missing** — not installed; native archetypes still reference them; composer does not. (Note: node-canvas still warned Calibri “not installed” and fell back to Arial when rendering PNGs — GDI+ sees Calibri; canvas fontconfig does not. Chrome measure used Calibri successfully.)

## 6. `cover.html` + lint

Created `design-system/components/cover.html` (variants word / split / full-bleed; slots title|body|kicker; photo on split & full-bleed; 1600×900; CSS variables; PPTX-safe subset).

`design-system/lint.js` — forbid gradients, box-shadow, filter, mix-blend-mode, bare `transform`, clip-path, background-image, pseudo content; allowlist properties inside rule bodies.

```
lint ok design-system\components\cover.html
```

## 7. Compiler

`services/templatePipeline/composer/compileKit.js` uses existing **puppeteer `24.26.0`** (locked; no install). Chromium launched successfully (no first-download failure on this machine).

Emits `app-library/native/composer/cover-<variant>-<fontPair>.json` × 3 variants × 4 pairs = **12 files**, plus `design-system/manifest.json`. Build screenshots under `docs/template-pipeline/composer/_build/`.

Colors on shapes stay `{color.*}`; `tokens.font` baked per pair; `textMeasure: { lines, fontPair }` on text; height = lines × lineHeight × fontSize; `text-transform` applied into span text at measure.

## 8. Per-fontPair evidence (cover-word)

| fontPair | title height | title lines | body height | body lines |
| --- | ---: | ---: | ---: | ---: |
| corp-calibri | 126 | 1 | 75.6 | 2 |
| corp-arial | 126 | 1 | 75.6 | 2 |
| editorial | 126 | 1 | 75.6 | 2 |
| modern | 126 | 1 | 75.6 | 2 |

Heights/line counts are **identical** across pairs for this fixture copy. Decision to compile per fontPair still stands (metrics can diverge with longer copy / different faces).

## 9. `skipCover`

```597:599:services/templatePipeline/parametric.js
  const cover = options.skipCover
    ? { id: "skipped", name: "Skipped" }
    : replaceCover(deck, prompt, title, options.photoUrl || "", palette, fonts);
```

Default / absent flag → `replaceCover` unchanged.

**Seed proof:** `applyParametric` on a deep copy of `docs/template-pipeline/merge/phase-3-payroll/deck.json` **without** `skipCover` → `parametric equal true` vs stored `deck.parametric` (`fullBleed` / `rail` / `balanced`).

Characterization tests: all passed (see §12).

## 10–11. Proof cover-word / corp-calibri

Command:

```
node services/templatePipeline/composer/proofCover.js --variant word --fontPair corp-calibri --out docs/template-pipeline/composer/proof-cover-word
```

- Geometry: **pass**, score **100** (1/1), `vision: false`, reasons `[]`.
- Title box: **11.666 in × 1.05 in**, font **72 pt** (from 120 px).
- Body box: **6.833 in × 0.630 in**, font **17 pt** (from 28 px), Chrome **2** lines.
- LibreOffice: `soffice.com` with unique `-env:UserInstallation` under `%TEMP%` (paths with spaces crash LO), then `pdftoppm -png -scale-to-x 1600 -scale-to-y 900`. Raster **ok**.
- Body line count in LO: not OCR’d; Chrome recorded **2** lines — compare visually on `lo-slide.png` (do not judge pixels here).

**Human review paths (side by side):**

1. `docs/template-pipeline/composer/proof-cover-word/chrome.png`
2. `docs/template-pipeline/composer/proof-cover-word/slide-01.png`
3. `docs/template-pipeline/composer/proof-cover-word/lo-slide.png`

Also: `deck.json`, `deck.pptx`, `analysis.json`, `proof-summary.json`.

Split / full-bleed: **compiled only**, not proof-run.

## 12. Characterization tests

```
qaLoop test passed
semanticFilter test passed
chooseLayout test passed
generateTemplateShape test passed
dead code test passed
manualQa test passed
safeRm test passed
```

No new file named `assembleDeck.js` or `composeDeck.js`.

---

Stop. Do not start Phase 4b.
