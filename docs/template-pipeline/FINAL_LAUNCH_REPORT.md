# Final launch

Two fixes are in. The pipeline is frozen on single-seed generation and the cohesive assembler.

## Orphan text

When the assembler copies a slide, a text box whose letters add up to one or two characters is left out. That removes specimen scraps such as "Aa", "Bb", and "Cc". A numeric label such as "01" or "12" stays, so a stats row is not stripped.

## Bright theme, dark photo

After the theme lock, `thematic.js` looks at each assembled slide. If the locked background is bright (the fashion deck's yellow is the case) and the slide has a dark full-bleed photo, a black rectangle at 40% opacity is placed on that photo, just above it and under the type. Text sitting on the photo is set to the light on-accent color so it stays readable on the scrim.

Checked against the fashion deck's full-bleed slide. The photo's average luminance is 0.23. The scrim is `#000000` at opacity 0.4. The headline renders light on the darkened photograph.

## Docs

`README.md` now describes the launch path: single-seed generation (a chosen layout, or Auto-Select Best Layout), the assembler (`Auto-Assemble Deck (Max Variety)`), and the admin curator plus the public catalog. Frankenstein Remix is still on the form and is not a launch path.

No further generation was run. The next deck an admin builds uses these rules.
