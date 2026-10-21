# Dynamic asset folders

Decoration vibes are the folder names inside `assets/decorations/`. Adding a category is a new folder. Nothing in the classifier lists tech, organic, corporate, or creative by name.

`getAvailableVibes()` reads those subdirectories and returns them sorted. The Gemini prompt is: "Based on the user's prompt, choose exactly ONE of the following visual vibes for the design assets: [those names]. Return ONLY the exact word." A reply is kept only when it matches one folder name. Any other reply, a failed model call, or a folder with no PNG is replaced by a random folder that contains a PNG.

`node scripts/list_assets.js` prints every folder it finds. Current line: `Corporate: 8 assets, Creative: 8 assets, Luxury: 2 assets, Organic: 8 assets, Tech: 8 assets`.

## Luxury watch

`assets/decorations/luxury/` holds two dummy PNGs, `crest-01.png` and `mark-02.png`.

Prompt: "A high-end luxury watch brand." Layout: `black-and-grey-3d-shapes-tech-company-presentation`.

The log read:

- `asset vibes corporate, creative, luxury, organic, tech`
- `asset vibe choice luxury`
- `asset vibe luxury`
- `decorations 62 from luxury`

The saved deck has `assetVibe` set to `luxury`. All 62 decoration urls are under `assets/decorations/luxury/`. None came from the other folders, and none were stock photos. The cover shows the gold crest and the dark triangle. Brand: Aethel Timepieces. Output: `docs/template-pipeline/dynamic-assets/luxury-watch`.

A word that is not a folder name fell back to another stocked folder. An empty folder did the same. Those checks ran against the folder list, then the empty test folder was removed.

The admin page shows this vibe on the prompt line after a generate. Refresh http://127.0.0.1:5055/ before the next one.
