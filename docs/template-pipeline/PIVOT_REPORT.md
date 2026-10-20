# Pivot

Three steps. The generator still does not emit the new primitives. The gates and the LAION flag were left alone. The audit was not refreshed.

## 1. Schema

Four element types are now legal in a schemaVersion 2 deck.

| Type | What it holds |
|---|---|
| `illustration` | An SVG path, plus fill, stroke, stroke width, and opacity |
| `maskedImage` | An image clipped to `rect`, `ellipse`, `arch`, or a path |
| `rotated` | One element and a degree count |
| `collage` | 2 to 6 images, each with its own box inside the collage |

The constructors live in `services/templatePipeline/deckSchema.js`. `validateDeck` in `generateDeck.js` accepts them and rejects a collage outside 2–6 images, an empty path, or a rotation with no element. `composeDeck.js` puts the constructors on the layout kit. `reasonDeck.js` exports them as `schemaPrimitives`. No strategy calls them. None of the ten generated decks contain these types.

## 2. One language

`designLanguage` is no longer a capped catalog axis. `planGeneration` always sets `designLanguage` to `editorial`. Fonts, covers, grounds, and palette buckets are still capped at 20%.

Ten decks, each invented through the pipeline and rendered. Every one is editorial. LibreOffice opened all ten PPTX files.

| Deck | Name |
|---|---|
| editorial-run-1 | Alchemist's Garden |
| editorial-run-2 | Ink and Echoes |
| editorial-run-3 | Midnight Journeys |
| editorial-run-4 | Open-Air Stories |
| editorial-run-5 | Urban Mechanics |
| editorial-run-6 | Maritime Communications |
| editorial-run-7 | Pixel Alchemy |
| editorial-run-8 | Root & Hue |
| editorial-run-9 | River Transit |
| editorial-run-10 | Street Eats |

JSON is in `generated-templates/editorial-run/`. PNG strips are in `docs/template-pipeline/editorial-run/`. PPTX files are `generated-templates/rendered/editorial-run-1.pptx` through `editorial-run-10.pptx`.

## 3. Three editorial seeds

The reference set has four `editorial_portfolio` decks. These three are the ones with the photographs, the type, and the composed pages. `photojournalist-portfolio` was left out: 1.4 decorations per content slide and 2 photos.

Each seed is six slides, written by hand in the new schema, and saved as:

- `app-library/editorial-1.json` — fashion photographer portfolio
- `app-library/editorial-2.json` — elegant branding kit
- `app-library/editorial-3.json` — luxury vacation homes

Picture slots are color stand-ins. The deck JSON stores a url; the SVG renderer does not embed the reference photograph.

Audit of the three JSON files, with `analyzeDeck(readDeck())`. This is not an audit refresh.

| Seed | Decoration / content slide | Motifs | Molecule types | Photos | Overlap | Bleed | Tilt |
|---|---|---|---|---|---|---|---|
| editorial-1 | 0.67 | 0.67 | 1 (list) | 10 | 0% | 0% | 17% |
| editorial-2 | 0.67 | 0.67 | 2 (list, index_numeral) | 9 | 0% | 0% | 17% |
| editorial-3 | 0.50 | 0.50 | 2 (index_numeral, stat_block) | 10 | 0% | 0% | 17% |

Illustration is the decoration family on all three (3 illustrations each). Tilt is the rotated type. PNG strips are in `docs/template-pipeline/editorial-seeds/`.
