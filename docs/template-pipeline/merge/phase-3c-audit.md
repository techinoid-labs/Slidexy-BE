# Pipeline merge — Phase 3c audit

Offline: manual-mode contract + library asset audit. Vision stays off (`VISION_QA` default `"0"`). No Part C (text-model credit not confirmed in this session).

## 1. Manual mode contract

### `writeQa`

```1918:1936:services/templatePipeline/thematic.js
async function writeQa(result, analysis, attempt, mode) {
  const summary = {
    score: analysis.score,
    passed: analysis.passed,
    total: analysis.total,
    failures: analysis.failures,
    attempt,
    mode: mode || (analysis.vision === false ? "manual" : "vision"),
  };
  result.analysis = summary;
  if (result.report) result.report.analysis = summary;
  const generated = JSON.parse(fs.readFileSync(path.join(result.outDir, "deck.json"), "utf8"));
  generated.qa = summary;
  fs.writeFileSync(path.join(result.outDir, "deck.json"), JSON.stringify(generated, null, 2) + "\n");
  if (result.report) {
    fs.writeFileSync(path.join(result.outDir, "replacements.json"), JSON.stringify(result.report, null, 2) + "\n");
  }
  return summary;
}
```

### Manual branch of `injectTheme`

```1943:1949:services/templatePipeline/thematic.js
  if (settings.qa === "manual" || !visionQaEnabled(settings)) {
    const result = await runOnce(settings);
    const generated = JSON.parse(fs.readFileSync(path.join(result.outDir, "deck.json"), "utf8"));
    const analysis = await analyze(generated, result.slides || [], { vision: false });
    const summary = await writeQa(result, analysis, 1, "manual");
    console.log("qa manual geometry " + summary.score + " (" + summary.passed + "/" + summary.total + ") — review slides before publish");
    return result;
  }
```

| Behavior | Answer |
| --- | --- |
| Under `QA_SCORE` 80 | **Keeps** `outDir` and **returns** `result`. Does not discard, does not throw. |
| Retry? | **Never.** Single `runOnce` + one `analyze` with `vision: false`. |
| `deck.json` `qa` / returned `result.analysis` | `{ score, passed, total, failures, attempt: 1, mode: "manual" }` |

(`qa: false` still short-circuits before this branch: one theme, no analyze.)

## 2. Assemble / mutate with vision off

Both pass `qa: false` into `injectTheme` (so injectTheme does no QA), then run their own `analyzeDeck`:

```411:411:services/templatePipeline/assemble_deck.js
    const analysis = await analyzeDeck(saved, themed.slides, { vision: !manual });
```

```663:663:services/templatePipeline/mutate_layout.js
    analysis = await analyzeDeck(painted, themed.slides, { vision: !manual });
```

`manual = !visionQaEnabled(options)`. With default `VISION_QA` off, `manual` is true → they pass **`vision: false`**. They do **not** call vision in that state. If `VISION_QA` were on (or `vision`/`qa` forced true), `vision: !manual` would be `true` and they would invoke vision. Not fixed in this phase.

## 3. Characterization tests

`qaLoop.test.js` previously could reach the retry loop only when vision was enabled (shell `VISION_QA` or options). It was updated so vision-gate cases pass **`qa: true` explicitly** (deterministic; independent of shell env). Manual case asserts: `themeOnce` ×1, `analyzeDeck` ×1 with `vision: false`, under-80 **keeps** `outDir`.

```
qaLoop test passed
semanticFilter test passed
chooseLayout test passed
generateTemplateShape test passed
dead code test passed
manualQa test passed
```

(Five merge characterization tests + `manualQa.test.js` all green.)

## 4. Library asset audit

Rule: image urls under `photos/…` resolved like `loadPhoto` — `PHOTO_ROOT = generated-templates`, file at `generated-templates/<url after stripping generated-templates/>`. Split by `isDecoration || originalRole === "decoration"`. Skip `app-library/native/` and `app-library/published/`. Sorted by `qualityScore` descending.

