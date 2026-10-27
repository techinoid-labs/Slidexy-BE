# Pipeline merge — Phase 4 composer plan

Read-only plan. No code edits, installs, generates, or converter runs in this phase. Seed / assemble / remix / native stay callable; `app-library/` is not deleted; semantic filter, DNA, and characterization tests stay green.

**Track:** `runPipeline({ mode: "composer" })`. AI emits no coordinates. Browser lays out at build time. Generate loads committed JSON. Vision stays off; geometry + new deterministic aesthetic metrics; human reviews PNGs.

Does **not** revive `inventBrief` / `reasonDeck` / `gates` / `generateDeck` / `learn` (do not read those modules for implementation).

---

## 1. Deck JSON contract the measurer must emit

**Canvas:** 1600×900 px, 16:9. Boxes: `x`, `y`, `width`, `height` (never `left`/`top`). Font sizes on the wire: **px**. PPTX converts later.

**Consumers:** renderer `scripts/slideSvg.js`; geometry `scoring/analyzeDeck.js` `checkGeometry`; PPTX `catalog.js` `pptxBuffer` / `addText` / `addShape` / `addPicture`. `renderDeck` in `thematic.js` only loops `layoutSequence` → `renderSlidePng` (no field filter).

### Deck-level

| Field | Type | Renderer | Geometry | PPTX |
| --- | --- | --- | --- | --- |
| `schemaVersion` | `2` | ignore | ignore | ignore |
| `id`, `name` | string | ignore | ignore | `name` → title |
| `tokens.color.{bg,surface,card,ink,muted,rule,accent,accent2,onAccent}` | `#RRGGBB` | `{color.*}` + slide fill | contrast / bg resolve | slide bg `tokens.color.bg` |
| `tokens.font.{display,text}` | family string | `{font.*}` | ignore | `fontOf` |
| `tokens.type.{h1,body}` | px | ignore | ignore | ignore |
| `theme.{backgroundColor,fontFamily,titleColor,bodyColor}` | fallback | ignore | bg fallback | bg fallback |
| `layoutSequence` | `string[]` | iterate | iterate | iterate |
| `layouts` | map | read | read | read |
| `previewSlides` | `{id,layout,title,bullets}[]` | text binding fallback | ignore | ignore |

Writer reference (convert):

```908:936:services/templatePipeline/convert/pptxToDeck.js
  const deck = {
    schemaVersion: 2,
    id: safeId,
    name: path.basename(inputPath, path.extname(inputPath)).trim(),
    ...
    tokens: { color: { bg, surface, card, ink, muted, rule, accent, accent2, onAccent }, font: { display, text }, type: { h1: 64, body: 22 } },
    theme: { backgroundColor: bgHex, fontFamily: fonts.major, titleColor: ink, bodyColor: ink },
    layoutSequence: sequence,
    layouts,
    previewSlides,
  };
```

### Layout-level

| Field | Type | Who reads |
| --- | --- | --- |
| `version` | `2` | writer only |
| `id` | string | key from `layoutSequence` |
| `canvas` | `{width:1600,height:900,aspectRatio:"16:9"}` | writer only; consumers hardcode 1600×900 |
| `elements` | array | all three |

No separate `background` field — full-bleed `shape` / `image` is an element.

### Shared element fields

| Field | Units | Renderer | Geometry | PPTX |
| --- | --- | --- | --- | --- |
| `id` | string | warn labels | seed-id exemption `/^s\d+-e\d+/` | ignore |
| `type` | enum | dispatch | type checks | dispatch |
| `x,y,width,height` | px | paint | `boxOf` | `inches(...)` |
| `zIndex` | number | paint order | overlap / bg | flatten sort |
| `opacity` | 0–1 | yes | ignore | shapes → fill transparency |
| `isDecoration` / `originalRole:"decoration"` | bool | ignore | bg exemption | ignore |
| `seedOrigin` | bool | ignore | geometry exemption | ignore |

Geometry `boxOf`:

