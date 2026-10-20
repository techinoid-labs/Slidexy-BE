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

## Phase 2: structural edits with pptx-viewer-core

`services/templatePipeline/mutate_safe.js` loads a PPTX with `pptx-viewer-core` and saves only through that library. The creative operators in `mutate_creative.js` are exported from this module and were not applied. `mutate.js` still writes deck JSON for palette and creative variants.

API calls:

```js
const { PptxHandler } = await import("pptx-viewer-core");
const data = await handler.load(arrayBuffer);
const outputBytes = await handler.save(data.slides);
```

Positions are pixels (`x` is `Math.round(xEmu / EMU_PER_PX)`). Slide size on these files is 1920×1080.

| Seed | Operator | Elements before | Elements after reload | Mean SSIM |
| --- | --- | --- | --- | --- |
| health-medical | mirror_horizontal | 123 | 123 | 33.43 |
| health-medical | swap_sides | 123 | 123 | 91.07 |
| health-medical | scale_hero | 123 | 123 | 95.61 |
| company-minimal | mirror_horizontal | 146 | 146 | 53.14 |
| company-minimal | swap_sides | 146 | 146 | 92.08 |
| company-minimal | scale_hero | 146 | 146 | 94.11 |

Every save reloaded with the same element count on every slide. No operator threw.

`mirror_horizontal` is visible (SSIM 33 and 53). Some groups were already wider than the slide or hung off the canvas, so after `x = slideWidth - x - width` they still sit past the edge. Those boxes are listed in `docs/template-pipeline/safe-mutations/results.json`. The library accepted the save.

`swap_sides` exchanges the largest picture with the largest text, even when they are on different slides. health-medical fits without scaling (slides 6 and 7 change; the other slides stay at SSIM 100). company-minimal scaled both boxes by 0.9 twelve times and they still do not fit, because the largest text box is wider than the slide. The element count still matches. Slides 1 and 4 are the ones that move.

`scale_hero` multiplies the largest picture by 1.4 and clamps the origin. On both seeds that picture is larger than the slide after scaling, so it cannot sit fully inside. The changed slide is visible (health slide 7 SSIM 56.09, company slide 1 SSIM 41.08).

Renders and the six PPTX files are in `docs/template-pipeline/safe-mutations/<seed>/`.
