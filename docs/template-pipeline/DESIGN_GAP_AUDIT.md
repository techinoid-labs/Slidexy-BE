# Design gap audit

Quantified comparison of **20 of our templates** against **20 Canva-authored templates** across the eight dimensions in the Canva-tier spec. This document is deliverable 1. It gates all later work.

Figures come from `services/templatePipeline/audit/results.json`, produced by the same classifiers on both sources. Means are per deck unless noted. Ranges are min–max across the 20 decks.

## 1. What was compared

### 1.1 Reference (20)

Native Canva and Envato files are not measurable from this machine: Canva is authenticated, Envato is paywalled. The spec lists SlidesCarnival as a reference source. SlidesCarnival templates are **authored in Canva** and exported to PowerPoint, so they are the closest licence-accessible, machine-readable Canva set.

Twenty decks were drawn from 206 listed templates, stratified as four decks from each of five style buckets. Games, quizzes, documents, posters and single-slide infographics were excluded. PowerPoint download was required.

| Bucket | Decks |
|---|---|
| Minimal professional | `minimalist-white-slides`, `it-consulting`, `simple-business-proposal-slides`, `stocks-trading-business-plan` |
| Pitch / tech | `retail-startup-pitch-deck`, `it-software-pitch-deck`, `elegant-pitch-deck`, `pitch-deck-competitor-analysis-slides` |
| Editorial / portfolio | `photojournalist-portfolio`, `fashion-photographer-portfolio`, `elegant-branding-kit`, `luxury-vacation-homes-company-profile` |
| Bold creative | `weekly-recruitment-report`, `print-media-advertising-slides`, `fundamentals-of-graphic-design-slides`, `a-year-in-breakdowns-presentation` |
| Lifestyle / illustrated | `my-travel-wrapped-slides`, `wellness-and-retreat-presentation`, `coffee-shop-business-plan`, `diabetes-mellitus-slides` |

Two originally selected files (`pottery-class`, `bakery-brand-marketing-plan`) arrived truncated from the host (no zip central directory, most images missing). They were replaced by `fashion-photographer-portfolio` and `coffee-shop-business-plan` from the same buckets. Manifest: `services/templatePipeline/audit/referenceSet.json`. Files live in `.audit-cache/reference/` (gitignored).

Housekeeping slides (font lists, resource pages, credits, “how to use this template”) are dropped before measuring. Across 20 decks that leaves **342 slides** (276 content, 20 covers).

### 1.2 Ours (20)

There are **no shipped templates**. The catalog currently holds 35 stored decks: 28 discarded, 7 candidates, 0 shipped. The spec asked for 20 of ours, so we generated 20 **fresh current-pipeline decks** that pass the existing gates (`invalid`, `ai-tells`, `text-overflow`, `too-similar`) and are **not written to the catalog**. They sit in `services/templatePipeline/audit/samples/ours/`. Generation: 20 saved of 30 attempts (6 text-overflow, 2 faint palettes, 2 too-similar).

Deck JSON is measured on its **preview slides** with the studio sample copy, so every layout in the sequence is seen. Image slots count as photos.

### 1.3 Extra columns (not the 20-vs-20)

- **Stored (35):** everything currently in `generated-templates/`. Mix of the older fixed-sequence generator and the current one.
- **App library (14):** hand-authored decks in `slidesX-Flutter-POC/assets/templates/decks`. These show what the shared JSON schema can already express when a person authors it.

### 1.4 How counts are made

All sources are reduced to the same slide model (every visible element, paint order, 1600×900 px). PPTX EMU is scaled onto that canvas. Custom paths from Canva exports are classified from the path (rect, roundRect, ellipse, line, triangle, polygon, ring, organic, curved, compound). Raster PNG media is sampled for transparency layout (rect / rounded / circle / arch / cutout) and content (photo / flat graphic / gradient / texture), including Adam7-interlaced files.

A **decorative element** is anything that is not the slide background, not a text run the reader is meant to read, not a photo, and not a container that holds text or a photo (cards, bands, mats, frames). Icons, rules, blobs, ghost type, stickers and unused geometric fills count. Repeated identical dots on one slide still count as separate elements but as one **motif group**.

A **molecule** is a recurring content assembly: card, number badge, pill, highlight label, icon+label, stat block, quote, timeline, list, captioned photo, avatar, table, chart, band, eyebrow, nav bar.

