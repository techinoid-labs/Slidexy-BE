# Converter batch

Five more decks from `PPTX Slides Templates/`, converted with `services/templatePipeline/convert/pptxToDeck.js` and rendered with `scripts/slideSvg.js`. Similarity is the mean SSIM of non-overlapping 10×10 windows on a 160×90 grayscale downsample of the 1600×900 frames, reported as a percent. Renders and the per-deck warning logs are in `docs/template-pipeline/converter-batch/<id>/`.

Telegraf is still drawn as Space Grotesk. Every other missing family falls back to Georgia and is logged.

| Deck | Genre | Source | Slides | Images | Converter warnings | Validator | Mean SSIM |
| --- | --- | --- | ---: | ---: | ---: | --- | ---: |
| pitch-gradient | pitch | Purple and White Modern Gradient Business Pitch Deck Presentation.pptx | 11 | 45 | 94 | 6 rotated elements sit outside the slide | 39.5 |
| portfolio-watercolor | portfolio | Brown and Beige Vintage Watercolor Creative Portfolio Presentation.pptx | 18 | 151 | 18 | 38 rotated elements sit outside the slide | 49.4 |
| cinema-neon | illustrated | Red Black Neon Cinema Presentation.pptx | 10 | 20 | 36 | clean | 75.3 |
| company-minimal | minimal | Red Minimalist Company Profile Presentation .pptx | 10 | 17 | 35 | clean | 68.6 |
| marketing-bold | bold | Red and Black Bold Modern Digital Marketing Presentation.pptx | 10 | 13 | 23 | clean | 59.3 |

Per-slide SSIM:

- pitch-gradient: 43.8, 70.2, 68.7, 30.0, 14.3, 36.4, 13.0, 47.4, 42.6, 44.4, 23.4
- portfolio-watercolor: 24.9, 63.5, 30.5, 43.8, 48.8, 55.4, 50.3, 44.3, 60.5, 58.6, 23.0, 57.1, 53.6, 51.6, 65.1, 70.7, 49.3, 37.4
- cinema-neon: 33.1, 83.5, 77.6, 74.1, 88.3, 85.1, 87.4, 76.5, 78.3, 68.9
- company-minimal: 44.2, 66.1, 78.4, 64.4, 63.9, 79.9, 73.2, 83.1, 70.6, 62.4
- marketing-bold: 46.9, 67.0, 75.9, 71.0, 47.0, 71.2, 73.9, 50.7, 34.6, 55.2

The pitch deck is the low outlier because its type is Open Sauce (Heavy, Bold, Medium, Light) and Canva Sans, none of which are installed, so the renderer draws Georgia. The portfolio's watercolor washes are rotated pictures that the validator reports as outside the canvas; the renderer still draws them, clipped.

## Health-medical follow-up

Same SSIM method, after the three fixes, on the re-converted `app-library/health-medical.json`.

| Stage | Mean | Slide 6 | Slide 8 | Slide 9 |
| --- | ---: | ---: | ---: | ---: |
| Fonts only (Poppins outlines, Telegraf drawn as Space Grotesk, top-left crop, stretched paths) | 77.2 | 56.8 | 68.0 | 76.4 |
| Fonts plus cover alignment | 79.2 | 56.8 | 82.3 | 82.1 |
| Fonts, alignment, and uniform illustration scale | 78.4 | 49.9 | 82.0 | 82.1 |

Final per-slide scores: 80.7, 83.1, 77.5, 71.7, 84.7, 49.9, 83.1, 82.0, 82.1, 88.8.

This deck has no `a:srcRect`. Alignment comes from `a:stretch` / `a:fillRect`. Equal overflow on both sides of the slide 8 portraits centers them; one slide 9 portrait is asymmetric (`alignX` 0.9333). Slide 6's blue floor is a circle in a 1600×359 box. Uniform scale draws a circle about 359px wide, centered. The original is a wide shallow arc, so that slide's score fell from 56.8 to 49.9. That case is recorded in `KNOWN_LIMITATIONS.md` and was not attempted again.

## Font and rotation follow-up

Open Sauce Light, Regular, Medium, and Bold are the OFL Open Sauce Sans files. Open Sauce Heavy is the Black cut (weight 900); that family has no Heavy file. Canva Sans is proprietary, so Regular and Bold are Figtree and each use is logged. No other missing family appears in more than one `converter-batch/*/warnings.log`.

Re-converted and re-rendered pitch-gradient and marketing-bold. Same windowed SSIM.

- pitch-gradient: 43.3, 72.8, 72.1, 31.2, 15.1, 39.8, 13.4, 50.4, 42.7, 44.6, 22.8. Mean **40.8** (was 39.5).
- marketing-bold: unchanged at **59.3**. Its missing faces (Antonio Bold, Signature, Open Sans Condensed) appear only on that deck.

Rotated elements are checked by their rotated bounding box, with the same 20% overflow allowance as decoration bleed. Portfolio-watercolor went from 38 "sits outside" errors to 6 "bleeds too far". Pitch-gradient has 15 "bleeds too far": several are full-slide pictures rotated by a large angle, so the rotated corners leave the canvas by more than 20%.
