# Pipeline merge — Phase 4e admin

Composer wired into the admin curator. Vision off. Human review of `proof-payroll-4d2-online` passed.

---

## 1. Wiring (diagnose)

### `jobDir`

```40:46:services/templatePipeline/adminCatalog.js
function jobDir(id) {
  const safe = assertId(id);
  const root = path.resolve(TMP);
  const dir = path.resolve(TMP, safe);
  if (dir !== root && !dir.startsWith(root + path.sep)) throw fail(400, "Unknown deck id");
  return dir;
}
```

`TMP` = `docs/template-pipeline/admin-dashboard/tmp`.

### Download route (devServer)

`GET /api/admin/download/:id` → `ensurePptx(id)` (builds via `catalog.exportDeckPptx` when missing) → stream `.pptx`. Same mount in `routes/adminTemplateRoutes.js`.

### Publish / discard photo dirs

```271:280:services/templatePipeline/adminCatalog.js
function thematicPhotoDirs(deck) {
  const dirs = new Set();
  walkElements(deck, (element) => {
    const content = element.imageContent || element.maskedImageContent;
    if (!content || typeof content.url !== "string") return;
    const match = content.url.match(/^photos\/(thematic|native|composer)\/([a-z0-9-]+)\//);
    if (!match) return;
    dirs.add(path.join(ROOT, "generated-templates", "photos", match[1], match[2]));
  });
  return [...dirs];
}
```

Publish rewrites `photos/(thematic|native|composer)/…` → `photos/<basename>`; discard `safeRm`s those dirs plus job-id under thematic/native/composer. `safeRm` already allows `generated-templates/photos/composer/<slug>/`.

### How `deck.json` lands under `jobDir(id)`

`generateTemplate` sets `dir = jobDir(id)` and passes `out: relative(dir)` into `runPipeline`. Compose honors `options.out`:

```js
const outDir = settings.out
  ? path.resolve(ROOT, settings.out)
  : path.join(ROOT, "docs", "template-pipeline", "composer", slugName);
```

So composer writes `deck.json`, `replacements.json`, and `slide-NN.png` into the admin tmp job folder. Pexels stay under `generated-templates/photos/composer/<brand-slug>/`.

---

## 2. Composer branch

Diff (core):

```diff
+ const mode = String(body && body.mode || "").trim().toLowerCase();
+ const composer = mode === "composer";
  ...
+ if (composer) {
+   themed = await pipeline.runPipeline({
+     mode: "composer",
+     prompt,
+     nonce: body && body.nonce != null ? String(body.nonce) : "",
+     out: relative(dir),
+     deps: body && body.deps,
+   });
+ } else if (native) {
    ...
```

Response still assembled from `dir` slides + shared return object: `id`, `name`, `deck`, `slides[].url`/`name` (preview URLs), `analysis` (score/passed/total), `vibe` (bucket), `layoutId` `"composer"`, `pptxUrl` empty until a `.pptx` exists.

`generateTemplateShape.test.js` now stubs `generateTemplate({ mode: "composer", deps })` (no network) and asserts those fields; Composer is default Mode in the dashboard HTML pins.

---

## 3. Dashboard

Diff summary:

- Mode `<select>`: Composer (selected), Auto-Select, Pinned, Assemble, Native, Remix.
- Nonce text field shown for Composer.
- Generate body sends `mode` and `nonce`.
- After generate, `GET /api/admin/replacements/:id` fills `#composer-meta` with plan (role · component / variant) and fits/collapses counts.
- Existing checkboxes still work and sync Mode.
- Download always offered as `/api/admin/download/:id` (PPTX built on demand).

New route: `GET /api/admin/replacements/:id` (loopback-gated) → `readReplacements` → job `replacements.json`.

---

## 4. Download URL resolution

`ensurePptx` loads `jobDir/deck.json` and calls `catalog.exportDeckPptx`. Photo urls resolve in `catalog.imageFile`:

```244:265:services/templatePipeline/catalog.js
function imageFile(deckId, url) {
  const rel = String(url || "").replace(/\\/g, "/");
  ...
  const candidates = [
    path.resolve(PUBLISHED, deckId, rel),
    path.resolve(GENERATED, rel),
  ];
```

`photos/composer/<slug>/photo-01.jpg` → `generated-templates/photos/composer/<slug>/photo-01.jpg`. Confirmed by successful PPTX export containing brand photos.

---

## 5. Browser proof — Composer generate

Curator log before restart had **no** generate traffic. Restarted on **5055**. Opened `http://127.0.0.1:5055/` — **Composer** preselected.

Prompt `"A corporate payroll company"`, nonce `"4e-admin-1"`, Generate.

| Field | Value |
| --- | --- |
| id | `composer-a-corporate-payroll-company-mvqxglug` |
| layoutId | `composer` |
| vibe | `light-neutral` |
| analysis.score | **100** (6/6) |
| plan shown | Cover cover/split · About split-copy/photo-left · Problem split-copy/photo-right · Solution split-copy/photo-left · Proof stat-row/three-up · Close close/plain |
| fits / collapses | 0 / 9 |
| thumbnails | **6/6** rendered (`naturalWidth` 1600 each) |

Curator log lines (composer generate): alignX/alignY warnings on cover + split-copy photos; no 402.

---

## 6. Download + rasterize

Clicked Download. File size **802656** bytes (`docs/template-pipeline/composer/proof-admin-4e/deck.pptx`).

Rasterized with `soffice.com` → PDF → `pdftoppm`:

1. `docs/template-pipeline/composer/proof-admin-4e/slide-1.png`
2. `docs/template-pipeline/composer/proof-admin-4e/slide-2.png`
3. `docs/template-pipeline/composer/proof-admin-4e/slide-3.png`
4. `docs/template-pipeline/composer/proof-admin-4e/slide-4.png`
5. `docs/template-pipeline/composer/proof-admin-4e/slide-5.png`
6. `docs/template-pipeline/composer/proof-admin-4e/slide-6.png`

`pdftotext`: brand **SwiftPay** present; bullets e.g. **Streamlined payroll processing**, **Expert compliance management**, **Dedicated client support**.

---

## 7. Discard

Clicked Discard. Status: “Discarded. The temporary slides and photos were deleted.”

| Path | Before | After |
| --- | --- | --- |
| `admin-dashboard/tmp/composer-a-corporate-payroll-company-mvqxglug` | present | **gone** |
| `generated-templates/photos/composer/swiftpay-solutions` | present | **gone** |

Other photo dirs unchanged (`composer/apex`, `composer/payroll-pros`, `composer/proof`, `thematic/phase-3-payroll`, empty `native`). Diff vs before: only `swiftpay-solutions` removed.

---

## 8. Auto-Select smoke

Mode → Auto-Select, same prompt, Generate once.

Result: seed path reached. **11 slides**, layout `blue-and-white-modern-business-proposal-presentation`, vision score **100** (11/11). Curator logged many `missing image file photos/blue-and-white-modern-business-proposal-presentation/…` (hatch / seed asset placeholders) — expected, not a routing regression. No throw unrelated to missing assets. Ports 5000/3000 untouched.

---

## 9. Characterization tests

```
qaLoop test passed
semanticFilter test passed
chooseLayout test passed
generateTemplateShape test passed
dead code test passed
manualQa test passed
safeRm test passed
composer.test passed
```

No file named `assembleDeck.js` or `composeDeck.js`.

---

Stop. Do not start Phase 4f.
