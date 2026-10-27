# Pipeline merge — Phase 1 map

Read-only map of the three builders and the shared plumbing. No code was changed in this phase.

## 1. Function inventory

Signatures quoted from the current source. Line ranges are inclusive.

### thematic.js — single-seed backbone

| What | Signature | File:lines |
| --- | --- | --- |
| CLI / main entry | `async function injectTheme(options)` (also `require.main` → `injectTheme(parseArgs(...))`) | `services/templatePipeline/thematic.js` 1906–1959; CLI 1961–1966 |
| Layout pick | `async function chooseLayout(subject, exclude, knownVibe)` | 558–594 |
| One theme pass | `async function themeOnce(options)` | 1781–1900 |
| QA wrapper | `async function injectTheme(options)` with `QA_SCORE = 80`, `QA_TRIES = 3` | 1902–1959 |
| Semantic allow | `function seedFitsPrompt(seed, vibe, subject)` | 431–438 |
| Vibe classify | `async function classifyVibe(subject)` | 440–443 |
| Direction call | `async function inventDirection(subject)` | 732–753 |
| Dark shapes | `function liftDarkShapes(deck)` | 1687–1734 |
| Pexels search / download | `async function searchPexels(query, orientation)`, `async function downloadPhoto(url, file)` | 1316–1343 |
| Image assign | `function assignImages(deck, files, vibe, options)` | 1627–1653 |

`themeOnce` order of work (1781–1899): optional `chooseLayout` → load deck → `prepareCopy` → `inventDirection` → `applyMood` → `rewriteStrings` / `settleCopy` / `applyText` / `pruneSlideText` → Pexels landscape+portrait → `assignImages` → `scrimBrightPhotos` → **`applyParametric`** (1842–1848) → write `deck.json` / `replacements.json` → `renderDeck`.

`injectTheme` QA path (1906–1958): if `options.qa === false`, return `themeOnce` once. Otherwise up to `QA_TRIES` (3) attempts: call `themeOnce` with `excludeLayouts` / `knownVibe` / `forcedBucket`, run `analyzeDeck`, keep if `score >= QA_SCORE` (80). On failure, exclude that layout id (when not `"assembled"` and not a remix `a+b` id), remember the palette bucket, retry. After the last failure, `rmSync` the out dir and throw.

`applyMood` (1079–1139) always calls `liftDarkTextBackdrops`. It calls `liftDarkShapes` only when `deck.assembly` is set (1138).

Exports today: `injectTheme`, `askModel`, `searchPexels`, `downloadPhoto`, `classifyVibe`, `seedFitsPrompt`, `chooseLayout`, `liftDarkShapes`, `liftDarkTextBackdrops`, `assignImages`, and related helpers. Does **not** export `themeOnce`, `QA_SCORE`, or `inventDirection`.

### assemble_deck.js — multi-seed assembler

| What | Signature | File:lines |
| --- | --- | --- |
| Main entry | `async function assembleDeck(prompt, options)` | 379–444 |
| Outline | `async function outlineFor(prompt, designLanguage)` | 196–215 |
| Role → slide | `function pickSlide(slides, role, used, avoid)` | 217–231 |
| Archetype label | `function archetypeOf(layout, index, total)` | 103–132 |
| Compose | `function composeAssembly(seeds, outline, subject, designLanguage, avoid)` | 332–377 |
| Palette/font lock | `function lockTheme(deck, seeds, picks)` | 295–321 |
| Seed catalog | `function readSeeds()` | 134–165 |

`assembleDeck` loop (379–444): `classifyVibe` → `outlineFor` → filter seeds by `recommendedUse` and `seedFitsPrompt` → up to **3** attempts of `composeAssembly` → `injectTheme({ layout: "assembled", deck, qa: false, forcedBucket })` → own `analyzeDeck` → keep if score ≥ 80, else push used pick seeds into `avoid` and retry. Throws status 422 if none pass.

`lockTheme` (295–321): highest `qualityScore` pick wins; copies that seed’s `tokens.color` / `tokens.font`; `paintPalette` (nearest-color remapping, local to assemble) and `lockFonts`; then **`liftDarkShapes(deck)`** and **`liftDarkTextBackdrops(deck)`**.

Roles: `Cover, Contents, About, Problem, Solution, Proof, Market, Model, People, Next, Close` (20). Matching is via `ROLE_ARCHETYPES` + `archetypeOf`, not via seed-native role labels.

