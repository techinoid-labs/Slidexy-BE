# Template pipeline — step-by-step

How to run both generate paths from the curator UI:

1. **Composer (kit)** — plan → copy → compose from components  
2. **Seeds (thematic)** — rewrite / remix / assemble from `app-library` PowerPoint seeds  

Also: review, replay, Gallery, Panel. Phase engineering notes live in `docs/template-pipeline/merge/`.

---

## 0. What you are running

| Piece | Role |
| --- | --- |
| **Curator** | Loopback-only admin UI at `http://127.0.0.1:5055/` |
| **Composer** | Kit deck: plan → copy → compose → LibreOffice + pptx gate QA |
| **Seeds / thematic** | Pinned, Auto-Select, Remix (plus Assemble / Native neighbors) from `app-library` |
| **Review** | Human checklist under `composer/reviews/` (composer jobs; embeds replacements for replay) |
| **Replay** | Re-compose from a saved review with **zero** text-model calls |
| **Gallery** | Kit variant PNGs + weak flags |
| **Panel** | Ten fixed composer prompts, sequential online generates (~3–4 calls each) |

Same **Generate** tab drives both families. Mode select picks the path.

Admin APIs are loopback-gated (`/api/admin/*`). Dashboard HTML is read **per request** — hard-refresh after HTML edits. **Restart the curator after Node changes; never mid-generate.**

---

## 1. Start the curator

From `Slidexy-BE`:

```powershell
$env:PIPELINE_PORT="5055"
node services/templatePipeline/devServer.js
```