**Typographic play** is mixed-weight or mixed-size runs, highlight rectangles, outlined or hollow type, oversized numerals, rotated or vertical text, tracked caps, script accents, ghost type, split headlines, type that breaks a box, type on an image. Scale contrast and caps-as-display are reported separately; they are common in both sets and are not treated as “play” for the spec’s “at least one play per deck” target.

**Imperfection** is tilt, bleed, partial overlap, organic silhouette, asymmetry of mass, or a handmade/script/texture mark.

PowerPoint contact sheets of every reference deck, plus classifier sheets of the media buckets, were used to spot-check the rules against what a person sees.

Limits of the method:

- Vector SVG inside PPTX `svgBlip` is detected as vector, not drawn.
- Theme scheme colours are resolved from the master; a few fills stay as `scheme:*` if the theme is missing.
- Studio preview is **not** used as ground truth. It ignores `visibleWhen`, draws empty image slots grey, and renders every non-noise decor as the same radial wash.
- Two truncated source files were replaced rather than measured with missing media.

## 2. Headline

Canva-authored decks are not “busier backgrounds.” They are **sparser grounds, denser local decoration, more photo treatments, overlapping layers, and layouts that do not repeat from deck to deck.**

Our generator already varies slide *type* and already puts a full-slide noise or mesh wash on every body slide, so it scores well on background-layer count and poorly on everything a reviewer actually sees: decoration, components, image treatment, overlap, bleed, tilt, and catalog-level layout reuse.

| What a reviewer notices | Reference | Ours |
|---|---|---|
| Decorative elements per content slide | 4.7 (0.3–14.9) | 2.0 (0.0–5.0) |
| Distinct decorative motifs per content slide | 2.6 | 0.7 |
| Decorative elements on the cover | 7.2 (median 3) | 0.3 (median 0) |
| Molecule types per deck | 5.7 | 2.1 |
| Share of the most common molecule | 42% | 68% (cards) |
| Photos per deck | 20.4 | 1.5 |
| Photos with a non-plain treatment | 41% | 24% |
| Slides with overlapping elements | 51% | 1% |
| Slides with an element bleeding off the edge | 31% | 0% |
| Slides with a tilted element | 12% | 0% |
| Canvas covered by elements | 54% | 38% |
| Spread of the text left edge across slides | 155 px | 7 px |
| Layouts reused across 3+ other decks | 16% of slides | 72% of slides |
| Slides with two or more imperfections | 50% | 2% |

The app library, authored in the same JSON schema, already reaches reference-like decoration (6.7 per content slide) and overlap (55%). The gap is **generation**, not schema ceiling — except for rotation, masks, outlines and duotone, which the schema still cannot express.

## 3. Dimension 1 — Background system

| Measure (mean per deck, range) | Reference (20) | Ours (20) | App library (14) |
|---|---|---|---|
| Slides with a flat ground | 51% (0–100%) | 3% (0–20%) | 8% |
| Non-flat background systems used per deck | 2.2 (0–6) | 3.0 (1–4) | 2.5 |
| Background layers per slide | 1.41 (1.00–3.00) | 2.21 (1.83–2.80) | 2.29 |

Pooled slide share, primary system:

- Reference: flat 52%, texture 13%, color block 13%, photo split 9%, photo 5%, gradient 5%, pattern 3%.
- Ours: gradient 44%, texture 38%, photo 8%, color block 7%, flat 3%.

**Gap.** Reference decks sit on paper, a color field, or a photograph, then add a local block or split. Half of their slides are a flat ground and still look designed. Ours almost never leave the ground alone: every body slide gets a full-canvas noise or mesh, so “layers” are high and “flat share” is low, while the slide still reads as a rectangle of type on a wash.

The spec says Layer 4 must pick **one** background system and “never mix two,” and the soft gate flags “only one background system used” as under-use. Those two lines conflict. Reference decks use a **primary** system and freely add local color blocks, photo splits and glows (2.2 systems per deck, 2.7 distinct primaries). Forcing a single system on every slide would move us **away** from Canva, not toward it.

## 4. Dimension 2 — Decorative vocabulary

| Measure (mean per deck, range) | Reference (20) | Ours (20) | App library (14) |
|---|---|---|---|
| Decorative elements per content slide | 4.7 (0.3–14.9) | 2.0 (0.0–5.0) | 6.7 |
| Distinct decorative motifs per content slide | 2.6 (0.1–6.7) | 0.7 (0.0–2.0) | 4.5 |
| Decorative elements on the cover | 7.2 (0–41) | 0.3 (0–4) | 6.1 |
| Decorative elements on title / closing slides | 5.5 (0–48) | 0.7 (0–1) | 5.8 |
| Decoration families per deck | 4.2 (1–6) | 2.5 (1–3) | 4.5 |
| Decoration anchored to an edge or bleeding | 26% (0–74%) | 0% | 15% |

