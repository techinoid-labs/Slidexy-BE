# Pipeline merge — Phase 4d2 collapse

Empty compiled spans, stack collapse, parametric density/type skips, named brief slots, unfilled-slot + photo-under-shape hard fails. Vision off. Online only in step 13.

---

## 1. Placeholder leak (diagnose)

### Apply-copy (as of 4d-online)

Prior 4d `applySlotCopy` (replaced this phase) mapped id suffixes to brief fields, including plural arrays:

```js
if (slot === "title") text = block.title;
else if (slot === "body") text = block.body;
else if (slot === "kicker") text = block.kicker != null ? String(block.kicker).toUpperCase() : null;
else if (/^bullet-(\d+)$/.test(slot)) {
  const list = Array.isArray(block.bullets) ? block.bullets : block.bullet;
  text = Array.isArray(list) ? list[idx] : null;
}
// …same pattern for stats / labels…
if (text == null) return; // leaves compiled capacity span unchanged
```

When a key (or plural entry) was absent, apply-copy returned early and **kept the capacity/HTML filler** in the span.

### Brief vs manifest (`proof-payroll-4d-online/replacements.json`)

| role | brief copy keys | manifest slot keys |
| --- | --- | --- |
| Cover | title, body, kicker | title, body, kicker |
| About | title, body, **bullets** (array) | title, body, **bullet-1..3** |
| Problem | title, body, **bullets** | title, body, **bullet-1..3** |
| Solution | title, body, **bullets** | title, body, **bullet-1..3** |
| Proof | title, **stats**, **labels**, body | title, **stat-1..3**, **label-1..3**, body |
| Close | title, body (**no kicker**) | title, body, kicker (optional) |

The 4d brief prompt did **not** name repeated slots (`bullet-1..3`, `stat-1..3`, `label-1..3`); the model emitted plural arrays. Close omitted kicker → capacity text stayed.

### Grep `proof-payroll-4d-online/deck.json`

| slide | element | hit |
| ---: | --- | --- |
| 6 | `composer-close-kicker` | `WORDS ABOUT THEME VALUEX` (capacity leak) |

No hits for `bullet point`, `under eighty`, `placeholder`, `Lorem`, `Stat`, `Label` in that deck (About/Problem/Solution bullets were filled via plural arrays). Human “placeholder on 3/4/5” aligns with capacity/HTML stock strings in earlier proofs; the durable leak in this artifact is the Close kicker.

---

## 2. Gaps (slides 2–4 of `proof-payroll-4d-online`)

Compiled stack target: `split-copy.html` `[data-stack="copy"]` → **flex `gap: 28px`**.

| slide | element | height | canvas lines | gap to next |
| ---: | --- | ---: | ---: | ---: |
| 2 | title | 135.52 | 1 | **−11.52** (overlap with body) |
| 2 | body | 98.01 | 2 | **101.99** |
| 2 | bullet-1 | 28.6 | 1 | 31.4 |
| 2 | bullet-2 | 28.6 | 1 | 31.4 |
| 2 | bullet-3 | 28.6 | 1 | — |
| 3 | title | 135.52 | 1 | −11.52 |
| 3 | body | 98.01 | 1 | **101.99** |
| 3 | bullet-1..3 | 28.6 | 1 | 31.4 / 31.4 / — |
| 4 | title | 135.52 | 1 | −11.52 |
| 4 | body | 98.01 | 1 | **101.99** |
| 4 | bullet-1..3 | 28.6 | 1 | 31.4 / 31.4 / — |

Capacity boxes + no collapse left body→bullet gaps ≈102px vs compiled 28px. Title still overlapped body from earlier height growth.

---

## 3. Cover (slide 1 of `proof-payroll-4d-online`)

Plan: Cover × **split**. Elements by zIndex:

| z | id | type | url / fill | opacity |
| ---: | --- | --- | --- | ---: |
| 0 | composer-cover-field | shape | `{color.onAccent}` | 1 |
| 1 | composer-cover-accent | shape | `{color.accent}` | 1 |
| 2 | composer-cover-kicker | text | — | — |
| 3 | signature-rail-slide-1 | shape | `#8a8175` | — |
| 3 | composer-cover-title | text | — | — |
| 4 | composer-cover-body | text | — | — |
| 5 | composer-cover-photo | image | `photos/composer/swiftpay-solutions/photo-01.jpg` | — |

