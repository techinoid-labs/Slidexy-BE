# AI family routing + creative mutators

Goal: beat Gamma’s homogeneous “AI SaaS” look by **routing into a metaphor system** before filling slots.

## Pipeline

```
prompt
  → routeFamily(prompt)          # scripts/lib/familyRouter.ts
  → FAMILY_SEL kits + brand
  → renderDeckFromSpec
  → expandMotionScenes(motion)   # fade + ambient (Morph retired on creative flagships)
  → applyCreative(...)           # mutate_creative.js
  → PNG preview + native PPTX
```

See also [`DESIGN-DIRECTION.md`](./DESIGN-DIRECTION.md) for presentation-first rules and gallery inventory.

## Router

[`scripts/lib/familyRouter.ts`](../../scripts/lib/familyRouter.ts)

- Keyword scoring over creative families (darkroom … newsstand, plus portfolio: vitrine, dossier, mezzanine, platepress)
- Returns `{ family, metaphor, units, confidence, motion, reasons }`
- Default creative operators: `highlight_word`, `overlap_depth`
- Tier A optional: `text_mask_image` (preview-strong; PPTX still flat — use only on flagship demos)

Example:

```js
const { routeFamily, CREATIVE_DEFAULTS } = require("./scripts/lib/familyRouter");
const hit = routeFamily("color grade LUT pack for overnight render queue");
// → family: grade, units: [waveform, colorWheels, nodeChain, neonBadge]
```

## Compose defaults

From `CREATIVE_DEFAULTS.pipeline`:

1. `routeFamily(prompt)`
2. Select kits owned by that family’s SEL units
3. `renderDeckFromSpec`
4. `expandMotionScenes` using `FAMILY_SEL.motion`
5. `applyCreative(highlight_word, overlap_depth)` via [`mutate_creative.js`](../../services/templatePipeline/mutate_creative.js)
6. Export PPTX + preview

## Long-term

Generate **new** silhouette kits from the constrained SEL grammar (compose `filmStrip` + `dial` + …) instead of freeform Canva chaos. Never invent layouts outside the SEL catalog without a review pass (`assertUniqueSel`).
