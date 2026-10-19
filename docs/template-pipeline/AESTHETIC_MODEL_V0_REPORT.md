# Aesthetic model v0

Four items. Nothing here starts the grammar deliverable.

## 1. planReasoning

`planReasoning` still picks the least-used strategy. On an empty catalog the old picker drew each seed independently, so ties did not spread across seeds. Seeds 1–10 (40 body slides) missed `sequence.spine` and piled onto `evidence.proof` (5) and `transition.edge` (4).

| Strategy | Before | After |
|---|---|---|
| sequence.rail | 3 | 2 |
| sequence.spine | 0 | 3 |
| sequence.index | 1 | 2 |
| sequence.steps | 1 | 2 |
| comparison.halves | 3 | 1 |
| comparison.ledger | 2 | 3 |
| comparison.offset | 2 | 1 |
| evidence.figure | 2 | 2 |
| evidence.proof | 5 | 3 |
| evidence.bars | 3 | 1 |
| emphasis.word | 3 | 3 |
| emphasis.corner | 1 | 2 |
| emphasis.band | 1 | 2 |
| narrative.bleed | 1 | 2 |
| narrative.margin | 1 | 3 |
| narrative.frames | 3 | 1 |
| transition.pause | 2 | 3 |
| transition.chapter | 2 | 3 |
| transition.edge | 4 | 1 |

Ties now order by a salt from the deck's random stream (`tieRank`, multiplier 71). Least-used still wins. The test in `reasonDeck.test.js` calls `planReasoning([], mulberry32(seed))` for seeds 1–10. It passed: every strategy in `STRATEGIES` appears at least once, and none appears more than 3 times. The existing 24-deck check still passes (12 distinct job mixes, busiest composition 6%).

## 2. Audit refresh

Same measurement as the original audit (`analyzeDeck` / `readDeck`). Ten Harbor decks, 60 slides. Gap closed is `(after − before) / (reference − before)`.

| Dimension | Reference | Before (audit) | After (this run) | Gap closed |
|---|---|---|---|---|
| Decoration per content slide | 4.7 | 2.0 | 5.8 | 142% |
| Distinct motifs per content slide | 2.6 | 0.7 | 4.3 | 188% |
| Molecule types per deck | 5.7 | 2.1 | 3.7 | 44% |
| Photos per deck | 20.4 | 1.5 | 8.7 | 38% |
| Treated images % | 41% | 24% | 40% | 95% |
| Slides with overlap % | 51% | 1% | 82% | 161% |
| Slides with bleed % | 31% | 0% | 0% | 0% |
| Imperfections per slide | 1.85 | 0.38 | 1.05 | 46% |

Below 50% gap closed — the gate can pass while the target is still missed:

- Molecule types per deck, 44%. Mean 3.7 types, reference 5.7.
- Photos per deck, 38%. 8.7 against 20.4. Per deck: 9, 9, 8, 9, 9, 8, 9, 9, 8, 9.
- Slides with bleed, 0%. The audit counts a shape drawn past the canvas. These decks stay inside 1600×900, so a flush edge does not count.
- Imperfections per slide, 46%. 1.05 against 1.85.

Decoration count, motif variety, treated images, and overlap are at or past the reference. Those four were not changed again.

## 3. LAION aesthetic gate

Scorer: CLIP ViT-L/14 (`openai/clip-vit-large-patch14`) plus the improved-aesthetic-predictor MLP (`sac+logos+ava1-l14-linearMSE.pth`). `scripts/score_aesthetics.py` renders a deck JSON through SVG → LibreOffice PDF → PNG at 1600×900 and prints `{ slide_scores, deck_mean, deck_min }`.

| Set | Slides | Mean | SD | Min | Max |
|---|---|---|---|---|---|
| Balanced reference PNGs | 75 | 4.6718 | 0.371 | 3.965 | 5.454 |
| Harbor decks | 60 | 4.1910 | 0.300 | 3.511 | 4.777 |

Reference mean − Harbor mean = **0.481**, which clears the 0.3 bar. Point-biserial correlation of score with group (reference = 1, Harbor = 0) is **0.58**. The ranges overlap, so this is a coarse slide signal, and it does move in the right direction.

Decision: **wire it as a soft flag.** `--score` on `runBatch` and `createTemplate(seed, { score: true })` writes `scores: { aesthetic_mean, aesthetic_min, slide_scores }` after the deck JSON is saved. A scoring failure is logged and the deck is kept. `judge` adds `low-aesthetic` when `aesthetic_mean` is below the 25th percentile of the other scored decks in `generated-templates/`. `ok` stays true. The eight catalog decks were scored in place (no regeneration). `node scripts/report_aesthetic_scores.js` prints them sorted, with boundaries p25 4.2478, p50 4.3094, p75 4.3796.

These scores are a temporary signal. They are not training labels for the preference model.

## 4. Shipping prep

Ten PPTX files:

`generated-templates/rendered/harbor-1.pptx` through `harbor-10.pptx`

LibreOffice has no PPTX export from the SVG/PDF render, so each file is the 1600×900 slide render placed on a 13.333×7.5 inch slide. LibreOffice then opened all ten: each converted back to PDF (180–222 KB).

Deck JSON, with `scores.aesthetic_mean`, is in `generated-templates/harbor-1.json` through `harbor-10.json`.

Open the review page from the `Slidexy-BE` folder:

```
python -m http.server 8765
```

Then open `http://localhost:8765/docs/template-pipeline/shipping-preview/`.

The page loads those ten JSON files, shows one thumbnail row per deck, and sorts highest aesthetic mean first. Ship, Discard, and Unsure write to `localStorage` (`slidexy-shipping-preview:v1`). Export downloads `shipping.jsonl`, one object per choice:

```json
{"deck_id":"harbor-1","choice":"ship","timestamp":"2026-10-19T18:00:00.000Z"}
```

`choice` is `ship`, `discard`, or `unsure`. This file is for the user test. `store.reviewTemplate` is unchanged.
