# Art direction proofs

Three intentionally different cover/body pairs for visual review before full-deck expansion.

- **Editorial:** warm paper, Georgia display type, rust side panel, tactile art crop, fine rules. Use generous whitespace and one editorial statement per slide.
- **Architecture:** charcoal framing, light sans-serif headings, large photographic crops. Preserve a clean text panel; choose images with space and subject placement suitable for the crop.
- **Executive:** pale background, dark teal, restrained lime, bold headlines and dominant metrics. Keep supporting information subordinate to one decision or finding.

Run `node -r ts-node/register/transpile-only scripts/generate-art-directions.ts` from the backend. This generates six `direction-*` JSON kits under `kit/cover` and `kit/feature`, and three two-slide PPTX proofs plus PNG previews under `out/art-directions`.

Each output folder includes `spec.json` with the spec, brand tokens and explicit kit selections. Pass all three to the renderer; the base palette alone does not reproduce these directions. The generator requires the existing curated images in `engine/cache/photos`; it does not download replacements.

These are draft kits, not a replacement for the production catalog. Sample metrics and bar lengths are illustrative. Body layouts should be extended into meaningful narrative, comparison and evidence slides after choosing a direction. PNG previews were visually reviewed; PowerPoint font substitution can change appearance on machines without Georgia, Calibri, Segoe UI or Arial.
