# Design library system

The shared registry is `engine/design-system/families.json`. It separates family brand tokens, visual character, asset policy and shared content/layout rules. PLAY / LAB reads its brand directly from the registry. Editorial and Executive use the same registry and a separate family generator.

Generate Editorial and Executive: `node -r ts-node/register/transpile-only scripts/generate-library-families.ts`. Add `--publish-local` to publish both through the existing admin publisher and verify previews/downloads. Outputs are in `out/design-library`. PLAY / LAB retains its existing npm commands.

Enforced in the new family generator: headline/body character budgets, schema validity, adjacent silhouette variation, no text truncation and warning-free PNG rendering. The registry also documents minimum type size, safe margins, mock-asset rejection and example-data labeling; these are authoring policies, not yet a universal validator for all legacy generators. The PLAY / LAB generator separately rejects mocked assets.

The frontend library page now fetches published backend entries from `/api/catalog` and exposes their preview and native PPTX download. Existing block templates still use their own editing model. This provides shared discovery, not automatic conversion between the two editor formats. Browser interaction and deployment remain separate checks.

Editorial and Executive each include 12 slide purposes and four editable native tables. Their content is a starter brief with prompts to replace; it is not a completed research report. Family geometry uses four recurring motifs plus evidence layouts. New families should add purpose-specific structures rather than simply changing colors.

Next work: exact Iconify ID resolution and license metadata; universal content-aware layout selection; short/normal/long content fixtures; automated contrast/bounds checks; frontend editor import for published native decks; then VLM review alongside deterministic checks. VLM integration remains mocked. PowerPoint round-trip checks still depend on local conversion tools.