Open [http://127.0.0.1:5055/](http://127.0.0.1:5055/).

Header shows **Git dirty** (read-only `git status --porcelain` count) and **PowerPoint checked** (optional date you set after opening a deck in PowerPoint).

---

## 2. Two generate families (pick a mode)

| Mode | Family | Needs a seed? | Notes |
| --- | --- | --- | --- |
| **Composer** | Kit | No | Default. Nonce optional. LO thumbs, review form, A/B, Replay |
| **Pinned** | Seeds | Yes — **Base layout** | Thematic rewrite of that one seed |
| **Auto-Select** | Seeds | Auto from library | Picks best **enabled** seed (score ≥ 70), then rewrite |
| **Remix** | Seeds | Yes — two different | “Frankenstein”: Base layout + **Second seed** |
| **Assemble** | Variety | No single pin | `assemble_deck` — max variety assembly |
| **Native** | Drawn | No | `thematic-native`; optional **Niche** / **Creative Mode** |

Checkboxes under the form (Auto-Select Best Layout, Frankenstein Remix, etc.) mirror the Mode dropdown; changing one updates the other.

---

## 3. Seeds path — library and generate

### 3a. Seed library

Seeds live in `app-library/` and appear in:

- **Base layout** (and **Second seed** when Remix is on)
- **Seed library** table at the bottom of Generate (layout, score, use, failures)

**Add a folder of seeds**

1. On Generate, under Seed library, choose a folder of `.pptx` files (**Add folder**).
2. Wait through convert + score per file (status shows progress; scoring can take a few minutes each).
3. Score **≥ 70** → usable by Auto-Select. Lower scores still show; you can **Enable / Disable Seed**.

Do not kill the curator mid-upload/score.

### 3b. Pinned (one seed)

1. Mode → **Pinned** (or clear other mode checkboxes and pick a layout).
2. Choose **Base layout**.
3. Enter the prompt → **Generate** → wait (~a minute).
4. Canvas thumbnails appear; **Publish / Download / Discard** as usual.

### 3c. Auto-Select

1. Mode → **Auto-Select** (or check **Auto-Select Best Layout**).
2. Prompt → **Generate**. No base layout required.
3. Result names the chosen seed as `layoutId` (e.g. a business-proposal presentation). Missing hatch/placeholder seed assets can log warnings without failing the run.

### 3d. Remix (two seeds)

1. Mode → **Remix** (or **Frankenstein Remix**).
2. Pick two **different** seeds (Base + Second seed).
3. Prompt → **Generate**.

### 3e. Assemble / Native (neighbors, not classic “one seed”)

- **Assemble** — variety assembly; no pinned seed.
- **Native** — original draw; optional niche (corporate, elegant, …) or Creative Mode. No seed is opened.

### 3f. What seed jobs get (vs composer)

| | Seeds / thematic | Composer |
| --- | --- | --- |
| Job dir | `admin-dashboard/tmp/<id>/` | same tmp pattern |
| Photos | `generated-templates/photos/thematic/…` (native → `photos/native/…`) | `photos/composer/…` |
| Thumbnails | Canvas `slide-*.png` | LO + File/canvas toggle |
| Review form / A/B / Replay | No (composer-focused) | Yes |
| Publish / Download / Discard | Yes | Yes |

---

## 4. Composer path — generate a kit deck

1. Stay on the **Generate** tab.
2. Set **Mode** to **Composer**.
3. Type the prompt (what the template is about).
4. Optional: set a **Nonce** (stable id for the run; leave blank for an auto stamp).
5. Click **Generate**. Wait for the spinner / status (“Composing… about a minute”).
6. When done you should see:
   - deck title + plan / fits / collapses meta
   - thumbnails (default **LibreOffice**; toggle **File/canvas** if needed)
   - human review form
   - Publish / Download / Discard

Cost: typically **3–4** text-model calls per deck (plan + copy, sometimes copyFill). Vision stays off unless you intentionally enable other modes.

---

## 5. Human review (composer — after generate or from Reviews)

On **Generate** (after a composer run) or **Reviews** (after **Load**):

1. Check the booleans: stock text, spacing, cover photo, below-box, reads as designed, kept.
2. For A/B runs, also check **Reads as different decks** when they diverge.
3. Optional **Worst three** note; **Fix type** = `none` | `kit` | `check` | `brief`.
4. Click **Submit review**.

Writes:

`docs/template-pipeline/composer/reviews/<job-id>.json`

Includes prompt, nonce, plan, qa, your flags, timestamp, and **embedded `replacements`** so Replay still works if the tmp job is discarded.

---

## 6. Reviews tab — load a past job

1. Open **Reviews**.
2. Pick a job from the dropdown (admin `tmp/` jobs **and** `composer/proof-*` dirs).
3. Click **Load**. Wait for “Loading…” then thumbnails + form on this tab.
4. Submit or update the review as in step 5.

No copy step is needed for proofs: ids like `proof-4f1-a-replay` resolve from `docs/template-pipeline/composer/<id>/`.

---

## 7. Replay (composer, offline, zero model calls)

1. On **Reviews**, select a job that has a saved review (or Load + Submit first).
2. Click **Replay**. Wait — status shows “Replaying… (zero network)”.
3. Side-by-side: original vs replay renders and both QA scores.
4. Output lands in:

`docs/template-pipeline/composer/replays/<id>-<timestamp>/`

Use Replay after kit/check changes to confirm the same plan still scores without spending API calls.

---

## 8. A/B generate (composer)

1. On **Generate**, Composer mode, with a prompt (and preferably an already-generated deck A).
2. Click **A/B generate**. A second nonce is generated; wait for both columns.
3. Compare decks; check **Reads as different decks** on the review form if they feel distinct.
4. Submit the review as usual (tied to the current / A job id unless you Load B separately).

---

## 9. Gallery (composer kit)

1. Open **Gallery** (waits if the index is regenerating because it is older than `manifest.json`).
2. Browse light-neutral variants.
3. Toggle **Weak** on a component/variant → updates:

`docs/template-pipeline/composer/gallery/flags.json`

---

## 10. Panel (composer online — only when you mean to spend calls)

1. Open **Panel**. Confirm the listed cost (**3–4** calls × **10** prompts).
2. Click **Run Panel** → confirm the dialog.
3. Run is **sequential** (one generate at a time). Progress:

`docs/template-pipeline/composer/panel-last-run.json`

4. Results table: prompt, score, fails, calls, job id.
5. Refuses to start (409) if a panel run is already in progress or a generate is busy.

Prompts + fixed nonces live in `docs/template-pipeline/composer/panel.json` (clinic, restaurant, SaaS, nonprofit, law, fitness, construction, school, bank, travel).

**Do not run the panel casually** — it burns real text-model calls.

---

## 11. Publish / discard / download

| Action | When |
| --- | --- |
| **Download PPTX** | Keep a local copy of the current tmp job (seed or composer) |
| **Publish to Catalog** | Promote into the app catalog (permanent) |
| **Discard** | Delete the temporary job under `admin-dashboard/tmp/` |

After Discard on a **composer** job, you can still Replay if you **Submitted a review** first (replacements are in the review file).

---

## 12. Where files live

```
app-library/                         # seed PPTX / scored layouts (seed path)
generated-templates/photos/
  thematic/<job>/                    # seed-path stock photos
  native/<job>/                      # native-path photos
  composer/<brand>/                  # composer-path photos

docs/template-pipeline/
  admin-dashboard/
    index.html                       # curator UI
    tmp/<job-id>/                    # live generates, both paths (safe to wipe)
  composer/
    panel.json                       # panel prompts + nonces
    panel-last-run.json              # last panel results (optional)
    ppt-check.json                   # PowerPoint-checked date (optional)
    reviews/<id>.json                # human reviews + embedded replacements
    replays/<id>-*/                  # offline replay outs
    gallery/                         # variant PNGs + flags.json
    proof-*/                         # saved phase proofs (job-shaped dirs)
  merge/                             # phase engineering write-ups
```

Composer job-shaped dirs contain at least `deck.json`, `replacements.json`, canvas `slide-*.png`, and often `lo-slide-*.png` / `_pptx-gate/`. Seed jobs typically have `deck.json` + canvas `slide-*.png`.

---

## 13. House rules

- Vision off for normal composer work; seed Auto/Pinned may still use vision scoring depending on pipeline config — treat online cost as real.
- No mid-generate (or mid-seed-score) curator kill/restart.
- No git writes from the UI (dirty count is read-only).
- Do not commit secrets / `.env`.
- Wipe tmp / reviews / replays when you want a clean slate; keep `panel.json`, `app-library` seeds, and proofs unless you intentionally delete them.

---

## 14. Characterization tests (offline)

From `Slidexy-BE` (paths as used in merge close-outs):

```text
qaLoop, semanticFilter, chooseLayout, dead code, manualQa,
composer.test.js, safeRm.test.js, generateTemplateShape.test.js,
catalogGolden.test.js, reviewRoutes.test.js
```

These must pass without live model calls. `reviewRoutes.test.js` stubs fetch/compose.

---

## Quick paths

### Composer (kit)

1. Start curator on **5055**.
2. **Generate** → Composer → prompt → Generate → wait.
3. Skim LO thumbnails → fill review → **Submit review**.
4. **Reviews** → same job → **Replay** → confirm qa and zero calls.
5. Optionally flag weak Gallery variants; run **Panel** only when budgeted.

### Seeds (thematic)

1. Start curator on **5055**.
2. Ensure Seed library has enabled layouts (upload + score if empty; Auto-Select needs score ≥ 70).
3. Mode → **Pinned** + Base layout, or **Auto-Select**, or **Remix** with two seeds.
4. Prompt → **Generate** → wait.
5. **Download** / **Publish** / **Discard** as needed.

---

## Restore procedure (seed library)

Human-owned PPTX backups live **outside** the repo:

`C:\Users\SP Grid\Desktop\Techinoid\seed-originals\<id>.pptx`

Sync that folder off this machine. To rebuild `app-library/` from those originals:

1. For each id:  
   `node services/templatePipeline/convert/pptxToDeck.js "C:\Users\SP Grid\Desktop\Techinoid\seed-originals\<id>.pptx" <id>`
2. Score each id (VISION_QA unset):  
   `node scripts/score_seeds.js <id>`
3. Regenerate Gallery (kit + Seeds section):  
   `node services/templatePipeline/composer/gallery.js`

`app-library/*.json` and `*.dna.json` are gitignored; only the originals + this procedure restore the library.