Exports: `assembleDeck`, `readSeeds`, `archetypeOf`. Does not export `pickSlide`, `lockTheme`, `outlineFor`, `composeAssembly`.

### thematic-native.js — native archetypes

| What | Signature | File:lines |
| --- | --- | --- |
| Main entry | `async function generate(options)` | 988–1022 |
| Load archetype | `function loadArchetype(name, style)` | 147–155 |
| Build deck | `function buildDeck(order, copy, photos, subject, style, creative, niche)` | 806–864 |
| Draft copy | `async function draftCopy(subject)` | 978–986 |
| Photos | `async function savePhotos(copy, outDir, style, subject, treat)` | 921–969 |

`loadArchetype` reads `app-library/native/<FILES[name]>` or `app-library/native/creative/...` when `style === "creative"`. Each file is a single-layout object with its own `tokens` and `layout.elements` (absolute 1600×900 boxes). `buildDeck` clones one archetype per role in `order`, applies copy/photos/niche, and assembles `layoutSequence` / `layouts` / `tokens`.

`generate` does **not** call `injectTheme`, `classifyVibe`, `chooseLayout`, `applyParametric`, `liftDarkShapes`, or the 80 QA loop. It uses its own `askModel` prompt via `draftCopy`, its own Pexels path under `photos/native/`, `renderNativeDeck`, and optional PPTX export. Default length is **10** slides (`DECK`), with `next` left on disk in `LIBRARY` (11 names).

Exports: `generate`, `settleCopy`, `orderOf`, `buildDeck`, `styleOf`, `nicheName`, `LIBRARY`, `DECK`, `NICHES`.

### injectTheme / QA (lives in thematic.js)

Already listed above. Call sites that pass `qa: false`:

- `assemble_deck.js` 400–406
- `scripts/score_seeds.js` 95 (`injectTheme({ prompt, layout, out, qa: false })`)
- `mutate_layout.js` `remixSeeds` 636–642

Admin single-seed / Auto-Select path calls `injectTheme` **without** `qa: false`, so the 80 loop is on (`adminCatalog.js` 210–215).

### applyParametric and signature.js

| What | Signature | File:lines |
| --- | --- | --- |
| Parametric entry | `function applyParametric(deck, options)` | `parametric.js` 589–621 |
| Signature inject | `function injectSignature(deck, prompt, palette)` | `signature.js` 53–67 |
| Signature pick | `function pickSignature(prompt)` | `signature.js` 22–24 |

`applyParametric(deck, options)` inputs used today: `options.prompt`, `options.density` (default `"balanced"`), `options.seedTokens` (color palette for cover), `options.title`, `options.photoUrl`. Decisions: density scale (`applyDensity`), cover pattern via `replaceCover` / `pickCover` (Oversized Word / Full-Bleed / Split Field from prompt hash), `injectSignature` (frame or rail), type contrast (`applyTypeContrast`), then `auditGeometry`. Returns `deck.parametric` summary.

Only called from `themeOnce` in thematic.js. Assemble gets it only because it routes through `injectTheme`. Native never calls it.

### pipeline.js

```1:7:services/templatePipeline/pipeline.js
/**
 * Generation is gone.
 * Convert a deck with services/templatePipeline/convert/pptxToDeck.js.
 * Mutate a seed with services/templatePipeline/mutate.js.
 */

module.exports = {};
```

Empty stub. No router, no imports of the three builders.

### Admin routes that call a builder

**Curator** `devServer.js` 119–167: loopback-gated `/api/admin/*`. The only route that invokes a builder is:

- `POST /api/admin/generate-template` → `generateTemplate(body)` from `adminCatalog.js` (136–138)

Related admin routes that do **not** generate a themed deck: `GET /layouts`, `POST /upload-seed`, `POST /score-seed` (calls `scoreLayout` → `scoreSeed`), `POST /disable-seed`, `GET /preview/:id/:name`, `GET /download/:id`, `POST /publish-template`, `POST /discard-template`.

**Full API** `routes/adminTemplateRoutes.js` (mounted at `/api/admin` behind JWT + admin in `server.js`): same `generateTemplate` on `POST /generate-template` (29–32). Same catalog helpers; no other builder call.

**`adminCatalog.generateTemplate`** (178–245) is the real switch:

1. `native` / niche → `require("./thematic-native").generate(...)`
2. else `assemble` → `assembleDeck(prompt, { out })`
3. else `remix` → `remixSeeds(layoutId, layoutIdB, { prompt, out })`
4. else → `injectTheme({ prompt, layout, autoLayout, out })` (QA on)

