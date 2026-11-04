/**
 * Pro / Internal Tool pipeline — Phases 1–5.
 * node -r ts-node/register/transpile-only scripts/pro-pipeline.ts
 */
const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");

require("ts-node/register/transpile-only");
require("../services/templatePipeline/fonts");

const { selectAll } = require("../engine/selectVariant");
const { runGates } = require("../engine/gates");
const { renderDeckFromSpec, tokens } = require("../engine/render");
const { loadBrand } = require("../engine/brand");
const { applyKpisToSpec, ingestKpis } = require("../engine/kpi");
const { exportDeckPptx } = require("../services/templatePipeline/catalog");
const { renderSlidePng } = require("./slideSvg");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "out", "pro");

type VariantId = "a" | "b" | "c";

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file: string) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function nexusSpec() {
  return readJson(path.join(ROOT, "out", "themes", "ember-night-gaming-lounge", "deckspec.json"));
}

function littleSmilesSpec() {
  return readJson(path.join(ROOT, "out", "themes", "clinic-warm-pediatric", "deckspec.json"));
}

function forceVariantHints(spec: any, forced: VariantId) {
  const roles = new Set(["feature", "testimonial", "team"]);
  return {
    ...spec,
    slides: (spec.slides || []).map((s: any) =>
      roles.has(s.role) ? { ...s, variantHint: forced } : { ...s }
    ),
  };
}

async function renderAndExport(
  spec: any,
  outDir: string,
  deckId: string,
  name: string,
  opts?: { brand?: any; forceHints?: VariantId }
) {
  ensureDir(outDir);
  let working = opts && opts.forceHints ? forceVariantHints(spec, opts.forceHints) : spec;
  const seed = name + "|" + working.style.palette + "|" + working.style.typePair;
  const selections = selectAll(working, seed);
  working.slides.forEach((slide: any, i: number) => {
    if (slide.variantHint) selections[i] = { role: slide.role, variant: slide.variantHint };
  });
  const gates = runGates(working, selections, tokens, "Pitch");
  const deck = await renderDeckFromSpec(working, selections, {
    id: deckId,
    brand: opts && opts.brand,
  });
  deck.name = name;
  fs.writeFileSync(path.join(outDir, "deckspec.json"), JSON.stringify(working, null, 2));
  fs.writeFileSync(path.join(outDir, "deck.json"), JSON.stringify(deck, null, 2));
  fs.writeFileSync(path.join(outDir, "gates.json"), JSON.stringify(gates, null, 2));
  fs.writeFileSync(
    path.join(outDir, "selections.json"),
    JSON.stringify(
      selections.map((s: any) => s.role + "/" + s.variant),
      null,
      2
    )
  );
  // PNG previews for first + multi-variant slides (Command Center thumbnails)
  const previewRoles = new Set(["cover", "feature", "testimonial", "team", "stats"]);
  for (let i = 0; i < deck.layoutSequence.length; i++) {
    const lid = deck.layoutSequence[i];
    const layout = deck.layouts[lid];
    if (!previewRoles.has(layout && layout.role)) continue;
    try {
      renderSlidePng(
        deck,
        lid,
        path.join(outDir, "slide-" + String(i + 1).padStart(2, "0") + "-" + layout.role + ".png")
      );
    } catch (err: any) {
      console.warn("png skip", lid, err && err.message);
    }
  }
  const pptxPath = path.join(outDir, "deck.pptx");
  await exportDeckPptx(deck, pptxPath);
  return { deck, gates, selections, pptxPath, outDir };
}

async function auditPptxIntegrity(pptxPath: string) {
  const buf = fs.readFileSync(pptxPath);
  const zip = await JSZip.loadAsync(buf);
  const slideNames = Object.keys(zip.files).filter((n) => /ppt\/slides\/slide\d+\.xml$/.test(n));
  let textRuns = 0;
  let groups = 0;
  let ellipseMasks = 0;
  let roundRectMasks = 0;
  let bakedPngPics = 0;
  for (const name of slideNames) {
    const xml = await zip.file(name).async("string");
    textRuns += (xml.match(/<a:t>/g) || []).length;
    groups += (xml.match(/<p:grpSp>/g) || []).length;
    ellipseMasks += (xml.match(/prst="ellipse"/g) || []).length;
    roundRectMasks += (xml.match(/prst="roundRect"/g) || []).length;
    // Heuristic: pics that only have embedded media without prstGeom are fine;
    // count a:blip with no following prst in same pic as rect crops.
  }
  // Count media — native path embeds under ppt/media
  const media = Object.keys(zip.files).filter((n) => n.indexOf("ppt/media/") === 0);
  return {
    slides: slideNames.length,
    nativeTextRuns: textRuns,
    groups,
    ellipseCropToShape: ellipseMasks,
    roundRectCropToShape: roundRectMasks,
    mediaFiles: media.length,
    bakedPngPics,
    pass:
      textRuns > 0 &&
      groups > 0 &&
      (ellipseMasks > 0 || roundRectMasks > 0) &&
      media.length > 0,
  };
}

