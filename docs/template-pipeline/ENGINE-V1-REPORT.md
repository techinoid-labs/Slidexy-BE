# Engine v1 report

Run 1 + follow-up 1 + **follow-up 2**. Kit + DeckSpec + tokens path is live behind `ENGINE_V1=true`.

## Follow-up 2 changes

1. **`engine/prompts/deckspec.md`** — inline enum lists for palette / typePair / imageTreatment / motif with wrong/right examples; software/services photo rule (people & places, never screens/dashboards/diagrams/charts); sequencing mins by deckType.
2. **Schema** — `stats: [{value≤8,label≤30}]` (1–3); `members: [{name≤30,role≤30}]` (2–4). Kit variants, validator, goldens, render/gates/`selectVariant` updated.
3. **Schema re-ask** — validation errors quote the bad value and print the allowed list (e.g. `unknown typePair "Calibri"; allowed: corp-calibri | …`).
4. **`slideCountOK`** — Pitch ≥9, Overview/Report/Proposal ≥8 (max 14); `runGates(..., deckType)`.
5. **Render fonts** — Carlito + Caladea bundled under `services/templatePipeline/fonts/`; registered as Calibri / Cambria when system faces missing (Cambria.ttc skipped). Gallery regenerated; pptx-diff re-run.

---

## Self-verification (follow-up 2)

| Check | Result |
| --- | --- |
| LLM first-try gate pass (15 golden prompts) | **14/15 (0.93)** |
| Proof decks (LLM) gates pass / repaired | 3/3 pass, **0 repaired** |
| Failed after one gate repair | **none** |
| inventDeckSpec without LLM keys | throws |
| 20 variants schema | pass |
| pptx-diff gallery (MAD) | mean **2.66**, max **6.53**, min **0.96**, **20/20** under tolerance 40 |
| Unit tests | pass |

Eval machine log: `out/eval/summary.json`  
Proof machine log: `out/proof-llm/llm-summary.json`  
Diff machine log: `out/pptx-diff/summary.json`

### Eval miss (1/15) — gate, not invent

- `p07` Architecture studio portfolio overview — `photoPresent` on feature/b + testimonial/b (missing `photoQuery` after variant B selected). Valid DeckSpec; first-try gate fail only.

---

## LLM-written DeckSpecs (3 proofs)

Paths: `out/proof-llm/<id>/deckspec.json` and `deck.pptx`.

### supercars-garage (Pitch) — gates pass, repaired false

```json
{
  "style": {
    "palette": "charcoal-ember",
    "typePair": "classic-georgia",
    "imageTreatment": "duotone",
    "motif": "bar-accent"
  },
  "slides": [
    {
      "role": "cover",
      "title": "Apex Motors",
      "caption": "The ultimate supercar destination",
      "photoQuery": "luxury supercar showroom at night",
      "photoOrientation": "landscape"
    },
    {
      "role": "problem",
      "title": "Underwhelmed drivers",
      "body": ["Generic showrooms", "Lack of exclusivity"],
      "photoQuery": "empty, sterile car dealership interior",
      "photoOrientation": "landscape"
    },
    {
      "role": "solution",
      "title": "A curated experience",
      "body": ["Bespoke events", "Member lounges"],
      "photoQuery": "stylish car club lounge with leather seating",
      "photoOrientation": "landscape"
    },
    {
      "role": "how-it-works",
      "title": "The Apex difference",
      "body": ["Discovery", "Acquisition", "Enjoyment"],
      "photoQuery": "mechanic meticulously polishing a supercar",
      "photoOrientation": "landscape"
    },
    {
      "role": "feature",
      "title": "Exclusive access",
      "body": ["Track days", "New model previews"],
      "photoQuery": "supercars on a race track",
      "photoOrientation": "landscape"
    },
    {
      "role": "stats",
      "title": "Performance metrics",
      "stats": [
        { "value": "95%", "label": "member satisfaction" },
        { "value": "2x", "label": "event attendance growth" },
        { "value": "150+", "label": "unique vehicles showcased" }
      ]
    },
    {
      "role": "testimonial",
      "title": "Our clients",
      "body": ["This is more than a garage, it's a community."],
      "caption": "E. Vance, collector",
      "photoQuery": "confident individual portrait in a garage setting",
      "photoOrientation": "portrait"
    },
    {
      "role": "team",
      "title": "The pit crew",
      "members": [
        { "name": "Alex Chen", "role": "Founder" },
        { "name": "Maria Rossi", "role": "Experience Director" },
        { "name": "Sam Wu", "role": "Head of Acquisitions" }
      ],
      "photoQuery": "team portrait in a modern garage environment",
      "photoOrientation": "landscape"
    },
    {
      "role": "closing",
      "title": "Join Apex",
      "body": ["Contact us for a private viewing."],
      "photoQuery": "elegant garage door opening to reveal a supercar",
      "photoOrientation": "landscape"
    }
  ]
}
```

### pediatric-dental (Overview) — gates pass, repaired false

Style: `ivory-warm` / `editorial-cambria` / `full-bleed` / `dot-cluster`. 8 slides with `members` + `stats` arrays. See `out/proof-llm/pediatric-dental/deckspec.json`.

### b2b-payroll (Pitch) — gates pass, repaired false

Style: `paper-blue` / `corp-calibri` / `duotone` / `bar-accent`. 9 slides; photoQueries are people/places (no dashboards). See `out/proof-llm/b2b-payroll/deckspec.json`.

---

## Paths

### Kit variants (source of truth)

- `kit/<role>/{a,b}.json` — 20 files  
- Generator (dev only): `scripts/dev/build-kit-variants.js`

### Gallery

- `out/gallery/<role>-<variant>/{slide.png,slide.pptx}` — 20

### Proof PPTX (LLM)

- `out/proof-llm/supercars-garage/deck.pptx`
- `out/proof-llm/pediatric-dental/deck.pptx`
- `out/proof-llm/b2b-payroll/deck.pptx`

### pptx-diff

| Metric | Value |
| --- | --- |
| Compared | 20 |
| Mean MAD | 2.657 |
| Min MAD | 0.959 |
| Max MAD | 6.526 |
| Within MAD &lt; 40 | 20/20 |

---

## What shipped (cumulative)

- DeckSpec schema + validate + types; golden specs (5)
- Tokens: 6 palettes (2 dark), 4 Office type pairs, full-bleed + duotone, 2 motifs
- Fit / gates / selectVariant / photos / generateKitV1 (no deterministic fallback)
- `ENGINE_V1=true` → kit path in pipeline

---

## Run 2 (in progress)

| Item | Status |
| --- | --- |
| Curator UI → kit generate / review / publish / download | **done** (seed radios, seed library, panel tab removed from Generate) |
| User-path deletion of seed / native / composer / assemble / remix | **done** (`pipeline.runPipeline` + `adminCatalog.generateTemplate` kit-v1 only) |
| README rewrite | **done** (Engine v1 first) |
| CI for engine tests | **done** (`.github/workflows/engine-v1.yml`) |

Still optional cleanup: delete or quarantine unused `thematic.js` / `thematic-native.js` call sites and mode-shape tests that assert legacy modes.
