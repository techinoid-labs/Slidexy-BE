# Pipeline merge — Phase 4c runtime

Offline kit + brief/compose, then one online proof (2 text-model calls). Vision off. No PPTX in compose. No admin default change. Pixel row counter from 4b retired; LO lines from `pdftotext -bbox`.

---

## 0. Full-bleed text loss

### Pre-fix deck (`proof-cover-full-bleed/deck.json`) — zIndex order

| zIndex | id | type | fill / color | opacity |
| ---: | --- | --- | --- | --- |
| 0 | composer-cover-field | shape | `{color.bg}` | 0.45 |
| 1 | composer-cover-kicker | text | `{color.muted}` | — |
| 2 | composer-cover-title | text | `{color.ink}` | — |
| 3 | composer-cover-body | text | `{color.muted}` | — |
| 4 | composer-cover-photo | image | photo | — |

(+ signature frame shapes at z=40 from parametric.)

### PPTX child order (`ppt/slides/slide1.xml` after rebuild)

After the kit fix, spTree order (z-sorted by catalog): **`p:pic` first**, then field/text/`p:sp` shapes — photo at z=1 under overlay (z=2) and text (z=3).

### (a) catalog.js add order

`flattenElements` **sorts by zIndex** before `placeElement` / `addText` / `addShape` / `addPicture`:

```229:241:services/templatePipeline/catalog.js
function flattenElements(elements) {
  const list = [];
  (elements || []).forEach((element) => {
    ...
    list.push({ element, rotate: 0, z: Number(element.zIndex) || 0 });
    ...
  });
  list.sort((a, b) => a.z - b.z);
  return list;
}
```

Pictures are **not** forced after shapes; order follows `zIndex`. **No catalog.js edit.** Seed path unchanged (no before/after XML diff required).

### (b) Photo-darkening overlay

Kit emits `composer-cover-field` as a **shape** with `opacity: 0.45` and fill `{color.ink}` (after fix). In XML it is a `p:sp` with `<a:alpha val="45000"/>` on the fill, **after** `p:pic` and **before** title/body text.

### (c) Title color vs photo luminance

- Pre-fix title run color: `{color.ink}` → `#1C1916` (dark).
- Photo mean luminance under title box (72,160)–(672,360) on `landscape-01.jpg`: **~131.6**.
- Dark ink on mid-luminance photo + photo at **highest z** → invisible text.

### Cause

**(b) + (c)** — overlay/z and text color wrong in the measured kit (photo z=4 over text; dark ink). Not (a).

### Fix (kit / compileKit only)

`cover.html` full-bleed: photo `z-index:1`, field ink@0.45 `z-index:2`, text `z-index:3` + `color: var(--color-on-accent)`. `compileKit` records `cssZ` and maps light text to `{color.onAccent}`.

### Re-proof

`pdftotext` on `proof-cover-full-bleed/deck.pdf` includes **“Apex Payroll Solutions”**.

PNG paths:

- `docs/template-pipeline/composer/proof-cover-full-bleed/chrome.png`
- `docs/template-pipeline/composer/proof-cover-full-bleed/slide-01.png`
- `docs/template-pipeline/composer/proof-cover-full-bleed/lo-slide.png`

---

## 1. Line tables (Chrome measure / node-canvas / LibreOffice)

Helpers: `composer/loLines.js` (`pdftotext -bbox`, 4px baseline buckets), `composer/canvasLines.js` (`textLineWidths` / `wrapRuns` behind `textWasClipped`).

After recompile + proofs (corp-calibri), proof copy applied, metrics synced:

| Variant | role | Chrome measure | node-canvas | LibreOffice |
| --- | --- | ---: | ---: | ---: |
| word | title | 1 | 1 | 1 |
| word | body | 2 | 2 | 2 |
| split | title | 2 | 2 | 2 |
| split | body | 3 | 3 | 3 |
| full-bleed | title | 2 | 2 | 2 |
| full-bleed | body | 3 | 3 | 3 |

Target met: **node-canvas lines == Chrome measure** for every element in the table.

---

