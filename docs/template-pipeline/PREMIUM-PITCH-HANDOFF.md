# Premium pitch template handoff

Use this guide when authoring another local Slidexy pitch template. The generators are the source of truth for geometry, type, color, asset placement and sample copy. Each run writes the slide specification to `examples/<id>.json`, layout kits to `kit/<role>/`, and the PowerPoint and previews to `out/<id>/`. The families below are local drafts.

## Two depth constructions already in the library

| Decision | Heel Turn | Shell Index |
|---|---|---|
| Cover idea | An exploded climbing shoe interrupts a two-word sports poster. | A shell specimen rests inside a recessed museum case. Its identification plate projects over the rim. |
| Read order | Start at HEEL in the upper left, follow the shoe toward the detached sole, then read TURN across the sole. The subtitle has a clear area at lower left. | Read the shell silhouette first, the centered nameplate second, and the subtitle beneath the title. The pins and rim define the scale of the case. |
| Back to front | Cobalt ground → lilac disc → orange stripe → HEEL → transparent shoe cutout → TURN and supporting text. | Deep jade ground → offset rim and brass edge → lining and recessed well → transparent specimen → plate shadow → ivory plate → pins and text. |
| Typography | Impact display with Trebuchet MS body. On the 1600 × 900 canvas the two title words use sizes 232 and 197. They are separate editable objects. | Baskerville Old Face display with Gill Sans MT body. The centered title uses size 99. The subtitle uses size 32 with slightly expanded spacing. |
| Color roles | Cobalt `#2537A5` anchors the poster, lilac `#C5ACF1` separates the shoe silhouette, and orange `#FF803D` echoes the upper. | Deep jade `#0D3532` defines the cavity, jade `#164F49` the lining, brass `#D5BB83` the edge, and paper `#FAF4E5` the label. |
| Interior signature | Staggered Monday, Wednesday and Friday panels follow a repair batch. The route chart connects pickup density to break-even. | A pinned lot slip follows the shell through collection. Descending weight marks reconcile collected, sorted and accepted quantities. |

The shoe upper and sole form one transparent image. The oyster cluster also forms one image. Backgrounds, title text, supporting text and framing shapes remain separately selectable in PowerPoint. Both examples demonstrate static depth.

**Exact layouts and assets.** Open the [generator](../../scripts/generate-heel-and-shell.ts), the [Heel Turn cover kit](../../kit/cover/heel-turn-1.json), the [Shell Index cover kit](../../kit/cover/shell-index-1.json), and the [source artwork](../../assets/heel-and-shell/). The kit JSON records numeric bounds and z-order. The example specifications bind the words and figures to slots. [Heel Turn example](../../examples/heel-turn.json) · [Shell Index example](../../examples/shell-index.json)

To rebuild both decks from the backend root with project dependencies installed:

```powershell
node -r ts-node/register/transpile-only scripts/generate-heel-and-shell.ts
```

## Other recent compositions to check

| Families | Existing visual idea | Authoring source |
|---|---|---|
| Cueglass / Lost Property Club | Opera captions and a live cue sheet / painted lost objects and claim tags | [Generator](../../scripts/generate-cue-and-claim.ts) |
| Chorus Ledger / Pleat House | Engraved field plates and a radial listening record / folded retail screens and a perforated rental ticket | [Generator](../../scripts/generate-field-and-fold.ts) |
| Night Tank / Soft Landing | An ice-block cutaway with a copper coil / a ceramic vessel suspended between molded cushions | [Generator](../../scripts/generate-venture-pitches.ts) |
| Knight Relay / Orris Hour | A split-line chess poster and editable board / a fragrance still life and timed scent readings | [Generator](../../scripts/generate-knight-orris.ts) |
| Fuse Rack / Plate River | A pulled cartridge interrupts a wall of fuse slots / stacked ceramics over a teal circulation baseline | [Generator](../../scripts/generate-fuse-and-plate.ts) |

### Fuse Rack / Plate River (added)

| Decision | Fuse Rack | Plate River |
|---|---|---|
| Cover idea | A fuse cartridge is pulled from a vertical bay rack. Title sits on the cartridge plane; remaining slots read as inventory. | A stack of ceramic plates rests in a glaze well. Title sits left of the stack; RIVER rides a teal return band under it. |
| Read order | Cartridge / object → FUSE → RACK in the slot column → subtitle at lower left. | Plate stack → PLATE → RIVER on the tide band → subtitle in the well. |
| Typography | Bahnschrift display with Consolas body (technical utility). | Georgia display with Calibri body (hospitality ceramics). |
| Color roles | Slate `#2B303A`, safety yellow `#F0C40D`, porcelain `#F7F4EE`, tip red `#C43B2C`. | Terra `#C4785A`, glaze `#FFF8F0`, river `#1F6F6A`, sand `#E8D5C4`. |
| Evidence slide | Cold-minutes avoided vs shared spare depth (bar). Meaningless outside fuse pooling. | Cost per 100 servings vs washes-per-plate-life (line). Meaningless outside plate float. |

```powershell
node -r ts-node/register/transpile-only scripts/generate-fuse-and-plate.ts
```

Local decks: [`out/fuse-rack/`](../../out/fuse-rack/) · [`out/plate-river/`](../../out/plate-river/)  
Artwork: [`assets/fuse-and-plate/`](../../assets/fuse-and-plate/)

## Brief for the next agent

