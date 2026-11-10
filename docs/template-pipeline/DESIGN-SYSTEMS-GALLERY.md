# Design Systems Gallery

Slidexy does not compete on template volume. Each entry is a **design system**: metaphor + Signature Element Language (SEL) + presentation grammar.

**Direction / handoff (read first):** [`DESIGN-DIRECTION.md`](./DESIGN-DIRECTION.md)

Catalog: [`engine/design-system/sel-catalog.json`](../../engine/design-system/sel-catalog.json)  
Builders: [`scripts/lib/sel.ts`](../../scripts/lib/sel.ts)

## How to read a system

| Field | Meaning |
|-------|---------|
| Metaphor | Physical object / place the deck is drawn from |
| SEL units | Named elements unique to this family (3–5) |
| Motion | Fade transitions; optional ambient (Morph retired) |
| Demo | Local id under `out/` and catalog |

## Motion (all creative flagships)

```ts
{ morph: false, ambient: true, cameraPan: false, scatter: false, defaultTransition: "fade" }
```

## Core eight (object + element batches)

| Family | Metaphor | Demo | Rebuild |
|--------|----------|------|---------|
| darkroom | Photo lab / proof | `darkroom-proof` | object-batch |
| grade | Color-grade suite | `grade-suite` | element-batch |
| gulhane | Transit destination board | `gulhane-line` | object-batch |
| gridlock | Pit-lane radio | `gridlock-radio` | element-batch |
| hearth | Interior fireplace folio | `hearth-folio` | element-batch |
| oxide | Street mural atelier | `oxide-atelier` | object-batch |
| lantern | Night cafe counter | `lantern-counter` | element-batch |
| rosso | Private garage bay | `rosso-bay` | object-batch |

```bash
npm run publish:object-batch:local
npm run publish:element-batch:local
```

## Wild (alien metaphors, presentation-led)

| Family | Metaphor | Demo | Close silhouette |
|--------|----------|------|------------------|
| abyss | Bathysphere / sonar | `abyss-sonar` | Sonar rings + keel bar |
| eclipse | Planetarium vault | `eclipse-vault` | Giant crescent, title left |
| voltaic | Molten foundry | `voltaic-foundry` | Diagonal pour + ember badge |
| prism | Stained-glass crypt | `prism-crypt` | Rose window + spectrum footer |

```bash
npm run publish:wild-batch:local
```

## Vibe (funky + soft)

| Family | Lane | Metaphor | Demo | Close silhouette |
|--------|------|----------|------|------------------|
| jukebox | Funky | Diner jukebox reel | `jukebox-reel` | Vinyl spines + accent plate “Play.” |
| carnival | Funky | Night carnival lot | `carnival-lot` | Ferris cabs on accent “Ride.” |
| parlor | Soft | Letterpress stationery | `parlor-ink` | Calling card + wax seal “Yours.” |
| linen | Soft | Linen postcard rack | `linen-post` | Stamp row + ribbon “Send.” |

```bash
npm run publish:vibe-batch:local
# or one family:
npm run publish:vibe-batch:local -- --only=carnival-lot
```

## Mix (funky + soft)

| Family | Lane | Metaphor | Demo | Close silhouette |
|--------|------|----------|------|------------------|
| marquee | Funky | Theater marquee night | `marquee-board` | Dual bulb rows + letterboard “Lights.” |
| strike | Funky | Bowling alley lane | `strike-lane` | Lane + score frames “Spare.” |
| apiary | Soft | Honey apiary jars | `apiary-jar` | Jar label + hive bars “Gather.” |
| newsstand | Soft | Corner magazine rack | `newsstand-rack` | Spine stack + masthead “Read on.” |

```bash
npm run publish:mix-batch:local
```

## Portfolio (showcase metaphors)

| Family | Metaphor | Demo | Close silhouette |
|--------|----------|------|------------------|
| vitrine | Museum vitrine / plinth | `vitrine-case` | Empty glass case + plinth “View.” |
| dossier | Clipped paper dossier | `dossier-clip` | Stacked sheets + clip + tabs “Filed.” |
| mezzanine | White-cube gallery | `mezzanine-cube` | Wall frame + didactic + pedestals “Install.” |
| platepress | Printmaker plate rack | `platepress-rack` | Plate slots + ink well “Pull.” |

```bash
npm run publish:portfolio-batch:local
```

## Competitive framing

| Canva / Gamma | Slidexy |
|---------------|---------|
| “Pick a template” | “Enter a design system” |
| Same grid, new colors | Unique silhouette + SEL |
| Clip / video motion | Native PPTX (fade + ambient for now) |
| AI fills a modern layout | AI routes metaphor → SEL → bind |

## Remorph / competitive demo

```bash
node -r ts-node/register/transpile-only scripts/generate-competitive-demo.ts
```

Outputs under `out/competitive-demo/`.
