# Fidelity tiers — BE/PPTX vs Flutter

One creative core, two delivery tiers. Do not publish Tier A–only effects to mobile until Flutter catches up.

## Tier A — Flagship (Slidexy-BE → native PPTX)

| Capability | Status |
|------------|--------|
| text / image / shape | Full |
| Masks (circle, arch, pill, …) | Full (PPTX crop-to-shape) |
| Type treatments (outline, long-shadow, offset-3d) | Preview full; PPTX depth via layered text |
| Photo tones | Full |
| SEL builders | Full |
| Morph camera-pan / scatter | Full OOXML |
| Ambient pulse / float / kenBurns | Full OOXML |
| textMaskedImage | Preview only — flat text in PPTX |
| Decor SVG library | Full |

**Consumers:** catalog publish, admin dashboard, PPTX download.

## Tier B — Mobile / webportal subset

Flutter (`slidesX-Flutter-POC`) and `webportal/renderer.js` currently paint:

- `text` | `image` | `shape` (+ `legacy`)
- Shape decor / patterns (partial)
- **No** masks, type treatments, or slide motion from BE deck JSON

Unknown BE types fall back to text — do not ship BE kits to Firestore without a bake step.

## Roadmap to raise mobile fidelity

1. **Masks** — port `circle` / `roundedRect` / `arch` clips into `ElementCanvas` + portal renderer; bump `schemaVersion` only after QA.
2. **Type treatments** — implement outline + simple long-shadow as Flutter paint effects (or bake to image for Tier B).
3. **Entrances** — simple fade/fly-in on layout enter (not full Morph).
4. **Bake path** — for any Tier A effect without mobile support, rasterize that element into an image slot before Firestore publish.

## Publishing rule

| Destination | Allowed |
|-------------|---------|
| Local/BE catalog + PPTX | Tier A + B |
| Flutter / Firestore | Tier B only, or Tier A after bake |

SEL unit tiers are marked in [`sel-catalog.json`](../../engine/design-system/sel-catalog.json) (`tier: "A" | "B"`).

## Sync checklist (web + mobile)

1. Author / regenerate family → `npm run publish:<batch>:local` (or admin publish).
2. Catalog refresh: `GET /api/catalog` (+ `/api/catalog/manifest`) lists `family`, `tier`, `capabilities`.
3. **Web use:** browse design systems → download PPTX (editor starters stay separate).
4. **Mobile use:** bake then Firestore:
   ```bash
   npm run bake:tier-b
   # optional: PUBLIC_CATALOG_BASE=https://your-api-host npm run bake:tier-b
   npm run publish:firestore-templates          # dry-run payload
   FIRESTORE_PUBLISH=1 npm run publish:firestore-templates
   ```
5. Flutter branch `feat/be-template-catalog-sync` consumes Firestore; do not merge to `enhance-slides` until verified.
6. Refuse Firestore publish unless `tierB.baked === true` and `mobileTier === "B"`.