**Photo has a url.** Nothing sits above it (highest z). Right half shows the landscape; left is the beige field by design for split. Human “flat beige / no photo” does not match this artifact’s deck (photo assigned); Close (plain) is photo-less beige. Step 9 still orders cover photo slots first and records reuse when hits &lt; slots.

---

## 4. Parametric (font shrink)

`applyDensity` → `scaleSlide` writes geometry including height:

```443:446:services/templatePipeline/parametric.js
    item.el.x = round(item.x);
    item.el.y = round(item.y);
    item.el.width = round(Math.max(12, item.w));
    item.el.height = round(Math.max(12, item.h));
```

`applyTypeContrast` shrinks non-title sizes and may grow titles:

```557:570:services/templatePipeline/parametric.js
    const shrunk = Math.max(13, round(titleSize / 3));
    texts.forEach((node) => {
      const size = readSize(node);
      if (size < titleCut) writeStyle(node, { fontSize: Math.min(size, shrunk) });
    });
    ...
      writeStyle(node, { fontSize: grown });
      growBox(node, grown);
```

On slide 2 of 4d-online: titleSize 56 → `shrunk = round(56/3) = 18.67` for body/bullets. Height **65.34 → 27.72** = `1 × 1.35 × 18.67 × 1.1` when a prior sync recomputed height from the shrunk font (proof-payroll / 4c path). These run inside `applyParametric` **after** `skipCover` (density → cover → signature → typeContrast → auditGeometry).

---

## 5. `parametric.js` skips

Diff (guards only; default false):

```diff
 function applyParametric(deck, options) {
   ...
-  const density = applyDensity(deck, options.density || "balanced");
+  const density = options.skipDensity
+    ? { density: "skipped", marginFactor: 1, lineHeightFactor: 1, reverted: [], revertReasons: [], sample: null }
+    : applyDensity(deck, options.density || "balanced");
   const title = coverTitle(options.title, prompt);
   const cover = options.skipCover
     ? { id: "skipped", name: "Skipped" }
     : replaceCover(...);
   const signature = injectSignature(deck, prompt, palette);
-  const type = applyTypeContrast(deck, fonts, prompt);
+  const type = options.skipTypeContrast
+    ? { displayWeight: fonts.displayWeight, bodyWeight: 400, shortfalls: [] }
+    : applyTypeContrast(deck, fonts, prompt);
   const geometry = auditGeometry(deck);
```

**Seed proof:** `applyParametric` on a deep copy of `docs/template-pipeline/merge/phase-3-payroll/deck.json` without flags, `title: stored.coverTitle`, `seedTokens: deck.tokens` → **`parametric equal true`** vs stored `deck.parametric`.

Composer calls `applyParametric({ skipCover: true, skipDensity: true, skipTypeContrast: true })`.

---

## 6. `compileKit` empty spans + stacks

- Spans emit `[{ text: "" }]`; `slot: { dataRole, maxChars, charsPerLine, capacityLines }` on each text slot.
- HTML `data-stack` on cover-copy / copy / close-copy / main + stat cells; stacks recorded with `order`, `gap`, `box`, `align`, plus **flex block** members for intervening non-role children (stat-grid).
- Recompiled **36** JSONs. Grep for readable slot text / placeholder patterns → **nonempty_slot_spans = 0**.

---

## 7. `brief.js` named slots

- `expandSlotKeys` / `copyPromptShape` name every slot per role including `bullet-1..3`, `stat-1..3`, `label-1..3`, with optionals marked.
- Validator leaves missing required slots as `""` (hard fail later); only **kicker** may get generated fallback `"NEXT"`.
- No inventing bullets/stats/labels/body/title.

---

## 8. `composeRuntime` fit → collapse → hard fails

Order after copy, before `renderDeck`:

