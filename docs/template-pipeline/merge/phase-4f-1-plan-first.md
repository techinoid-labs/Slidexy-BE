# Pipeline merge — Phase 4f-1 plan-first

Plan before copy; hard plan repairs; copyFill; remove component-swap refinement. Vision off. Online only in step 6.

---

## 1. Brief restructure (offline)

`brief.js` now exposes:

- `planBrief(prompt, direction, manifest, nonce)` — plan-only JSON (roles, component, variant, accentRole, paletteBucket, fontPair, density, mood, …).
- `copyBrief(prompt, direction, finalPlan, manifest)` — copy against the **repaired** plan; prompt lists per slide `index`, role, component, variant, and every slot with `maxChars` (optional marked). Response keyed by **slide index string**, not role.
- `copyFill(prompt, empties)` — fill only listed empty required slots.
- `validatePlan` — hard rules enforced by **repair** (recorded in `fallbacks`), not rejection:
  - Cover first, Close last; Contents present; 9–11 slides
  - no role except About/Problem/Solution twice
  - ≥3 of About/Problem/Solution; ≥1 Proof/Market; ≥1 Model/People/Next
  - exactly one accentRole; accent-block divider only on that role
  - no consecutive same component+variant; ≤ half slides with photo
- `validateCopy` — missing required → `""`; over-length clamped.
- `migrateLegacyBrief` — maps role-keyed 4f copy → index-keyed for `--replay`.

Legacy `designBrief` / `validateBrief` remain as thin wrappers.

---

## 2. composeRuntime order

```
inventDirection → planBrief → validatePlan → copyBrief → validateCopy
  → compose → fit → collapse → render → hard fails → pptx gate
  → (optional) one copyFill if required slots empty → re-run fit/collapse/render/fails/gate
```

- Cap **4** text-model calls: invent + plan + copy (+ fill).
- Component-swap refinement and `attempt-1/` removed.
- `--replay` stores/reuses final plan + copy; zero network.
- `proof-4f-a` / `proof-4f-b` **remain replayable** via `migrateLegacyBrief` (role-keyed → index-keyed; fallback `replay.copy`). Verified: `proof-4f-a` replay → `textModelCalls: 0`, migration recorded.

---

## 3. Agenda item-4 pptx mismatch (offline)

### Reproduction (`proof-4f-b` slide 2)

| field | value |
| --- | --- |
| element | `composer-agenda-item-4` |
| text | `Proof & Performance` |
| box | x=96 y=384.94 w=1400 h=38.5 bottom=423.44 |
| textMeasure | lines=**1**, charsPerLine=36, capacityChars=36, fontPair=corp-calibri |
| LO words (scaled to 1600×900) | Proof / `&amp;` / Performance — yMin≈400.5 yMax≈428.9 |
| LO line count | **1** (baseline key 400) |
| last baseline | **400** (gate uses yMin); box bottom+4 = 427.44 → within |

**Root cause:** not capacity. `pdftotext -bbox` emits `&amp;` for `&`, so the gate needle `Proof & Perf` missed page text → `pptx mismatch: … missing text`.

**Fix chosen:** decode HTML entities in `pptxGate.js` (`&amp;`, `&apos;`, `&#39;`, numeric). **Neither** wider item column **nor** lower maxChars in `agenda.html` — LO already showed 1 line inside the box.

**Re-proof:** `proofCover.js --component agenda --variant numbered-list` → geometry pass, hard fails `[]`, pptx gate **pass** (score 100). Ampersand agenda one-slide also passes after decode.

(Also decoded `&apos;` — both online decks later failed close-title on `Let&apos;s` the same way; decode covers that for future gates.)

---

## 4. Tests (offline) — `composer.test.js`

- Stub plans violating each hard rule → repaired + fallback recorded.
- After repairing a bad About component, `copyPrompt` lists the repaired component’s slot keys and maxChars.
- Stub copy with two empty slots → exactly one `copyFill` listing those two (with maxChars); clean run = **3** stub calls.
- 9-slide offline compose → geometry/hard fails/gate score **100**.

---

## 5. Online (curator 5055)

Restarted; log before generates:

```
admin curator on http://127.0.0.1:5055
```

Vision off. Prompt: `A corporate payroll company`. No 402.

### 4f1-a — `composer-a-corporate-payroll-company-mvrso9lq` → `docs/template-pipeline/composer/proof-4f1-a/`

| field | value |
| --- | --- |
| nonce | `4f1-a` |
| final plan | Cover/split → Contents/agenda/numbered-list → About/statement/with-kicker → Problem/split-copy/photo-left → Solution/photo-right → Proof/big-number/centered → Model/process/four-step → About/statement/left → **Close**/close/photo |
| repairs | drop duplicate Proof; pad length 8→9; accentRole Solution→About |
| copyFill | **false** |
| textModelCalls | **3** |
| Close last | yes |
| score | **89** (8/9) |
| hard fails / gate | `pptx mismatch: composer-close-title missing text on slide 9` (`Let's Simplify Payroll` → LO `Let&apos;s`; entity decode landed after this generate) |
| deck.qa | mode `manual`, aesthetic present |
| placeholder grep | only `capacityChars` / `capacityLines` keys — no filler strings |
| PNG | `slide-01.png` … `slide-09.png` |
| LO | `lo-slide-1.png` … `lo-slide-9.png` (from `_pptx-gate/`) |

### 4f1-b — `composer-a-corporate-payroll-company-mvrsp3f4` → `docs/template-pipeline/composer/proof-4f1-b/`

| field | value |
| --- | --- |
| nonce | `4f1-b` |
| final plan | 11 slides: Cover/split → Contents/agenda/two-column → Problem/statement → Solution/split-copy → Proof/big-number → Model/process → Market/stat-row → People/team-grid/four → Next/statement → About/split-copy → **Close**/plain |
| repairs | Next had illegal `close` component → statement; Close appended; APS About inserted; accentRole → Next; kicker clamp |
| copyFill | **false** |
| textModelCalls | **3** |
| Close last | yes |
| score | **91** (10/11) |
| hard fails / gate | same close-title `&apos;` mismatch on slide 11 |
| deck.qa | mode `manual` |
| placeholder grep | capacity keys only |
| PNG | `slide-01.png` … `slide-11.png` |
| LO | `lo-slide-1.png` … `lo-slide-11.png` |

**Expected vs actual:** both have Close last and no unfilled slots / no copyFill; scores **89 / 91** (not 100) solely from close-title entity mismatch, fixed in gate afterward for subsequent runs.

---

## 6. Characterization tests

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
```

No file named `assembleDeck.js` or `composeDeck.js`.

---

## 7. Stop

Phase 4f-1 complete. Do not start 4g.