Also: `scripts/auto_generate.js` calls `generateTemplate({ prompt, autoLayout: true })`.

### score_seeds.js and mutate_layout.js

| Caller | How |
| --- | --- |
| `scripts/score_seeds.js` `scoreSeed` | `injectTheme({ prompt: "A company overview.", layout: layoutId, out, qa: false })` then its own `analyzeDeck` (95–97). Pinned layout. No assemble, no native. |
| `mutate_layout.js` `remixSeeds` | Builds a remix deck, then `injectTheme({ prompt, layout: seedA+"+"+seedB, deck, out, qa: false })`, post-processes photos/contrast, re-renders, `analyzeDeck`, keeps only if score ≥ 80, up to `THEMED_TRIES` (2) (619–690). |

### `services/templatePipeline/*.test.js`

| File | Covers |
| --- | --- |
| `antiTells.test.js` | Old anti-tell flags (serif-on-cream, etc.) |
| `catalogCaps.test.js` | Catalog 20% / 50-deck caps, palette buckets, `pickCapped` |
| `deadCode.test.js` | Asserts old `assembleDeck.js` / `composeDeck.js` filenames are **absent**; `generateDeck` only exports `validateDeck`; `reasonDeck.buildStrategy` undefined |
| `decorations.test.js` | Decoration library families and `gateFailures` on a bare deck |
| `fitText.test.js` | `textOverflow` for wide serif / mono |
| `fontRoles.test.js` | Display vs body font role picks |
| `inventBrief.test.js` | Old brief invent parser / font casing (inventor path) |
| `learn.test.js` | Taste `recordReview` strategy buckets (inventor path) |
| `reasonDeck.test.js` | Composition job / strategy spread (inventor path) |
| `similarity.test.js` | Fingerprint / strategy similarity |

There is **no** test file for `thematic.js`, `assemble_deck.js`, `thematic-native.js`, `chooseLayout`, `seedFitsPrompt`, `injectTheme` QA, or `pipeline.js`.

---

## 2. Shared steps

| Step | Single seed (thematic) | Assemble | Native | Same? |
| --- | --- | --- | --- | --- |
| Classify vibe | `classifyVibe` inside `chooseLayout` / logged in `themeOnce` | `classifyVibe` in `assembleDeck` | none (uses `styleOf` / niche) | **Different** for native; assemble and thematic share one function |
| Pick design language / seed | `chooseLayout` + `seedFitsPrompt` | filter `readSeeds` by `recommendedUse` + `seedFitsPrompt`; theme seed = highest pick in `lockTheme` | none | **Similar** filter, **different** pick (one seed vs multi-slide catalog) |
| Outline | none (uses seed’s own `layoutSequence`) | `outlineFor` → 11 roles | `orderOf` on model JSON; fixed 10-slide `DECK` | **Different** |
| Source slides | whole seed via `loadLayout` | `composeAssembly` / `pickSlide` | `loadArchetype` + `buildDeck` | **Different** |
| Brand / mood / keywords | `inventDirection` (one JSON call) | same, via `injectTheme` → `themeOnce` | `draftCopy` / `settleCopy` (separate prompt shape) | **Different** (native drift) |
| Rewrite strings | `rewriteStrings` / `settleCopy` / `applyText` | same via inject | `applyCopy` by element id | **Different** for native |
| Palette | `applyMood` (bucket nudge) | `lockTheme` paint then `applyMood` again inside inject | native / niche / night tokens in `buildDeck` | **Drift**: assemble locks first, then mood recolors; thematic only moods; native never uses `applyMood` |
| Fonts | seed fonts stay; parametric may contrast weights | `lockFonts` in `lockTheme` | archetype / niche fonts | **Different** |
| liftDarkShapes | only if `deck.assembly` in `applyMood`; also assemble `lockTheme` | `lockTheme` + again via `applyMood` when assembly set | never | **Duplicated** on assemble path (lock + applyMood) |
| liftDarkTextBackdrops | `applyMood` always | `lockTheme` then again in `applyMood` | never | **Duplicated** on assemble |
| Pexels | `searchPexels` + `assignImages` under `photos/thematic/` | same via inject | `savePhotos` under `photos/native/`, role-keyed assignment | **Similar** API (`searchPexels`), **different** download layout and assign |
| Asset / decoration policy | `assignImages` keeps seed decorations; minimalist deletes | same via inject | no seed decorations; niche stickers | **Different** for native |
| applyParametric | yes in `themeOnce` | yes only because inject runs | no | **Identical** when inject runs; native gap |
| Render | `renderDeck` → `renderSlidePng` | same via inject | `renderNativeDeck` | **Similar** (slideSvg family), **different** entry |
| QA ≥ 80 | `injectTheme` loop (3 tries, seed/palette) | own loop (3 tries, avoid seeds) + inject `qa: false` | none (geometry log only) | **Similar** threshold, **different** retry strategy; native missing |
| Out dir / report | `themeOnce` writes `deck.json` + `replacements.json` | same files + `assembly` on deck | `deck.json` + optional pptx; no `replacements.json` | **Different** report shape |

