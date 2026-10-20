# Renderer v2

The health-medical deck was drawn again from `app-library/health-medical.json`. The converter, the JSON, the schema, the audit, and the generator were not changed.

The new frames are `docs/template-pipeline/converter-test/converted-v2-01.png` through `converted-v2-10.png`, drawn by node-canvas at 1600×900. `side-by-side-v2.png` puts the original PPTX render on the left and this render on the right.

## Per-slide match

The number is mean SSIM over non-overlapping 10×10 windows, on a 160×90 grayscale downsample of the 1600×900 frames. Before is the previous renderer (`converted-01.png` … `converted-10.png`). After is this renderer.

| Slide | Before | After |
| --- | ---: | ---: |
| 1 | 52.8 | 83.8 |
| 2 | 46.1 | 84.4 |
| 3 | 46.5 | 76.2 |
| 4 | 45.2 | 76.1 |
| 5 | 41.0 | 86.4 |
| 6 | 29.9 | 60.3 |
| 7 | 38.9 | 85.2 |
| 8 | 51.1 | 68.7 |
| 9 | 40.4 | 76.8 |
| 10 | 71.0 | 92.9 |
| Mean | 46.3 | 79.1 |

## Which fix moved the score

The same deck was drawn three more times, each time with one fix switched off, and scored the same way.

| Draw | Mean SSIM |
| --- | ---: |
| All three fixes | 79.1 |
| Images replaced with the old two-tone block | 49.7 |
| Illustration paths replaced with a solid box | 76.6 |
| Text put back to one clipped line | 80.5 |

Loading the extracted images accounts for the improvement. Turning images off drops the mean from 79.1 to 49.7, which is close to the old renderer at 46.3. Path drawing adds about 2.5 points, mostly on slides 3, 8, and 9, where a large shape is an illustration rather than a picture. Wrapping does not raise the pixel score. One clipped line scores 80.5, a point above the wrapped render, because Georgia breaks lines in different places than the original faces. Wrapping is what makes the sentences readable.

Overflow used auto-fit, not ellipsis. Three elements did not fit at the JSON size, and the smaller size was logged: slide 1 title 97.6 → 91.2, slide 6 headline 97.6 → 90.2, slide 8 pill 26.04 → 24.8.

## Remaining discrepancies

These were not fixed.

- Poppins Bold, Telegraf, and Telegraf Bold are not in `services/templatePipeline/fonts/`. Every text element is Georgia. The log is `docs/template-pipeline/converter-test/renderer-v2-warnings.log`.
- Slide 1 title keeps “CONSULTATION” on one line. The original wraps the last letter onto the next line.
- Slide 6 headline is three lines. The original is four. That band is the largest remaining gap on the slide. The blue floor is a circle path scaled into the JSON box of 1600×359, so the arc is shallower than the original.
- Slides 2, 3, and 4 break their paragraphs on different words than the original.
- Slide 8’s paragraph is four lines. The original is five.
- `alignX` and `alignY` are not in the JSON. Every image logs that and is anchored to the top-left of its box. The circular photos on slides 8 and 9 therefore crop a different part of the file than the original: the consultation photo drops the child, the surgery photo is tighter, and the lower review portrait drops the patient.
- Every photo file for this deck was on disk. The red hatch for a missing file was not used on these ten slides.

## Is the renderer honest enough to compare decks visually?

Yes. A slide now shows the extracted pictures, the mask shapes, the illustration paths, and the full sentences. Comparing two decks by eye is a comparison of those things. It is not a comparison of the original typefaces, and cover crops follow the missing align fields.
