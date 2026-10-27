# Pipeline merge — Phase 4f-0 fidelity

PPTX round-trip gate, guarded `lineHeight` / photo crop in `catalog.js`, golden regression. Vision off. Offline. No kit work.

---

## 1. `catalog.js` addText / addPicture (pre-edit) + pptxgenjs 4.0.1

### addText (before)

```js
function addText(slide, element, tokens, rotate) {
  const style = element.textStyle || {};
  const spans = (element.textContent && element.textContent.spans) || [];
  const runs = [];
  spans.forEach((span) => {
    const text = String(span && span.text != null ? span.text : "");
    if (!text) return;
    const weight = span.fontWeight == null ? style.fontWeight : span.fontWeight;
    const spacing = Number(span.letterSpacing != null ? span.letterSpacing : style.letterSpacing) || 0;
    const runOptions = {
      fontFace: fontOf(span.fontFamily || style.fontFamily, tokens),
      fontSize: points(span.fontSize || style.fontSize || 18),
      color: colorOf(span.color || style.color, tokens) || "1A1612",
      bold: Number(weight) >= 600,
    };
    if (spacing) runOptions.charSpacing = points(spacing);
    runs.push({ text, options: runOptions });
  });
  if (!runs.length) return;
  slide.addText(runs, Object.assign(boxOf(element), {
    align: style.textAlign || "left",
    valign: "top",
    margin: 0,
    wrap: true,
    rotate: rotate || 0,
    fontFace: fontOf(style.fontFamily, tokens),
    fontSize: points(style.fontSize || 18),
    color: colorOf(style.color, tokens) || "1A1612",
  }));
}
```

### addPicture (before)

```js
function addPicture(slide, element, content, deckId, rotate) {
  const file = imageFile(deckId, content && content.url);
  if (!file) return;
  const clip = (content && content.clip) || {};
  const box = boxOf(element);
  if (content && content.fit === "contain" && !clip.kind) {
    slide.addImage(Object.assign({ path: file, rotate: rotate || 0 }, box));
    return;
  }
  if (clip.kind === "ellipse") {
    slide.addImage(Object.assign({ path: file, rounding: true, rotate: rotate || 0 }, box, coverSizing(box)));
    return;
  }
  if (clip.kind === "arch" || (clip.kind === "rect" && Number(clip.cornerRadius) > 0)) {
    const png = maskedImage(file, element, clip, content);
    if (!png) return;
    slide.addImage(Object.assign({ data: "image/png;base64," + png.toString("base64"), rotate: rotate || 0 }, box));
    return;
  }
  slide.addImage(Object.assign({ path: file, rotate: rotate || 0 }, box, coverSizing(box)));
}

function coverSizing(box) {
  return { sizing: { type: "cover", x: 0, y: 0, w: box.w, h: box.h } };
}
```

### pptxgenjs `4.0.1` options (from `node_modules/pptxgenjs/types/index.d.ts`)

`TextPropsOptions.lineSpacingMultiple`:

```ts
/**
 * line spacing multiple (percent)
 * - range: 0.0-9.99
 * - PowerPoint: Paragraph > Indents and Spacing > Line Spacing: > "Multiple"
 * @example 1.5 // 1.5X line spacing
 * @since v3.5.0
 */
lineSpacingMultiple?: number
```

`ImageProps.sizing` crop:

```ts
sizing?: {
  type: 'contain' | 'cover' | 'crop'
  w: Coord
  h: Coord
  /** Offset from left to crop image — `crop` only */
  x?: Coord
  /** Offset from top to crop image — `crop` only */
  y?: Coord
}
```

---

## 2. alignX/alignY warnings vs catalog today

The 4e curator warnings (`missing alignX` / `missing alignY`) are **not** emitted by `catalog.js`. They come from `scripts/slideSvg.js` `placement()`:

```411:412:scripts/slideSvg.js
  if (alignX == null) warn(where + ": missing alignX; image anchored to the left of the box");
  if (alignY == null) warn(where + ": missing alignY; image anchored to the top of the box");
```

**catalog.js before this phase:** `coverSizing` always used `type: "cover"` with `x:0,y:0` and the element box size — **centre cover** in pptxgenjs terms (and with matching w/h effectively a stretch). `alignX` / `alignY` on the content were ignored. A photo with `alignX: 0.2` exported the same as centre.

---

## 3. Golden file (before catalog edits)

Created `services/templatePipeline/fixtures/golden/phase-3-payroll/slide{1..10}.xml` by exporting `docs/template-pipeline/merge/phase-3-payroll/deck.json` through `catalog.exportDeckPptx` (pre-edit), unzipping, storing each `ppt/slides/slideN.xml`.

`catalogGolden.test.js` added; first run **green**.

---

## 4. Fidelity diffs + golden result

### addText diff