Notable drift (same step, two implementations):

1. **QA retry**: thematic excludes layouts and rotates palette buckets; assemble avoids seed ids used in picks and forces buckets; remix has a third loop (`THEMED_TRIES`).
2. **Palette paint**: assemble `paintPalette` nearest-maps every hex; thematic `applyMood` maps by fill role. Both can run on an assembled deck.
3. **Direction vs draftCopy**: different prompts and JSON shapes for brand/mission/mood/photos.
4. **Photo roots**: `photos/thematic/` vs `photos/native/` (adminCatalog cleans both).
5. **Outline length**: assemble 11 roles including Next; native 10 omitting Next by default; single seed uses whatever the PPTX had.

---

## 3. Builder-specific steps (router interfaces)

These cannot be replaced by shared plumbing. Proposed exports for a future `pipeline.js` router:

| Capability | Today | Proposed API | Inputs | Outputs |
| --- | --- | --- | --- | --- |
| Pick primary seed | `chooseLayout` | `selectPrimarySeed(subject, { exclude, knownVibe })` | prompt, exclude ids, optional vibe | `{ id, vibe, qualityScore, semanticType, model }` |
| Fill outline from one seed | implicit (use all slides) | `slidesFromSeed(seedId, outline)` | seed id, role outline | ordered `{ role, seedId, slideId, source: "primary" }[]` plus unmatched roles |
| Sibling borrow | `pickSlide` / `composeAssembly` (any same vibe) | `borrowSiblingSlide(role, { recommendedUse, semanticType, excludeSeeds, used })` | role, language filters, avoid set | one pick `{ seedId, slideId, archetype }` or null |
| Theme lock to primary | assemble `lockTheme` (winner = highest among picks) | `lockToSeed(deck, primarySeedId)` | assembled deck, primary id | deck with primary tokens/fonts; shapes lifted |
| Native gap fill | `loadArchetype` + partial `buildDeck` | `renderNativeRole(role, { tokens, fonts, style, niche })` | role name, host seed tokens | one layout object already painted to host palette (or null if role missing) |
| Compose final deck JSON | `composeAssembly` or `loadLayout` or `buildDeck` | `composeDeck({ primary, picks, outline, subject })` | primary seed + pick list | schemaVersion 2 deck ready for theme/inject |
| Native full generate (legacy CLI) | `generate` | keep as `generateNative(options)` wrapper | prompt, out, creative, niche | current native return shape |

Router-facing shared entry (proposed, not implemented):

`async function runPipeline(options)` where `options.mode` is `"auto" | "pinned" | "assemble-legacy" | "native-legacy" | "remix"`, plus `prompt`, `layout`, `out`, `qa`, `forcedBucket`, `excludeLayouts`, niche/creative flags. Return a **normalized** result: `{ outDir, slides, report?, layout, name, deckId, selection?, assembly?, analysis?, native? }` so adminCatalog stops branching on three shapes.

---

## 4. Must-keep behaviors → enforcing functions

