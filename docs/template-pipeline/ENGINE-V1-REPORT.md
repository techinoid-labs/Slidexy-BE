# Engine v1 report

Run 1 + follow-up. Kit + DeckSpec + tokens path is live behind `ENGINE_V1=true`.

## Follow-up changes (this update)

1. **Real LLM eval + proofs** — `ENGINE_V1_SKIP_LLM` unset; OpenRouter 402 → Gemini (`API_KEY1`) still counts as LLM (no deterministic DeckSpec).
2. **Fallback removed** from `generateKitV1` / `inventDeckSpec`. Fixture only: `engine/golden/fixtures/fallbackSpec.ts` (tests). No LLM keys → **throw**.
3. **Kit source of truth** — `kit/<role>/{a,b}.json`. Generator moved to `scripts/dev/build-kit-variants.js` (see `scripts/dev/README.md`). Not called at build/runtime.
4. **Type pairs** — Office fonts on Windows + macOS PowerPoint: `corp-calibri` (Calibri/Calibri), `editorial-cambria` (Cambria/Calibri), `tech-verdana` (Verdana/Verdana), `classic-georgia` (Georgia/Arial). Contact sheet + gallery regenerated.
5. **`scripts/pptx-diff.ts`** — LibreOffice PDF → PNG vs canvas PNG; MAD recorded below.

---

## What shipped

### 1 — DeckSpec schema
- `engine/deckspec.schema.json`, `engine/validate.ts`, `engine/types.ts`
- Golden specs: `engine/golden/specs/` (5)

### 2 — Style tokens
- `engine/tokens.json` — 6 palettes (2 dark), 4 Office type pairs, `full-bleed` + `duotone`, 2 motifs
- Contact sheet: `out/contact-sheet/palette-type-sheet.png`

### 3–4 — Kit variants
- **20** files under `kit/<role>/{a,b}.json` (hand-edited source of truth)
- Shared `photo-footer` family on problem / solution / closing variant A
- Gallery: `out/gallery/<role>-<variant>/{slide.png,slide.pptx}`

### 5–7 — Engine
- `engine/fit.ts`, `gates.ts`, `selectVariant.ts`, `photos.ts`, `generateKitV1.ts`
- LLM: OpenRouter → Gemini (`API_KEY1`); one schema re-ask; one gate repair max
- Wired: `ENGINE_V1=true` → `generateKitV1`

---

## Self-verification (follow-up)

| Check | Result |
| --- | --- |
| LLM first-try gate pass (15 golden prompts) | **12/15 (0.80)** |
| Proof decks (LLM) gates pass / repaired | 3/3 pass, **0 repaired** |
| Failed after one gate repair | **none** |
| inventDeckSpec without LLM keys | throws |
| 20 variants schema | pass |
| pptx-diff gallery (MAD) | mean **2.44**, max **6.17**, min **0.96**, **20/20** under tolerance 40 |
| Unit tests | pass |

Eval machine log: `out/eval/summary.json`  
Proof machine log: `out/proof-llm/llm-summary.json`  
Diff machine log: `out/pptx-diff/summary.json`

### Eval failures (3/15) — invent invalid after schema re-ask (not gate repair)

These never produced a valid DeckSpec (LLM kept emitting font-family literals). Counted as first-try misses:

- `p07` Architecture studio portfolio overview — `invalid DeckSpec: font name literals`
- `p08` Cybersecurity platform for mid-market — `invalid DeckSpec: font name literals`
- `p09` Municipal green roof proposal — `invalid DeckSpec: font name literals`

No gate-repair failures to attach (proofs all passed first invent).

---

## LLM-written DeckSpecs (3 proofs)

Paths also on disk: `out/proof-llm/<id>/deckspec.json` and `deck.pptx`.

### supercars-garage (Pitch) — gates pass, repaired false

```json
{
  "style": {
    "palette": "ink-night",
    "typePair": "classic-georgia",
    "imageTreatment": "duotone",
    "motif": "bar-accent"
  },
  "slides": [
    {
      "role": "cover",
      "title": "Apex Motors",
      "caption": "Unrivaled supercar culture",
      "photoQuery": "supercar parked in showroom",
      "photoOrientation": "landscape"
    },
    {
      "role": "problem",
      "title": "Lost passion",
      "body": ["Generic dealers", "Disconnected experiences"],
      "photoQuery": "plain car dealership",
      "photoOrientation": "landscape"
    },
    {
      "role": "solution",
      "title": "The Apex Hub",
      "body": ["Exclusive garage", "Community events"],
      "photoQuery": "luxury garage interior",
      "photoOrientation": "landscape"
    },
    {
      "role": "how-it-works",
      "title": "Three pillars",
      "body": ["Collection", "Club", "Concierge"],
      "photoQuery": "mechanic working on engine",
      "photoOrientation": "landscape"
    },
    {
      "role": "feature",
      "title": "Member privileges",
      "body": ["Secure storage", "Track days", "Valet service"],
      "photoQuery": "car polishing detailer",
      "photoOrientation": "landscape"
    },
    {
      "role": "stats",
      "title": "Demand",
      "stat": "95%",
      "body": ["200+", "18mo"],
      "caption": "booking rate"
    },
    {
      "role": "testimonial",
      "title": "Vision",
      "body": ["Apex redefined automotive passion for us."],
      "caption": "M. Chen, collector",
      "photoQuery": "owner admiring supercar",
      "photoOrientation": "portrait"
    },
    {
      "role": "closing",
      "title": "Join Apex",
      "body": ["apex.club"],
      "photoQuery": "collection of supercars",
      "photoOrientation": "landscape"
    }
  ]
}
```

