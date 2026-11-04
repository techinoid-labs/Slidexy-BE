# Motion Engine Plan (Morph + Classic Animations)

Source inspected: `Gradient Texture UI Morph Slides for Business2.pptx`  
Implementation: `services/templatePipeline/motionOoxml.js`, `engine/motion.ts`, `kit/feature/morph-scatter.json`

## Principles

1. **100% native OOXML** — no baked video/GIF motion; files stay editable in PowerPoint.
2. **Morph + classic entrances** — both are first-class (Phases A–D).
3. **Faux-3D Parallax** — background scales 20–30% between keyframes; foreground text shifts ~5%.
4. **Depth cards** — `shapeTreatment: "depth"` keeps outer shadows through Morph (`!!morph:*` + `depth:1`).

## What the reference deck uses

```xml
<p:transition spd="slow" p14:dur="2000">
  <p159:morph option="byObject"/>
</p:transition>
```

No `p:timing` in that file — but our engine **also** injects classic entrances for non-morph slides.

## Implemented

### Phase A — Morph transitions
`applyMotionOoxml` injects `<p159:morph option="byObject"/>` on morph destination slides.

### Phase B — Object identity
Elements stamped `!!morph:title`, `!!morph:hero`, `!!morph:photo-1`, …

### Phase C — Keyframe scenes
| Scene | Behavior |
|-------|----------|
| **Camera Pan (cover)** | Duplicate cover; end frame bg ×1.2–1.3, title −5% X; Morph |
| **Scatter (feature)** | `morph-scatter` kit — cluster → grid; Morph + depth shadows |

### Phase D — Classic entrances (full)
Timing templates in `motionOoxml.js` / wired via `catalog.js`:

| Preset | OOXML |
|--------|--------|
| `fadeIn` | presetID 10 + `animEffect filter="fade"` |
| `flyInFromBottom` | presetID 2 + `fly(fromBottom)` |
| `zoomIn` | presetID 53 + `animScale` |

Targets resolved from `!!morph:*` names → `spid`.

### Standard transitions
Per-layout `motion.transition`: `fade` | `push` | `wipe` | `morph` | `none`.

### Faux-3D Parallax
`engine.motion.parallaxScale` (default 1.25) + `parallaxTextShift` (0.05). Depth shadows via pptxgenjs `shadow` + OOXML `outerShdw` fallback for `depth:1`.

### Phase E — Ambient / looping (one per slide)
Flag: `engine.motion.ambient: true`. Kits in `kit/ambient/` inject `<p:timing>` with `repeatCount="indefinite"`.

**Clash rule:** no ambient on Morph destinations, Morph start frames, or the slide *before* a Morph. Ambient only with standard transitions (`fade` / `push` / `wipe` / `none`).

| Kit | Effect |
|-----|--------|
| `pulse` | Pulse accent / `pulse-bg` shape (never text) · 105% · 3s |
| `float` | 5px-radius circle breathe · 15s |
| `ken-burns` | Center Grow/Shrink · container 110% · 105% · 10s · autoRev |
| `teeter` → float Y | Isometric image-card Y-axis hover · 5px · 15s (no rotation) |

## Generate test decks

```bash
node -r ts-node/register/transpile-only scripts/generate-motion-deck.ts
node -r ts-node/register/transpile-only scripts/generate-ambient-deck.ts
```

Outputs: `out/motion/motion-engine-deck.pptx`, `out/motion/ambient-motion-deck.pptx`, `out/motion/motion-audit.md`.

## Command Center

`out/command-center/index.html` — Motion badges on thumbs + **Preview Motion** modal (PPTX-only playback).