```105:114:services/templatePipeline/scoring/analyzeDeck.js
function boxOf(element) {
  const x = Number(element.x) || 0;
  const y = Number(element.y) || 0;
  return { x, y, right: x + (Number(element.width) || 0), bottom: y + (Number(element.height) || 0) };
}
```

### `text`

| Field | Type / units | Renderer | Geometry | PPTX |
| --- | --- | --- | --- | --- |
| `textStyle.fontFamily` | string | yes | no | yes |
| `textStyle.fontSize` | **px** | yes | via clip layout | → points |
| `textStyle.fontWeight` | number | yes | no | bold if `≥ 600` |
| `textStyle.color` | `#hex` / `{color.*}` | yes | contrast | yes |
| `textStyle.textAlign` | left\|center\|right | yes | no | `align` |
| `textStyle.lineHeight` | unitless × size | yes | via `textWasClipped` | **ignored** |
| `textStyle.letterSpacing` | **px** | yes | via layout | → `charSpacing` points |
| `textContent.spans[].text` | string | yes | content / split-word | yes |
| span overrides (family/size/weight/color/letterSpacing) | as above | yes | color on `[0]` for contrast | yes |
| `textContent.binding` | string | binding fallback | no | no |
| `role` | — | **not a deck field today** | — | — |

Measurer note: kit HTML uses `data-role` for slots; emitted JSON should put slot copy into `textContent.spans[].text` and keep a stable `id` (e.g. `composer-cover-title`). Do not invent a top-level `role` on elements unless later consumers need it — native uses element **ids**, not an element `role` field.

PPTX text options (wrap, no autofit, no slack):

```296:305:services/templatePipeline/catalog.js
  slide.addText(runs, Object.assign(boxOf(element), {
    align: style.textAlign || "left",
    valign: "top",
    margin: 0,
    wrap: true,
    ...
  }));
```

### `shape`

| Field | Units | Renderer | Geometry | PPTX |
| --- | --- | --- | --- | --- |
| `shapeContent.kind` | `rectangle`/`rect`/`circle`/`ellipse` | yes | no | rect / ellipse / roundRect |
| `shapeContent.fill` | `#hex` / `none` | yes | solid underlay | yes |
| `shapeContent.cornerRadius` | px | yes | no | → `rectRadius` 0–1 |
| `shapeContent.stroke` / `strokeWidth` | hex / px | yes | no | yes if width > 0 |
| `shapeContent.strokeOpacity` | 0–1 | yes | no | **ignored** |
| `shapeContent.gradient` | stops | paints | **fails `"gradient"`** | first-stop + OOXML patch |

### Picture (`image` / `maskedImage`)

| Field | Units | Renderer | Geometry | PPTX |
| --- | --- | --- | --- | --- |
| `imageContent.url` / `maskedImageContent.url` | `photos/...` path | `loadPhoto` | picture set | file resolve |
| `*.fit` | `cover` \| `contain` | yes | no | yes |
| `*.alignX` / `*.alignY` | 0–1 | yes | no | **ignored** (center crop) |
| `*.clip.{kind,d,viewBox,cornerRadius}` | | yes | complex path fail | ellipse/arch/round |
| `isDecoration` / `originalRole` | | no | exemption | no |

### Asymmetries (measurer must care)

| Field | Read by | Ignored by |
| --- | --- | --- |
| `lineHeight` | renderer (+ geometry clip) | **PPTX** → box height must absorb wrap; record Chrome line count × lead into `height` |
| `alignX`/`alignY` | renderer | PPTX |
| `isDecoration` / `originalRole` | geometry | renderer, PPTX |
| `opacity` | renderer; PPTX shapes | geometry; PPTX text/images |
| Gradients / box-shadow / complex SVG | geometry **fails** | may still paint |

### One-slide emit shape (composer target)

```text
deck.layouts[layoutId] = {
  version: 2, id, canvas: { width: 1600, height: 900, aspectRatio: "16:9" },
  elements: [
    { id, type: "shape"|"text"|"image"|"maskedImage",
      x, y, width, height, zIndex,
      // text: textStyle + textContent.spans
      // shape: shapeContent { kind, fill, cornerRadius, stroke?, strokeWidth? }
      // image: imageContent { url, fit: "cover" } (+ isDecoration if kit chrome)
    ]
}
```

