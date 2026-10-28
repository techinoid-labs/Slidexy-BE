# Pipeline merge — Phase 5b-0 ingest

Rebuild the seed library from human-owned PPTX files in Downloads. Vision off for curator QA (`VISION_QA` unset). Credit restored.

**Backup target:** `C:\Users\SP Grid\Desktop\Techinoid\seed-originals\` (outside Slidexy-BE). Sync that folder off this machine.

---

## Candidates

Source: `C:\Users\SP Grid\Downloads` — `.pptx` files in that folder only (no recursion). Slide counts from zip entries `ppt/slides/slide*.xml`. Proposed id = slug of the file name; if that id already exists in `app-library/`, suffix `-2` (or keep the `(1)`-derived `-1` when present in the name).

| # | File name | Size | Modified | Slides | Proposed deck id | Notes |
| ---: | --- | ---: | --- | ---: | --- | --- |
| 1 | `apex-sentinel.pptx` | 0.96 MB | 2026-10-21 17:29 | 6 | `apex-sentinel` | free |
| 2 | `aroma-haven.pptx` | 1.78 MB | 2026-10-21 17:45 | 10 | `aroma-haven` | free |
| 3 | `Dependent and Independent Variables Lesson for Middle School (1).pptx` | 4.71 MB | 2026-10-28 14:41 | 15 | `dependent-and-independent-variables-lesson-for-middle-school-1` | free (`-1` from filename) |
| 4 | `Dependent and Independent Variables Lesson for Middle School.pptx` | 4.71 MB | 2026-10-28 14:40 | 15 | `dependent-and-independent-variables-lesson-for-middle-school-2` | base id already in `app-library/` |
| 5 | `First Aid & Medicine Life Skills Presentation.pptx` | 4.66 MB | 2026-10-28 14:40 | 18 | `first-aid-medicine-life-skills-presentation-2` | base id already in `app-library/` |
| 6 | `fit-life.pptx` | 0.88 MB | 2026-10-22 23:28 | 10 | `fit-life` | free |
| 7 | `Geometric History of Graphic Design Slides (1).pptx` | 24.74 MB | 2026-10-28 14:41 | 17 | `geometric-history-of-graphic-design-slides-1` | free (`-1` from filename) |
| 8 | `Geometric History of Graphic Design Slides.pptx` | 24.74 MB | 2026-10-28 14:40 | 17 | `geometric-history-of-graphic-design-slides-2` | base id already in `app-library/` |
| 9 | `Personal Trainer Portfolio Black and Beige Modern Minimal Presentation.pptx` | 64.48 MB | 2026-10-28 14:40 | 17 | `personal-trainer-portfolio-black-and-beige-modern-minimal-presentation-2` | base id already in `app-library/` |
| 10 | `Pitch Deck Competitor Analysis Slides   .pptx` | 28.25 MB | 2026-10-28 14:40 | 20 | `pitch-deck-competitor-analysis-slides-2` | base id already in `app-library/` |
| 11 | `SEO Competitor Analysis Slides    .pptx` | 9.88 MB | 2026-10-28 14:40 | 20 | `seo-competitor-analysis-slides-2` | base id already in `app-library/` |
| 12 | `swiftpay-solutions.pptx` | 0.41 MB | 2026-10-27 22:06 | 11 | `swiftpay-solutions` | free |

**Approval:** ingest **4, 5, 8, 9, 10, 11** only under **base ids** (delete stale `app-library/<base-id>.json` + `.dna.json` first). Skip 1, 2, 6, 12 (pipeline outputs) and 3, 7 (duplicates).

---

## 2. Convert (approved six)

Stale JSON/DNA for the six base ids deleted first. `git status --porcelain -- app-library/` stayed empty (gitignored). Originals copied (not moved) to `seed-originals\<id>.pptx`. Then:

`node services/templatePipeline/convert/pptxToDeck.js "<seed-originals path>" <id>`

Full converter warning lines are archived verbatim in `docs/template-pipeline/merge/_5b0-audit.json` (`warnings` per seed). Summary:

| id | slides | text | shape | picture | refs | missing | fonts (registered?) | keep |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| `dependent-and-independent-variables-lesson-for-middle-school` | 15 | 62 | 15 | 61 | 61 | 0 | Oswald ✗ · Red Hat Display ✗ · Roboto ✗ | yes |
| `first-aid-medicine-life-skills-presentation` | 18 | 138 | 18 | 43 | 43 | 0 | Amiko ✗ · Arial ✓ · Roboto ✗ | yes |
| `geometric-history-of-graphic-design-slides` | 17 | 166 | 17 | 46 | 46 | 0 | Arial ✓ · Be Vietnam Pro ✗ · Ultra ✗ | yes |
| `personal-trainer-portfolio-black-and-beige-modern-minimal-presentation` | 17 | 107 | 17 | 82 | 82 | 0 | Gloria Hallelujah ✗ · Nunito ✗ · Oswald ✗ | yes |
| `pitch-deck-competitor-analysis-slides` | 20 | 182 | 20 | 72 | 72 | 0 | Anton ✗ · Arial ✓ · Arimo ✗ · Open Sans ✗ | yes |
| `seo-competitor-analysis-slides` | 20 | 112 | 20 | 117 | 117 | 0 | Anton ✗ · Arial ✓ · Montserrat ✗ | yes |

Registered set = Calibri / Arial / Georgia / Segoe UI. Unregistered families are substitution risks (noted ✓/✗ above). All six kept (0 missing image files under `generated-templates/photos/<id>/`).

---

## 3. Score

`VISION_QA` unset. Per id: `node scripts/score_seeds.js <id>`.

`score_seeds.js` runs `injectTheme(..., { qa: false })` then `analyzeDeck(..., { vision: true })` (hybrid-v2). It does **not** write `deck.qa.mode` / DNA `qa.mode`. Vision slide reasons still appear in `scoreFailures` because the scorer hardcodes `vision: true` (script not editable in this phase).

Scorer left `semanticType` / `industry` blank; set manually by reading each deck (`semanticTypeSource` / `industrySource` = `manual-read-deck-5b0`). `recommendedUse` comes from scorer heuristics (photo area / text density).

| id | qualityScore | recommendedUse | semanticType | industry | scoreFailures | disabled |
| --- | ---: | --- | --- | --- | --- | --- |
| dependent-… | 53 | Photo-heavy | Abstract (manual) | — | contrast 1; washed out 2,6; quality 0.3 on 9; broken layout 12; text overlap 14; quality 0.5 on 15 | false |
| first-aid-… | **94** | Photo-heavy | Photo-driven (manual) | health (manual) | broken layout on slide 10 | false |
| geometric-… | 88 | Corporate | Illustration-heavy (manual) | — | broken layout 5, 10 | false |
| personal-trainer-… | 53 | Photo-heavy | Photo-driven (manual) | fitness (manual) | quality 0.5 on 3; broken layout 4,5,6,8,12,14,15 | false |
| pitch-deck-… | 75 | Photo-heavy | Photo-driven (manual) | — | contrast 1,2,6; broken layout 3; washed out 16 | false |
| seo-… | 90 | Photo-heavy | Photo-driven (manual) | — | broken layout 5; text overlap 19 | false |

Auto-Select usable (≥70): first-aid, seo, geometric, pitch-deck.

---

## 4. Gitignore / originals location

- `app-library/*` ignored (`.gitignore:144`). After ingest, `git status --porcelain -- app-library/` → **0 lines**.
- `seed-originals\` is **outside** the repo (`Techinoid\seed-originals\`, not under `Slidexy-BE`). Six PPTX present.

---

## 5. Pinned proof (highest score)

```text
node services/templatePipeline/thematic.js --prompt "A corporate payroll company" \
  --layout first-aid-medicine-life-skills-presentation \
  --out docs/template-pipeline/merge/phase-5b-0-first-aid-medicine-life-skills-presentation
```

- Layout: `first-aid-medicine-life-skills-presentation` (score 94).
- Text-model: inventDirection + rewrite (custom generate hit Groq OTPM 429 once, fell back); no 402.
- Missing images: **0**. Decorations kept. Photo slides 0.
- Console: `qa manual geometry 100 (18/18)`.
- `deck.qa`: `mode: "manual"`, score **39** (7/18) — mostly text-under-picture + 2 pptx line-count mismatches (geometry path was clean).
- PNGs: `docs/template-pipeline/merge/phase-5b-0-first-aid-medicine-life-skills-presentation/slide-01.png` … `slide-18.png`.
- LO: `…/_pptx-gate/lo-slide-01.png` … `lo-slide-18.png`.

---

## 6. Gallery Seeds section

`composer/gallery.js` now renders each kept seed’s slides from `app-library` JSON (own tokens, no theming), labelled `seed / <id> / slide N · geometry …`, plus a **Seeds** block in `index.html`. Seed rows are also appended to `report.entries` with `bucket: "light-neutral"` so the curator Gallery API shows them beside kit pieces.

Regenerated `docs/template-pipeline/composer/gallery/`.

- Kit slides: **36** (geometry fails: **0**)
- Seed slides added: **107** (geometry fails: **13**)

---

## 7. Curator UI

Restarted curator on `5055` (no prior generate in that process log). Opened `http://127.0.0.1:5055/`.

- **Gallery:** 135 light-neutral tiles; 107 captions start with `seed / …` (Seeds present).
- **Generate:** Mode **Pinned**, base `first-aid-medicine-life-skills-presentation`, prompt `A corporate payroll company`.
  - Score **44** (8/18); failures = text-under-picture + pptx mismatches.
  - **seed-assets line absent** (no missing-image fails).
  - Thumbnails rendered; review form shown.
  - Submitted review `fixType: "none"` → `docs/template-pipeline/composer/reviews/first-aid-medicine-life-skills-prese-mvs0b9v3.json`.

---

## 8. Tests + guide

Ran every `services/templatePipeline/**/*.test.js`.

**Pass:** antiTells, catalogCaps, catalogGolden, chooseLayout, composer, decorations, deadCode, finishDeck, fitText, fontRoles, generateTemplateShape, inventBrief, manualQa, pipelineShape, qaLoop, reasonDeck, reviewRoutes, safeRm, semanticFilter, similarity.

**Fail (pre-existing drift, not touched this phase):** `learn.test.js` — `STRATEGY_NAMES.length` is **22**, test still expects **19**.

No file named `assembleDeck.js` or `composeDeck.js` (there is `assemble_deck.js`).

**Guide:** Restore procedure added to `docs/template-pipeline/composer-pipeline-howto.md` (seed-originals → pptxToDeck → score_seeds → gallery.js).

---

## Stop

Phase 5b-0 complete. Do not start 5b.
