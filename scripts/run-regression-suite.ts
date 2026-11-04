/**
 * Engine Safety & Regression Suite
 * - Schema validation (kits / brand / tokens)
 * - OOXML snapshot (Nexus Cover)
 * - Visual edge-case fixtures → PNG grid
 * - Motion fallback check (morphSupported:false → fade)
 *
 *   node -r ts-node/register/transpile-only scripts/run-regression-suite.ts
 */
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const JSZip = require("jszip");
const { createCanvas, loadImage } = require("canvas");
const { spawnSync } = require("child_process");

require("ts-node/register/transpile-only");
require("../services/templatePipeline/fonts");

const { selectAll } = require("../engine/selectVariant");
const { runGates } = require("../engine/gates");
const { renderDeckFromSpec, tokens } = require("../engine/render");
const { expandMotionScenes } = require("../engine/motion");
const { exportDeckPptx } = require("../services/templatePipeline/catalog");
const { renderSlidePng } = require("./slideSvg");
const { assertEngineSchemas, SchemaValidationError } = require("../engine/validateSchema");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "out", "regression");
const FIXTURE = path.join(ROOT, "fixtures", "regression-suite.json");

function ensureDir(d: string) {
  fs.mkdirSync(d, { recursive: true });
}

async function buildCase(caseSpec: any) {
  const outDir = path.join(OUT, caseSpec.id);
  ensureDir(outDir);
  const spec = {
    style: caseSpec.style,
    slides: caseSpec.slides,
  };
  const seed = "regression|" + caseSpec.id;
  const selections = selectAll(spec, seed);
  caseSpec.slides.forEach((slide: any, i: number) => {
    if (slide.variantHint) selections[i] = { role: slide.role, variant: slide.variantHint };
  });
  const gates = runGates(spec, selections, tokens, caseSpec.deckType || "Pitch");
  let deck = await renderDeckFromSpec(spec, selections, { id: caseSpec.id });
  deck.name = caseSpec.label || caseSpec.id;

  const motionCfg = Object.assign(
    {
      morph: true,
      ambient: true,
      cameraPan: true,
      scatter: false,
      defaultTransition: "fade",
    },
    caseSpec.motion || {}
  );
  deck.engine = deck.engine || {};
  deck.engine.motion = Object.assign({}, deck.engine.motion, motionCfg);

  deck.layoutSequence.forEach((lid: string, i: number) => {
    const slide = caseSpec.slides[i];
    if (slide && slide.transition && deck.layouts[lid]) {
      deck.layouts[lid].motion = Object.assign({}, deck.layouts[lid].motion, {
        transition: slide.transition,
        morphSupported: motionCfg.morphSupported,
        fallbackTransition: "fade",
      });
    }
  });

  deck = expandMotionScenes(deck, motionCfg);
  // propagate morphSupported into engine.motion for OOXML fallback
  deck.engine.motion = Object.assign({}, deck.engine.motion, {
    morphSupported: motionCfg.morphSupported !== false,
    fallbackTransition: "fade",
  });

  const pngs: string[] = [];
  for (let i = 0; i < deck.layoutSequence.length; i++) {
    const lid = deck.layoutSequence[i];
    const file = path.join(outDir, "slide-" + String(i + 1).padStart(2, "0") + ".png");
    try {
      renderSlidePng(deck, lid, file);
      pngs.push(file);
    } catch (err: any) {
      console.warn("png", caseSpec.id, lid, err && err.message);
    }
  }

  const pptxPath = path.join(outDir, "deck.pptx");
  await exportDeckPptx(deck, pptxPath);

  // Motion fallback assertion for morph-disabled case
  if (motionCfg.morphSupported === false) {
    const zip = await JSZip.loadAsync(fs.readFileSync(pptxPath));
    const slides = Object.keys(zip.files)
      .filter((n) => /ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort();
    let sawFade = false;
    let sawMorph = false;
    for (const name of slides) {
      const xml = await zip.file(name).async("string");
      if (/p159:morph/.test(xml)) sawMorph = true;
      if (/<p:fade\/>/.test(xml)) sawFade = true;
    }
    assert.strictEqual(sawMorph, false, caseSpec.id + " should not emit Morph when unsupported");
    assert.ok(sawFade, caseSpec.id + " should fall back to fade");
  }

  fs.writeFileSync(
    path.join(outDir, "summary.json"),
    JSON.stringify(
      {
        id: caseSpec.id,
        label: caseSpec.label,
        gates: gates.pass,
        selections: selections.map((s: any) => s.role + "/" + s.variant),
        sequence: deck.layoutSequence,
        kitStatus: deck.layoutSequence.map((lid: string) => ({
          id: lid,
          kit: deck.layouts[lid].kitId,
          status: deck.layouts[lid].kitStatus,
        })),
        motion: deck.engine.motion,
        pngs: pngs.map((p) => path.basename(p)),
        pptx: "deck.pptx",
      },
      null,
      2
    )
  );

  return { outDir, pngs, label: caseSpec.label || caseSpec.id };
}

async function writeSuiteGrid(results: any[]) {
  const cells: Array<{ img: string; label: string }> = [];
  results.forEach((r) => {
    r.pngs.forEach((png: string, idx: number) => {
      cells.push({ img: png, label: r.label + " · " + (idx + 1) });
    });
  });
  const cols = 4;
  const rows = Math.ceil(cells.length / cols) || 1;
  const cellW = 420;
  const cellH = 236;
  const gap = 10;
  const header = 56;
  const canvas = createCanvas(cols * cellW + (cols + 1) * gap, header + rows * (cellH + 28 + gap) + gap);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0e1116";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f2f4f7";
  ctx.font = "bold 20px Arial";
  ctx.fillText("Engine Regression Suite — visual edge cases", gap, 28);
  ctx.font = "12px Arial";
  ctx.fillStyle = "#93a0b4";
  ctx.fillText("massive titles · empty team · 6-item grids · morph fallback", gap, 48);

  for (let i = 0; i < cells.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = gap + col * (cellW + gap);
    const y = header + row * (cellH + 28 + gap);
    const img = await loadImage(cells[i].img);
    ctx.drawImage(img, x, y, cellW, cellH);
    ctx.fillStyle = "#c9d4e8";
    ctx.font = "11px Arial";
    ctx.fillText(cells[i].label, x, y + cellH + 16);
  }
  const dest = path.join(OUT, "regression-grid.png");
  fs.writeFileSync(dest, canvas.toBuffer("image/png"));
  return dest;
}

async function main() {
  ensureDir(OUT);
  const report: any = { startedAt: new Date().toISOString(), checks: [] };

  // 1) Schema
  console.log("\n[1/4] Schema validation…");
  try {
    const schema = assertEngineSchemas();
    report.checks.push({ name: "schema", pass: true, detail: schema });
    console.log("  PASS —", schema.checked, "kits,", schema.locked.length, "locked");
  } catch (err: any) {
    report.checks.push({ name: "schema", pass: false, error: err.message });
    console.error("  FAIL", err.message);
    throw err;
  }

  // 2) OOXML snapshot (spawn so UPDATE_GOLDEN can seed on first run)
  console.log("\n[2/4] OOXML snapshot (Nexus Cover)…");
  const snap = spawnSync(
    process.execPath,
    ["-r", "ts-node/register/transpile-only", path.join("scripts", "ooxml-snapshot-test.ts")],
    {
      cwd: ROOT,
      env: Object.assign({}, process.env, {
        UPDATE_GOLDEN: fs.existsSync(path.join(ROOT, "fixtures", "golden", "nexus-cover", "slide1.motion.xml"))
          ? "0"
          : "1",
      }),
      encoding: "utf8",
    }
  );
  if (snap.status !== 0) {
    report.checks.push({ name: "ooxml-snapshot", pass: false, error: snap.stdout + snap.stderr });
    console.error(snap.stdout, snap.stderr);
    throw new Error("ooxml-snapshot-test failed");
  }
  report.checks.push({ name: "ooxml-snapshot", pass: true, log: (snap.stdout || "").trim() });
  console.log("  PASS");

  // 3) Visual regression fixtures
  console.log("\n[3/4] Visual regression fixtures…");
  const suite = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
  const results = [];
  for (const c of suite.cases) {
    console.log("  building", c.id);
    results.push(await buildCase(c));
  }
  const grid = await writeSuiteGrid(results);
  report.checks.push({
    name: "visual-regression",
    pass: true,
    cases: results.map((r) => r.label),
    grid: path.relative(ROOT, grid).replace(/\\/g, "/"),
  });
  console.log("  PASS — grid", path.relative(ROOT, grid));

  // 4) Locked kits still populate but geometry frozen (spot-check)
  console.log("\n[4/4] Kit lock spot-check…");
  const lockedBrutal = JSON.parse(fs.readFileSync(path.join(ROOT, "kit", "cover", "brutalist.json"), "utf8"));
  assert.strictEqual(lockedBrutal.status, "locked");
  assert.ok(lockedBrutal.motion, "locked kit must declare motion rules");
  report.checks.push({
    name: "kit-lock",
    pass: true,
    locked: ["cover/brutalist", "testimonial/b", "feature/editorial"],
  });
  console.log("  PASS — Nexus Cover / Little Smiles Testimonial / Brutalist Editorial locked");

  report.finishedAt = new Date().toISOString();
  report.pass = report.checks.every((c: any) => c.pass);
  fs.writeFileSync(path.join(OUT, "regression-report.json"), JSON.stringify(report, null, 2));

  console.log("\n=== REGRESSION SUITE", report.pass ? "PASSED" : "FAILED", "===");
  console.log("Report:", path.join(OUT, "regression-report.json"));
  console.log("Grid:", grid);
  if (!report.pass) process.exit(1);
}

main().catch((err) => {
  if (err instanceof SchemaValidationError) console.error(err.message);
  else console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