| Must-keep | Enforced by |
| --- | --- |
| Auto-Select: vibe + score ≥ 70 + enabled/semantic | `chooseLayout` + `seedFitsPrompt` + `seedScores` (`thematic.js`) |
| Illustration-heavy only on industry match; disabled chrome has no industry | `seedFitsPrompt` / `industryMatch` (`thematic.js`); assemble also filters via `seedFitsPrompt` in `assembleDeck` |
| One direction call `{ brand, industry, mission, mood, keywords }` | `inventDirection` + `directionPrompt` (`thematic.js`); native uses a **different** path (`draftCopy`) |
| OpenRouter first, Gemini credit fallback | `askModel` (`thematic.js`); native reuses it |
| QA score ≥ 80, up to 3 tries, delete out dir on total failure | `injectTheme` (`thematic.js`); assemble duplicates the gate in `assembleDeck`; remix duplicates in `remixSeeds`; score_seeds deliberately off (`qa: false`) |
| score_seeds / remix pass `qa: false` | `scoreSeed`, `remixSeeds`, assemble’s inject call |
| Asset injection off; decorations kept unless minimalist | `assignImages` + `minimalistRequest` / `removeDecoration` (`thematic.js`) |
| Pexels for real photo slots | `searchPexels` / `downloadPhoto` / `assignImages` (thematic); native `savePhotos` |
| Dark shape lift on dark assembled backgrounds | `liftDarkShapes` (`thematic.js`); called from assemble `lockTheme` and from `applyMood` when `deck.assembly` |
| Parametric cover / density / signature | `applyParametric` → `injectSignature` (only on inject path) |
| Text-overlap geometry > 40% of smaller box | `checkGeometry` in `scoring/analyzeDeck.js` (also remix `geometryOk`) |
| Catalog 20% cap throw | `catalogCaps.js` (old inventor path; do not change) |
| Do not revive inventBrief / reasonDeck / gates / generateDeck / learn as the live builder | `pipeline.js` stub + `deadCode.test.js` expectations; leave those modules untouched for this merge |
| Admin generate switch | `adminCatalog.generateTemplate`; curator `devServer` and `adminTemplateRoutes` only call that |
| Do not overwrite `docs/template-pipeline/native/corporate-payroll` | process constraint (no code gate); native default out is `docs/template-pipeline/native/<slug>` |

---

## 5. Implementation plan (ordered phases)

Each phase ends with a report under `docs/template-pipeline/merge/` and a stop. No phase in this document has been started except this map.

### Phase 2 — Normalize the contract (no behavior change)

- **Files:** `pipeline.js` (re-export wrappers), optionally thin adapters in `adminCatalog.js` comments only if needed later; prefer `pipeline.js` exporting `{ injectTheme, assembleDeck, generateNative, remixSeeds }` facades that call today’s modules unchanged.
- **Must stay identical:** return values of `generateTemplate`, CLI argv of the three builders, `qa: false` callers.
- **Proof:** `node -e` requiring `pipeline.js` and asserting the same function references; run `node services/templatePipeline/deadCode.test.js`; no generate.

### Phase 3 — Shared runner shell around thematic

- **Files:** `pipeline.js` (`runPipeline` for pinned + auto only), `thematic.js` CLI becomes `runPipeline` wrapper, `adminCatalog` auto/pinned branch calls `pipeline.runPipeline`.
- **Must stay identical:** `chooseLayout`, `injectTheme` QA, `themeOnce` order, photo paths, report fields used by admin UI (`vibe`, `layoutId`, slides).
- **Proof:** CLI Auto-Select `"A corporate payroll company"` → same semantic skip list behavior; admin click Auto-Select once; compare `replacements.json` layout id class (Abstract/Photo-driven). Report `phase-3-runner.md`.

### Phase 4 — Primary-seed outline fill

- **Files:** new helper (e.g. `compose_from_seed.js` or functions inside `pipeline.js`), `assemble_deck.js` only if extracting `outlineFor` / `archetypeOf` without changing assemble CLI yet.
- **Must stay identical:** `outlineFor` role list; single-seed when every role maps; semantic filter on primary pick.
- **Proof:** unit-style script: given a known seed id + default outline, list which roles map to which slide indexes; no LLM generate required if outline is injected. Report `phase-4-primary-fill.md`.

### Phase 5 — Sibling borrow under same recommendedUse **and** semanticType

- **Files:** extract/adapt `pickSlide` + catalog; filter siblings by `semanticType` matching primary (stricter than today’s assemble).
- **Must stay identical:** `seedFitsPrompt` for the prompt; disabled seeds stay out unless industry match; primary tokens win via `lockToSeed`.
- **Proof:** fixture prompt that forces a short Corporate Abstract seed; log borrow sources; assert no Illustration-heavy sibling. Optional generate under `docs/template-pipeline/merge/phase-5-...`. Report `phase-5-sibling.md`.

### Phase 6 — Native as last-resort role fill

- **Files:** `thematic-native.js` export a single-role loader that accepts host `tokens`; `pipeline` compose step; do not change full `generate` CLI output path defaults that could hit `native/corporate-payroll`.
- **Must stay identical:** full native CLI `generate` for `--mode native` / niche until Phase 8; host seed palette/fonts after paint.
- **Proof:** call `renderNativeRole("Proof", { tokens from beige seed })` offline; geometry check; no write under `docs/template-pipeline/native/corporate-payroll`. Report `phase-6-native-gap.md`.

