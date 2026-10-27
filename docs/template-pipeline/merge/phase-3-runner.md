# Pipeline merge — Phase 3 runner

QA loop seam + `runPipeline` for auto/pinned. Assemble, native, and remix call paths were left alone.

## Seam diff (`injectTheme`)

Before:

```js
async function injectTheme(options) {
  const settings = options || {};
  if (settings.qa === false) return themeOnce(settings);
  ...
      result = await themeOnce(Object.assign({}, settings, {
  ...
    const analysis = await analyzeDeck(generated, result.slides || []);
```

After:

```js
async function injectTheme(options, deps = {}) {
  const settings = options || {};
  const runOnce = deps.themeOnce || themeOnce;
  const analyze = deps.analyzeDeck || analyzeDeck;
  if (settings.qa === false) return runOnce(settings);
  ...
      result = await runOnce(Object.assign({}, settings, {
  ...
    const analysis = await analyze(generated, result.slides || []);
```

Nothing else in the loop body changed. `module.exports` was moved above the `require.main` block so a lazy `require("./pipeline")` from the CLI sees a complete exports object (circular-load fix; exports contents unchanged).

Existing one-argument callers (unaffected by the optional `deps` default):

| Caller | Call |
| --- | --- |
| `assemble_deck.js` | `injectTheme({ ... })` |
| `adminCatalog.js` (pre-Part B) / now `runPipeline` → `injectTheme` | one options object |
| `scripts/score_seeds.js` | `injectTheme({ ... })` |
| `mutate_layout.js` | `injectTheme({ ... })` |
| thematic CLI (now via `runPipeline`) | one options object into `injectTheme` |

## Test outputs

### qaLoop.test.js

```
qa score 85 attempt 1 (0/1)
qa score 70 attempt 1 (0/1)
qa retry 1 below 80
qa score 70 attempt 2 (0/1)
qa retry 2 below 80
qa score 70 attempt 3 (0/1)
qa score 70 attempt 1 (0/1)
qa retry 1 below 80
qa score 85 attempt 2 (0/1)
qa score 70 attempt 1 (0/1)
qa retry 1 below 80
qa score 70 attempt 2 (0/1)
qa retry 2 below 80
qa score 85 attempt 3 (0/1)
qa score 70 attempt 1 (0/1)
qa retry 1 below 80
qa score 70 attempt 2 (0/1)
qa retry 2 below 80
qa score 85 attempt 3 (0/1)
qaLoop test passed
```

Seam: `injectTheme(options, { themeOnce, analyzeDeck })`. Stub `themeOnce` writes `deck.json` under `os.tmpdir()` and records options; stub `analyzeDeck` returns queued scores.

Assertions matched real behavior. No rewrites needed.

Notes on real behavior (covered by the test):

- Try 1 `forcedBucket` is `""` unless `settings.forcedBucket` is set.
- After a fail, `usedBuckets` takes `result.report.mood.bucket`; try 2+ picks the next entry in `["light-neutral","light-warm","dark-neutral"]`.
- `assembled` and ids containing `+` are not pushed to `excludeLayouts`.

### Other characterization tests

```
semanticFilter test passed
...
chooseLayout test passed
generateTemplateShape fields: id@427, name@428, deck.name@428, deck.id@455, slides@433, slides[].url@436, slides[].name@437, analysis@443, analysis.score@443, analysis.passed@443, analysis.total@443, vibe@445, assembly.designLanguage@445, pptxUrl@450, layoutId@454
generateTemplateShape test passed
dead code test passed
```

All green after Part A and again after Part B.

## Part B diffs

### `pipeline.js` — `runPipeline`

Accepts `{ prompt, mode: "auto"|"pinned", layout, out, qa, forcedBucket, excludeLayouts, density }`.  
`auto` → `autoLayout: true`. `pinned` without `layout` throws `layout is required for mode pinned`. Other modes throw `unsupported mode`. Calls `injectTheme` with today’s option names and returns its result unchanged. Phase 2 re-exports kept. Lazy `require("./thematic")` inside `runPipeline` for the inject call.

### `adminCatalog.js`

Import:

```diff
- const { injectTheme } = require("./thematic");
+ const pipeline = require("./pipeline");
```

Final else branch only:

```diff
-          : await injectTheme({
-            prompt,
-            layout: layoutId,
-            autoLayout,
-            out: relative(dir),
-          });
+          : await pipeline.runPipeline({
+            prompt,
+            mode: autoLayout ? "auto" : "pinned",
+            layout: layoutId,
+            out: relative(dir),
+          });
```

Native / assemble / remix branches untouched. Response assembly after the call unchanged.

### thematic CLI

```js
if (require.main === module) {
  const { runPipeline } = require("./pipeline");
  const args = parseArgs(process.argv.slice(2));
  runPipeline({
    prompt: args.prompt,
    mode: args.autoLayout ? "auto" : "pinned",
    layout: args.layout,
    out: args.out,
    density: args.density,
  }).catch(...);
}
```

`parseArgs` unchanged. `--help` still throws `Unknown argument --help`. Missing layout still throws `Pass --layout health-medical.json or --auto-layout`.

## Step 7 — CLI payroll generate

Command:

```
node services/templatePipeline/thematic.js --prompt "A corporate payroll company" --auto-layout --out docs/template-pipeline/merge/phase-3-payroll
```

Earlier attempts failed on OpenRouter 402 / Gemini spend cap, then a circular-load bug (fixed by exporting before `require.main`). Re-run after Gemini returned 200:

**Attempt 1**

- semantic skip: 3D chrome, watercolor, music lesson, health-medical (all Illustration-heavy)
- layout: `blue-and-white-modern-business-proposal-presentation` (Abstract, Corporate, DNA 91)
- brand: SwiftPay Solutions
- QA: **55** (6/11) → retry

**Attempt 2**

- same semantic skips
- layout: `beige-and-brown-minimalist-creative-portfolio-presentation` (Abstract, Corporate, DNA 90)
- palette forced `light-warm`
- QA: **100** (10/10) → kept

Output: `docs/template-pipeline/merge/phase-3-payroll`. Medical seed never chosen. Both picks Abstract/Corporate. Many seed decoration image paths logged as missing on disk; that likely dragged attempt 1 under 80 and is separate from the runner wiring.

`runPipeline({ mode: "auto" })` was also stubbed offline: it forwarded `autoLayout: true` and the prompt/out paths correctly; `pinned` without layout and unsupported modes throw as specified.

## Step 8 — Admin

Confirmed no prior generate on 5055; started curator `$env:PIPELINE_PORT="5055"; node services/templatePipeline/devServer.js`. Opened `http://127.0.0.1:5055/`, typed `A corporate payroll company`, checked Auto-Select, clicked Generate.

Curator log:

```
admin curator on http://127.0.0.1:5055
qa retry 1 after fetch failed
qa retry 2 after Your project has exceeded its monthly spending cap. ...
```

Dashboard `#status` after the request:

```
Your project has exceeded its monthly spending cap. Please go to AI Studio at https://ai.studio/spend to manage your project spend cap. ...
```

No `id`, `layoutId`, `vibe`, or `analysis.score` were returned (generate threw before response assembly). No thumbnails. Ports 5000 and 3000 were not touched. The request did enter the QA retry path through `runPipeline` → `injectTheme`, so the admin wiring is live.

## Stop

Phase 3 code and tests are in place. Step 7 CLI proof completed on re-run (QA 100 on attempt 2). Step 8 admin proof was not re-run in this pass; curator still needs a generate with working Gemini when you want dashboard confirmation. Do not start Phase 4 until asked.
