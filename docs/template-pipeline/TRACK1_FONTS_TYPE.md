# Fonts and type scale

Two fixes from the 20 decks in `Downloads\PPTX Slides Templates`. The learned model was not started.

## Fixed

1. Generic faces are body fonts. `Poppins`, `Montserrat`, `Inter`, `Open Sans`, `Lato`, and `Roboto` are in `TEXT_FONTS`. `Antonio` and `Archivo Black` are in `DISPLAY_FONTS`. The prompt now forbids those six names only as the display face, and asks for a condensed grotesque, a heavy sans, or a striking serif. Latin measurement files for the eight new faces are in `services/templatePipeline/fonts`, so overflow checks can read them.
2. Titles are larger. `type.h1` is `200 * typeScale`, and never under 180. The 0.88 step, and a dense deck, would otherwise land at 176 or 165, below the 180 check. `type.h2` is `120 * typeScale`. `h3`, `h4`, body, and caption are unchanged. Strategy titles: `sequence.rail` 140, `sequence.spine` 120, `emphasis.word` 200, `transition.chapter` 140, `comparison.halves` 130. The closing title box is wider and taller so "Begin here" still fits on one line.

## Tested

- `node services/templatePipeline/fontRoles.test.js` — `planGeneration` does not return a banned display face, and it returns Montserrat as the body font when that face is the least used.
- `node services/templatePipeline/typeScale.test.js` — five decks from `composeDeck` each have a text element of at least 180px.
- The other pipeline tests passed: `antiTells`, `catalogCaps`, `deadCode`, `fitText`, `inventBrief`, `learn`, `reasonDeck`, `similarity`.
- `npm test` is still `echo "Error: no test specified" && exit 1`. It exits 1 because that script is a placeholder, not because a pipeline test failed.

## Not done

- Track 2, Deliverable 8's hard gate, the rest of Deliverable 2, and Deliverable 4.
