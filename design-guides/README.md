# Slidexy design guides

Five design families turn the 16 supplied slide references into reusable directions for template kits. All 16 reference patterns now have draft engine kits and five opt-in sequences. Existing default template pools are unchanged.

## Families

- **Atmospheric Editorial** — statement covers, spacious contents, centered interludes and low contact columns.
- **Architecture Portfolio** — full-height photo splits, project-number stacks and staggered masonry.
- **Executive Insight** — insight/donut compositions, chart commentary, progress bars and continuation timelines.
- **People and Partners** — consistent portrait rows and an open, staggered partner-logo field.
- **Minimal Commercial** — unboxed objectives and pricing with outlined price blocks.

Each JSON profile defines identity, typography, whitespace, structural variations, anti-patterns, content budgets, existing kit starting points and suggested deck rhythm. Rhythm entries describe visual pacing, not valid DeckSpec role names or a registered engine sequence.

## Generate a kit-authoring prompt now

Run from Slidexy-BE:

```powershell
node -r ts-node/register/transpile-only scripts/build-design-guide.ts --list
node -r ts-node/register/transpile-only scripts/build-design-guide.ts architecture-portfolio --pattern=ref-masonry-showcase
node -r ts-node/register/transpile-only scripts/build-design-guide.ts executive-insight --pattern=ref-insight-donut
```

The command prints a complete authoring prompt: shared rules, one family, one source-derived blueprint in engine units, and the current kit schema. With no --pattern argument, it chooses the family's first pattern. Pass the prompt to your coding agent to create and register that kit. It performs no network request and does not modify kit files.

The source of reference geometry is docs/layout-dna/canva-reference-layouts.json. All 16 sources are covered once across the five profiles. Blueprints scale 1920 x 1080 geometry to 1600 x 900; font floors then take priority over exact raster proportions.

## Readability and implementation

The references use body text that would be too small after direct scaling into the current PowerPoint export. Guides therefore require at least 24 engine units for body/metadata, 40 for titles and 20 for chart labels. Shorten or split content to fit. The generic content frame is for inset content; full-bleed images are exceptions.

Follow KIT-AUTHORING.md to map blueprints into the real slot schema and renderer. Soft grain, edge fades and some icon/logo bindings need explicit support or an acknowledged fallback. Existing kit starting points have related structures; they do not reproduce the references exactly.

The generated kits are listed in engine/design-guide-catalog.json. Guides are intentionally not appended to the content-only DeckSpec prompt: asking that model to invent coordinates would bypass deterministic layouts.

## Generate the implemented templates

```powershell
node -r ts-node/register/transpile-only scripts/generate-guided-kits.ts
node -r ts-node/register/transpile-only scripts/render-guided-templates.ts
```

The first command writes 16 descriptive ref-* kits, five example DeckSpecs under examples/design-guides, and the opt-in sequence catalog. It refuses to overwrite locked kits or unrelated existing files. The older ref-layout-* files are preserved.

The second command uses local cached demo photography, validates the samples, selects the registered sequences, exports editable PPTX files and slide/grid PNG previews under out/guided-templates, and rejects truncated text or preview warnings. It makes no API calls. Its curated photo filenames must exist in engine/cache/photos; missing files are reported explicitly. Production rendering continues to use the existing photo resolver unless a caller supplies one.

To use a family, load its example DeckSpec and replace the demo content. Keep its style.sequence value, for example guide-architecture-portfolio. The other sequence IDs are guide-atmospheric-editorial, guide-executive-insight, guide-people-and-partners and guide-minimal-commercial. Preserve each sequence's slide count and beat order. selectAll uses these beats to select the new kits deterministically. Do not send these short sampler decks through the legacy Pitch/Overview exact-role gates; those enforce different narrative requirements.

preserveLayout on the new kits bypasses the renderer's global header/callout rewrites. Progress fill shapes use widthFrom: statsN.value and require percentages between 0% and 100%. Text may declare a supported numeric fontWeight. Agenda and partner labels use items[], so eight agenda entries survive paragraph normalization.

These are geometry-focused adaptations: clean photo crops replace soft edge fades, editable numbers replace source outline icons, and partner names replace unlicensed logo assets. Grain decoration is omitted. Sample names, prices, contact information, charts and affiliations are demonstration data. Each kit records its deviations in implementationNotes.

## Validation

```powershell
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
node -r ts-node/register/transpile-only -e "console.log(require('./engine/validateSchema').assertEngineSchemas())"
```

## Density for new full templates

Start with at least 12 slides. Keep the jacket and closing card visually simple. Give each interior slide enough subject-specific sample content to read as a finished spread. For lookbooks, use 50 words of interior copy as the minimum and aim for roughly 55–75 across two labeled passages. Menu entries, track annotations, material notes, comparisons and captions can carry that information. Count the actual visible copy. Preserve readable body type and expand the layout when a passage does not fit. A short gallery proof can still precede the full deck.