async function phase1() {
  console.log("\n=== Phase 1: PPTX Structural Integrity Gate ===");
  const phaseDir = path.join(OUT, "phase1-integrity");
  ensureDir(phaseDir);

  // Re-export latest theme decks through hardened catalog (native text/groups/masks)
  const targets = [
    {
      id: "ember-night-gaming-lounge",
      label: "Nexus Lounge",
      outName: "nexus-v15.pptx",
    },
    {
      id: "clinic-warm-pediatric",
      label: "Little Smiles",
      outName: "little-smiles-v15.pptx",
    },
  ];

  const reports: any[] = [];
  for (const t of targets) {
    const deckPath = path.join(ROOT, "out", "themes", t.id, "deck.json");
    if (!fs.existsSync(deckPath)) throw new Error("Missing theme deck: " + deckPath);
    const deck = readJson(deckPath);
    // Refresh engine pptx rules stamp
    if (!deck.engine) deck.engine = {};
    deck.engine.v = "1.5-pro";
    deck.engine.pptxRules = {
      noGlassmorphism: true,
      solidOverlayOpacity: "60-80%",
      masks: ["circle", "roundedRect", "rect"],
      nativeCropToShape: true,
      editableTextOnly: true,
      solidBackgrounds: true,
      groupedOverlaps: true,
    };
    const dest = path.join(phaseDir, t.outName);
    await exportDeckPptx(deck, dest);
    // Also copy as deck.pptx beside theme for convenience
    await exportDeckPptx(deck, path.join(ROOT, "out", "themes", t.id, "deck.pptx"));
    const audit = await auditPptxIntegrity(dest);
    reports.push({ id: t.id, label: t.label, file: dest, audit });
    console.log(t.label, "→", dest, audit);
  }
  fs.writeFileSync(path.join(phaseDir, "integrity-report.json"), JSON.stringify(reports, null, 2));
  return reports;
}

async function phase2() {
  console.log("\n=== Phase 2: Multi-Variant A/B/C ===");
  const phaseDir = path.join(OUT, "phase2-variants");
  ensureDir(phaseDir);
  const base = nexusSpec();
  const letters: VariantId[] = ["a", "b", "c"];
  const results: any[] = [];
  for (const letter of letters) {
    const outDir = path.join(phaseDir, "option-" + letter.toUpperCase());
    const built = await renderAndExport(
      base,
      outDir,
      "nexus-option-" + letter,
      "Nexus Lounge — Option " + letter.toUpperCase(),
      { forceHints: letter }
    );
    const pptxName = "deck-option-" + letter.toUpperCase() + ".pptx";
    const dest = path.join(phaseDir, pptxName);
    fs.copyFileSync(built.pptxPath, dest);
    const feat = built.selections.find((s: any) => s.role === "feature");
    const tes = built.selections.find((s: any) => s.role === "testimonial");
    const team = built.selections.find((s: any) => s.role === "team");
    results.push({
      option: letter.toUpperCase(),
      file: dest,
      feature: feat && feat.variant,
      testimonial: tes && tes.variant,
      team: team && team.variant,
      selections: built.selections.map((s: any) => s.role + "/" + s.variant),
    });
    console.log("Option", letter.toUpperCase(), results[results.length - 1]);
  }
  fs.writeFileSync(path.join(phaseDir, "variants-report.json"), JSON.stringify(results, null, 2));
  return results;
}