1. **fit** — one `fontStep` on `manifest.typeScale`, then clamp; recorded in `fits`.
2. **collapse** — per stack: text height = `lines × lineHeight × fontSize × HEIGHT_SLACK`; re-lay with compiled gap; align within stack box; non-text/blocks keep height; nested elements move with flex blocks; recorded in `collapses`.
3. After `renderDeck`: composer hard fails — **unfilled slot**, wrap mismatch, text under picture, **photo under shape** (&gt;60% opaque non-decoration shape above image), missing image.

---

## 9. Cover photo assignment

Photo slots sorted **cover first**. Landscapes assigned when hits allow; if fewer hits than slots, earlier files are reused and `photoQueries[0].reuse` is recorded.

---

## 10. Aesthetics (reported only)

Per slide: **stackGap** (max consecutive member gap − compiled gap) and **coverVisualMass** (picture + accent-shape area share on Cover). No score effect.

---

## 11. `composer.test.js`

- Unfilled slot fires when brief missing `bullet-2`.
- Collapse shifts bullets up when body is short (`delta ≈ -111.82`).
- Photo under shape fires on fixture.
- Existing happy path / missing-image / replay / refinement assertions still pass.

---

## 12. Replay `proof-payroll-4d-online` → `proof-payroll-4d2`

Zero network. No refinement (replay). Pre-step-7 brief keeps plural arrays → named keys absent → **unfilled slot**.

| slide | geometry / hard fails | typeScaleOk |
| ---: | --- | --- |
| 1 Cover | pass `[]` | true |
| 2 About | **unfilled** bullet-1..3 | true |
| 3 Problem | **unfilled** bullet-1..3 | true |
| 4 Solution | **unfilled** bullet-1..3 | true |
| 5 Proof | **unfilled** stat-1..3, label-1..3 | true |
| 6 Close | pass `[]` | true |

- **fits:** `[]`
- **collapses:** 9 stack records (gaps tightened; bullets shift up)
- **cover photo url:** `photos/composer/swiftpay-solutions/photo-01.jpg`
- **placeholder grep:** empty
- **deck.qa:** score **33**, passed **2/6**, mode `manual`, attempt 1, `typeScaleAllOk: true`
- Unfilled slides: **2, 3, 4, 5** (not refined)

---

## 13. Online — `proof-payroll-4d2-online`

Prompt `"A corporate payroll company"`, nonce `"4d2-proof-1"`. No 402.

| Field | Value |
| --- | --- |
| brand / industry | SwiftPay Solutions / Payroll |
| bucket / fontPair | light-neutral / **corp-arial** |
| text-model calls | **2** (invent + brief) |
| refinement | **did not fire** (no hard fails) |
| fits | `[]` |
| collapses | 9 stacks (cover, 3× copy, 3× stat cells, main, close) |
| fallbacks | Proof.body clamped 129→120; Close.body 114→80 |
| qa | score **100**, 6/6, mode manual, attempt 1 |

**Plan**

| role | component | variant |
| --- | --- | --- |
| Cover | cover | split |
| About | split-copy | photo-right |
| Problem | split-copy | photo-left |
| Solution | split-copy | photo-right |
| Proof | stat-row | three-up |
| Close | close | plain |

**Per-slide**

| slide | pass | hard fails | typeScaleOk | stackGap | coverVisualMass |
| ---: | --- | --- | --- | ---: | ---: |
| 1 | yes | [] | true | 0 | **0.449** |
| 2–6 | yes | [] | true | 0 | null |

**Pexels:** `office laptop document` (landscape, 5 hits).  
**Cover photo:** `photos/composer/swiftpay-solutions/photo-01.jpg`  
**Parametric:** cover/density/typeContrast all `skipped`.  
**Placeholder grep:** empty.

**PNGs**

1. `docs/template-pipeline/composer/proof-payroll-4d2-online/slide-01.png`
2. `docs/template-pipeline/composer/proof-payroll-4d2-online/slide-02.png`
3. `docs/template-pipeline/composer/proof-payroll-4d2-online/slide-03.png`
4. `docs/template-pipeline/composer/proof-payroll-4d2-online/slide-04.png`
5. `docs/template-pipeline/composer/proof-payroll-4d2-online/slide-05.png`
6. `docs/template-pipeline/composer/proof-payroll-4d2-online/slide-06.png`

Pixels not judged.

---

## 14. Characterization tests

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