Pooled, share of slides that contain each family:

- Reference: rule 45%, geometric 38%, illustration 38%, icon 14%, outline 11%, organic 6%, glow 5%, type 2%, sticker 2%.
- Ours: geometric 22%, rule 18%, type 9%. No illustration, icon, outline, organic, sticker or glow as decoration.

Content slides with **≥4** decorative elements: reference 49%, ours 36%. Median per content slide: reference **3**, ours **0**. Cover decoration, sorted: reference `0,0,1,1,1,1,2,2,2,2,4,5,6,7,10,11,11,15,22,41`; ours `0` on 18 of 20 covers.

**Gap.** This is the largest visual hole. Canva puts rules, dashed frames, numbered circles, icons, torn-paper stickers, blobs and collaged illustrations around the content, often hanging off an edge. We put a timeline dot or a card radius and stop. Ghost oversized titles (`cover: type`) are our only “type as decoration.” Nothing is edge-anchored. The app library already places 6.7 decorative elements per content slide in the same JSON, so the renderer can do this; the generator does not.

Spec target “≥4 per content slide **and** ≤1 per title slide”: **0 / 20** reference decks pass, **2 / 20** of ours. Canva title and cover slides are often the *most* decorated page in the deck. Calibrate before encoding this as a gate. Proposed numbers are in §11.

## 5. Dimension 3 — Component richness

| Measure (mean per deck, range) | Reference (20) | Ours (20) | App library (14) |
|---|---|---|---|
| Molecule types per deck | 5.7 (2–11) | 2.1 (1–3) | 6.1 |
| Molecules per content slide | 1.7 (0.3–3.7) | 2.6 (1.3–4.3) | 6.5 |
| Share of the most common molecule (by instance) | 42% (21–67%) | 68% (38–100%) | 47% |
| Most-used molecule’s share of slides | 35% | 26% | 59% |

Pooled instance mix on content slides:

- Reference: card 20%, icon+label 15%, number badge 12%, captioned photo 10%, list 8%, stat block 6%, nav bar 6%, pill 5%, highlight label 5%, timeline 4%, index numeral 3%, then eyebrow, table, avatar, bar chart, band, quote.
- Ours: card **55%**, index numeral 35%, list 10%, timeline 1%.

**Gap.** We are not short of *count* (2.6 molecules per content slide vs 1.7). We are short of *kinds*. Almost every body slide is a card grid or a numbered list. Reference decks mix badges, pills, icon rows, captioned photos, stat blocks and nav chrome in the same template. Spec “≥4 types per 10-slide deck; no molecule on more than 40% of slides”: **11 / 20** reference, **5 / 20** ours. Our instance mix (68% cards) is the real failure; slide-share (26%) looks acceptable only because decks are short and the leftover slides are empty of molecules.

## 6. Dimension 4 — Image treatment

| Measure (mean per deck, range) | Reference (20) | Ours (20) | App library (14) |
|---|---|---|---|
| Photos per deck | 20.4 (0–46) | 1.5 (0–2) | 0 |
| Image-bearing slides per deck | 10.4 | 1.5 | 0 |
| Image-bearing slides with a non-plain treatment | 45% (0–100%) | 24% (0–100%) | n/a |
| Photos with a non-plain treatment | 41% (0–100%) | 24% (0–100%) | n/a |
| Treatment kinds per deck | 1.9 (0–6) | 0.3 (0–1) | 0 |
| Photos with text set over them | 17% | 40% | n/a |
| Photo stickers per deck | 0.3 | 0 | 0 |

Treatments seen on reference photos (share of 407 photos): frame 11%, bleed 11%, cutout 8%, duotone/tint 6%, rounded 5%, mat 5%, full-bleed 4%, tilted 4%, organic mask 3%, circle 3%, mono 2%, tape/sticker 2%, faded 1%, offset block 0.5%.

Ours (30 photo slots): full-bleed 33%, overlay 17%, mat 3%. No cutout, frame, tilt, polaroid, arch, blob mask, collage or duotone.

