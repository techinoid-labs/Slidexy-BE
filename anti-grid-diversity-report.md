# Radical Structural Diversity — Status Report

**Slidexy Motion Engine · Catalog audit**  
**Source:** `out/slidexy-catalog/catalog.json`  
**Generated batch:** 2026-11-05

## Summary

Layouts were too similar across themes: safe, grid-based, and symmetric. Color/type tokens changed, but composition did not.

**Response:** anti-grid kit family + forced cover diversity in the 10-template catalog batch.

| Metric | Value |
|---|---|
| Catalog templates | 10 |
| Distinct cover silhouettes | 7 |
| Anti-grid kits (cover + body) | 13 |
| Sequences covered | 5 |

Cover uniqueness is enforced in `generate-slidexy-catalog.ts` via round-robin over the cover pool (`index % 7`). Sequence pools also sample anti-grid feature / team / comparison variants from the deck seed.

---

## 1. Problem → Intervention

### Before
Themes swapped palette and type, but compositions stayed 50/50, centered, and margin-safe. The first anti-grid batch still collapsed every cover onto `cover/editorial-overlap` because the cover pool had a single entry.

### After
New kits change **silhouette** (bleed, band, slab, column, circle, type-wall, brutalist). Catalog assignment guarantees the first 7 decks each get a different cover shape.

---

## 2. Cover geometry inventory

Kit files under `kit/cover/*.json`.

| Kit | Shape | Geometry |
|---|---|---|
| `cover/editorial-overlap` | Bleed title | Full-bleed photo; 100pt title half-off left edge; caption bottom-right |
| `cover/band-horizon` | Mid band | Full-bleed photo cut by a thick horizontal accent stripe holding the title |
| `cover/bottom-slab` | Footer slab | Photo on top; ink slab eating bottom 40% with oversized title inside |
| `cover/right-bleed` | Column bleed | Solid left field (~42%); tall photo column bleeding off top/right/bottom |
| `cover/circle-hero` | Circle crop | Accent field; oversized circular photo offset left; title on the right |
| `cover/type-wall` | Type only | No photo; 110pt title wall; thin accent rule; caption bottom-right |
| `cover/brutalist` | Clip + slab | Harsh B&W photo cutout; neon accent slab; outline title clipped by edge |

### Cover usage in batch of 10

| Cover | Templates |
|---|---|
| editorial-overlap | 2 |
| band-horizon | 2 |
| bottom-slab | 2 |
| right-bleed | 1 |
| circle-hero | 1 |
| type-wall | 1 |
| brutalist | 1 |

---

## 3. Body anti-grid kits

| Kit | Role | Geometry |
|---|---|---|
| `feature/asymmetric` | Feature | 70/30 split — image bleeds right; tight text column left |
| `feature/floating-card` | Feature | Full-bleed tinted photo; centered white card with title + bullets |
| `feature/typography-hero` | Feature | No image; 80pt title left; 14pt body right; giant watermark numeral |
| `team/cutout` | Team | Circular portrait on accent block; head overlaps circle edge |
| `testimonial/cutout` | Testimonial | Same cutout silhouette applied to quote slides |
| `comparison/quadrant` | Comparison | 2×2 hairline matrix for Effort/Impact or SWOT |

### Anti-grid body kit hits (templates including kit)

| Kit | Appearances |
|---|---|
| asymmetric | 4 |
| typography-hero | 3 |
| floating-card | 1 |
| quadrant | 4 |
| team/cutout | 4 |
| testimonial/cutout | 4 |

---

## 4. Catalog batch — cover assignment

| Template | Category | Theme | Slides | Cover |
|---|---|---|---|---|
| Lumen AI Pitch | Pitch Deck | Tech Minimalist | 9 | editorial-overlap |
| Harbor Homes Proposal | Sales Proposal | Corporate Finance | 6 | band-horizon |
| Verdant Market Plan | Marketing Plan | Luxury Editorial | 6 | bottom-slab |
| Meridian People Report | Consulting Report | Healthcare Clinical | 8 | right-bleed |
| Aegis Secure Overview | Company Overview | Cyberpunk Gaming | 7 | circle-hero |
| Lumen AI Sales Proposal | Sales Proposal | Tech Minimalist | 6 | type-wall |
| Lumen AI Marketing Plan | Marketing Plan | Luxury Editorial | 6 | brutalist |
| Lumen AI Consulting Report | Consulting Report | Corporate Finance | 8 | editorial-overlap |
| Lumen AI Company Overview | Company Overview | Healthcare Clinical | 7 | band-horizon |
| Harbor Homes Pitch Deck | Pitch Deck | Tech Minimalist | 9 | bottom-slab |

Sequences: `pitch-deck`, `consulting-report`, `sales-proposal`, `marketing-plan`, `company-overview`.

---

## 5. Findings

| Status | Item | Detail |
|---|---|---|
| Fixed | Structural repetition on covers | Batch previously assigned `cover/editorial-overlap` to every deck. Cover pool expanded to 7 silhouettes with catalog round-robin. |
| Shipped | Anti-grid body kits | Feature (asymmetric, floating-card, typography-hero), team/testimonial cutout, and comparison quadrant wired into sequence variant pools. |
| Open | Consulting-report mid-deck sameness | Consulting sequences still rely on `report/*` kits after the cover. Body diversity is weaker than pitch/sales decks. |
| Open | Closing / timeline / pricing reuse | `closing/b` (8×), `timeline/horizontal` (6×), and `pricing/three-tier` (4×) remain high-frequency shared geometries across niches. |

---

## 6. Recommended next moves

1. Add anti-grid variants for **closing**, **timeline**, and **pricing** — the remaining high-frequency shared silhouettes.
2. Diversify **consulting-report** mid-deck beats beyond `report/*` so consulting decks do not read as one layout family after the cover.
3. Spot-check **circle-hero** / **type-wall** contrast under dark and accent-heavy themes (Cyberpunk Gaming used dark type on cyan).

---

## Artifacts

- `out/slidexy-catalog/catalog.json`
- Per template: `cover-preview.png`, `grid-preview.png`, `deck.pptx`
- Cover kits: `kit/cover/{editorial-overlap,band-horizon,bottom-slab,right-bleed,circle-hero,type-wall,brutalist}.json`
- Body kits: `kit/feature/{asymmetric,floating-card,typography-hero}.json`, `kit/team/cutout.json`, `kit/testimonial/cutout.json`, `kit/comparison/quadrant.json`
- Wiring: `engine/sequences.ts`, `engine/selectVariant.ts`, `scripts/generate-slidexy-catalog.ts`
