# DNA and mutation

Generation is gone. A deck enters through `services/templatePipeline/convert/pptxToDeck.js` or `services/templatePipeline/mutate.js`.

## Removed

- `composeDeck.js`
- `reasonDeck.buildStrategy` and the layout builders that lived inside it
- `generateDeck()` in `generateDeck.js`. `validateDeck` stays
- `store.createTemplate`
- `pipeline.runBatch`. `pipeline.js` no longer generates a deck
- `runBatch.js`
- `POST /api/template-pipeline/generate` and `POST /api/template-pipeline/batch` in `devServer.js` and `routes/templatePipelineRoutes.js`
- the `templates:batch` npm script
- `scripts/export_editorial_run.js`, `scripts/export_harbor_decks.js`, `decorations/renderPreview.js`, `typeScale.test.js`
- the `composeDeck` sections of `fitText.test.js`, `decorations.test.js`, and `reasonDeck.test.js`
- deck generation inside `audit/sampleOurs.js`

`catalogCaps.planGeneration` stays. `inventBrief.js`, `catalogCaps.test.js`, and `fontRoles.test.js` still call it, so it is not only a generator caller. `planReasoning` stays as a catalog of job names. Nothing builds a slide from it.

## Extracted DNA

Saved as `app-library/<id>.dna.json`. Body size is the most common text size. h1, h2, and h3 are the larger sizes, as a ratio to that body. Spacing is the 3–5 most common edge insets, in pixels. The six palette entries are the token roles. Photo treatment and motif counts are shares and counts of the elements.

The converter left default tokens on these decks. Ink `#1C1916` and accent `#1E3A32` are not painted on the slides, so their usage is 0. The slides use other hexes. The mutator shifts every painted color, not only those two unused tokens.

### health-medical

| Field | Value |
| --- | --- |
| typeScale | h1 8.54, h2 3.84, h3 1.33, body 1 |
| spacingGrid | 68, 92, 104, 116, 248 |
| palette | bg `#FBD523` 6.1%, surface `#FBD523` 6.1%, ink `#1C1916` 0%, muted `#1C1916` 0%, accent `#1E3A32` 0%, card `#FFFFFF` 21.2% |
| photoTreatments | masked 100%. full bleed, mat, duotone, and plain are 0 |
| motifSignature | rectangle 10, path 49. roundedRect, ellipse, and arch are 0 |

### cinema-neon

| Field | Value |
| --- | --- |
| typeScale | h1 20.38, h2 17.92, h3 13.31, body 1 |
| spacingGrid | 32, 44, 64, 92, 268 |
| palette | bg `#FFFFFF` 72.7%, surface `#FFFFFF` 72.7%, ink `#1C1916` 0%, muted `#1C1916` 0%, accent `#1E3A32` 0%, card `#FFFFFF` 72.7% |
| photoTreatments | masked 100%. full bleed, mat, duotone, and plain are 0 |
| motifSignature | rectangle 10, path 22. roundedRect, ellipse, and arch are 0 |

### company-minimal

| Field | Value |
| --- | --- |
| typeScale | h1 21.16, h2 6.4, h3 4.47, body 1 |
| spacingGrid | 40, 72, 92, 136, 248 |
| palette | bg `#FFFFFF` 12.8%, surface `#FFFFFF` 12.8%, ink `#1C1916` 0%, muted `#1C1916` 0%, accent `#1E3A32` 0%, card `#FFFFFF` 12.8% |
| photoTreatments | masked 100%. full bleed, mat, duotone, and plain are 0 |
| motifSignature | rectangle 12, path 37. roundedRect, ellipse, and arch are 0 |

## Variants

Five variants of each seed. Hue shifts are +16, −18, +28, −24, and +34 degrees. Neutrals stay neutral. Background lightness is refit so the dominant text-on-background contrast stays within 0.5 of the seed, and the accent is refit the same way. Every photo URL was replaced with a different file whose aspect ratio is within 20%. `alignX` and `alignY` are unchanged. Positions, font sizes, masks, paths, type scale, spacing grid, and motif counts are unchanged.

JSON is in `generated-templates/mutations/<id>/`. Renders are in `docs/template-pipeline/mutations/<id>/`. SSIM is the same windowed 10×10 score used on the converter, mean of the slides, variant against a fresh render of its seed.

| Variant | Hue | Photos swapped | DNA gate | Mean SSIM |
| --- | ---: | ---: | --- | ---: |
| health-medical-v1 | +16 | 23 | pass | 64.4 |
| health-medical-v2 | −18 | 23 | pass | 63.0 |
| health-medical-v3 | +28 | 23 | pass | 61.5 |
| health-medical-v4 | −24 | 23 | pass | 62.6 |
| health-medical-v5 | +34 | 23 | pass | 58.6 |
| cinema-neon-v1 | +16 | 20 | pass | 63.4 |
| cinema-neon-v2 | −18 | 20 | pass | 64.2 |
| cinema-neon-v3 | +28 | 20 | pass | 62.6 |
| cinema-neon-v4 | −24 | 20 | pass | 70.3 |
| cinema-neon-v5 | +34 | 20 | pass | 63.4 |
| company-minimal-v1 | +16 | 17 | pass | 76.7 |
| company-minimal-v2 | −18 | 17 | pass | 77.2 |
| company-minimal-v3 | +28 | 17 | pass | 75.9 |
| company-minimal-v4 | −24 | 17 | pass | 77.8 |
| company-minimal-v5 | +34 | 17 | pass | 74.4 |

All 15 variants passed the DNA gate. None failed. Type scale, spacing grid, motif signature, photo-treatment shares, element positions, font sizes, mask kinds, illustration paths, and crop points match the seed. Token contrast and the dominant ink/background and accent/background contrasts stay within 0.5. Chromatic hues move by at most 34 degrees.

Mean SSIM is 58.6–77.8, below the 85–95 band. These three seeds are masked-photo decks, and every photograph was replaced, so the windows that hold a picture move much more than a palette shift on the same picture would. Slides with little picture area stay near 100 (company-minimal slides 3, 4, and 9). cinema-neon slide 10 drops to 0.9–10.7 on four of the five variants because that frame is almost entirely the replaced picture.
