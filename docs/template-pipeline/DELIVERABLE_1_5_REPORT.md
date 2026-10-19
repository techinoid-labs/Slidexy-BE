# Deliverable 1.5 report

Studio preview now draws the deck that is stored, and the sampler refuses to add another deck to a font, cover, ground, palette bucket, or design language that is already at 20% of the catalog.

Stopping here for review. Deliverable 1.6 has not been started.

## Built

- Studio slide preview (`Slidexy-FE/src/app/tools/template-pipeline/components/slidePreview.tsx`). It resolves tokens, including 8-digit `#AARRGGBB` colours, and draws each decoration from its `decorParams`.
- `visibleWhen: hasLabeledItem` hides a row whose `itemIndex` is past the preview copy. Item numbers come from that index (`01`, `02`, `03`), and a stat slide shows `48%`.
- An image slot with no URL reuses a photo already in the deck. If the deck has none, the slot is a small inline landscape. It is not a flat grey box. Corner radius and opacity are applied.
- Discarded and shipped rows in the studio open the same preview. Ship and Discard stay on pending decks only.
- Catalog sampler (`services/templatePipeline/catalogCaps.js`), called from `inventBrief.js` before the model runs. The plan forces cover, display font, text font, ground, palette bucket, and design language. `composeDeck.js` paints the chosen ground and stores `groundMode` and `designLanguage` on `taste`.
- The store no longer lists `taste.json` as a template. That file has no id and was showing up as an eighth pending card.

## Tested

- `node services/templatePipeline/catalogCaps.test.js`. Fifty plans from an empty catalog, then fifty more on top of the live 35. No model calls and no writes to `generated-templates`.
- Fresh 50, highest share on each axis: display font 10%, text font 10%, font pairing 4%, cover 18%, ground 18%, palette bucket 18%, design language 18%.
- Live 35 plus those 50 (85 decks): Outfit 9.4% (was 8/35), meshGradient 17.6% (was 15/35), palette bucket 17.6%. Covers and design languages are 18% of the 50 new decks. The older 35 have no `taste.cover` and no design language, so they are not in those two denominators.
- Studio on `http://localhost:3001/tools/template-pipeline`, against the API on port 5000.
  - Nature (`gen-25921`): cover photograph, body slides use a fine noise grain, the image slide reuses that photograph, the stat reads `48%`, the timeline shows the three preview steps and not a fourth empty one.
  - Celestial Cartography (`gen-39843`): body wash is three soft colour blooms, not the grain.
  - Oxblood paper (`gen-70111`, opened from Discarded): a briefing slide draws a ruled grid and shows four labeled rows (the layout has a fifth slot and four lines of copy). The next slide in that deck is a mesh of colour, not the same grid. A later slide is a photograph.

## Failed

- Nothing in the definition of done failed. The 50-deck check is a simulation of the sampler, not 50 model calls.

## Deferred

- Deliverable 1.6 (classifier labels, pairwise preferences, learned aesthetic model) and 1.7 (decoration taxonomy). Not started.
- Theme decoration names (`chalkboard`, `fashion`, `scientific`, and the rest) still fall through to one radial wash. None of the 35 stored decks use those names as their ground.
- Port 3000 is `next start`, a production build. It will keep the old preview until that build is replaced. The check above is the dev server on port 3001.

## Decisions outside the spec

- Ground is six modes (`flat`, `noise`, `meshGradient`, `dotGrid`, `glow`, `lineGrid`) instead of the coin-flip between noise and mesh. Two modes cannot stay under a 20% cap. These are the existing decor primitives, not the later background system.
- The sampler overwrites the model's cover and fonts. Unconstrained fonts are how Playfair reached 40%.
- Palette is capped as light/dark crossed with warm/cool/neutral. Exact background hexes are already one-off, and a coarser bucket with fewer than five open values would push the new decks themselves over 20%. A nudge moves the model's palette into the open bucket and keeps ink/background contrast at 4.5 and accent/background at 3. If it cannot, that attempt is thrown away and the model is asked again.
- Design language is one of six labels stored on `taste` (`editorial`, `photographic`, `technical`, `geometric`, `typographic`, `spotlight`) and named in the prompt. The generative grammar is still Deliverable 2.
- Decks with no cover name or design language are omitted from those tallies. Treating all of them as one "legacy" value would put that value at 100% and block every new deck.