## 2. Why Chrome wrapped less (width / slack)

Checked in order:

### a. Emitted width = layout content box

Measurer uses `getBoundingClientRect` minus padding (`contentWidth`), not Range text width. Evidence: compiled full-bleed title `width` = `layoutWidth` = **600** while `textMeasure.width` (Range sum) = **362.02**.

### b. Padding → content box

`x/y` offset by `padL/padT`; width/height are content box. No slot padding left in the text area.

### c. Same-string Chrome Range vs node-canvas

Compile evidence (cover-word body, Calibri): Range **956.53**, canvas **962.84**, ratio **1.0066** (< 1%). **WIDTH_SLACK stays 1** (no `ceil10` bump).

### d. Title weight + bold face

Compiled title `fontWeight` **700**. `fonts.js` registers `calibrib.ttf` for Calibri bold (`systemFontPath('Calibri', 700)` → `C:\WINDOWS\Fonts\calibrib.ttf`).

### Slack

- LibreOffice never exceeded Chrome in the §1 table → **`HEIGHT_SLACK = 1.1`** (4b’s 1.5 removed).
- **`WIDTH_SLACK = 1`**.
- Split title: LO and Chrome both 2 lines for the proof title (not “LO wraps at 1 Chrome line”); no column widen.

---

## 3. Composer-local hard fails

`composer/hardFails.js`, applied after `analyzeDeck` in compose + proofs:

| Fail | When |
| --- | --- |
| wrap mismatch | node-canvas lines > `textMeasure.lines` |
| text under picture | text box overlaps a picture with higher `zIndex` |
| missing image | `url` set and file absent under `generated-templates/` |

Recorded on the slide `reasons` / deck `failures` beside geometry.

---

## 4. Incidental `ppt/media/` asset

Phase 4b counted **2** media entries for split/full-bleed. Re-unzip shows **only** `ppt/media/image-1-1.jpg` (the cover photo). The second “entry” was the zip local-header **`ppt/media/` directory** miscounted by the lightweight inspector — not a second image file.

**Real media file:** `image-1-1.jpg`, added by `catalog.js` `addPicture` → `slide.addImage({ path: file, ... })` when resolving `photos/composer/proof/landscape-01.jpg`.

Word variant: no files under `ppt/media/`.

---

## 5–6. Kit components + compile

### Authors (PPTX-safe)

- `design-system/components/split-copy.html` — photo-left / photo-right; title 48, body 160, bullet×3 (80); ids `composer-split-copy-bullet-1`…
- `design-system/components/stat-row.html` — three-up / two-up; title, stat×3/2, label×3/2, body; no photo
- `design-system/components/close.html` — plain / photo; title, body, kicker optional; photo only on photo variant

### Compile

**36** JSON files under `app-library/native/composer/` (4 components × variants × 4 fontPairs).

No compiled JSON references an image file; photo slots keep `"url": ""` until runtime.

### Manifest

Full regenerated `design-system/manifest.json` (version 1): components cover / split-copy / stat-row / close with roles, variants, slots, photoSlots; fontPairs `corp-calibri`, `corp-arial`, `editorial`, `modern`; paletteBuckets / densities / coverPatterns / signatures as in compileKit.

### Stat-row three-up proof

`proofCover.js --component stat-row --variant three-up`. Geometry **pass**, reasons **`[]`**.

(Earlier accent-colored stats failed `["contrast"]`; stats switched to ink. Title/body do not overlap — text-overlap rule evaluated, did not fire.)

---

## 7. `brief.js`

`designBrief(prompt, direction, manifest, nonce, deps)` → `askModel` (OpenRouter `google/gemini-2.5-flash-lite`, 402→Gemini). Prompt requests plan JSON (6–8 slides, kit roles, COPY_RULES).

`validateBrief` → `{ brief, fallbacks }`; invalid enums/components/variants replaced via FNV `pickIndex(prompt+nonce+field)`; over-length copy clamped with `clampCopy`.

---

## 8. `composeRuntime.js`

