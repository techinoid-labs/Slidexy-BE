# Pipeline merge — Phase 4h review console

Human review from the curator UI. Vision off. Online only if the task says “run the panel” (skipped here).

---

## 1. Review routes

Loopback-gated on `devServer.js`; same handlers mounted on `adminTemplateRoutes.js`.

| method | path | behavior |
| --- | --- | --- |
| GET | `/api/admin/review/:id` | qa, plan, fallbacks, fits, nonce, canvas + lo-slide urls |
| POST | `/api/admin/review/:id` | writes `docs/template-pipeline/composer/reviews/<id>.json` with booleans, worstThree, fixType, kept, **embedded replacements** |
| GET | `/api/admin/reviews` | newest-first list + job picker (admin tmp **and** composer proof dirs) |

Job resolution: `admin-dashboard/tmp/<id>` first, else `composer/<id>` (so `proof-4f1-a-replay` is selectable without copying). Preview serves `slide-NN.png` and `lo-slide-N.png` from the job dir or `_pptx-gate/`.

---

## 2. Replay route

`POST /api/admin/replay/:id` → compose `--replay` from the review’s stored `replacements` into `docs/template-pipeline/composer/replays/<id>-<stamp>/`, zero network. Returns qa + slide urls.

Browser/API proof: `proof-4f1-a-replay` → `replays/proof-4f1-a-replay-mvrusxzq`, **qa 100**, `textModelCalls: 0`.

---

## 3. Gallery routes

| method | path | behavior |
| --- | --- | --- |
| GET | `/api/admin/gallery` | entries + flags; regenerates via `gallery.js` if `report.json` older than `manifest.json` |
| POST | `/api/admin/gallery/flag` | `{ component, variant, weak }` → `gallery/flags.json` |
| GET | `/api/admin/gallery/png/:name` | PNG bytes |

Flagged in proof: `agenda/numbered-list` → weak true in `flags.json`.

---

## 4. Panel + git-status

| method | path | behavior |
| --- | --- | --- |
| GET | `/api/admin/panel` | `panel.json` (10 prompts × nonce) + last run + ppt-check + call cost `3–4` |
| POST | `/api/admin/panel/run` | sequential composer generates; progress in `panel-last-run.json`; 409 if already running |
| POST | `/api/admin/ppt-check` | writes `ppt-check.json` |
| GET | `/api/admin/git-status` | `git status --porcelain` count (read only) |

---

## 5. `reviewRoutes.test.js`

Offline against a fixture under `composer/` + stubbed panel `compose`; `fetch` throws. Covers review GET/POST/list, replay, gallery flag, panel stub (10 results), git-status. **Passed.**

---

## 6–7. Dashboard + browser proof (zero text-model)

Tabs: **Generate / Reviews / Gallery / Panel**. Header shows git-dirty + PowerPoint checked. After composer generate: LO/File thumbnails toggle, review form, A/B button. Reviews lists jobs including proofs; Replay compares side by side. Gallery Weak toggles. Panel Run confirms cost (not executed online in this phase).

### Browser clicks (http://127.0.0.1:5055/)

1. Opened curator — header **Git dirty: 59**.
2. **Reviews** → selected `proof-4f1-a-replay` (listed from composer proof dir; no separate register step) → **Load** → “Score 100 · nonce 4f1-a · slides 9”.
3. **Generate** tab → checked “Reads as designed” / Kept → **Submit review** → file `reviews/proof-4f1-a-replay.json` with `readsDesigned: true`, `kept: true`, embedded replacements (worstThree filled via follow-up POST for the typed note).
4. **Replay** (API + UI) → `replays/…` with **qa 100**, calls **0**.
5. **Gallery** opened; flagged `agenda/numbered-list` weak → `flags.json` confirmed.
6. Git dirty: UI 59 vs `git status --porcelain | measure` **60** (one-file drift while proof ran; same order of magnitude).

---

## 8. Narrative sort

`validatePlan` stable-sorts the narrative band **About → Problem → Solution** (repeats keep relative order); fallback `plan.narrativeSort`.

`composer.test.js` asserts unsorted `Solution>About>Problem>About` → `About>About>Problem>Solution`.

Replay of `proof-4f1-b-replay` → `proof-4f1-b-replay-sorted`:

```
0 Cover
1 Contents
2 About
3 Problem
4 Solution
5 Proof
6 Model
7 Market
8 People
9 Next
10 Close
```

qa **100**, calls **0**. Fallback: `Problem>Solution>About` → `About>Problem>Solution`.

---

## 9. Panel (online)

**Skipped** — task did not say “run the panel”.

---

## 10. Tests

```
qaLoop test passed
semanticFilter test passed
chooseLayout test passed
dead code test passed
manualQa test passed
composer.test passed
safeRm test passed
generateTemplateShape test passed
catalogGolden test passed (stripped 10, unstripped 10)
reviewRoutes.test passed
```

No file named `assembleDeck.js` or `composeDeck.js`.

---

Stop.
