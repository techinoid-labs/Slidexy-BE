# Creative design direction (handoff)

Living north star for Slidexy creative template systems. **Update this file when
hard lessons change.** New agents should read this before inventing families.

Companion docs:
- Gallery inventory → [`DESIGN-SYSTEMS-GALLERY.md`](./DESIGN-SYSTEMS-GALLERY.md)
- AI routing → [`AI-FAMILY-ROUTING.md`](./AI-FAMILY-ROUTING.md)
- Fidelity tiers → [`FIDELITY-TIERS.md`](./FIDELITY-TIERS.md)

Code sources of truth:
- SEL builders + `FAMILY_SEL` → `scripts/lib/sel.ts`
- Render/publish → `scripts/lib/designKit.ts`
- Routing keywords → `scripts/lib/familyRouter.ts`

---

## Product bet

Slidexy does **not** win on template volume. Each family is a **design system**:
metaphor + exclusive SEL anatomy + presentation talk-track. Different silhouette,
not a recolor of the same grid.

## Agent vs engine

| Who | Owns |
|-----|------|
| **Author / agent** | Metaphor, brand, exact geometry, copy structure, which SEL units, unique cover/quote/close |
| **Engine** | Slot binding, tokens, autofit/wrap, PNG paint, PPTX export, ambient OOXML, gates, catalog |

Layouts are **hand-authored** in batch scripts. The engine executes; it does not invent carnival vs parlor.

Rough split for creative decks: **~85% author design decisions, ~15% engine execution** (but engine is 100% of production fidelity).

---

## Hard rules (do not regress)

1. **Presentation-first.** Every deck must be presentable: photo-led cover, readable talk track, quote, close. Motifs accent — they do not become the slide.
2. **No HUD / dashboard / widget walls.** Sonar rings, gauges, spectrum bars as *ornament* only. If removing the photo still leaves a full UI panel, it is wrong.
3. **Unique silhouette per family.** Especially **closing slides** — never reuse the same recipe (accent field + big circle + centered CTA) across families.
4. **Unique SEL set.** Each family owns 3–5 units; `assertUniqueSel` rejects identical 3+ overlaps.
5. **Morph is retired** for creative flagships. `FLAGSHIP_MOTION` = `morph: false`, `cameraPan: false`, fade + optional ambient only. Do not re-enable Morph until a stronger motion system is designed.
6. **Label geometry must track layout.** If shapes arc/lift, labels either follow with the same formula or sit on a **flat baseline** under the cluster — never a single fixed Y over moving shapes (see carnival wheel fix).
7. **Avoid AI-default looks** on branded pages: purple-on-white, cream+terracotta cluster, broadsheet hairline newspaper, generic Inter/Roboto stacks when a face is chosen.

---

## Deck skeleton (oxide / hearth pattern)

Use this spine; vary the clothes:

1. **Cover** — full-bleed (or framed) photo + scrim + big title + one family motif accent  
2. **Feature list / cards** — content-forward, motif secondary  
3. **Photo + copy split** — real image, short blocks  
4. **Process / materials / set** — numbered or swatches  
5. **Quote** — unique treatment per family (not always centered photo plate)  
6. **Close** — unique silhouette using that family’s SEL  

## Motion (current)

```ts
const FLAGSHIP_MOTION = {
  morph: false,
  ambient: true,
  continuityFade: true, // Landscapes recipe
  cameraPan: false,
  scatter: false,
  defaultTransition: "fade",
  durationMs: 1600,
};
```

### Continuity fade (why Landscapes feels perfect)

That deck is **not Morph**. It is a **slow crossfade** (`spd="slow"`) between slides that keep most shapes at the **same x/y/size**. Only the beat changes (title word, one freeform cluster). Shared chrome dissolves in place — so it *looks* like elements settle into place.

**Design rules to match that feel:**
1. Keep persistent chrome (wall, plate, brand lockup) on a **stable morphId + identical box** across consecutive slides.
2. Change only 1–3 beat elements per advance (new sticky, new title, new photo crop).
3. Prefer **slow fade (~1600–1800ms)** over wipe/push for feature sequences.
4. Entrance-animate **new morphIds only** — never re-animate shared chrome.

**Role transitions** (with `continuityFade`):

| Role | Transition | Feel |
|------|------------|------|
| cover / feature / process / stats / close | fade (~1600–1800ms) | settle / dissolve |
| problem / solution / comparison | push (~900ms) | argument beat |

**Entrances:** soft `fadeIn` stagger on **new** targets only (`entrancesMode: "newOnly"`).

**Target awareness** (`engine/motionTargets.js` + `engine/motionGrammar.js`):

Future generations should **mark motion at kit-write time** (preferred), with pattern fallback:

