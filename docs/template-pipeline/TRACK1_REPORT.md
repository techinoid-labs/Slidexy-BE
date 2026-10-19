# Track 1 report

Six fixes, each with a test and its own commit. The learned aesthetic model was not started.

## Layout id decision

The layout id stays a role the phone app already knows (`layoutFullBleedHero`, `layoutAgendaList`, and the rest of that set). It is not a unique name per strategy.

The app parses `layoutSequence` through a closed enum. An unknown name such as `layoutFullBleedHero_emphasis_corner` becomes a generic two-column slide, and the composition stored under the unknown name is not drawn. Two strategies may therefore share a role. The composition's identity is the strategy name. `similarity.js` compares strategies when a deck has `reasoning`, and `taste.slides` stores those strategy names. Decks written before strategies existed are still compared by role.

## Fixed

1. Editorial decks may pair a serif with a warm ground. `antiTells(deck, parent, designLanguage)` skips `serif-on-cream` when the language is `editorial`. `composeDeck` and the judge pass `deck.taste.designLanguage`. Any other language is still flagged.
2. Dead code removed. `assembleDeck.js` is gone. `composeDeck` no longer has the unused body builders, the `builders` map, or the body `previewCopy`. Cover and close copy remain. `generateDeck` no longer exports `buildSimpleDeck`, `PALETTES`, or `FONT_PAIRS`. `validateDeck` remains.
3. Strategy name is the slide identity, as described above.
4. Title and body overflow are measured with opentype.js from the deck's display font and text font. Latin subsets for the catalog fonts, plus IBM Plex Mono, live in `services/templatePipeline/fonts`.
5. `parseBrief` throws when the model returns a display or text font other than the one the catalog reserved. The existing retry asks the model again.
6. `pickCapped` does not choose a key that is already over 20% when another key has room. A catalog of 10 decks with Fraunces on 9 of them never chooses Fraunces. If every key in the pool is already over 20%, `pickCapped` throws `catalog-saturated` (HTTP 409) and the pipeline can retry or stop. A pool of six equal choices sits near 17%, but the next single deck makes one of them 2/7. That step still takes the least-used key and logs one warning, because refusing there would stop generation at six decks. The finished catalog of 50 is still under 20% on every axis.

## Tested

- `node services/templatePipeline/antiTells.test.js` — 10 editorial serif-on-warm decks, none flagged; a photographic twin is flagged.
- `node services/templatePipeline/deadCode.test.js` — assembler absent, old exports absent, cover and close and `validateDeck` present.
- `node services/templatePipeline/similarity.test.js` — same role with different strategies does not match; same strategy and boxes match across roles; old decks still match by role; every preferred role is one the app already knows.
- `node services/templatePipeline/reasonDeck.test.js` — still passes.
- `node services/templatePipeline/fitText.test.js` — twenty M's overflow a 160×40 box at 28px in Fraunces and in IBM Plex Mono; "Hi" does not.
- `node services/templatePipeline/inventBrief.test.js` — a mocked response that returns Inter and Roboto throws; Fraunces and Source Sans 3 are accepted.
- `node services/templatePipeline/catalogCaps.test.js` — 50 fresh plans stay at or under 18% on every axis; the 90% Fraunces catalog is not given another Fraunces; four keys already at 25% throw.

## Line count

Dead-code commit `825329f`: 944 lines deleted, 40 added, across `assembleDeck.js` (deleted, 219 lines), `composeDeck.js` (390 lines removed), `generateDeck.js` (342 lines removed), and the new test.

## Deferred

- Track 2, the learned aesthetic model, preference labels, and the creativity metric. Not started.
- The decoration layer and image treatments. Not started.
- A shared color helper for the duplicated contrast functions. Not started.
- The studio preview already resolves `visibleWhen`, photos, and decoration parameters. That code is in `Slidexy-FE/src/app/tools/template-pipeline` and was not part of these commits.