Plus deck `tokens`, `layoutSequence`, `schemaVersion: 2`.

---

## 2. Native archetypes vs contract

Read: `native-cover.json`, `native-split.json`, `native-data.json`, plus `native-about.json` / `native-problem.json`.

**Conform:** absolute 1600×900 boxes; `text` / `shape` / `image` with `textStyle` + spans; `tokens.color` / `font` / `type`; canvas object.

**Extra fields the contract table does not require of multi-slide seeds:**

| Extra | Notes |
| --- | --- |
| Top-level `role` | `"Cover"`, `"About"`, `"Problem"`, … — composer kit should carry this for brief validation |
| Singular `layout` | Native files are one layout object, not `layouts` + `layoutSequence`. Runtime `buildDeck` / composer assemble must wrap into a full deck |
| `native-signature` circle | baked decoration shape (often bleeds; geometry exempt if treated as decoration / large bg patterns) |
| Semantic element ids | `native-cover-title`, etc. |
| `shapeContent.kind: "rect"` / `"circle"` | seeds often use `"rectangle"`; both render/PPTX paths accept |

Native does **not** carry `schemaVersion`, `taste`, `theme`, `previewSlides`, `description`, `category`, `visualMode`, `source` until assembled into a deck.

---

## 3. PPTX unit conversions and text sizing

From `catalog.js`:

```15:18:services/templatePipeline/catalog.js
const SLIDE_W = 13.333;
const SLIDE_H = 7.5;
const CANVAS_W = 1600;
const CANVAS_H = 900;
```

```191:211:services/templatePipeline/catalog.js
function inches(px, axis) {
  const size = axis === "x" ? SLIDE_W / CANVAS_W : SLIDE_H / CANVAS_H;
  return (Number(px) || 0) * size;
}
function points(px) {
  return Math.max(1, Math.round((Number(px) || 16) * 72 * SLIDE_W / CANVAS_W));
}
function hexColor(value) {
  // #RRGGBB → strip #, uppercase; {color.name} resolved via colorOf → tokens
}
```

| Conversion | Formula |
| --- | --- |
| px → inches (x/w) | `px * 13.333/1600` |
| px → inches (y/h) | `px * 7.5/900` |
| px → points | `max(1, round(px * 72 * 13.333 / 1600))` |
| hex | `#RRGGBB` → `RRGGBB`; tokens `{color.ink}` resolved first |
| Min box | `max(0.05, inches(...))` |

**Text box policy:** `wrap: true`, `valign: "top"`, `margin: 0`, **no autofit**, **no slack**. Measurer must set `height` from Chrome’s measured block (line count × `lineHeight` × `fontSize`, plus any padding) so PowerPoint wrap stays inside the box even though PPTX ignores `lineHeight`.

---

## 4. `checkGeometry` rules (full)

Constants: `CANVAS_W=1600`, `CANVAS_H=900`, `BLEED_X=320` (20%), `BLEED_Y=180` (20%).

| Rule | Threshold / definition | Reason string |
| --- | --- | --- |
| Text bounds | any edge past canvas by **>1px** | `bounds` |
| Non-text bounds | past canvas by **>20%** bleed | `bounds` |
| Decoration exempt (gradient/shadow/svg only) | `isDecoration` or `originalRole==="decoration"` | — |
| Full-bleed / bg exempt (same) | area ≥ **85%** canvas **and** lowest `zIndex` | — |
| Seed exempt (same) | id `/^s\d+-e\d+/` or `seedOrigin===true` | — |
| Gradient | `gradient.stops` or CSS `gradient(` in fill bags | `gradient` |
| Box shadow | `boxShadow` / `shadowBlur` / `shadow===true` / filter with box-shadow | `box shadow` |
| Complex SVG | curve cmds `C/Q/A/S/T` **or** **>8** path commands on illustration/`clip.d` | `complex svg` |
| Text overlap | shared area **>40%** of smaller text box (text–text only) | `text overlap` |
| Contrast | ratio **< 4.5**; skipped if text overlaps any picture | `contrast` |
| Split word | consecutive spans alphanumeric abutment, no whitespace | `split word` |
| Text overflow | `textWasClipped` **and** off-canvas | `text overflow` |