async function phase3() {
  console.log("\n=== Phase 3: brand.json Token Injection ===");
  const phaseDir = path.join(OUT, "phase3-brand");
  ensureDir(phaseDir);
  const brand = loadBrand(path.join(ROOT, "fixtures", "brand-acme.json"));
  fs.writeFileSync(path.join(phaseDir, "brand.json"), JSON.stringify(brand, null, 2));
  // Copy canonical brand.json to out as well
  fs.copyFileSync(path.join(ROOT, "brand.json"), path.join(phaseDir, "brand-default.json"));

  const base = littleSmilesSpec();
  const built = await renderAndExport(
    base,
    phaseDir,
    "little-smiles-branded",
    "Little Smiles — Acme Brand Lock",
    { brand }
  );
  const dest = path.join(phaseDir, "deck-branded.pptx");
  fs.copyFileSync(built.pptxPath, dest);

  const tokensOut = built.deck.tokens;
  const report = {
    brand,
    lockedFonts: tokensOut.font,
    lockedColors: tokensOut.color,
    engineBrand: built.deck.engine && built.deck.engine.brand,
    file: dest,
    pass:
      tokensOut.font.display === brand.fonts.display &&
      tokensOut.font.body === brand.fonts.body &&
      tokensOut.color.accent === brand.colors.accent,
  };
  fs.writeFileSync(path.join(phaseDir, "brand-report.json"), JSON.stringify(report, null, 2));
  console.log("Brand lock", report.pass, tokensOut.font, tokensOut.color.accent);
  return report;
}

async function phase4() {
  console.log("\n=== Phase 4: KPI → Stats Ingestion ===");
  const phaseDir = path.join(OUT, "phase4-kpi");
  ensureDir(phaseDir);
  const kpis = readJson(path.join(ROOT, "fixtures", "kpis-sample.json"));
  fs.writeFileSync(path.join(phaseDir, "kpis.json"), JSON.stringify(kpis, null, 2));
  const ordered = ingestKpis(kpis);
  fs.writeFileSync(path.join(phaseDir, "kpis-ordered.json"), JSON.stringify(ordered, null, 2));

  let spec = nexusSpec();
  spec = applyKpisToSpec(spec, kpis, { title: "Traction" });
  const built = await renderAndExport(spec, phaseDir, "nexus-kpi-stats", "Nexus — KPI Stats");
  const dest = path.join(phaseDir, "deck-kpi-stats.pptx");
  fs.copyFileSync(built.pptxPath, dest);

  const statsSel = built.selections.find((s: any) => s.role === "stats");
  const statsSlide = (built.deck.layouts &&
    Object.values(built.deck.layouts).find((l: any) => l.role === "stats")) as any;
  const report = {
    input: kpis,
    ordered,
    hero: ordered[0],
    secondary: ordered[ordered.length - 1],
    variant: statsSel && statsSel.variant,
    expectedHero: "50k",
    expectedRetention: "98%",
    file: dest,
    pass:
      ordered[0].value === "50k" &&
      ordered.some((s: any) => s.value === "98%") &&
      statsSel &&
      statsSel.variant === "c",
  };
  fs.writeFileSync(path.join(phaseDir, "kpi-report.json"), JSON.stringify(report, null, 2));
  console.log("KPI hierarchy", report);
  void statsSlide;
  return report;
}

async function phase5() {
  console.log("\n=== Phase 5: Command Center Mockup ===");
  const phaseDir = path.join(OUT, "command-center");
  ensureDir(phaseDir);
  const src = path.join(ROOT, "out", "command-center", "index.html");
  const htmlPath = path.join(phaseDir, "index.html");
  if (!fs.existsSync(src)) throw new Error("Missing Command Center mockup at " + src);
  fs.copyFileSync(src, htmlPath);
  console.log("Command Center →", htmlPath);
  return { file: htmlPath, source: src };
}

async function main() {
  ensureDir(OUT);
  const started = Date.now();
  const p1 = await phase1();
  const p2 = await phase2();
  const p3 = await phase3();
  const p4 = await phase4();
  const p5 = await phase5();
  const summary = {
    elapsedMs: Date.now() - started,
    phase1: p1,
    phase2: p2,
    phase3: p3,
    phase4: p4,
    phase5: p5,
    outputs: {
      integrity: path.join(OUT, "phase1-integrity"),
      variants: path.join(OUT, "phase2-variants"),
      brand: path.join(OUT, "phase3-brand"),
      kpi: path.join(OUT, "phase4-kpi"),
      commandCenter: path.join(OUT, "command-center", "index.html"),
    },
  };
  fs.writeFileSync(path.join(OUT, "pipeline-summary.json"), JSON.stringify(summary, null, 2));
  console.log("\n=== DONE ===");
  console.log(JSON.stringify(summary.outputs, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