### pediatric-dental (Overview) — gates pass, repaired false

```json
{
  "style": {
    "palette": "ivory-warm",
    "typePair": "editorial-cambria",
    "imageTreatment": "full-bleed",
    "motif": "dot-cluster"
  },
  "slides": [
    {
      "role": "cover",
      "title": "Little Smiles",
      "caption": "Pediatric dental clinic",
      "photoQuery": "bright dental clinic children",
      "photoOrientation": "landscape"
    },
    {
      "role": "agenda",
      "title": "Our Approach",
      "body": ["Gentle Care Model", "Our Team", "Patient Outcomes"],
      "photoQuery": "soft clinic hallway",
      "photoOrientation": "landscape"
    },
    {
      "role": "feature",
      "title": "Gentle Care",
      "body": ["Playful check-in", "Comfortable rooms", "Parental involvement"],
      "photoQuery": "pediatric dental chair",
      "photoOrientation": "landscape"
    },
    {
      "role": "how-it-works",
      "title": "Your Visit",
      "body": ["Warm Welcome", "Thorough Exam", "Personalized Plan"],
      "photoQuery": "dentist talking to child",
      "photoOrientation": "landscape"
    },
    {
      "role": "team",
      "title": "Meet Our Team",
      "body": ["Dr. Anya Sharma", "Nurse Ben Carter", "Dental Assistant Chloe Lee"],
      "photoQuery": "friendly pediatric dentists portrait",
      "photoOrientation": "portrait"
    },
    {
      "role": "stats",
      "title": "Patient Trust",
      "stat": "4.9",
      "body": ["Over 2,500", "98% satisfaction"],
      "caption": "Family ratings"
    },
    {
      "role": "closing",
      "title": "Book an Appointment",
      "body": ["Monday - Saturday", "info@littlesmiles.example"],
      "photoQuery": "clinic reception warm light",
      "photoOrientation": "landscape"
    }
  ]
}
```

### b2b-payroll (Pitch) — gates pass, repaired false

```json
{
  "style": {
    "palette": "paper-blue",
    "typePair": "tech-verdana",
    "imageTreatment": "full-bleed",
    "motif": "bar-accent"
  },
  "slides": [
    {
      "role": "cover",
      "title": "EuroPay",
      "caption": "EU Payroll Compliance",
      "photoQuery": "modern office building exterior",
      "photoOrientation": "landscape"
    },
    {
      "role": "problem",
      "title": "Compliance Risk",
      "body": ["Fragmented rules", "Audit penalties", "Manual errors"],
      "photoQuery": "tax documents scattered",
      "photoOrientation": "landscape"
    },
    {
      "role": "solution",
      "title": "Unified Payroll",
      "body": ["Single platform", "Automated updates", "Cross-border accuracy"],
      "photoQuery": "dashboard with global map",
      "photoOrientation": "landscape"
    },
    {
      "role": "how-it-works",
      "title": "Simple Flow",
      "body": ["Onboarding", "Processing", "Reporting"],
      "photoQuery": "workflow diagram flowchart",
      "photoOrientation": "landscape"
    },
    {
      "role": "feature",
      "title": "Key Modules",
      "body": ["Country Packs", "Tax Engine", "Reporting Suite"],
      "photoQuery": "software interface features",
      "photoOrientation": "landscape"
    },
    {
      "role": "stats",
      "title": "Efficiency",
      "stat": "99.9%",
      "body": ["Compliance rate", "Reduced errors", "Time saved"],
      "caption": "98% accuracy"
    },
    {
      "role": "testimonial",
      "title": "Client Success",
      "body": ["EuroPay streamlined our EU payroll.", "No more headaches."],
      "caption": "Anna K., Finance Director",
      "photoQuery": "smiling business professional portrait",
      "photoOrientation": "portrait"
    },
    {
      "role": "closing",
      "title": "Get Started",
      "body": ["Request a Demo", "sales@europay.example"],
      "photoQuery": "modern conference room",
      "photoOrientation": "landscape"
    }
  ]
}
```

---

## Gallery PPTX (20)

- `out/gallery/agenda-a/slide.pptx` … through … `out/gallery/testimonial-b/slide.pptx` (all 20 roles×variants)

## Proof PPTX (LLM)

- `out/proof-llm/supercars-garage/deck.pptx`
- `out/proof-llm/pediatric-dental/deck.pptx`
- `out/proof-llm/b2b-payroll/deck.pptx`

(Prior `out/proof/*` may be locked by PowerPoint; LLM run wrote to `out/proof-llm/`.)

## pptx-diff numbers

| Metric | Value |
| --- | --- |
| Compared | 20 |
| Mean MAD | 2.441 |
| Min MAD | 0.959 |
| Max MAD | 6.173 |
| Within MAD &lt; 40 | 20/20 |

Per-variant rows: `out/pptx-diff/summary.json`

## DESIGN REVIEW tags

- `scripts/dev/build-kit-variants.js` — circular photo cutouts for cover-01 placement
- `scripts/dev/build-kit-variants.js` — motif bar on photo-footer edge
- Canvas preview may fall back Calibri/Cambria/Verdana → Arial/Georgia if Office fonts are not installed on the render host; PPTX still names the Office faces for PowerPoint

## Deferred to run 2 (unchanged)

- Curator UI reduction
- Deletion of seed-rewrite / native / agent paths
- README rewrite
- CI wiring