Pass = unique reasons empty. Shape-on-photo is allowed. Score with `vision:false`: slide 100 if geometry pass else 0; deck = `round(100 * passed / total)`.

---

## 5. PPTX-safe CSS subset

### Allowed → deck field → PPTX primitive

| CSS | Deck field | PPTX |
| --- | --- | --- |
| `background-color` | `shapeContent.fill` / tokens | solid fill |
| `color` | `textStyle.color` / span | run color |
| `border` / `border-color` + `border-width` | `stroke` + `strokeWidth` | line |
| `border-radius` | `cornerRadius` | roundRect |
| `font-family` | `textStyle.fontFamily` | `fontFace` |
| `font-size` | `fontSize` px (from computed px) | points() |
| `font-weight` | `fontWeight` | bold ≥600 |
| `line-height` | `lineHeight` unitless | ignored — bake into box height |
| `letter-spacing` | `letterSpacing` px | charSpacing |
| `text-align` | `textAlign` | align |
| `text-transform` | **apply at measure time** into span `text` (uppercase etc.) — do not store as CSS | — |
| `object-fit: cover` on `img` | `imageContent.fit: "cover"` | cover sizing |
| `opacity` on shapes | element `opacity` | fill transparency |

### Forbidden (justify)

| CSS | Why |
| --- | --- |
| Gradients (`linear-gradient`, etc.) | geometry `"gradient"` |
| `box-shadow` / `filter: drop-shadow` | geometry `"box shadow"` |
| `transform` | no deck rotate for arbitrary CSS; PPTX shape rotate incomplete; geometry AABB mismatch |
| `filter` (blur etc.) | no PPTX / geometry shadow bags |
| `mix-blend-mode` | not in schema; PPTX unsupported |
| Pseudo `::before`/`::after` `content` | not measurable as elements; invisible to schema |
| `background-image` | not a shape fill; would need picture element — use `<img data-role=photo>` instead |
| `clip-path` / complex SVG paths | geometry `"complex svg"`; PPTX path clips weak |
| SVG beyond simple rect/circle | same |

### Lint proposal

- Parse kit HTML + linked CSS (or `<style>` blocks) with a static pass (e.g. PostCSS / regex deny-list on property names and `url(` / `gradient(` / `calc(transform`).
- Reject: forbidden properties; `position` other than static/relative inside the slide root; `%` heights that depend on viewport outside 1600×900 root; nested `<svg>` with path `d` containing curve letters.
- Allow only classes declared in the kit; fail CI if unknown utility appears.
- Emit warnings for `line-height` unit mismatches (prefer unitless).

---

## 6. Fonts

### Referenced today

| Source | Families |
| --- | --- |
| `app-library/native/**` tokens | **Poppins Bold**, **Figtree** |
| Top-level seeds `tokens.font` | **Calibri**, **Arial** |
| Niche packages (not tokens.font) | also Playfair Display / Source Sans 3 (elegant) — out of composer v1 allowlist unless installed |

### Proposed pairs (display + body) — v1 allowlist

| Pair id | Display | Body | Rationale |
| --- | --- | --- | --- |
| `native` | Poppins Bold | Figtree | Matches native archetypes |
| `corp-calibri` | Calibri | Calibri | Ubiquitous Office; seed-compatible |
| `corp-arial` | Arial | Arial | Universal fallback |
| `editorial` | Georgia | Calibri | Serif display without exotic installs |
| `modern` | Segoe UI | Segoe UI | Windows default UI face |
| `pair-figtree` | Figtree | Figtree | If Figtree ships with kit/PPTX embed |

