# Agent handoff — creative templates (BE)

**Read this first** when continuing Slidexy template work.  
North-star rules: [`DESIGN-DIRECTION.md`](./DESIGN-DIRECTION.md).  
Fidelity / Flutter: [`FIDELITY-TIERS.md`](./FIDELITY-TIERS.md).

Last updated: 2026-11-13 (glyph decks: facet / hive / bracket)

---

## Repos & branches

| Repo | Path (this machine) | Branch | Role |
|------|---------------------|--------|------|
| **Slidexy-BE** | `Techinoid/Slidexy-BE` | `engine-v1` | Author, render, publish templates |
| **Flutter** | `Techinoid/slidesX-Flutter-POC` | `feat/be-template-catalog-sync` | Offline picker assets only |

Flutter does **not** need BE beside it to *view* templates. BE is required to *create/regenerate* then sync.

---

## Current progress (what’s done)

### Shipped on BE (`engine-v1` commit `8125858`)
Motion grammar + five flagships:
- Spike Rail, Darkroom Strip, Crate Press, Orbit Meridian, Wire Latitude  
- `FLAGSHIP_MOTION`: Morph **off**, continuity fade + ambient  
- Markers: `asBeat` / `asLabel` / `asDot` / `asChrome` / `asTitle` / `asStage`

### Shipped on Flutter (`fb954f0` on `feat/be-template-catalog-sync`)
Synced into mobile picker (decks + chrome + real photos, no image fallback):
- Spike Rail, Orbit Meridian, Wire Latitude, Darkroom Strip, Crate Press  
- **Peak Chain**, **Delta Flow**  
- Idea Wall refreshed  

Anyone who pulls that Flutter branch + rebuilds sees originals (assets under `assets/templates/`).

### Done locally on BE — **not fully committed yet**
Working tree on `engine-v1` still has geography + glyph work uncommitted (as of 2026-11-13):

| Item | Status |
|------|--------|
| `scripts/generate-geography.ts` | **Peak Chain** (triangles) + **Delta Flow** (chevrons). Rejected contour/rhumb/belt/parcel — do not revive. |
| `scripts/generate-glyph-decks.ts` | **Facet / Hive / Bracket** — complexity pass (overlap+opacity, photo bleed, scale contrast, smartAsset icons, 20% shape safeZone, asymmetric brackets). Published + Flutter synced. |
| `scripts/generate-incipit-tab.ts` | **Incipit Tab** — research-monograph language (thumb-index tabs + running head). Dense abstract→refs talk track. Published + Flutter synced. |
| Primitives | `triangle`, `chevron`, `diamond`, `hexagon` in designKit → render → slideSvg → catalog |
| Distinct photo keys | `geo-peak-*`, `geo-delta-*`, `orbit-space-*`, `glyph-facet-*`, `glyph-hive-*`, `glyph-bracket-*`, `paper-incipit-*` (also unused `glyph-spoke-*` cached for later) |
| Sync pins | `sync-tier-b-to-flutter.ts` pins facet/hive/bracket/incipit after delta |

**Next BE hygiene:** commit keepers on `engine-v1`; commit Flutter asset sync on `feat/be-template-catalog-sync`.

---

## Hard product lessons (do not regress)

1. **New geography language** means new *glyphs*, not recolored cards/orbs/grids/belts/tiles. User rejected contour/rhumb/belt/parcel as “same design.” Kept direction: **triangles (Peak Chain)** + **chevrons (Delta Flow)**.
2. **Unique photos per deck** — never reuse the same image set across flagships. Orbit = **space** imagery.
3. **Morph retired** for flagships. Next advances whole slide via fade/ambient; Back must keep working (no `interactiveSeq` on ambient).
4. Presentation-first: photo cover, talk track, quote, unique close. Motifs accent — not HUD/dashboard.
5. Content budgets: short copy, tall text boxes; render gates fail on `…` truncation / PPTX line counts.

---

## How to enhance a template (BE loop)

1. Edit the generator (`scripts/generate-*.ts`) and/or shared helpers (`scripts/lib/designKit.ts`).
2. Photos: put files in `engine/cache/photos` keyed by `photoQuery` prefix.
3. Render (+ optional publish):
   ```powershell
   cd Slidexy-BE
   node -r ts-node/register/transpile-only scripts/generate-geography.ts --only=peak-chain --publish-local
   ```
4. QA: open `out/<id>/preview.png` (and slide PNGs / PPTX). Must print `PASS`.
5. Sync to Flutter when mobile should see it:
   ```powershell
   $env:FLUTTER_ROOT="C:\Users\SP Grid\Desktop\Techinoid\slidesX-Flutter-POC"
   node -r ts-node/register/transpile-only scripts/sync-tier-b-to-flutter.ts --only=peak-chain
   ```
6. Commit **BE** (source of truth) and **Flutter** (shipped assets) separately.

Single-deck sync / pins / names: see top of `scripts/sync-tier-b-to-flutter.ts` (`PINNED_ORDER`, `DISPLAY_NAMES`).

---

## Key files

| Path | Why |
|------|-----|
| `scripts/lib/designKit.ts` | Primitives, motion defaults, `renderTemplate` / `runTemplates` |
| `scripts/generate-geography.ts` | Peak Chain + Delta Flow |
| `scripts/generate-glyph-decks.ts` | Facet Lattice + Hive Circuit + Bracket Gate |
| `scripts/generate-incipit-tab.ts` | Incipit Tab (research / thumb-index) |
| `scripts/generate-orbit-wire.ts` | Orbit Meridian + Wire Latitude |
| `scripts/generate-spike-rail.ts` / `generate-motion-flagships.ts` | Other motion flagships |
| `engine/motionGrammar.js` + `motionTargets.js` + `flagshipMotion.js` | Motion language |
| `engine/render.ts` | Layout → deck; triangle/chevron kinds |
| `scripts/slideSvg.js` | PNG paint for new shapes |
| `services/templatePipeline/catalog.js` | PPTX / catalog OOXML |
| `scripts/sync-tier-b-to-flutter.ts` | Bake → Flutter assets |
| `out/<id>/preview.png` | Visual source of truth before publish |

Schema: **v2**, canvas **1600×900**.

---

## Rejected / do not revive

- Card/ticket decks as “new geography” (darkroom/crate style clones)
- Contour sheet, rhumb chart, belt latitudes, parcel mosaic (user: still matching / not new enough)
- Morph / cameraPan / scatter on creative flagships
- Shared stock photos across Orbit + geo decks

---

## Suggested next work

1. **Commit BE** geography + glyph + Incipit Tab + primitives + photos on `engine-v1`.
2. **Commit Flutter** sync (facet/hive/bracket/incipit assets) on `feat/be-template-catalog-sync`.
3. Optional next glyph: **Spoke Yard** (radial) — photos already cached as `glyph-spoke-*`.
4. Stronger native motion (still no Morph) if product wants richer entrances.
5. Disk was critically full once — clean `build/` / `out/` temp before large Flutter APK builds.

---

## Quick verify commands

```powershell
# BE: regenerate one deck
node -r ts-node/register/transpile-only scripts/generate-geography.ts --only=delta-flow --publish-local

# Flutter sync one deck
$env:FLUTTER_ROOT="…\slidesX-Flutter-POC"
node -r ts-node/register/transpile-only scripts/sync-tier-b-to-flutter.ts --only=delta-flow

# Previews
start out\peak-chain\preview.png
```

When you finish a meaningful session, **update this file** (progress table + lessons) so the next agent stays current.
