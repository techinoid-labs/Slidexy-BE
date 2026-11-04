/**
 * Try brand.json + KPI fixtures on real decks.
 * node -r ts-node/register/transpile-only scripts/try-brand-kpi.ts
 */
const fs = require("fs");
const path = require("path");

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
const OUT = path.join(ROOT, "out", "pro", "examples");

const examples = [
  {
    id: "volt-fintech-nexus",
    title: "Volt Capital × Nexus",
    baseSpec: "out/themes/ember-night-gaming-lounge/deckspec.json",
    brand: "fixtures/brand-volt-fintech.json",
    kpis: "fixtures/kpis-fintech.json",
    statsTitle: "Traction",
  },
  {
    id: "acme-clinic-littlesmiles",
    title: "Acme Health × Little Smiles",
    baseSpec: "out/themes/clinic-warm-pediatric/deckspec.json",
    brand: "fixtures/brand-acme.json",
    kpis: "fixtures/kpis-clinic.json",
    statsTitle: "Trust",
  },
  {
    id: "atelier-agency-mist",
    title: "Atelier North × Studio",
    baseSpec: "out/themes/mist-studio-agency/deckspec.json",
    brand: "fixtures/brand-atelier.json",
    kpis: "fixtures/kpis-agency.json",
    statsTitle: "Outcomes",
  },
];

function readJson(rel: string) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

async function runOne(ex: (typeof examples)[0]) {
  const outDir = path.join(OUT, ex.id);
  fs.mkdirSync(outDir, { recursive: true });

  const brand = loadBrand(path.join(ROOT, ex.brand));
  const kpis = readJson(ex.kpis);
  const ordered = ingestKpis(kpis);

  let spec = readJson(ex.baseSpec);
  spec = applyKpisToSpec(spec, kpis, { title: ex.statsTitle });

  const seed = ex.title + "|" + spec.style.palette + "|" + spec.style.typePair + "|brand-kpi";
  const selections = selectAll(spec, seed);
  spec.slides.forEach((slide: any, i: number) => {
    if (slide.variantHint) selections[i] = { role: slide.role, variant: slide.variantHint };
  });

  const gates = runGates(spec, selections, tokens, "Pitch");
  const deck = await renderDeckFromSpec(spec, selections, { id: ex.id, brand });
  deck.name = ex.title;

  fs.writeFileSync(path.join(outDir, "brand.json"), JSON.stringify(brand, null, 2));
  fs.writeFileSync(path.join(outDir, "kpis.json"), JSON.stringify(kpis, null, 2));
  fs.writeFileSync(path.join(outDir, "kpis-ordered.json"), JSON.stringify(ordered, null, 2));
  fs.writeFileSync(path.join(outDir, "deckspec.json"), JSON.stringify(spec, null, 2));
  fs.writeFileSync(path.join(outDir, "deck.json"), JSON.stringify(deck, null, 2));
  fs.writeFileSync(path.join(outDir, "gates.json"), JSON.stringify(gates, null, 2));

  // Preview cover + stats (brand + KPI proof)
  for (let i = 0; i < deck.layoutSequence.length; i++) {
    const lid = deck.layoutSequence[i];
    const role = deck.layouts[lid] && deck.layouts[lid].role;
    if (role !== "cover" && role !== "stats" && role !== "feature") continue;
    try {
      renderSlidePng(
        deck,
        lid,
        path.join(outDir, "slide-" + String(i + 1).padStart(2, "0") + "-" + role + ".png")
      );
    } catch (err: any) {
      console.warn("png", ex.id, role, err && err.message);
    }
  }

  const pptx = path.join(outDir, "deck.pptx");
  await exportDeckPptx(deck, pptx);

  const report = {
    id: ex.id,
    title: ex.title,
    brand: {
      name: brand.name,
      fonts: brand.fonts,
      accent: brand.colors && brand.colors.accent,
      bg: brand.colors && brand.colors.bg,
    },
    lockedTokens: deck.tokens,
    kpisInput: kpis,
    kpisOrdered: ordered,
    hero: ordered[0],
    statsVariant: (selections.find((s: any) => s.role === "stats") || {}).variant,
    gates: gates.pass,
    pptx,
  };
  fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
  console.log("\n" + ex.title);
  console.log("  fonts:", deck.tokens.font.display, "/", deck.tokens.font.body);
  console.log("  accent:", deck.tokens.color.accent, "bg:", deck.tokens.color.bg);
  console.log(
    "  KPIs:",
    ordered.map((s: any) => s.value + " " + s.label).join(" → ")
  );
  console.log("  stats/" + report.statsVariant, "→", pptx);
  return report;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const reports = [];
  for (const ex of examples) reports.push(await runOne(ex));
  fs.writeFileSync(path.join(OUT, "examples-summary.json"), JSON.stringify(reports, null, 2));
  console.log("\nAll examples →", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