Ship kit webfonts **into the Chromium measure step** (file URLs). For PPTX, prefer pairs that exist on Windows or embed via pptxgenjs font files if already used elsewhere — v1 stick to **native + corp-calibri + corp-arial + modern** unless Figtree/Poppins are confirmed present.

### Installation check (do not run this phase)

PowerShell (GDI+ installed-font list):

```powershell
Add-Type -AssemblyName System.Drawing
$fonts = (New-Object System.Drawing.Text.InstalledFontCollection).Families | ForEach-Object { $_.Name }
$need = @('Poppins','Figtree','Calibri','Arial','Georgia','Segoe UI')
$need | ForEach-Object { [pscustomobject]@{ Family = $_; Installed = [bool]($fonts -contains $_) } }
```

Alternate: `Get-ChildItem "$env:WINDIR\Fonts" | Select-Object Name`.

---

## 7. Design-brief call

### Response shape

```json
{
  "plan": [{ "role": "Cover", "component": "cover", "variant": "word" }],
  "paletteBucket": "light-neutral",
  "fontPair": "native",
  "density": "balanced",
  "coverPattern": "oversized",
  "signature": "frame",
  "mood": "clean and corporate",
  "copy": {
    "Cover": { "title": "...", "body": "...", "kicker": "..." }
  }
}
```

- **8–12 slides** in `plan`.
- `component` / `variant` ∈ kit `manifest.json`.
- `paletteBucket` ∈ thematic QA three: `light-neutral` | `light-warm` | `dark-neutral` (from `PALETTE_BUCKETS` / `moodBucket`). Anchors for fills: `catalogCaps.ANCHORS`.
- `density` ∈ `airy` | `dense` | `balanced` (`applyDensity`).
- `coverPattern` ∈ `oversized` | `fullBleed` | `split` (`COVER_PATTERNS` / `pickCover`).
- `signature` ∈ `frame` | `rail` (`signature.js` `DEVICES`).
- `fontPair` ∈ step 6 ids.
- Body ~**25 words**; **no em dashes** — reuse `COPY_RULES` in `thematic.js` 291–297:

```291:297:services/templatePipeline/thematic.js
const COPY_RULES = [
  "Write like a slide designer, not an essayist. Maximum 25 words of body text per slide.",
  ...
  "Never use em dashes. Use a colon, a comma, or a period.",
  ...
];
```

Also reuse `cleanCopy` / `clampCopy` / `acceptable` post-process where practical.

### Validator

Invalid field → `hash(prompt + nonce)` pick into the allowed enum / manifest list (same FNV-style `pickIndex` as `parametric.js`). Record fallbacks in `replacements.json`.

### Model / 402

Same `askModel` as `inventDirection`: OpenRouter first; on **402 / credit** fall through to Gemini (`API_KEY1` / `GEMINI_API_KEY`). Never log keys.

### Text-model calls per generate

| Call | Purpose |
| --- | --- |
| 1 | `inventDirection` (brand / mood / keywords) — reuse as today |
| 2 | Design brief JSON above |
| (+1 optional) | Refinement brief if aesthetic metrics fail (step 12) |

**Base = 2.** Cap total text calls at **3** with one refinement. No per-slide rewrite loop in v1 (copy comes from brief). Pexels is not a text-model call.

---

## 8. Kit manifest (`design-system/manifest.json`)

Compiler writes; brief validator reads.

```json
{
  "version": 1,
  "components": [
    {
      "id": "cover",
      "cover": true,
      "roles": ["Cover"],
      "variants": ["word", "split", "full-bleed"],
      "slots": [
        { "dataRole": "title", "maxChars": 40 },
        { "dataRole": "body", "maxChars": 120 },
        { "dataRole": "kicker", "maxChars": 24, "optional": true }
      ],
      "photoSlots": [{ "dataRole": "photo", "fit": "cover", "optional": true }]
    },
    {
      "id": "split-copy",
      "cover": false,
      "roles": ["About", "Problem", "Solution"],
      "variants": ["left-photo", "right-photo"],
      "slots": [
        { "dataRole": "title", "maxChars": 48 },
        { "dataRole": "body", "maxChars": 160 },
        { "dataRole": "bullet", "maxChars": 80, "repeat": 3 }
      ],
      "photoSlots": [{ "dataRole": "photo", "fit": "cover" }]
    }
  ],
  "roles": ["Cover","Contents","About","Problem","Solution","Proof","Market","Model","People","Next","Close"],
  "fontPairs": ["native","corp-calibri","corp-arial","modern"],
  "paletteBuckets": ["light-neutral","light-warm","dark-neutral"],
  "densities": ["airy","dense","balanced"],
  "coverPatterns": ["oversized","fullBleed","split"],
  "signatures": ["frame","rail"]
}
```

