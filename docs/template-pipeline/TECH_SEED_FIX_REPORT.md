# Tech seed fix

The black-and-grey tech seed was regenerated for "A high-end cybersecurity firm." The deck is `docs/template-pipeline/tech-seed-fix` (Aegis Sentinel, 15 slides).

## Decorative graphics stay

Before a photo is swapped, the original file is checked. A transparent PNG, or a picture that covers less than 10% of the slide, is marked `isDecoration` and keeps its file. All 62 pictures on this seed qualified. None were replaced with Pexels photos. The chrome 3D shapes are still on the cover and on the later slides.

## Dark text panels

When the locked background is dark, a shape with a black or dark-gray fill that sits behind text is repainted with the card color, or the surface color when that is the lighter of the two. The full-bleed page background is left alone. Text on the new fill is then set so the contrast is at least 4.5.

On this run the page stayed `#1a1612` and the type stayed `#F6F1E8`, so no extra panel had to be lifted. A separate check put black type on a black panel over that same dark page: the panel became `#FFFFFF`, the page stayed `#1a1612`, and the contrast check passed. All 15 generated slides pass the same contrast check.

## Words are not clipped

A single word that is wider than its box is scaled down until the whole word fits. Letters are not cut off and an ellipsis is not substituted. A one-word title that runs under a picture stacked above it is scaled into the open part of the box when that opening is at least 42% of the box width.

The cover word is the full word CYBERSECURE. It was scaled from 130px to 86.7px so it sits clear of the right-hand chrome shape. "Solutions" on slide 10 was scaled from 80px to 74.5px to fit its box. An isolated box 220px wide holding "Cybersecurity" at 72px scaled to 33.1px and kept every letter.

Prachason Neue and Montserrat are not installed, so those faces still draw in Arial.
