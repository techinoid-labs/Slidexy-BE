# SlidePoise integration proposal

Read from [henryhyw/slidepoise](https://github.com/henryhyw/slidepoise) and the project site. No code was written.

## What SlidePoise does

SlidePoise is an agent workflow for new decks, not a remix of an existing PPTX. The agent writes a content plan, picks references, icons, and components, and puts them on a contact sheet. An image model generates a free-form slide from that sheet and the brief. The agent checks the message, the data, and the layout on that image.

Reconstruction turns the chosen image into editable PowerPoint objects. The agent groups related regions. OpenCV measures the visible bounds. A reconstruction step, using PptxGenJS in their Node tools and python-pptx in their Python tools, builds text, charts, tables, shapes, and artwork. Illustrations can be regenerated as a separate transparent PNG and placed as their own layer. LibreOffice renders the PPTX and Poppler makes review images. The agent compares that render with the generated design and the brief. Optional SAM 2 masks exist; OpenCV is the path that still works if SAM is absent. Setup expects Python 3.10+, Node 18+, and an image-capable agent. Human approval sits on the plan, the selected references, and the generated image.

## What would have to change here

`pptxToDeck.js` would stay the reader for seed PPTX files. It would not become the author of these new layouts. A new reconstruction step would have to emit either a PPTX or our deck JSON from measured regions. Our schema has no chart or table body today; the converter already skips those frames.

`slideSvg.js` would not measure a generated image. We would add a compare step: generated image against the LibreOffice render we already produce. The current vision reviewer could be that check. It would still only pass or fail.

`mutate.js` and `mutate_creative.js` edit a seed. SlidePoise does not start from a seed. Those operators would sit beside a second path, or they would be dropped for briefs that ask for a new composition. `mutate_safe.js` already saves through an in-memory PPTX model, which is closer to SlidePoise's editable output than our deck JSON is, but it does not generate or measure images.

## Effort and risk

A thin spike is about 8 to 12 days: one profile, one image, OpenCV bounds, a handful of text and shape objects, and a render comparison. A path that also rebuilds charts, tables, and transparent illustration layers is about 3 to 4 weeks.

The main risk is product, not install. This pipeline was locked to convert-and-remix. SlidePoise generates a picture first and then tries to recover editable objects from it. The image can invent wording, distort icons, and ignore the seed's type size and palette. Reconstruction will not match that picture exactly, and our DNA gates would not apply. It is worth a spike only after the current remix path is something a user can run without a manual look at every slide.
