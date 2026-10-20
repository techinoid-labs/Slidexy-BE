# Converter test

One deck. `validateDeck` on `app-library/health-medical.json` returned an empty array. The source file is `PPTX Slides Templates/Yellow and Blue Illustrative Modern Geometric Health Medical Presentation.pptx`. The generator and the audit were not changed.

## Slides and elements

10 slides in the PowerPoint file, 10 layouts in the deck.

"Before" is the number of shape, picture, group, connector, and graphic-frame nodes walked on that slide, including a group and its children. "After" is the number of elements written into the layout.

| Slide | Before | After |
|---|---|---|
| 1 | 9 | 7 |
| 2 | 9 | 7 |
| 3 | 10 | 8 |
| 4 | 7 | 7 |
| 5 | 15 | 11 |
| 6 | 10 | 8 |
| 7 | 14 | 10 |
| 8 | 15 | 11 |
| 9 | 16 | 14 |
| 10 | 18 | 16 |
| Total | 123 | 99 |

## Images

23 files extracted to `generated-templates/photos/health-medical/`. Total size 2,049,861 bytes.

## Mapped elements

| Type | Count |
|---|---|
| text | 40 |
| image | 0 |
| shape | 10 |
| maskedImage | 23 |
| illustration | 26 |
| rotated | 0 |

Every picture in this file had custom geometry, so each one was stored as a masked image rather than a plain image. The ten shapes are the slide backgrounds. No element was rotated.

## Skipped or degraded

From `generated-templates/photos/health-medical/conversion_warnings.log`:

| Category | Count | What happened |
|---|---|---|
| master | 1 | Layout and master shapes were not copied. Placeholder positions and the background were. |
| clamp | 8 | An illustration on slides 1, 2, 4, 5, 6, 7, 8, and 10 extended past the canvas and was clipped so validation would accept it. |

No tables, charts, SmartArt, connectors, gradients, video, animation, transitions, or notes were present in this file.

## Visual fidelity

The existing renderer paints every picture as a blue-green block. It does not open the extracted files. Headlines and body copy are drawn as one line in Georgia, clipped to the text box. Scores below are from looking at each pair, not from a metric.

| Slide | Match | What is wrong or missing |
|---|---|---|
| 1 | 30% | Yellow field, the pale circle, the kicker, and the blue pill survive. The title collapses to "CONSULTATION S". The phone illustration is a rectangle. |
| 2 | 35% | "ABOUT US" and the yellow pill are in place. The paragraph is one clipped line. The phone illustration is a rectangle. |
| 3 | 35% | The blue and white fields, "WHY US?", and the pill survive. Both paragraphs are clipped lines. The window illustration is a rectangle. |
| 4 | 30% | "MISSION" and "VISION" survive. Both paragraphs are clipped. The phone, the knee card, and the ribcage card are one rectangle. |
| 5 | 32% | "SERVICES" and both pills survive. Both descriptions are clipped. The storefront illustration is a stack of rectangles. |
| 6 | 22% | The name pill and "MEDICAL DIRECTOR" survive inside a blue circle. The four-line headline is one clipped line. Both laptop scenes are rectangles. The blue floor is a circle. |
| 7 | 32% | "SERVICES" and both pills survive. Both descriptions are clipped. The tablet illustration is a rectangle. |
| 8 | 40% | "95%" and the yellow pill survive. The two photos are circles, which is the right mask, filled with the placeholder instead of the photograph. The magnifying glass and "FIND A DOCTOR" are gone. The sentence is clipped. |
| 9 | 28% | "REVIEWS" and the blue field survive. The trophy is a rectangle. The two photos are yellow-ringed circles filled with the placeholder. The star rows are dark bars. Both quotes are clipped. |
| 10 | 40% | "THANK YOU!", the red button, and the four contact lines survive. The pin, phone, cursor, and envelope are small squares. Both phone illustrations are rectangles. |

## Does it look like the original?

No. The color fields, a few headlines, and the rounded pills land in roughly the right places, so you can tell which slide it was. The drawings that identify the deck are gone, replaced by rectangles and circles of placeholder color, and the paragraphs are single clipped lines in a serif the original does not use. It reads as a colored wireframe of the layout, not as the Larana Medicine presentation.

## Renders

- Original pages: `docs/template-pipeline/converter-test/original-01.png` through `original-10.png`
- Converted pages: `docs/template-pipeline/converter-test/converted-01.png` through `converted-10.png`
- Pairs: `docs/template-pipeline/converter-test/side-by-side.png` (original on the left, converted on the right)