| id | semanticType | recommendedUse | qualityScore | disabled | photo refs | photo missing | deco refs | deco missing |
| --- | --- | ---: | ---: | --- | ---: | ---: | ---: | ---: |
| black-and-white-minimalist-pitch-deck-presentation | Photo-driven | Photo-heavy | 100 | false | 9 | 9 | 13 | 13 |
| red-black-neon-cinema-presentation | Photo-driven | Text-heavy | 100 | false | 0 | 0 | 20 | 20 |
| yellow-and-blue-illustrative-modern-geometric-health-medical-presentation | Illustration-heavy | Corporate | 100 | true | 0 | 0 | 23 | 23 |
| black-and-grey-3d-shapes-tech-company-presentation | Illustration-heavy | Corporate | 93 | true | 0 | 0 | 62 | 62 |
| blue-and-white-modern-business-proposal-presentation | Abstract | Corporate | 91 | false | 1 | 1 | 28 | 28 |
| beige-and-brown-minimalist-creative-portfolio-presentation | Abstract | Corporate | 90 | false | 0 | 0 | 64 | 64 |
| purple-modern-creative-portfolio-presentation | Abstract | Corporate | 90 | false | 0 | 0 | 49 | 49 |
| seo-competitor-analysis-slides | Photo-driven | Photo-heavy | 90 | false | 33 | 33 | 102 | 102 |
| blue-violet-and-pink-simple-strategy-roadmap-presentation | Abstract | Corporate | 89 | false | 1 | 1 | 82 | 82 |
| geometric-history-of-graphic-design-slides | Abstract | Corporate | 88 | false | 10 | 10 | 43 | 43 |
| soft-green-and-beige-simple-doodles-product-timeline-presentation | Illustration-heavy | Photo-heavy | 84 | false | 21 | 21 | 194 | 194 |
| white-minimal-photography-portfolio-presentation | Photo-driven | Corporate | 80 | false | 11 | 11 | 15 | 15 |
| orange-and-black-geometric-brand-guideline-presentation | Abstract | Corporate | 76 | false | 0 | 0 | 18 | 18 |
| modern-geometric-music-lesson-plan | Illustration-heavy | Corporate | 75 | false | 2 | 2 | 49 | 49 |
| brown-and-beige-vintage-watercolor-creative-portfolio-presentation | Illustration-heavy | Corporate | 72 | false | 0 | 0 | 151 | 151 |
| first-aid-medicine-life-skills-presentation | Illustration-heavy | Photo-heavy | 72 | true | 12 | 12 | 31 | 31 |
| black-and-white-minimalist-creative-portfolio-presentation | Abstract | Text-heavy | 70 | false | 3 | 3 | 9 | 9 |
| green-modern-brand-strategy-presentation-10-page | Abstract | Text-heavy | 70 | false | 0 | 0 | 18 | 18 |
| pitch-deck-competitor-analysis-slides | Photo-driven | Photo-heavy | 65 | false | 15 | 15 | 82 | 82 |
| blue-and-beige-modern-social-media-marketing-presentation | Abstract | Text-heavy | 60 | false | 1 | 1 | 104 | 104 |
| red-minimalist-company-profile-presentation | Abstract | Corporate | 60 | false | 0 | 0 | 17 | 17 |
| personal-trainer-portfolio-black-and-beige-modern-minimal-presentation | Photo-driven | Photo-heavy | 53 | false | 21 | 21 | 140 | 140 |
| blue-and-purple-gradient-pitch-deck-presentation | Abstract | Corporate | 50 | false | 2 | 2 | 50 | 50 |
| orange-and-black-modern-pitch-deck-presentation | Abstract | Text-heavy | 50 | false | 0 | 0 | 14 | 14 |
| red-and-black-bold-modern-digital-marketing-presentation | Abstract | Corporate | 50 | false | 0 | 0 | 13 | 13 |
| red-and-purple-3d-modern-background-pitch-deck | Photo-driven | Photo-heavy | 40 | false | 51 | 51 | 62 | 62 |
| dependent-and-independent-variables-lesson-for-middle-school | Photo-driven | Photo-heavy | 33 | false | 28 | 28 | 69 | 69 |
| purple-and-white-modern-gradient-business-pitch-deck-presentation | Abstract | Corporate | 27 | false | 1 | 1 | 44 | 44 |
| purple-and-white-modern-startup-pitch-deck-presentation | Abstract | Text-heavy | 10 | false | 1 | 1 | 37 | 37 |

Every seed with photo/deco refs is **fully missing** on disk (refs > 0 and missing == refs). Matches Phase 3b for blue-and-white (0/29).

## 5. `generated-templates/photos/<id>/`

| directory | image file count | notes |
| --- | ---: | --- |
| `thematic/` | 10 | runtime download cache; not a library seed id |

No `generated-templates/photos/<seed-id>/` directories exist for any `app-library/*.json` seed. Nothing orphaned to a seed id; only `thematic/`.

## 6. Convert path (photos extract) — not run

Header + writer:

```1:7:services/templatePipeline/convert/pptxToDeck.js
/**
 * Converts one .pptx into a schemaVersion 2 deck.
 * Pictures are written under generated-templates/photos/<deck-id>/.
 * ...
 *   node services/templatePipeline/convert/pptxToDeck.js <input.pptx> <deck-id>
 */
```

```459:503:services/templatePipeline/convert/pptxToDeck.js
function convertPptx(inputPath, deckId) {
  ...
  const photoDir = path.join(ROOT, "generated-templates", "photos", safeId);
  fs.mkdirSync(photoDir, { recursive: true });
  ...
  function saveImage(target, slideNumber) {
    const data = target && zip.read(target);
    ...
    fs.writeFileSync(path.join(photoDir, name), data);
    ...
    return "photos/" + safeId + "/" + name;
  }
```

**Input needed:** path to the original `.pptx` plus a deck id (`node …/pptxToDeck.js <input.pptx> <deck-id>`).

**Original PPTX for library seeds:** not found in the workspace. Only PPTX present:

- `app-library/published/looney-tunes/looney-tunes.pptx`

No matches for blue-and-white, beige-and-brown, purple-modern, white-minimal, or other high-score seed names. Converter was **not** run.

## 7. Conclusion

Eligible pool: **`qualityScore >= 70` and `disabled === false`** → **15 seeds**.

| State | Count |
| --- | ---: |
| Fully intact (0 missing photo + deco) | **0** |
| Partially missing | **0** |
| Fully missing (all refs absent) | **15** |

**Intact Corporate / Abstract:** none.  
**Intact Corporate / Photo-driven:** none.

Highest-score Corporate Abstract candidates (all fully missing assets): `blue-and-white-modern-business-proposal-presentation` (91), then beige-and-brown / purple-modern (90). Highest Corporate Photo-driven: `white-minimal-photography-portfolio-presentation` (80) — also fully missing.

**Fresh manual-mode baseline on an intact seed:** **cannot** — there is no intact seed. Pin for Phase 4 after assets are restored (re-convert from PPTX outside this tree, or restore `generated-templates/photos/<id>/`): prefer **`blue-and-white-modern-business-proposal-presentation`** (Corporate Abstract, score 91), same seed Phase 3 used.

## 8–9. Online (skipped)

Text-model credit was **not** confirmed restored in this session. No pinned baseline run, no curator proof, no API probes.

---

Stop. Do not start Phase 4.