**Gap.** Two separate holes. (1) **Few images** — a six-slide deck with one cover photo and one image-left layout cannot look like a Canva template that photographs every other page. (2) **Plain treatment** — when we do use a photo it is a rectangle, sometimes with a dark scrim. Spec “≥60% of image-bearing slides treated”: **7 / 19** reference decks, **3 / 19** ours. The reference set itself misses 60%. Layer 5’s other line (“never more than 40% plain full-bleed”) is the one the measurements support.

Library decks currently ship no bound photos, so they do not inform this dimension.

## 7. Dimension 5 — Typographic play

| Measure (mean per deck, range) | Reference (20) | Ours (20) | App library (14) |
|---|---|---|---|
| Slides with typographic play (excluding scale/caps-as-display) | 43% (6–100%) | 34% (0–100%) | 62% |
| Play features per slide | 1.48 (0.23–3.00) | 0.53 (0.00–1.20) | 1.09 |
| Play feature kinds per deck | 5.3 (2–8) | 2.7 (0–4) | 3.2 |
| Headline-to-body size ratio | 4.1 (3.0–6.3) | 3.0 (2.6–3.6) | 2.9 |
| Largest headline (px at 1600 wide) | 167 (98–287) | 118 (96–160) | 111 |
| Font families per deck | 2.9 (1–8) | 2.0 (always 2) | 2.1 |

Pooled, share of slides:

- Reference: scale contrast 39%, caps display 30%, text on image 20%, breaks the box 10%, rotated 8%, highlight 8%, split headline 7%, big numerals 6%, script 4%, mixed runs 3%, ghost 2%, italic 1%. Outline text is effectively unused.
- Ours: scale contrast 18%, big numerals 9%, ghost 9%, text on image 8%, split headline 4%, script 4%. No rotation, highlight, outline, mixed headline or tracked caps.

**Gap.** Size contrast is present on covers and missing on body slides (body stays ~21 px, titles ~46 px, ratio stuck near 3). Canva routinely sets 150–250 px display type, rotates a label 90°, highlights a word, or stacks two weights in one headline. Spec “at least one play per deck” is already passed by **14 / 20** reference and **11 / 20** of ours — it will not change what a reviewer sees. A useful gate is “≥1 play feature **per content slide on average**” (reference 1.48, ours 0.53).

## 8. Dimension 6 — Compositional variety

| Measure (mean per deck, range) | Reference (20) | Ours (20) | App library (14) |
|---|---|---|---|
| Distinct occupancy grids / slides inside one deck | 93% (68–100%) | 80% (57–100%) | 72% |
| Slides with overlapping elements | 51% (5–100%) | 1% (0–20%) | 55% |
| Slides with an element bleeding off the edge | 31% (0–100%) | 0% | 24% |
| Slides with a tilted element | 12% (0–89%) | 0% | 0% |
| Slides that break the grid (bleed or tilt) | 5.4 per deck | 0 | 2.4 |
| Canvas covered by elements | 54% (27–78%) | 38% (28–47%) | 61% |
| Stack depth (elements at the busiest 10%) | 1.64 | 1.30 | 2.25 |
| Spread of the text left edge across slides (px) | 155 (0–282) | 7 (0–29) | 62 |

Archetypes (share of slides):

- Reference: asymmetric 55%, split 18%, grid 11%, full-bleed photo 4%, collage 4%, centered statement 4%, statement 3%, centered 2%.
- Ours: asymmetric 21%, statement 21%, split 20%, grid 16%, centered statement 13%, full-bleed photo 8%. No collage, no diagonal, no magazine spread.

**The tell is across decks, not inside one deck.** Within a deck we already shuffle the sequence. Across the 20:

| | Distinct occupancy grids | Grids per slide | Slides whose grid appears in ≥3 other decks |
|---|---|---|---|
| Reference | 256 / 342 | 0.75 | **16%** |
| Ours | 30 / 123 | 0.24 | **72%** |
| Stored | 69 / 375 | 0.18 | 76% |

A reviewer who generates three templates in a row sees the same title-left / cards-below occupancy. Canva does not.

**Gap.** Missing: overlap as a design tool, bleed, tilt, collage, bento, magazine caption column, leftover margin, and a left edge that is allowed to move. Spec “exactly one slide breaks the grid”: **3 / 20** reference, **0 / 20** ours. **18 / 20** reference decks break the grid on **at least** one slide, usually several. “Exactly one” is not what Canva does.

The hard gate “no element outside slide bounds” forbids the bleed the spec also requires. See §11.

## 9. Dimension 7 — Design-language cohesion

