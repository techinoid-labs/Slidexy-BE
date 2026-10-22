# Asset strategy

The generated placeholder PNGs and SVGs are gone. `assets/decorations/` still has five empty folders: `corporate`, `creative`, `minimal`, `organic`, and `tech`. A PNG dropped into one of those folders is available on the next generate. The file name is the tag. `grid-01.png` and `line-02.png` fit a thin slot. `circle-01.png` and `sphere-02.png` fit a circle. `blob-01.png` and `texture-02.png` fit a large block. An SVG on its own is not drawn. An empty folder removes the decoration instead of leaving a broken box.

`node scripts/fetch_assets.js` no longer writes those placeholders. `--generate` still can.

## Injection

A corporate, minimalist, or pitch prompt uses the `minimal` vibe. A tech or startup prompt uses `tech`. An empty or unrecognized vibe does not fall through to another folder.

When the asset vibe is `minimal`, or the layout vibe is Corporate, the smaller half of the decoration pictures are removed. The rest are matched to a file of the right shape. A slot whose width is more than five times its height, or the other way around, only accepts `line` or `grid`. A circle, an ellipse, or a nearly square decoration only accepts `circle` or `sphere`. A picture covering at least a quarter of the slide only accepts `blob` or `texture`. Anything without a match is removed.

## Checks

With three temporary tech files, a 400 by 20 slot received `grid-01.png`, an ellipse received `circle-02.png`, and a 1000 by 600 block received `blob-03.png`. A line did not accept a circle file. After those files were deleted, a minimal corporate pass removed both decorations and left the photograph.

## A corporate pitch deck

Auto-select chose Corporate, then `modern-geometric-music-lesson-plan` at 85.

The log read:

- `asset vibe choice minimal`
- `sparse decorations 24 of 49`
- `decorations removed 49`
- `decorations 0 from minimal`
- `wrote docs\template-pipeline\asset-strategy-v2\corporate-pitch (68 strings, 2 images, 49 decorations removed)`

The deck has no `assets/decorations` url. The two photo slides still have photographs. The circles on the cover are the layout's own shapes.

## A tech startup

Auto-select also read this prompt as Corporate and used the same layout. The asset vibe was `tech`.

The log read:

- `asset vibe choice tech`
- `sparse decorations 24 of 49`
- `decorations removed 49`
- `decorations 0 from tech`
- `wrote docs\template-pipeline\asset-strategy-v2\tech-startup (70 strings, 2 images, 49 decorations removed)`

The tech folder is empty, so every decoration was removed. A tagged PNG in `assets/decorations/tech/` would be placed in a matching slot instead.
