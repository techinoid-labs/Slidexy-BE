# Asset scaling and photo priority

A decoration from the asset library is contained inside the original box. It keeps its aspect ratio and sits in the center. It is not stretched to both the width and the height. When the picture it replaces is sparse line art, the decoration's area is capped to that picture's opaque area, so a thin staff does not become a circle the size of the frame.

A 726 by 725 frame that is 7 percent opaque, with a square asset, becomes 192 by 192 and stays centered. A 400 by 8 line stays 8 by 8. A solid picture keeps the ordinary contain fit: a square asset in a 400 by 100 slot is still 100 by 100.

## Photos

Every generated deck aims for photographs on at least two slides. A picture counts as a large photo slot when it is not a decoration and covers at least 18 percent of the slide. If a layout has fewer than two such slides, the largest remaining picture on other slides is turned into a Pexels photo, even when that picture was a decoration.

On Auto-Select, a Photo-heavy prompt prefers a layout that already has two large photo slides. A pinned layout stays on the layout that was chosen.

## Vibe

The asset prompt now tells the model to photograph a physical business — a coffee shop, cafe, restaurant, store, boutique, fashion brand, hotel, gym, or salon — and to prefer `minimal` over abstract shapes. Organic is reserved for plants, nature, and wellness. If the model still returns another folder, that kind of subject is steered to `minimal`.

`assets/decorations/minimal/` holds four small marks: a hairline, a speck, a corner, and a tick. `node scripts/list_assets.js` prints `Corporate: 8 assets, Creative: 8 assets, Minimal: 4 assets, Organic: 8 assets, Tech: 8 assets`.

## The Daily Grind

Prompt: "The Daily Grind — coffee shop". Layout: `modern-geometric-music-lesson-plan`, pinned. Output: `docs/template-pipeline/asset-fix-v2/daily-grind`.

The log read:

- `asset vibes corporate, creative, minimal, organic, tech`
- `asset vibe choice creative`
- `asset vibe photo-priority creative -> minimal`
- `asset vibe minimal`
- `pexels "coffee shop grinder"`
- `photo slides 2`
- `decorations 49 from minimal`
- `wrote docs\template-pipeline\asset-fix-v2\daily-grind (72 strings, 2 images)`

The deck's `assetVibe` is `minimal`. None of the 49 decorations came from `organic`. No decoration box grew past the picture it replaced. The cover's 726 by 725 staff frame is now a 195 by 195 hairline, about 7 percent of the old area. The large brown circles on that cover are the layout's own shapes, recolored by the warm palette.

This layout already has two large photo slides, so nothing extra was forced. Slide 15 and slide 16 each received a coffee photograph: grinders on slide 15, an espresso machine on slide 16. A copy of the same layout with every picture marked as a decoration had zero photo slides, and the force path then placed photos on its two largest frames.

Brand on this run: Grind & Brew. Refresh http://127.0.0.1:5055/ before the next generate.