```diff
-  slide.addText(runs, Object.assign(boxOf(element), {
+  const options = Object.assign(boxOf(element), {
     align: style.textAlign || "left",
     ...
-  }));
+  });
+  const lineHeight = Number(style.lineHeight);
+  if (Number.isFinite(lineHeight) && lineHeight > 0 && lineHeight !== 1) {
+    options.lineSpacingMultiple = lineHeight;
+  }
+  slide.addText(runs, options);
```

### addPicture / coverSizing diff

```diff
-  slide.addImage(Object.assign({ path: file, rotate: rotate || 0 }, box, coverSizing(box)));
+  slide.addImage(Object.assign({ path: file, rotate: rotate || 0 }, box, coverSizing(box, content, file)));

-function coverSizing(box) {
-  return { sizing: { type: "cover", x: 0, y: 0, w: box.w, h: box.h } };
-}
+function coverSizing(box, content, file) {
+  const hasAlign = content && (content.alignX != null || content.alignY != null);
+  if (!hasAlign || !file) {
+    return { sizing: { type: "cover", x: 0, y: 0, w: box.w, h: box.h } };
+  }
+  // cover scale → sizing: { type: "crop", w, h, x: ox, y: oy } + scaled w/h on image
+  ...
+}
```

### Golden after edits

Unstripped `phase-3-payroll` **does** carry `textStyle.lineHeight` (33) and `alignX/alignY` (30) — contrary to the phase premise that the seed lacks them. A raw re-export mismatched `slide1.xml` (`a:spcPct` from lineHeight 0.95; `srcRect` crop from align).

**Guard proof (kept green):** golden test strips those fields before export, then compares to the pre-edit golden. Result: **green** — decks without the fields stay byte-identical. Catalog changes were **not** reverted.

---

## 5. Composer proof (`proof-payroll-4d2-online`)

Re-exported via `exportDeckPptx` + soffice + pdftoppm under `_4f0-before` (lineHeight stripped) and `_4f0-after` (as-is).

| element | slide | measure | lo_before | lo_after | lh |
| --- | ---: | ---: | ---: | ---: | ---: |
| composer-cover-kicker | 1 | 1 | 1 | 1 | 1.2 |
| composer-cover-title | 1 | 3 | 3 | 3 | 1.05 |
| composer-cover-body | 1 | 2 | 2 | 2 | 1.35 |
| composer-split-copy-title | 2 | 2 | 2 | 2 | 1.1 |
| composer-split-copy-body | 2 | 2 | 2 | 2 | 1.35 |
| composer-split-copy-bullet-1..3 | 2 | 1 | 1 | 1 | 1.3 |

Line counts already matched `textMeasure` both ways on this short copy. **Photo crop:** proof deck has **0** `alignX`/`alignY` fields → crop path not taken; LO slide-1 vs canvas `slide-01.png` still uses default cover (no focal shift). PPTX gate on this deck: **pass** (6/6).

---

## 6. `pptxGate.js`

`services/templatePipeline/composer/pptxGate.js`:

1. `exportDeckPptx` → `<out>/deck.pptx`
2. soffice → PDF; pdftoppm → `lo-slide-N.png`; `pdftotext -bbox`
3. Per text element: first 12 chars present; LO lines ≤ `textMeasure.lines`; last baseline ≤ box bottom + 4px
4. Failures: `pptx mismatch: <element> <reason>`
5. Missing soffice/poppler → `pptx gate skipped` (pass, logged)

---

## 7. Wiring

### composeRuntime (after composer hard fails)

```diff
   analysis = applyComposerFails(analysis, built.deck);
+  const pptxGate = await runPptxGate(built.deck, outDir);
+  analysis = applyPptxGate(analysis, pptxGate);
```

Composer out dir now contains `deck.pptx`.

### ensurePptx

```diff
+  const deckPptx = path.join(dir, "deck.pptx");
+  if (fs.existsSync(deckPptx) && fs.statSync(deckPptx).isFile()) return deckPptx;
   ...
-  const out = path.join(dir, (deck.id || id) + ".pptx");
+  const out = path.join(dir, "deck.pptx");
```

### publishTemplate

```diff
+  const gate = await runPptxGate(deck, dir);
+  if (!gate.skipped && !gate.pass) {
+    throw fail(422, "PPTX gate failed: " + (gate.failures || []).join("; "));
+  }
```

Callers await the now-async publish (`devServer.js`, `routes/adminTemplateRoutes.js`).

---

## 8. composer.test.js gate cases

- Forced `textMeasure.lines = 1` on a long body → **`pptx mismatch` hard fail** (soffice available).
- Skip path asserted when tools missing (`pptx gate skipped`).
- `proof-payroll-4d2-online` replay → gate **pass**, `deck.pptx` written.

---

## 9. Characterization tests

```
qaLoop test passed
semanticFilter test passed
chooseLayout test passed
generateTemplateShape test passed
dead code test passed
manualQa test passed
safeRm test passed
catalogGolden test passed (10 slides, fields stripped)
composer.test passed
```

No file named `assembleDeck.js` or `composeDeck.js`.

---

Stop. Do not start kit work.
