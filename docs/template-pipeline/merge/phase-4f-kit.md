# Pipeline merge — Phase 4f kit

Close out 4f-0 fidelity, then kit all 11 roles, placement variants, rhythm, brief limits, gallery, online 4f-a/b. Vision off. Online only in step 13.

---

## A0.a Seed export evidence (lineHeight guard)

**Guard (quoted):**

```js
// catalog.js addText
if (Number.isFinite(lineHeight) && lineHeight >= 1) {
  options.lineSpacingMultiple = lineHeight;
}
```

Unstripped `docs/template-pipeline/merge/phase-3-payroll/deck.json` vs lineHeight-stripped twin, soffice + pdftoppm + `pdftotext -bbox`:

| slide | id | lh | lo_stripped | lo_unstripped | last↓box | gained line |
| ---: | --- | ---: | ---: | ---: | --- | --- |
| 1 | cover-title | 0.95 | 1 | 1 | no | no |
| 2–10 | (body of table in `_tmpA0a` run) | 1.15 / 0.95 | … | … | no | no |

**REGRESSIONS: `[]`** — no element gained a line; no last baseline moved below its box. `lh=0.95` stays unguarded (not applied), so LO matches the stripped path for that field.

Second golden written: `services/templatePipeline/fixtures/golden/phase-3-payroll-unstripped/` (10 slides). `catalogGolden.test.js` runs stripped + unstripped — **green** (`stripped 10, unstripped 10`).

---

## A0.b compileKit alignX/alignY + replay

- `compileKit` reads CSS `object-position` (default center → 0.5/0.5) and emits `imageContent.alignX/alignY` in 0..1. All **112** kits recompiled.
- Composer deck replay (`proof-payroll-4d2-online`): **no** `missing alignX` / `missing alignY` warnings from `slideSvg.js`. Gate pass on replay.
- `composer.test.js` fixture image `alignX=0.2`, `alignY=0.8`, box 800×300 on 1880×1253 photo:

```
scale=0.425531914893617  scaledW=800  scaledH=533.1914893617021
ox=0  oy=186.5531914893617
expectedLeft=0  expectedTop=0.3498802873104549
srcRect l=0 t=34987 r=0 b=8747   (t/100000 ≈ 0.34987)
```

Offsets match `coverSizing` crop arithmetic; `slide1.xml` contains `srcRect`.

**Human crop comparison paths:**

- Canvas: `docs/template-pipeline/composer/proof-payroll-4d2-online/slide-01.png`
- LO: re-exported under replay / proof dirs; primary online proof still at `docs/template-pipeline/composer/proof-payroll-4d2-online/` (gate pass). Replay working copy: `docs/template-pipeline/composer/_replay-4d2-align/slide-01.png`.

---

## A0.c deck.pptx naming + publish 422

Grep of `adminCatalog.js`, `devServer.js`, `adminTemplateRoutes.js`, dashboard:

- **Download / ensurePptx** write and prefer `deck.pptx` (not `<id>.pptx`).
- **pptxUrl** is `/api/admin/download/:id` when any `.pptx` exists (composer gate writes `deck.pptx`).
- Upload ingest still stages `uploads/<id>.pptx` (input only) — not the download name.
- Publish callers **await** `publishTemplate`: `devServer.js` and `routes/adminTemplateRoutes.js`.
- Gate failure → `fail(422, "PPTX gate failed: …")`. Dashboard publish handler:

```js
status.textContent = error.message; // catch after post("/api/admin/publish-template")
```

`post()` throws `Error(data.error)` on `!response.ok`, so a 422 lands on the status line.

---

## 0. Auto-Select qa (4e step 8)

Job: `docs/template-pipeline/admin-dashboard/tmp/auto-a-corporate-payroll-company-mvqy0air/deck.json`

```json
{ "score": 100, "passed": 11, "total": 11, "failures": [], "attempt": 1, "mode": "manual" }
```

**`qa.mode` is `"manual"`** — the 4e report mislabelled it as vision. No env change; continuing.

