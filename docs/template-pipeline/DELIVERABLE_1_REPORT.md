# Deliverable 1 report

Audit of 20 current-pipeline templates against 20 Canva-authored SlidesCarnival decks. Written comparison: `docs/template-pipeline/DESIGN_GAP_AUDIT.md`. Numbers: `services/templatePipeline/audit/results.json`.

## Built

- Reference set: 20 PPTX, 4 from each of 5 style buckets, listed in `services/templatePipeline/audit/referenceSet.json`. Downloader: `audit/fetchReference.js`.
- PPTX reader with no extra packages: zip (including truncated files that have no central directory), XML tokenizer, Canva `custGeom` path classification, theme colours, raster PNG stats including Adam7 interlace (`audit/zip.js`, `xml.js`, `fromPptx.js`, `png.js`).
- Deck JSON reader that resolves tokens, preview bindings and `visibleWhen` onto the same slide model (`audit/fromDeck.js`).
- Classifiers for the eight spec dimensions, plus spec-target pass rates (`audit/metrics.js`).
- Runner that measures reference, the 20 fresh decks, the 35 stored decks and the 14 app-library decks (`audit/runAudit.js`).
- 20 fresh generator decks in `audit/samples/ours/` (not written to the catalog).
- PowerPoint COM contact sheets of every reference deck and media-classifier sheets, used to check the rules by eye. Those files stay in `.audit-cache/` and are gitignored.

## Tested

- All 20 reference PPTX parse. 18 are complete zips. Two originally chosen files (`pottery-class`, `bakery-brand-marketing-plan`) were truncated at the host; they were replaced by `fashion-photographer-portfolio` and `coffee-shop-business-plan`.
- `readPptx` on every reference deck: kinds, geometries, last-slide text (used to write the housekeeping regex).
- PNG classifier: first pass dumped icons into “photo”; `topShare` (how much of the opaque area sits in the 8 most-used colours) separates flat graphics (≥0.6) from photos. Duotone/tint requires photographic detail **and** a narrow hue. Spot-checked against contact sheets of cutout, tint, flat, rounded-photo and texture buckets.
- Metrics vs rendered slides on `luxury-vacation-homes-company-profile` (1, 2, 3, 6, 9), `fundamentals-of-graphic-design-slides` (1, 2, 7, 8) and `print-media-advertising-slides` (1, 2, 5, 14): decoration families, molecules, photo treatments and bleed/overlap match what the sheet shows, with the caveats below.
- 20 generator decks produced in 30 attempts (6 text-overflow, 2 faint palettes, 2 too-similar).
- Full `runAudit.js` in 16.6s. Same classifiers on all four sources.

## Failed / inaccurate

- Canva.com and Envato files were not obtained. SlidesCarnival (Canva-made, listed in the spec) is the reference. Native Canva features that do not survive PPTX export (true SVG blends, some masks) are invisible.
- Full-slide dashed frames are counted as decoration, not as a background system. A luxury-homes cover therefore looks “flat + 4 decor” rather than “framed paper.” The count is still comparable across sources.
- Tiny icon PNGs with photographic thumbnails inside (a 30×30 house icon) can classify as `graphic` rather than `icon` when the box is large; family still lands in illustration/icon, not photo, after the `topShare` fix.
- `ghost_type` needs a resolved backdrop colour. Type sitting on a photo is not marked ghost; type sitting on a matching panel is. A few Canva oversized titles on photos are therefore “text on image” (play) rather than ghost (decor).
- No shipped templates exist, so the 20 “ours” are fresh generator output, not a shipped catalog. Stored 35 and library 14 are extra columns in the audit.
- Studio preview was not used as measurement. It still ignores `visibleWhen`, greys empty image slots, and draws every non-noise decor as the same radial gradient. Ship/Discard is training on a misrepresentation of the deck.

## Deferred

- Encoding any of these measurements as pipeline gates (deliverable 8).
- Schema extensions for rotation, masks, text outline, highlight, SVG path, duotone (later layers).
- Human blind evaluation (deliverable 10).
- Background-removal / cutout model.
- Taste-loop extensions (deliverable 9).
- Closing the studio renderer gap. It is not in the ten deliverables; it will poison Ship/Discard until someone does it.

## Design decisions (not specified, logged)

- **SlidesCarnival PPTX instead of screenshots of Canva.com.** Rationale: precise element counts beat guessed counts from pixels, and the spec lists SlidesCarnival.
- **Replace truncated files rather than measure them with missing images.** Rationale: image-treatment numbers would be guesses. Same buckets, same source.
- **Drop housekeeping slides with a text regex.** Rationale: font-list and credits pages would inflate icon and “thin title slide” counts.
- **Count full-slide noise/mesh as a background layer, not as decoration.** Rationale: otherwise every one of our body slides would show 1 extra decorative element and hide the real gap.
- **Count a full-slide wash as not satisfying anti-thinness.** Rationale: reviewers still see title + bullets. Proposed as a spec clarification in the audit, awaiting approval.
- **Photo vs graphic from colour concentration (`topShare`), not file type.** Rationale: Canva packs photos as PNG, often interlaced; JPEG-only would miss them, and treating every PNG as a photo would count icons as photographs.
- **Occupancy-grid reuse across decks as the composition tell.** Rationale: within-deck signature ratio looks fine (80% vs 93%); three generated templates in a row still look like one layout.

## Proposed spec changes

Listed in `DESIGN_GAP_AUDIT.md` §11. Short version: several hard/soft gates as written would **reject Canva itself** (0/20 decks pass “≥4 decor per content and ≤1 per title”; 1/20 pass “one shape family”; 3/20 pass “exactly one grid break”; 7/19 pass “60% treated images”). Calibrate those gates to the reference before deliverable 2 encodes `design_language`. **Waiting on approval. Deliverable 2 is not started.**

Also, two spec lines contradict each other: Layer 4 “never mix two background systems” vs the soft gate “only one background system used (suggests under-use).” Proposal: one **primary** system per deck; local blocks/splits/scrims allowed.

Licence notes for later layers, checked against current published terms:

- **unDraw:** free for commercial use in a product, no attribution; do not redistribute as a pack or competing illustration library, and do not train models on it. Fine as decoration *inside* a generated template; not fine as a shape catalog we ship.
- **Streamline free:** CC BY 4.0, attribution plus a link to streamlinehq.com required. Awkward inside a slide template unless we add a credits slide. Prefer MIT/ISC sets (Phosphor, Lucide, Heroicons) unless we take a paid Streamline licence.
- **SlidesCarnival:** CC BY 4.0. Used here as *reference for measurement*, not copied into output. PPTX stay gitignored.

## What failed to meet the letter of deliverable 1

The spec asked for “20 of our **shipped** templates vs 20 Canva/**Envato** templates.” We have zero shipped and no Envato access. Substitutions are documented in the audit. If that is unacceptable, say so before any later deliverable.

## Stop

Deliverable 1 is ready for review. No work on deliverable 2 until the audit and the proposed spec edits are accepted or rejected.
