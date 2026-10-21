# Manual assets prep

Drop transparent PNG and SVG files into `assets/decorations/tech`, `organic`, `corporate`, and `creative`. A PNG and an SVG that share a name count as one asset. Slides draw the PNG.

`node scripts/list_assets.js` prints the folder counts. Right now that is `Tech: 8 assets, Organic: 8 assets, Corporate: 8 assets, Creative: 8 assets`. Those eight shapes in each folder are the generated set. They stay in the rotation until the files are removed.

## Sizing

When a decoration is swapped, the new PNG's pixel size is read before its url is saved. The element keeps the original slot, and its width and height change so the whole asset fits inside that slot at its own aspect ratio, centered. The image fit is `contain`, with alignment at the center. A square asset in a wide slot becomes a square in the middle of that slot. A wide asset in a square slot keeps its full width and loses height on the top and bottom.

A rotated wrapper that shared the old box follows the new box, so the picture still turns around its center. A custom clip path still masks the picture.

## Check

A 400 by 100 slot with a square asset became 100 by 100 at x 250. A 300 by 300 slot with a 4:1 asset became 300 by 75, centered vertically. A matching ratio left the box unchanged.