HTML authors: `data-component`, `data-variant`, `data-role` on measurable nodes; `data-photo` for image slots.

---

## 9. Compiler (build step)

### Decision: symbolic tokens, not full cartesian product

**Emit one JSON per `component × variant`** under `app-library/native/composer/`, with fills/fonts as `{color.*}` / `{font.*}` tokens and type scale in `tokens.type`.  

**Reasoning:** `3 buckets × 4–6 pairs × N variants` explodes disk and review cost; runtime already remaps tokens (native + thematic). Geometry contrast is re-checked after token apply. Chrome still measures **once per variant** with a **reference** bucket/pair so box sizes match the type scale; recorded boxes are geometry, not baked hex.

Optional later: pre-bake if contrast fails only for dark buckets (type scale same).

### Pipeline

1. Input: `design-system/components/*.html` (+ CSS).
2. Inject CSS variables for reference bucket + font pair; load local font files.
3. Headless Chromium **1600×900**, `deviceScaleFactor: 1`, wait for `document.fonts.ready`.
4. Walk `[data-role]`; `getBoundingClientRect` relative to slide root; map CSS → deck fields (step 5).
5. Write `app-library/native/composer/<component>-<variant>.json` (native-like: `id`, `name`, `role`, `tokens` symbolic, `layout`).
6. Regenerate `design-system/manifest.json` from HTML headers / attributes.
7. Commit JSON; **generate never launches Chromium in v1**.

### Dependency

- Prefer existing **`puppeteer@^24.24.1`** already in `package.json` **dependencies** (do not install in this phase). Treat compiler as a **build script**; document that Chromium download is build-machine only. Longer-term: move puppeteer to `devDependencies` so production generate stays Chromium-free — out of scope for plan execution.
- Do **not** add Playwright in v1 (duplicate browser).

Pin: keep exact version already locked in the tree when implementing; no `npm install` this phase.

---

## 10. Compose at runtime

`runPipeline({ mode: "composer", prompt, out?, nonce?, density?, qa? })` (and admin `mode: "composer"`).

**Order:**

1. Resolve `nonce` (body or random); `inventDirection(prompt)`.
2. Design-brief call → validate against manifest (hash fallbacks).
3. Load `app-library/native/composer/<component>-<variant>.json` per plan slide; assemble `layoutSequence` / `layouts` / deck `tokens` from `paletteBucket` + `fontPair` (via `ANCHORS` + pair table).
4. Apply copy into slots (`data-role` → element ids); clamp with COPY_RULES helpers.
5. Pexels: `searchPexels` / `downloadPhoto` → `generated-templates/photos/composer/<slug>/`; assign to photo slots (same spirit as thematic `assignImages`, composer-local).
6. `applyParametric` with **`skipCover: true`** (proposed flag — see risks): still density, signature (or skip if kit already has signature device), type contrast, auditGeometry.
7. Write `deck.json`; `renderDeck`; manual-mode `analyzeDeck({ vision: false })` + aesthetic metrics (step 11); `writeQa`-equivalent with `mode: "manual"`.
8. `replacements.json`: brief, nonce, validator fallbacks, direction, photo queries, metric details.
9. Return dashboard shape (`GENERATE_TEMPLATE_FIELDS` / `adminCatalog` return): `id`, `name`, `deck`, `slides[]`, `analysis`, `vibe`, `layoutId` (e.g. `"composer"`), `pptxUrl` if built.