```ts
import { asBeat, asChrome, asLabel, asDot, asTitle, asStage } from "./lib/designKit";

asBeat(rect("note0", …), { morphId: "note-0" })
asLabel(text("copy0", …), "note0")          // host id — slams with the note
asDot(circle("v0_3", …), 0, 3)              // fast pop cascade
asChrome(rect("shade0", …))                 // persist under fade
asStage(rect("bg", …))
asTitle(text("title", …))
```

| Kind | Intent | Preset |
|------|--------|--------|
| `beat` (sticky / card) | enter | slam / slamDrop with labels |
| `label` + `motionHost` | enter | same delay as host, slamDrop |
| `dot` | enter | pop (fast cascade) |
| `chrome` / `stage` | persist | none (continuity fade only) |
| `title` | enter | fadeUp |

- Pattern fallback still tags `note*`, `n##`, `sticker`, `vR_C`, `bg`, `shade*` when unmarked
- Continuity is **geometry-aware**; note+label pairs use **slamDrop** (no scale) so paper/text stay locked
- `designKit` defaults to `FLAGSHIP_MOTION` and runs `annotateDeck` + `lintMotion` on every generate
- Caps ~6 host beats/slide; **all** vote dots still cascade

**Ambient:** Ken Burns on cover heroes; pulse on close/stats plates; float only on clear motif targets. One ambient effect per slide. Ambient must never use `interactiveSeq`/`cancelBubble` (breaks Back).

Re-apply to published decks: `npm run motion:flagship`

---

## Batches & how to rebuild

| Batch | Script | Families | Publish |
|-------|--------|----------|---------|
| Object | `scripts/generate-object-batch.ts` | oxide, gulhane, darkroom, rosso | `npm run publish:object-batch:local` |
| Element | `scripts/generate-element-batch.ts` | gridlock, lantern, grade, hearth | `npm run publish:element-batch:local` |
| Wild | `scripts/generate-wild-batch.ts` | abyss, eclipse, voltaic, prism | `npm run publish:wild-batch:local` |
| Vibe | `scripts/generate-vibe-batch.ts` | jukebox, carnival (funky); parlor, linen (soft) | `npm run publish:vibe-batch:local` |
| Mix | `scripts/generate-mix-batch.ts` | marquee, strike (funky); apiary, newsstand (soft) | `npm run publish:mix-batch:local` |
| Portfolio | `scripts/generate-portfolio-batch.ts` | vitrine, dossier, mezzanine, platepress | `npm run publish:portfolio-batch:local` |

**Mobile sync:** after publish, `npm run bake:tier-b` then `npm run publish:firestore-templates` (see `FIDELITY-TIERS.md`). Flutter consumes Firestore on branch `feat/be-template-catalog-sync`.

Single family: append `--only=<id>` (e.g. `--only=carnival-lot`).

Previews and decks: `out/<id>/preview.png`, `slide-*.png`, `deck.json`.

---

## Adding a new family (checklist)

1. Invent a **physical metaphor** not already in `FAMILY_SEL`.
2. Add 3–5 **new or uniquely combined** SEL units in `scripts/lib/sel.ts` + builders.
3. Register family in `FAMILY_SEL` + keywords in `familyRouter.ts`.
4. Author a batch template with **distinct cover / quote / close** (diff against oxide and against siblings).
5. Run `assertUniqueSel` (batch scripts already call it).
6. Publish-local; open `preview.png` and verify it still reads as a **presentation**.
7. Update this file + `DESIGN-SYSTEMS-GALLERY.md` in the same change.

---

## Lessons learned (session history)

| Mistake | Fix |
|---------|-----|
| Morph tagged every image as `hero`; badges/plates Morph’d | Full-bleed-only hero; Morph retired for flagships |
| “Crazy” decks became sonar/gauge HUDs | Rebuild presentation-first; motifs as accents |
| Four wild closes identical (accent + circle) | Unique close per family (rings / crescent / pour / rose) |
| Carnival cab labels on fixed Y over arced circles | Flat label row under lowest cab |
| Stale gallery still advertised Morph camera-pan | Gallery + this doc must match `FLAGSHIP_MOTION` |

---

## Evolution priorities (next)

1. Stronger **native motion** to replace Morph (professional, intentional — not random ambient).
2. Wire `routeFamily` into live compose with these kits.
3. Keep expanding **funky** and **soft** lanes without converging silhouettes.
4. Optional: Tier B Flutter bake for a subset of SEL units.

---

## Review gate before merge

- [ ] Preview looks like a deck someone can present, not a UI kit  
- [ ] Close slide is unique vs other families in the same batch  
- [ ] Photo present on cover + at least one interior  
- [ ] No Morph scenes (`layoutSequence` has no `-pan-` / `-scatter-`)  
- [ ] Gallery + this direction doc updated if a new family shipped  
