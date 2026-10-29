# Engine v1 report

Run 1 complete. Kit + DeckSpec + tokens path is live behind `ENGINE_V1=true`.

## What shipped

### 1 — DeckSpec schema
- `engine/deckspec.schema.json`
- `engine/validate.ts` — rejects geometry, unknown tokens, over-limit text, hex colors, bare font names
- `engine/types.ts`
- Golden specs: `engine/golden/specs/` (5)

### 2 — Style tokens
- `engine/tokens.json` — **6 palettes** (dark: `ink-night`, `charcoal-ember`), **4 type pairs**, treatments **`full-bleed` + `duotone`**, motifs `bar-accent` / `dot-cluster`
- Contact sheet: `out/contact-sheet/palette-type-sheet.png`

### 3–4 — Kit variants (from `design/refs/NOTES.md`)
- **20** files: `kit/<role>/{a,b}.json` with slots, fit rules, pptxMapping, layout geometry
- Shared **`photo-footer`** family on problem / solution / closing variant A (footer height + copy density only)
- Feature PRIMARY = a (feature-01) + b (feature-02)
- Closing PRIMARY = a (photo-footer) + b (centered contact); no resources/token-kit slide
- Cover a/b: placement from cover-01 / cover-03 as photo + treatment (no 3D)
- Variant B implemented for problem, solution, stats, testimonial, team, agenda
- Gallery: **20 PNG + 20 PPTX** under `out/gallery/<role>-<variant>/`

### 5 — Fitter + gates
- `engine/fit.ts` — shrink → clamp → reject
- `engine/gates.ts` — textFits, contrastOK, photoPresent, slideCountOK, noDuplicateTitles

### 6 — Variant selection + photos
- `engine/selectVariant.ts` — content-shape + seeded shuffle
- `engine/photos.ts` — Pexels → cache → treatment; published under `generated-templates/photos/engine-v1/`

### 7 — Prompt → DeckSpec → proofs
- `engine/generateKitV1.ts`, `engine/prompts/deckspec.md`, `engine/golden/prompts.json` (15)
- Wired: `ENGINE_V1=true` → `pipeline.runPipeline` / `adminCatalog.generateTemplate` → `generateKitV1` (no new UI mode)
- Proof PPTX:
  - `out/proof/supercars-garage/deck.pptx`
  - `out/proof/pediatric-dental/deck.pptx`
  - `out/proof/b2b-payroll/deck.pptx`

## Self-verification

| Check | Result |
| --- | --- |
| Validator rejects x/y, unknown palette, 61-char title, hex | pass (`engine/engine.test.ts`) |
| 20 variants validate against `variant.schema.json` | pass (20/20) |
| 20 gallery PNG + PPTX | pass (20/20) |
| 20 golden-derived specs → overflow / empty photo | **0 / 0** |
| Same prompt ×3 → different selections | **3 unique** |
| 15 golden prompts first-try gate pass | **15/15 (rate 1.0)** |
| `ENGINE_V1=true` routes to generateKitV1 | pass |
| Unit tests (validate / fit / gates / selectVariant) | pass |

Machine-readable: `out/engine-v1-report.json`

## Gallery PPTX (20)

- `out/gallery/agenda-a/slide.pptx`
- `out/gallery/agenda-b/slide.pptx`
- `out/gallery/closing-a/slide.pptx`
- `out/gallery/closing-b/slide.pptx`
- `out/gallery/cover-a/slide.pptx`
- `out/gallery/cover-b/slide.pptx`
- `out/gallery/feature-a/slide.pptx`
- `out/gallery/feature-b/slide.pptx`
- `out/gallery/how-it-works-a/slide.pptx`
- `out/gallery/how-it-works-b/slide.pptx`
- `out/gallery/problem-a/slide.pptx`
- `out/gallery/problem-b/slide.pptx`
- `out/gallery/solution-a/slide.pptx`
- `out/gallery/solution-b/slide.pptx`
- `out/gallery/stats-a/slide.pptx`
- `out/gallery/stats-b/slide.pptx`
- `out/gallery/team-a/slide.pptx`
- `out/gallery/team-b/slide.pptx`
- `out/gallery/testimonial-a/slide.pptx`
- `out/gallery/testimonial-b/slide.pptx`

## Proof PPTX (3)

- `out/proof/supercars-garage/deck.pptx`
- `out/proof/pediatric-dental/deck.pptx`
- `out/proof/b2b-payroll/deck.pptx`

## DESIGN REVIEW tags

- `scripts/build-kit-variants.js` — circular photo cutouts approximating cover-01 edge-breaking forms
- `scripts/build-kit-variants.js` — single motif bar on photo-footer leading edge
- Spacing / type scale defaults where NOTES.md was silent: generous margins ~72–80px, display ~36–64px, body ~18–24px

## Failed after repair

- none (proofs used deterministic fallback DeckSpec with `ENGINE_V1_SKIP_LLM=1` for this run’s offline reliability; LLM path is live when the flag is unset)

## Deferred to run 2

- Curator UI reduction to one generate button
- Deletion of seed-rewrite / native / agent paths
- README rewrite
- CI wiring for engine tests
- PNG-vs-PPTX pixel diff automation (manual PowerPoint open still required)
- Install/embed display fonts beyond Arial/Georgia