| Measure (mean per deck, range) | Reference (20) | Ours (20) | App library (14) |
|---|---|---|---|
| Palette colors (≥1% of colored area) | 3.8 (1–9) | 4.0 (3–6) | 4.8 |
| Area held by the top three colors | 93% | 96% | 95% |
| Font families | 2.9 (1–8) | 2.0 | 2.1 |
| Share of the dominant corner style | 73% (37–100%) | 87% (60–100%) | 74% |
| Distinct radius kinds (sharp / rounded / round) | 1.7 | 1.5 | 2.4 |
| Distinct stroke widths | 2.4 | 0.0 | 1.4 |
| Distinct shadow styles | 0.0 | 0.0 | 0.1 |
| Decorative shape families per deck | 3.3 (1–5) | 1.9 (1–3) | 3.4 |
| Motifs recurring on ≥3 slides | 1.6 | 0.0 | 3.8 |
| Recurring chrome (frame, header, footer) | 0.8 | 0.0 | 1.7 |

Decks passing the spec’s “one family, one radius, one stroke, one shadow”:

| Rule as written | Reference | Ours |
|---|---|---|
| One radius kind | 10 / 20 | 10 / 20 |
| One stroke width | 9 / 20 | 20 / 20 (we almost never stroke) |
| One shadow style | 20 / 20 | 20 / 20 (neither set uses shadows) |
| One shape family | **1 / 20** | **2 / 20** |

**Gap.** Cohesion in Canva is **recurring chrome and a short palette**, not a single shape family. Nineteen of twenty reference decks mix rules with geometry and often with illustration. Luxury Vacation Homes is a dashed rounded frame plus numbered circles on every page — that is cohesion. Our decks have nothing to repeat, so recurring-motif is zero, which looks “cohesive” and reads as empty.

Catalog diversity on the 20 generated decks is already over the 25% cap: **Playfair Display 40%**, cover style `split` 40%, ground mode `meshGradient` 55%.

## 10. Dimension 8 — Deliberate imperfection

| Measure (mean per deck, range) | Reference (20) | Ours (20) | App library (14) |
|---|---|---|---|
| Slides with at least one imperfection | 80% (27–100%) | 36% (0–100%) | 64% |
| Slides with two or more | 50% (5–100%) | 2% (0–40%) | 48% |
| Imperfections per slide | 1.85 (0.53–4.88) | 0.38 (0.00–1.40) | 1.27 |

Pooled, share of slides: reference overlap 52%, organic 45%, asymmetric 33%, bleed 30%, tilt 9%, handmade 4%. Ours: asymmetric 32%, handmade 4%, overlap 1%.

**Gap.** Canva’s “designed” feel is mostly **overlap + organic silhouette + bleed**, stacked. Ours only have the leftover of an asymmetric title column. Anti-thinness (every slide has a non-text, non-image visual): **9 / 20** reference, **0 / 20** ours. That gate is the right problem statement.

## 11. Spec targets vs what Canva actually does

Pass rates of the spec’s measurable targets, applied with the same rules to both sets. A target that the reference set itself fails should not be a hard gate without calibration.

| Target (spec wording) | Reference 20 | Ours 20 | Read |
|---|---|---|---|
| Layered depth: ≥2 layers every slide, ≥1 slide with 3+ | 20 / 20 | 20 / 20 | Too easy. Ours pass by painting a full-slide wash. |
| Decorative density: mean ≥4 per content slide **and** ≤1 per title slide | **0 / 20** | 2 / 20 | Title cap is backwards. Content ≥4 alone: 9 / 20 vs 2 / 20. |
| ≥4 molecule types; no type on >40% of slides | 11 / 20 | 5 / 20 | Keep, but measure share of **slides**, and also cap instance mix. |
| ≥60% of image-bearing slides treated | 7 / 19 | 3 / 19 | Above the reference (45%). Use Layer 5’s 40% plain cap instead. |
| ≥1 typographic-play element per deck | 14 / 20 | 11 / 20 | Too easy. Raise to a per-slide average. |
| One corner radius | 10 / 20 | 10 / 20 | Canva mixes sharp photos with rounded cards. Allow two. |
| One stroke weight | 9 / 20 | 20 / 20 | Same. Allow a hairline and a display stroke. |
| One shadow style | 20 / 20 | 20 / 20 | Vacuously true; neither set uses shadows. |
| One shape family, never mixed | **1 / 20** | 2 / 20 | Not how Canva works. See proposal. |
| Exactly one slide breaks the grid | **3 / 20** | 0 / 20 | At least one: 18 / 20 vs 0 / 20. Use a range. |
| Anti-thinness | 9 / 20 | **0 / 20** | Keep as a hard gate. This is the emptiness reviewers see. |