> Create two premium pitch decks as local Slidexy templates. Review the existing examples, the design direction and this handoff. For each new family, choose a different cover construction and a different way of organizing the interior story. Describe the focal point, the eye path and how type interacts with the subject. Give each family a product-specific evidence slide that would lose its meaning if copied into the other deck. Use contextual artwork, editable text and editable data graphics. Write substantive sample content and identify fictional numbers. Render the PowerPoints, inspect both covers at thumbnail size, and review the full contact sheets for repeated structures. Deliver the generators, kits, examples, artwork and local deck links.

For a layered cover, inspect the exported file in PowerPoint: select the title, move the foreground object temporarily, and check that the intended overlap is built from separate elements. Check the typefaces on the rendering machine and give cards, chart labels and captions enough space for their actual text. Compare the two contact sheets in grayscale as a quick test of whether silhouette and reading order carry the difference.

See the [project design direction](DESIGN-DIRECTION.md) for broader authoring conventions and the [design systems gallery](DESIGN-SYSTEMS-GALLERY.md) for earlier families.

## Bellwether / Cacao Type

Added as two local 12-slide premium-design drafts. Each includes three dedicated AI-generated assets, editable text, native shapes and an editable evidence chart. These examples use static layered depth.

| Decision | Bellwether | Cacao Type |
|---|---|---|
| Subject | Historic-bell monitoring and conservation records | Personalized chocolate for event agencies |
| Cover construction | Suspended bronze bell in a dark recessed arch, with BELL behind the object plane and WETHER in front | Glossy chocolate letters cross a pink paper band, with a foreground berry TYPE strip |
| Typography | Garamond display with Calibri body | Bookman Old Style display with Trebuchet MS body |
| Palette | Plum #342431, copper #DAAC7D, archival paper #F1E8D9 | Mint #D6E8BD, berry #531F31, raspberry #AB284A, paper #F9F1DE |
| Interior structure | Session records, stepped review sequence, decay trace, inspection gates | Order quadrants, batch receipt, production calendar, two-signature release |
| Evidence | Normalized vibration decay over seconds for comparable sessions | Production minutes per box across batch sizes |
| Depth boundaries | Bell and rope share one transparent raster, title and arch remain separate | Confectionery shares one transparent raster, paper bands and title remain separate |

The ventures and figures are fictional. All numeric assumptions are illustrative. The decay chart supports a review narrative and makes no diagnostic claim.

Source and outputs are available in the [generator](../../scripts/generate-bell-and-cacao.ts), [artwork folder](../../assets/bell-and-cacao/), [Bellwether example](../../examples/bellwether.json), [Cacao Type example](../../examples/cacao-type.json), [Bellwether output](../../out/bellwether/) and [Cacao Type output](../../out/cacao-type/). Exact bounds and z-order are saved in the corresponding cover, feature and closing kit JSON files.

Rebuild from the backend directory.

```powershell
node -r ts-node/register/transpile-only scripts/generate-bell-and-cacao.ts
```

PowerPoint renders were inspected across all 24 slides. Both generators passed layout validation. The new generator passes a targeted TypeScript check. The full repository check reports eight pre-existing arithmetic typing errors in generate-geography.ts.

## Pulse Chamber / Slide Atlas

Two 14-slide medical service templates added on 18 November 2026 as local premium-design drafts.

| Decision | Pulse Chamber | Slide Atlas |
|---|---|---|
| Subject | Cardiac diagnostic service planning | Histopathology laboratory operations |
| Cover | Ceramic anatomical heart extends beyond a circular aperture over a recessed medical cross | Transparent glass slides form an exploded stack between specimen-register rules |
| Type | Bahnschrift display, Calibri body | Bodoni MT display, Gill Sans MT body |
| Palette | Navy #113A46, aqua #BDE6E0, coral #EA674D, pale paper #ECF5F3 | Purple #382953, lavender #DACCF0, pink #DCA5BD, ivory #F7F3E8 |
| Infographics | 100-referral dot map, handover chain, scan-capacity grid, quality table, timeline and proportional budget | Case/block/slide lineage, exception-return flow, stage-duration bars, role map, audit comparison and phased rollout |
| Native charts | Referral/completion trend and illustrative appointment wait | Open-case stage distribution and workload trend |
| Depth | Isolated heart, separate aperture and cross, lifted workflow stages | Isolated glass stack and raised specimen, record and budget shapes |

All 28 slides use fictional service content with synthetic figures identified on data slides. The four dedicated AI assets are conceptual artwork. The heart and tissue patterns are not diagnostic or anatomical teaching references. Depth is static. PowerPoint text, diagrams and four native charts are editable. Each generated object illustration is one raster.

Read the [source and data notes](../../assets/medical-depth/SOURCES.md). The generator copies these notes into each output folder.

Rebuild with the [medical generator](../../scripts/generate-medical-depth.ts).

```powershell
node -r ts-node/register/transpile-only scripts/generate-medical-depth.ts
```

Examples are saved as [Pulse Chamber](../../examples/pulse-chamber.json) and [Slide Atlas](../../examples/slide-atlas.json). Kits use matching family names under cover, feature and closing. Outputs include PowerPoint files, full-slide PNGs and contact sheets in [Pulse Chamber](../../out/pulse-chamber/) and [Slide Atlas](../../out/slide-atlas/).

Both decks passed layout validation and the generator passed a targeted TypeScript check. PowerPoint rendered all 28 slides, with two native charts confirmed in each deck. Review included covers, infographic labels, source notes and contact sheets. These drafts remain local.
