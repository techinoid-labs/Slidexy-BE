# Parametric design engine

Two decks were built from the same seed, `yellow-and-blue-illustrative-modern-geometric-health-medical-presentation` (`--layout health-medical`). The seed cover is not copied. Each deck gets a new cover, one signature device on every slide, and a fixed title/body contrast.

| Deck | Prompt | Cover | Density | Signature | Score |
|---|---|---|---|---|---|
| `docs/template-pipeline/parametric/coffee-shop` | A boutique coffee shop | Oversized Word | airy (margins ×1.25, line height ×1.1) | 2px frame | 100 (10/10) |
| `docs/template-pipeline/parametric/corporate-pitch` | A corporate pitch | Full-Bleed | balanced (unchanged) | 48px left rail | 90 (9/10) |

The coffee cover is the seed yellow `#FBD523` with "The Daily Grind" at 150px, Poppins Bold, weight 800, in a box that starts at x 0 and runs the full 1600px width. A 2px frame in the seed accent `#1E3A32` sits on every slide. The corporate cover is a full-bleed photograph with the title bottom-left on a black scrim, and the same accent as a left rail instead of a frame. The two covers do not share a layout.

## Cover

`thematic.js` calls `applyParametric` after the copy and the photographs are in place. The cover is one of three patterns, chosen from the prompt so the same subject repeats and two subjects diverge:

- Oversized Word. Title at 150px, box flush to the left and right edges, on the seed background.
- Full-Bleed. Photograph (or the seed accent, if no photograph came back) across the whole slide, title bottom-left, scrim behind the type.
- Split Field. Accent panel on the left half, photograph on the right, title on the panel.

Colors and fonts come from the seed, taken before the mood shift. This seed's display face is Poppins Bold and its body face is Telegraf. The coffee run drew Oversized Word. The corporate run drew Full-Bleed. Split Field is in the same list and was not selected for these two prompts.

## Density

`--density` is `airy`, `balanced`, or `dense`. Balanced leaves the boxes alone. Airy multiplies margins and gutters by 1.25 and line height by 1.1. Dense multiplies margins and gutters by 0.8. Box sizes stay put; only the gaps move, and only as far as the slide still fits. A label inside a shape moves with that shape.

After the move, `checkGeometry` in `analyzeDeck.js` runs. A slide that newly overlaps text, leaves the canvas, or loses contrast is put back. The coffee run reverted nothing. On slide 2 the title box `s2-e4-t` moved from x 114.08 to 142.6 (114.08 × 1.25) and its line height went from 1.15 to 1.26. The corporate run used balanced, so that same box stayed at x 114.08.

## Signature

The devices are defined in `Slidexy-FE/src/templates/signature.ts` and applied by `Slidexy-BE/services/templatePipeline/signature.js`. One device is chosen per deck and painted on every slide, in the seed accent:

- Frame. Four 2px bars around the slide.
- Rail. A 48px block on the left edge.

The coffee deck uses the frame on all 10 slides. The corporate deck uses the rail on all 10 slides.

## Type

Display text is weight 800, or 300 when the prompt says minimalist. Body text is weight 400. On each slide the title is at least three times the next size down. Where the seed was closer than that (title 97.6, body 34.4), the body was set to 32.5. Neither of these prompts is minimalist, so both decks use 800 / 400. The cover title is the only line on that slide, so it stays at its pattern size.

## Geometry

Neither deck reported a text overlap after the density pass. The coffee deck scored 100. The corporate deck scored 90; the only miss was "washed out on slide 3", which is the vision check on a content slide, not a margin collision. The renderer still auto-fits a few seed titles at draw time (97.6 down to about 78.6) because those boxes were already tight. The stored sizes are unchanged.
