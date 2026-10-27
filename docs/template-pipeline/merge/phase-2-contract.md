# Pipeline merge — Phase 2 contract

Characterization of the live builders. Gap-fill decision: whole-slide borrow painted to the primary seed’s tokens (no grid reflow). Lock/mood double paint stays until Phase 7.

## Export diffs

### thematic.js

`module.exports` gained `themeOnce`, `inventDirection`, `QA_SCORE`, `QA_TRIES`. Function and constant bodies were not moved or edited.

Before: exported `injectTheme`, `askModel`, …, `pruneSlideText` (no `themeOnce` / `inventDirection` / QA constants).

After: same list plus `themeOnce`, `inventDirection`, `QA_SCORE`, `QA_TRIES`.

Verified: `typeof themeOnce` / `inventDirection` → `function`; `QA_SCORE` → `80`; `QA_TRIES` → `3`.

### assemble_deck.js

`module.exports` gained `pickSlide`, `lockTheme`, `outlineFor`, `composeAssembly`. Bodies unchanged.

Before: `{ assembleDeck, readSeeds, archetypeOf }`.

After: `{ assembleDeck, readSeeds, archetypeOf, pickSlide, lockTheme, outlineFor, composeAssembly }`.

Verified: all four new exports are `function`.

### pipeline.js

Replaced the empty stub with a facade that re-exports by reference:

- `injectTheme`, `chooseLayout`, `seedFitsPrompt`, `classifyVibe` from `./thematic`
- `assembleDeck` from `./assemble_deck`
- `generate` as `generateNative` from `./thematic-native`
- `remixSeeds` from `./mutate_layout`

Comment states this is not the old inventor. No `runPipeline`.

Verified: `pipeline.injectTheme === thematic.injectTheme` → `true`; `pipeline.assembleDeck === assemble.assembleDeck` → `true`; `generateNative` and `remixSeeds` are functions.

Call sites unchanged: `adminCatalog.js`, `score_seeds.js`, `mutate_layout.js`, `devServer.js`, `adminTemplateRoutes.js` still require what they required before.

## Test runs

### semanticFilter.test.js

Command: `node services/templatePipeline/semanticFilter.test.js`

```
semanticFilter test passed
```

Seam: real `seedFitsPrompt` from `./thematic`. Keyword table read from the `lists` object inside `industryMatch` in `thematic.js` (parsed from source), then each `lists.health` word asserted via `seedFitsPrompt`. `industryMatch` itself is not exported; behavior is covered through `seedFitsPrompt`.

### chooseLayout.test.js

Command: `node services/templatePipeline/chooseLayout.test.js`

```
semantic skip seed-ill [Illustration-heavy]
semantic type Abstract
semantic skip seed-ill [Illustration-heavy]
semantic type Abstract
semantic type Abstract
chooseLayout test passed
```

Seam: `seedScores` closes over `fs` and `LIBRARY`. The test patches `fs.readdirSync` / `fs.existsSync` / `fs.readFileSync` for paths under `app-library` and returns fixture DNA. `knownVibe: { vibe: "Corporate" }` is passed so `classifyVibe` / `askModel` never run; `global.fetch` throws if the network is touched. Corporate vibe avoids the Photo-heavy `loadLayout` branch.

### qaLoop.test.js

**Skipped. File not written.**

Seam is not reachable without a hook. `injectTheme` calls the closed-over `themeOnce` and the `analyzeDeck` binding from its module scope. Patching `module.exports.themeOnce` does not change that call. Stubbing `scoring/analyzeDeck` before reload still leaves a real `themeOnce` (LLM + Pexels + disk). No test hook was added.

### generateTemplateShape.test.js

Command: `node services/templatePipeline/generateTemplateShape.test.js`

```
generateTemplateShape fields: id@427, name@428, deck.name@428, deck.id@455, slides@433, slides[].url@436, slides[].name@437, analysis@443, analysis.score@443, analysis.passed@443, analysis.total@443, vibe@445, assembly.designLanguage@445, pptxUrl@450, layoutId@454
generateTemplateShape test passed
```

Seam: reads `docs/template-pipeline/admin-dashboard/index.html` only. Constant `GENERATE_TEMPLATE_FIELDS` (exported) lists each field with the dashboard line number. No `generateTemplate` call.

Fields pinned for Phase 8:

| Field | index.html line |
| --- | --- |
| id | 427 |
| name | 428 |
| deck.name | 428 |
| deck.id | 455 |
| slides | 433 |
| slides[].url | 436 |
| slides[].name | 437 |
| analysis | 443 |
| analysis.score | 443 |
| analysis.passed | 443 |
| analysis.total | 443 |
| vibe | 445 |
| assembly.designLanguage | 445 |
| pptxUrl | 450 |
| layoutId | 454 |

### deadCode.test.js

Command: `node services/templatePipeline/deadCode.test.js`

```
dead code test passed
```

Unchanged. Green after Part A.

## Phase 1 map check (item 10)

The map line “Roles: … (20)” was wrong. Real counts in `assemble_deck.js`:

- `ROLES` length: **11** — Cover, Contents, About, Problem, Solution, Proof, Market, Model, People, Next, Close
- `ROLE_ARCHETYPES` keys: **11**, same names in the same order
- `outlineFor` asks for those 11 roles and accepts only that ordered array

Elsewhere the map correctly said 11. There is no second role list of 20. The “(20)” annotation was a map typo.

## Import resolve (item 11)

PowerShell here-string piped to node (intercepts `Module.prototype.require` while loading the two callers):

```powershell
@'
const Module = require("module");
const orig = Module.prototype.require;
const hits = [];
Module.prototype.require = function (id) {
  const exp = orig.apply(this, arguments);
  if (/thematic$|thematic\.js$/.test(String(id)) && exp && typeof exp.injectTheme === "function") {
    hits.push({ from: this.filename || "unknown", typeofInject: typeof exp.injectTheme });
  }
  return exp;
};
require("./scripts/score_seeds");
require("./services/templatePipeline/mutate_layout");
hits.forEach((hit) => console.log(hit.from.split("Techinoid").pop() + " imported injectTheme => " + hit.typeofInject));
console.log("hitCount", hits.length);
'@ | node
```

Output:

```
\Slidexy-BE\scripts\score_seeds.js imported injectTheme => function
\Slidexy-BE\services\templatePipeline\mutate_layout.js imported injectTheme => function
hitCount 2
```

Both callers still resolve `injectTheme` as a function from `./thematic` (via their existing relative requires).

## Stop

Phase 2 complete. No generates, no score_seeds run, no curator restart, no git. Do not start Phase 3 until asked.
