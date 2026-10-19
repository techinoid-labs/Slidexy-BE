# Track 1 follow-up

Three fixes. The 20% cap was left as it is. The learned aesthetic model was not started.

Font measurement already used the committed Latin-subset files and opentype.js. This follow-up added the composed-deck overflow check and did not restore the old width guess.

## Fixed

1. Ship and Discard keep the 19 strategy names in `taste.strategy`. Shipping a deck whose `taste.slides` is `["sequence.rail"]` increments `taste.strategy["sequence.rail"]`. A role id such as `layoutTimeline` still increments `taste.slide`. The next deck's body slides still come from `planReasoning`, which counts strategies already stored on decks, not from this bucket.
2. The model prompt no longer asks for `list`, `timeline`, `stat`, `compare`, `imageSide`, `imageMode`, `three`, `team`, `text`, `quote`, or the old slide list. `parseBrief` no longer returns those fields. `close` stays, because the closing slide still branches on it. Display and text fonts are compared without regard to capital letters. The geometry string no longer repeats the removed fields.
3. `textOverflow` on a deck built by `composeDeck` returns an array. A normal deck has no overflow. A title of eighty M's is caught. Some catalog fonts make opentype.js throw on a character it cannot shape; the width then falls back to that character's own glyph advance, still from the font file.

## Not changed

`pickCapped` still throws only when the least-used choice is already over 20% of the decks on disk. A catalog of six choices at three each (18 decks) would be 4/19, about 21%, on the next deck. Throwing there would freeze that axis: six choices cannot all stay at or under 20% until each already has four, and you cannot reach that count if generation stops at 18. The finished run of 50 still ends at or under 18% on every axis.

## Tested

- `node services/templatePipeline/learn.test.js` — `sequence.rail` is stored on `taste.strategy`; `layoutTimeline` is stored on `taste.slide`. The test restores `generated-templates/taste.json`.
- `node services/templatePipeline/inventBrief.test.js` — Inter and Roboto are rejected; Fraunces and Source Sans 3 are accepted; `fraunces` and `source sans 3` are accepted; the removed arrangement fields are absent.
- `node services/templatePipeline/fitText.test.js` — the earlier Fraunces and IBM Plex Mono cases still pass, and a composed deck is measured as described above.
- `node services/templatePipeline/deadCode.test.js`, `reasonDeck.test.js`, and `similarity.test.js` still pass.

## Deferred

- Track 2, the learned aesthetic model, preference labels, and the creativity metric. Not started.
- The decoration layer and image treatments. Not started.
