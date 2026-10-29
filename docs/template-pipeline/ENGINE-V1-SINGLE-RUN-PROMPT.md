# Engine v1 — single-run prompt (Claude Code)

Copy everything below the line into Claude Code on branch `engine-v1`.
Repo root: `Slidexy-BE/`. Do not invent new generate modes. Kit + DeckSpec + tokens only.

---

## Role

You are a senior engineer finishing Slidexy’s **kit-first layout engine**. LLM writes a DeckSpec (content + style tokens). Deterministic code selects variants and fills slots. **No AI coordinates.**

## Hard rules

- Canvas **1600×900**, schemaVersion 2 (`x,y,width,height`).
- Never trace, import, or convert PNGs under `design/refs/` — composition rules only.
- One product path. Seed rewrite / freeform native stay out of the user path.
- PPTX must open in PowerPoint with editable text and separate pictures.
- Stop when the report lands; do not expand scope.

## Pre-flight (already done by operator — re-check if needed)

- `PEXELS_API_KEY` (or stock photo key) present in `.env`
- Renderer (`scripts/slideSvg.js` / pipeline `renderDeck`) and PPTX exporter (`catalog.exportDeckPptx`) run today

## Deliverables (do in order)

### 1 — DeckSpec schema

JSON schema + 5 hand-written example specs: `{ style: { palette, typePair, imageTreatment, motif }, slides: [{ role, variantHint?, title, body[], photoQuery, … }] }` with hard char limits per role.

Exit: any validating spec renders without judgment calls.

### 2 — Style tokens

**Six palettes** (at least **two dark**), **four type pairs**, **two image treatments** — one treatment **must be duotone**; the other full-bleed or framed. Optional: 2–3 motifs.

Artifact: `tokens.json` + a contact sheet of palette × type pair.

Exit: no ugly combination on the sheet.

### 3 — Role kit skeleton

Roles for v1 pitch: cover, agenda, problem, solution, how-it-works, feature, stats, testimonial, team, closing.

Each role: **variant A + variant B** where NOTES specifies B; otherwise two distinct compositions from PRIMARY refs.

Wire named slots + fit rules (min/max font, line clamps). Do not invent freeform boxes.

### 4 — Author variants from composition rules

**Source of truth:** [`design/refs/NOTES.md`](../../design/refs/NOTES.md)

Read the header (photo-footer family, PRIMARY tags, variant-B lines, vibe/token note) then each `## role/file.png` block.

Build from STEAL / GRID / IMAGE / HIERARCHY — never from the PNGs as assets.

Mandatory:

- One shared **`photo-footer`** family bound to problem / solution / closing variant A (footer height + copy density only differ).
- Feature PRIMARY = feature-01 + feature-02; 03/04 supporting only.
- Closing PRIMARY = closing-01 + closing-02; closing-03 panel idea reference only — **no** resources/token-kit slide in v1.
- Cover-01 / cover-03: steal placement; photo + treatment; no 3D / shape-asset recreation.
- Implement every listed **variant B** for problem, solution, stats, testimonial, team, agenda.

Exit: variant gallery PNGs for every PRIMARY + every variant B.

### 5 — Fitter + gates

Text fit (shrink → clamp → reject), contrast, photo-present, slide-count, duplicate-title.

Exit: 20 random specs → zero overflow, zero empty required photo slots.

### 6 — Prompt → DeckSpec → three proof decks

One LLM call (+ one repair on gate fail). Generate **three** decks from distinct prompts (e.g. supercars garage, pediatric clinic, B2B payroll). Export PPTX for each.

## Report

Write `docs/template-pipeline/ENGINE-V1-REPORT.md` with: what shipped, paths to variant JSON + PNGs, gate results, paths to the three PPTX files, and anything deferred.

## Human check after you stop

Operator opens the three PPTX files in real PowerPoint and confirms editable text + separate pictures.
