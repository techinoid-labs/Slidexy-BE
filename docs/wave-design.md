# Rolling waves in template generation

Use as an optional motif for fluid, playful, coastal, wellness or creative art directions. Keep dense analysis slides static. Do not add it to every template: it should support the chosen visual language.

## Generation

The catalog generator accepts `--wave=subtle`, `--wave=balanced`, or `--wave=expressive`. Add `--static-wave` for a static vector version. The lookbook renderer accepts the same options, for example:

```powershell
node -r ts-node/register/transpile-only scripts/render-sunday-roast.ts tidal-lab --wave=subtle
```

Lookbook example JSON can also include `"wave": {"style":"subtle","mode":"animated"}` at the top level. Example configuration takes precedence over CLI. Outputs use the existing output folder; publishing remains a separate existing flag.

Other generators using the motion pass can opt in:

```ts
expandMotionScenes(deck, {
  morph: false,
  wave: { style: "balanced", mode: "animated", maxSlides: 3 }
});
```

Generators without the motion pass can call `applyWaveDesign(deck, options)` after layout and before previews/export. This pass never changes content or font sizes.

## Design rules

- Subtle: 80-unit footer, 12-second cycle; balanced: 130 units, 10 seconds; expressive: 180 units, 8 seconds on the 1600 × 900 canvas.
- Default roles: cover, section, divider and closing. Maximum three slides per deck, never consecutive.
- Reserve the entire footer band plus 24 units above it. Text, photos, groups and ornaments in this area cause the pass to skip the slide. Full-canvas background shapes are allowed.
- Skip existing ambient effects, authored waves, disabled ambient motion and Morph pairs.
- Use the deck accent color. Wave stays clear of editable content and uses one native vector shape, not video.
- Review `deck.engine.waveDesign.report` for applied slides and skip reasons. A deck may have zero eligible slides; redesign the footer intentionally rather than forcing a wave over content.

The static option retains the shape without its loop. PNG previews are always static. This implementation targets native PPTX export; it does not add browser-editor animation or import/preserve arbitrary third-party PPTX animation.

## Geometry and verification

Five equal cycles cover a strip 2000 units wide. Translate left exactly 400 units (0.25 slide widths); never reverse or ease the loop. All three styles share this geometry and vary only height and duration.

Run `scripts/test-wave-design.ts` and `scripts/test-wave-export.ts` with `node -r ts-node/register/transpile-only`. For new motion designs, also inspect PowerPoint playback for at least 20 seconds, the loop boundaries, and single-click advancement. The current demo's automatic playback and advancement were checked; discrete screenshots do not establish frame-perfect seam smoothness.