---

## 1. adminCatalog deps removal

`generateTemplate(body)` no longer accepts HTTP `deps`. Test seam:

```js
// composeRuntime.js
function setTestDeps(deps) { testDeps = deps || null; }
async function compose(options, deps) {
  deps = deps || testDeps || null;
  ...
}
```

`generateTemplateShape.test.js` uses `setTestDeps({…})` / `setTestDeps(null)`. **Tests green.**

---

## 2. safeRm photos

`generated-templates/photos/composer/apex` and `payroll-pros` — **missing** (already absent). Left `proof/` and other job folders untouched.

---

## 3. Seed geometry mining (top 10 by qualityScore)

Top seeds: black-and-white-minimalist-pitch-deck (100), red-black-neon-cinema (100), yellow-and-blue-…health (100), black-and-grey-3d-shapes (93), blue-and-white-modern-business-proposal (91), … (see `_mine-seeds.json`).

≤8 compositions (one-liners):

1. center/top title, small photo accent, dense multi-box copy — neon/3d-shapes/roadmap
2. center/middle title, full-bleed photo mass, several text boxes — cinema/proposal covers
3. left/top title, full-bleed photo mass, dense multi-box copy — portfolio/SEO
4. center/top title, ~half-slide photo column, dense multi-box copy — pitch/roadmap
5. center/top title, full-bleed photo mass, dense multi-box copy — proposal/SEO
6. left/top title, full-bleed photo mass, several text boxes — proposal/SEO
7. center/middle title, ~half-slide photo column, dense multi-box copy — pitch deck
8. left/middle title, ~half-slide photo column, dense multi-box copy — pitch/portfolio/history