**Out dir:** default `docs/template-pipeline/composer/<slug>`; **never** under `docs/template-pipeline/native/` or overwrite `app-library/published/`.

---

## 11. Aesthetic metrics (deterministic, no network)

Add beside geometry in `analyzeDeck` (or `analyzeComposer` composing both). Vision remains off.

| Metric | Formula | Threshold (v1 proposal) | Hard fail? |
| --- | --- | --- | --- |
| Edge-alignment count | distinct rounded left / right / top edges among non-decoration boxes (round to 8px) | max **6** distinct per axis family (L+R combined ≤6; tops ≤6) | score penalty; hard if >10 |
| Margin consistency | min distance of non-bleed elements to canvas edge | must fall in band **[48, 120]** px (or document kit margin token); outliers >24px from mode → fail | hard if min < 32 |
| Whitespace ratio | 1 − (union area of non-decoration boxes / canvas) | band **[0.35, 0.72]** | hard outside band |
| Min text box | `width*height` and `fontSize` | area ≥ **80×28**; fontSize ≥ **14** | hard |
| Type scale | every `fontSize` ∈ kit scale e.g. `{12,14,16,18,22,28,36,48,64,96,120,160,200}` | must match | hard |
| Missing image | `url` set and file absent under `PHOTO_ROOT` | any | **hard fail** (no hatch pass for composer) |

**Combine with geometry for dashboard score:**

- Geometry fail on a slide → slide fail (score 0), same as today.
- Geometry pass + any **hard** aesthetic fail → slide fail.
- Soft metrics → optional `aesthetic.score` 0–100 averaged; deck `analysis.score` stays **`round(100 * passed / total)`** so dashboard semantics unchanged. Put soft details under `analysis.aesthetic` / `replacements.json` for the curator note.

---

## 12. Refinement without vision

If hard metrics fail after first compose:

1. Keep attempt-1 out dir (or `…/attempt-1` sibling) — **do not discard** (align with manual-mode contract: keep under-80).
2. One extra brief call: include failure list; allow **only** `component` / `variant` changes for failing roles; palette/font/density frozen unless invalid.
3. Re-compose to attempt-2 out dir (or overwrite working copy but retain attempt-1 PNGs).
4. Re-run geometry + aesthetics once. **No second refinement.**
5. Return best attempt (or last) with `analysis.attempt` 1|2, `mode: "manual"`; never `rmSync` on low score.

Does not use vision QA retry / `excludeLayouts` loop.

---

## 13. Single-component proof (implementation phase 4a — not started now)

**Scope:** one cover component, variants `word` | `split` | `full-bleed`; compile → one-slide deck → `renderDeck` → `catalog.buildPptx`.

**Proof artifacts:** Chrome screenshot (compiler), `renderDeck` PNG, LibreOffice-rasterized PPTX slide; human eye compare.

**Commands (PowerShell, illustrative — run in a later phase):**

```powershell
cd "c:\Users\SP Grid\Desktop\Techinoid\Slidexy-BE"

# after implementing compiler
node services/templatePipeline/composer/compileKit.js --only cover

# load compiled JSON into a one-slide deck fixture and render
node services/templatePipeline/composer/proofCover.js --variant word --out docs/template-pipeline/composer/proof-cover-word

# PPTX via catalog helper (script wraps buildPptx)
node services/templatePipeline/composer/proofCover.js --variant word --pptx

# pixel compare Chrome measure shot vs renderDeck PNG (ImageMagick)
magick compare -metric AE -fuzz 2% `
  docs/template-pipeline/composer/proof-cover-word/chrome.png `
  docs/template-pipeline/composer/proof-cover-word/slide-01.png `
  docs/template-pipeline/composer/proof-cover-word/diff.png

# LibreOffice headless rasterize (if installed)
& "C:\Program Files\LibreOffice\program\soffice.exe" --headless --convert-to pdf --outdir docs/template-pipeline/composer/proof-cover-word `
  docs/template-pipeline/composer/proof-cover-word/deck.pptx
magick convert -density 96 "docs/template-pipeline/composer/proof-cover-word/deck.pdf[0]" `
  docs/template-pipeline/composer/proof-cover-word/lo-slide.png
