# Asset library

Decorations now come from a local library. Stock photos are only used for pictures that are not decorations.

## Library

`scripts/fetch_assets.js` writes eight original shapes into each of `assets/decorations/tech`, `organic`, `corporate`, and `creative`. Every shape is a transparent PNG plus a matching SVG. Names are short, such as `grid-01`, `blob-02`, and `frame-03`. Run `node scripts/fetch_assets.js` to rebuild them.

## Converter and injector

The converter marks a picture `isDecoration: true` and `originalRole: "decoration"` when its mask is a custom shape path, or when it covers less than 10% of the slide. The injector also treats an existing transparent PNG, a custom clip, or a small picture the same way, so the current tech seed does not have to be reconverted.

Gemini files the prompt as tech, organic, corporate, or creative and stores that on `deck.assetVibe`. A decoration keeps its x, y, width, height, and zIndex. Its url is replaced with a file from `assets/decorations/{vibe}/`. It is not sent to Pexels.

## Dashboard

After a generation, the admin page shows the line next to the prompt, for example `Prompt: A cybersecurity firm. | Vibe: Tech`.

## Tests

Cybersecurity, on `black-and-grey-3d-shapes-tech-company-presentation`, was filed as tech. Brand Sentinel Shield. All 62 pictures were decorations. None were stock photos. The cover uses the library rings, grid, and circuit marks, and the title reads CYBERSECURITY. Output: `docs/template-pipeline/asset-library/cyber`.

A sustainable fashion brand, on the beige portfolio seed, was filed as organic. Brand EverBloom Apparel. All 64 pictures were decorations from the organic folder: blobs, leaves, and waves. Output: `docs/template-pipeline/asset-library/fashion`.

The admin page at http://127.0.0.1:5055 is running this code. Refresh it before the next generate.