**Ported in Part B:** (4)/(8)-style **title-bottom-left**, **photo-wide** (60/40), and **copy-over-band** (from #2 full-bleed mass with copy band above).

---

## 4–7. Kit components, typography, compile, proofs

New / extended HTML under `design-system/components/`: agenda, statement, big-number, quote (ellipse portrait — `checkGeometry` **pass**, no complex svg), process, team-grid, divider; split-copy gains title-bottom-left, photo-wide, copy-over-band.

Typography: big-number number **180px**; statement ceiling **96px** (160px overflowed bounds at maxChars=90 — noted). Kickers `letter-spacing: 0.08em` + uppercase.

**Compile:** 112 files (11 components × variants × 4 fontPairs).  
**typeScale:** `[18, 20, 22, 24, 28, 36, 48, 56, 64, 72, 96, 120, 180]`

**Roles map:**

| component | roles | variants |
| --- | --- | --- |
| cover | Cover | word / split / full-bleed |
| agenda | Contents | numbered-list / two-column |
| split-copy | About, Problem, Solution | photo-left / photo-right / title-bottom-left / photo-wide / copy-over-band |
| statement | About…Next, Contents (not Cover/Close) | left / centered / with-kicker |
| big-number | Proof, Market | left / centered / with-photo |
| quote | Proof, About | plain / portrait |
| process | Model, Next | three-step / four-step |
| team-grid | People | three / four |
| stat-row | Proof, Market | three-up / two-up |
| divider | any mid role + Contents | number / accent-block |
| close | Close | plain / photo |

**One-slide proofs** (corp-calibri, first variant, pptx gate):

| component | variant | geometry | hard fails | gate |
| --- | --- | --- | --- | --- |
| agenda | numbered-list | pass | [] | pass |
| statement | left | pass | [] | pass |
| big-number | left | pass | [] | pass |
| quote | plain | pass | [] | pass |
| process | three-step | pass | [] | pass |
| team-grid | three | pass | [] | pass |
| divider | number | pass | [] | pass |
| split-copy | title-bottom-left | pass | [] | pass |

Row stacks (`direction: "row"`) skip vertical collapse so process/team-grid stay intact.

---

## 8. brief.js

Prompt states each slot’s **maxChars inline** and that longer copy will be cut; asks for **9–11** slides covering Cover, Contents, ≥3 of About/Problem/Solution, ≥1 Proof/Market, ≥1 Model/People/Next, Close; ≥1 statement/big-number/divider; names **accentRole**.

---

## 9. Rhythm repairs (recorded fallbacks)

1. No consecutive same component+variant → swap variant else component.  
2. ≤ half slides with photo → drop photos from latest non-cover photo slides.  
3. ≥1 statement/big-number/divider → replace mid role.  
4. Exactly one valid **accentRole** (hash if missing); divider → accent-block when accent.

---

## 10. Pexels queries

`inventDirection` keywords → three queries: **subject**, **texture/abstract**, **people**. team-grid → people; cover → subject; divider/statement → none.

**Color parameter skipped** — `searchPexels` lives in `thematic.js` (out of 4f edit scope). No API color arg without touching that file.

---

## 11. composer.test.js

Rhythm cases (duplicate / photo cap / accent moment / clean / 9-slide offline) + align srcRect case — **passed**.

---

## 12. Gallery

`services/templatePipeline/composer/gallery.js` → `docs/template-pipeline/composer/gallery/index.html`.

- **36** slides (all component×variant × light-neutral, plus dark-neutral for cover / divider / big-number).
- **Geometry fails: 0.**

---

## 13. Online (curator 5055)

Restarted; log showed only `admin curator on http://127.0.0.1:5055` before generates (no prior generate). Vision off.

### 4f-a — `composer-a-corporate-payroll-company-mvr0m2xx` → `docs/template-pipeline/composer/proof-4f-a/`

| | |
| --- | --- |
| plan | Cover split → Contents agenda/numbered-list → About statement/with-kicker → Problem split-copy/photo-left → Solution photo-right → Proof big-number/centered → Model process/four-step → People team-grid/four → Next process/four-step |
| accentRole | Proof (fallbacks also recorded hash repairs during validate) |
| fallbacks | clamps, role remap Close→process on Next, rhythm accentMoment/accentRole, palette/font fills |
| fits / collapses | 1 / 21 |
| geometry | all 9 slides pass |
| hard fails | unfilled process step slots on slides 7 & 9 (score **78**, 7/9) |
| pptx gate | no pptx-mismatch in failures (pass aside from unfilled) |
| deck.qa | mode **manual**, attempt 2 |
| stack gap | 0 all slides |
| cover visual mass | **0.449** |
| photo queries | subject `laptop calculator`, texture `documents abstract`, people `people team laptop` |
| text-model calls | **3** |
| placeholders | none |
| PNGs | `proof-4f-a/slide-01.png` … `slide-09.png`, `lo-slide-1.png` … `lo-slide-9.png` |

### 4f-b — `composer-a-corporate-payroll-company-mvr0nao1` → `docs/template-pipeline/composer/proof-4f-b/`

| | |
| --- | --- |
| plan | Cover word → Contents agenda → Problem statement/with-kicker → Proof stat-row → Market divider/accent-block → Proof stat-row → Model process/three-step → Next divider/accent-block |
| accentRole | Next |
| score | **38** (3/8) — unfilled stat-row/divider/process slots + agenda item-4 pptx mismatch |
| deck.qa | mode **manual**, attempt 2 |
| cover visual mass | **0.011** (word cover) |
| photo queries | subject `laptop spreadsheet`, texture `office abstract`, people `people team laptop` |
| text-model calls | **3** |
| PNGs | `proof-4f-b/slide-01.png` … + `lo-slide-*.png` |

### Plan diff

Same component+variant at the same index: **2** of min(9,8) (expected few). Distinct decks overall.

No 402.

---

## 14. Tests

```
qaLoop test passed
semanticFilter test passed
chooseLayout test passed
generateTemplateShape test passed
dead code test passed
manualQa test passed
safeRm test passed
catalogGolden test passed (stripped 10, unstripped 10)
composer.test passed
```

No file named `assembleDeck.js` or `composeDeck.js`.

---

Stop. Do not start 4g.
