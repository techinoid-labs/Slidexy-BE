# Pipeline merge — Phase 4d fit and metrics

Offline capacity compile, fit-at-runtime, replay, reported aesthetics, refinement stubs; one online proof. Vision off. No PPTX in compose.

---

## 1. Slides 2 and 4 overlap (proof-payroll)

### `syncTextMetrics` (current)

```115:125:services/templatePipeline/composer/composeRuntime.js
function syncTextMetrics(deck) {
  (deck.layoutSequence || []).forEach((layoutId) => {
    const layout = deck.layouts[layoutId];
    (layout && layout.elements || []).forEach((el) => {
      if (!el || el.type !== "text") return;
      const canvas = countCanvasLines(el, deck.tokens);
      const lines = Math.max(1, canvas.lines || 1);
      el.textMeasure = Object.assign({}, el.textMeasure || {}, { lines });
    });
  });
}
```

**Does not change element height** (only `textMeasure.lines`). Runtime compose now uses `fitDeck` instead; boxes never grow.

The 4c online deck still shows the damage from an **earlier** sync that grew heights: title `67.76 → 135.52` on slides 2 and 4 (2 canvas lines × 56 × 1.1 × 1.1). Body and bullets stayed near compiled one-line heights.

| slide | element | height before (compiled 4c) | height after (in proof-payroll) |
| ---: | --- | ---: | ---: |
| 2 | body | 65.34 | 27.72 (parametric shrink; 1 line) |
| 2 | bullet-1..3 | 28.6 | 26.7 |
| 3 | body | 65.34 | 27.72 |
| 3 | bullet-1..3 | 28.6 | 26.7 |
| 4 | body | 65.34 | 27.72 |
| 4 | bullet-1..3 | 28.6 | 26.7 |
| 2 / 4 | title | **67.76** | **135.52** |
| 3 | title | 67.76 | 67.76 |

### Overlapping pair

On slides **2** and **4**: `composer-split-copy-title` × `composer-split-copy-body`.

- Title box ends at y≈231.5; body starts at y=220.
- Overlap area **8064** px² ≈ **41.6%** of the smaller box (body).

### Character counts

| slide | title | body | bullet-1 | bullet-2 | bullet-3 |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 2 About | 36 | 49 | 42 (placeholder) | 43 | 42 |
| 3 Problem | 18 | 60 | 42 | 43 | 42 |
| 4 Solution | 32 | 50 | 42 | 43 | 42 |

Compiled split-copy fixture (4c short HTML): title **11**, body **85**, bullets **42 / 43 / 42**.

### Why photo-left (slide 3) passed

**Copy length only.** Title “The Payroll Puzzle” (18 chars) stayed **1 line** → height 67.76 → no overlap with body. Layout width is **700** for both photo-left and photo-right.

---

## 2. Compile at capacity

`compileKit` fills every text slot with `capacityText(maxChars)` (word-shaped, avg 5–6 letters, no word >12, exact length) before Chromium measure. Records `textMeasure.{ lines, fontPair, capacityChars, charsPerLine }`.

`manifest.typeScale` (sorted unique from compiled font sizes):

`[18, 20, 22, 24, 28, 48, 56, 72, 96, 120]`

Recompiled **36** JSONs.

### Heights corp-calibri: 4c → capacity (body + repeated slots)

| component × variant | slot | 4c h | 4d h | lines |
| --- | --- | ---: | ---: | ---: |
| cover × word | title | 138.6 | 277.2 | 2 |
| | body | 83.16 | 124.74 | 3 |
| cover × split | title | 110.88 | 332.64 | 3 |
| | body | 83.16 | 124.74 | 3 |
| cover × full-bleed | title | 110.88 | 443.52 | 4 |
| | body | 83.16 | 166.32 | 4 |
| split-copy × photo-left/right | title | 67.76 | 135.52 | 2 |
| | body | 65.34 | 98.01 | 3 |
| | bullet-1..3 | 28.6 | 28.6 | 1 |
| stat-row × three-up/two-up | title | 58.08 | 58.08 | 1 |
| | stat-* | 79.2 | 79.2 | 1 |
| | label-* | 28.6 | 28.6 | 1 |
| | body | 32.67 | 32.67 | 1 |
| close × plain/photo | title | 83.16 | 166.32 | 2 |
| | body | 35.64 | 35.64 | 1 |
| | kicker | 23.76 | 23.76 | 1 |

---

## 3. Capacity fit adjustment

`stat-row` at `maxChars: 12` wrapped stats to 2 lines → label overlap (`text overlap` in one-slide geometry).

**Change:** `stat` maxChars **12 → 6** (`data-max-chars="6"` on stat slots in `stat-row.html` + COMPONENT_SPECS). Recompiled. Geometry pass. No element moves.

---

## 4. Runtime fit (no box growth)

After copy: if node-canvas lines > `textMeasure.lines` (capacity), step `fontSize` down one step on `manifest.typeScale`, recompute; if still over, `clampCopy` to `charsPerLine × lines`. Fits recorded in `replacements.json` as `{ slide, elementId, action: "fontStep"|"clamp", from, to }`.

Wrap mismatch remains the hard fail after fitting.

---

## 5. `--replay <dir>`