```

**Tolerance:** ImageMagick AE with **2% fuzz**; report absolute error count; no automatic fail gate until baseline exists — human judges LO vs Chrome vs node-canvas.

---

## 14. Remaining phases (same shape as merge 1–3)

| Phase | Files | Must stay | Proof |
| --- | --- | --- | --- |
| **4a — Measure contract + one cover** | `design-system/components/cover.html`, `composer/compileKit.js`, `app-library/native/composer/cover-*.json`, tiny proof script | All seed tests green; no inventBrief revive; no Chromium at generate | Step 13 offline proof (no LLM) |
| **4b — Manifest + CSS lint + fonts check** | `manifest.json` writer, `lintCss.js`, font-pair table | Lint rejects forbidden CSS | Lint on cover HTML; PowerShell font check logged in report |
| **4c — Runtime compose (no refinement)** | `composer/compose.js`, `pipeline.js` mode `composer`, Pexels → `photos/composer/` | `auto`/`pinned` unchanged; thematic CLI unchanged | Offline stub compose with fixture brief (no API) + one online proof batched at end |
| **4d — Aesthetic metrics + one refinement** | `analyzeDeck.js` (or sibling), refinement brief | Manual keep-on-disk; vision off | Characterization test with stub metrics; online at phase end |
| **4e — Dashboard** | `adminCatalog.js`, `admin-dashboard/index.html` | **Default mode = composer** only in adminCatalog/dashboard while seed photos missing; **`thematic.js` CLI default stays auto/pinned** (no composer unless `--mode=composer` later) | Curator: Composer + nonce field; Generate once |
| **4f — Kit expansion** | more components/roles to 8–12 | Semantic seed tests untouched | Online full deck proof once |

**Online proofs:** gather into **one final step per phase** (credit confirmed); stop on first 402.

**Characterization:** `qaLoop`, `semanticFilter`, `chooseLayout`, `generateTemplateShape`, `deadCode`, `manualQa` green every phase.

---

## 15. Risks

| Risk | Mitigation |
| --- | --- |
| Chrome vs LibreOffice vs PowerPoint wrap | Measurer records line boxes; set `height` from Chrome; PPTX `wrap:true` without autofit; prefer shorter copy (25-word rule) |
| Font substitution off-box | Allowlist installed/shippable faces; embed or stick to Calibri/Arial/Segoe; document Poppins/Figtree requirement |
| `applyParametric` `replaceCover` fights kit cover | **Composer passes kit cover and skips `replaceCover`** (`options.skipCover === true`); still may run density + signature — if kit includes signature circle, also `skipSignature` or strip duplicate |
| Niche stickers / decoration PNGs | Composer v1: **no niche stickers**, no `assets/decorations` injection; kit chrome = shapes only. Photo slots = Pexels only under `photos/composer/`. Aligns with “don’t rely on missing library assets” |
| Chromium on Windows | Puppeteer already depended; first compile downloads Chrome — build-machine concern; generate path must not call it in v1 |
| `deadCode.test.js` | Do **not** add `assembleDeck.js` or **`composeDeck.js`**. Use `composer.js` / `composeRuntime.js` / `compileKit.js` |
| Missing seed photos | Dashboard default → composer (4e) without changing CLI |
| Combinatorial JSON | Symbolic tokens (step 9) |
| Manual vs vision scoring | Composer always manual `writeQa`; aesthetic hard fails reduce `passed` count |

---

## Decisions locked for implementers

1. v1 = **build-time** Chromium → committed `app-library/native/composer/*.json`.
2. Runtime = load JSON + brief + Pexels + parametric (skip cover replace) + render + manual QA + aesthetics.
3. Seed track untouched; new mode only.
4. Do not start the single-component proof until a later phase task says so.

---

Stop. Do not start Phase 4a implementation or the single-component proof from this document alone.
