# QA optimization

Generation now asks for the brand, the mood, and the photo keywords in one model call. After the slides are rendered, the hybrid scorer runs. A deck under 80 is discarded. The generator tries again with a different seed, or a different palette when no other seed is left, up to two more times. A deck that is still under 80 is not returned.

## One direction call

The prompt returns `{ brand, industry, mission, mood, keywords }`. Industry and mission stay in that same object so the copy rewrite still has a company profile. Mood and keywords are no longer separate requests.

The corporate pitch test logged one line:

`direction Nova Solutions / Clean and Corporate / data algorithm network`

The palette that followed was Clean and Corporate, mapped to light-neutral. The photo search used those three keywords.

## Auto-assemble test

Prompt: “A corporate pitch deck”. Output: `docs/template-pipeline/qa-optimization/corporate-pitch`.

The deck scored 80 on attempt 1 (8 of 10 slides passed). It was kept. Slides 3 and 6 failed the vision check (washed out, broken layout) and the other eight passed, so the deck met the bar and was not regenerated.

Theme lock used `yellow-and-blue-illustrative-modern-geometric-health-medical-presentation` (Calibri) mixed with slides from `black-and-grey-3d-shapes-tech-company-presentation`. Background `#f4efdf` is light, so the dark-shape flip did not run on this deck.

## Dark shapes

When the locked background has luminance under 0.3, every dark shape that is not the full-bleed page is repainted with the card color, or the surface color when the card is also dark. Text sitting on that shape is recolored when it would be unreadable on the new fill. The page background stays dark.

A fixture with background `#1A1612` and card `#F4F1EC` lifted one dark block to `#F4F1EC` and set its title to `#1A1612`. The full-bleed page stayed `#1A1612`. The same block on a light background was left alone.