`compose({ replay })` reads that dir’s `replacements.json` for direction, brief, nonce, bucket, fontPair; reuses `generated-templates/photos/composer/<slug>/`; skips invent/brief/Pexels.

`composer.test.js` stubs `global.fetch` to throw during replay — **zero network**.

---

## 6. Replay `proof-payroll` → `proof-payroll-4d`

| slide | geometry / hard fails |
| ---: | --- |
| 1–6 | **pass** `[]` |

- **fits:** `[]` (capacity boxes already tall enough; no fontStep/clamp)
- **deck.qa:** score **100**, passed **6/6**, mode `manual`, attempt 1
- Expected 6/6 met; no clamp needed on 2/4

---

## 7–8. Aesthetic metrics (reported only)

`composer/aesthetics.js`: edge alignment (8px), margin, whitespace ratio, min text box, typeScale ok, text density. Attached as `analysis.aesthetic` per slide + deck summary. **No effect on score.**

### proof-payroll-4d

| slide | edges L/R/T | margin L/R/T/B | whitespace | minFont | minArea | typeScaleOk | chars |
| ---: | --- | --- | ---: | ---: | ---: | --- | ---: |
| 1 | 3/3/4 | 0/0/0/0 | 0.290 | 18 | 18058 | yes | 165 |
| 2 | 2/2/6 | 72/0/0/0 | 0.392 | 18.67 | 20020 | no | 132 |
| 3 | 2/2/6 | 0/100/0/0 | 0.392 | 18.67 | 20020 | no | 126 |
| 4 | 2/2/6 | 72/0/0/0 | 0.392 | 18.67 | 20020 | no | 138 |
| 5 | 3/4/4 | 72/72/72/147 | 0.806 | 20 | 11440 | yes | 129 |
| 6 | 1/3/3 | 72/328/280/344 | 0.818 | 18 | 23760 | yes | 109 |

Deck summary: avgWhitespace **0.515**, avgTextDensity **133**, typeScaleAllOk **false**.

### Cover proofs (1 slide each)

| proof | whitespace | textDensity | typeScaleOk | notes |
| --- | ---: | ---: | --- | --- |
| proof-cover-word | 0.780 | 156 | yes | flat type-led cover |
| proof-cover-split | 0.350 | 156 | yes | photo present |
| proof-cover-full-bleed | 0.548 | 156 | yes | photo + scrim |

### vs human “worst three” (4c payroll)

| Issue | Proposed metric / threshold (not enabled) |
| --- | --- |
| Unreplaced placeholders (“First bullet…”) | **textDensity** alone cannot detect stock strings. Need a **manual check** (or string-equality to kit placeholders — not a geometric aesthetic). |
| Massive vertical gaps / floating text | **margin.top** variance or inter-box gap: e.g. flag if gap between stacked text boxes > **120px** while both are content. Deterministic candidate: max vertical gap between consecutive text boxes on a column. |
| Flat beige cover, no imagery | **whitespaceRatio > 0.70** on a Cover slide **and** zero picture elements — would have flagged proof-cover-word (0.78) and a photo-less cover; split cover at 0.35 would pass. |

No threshold enabled.

---

## 9. Refinement (stubbed)

On hard fails after fit: one `refineBrief` call; only failing roles may change component/variant; bucket/font/density and passing-role copy frozen. Attempt 1 copied to `<out>/attempt-1/`; attempt 2 is out dir; higher score returned (attempt 2 on tie). Cap **3** text-model calls.

`composer.test.js`: refinement case → attempt-1 kept, 3 stub calls; happy path → 2 calls; replay fetch throw.

---

## 10. Online proof — `proof-payroll-4d-online`

Prompt `"A corporate payroll company"`, nonce `"4d-proof-1"`. No 402.

| Field | Value |
| --- | --- |
| brand / industry | SwiftPay Solutions / Payroll |
| bucket / fontPair | light-neutral / corp-calibri |
| text-model calls | **2** (inventDirection + designBrief) |
| refinement | **did not fire** (no hard fails after fit) |
| fits | `[]` |
| fallbacks | `copy.Close.body` clamped 97→80 |
| qa | score **100**, 6/6, mode manual, attempt 1 |

**Plan**

| role | component | variant |
| --- | --- | --- |
| Cover | cover | split |
| About | split-copy | photo-left |
| Problem | split-copy | photo-right |
| Solution | split-copy | photo-left |
| Proof | stat-row | three-up |
| Close | close | plain |

**Per-slide:** all pass, reasons `[]`.

**Aesthetic summary:** avgWhitespace 0.515, avgTextDensity 144, typeScaleAllOk false, minFontSeen 18.

**Pexels:** `office laptop graphs` (landscape, 5 hits).

**PNGs**

1. `docs/template-pipeline/composer/proof-payroll-4d-online/slide-01.png`
2. `docs/template-pipeline/composer/proof-payroll-4d-online/slide-02.png`
3. `docs/template-pipeline/composer/proof-payroll-4d-online/slide-03.png`
4. `docs/template-pipeline/composer/proof-payroll-4d-online/slide-04.png`
5. `docs/template-pipeline/composer/proof-payroll-4d-online/slide-05.png`
6. `docs/template-pipeline/composer/proof-payroll-4d-online/slide-06.png`

Pixels not judged.

---

## 11. Characterization tests

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

Stop. Do not start Phase 4e.