### Proposed spec changes (waiting on approval)

Do not encode the original numbers as hard gates until these are accepted or rejected. Each change is the smallest edit that matches the reference measurements without lowering ambition below what Canva actually does.

1. **Background: one primary system per deck.** Local color blocks, photo splits, scrims and glows may be added per slide. Drop the soft gate that flags “only one system” as under-use. Keep “do not mix two *primary* systems” (no half-the-deck mesh and half-the-deck photographic).
2. **Bounds vs bleed.** Hard gate forbids text from leaving the canvas. Decorative shapes and images **may** overflow by up to 20% of the relevant side. `break_grid` uses that allowance. Text still cannot leave.
3. **Decoration vs text.** Free decoration may not cover a glyph. Purpose-tagged **emphasis** (highlight rectangle, underline, offset word-mark) may overlap its own text. Contrast of the text against the effective background stays AA.
4. **Decorative density.** Mean ≥3 decorative elements per content slide (reference median is 3), and ≥40% of content slides have ≥4. Cover and title slides: 0–8, not ≤1. The original ≤1 would reject every designed Canva cover we measured.
5. **Image treatment.** ≥40% of image-bearing slides use a treatment other than plain rectangle (matches Layer 5’s “never more than 40% plain full-bleed”). 60% is above the reference.
6. **Typographic play.** At least one play feature on ≥30% of slides (reference 43%, ours 34% is already close on *presence* but not on *kinds*). Require ≥3 distinct play kinds per deck.
7. **Shape family.** One **primary** family from the six, plus editorial rules (lines, rules, numbered markers) which appear in 45% of Canva slides regardless of family. Mixing blob + grid in one deck stays forbidden.
8. **Surprise.** 1–3 slides (about 10–25% of the deck) use `break_grid`. “Exactly one” fails 17 / 20 Canva decks.
9. **Radius / stroke.** At most two radii (e.g. sharp photos, rounded cards) and at most two stroke weights. Shadows, when used, one style.
10. **Hard gate “no molecule on >40% of slides”** stays. Add a soft gate: no molecule **instance mix** above 40% (this is the card-grid tell).
11. **Anti-thinness** stays hard. Clarify: a full-slide noise overlay does **not** count as the required non-text, non-image visual. A card, rule, badge, icon, blob or treated image does.

## 12. Stored catalog and library (extra)

Stored 35 (28 discarded, 7 candidate, 0 ship):

- Discarded decks are slightly richer than candidates (3.2 vs 1.1 decorative elements per content slide, 22% vs 7% overlap). Reviewers are already discarding the thinner output; the current taste loop has 28 reviews and no ships, so it cannot yet pull the generator toward Canva.
- Stored overlap (19%) and decoration (2.8) sit between “ours now” and the app library. Older hand-tuned library JSON is the ceiling of the schema.

App library 14: decoration 6.7 / content slide, overlap 55%, bleed 24%, molecule types 6.1. This is the look we can already render. Generation should aim here first, then past it once rotation, masks and outlines exist in the schema.

## 13. What to build first (once this audit is accepted)

In spec order, but with effort proportional to the measured gap:

1. Decoration layer (rules, geometry, icons, edge-anchored placement). Largest gap.
2. Component variety beyond cards (badges, pills, icon+label, captioned photo, stat, highlight).
3. Image treatments and more image slots per deck.
4. Composition: overlap, bleed, tilt, `break_grid`; kill cross-deck occupancy reuse.
5. Typographic play on body slides (highlight, mixed weight, oversized numerals, one rotated label).
6. Design language object so the above stay cohesive, with the calibrated rules in §11 not the original absolute caps.

Do not start deliverable 2 until this audit — and the proposed spec edits — are reviewed.

## 14. How to reproduce

```
# one-time: download the 20 PPTX files (gitignored)
node services/templatePipeline/audit/fetchReference.js

# optional: 20 fresh generator decks (already checked in under samples/ours)
node services/templatePipeline/audit/sampleOurs.js 20

node services/templatePipeline/audit/runAudit.js
```

Outputs `services/templatePipeline/audit/results.json`. Contact sheets used for spot checks are in `.audit-cache/renders/` (gitignored).