Order: nonce → inventDirection → designBrief → validate → load compiled JSON × fontPair → palette from anchors → assemble schemaVersion 2 → apply copy by id → safeRm + Pexels into `generated-templates/photos/composer/<slug>/` → `applyParametric({ skipCover: true })` → sync textMeasure lines → write `deck.json` → renderDeck → analyzeDeck vision false → composer hard fails → `writeQa(..., "manual")` → `replacements.json`. **No PPTX.** Out refuses `docs/template-pipeline/native/`. Returns GENERATE_TEMPLATE_FIELDS shape with `layoutId: "composer"`, `vibe` = bucket.

---

## 9. `pipeline.js`

`mode: "composer"` → `compose`. `auto` / `pinned` unchanged.

---

## 10. `composer.test.js` (offline)

Stubs: inventDirection fixture, designBrief with invalid component + over-long body, searchPexels one url, downloadPhoto copies `proof/landscape-01.jpg`.

Asserted: fallback for invalid component, body clamped, photos filled, `qa.mode === "manual"`, nonce in replacements, same nonce → same fallbacks, geometry reported; download no-op → **missing-image** hard fail.

`composer.test passed`

---

## 11. Online proof — `proof-payroll`

Prompt: `"A corporate payroll company"`, nonce `"4c-proof-1"`, out `docs/template-pipeline/composer/proof-payroll`.

**Text-model calls: 2** (`inventDirection` + `designBrief`). No 402.

### Direction

- brand: **SwiftPay Solutions**
- industry: **Payroll**
- mood: Clean and corporate
- keywords / Pexels query: `office laptop document` (landscape, 5 hits)

### Brief (raw shape)

```json
{
  "plan": [
    { "role": "Cover", "component": "cover", "variant": "split" },
    { "role": "About", "component": "split-copy", "variant": "photo-right" },
    { "role": "Problem", "component": "split-copy", "variant": "photo-left" },
    { "role": "Solution", "component": "split-copy", "variant": "photo-right" },
    { "role": "Proof", "component": "stat-row", "variant": "three-up" },
    { "role": "Close", "component": "close", "variant": "plain" }
  ],
  "paletteBucket": "light-neutral",
  "fontPair": "corp-calibri",
  "density": "balanced",
  "coverPattern": "split",
  "signature": "frame",
  "mood": "Clean and corporate",
  "copy": { "...": "(Cover/About/Problem/Solution/Proof/Close blocks in replacements.json)" }
}
```

### Fallbacks

`[]` (all values valid).

### Bucket / fontPair

`light-neutral` / `corp-calibri`

### Per-slide geometry (analyzeDeck + composer fails)

| slide | pass | rule |
| ---: | --- | --- |
| 1 | pass | `[]` |
| 2 | fail | `text overlap` |
| 3 | pass | `[]` |
| 4 | fail | `text overlap` |
| 5 | pass | `[]` |
| 6 | pass | `[]` |

### deck.qa

```json
{
  "score": 67,
  "passed": 4,
  "total": 6,
  "failures": ["text overlap on slide 2", "text overlap on slide 4"],
  "attempt": 1,
  "mode": "manual"
}
```

### Pexels queries

`[{ "query": "office laptop document", "orientation": "landscape", "hits": 5 }]`

### PNG paths (slide order)

1. `docs/template-pipeline/composer/proof-payroll/slide-01.png`
2. `docs/template-pipeline/composer/proof-payroll/slide-02.png`
3. `docs/template-pipeline/composer/proof-payroll/slide-03.png`
4. `docs/template-pipeline/composer/proof-payroll/slide-04.png`
5. `docs/template-pipeline/composer/proof-payroll/slide-05.png`
6. `docs/template-pipeline/composer/proof-payroll/slide-06.png`

Pixels not judged.

---

## 12. Characterization tests

```
qaLoop test passed
semanticFilter test passed
chooseLayout test passed
generateTemplateShape test passed
dead code test passed
manualQa test passed
safeRm test passed
composer.test passed
```

No file named `assembleDeck.js` or `composeDeck.js`.

---

Stop. Do not start Phase 4d.
