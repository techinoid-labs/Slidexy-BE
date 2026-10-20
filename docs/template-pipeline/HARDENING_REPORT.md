# Hardening report

## Phase 1: converter cross-validation

`scripts/validate_converter.js` runs `convertPptx` and `pptxtojson.parse(buffer, { imageMode: 'base64' })` on the same file. `pptxtojson` is only a comparator. The deck JSON still comes from `pptxToDeck.js`.

```
node scripts/validate_converter.js "<pptx>" <deck-id>
```

The package call is `require('pptxtojson/dist/index.cjs')`. Counts ignore group wrappers, fully off-canvas shapes, and unpainted rectangles that `pptxtojson` emits beside custom geometry. A text string counts as present when it occurs in the slide text joined across boxes. A paragraph kept in several boxes is not a dropped string.

Gate: stop if a seed has more than 3 missing content elements or more than 1 missing text string.

| Seed | Missing elements | Missing text | Image mismatches | Null geometry | Gate |
| --- | --- | --- | --- | --- | --- |
| health-medical | 0 | 0 | 0 | 0 | pass |
| cinema-neon | 0 | 0 | 0 | 0 | pass |
| company-minimal | 3 | 0 | 0 | 0 | pass |

Reports: `docs/template-pipeline/converter-validation/<deck-id>.json`.

company-minimal is short by 1 element on slide 5 and 2 elements on slide 6. Those slides contain 4 and 3 zero-height lines. `fitBox` drops a box whose width or height is not greater than 0, so a horizontal rule never becomes an element. That is under the stop line of more than 3. Every text string is present. Image counts match on all 30 slides. No element is missing `x`, `y`, `width`, or `height`. `pptxtojson` reported no shadow objects on these three files.

Phase 1 passes. Phase 2 can start.
