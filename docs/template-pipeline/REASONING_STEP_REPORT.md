# Reasoning step

Each body slide now gets a job, then a composition for that job. This is the first piece of the design-reasoning work. It is not Deliverable 2. The decoration grammar, component library, learned model, and taxonomy are still unstarted.

Stopping here so the new screens can be looked at. Nothing in this step is committed.

## Built

- `services/templatePipeline/reasonDeck.js`. Six jobs: sequence, comparison, evidence, emphasis, narrative, transition. Each job has three or four compositions. A deck takes the four least-used jobs, and within a job the least-used composition.
- The composition is stored as an inline layout under an existing slide role (`layoutTimeline`, `layoutComparison`, and the other roles the phone app already knows). `deck.reasoning` records job, strategy, layout id, and confidence. The geometry string includes the strategy names.
- Cover and close are unchanged. The model still invents the name, palette, fonts, and cover. It no longer chooses the body screens.
- Preview copy is written per composition, so a rail reads as four stations and a one-word slide has no bullet list.

## Tested

- `node services/templatePipeline/reasonDeck.test.js`. Twenty-four decks, no model calls. Each deck has four different jobs and four different layout ids. The busiest composition was 6% of those body slides. Thirteen different job mixes. Every composition stays inside 1600×900, and compositions in the same job do not share a screen.
- Preview titles fit the title boxes under the overflow check (width, height, font size).
- Four live decks, written through the generator: Street Eats (`gen-1955`), Coastal Clay (`gen-4860`), Arid Cultivation (`gen-15189`), Night Bites (`gen-17808`).
- Studio on `http://localhost:3001/tools/template-pipeline`, API on port 5000.
  - Street Eats: a full-bleed photograph with a dark band and the title in it, a single word (“Pause”) with a short rule, a four-station rail along the bottom, and a title sitting under a block in the top-right corner.
  - Coastal Clay: one large phrase, a giant `48%` with a caption, a title on the left with an empty right half, and two overlapping blocks (one top-left, one bottom-right).
  - Arid Cultivation: a title in a left-hand column, a full-height split (Before / After), and a staircase that steps down and to the right.
  - Night Bites: three bars of different lengths, and three giant index numbers (`01`, `02`, then `03` below the fold).

## Failed

- Nothing in the unit test failed. The live generator accepted all four decks on the first attempt.

## Deferred

- Deliverable 1.6 and 1.7. Not started.
- The rest of Deliverable 2: a grammar for decoration, spacing, and type, and a reasoning step that reads the actual subject instead of a fixed menu of compositions.
- The old body-layout functions are still in `composeDeck.js`. Body slides are built from `buildStrategy`. Those older functions are not called.

## Decisions outside the spec

- A deck takes four of the six jobs, so some decks have no sequence and some have no comparison. Four is enough to see a mix without forcing every job into every deck.
- When two compositions in one deck want the same slide role, the second is stored under the next free role. The picture is still that composition, because the deck’s own layout wins in the app. The app’s content spec for the borrowed role can disagree with the slots. Street Eats puts the corner composition on `layoutAgendaList` because the photograph already took `layoutFullBleedHero`. A later presentation generated from that template may write agenda lines that this slide does not draw.
- Body preview sentences are samples for the composition (“Along the bottom”, “A staircase”). The cover title still comes from the model. The preview is what the studio shows.
