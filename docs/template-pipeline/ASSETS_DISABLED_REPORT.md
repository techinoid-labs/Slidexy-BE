# Asset injection paused

Local files in `assets/decorations/` are no longer placed on slides. A decoration stays as it was in the seed. A prompt that says minimalist removes those decorations instead. Photographs still come from Pexels, and the theme colors and fonts still apply.

The admin line after a generate reads `Prompt: … | Vibe: Corporate`. That is the layout vibe. There is no asset-vibe line.

## Corporate Pitch Deck

Auto-select chose Corporate, then `modern-geometric-music-lesson-plan` at 85.

The log read:

- `vibe Corporate`
- `pexels "chart meeting"`
- `photo slides 2`
- `decorations kept from the seed`
- `decorations removed 0`
- `wrote docs\template-pipeline\assets-disabled\corporate-pitch (65 strings, 2 images, 0 decorations removed)`

The deck has 49 pictures from the seed and 2 Pexels photographs. None point at `assets/decorations/`. The cover keeps the seed's notes, horn, and circles.

## Tech Startup

Auto-select also read this prompt as Corporate and used the same layout.

The log read:

- `vibe Corporate`
- `pexels "office computer team"`
- `photo slides 2`
- `decorations kept from the seed`
- `decorations removed 0`
- `wrote docs\template-pipeline\assets-disabled\tech-startup (72 strings, 2 images, 0 decorations removed)`

Same picture count: 49 seed pictures and 2 photographs. No local decoration files.