### Phase 7 — One QA / direction / Pexels path

- **Files:** assemble stops owning a separate 80 loop (calls `runPipeline` with `qa: true` or shared `themeUntilAccepted`); remove double `liftDarkShapes` where safe; native gap slides enter the same inject path.
- **Must stay identical:** QA_SCORE 80, QA_TRIES 3, score_seeds/remix `qa: false`, OpenRouter→Gemini fallback.
- **Proof:** assemble-mode admin generate once; score_seeds on one seed still writes hybrid score without forcing 80; compare attempt logs. Report `phase-7-shared-qa.md`.

### Phase 8 — Retire parallel builders in admin

- **Files:** `adminCatalog.generateTemplate` always goes through `pipeline.js`; assemble/native flags become gap-fill options or legacy aliases; CLIs of `assemble_deck.js` / `thematic-native.js` thin wrappers.
- **Must stay identical:** HTTP response shape fields the dashboard reads (`id`, `slides`, `vibe`, `assembly`, `analysis`, `layoutId`).
- **Proof:** browser: Auto-Select, Assemble checkbox, Native/niche path each once; `deadCode.test.js` still green; report `phase-8-admin.md`.

### Phase 9 — Cleanup and docs

- **Files:** README template-pipeline section, this merge folder summary; delete only confirmed-dead duplicate loops; still do not delete inventor modules.
- **Proof:** link checklist of CLIs; one payroll Auto-Select regression. Report `phase-9-done.md`.

---

## 6. Risks

### Sibling-seed borrowing and “one grid”

Seeds are stored as full independent decks: each slide is a layout with its own absolute `x/y/width/height` on 1600×900. Assemble today **clones whole slides** from different seeds, then nearest-maps colors and locks fonts. That is **not** the same as placing foreign content into the primary seed’s column grid or margin system. Sibling borrow can share **palette and fonts** easily (`lockTheme` / proposed `lockToSeed`). Sharing **spacing and shape vocabulary** would need either (a) accept whole-slide borrow as “close enough,” or (b) a new remapper that fits borrowed elements into empty frames from the primary seed. No seed JSON today exposes a reusable grid template separate from its slides. **Risk: high** for the letter of the final shape; medium if whole-slide borrow + theme lock is accepted as Phase 5.

### Native archetypes inside another seed’s grid

Native files under `app-library/native/` are also absolute layouts (e.g. `native-cover.json` has its own tokens and full-bleed fields). `loadArchetype` returns that layout as-is. Painting host colors onto native shapes is feasible; **reflowing** native elements into the primary seed’s margins, rails, and type sizes is not implemented. Parametric signature/cover would fight a pasted native cover. **Risk: high** for true in-grid render; medium for “last resort whole slide painted to host tokens.”

### Export / admin / test coupling

- `generateTemplate` return shape differs by mode (`assembly` vs `remix` vs native `pptxUrl` / no `report.vibe` from inject). Router must preserve fields or the dashboard breaks.
- `injectTheme` return lacks `assembly` / `analysis` unless QA ran; assemble adds them; native returns `deck`/`copy`/`order` instead.
- `deadCode.test.js` forbids a file named `assembleDeck.js` next to the pipeline (camelCase). A new file must not reuse that name; `assemble_deck.js` is fine.
- Almost all `*.test.js` files target the **retired inventor**. They will not catch merge regressions. New tests are required for `seedFitsPrompt`, compose order, and `runPipeline` modes.
- `score_seeds.js` and `mutate_layout.js` require `./thematic`’s `injectTheme` directly. Moving the function without a re-export breaks scoring and remix.
- Assemble currently passes `layout: "assembled"` so inject’s QA exclusion skips pushing that id (string check). A unified runner must keep that behavior or retries will mis-exclude.
- Native writes PPTX during generate; seed path does not. Admin `pptxUrl` depends on that. Unifying without an export step changes the UI.
- Double application of `applyMood` after `lockTheme` can undo or reshape the locked palette; any merge that keeps both must define one winner (brief says primary seed is the law).

### Process risks

- Running a generate against default native out paths can collide with existing `docs/template-pipeline/native/*` (including corporate-payroll). Phase generates should use `docs/template-pipeline/merge/...` only.
- Curator holds themed modules in memory; `pipeline.js` / thematic changes need a restart for admin proof, without killing a mid-job process.

---

## Stop

Phase 1 complete. No source edits. No generates. No git. Do not start Phase 2 until asked.
