/**
 * Creative Mutation test — Corporate SaaS (grid/dashboard) vs Creative Agency (brutalist/editorial).
 * Emits decks + a side-by-side compare grid.
 *
 *   node -r ts-node/register/transpile-only scripts/mutate-themes.ts
 */
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

require("ts-node/register/transpile-only");
require("../services/templatePipeline/fonts");

const { selectAll, resolveThemeLock } = require("../engine/selectVariant");
const { runGates } = require("../engine/gates");
const { renderDeckFromSpec, tokens } = require("../engine/render");
const { exportDeckPptx } = require("../services/templatePipeline/catalog");
const { renderSlidePng } = require("./slideSvg");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "out", "mutate");

function readJson(rel: string) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

const corporateSpec = {
  style: {
    palette: "paper-blue",
    typePair: "tech-verdana",
    imageTreatment: "full-bleed",
    motif: "bar-accent",
    typeTreatment: "solid",
  },
  slides: [
    {
      role: "cover",
      title: "LedgerFlow",
      caption: "EU payroll, done right",
      photoQuery: "modern office desks people working",
      photoOrientation: "landscape",
    },
    {
      role: "problem",
      title: "Compliance drag",
      body: ["Manual packs", "Late filings"],
      photoQuery: "messy desk papers office stress",
      photoOrientation: "landscape",
    },
    {
      role: "solution",
      title: "One control plane",
      body: ["Country packs", "Audit trails"],
      photoQuery: "team collaborating at whiteboard office",
      photoOrientation: "landscape",
    },
    {
      role: "how-it-works",
      variantHint: "dashboard",
      title: "Rollout",
      body: ["Connect HRIS", "Map rules", "Run payroll"],
    },
    {
      role: "feature",
      variantHint: "b",
      title: "Controls",
      body: ["Country packs", "Approvals", "Exports", "Alerts"],
      photoQueries: [
        "conference room discussion professionals",
        "manager reviewing documents office",
        "team handshake bright office",
        "open office collaborative workspace",
      ],
      photoQuery: "conference room discussion professionals",
      photoOrientation: "landscape",
    },
    {
      role: "stats",
      variantHint: "dashboard",
      title: "Scale",
      stats: [
        { value: "18", label: "EU countries" },
        { value: "99.9%", label: "run success" },
        { value: "2d", label: "avg onboard" },
      ],
    },
    {
      role: "testimonial",
      title: "Finance leads",
      body: ["We closed month-end two days earlier"],
      caption: "CFO, mid-market SaaS",
      photoQuery: "smiling business professional portrait office",
      photoOrientation: "portrait",
    },
    {
      role: "team",
      title: "Builders",
      members: [
        { name: "Nora Hale", role: "CEO" },
        { name: "Ivo Novak", role: "Product" },
        { name: "Lea Ortiz", role: "Compliance" },
      ],
      photoQuery: "product team meeting modern office",
      photoOrientation: "landscape",
    },
    {
      role: "closing",
      title: "Run payroll calm",
      body: ["Book a demo", "hello@ledgerflow.example"],
      photoQuery: "handshake in bright office",
      photoOrientation: "landscape",
    },
  ],
};

const agencySpec = {
  style: {
    palette: "mist-teal",
    typePair: "display-trebuchet",
    imageTreatment: "full-bleed",
    motif: "brush-stroke",
    typeTreatment: "outline",
  },
  slides: [
    {
      role: "cover",
      variantHint: "brutalist",
      title: "Mist Studio",
      caption: "Brand systems that land",
      photoQuery: "creative studio workspace natural light",
      photoOrientation: "portrait",
    },
    {
      role: "problem",
      variantHint: "editorial",
      title: "Lookalike brands",
      body: ["Safe templates", "No tension"],
      caption: "Problem",
      photoQuery: "generic stock office handshake bland",
      photoOrientation: "landscape",
    },
    {
      role: "solution",
      title: "Editorial systems",
      body: ["Voice first", "Image tension"],
      photoQuery: "art direction moodboard desk",
      photoOrientation: "landscape",
    },
    {
      role: "how-it-works",
      title: "Studio rhythm",
      body: ["Discover", "Design", "Ship"],
      photoQuery: "creative team workshop sticky notes",
      photoOrientation: "landscape",
    },
    {
      role: "feature",
      variantHint: "editorial",
      title: "Craft stack",
      body: ["Identity", "Motion", "Web", "Campaign"],
      caption: "Feature",
      photoQuery: "brand identity print samples desk",
      photoOrientation: "landscape",
    },
    {
      role: "stats",
      variantHint: "c",
      title: "Outcomes",
      stats: [
        { value: "60+", label: "brands" },
        { value: "4.8", label: "client NPS" },
        { value: "3wk", label: "avg sprint" },
      ],
    },
    {
      role: "testimonial",
      variantHint: "brutalist",
      title: "Clients",
      body: ["They made our brand feel inevitable"],
      caption: "CMO, consumer brand",
      photoQuery: "smiling creative professional portrait",
      photoOrientation: "portrait",
    },
    {
      role: "team",
      title: "Partners",
      members: [
        { name: "Elena Voss", role: "Strategy" },
        { name: "Omar Said", role: "Art" },
        { name: "Jun Park", role: "Motion" },
      ],
      photoQuery: "creative directors portrait studio",
      photoOrientation: "portrait",
    },
    {
      role: "closing",
      title: "Start a project",
      body: ["hello@mist.studio"],
      photoQuery: "sunlit design studio windows plants",
      photoOrientation: "landscape",
    },
  ],
};

async function buildDeck(id: string, name: string, spec: any) {
  const outDir = path.join(OUT, id);
  ensureDir(outDir);
  const lock = resolveThemeLock(spec);
  const seed = name + "|" + spec.style.palette + "|" + spec.style.typePair + "|mutate";
  const selections = selectAll(spec, seed);
  // Honor explicit hints after lock clamp
  spec.slides.forEach((slide: any, i: number) => {
    if (slide.variantHint) {
      const allowed = lock && lock.allowed && lock.allowed[slide.role];
      if (!allowed || allowed.indexOf(slide.variantHint) >= 0) {
        selections[i] = { role: slide.role, variant: slide.variantHint };
      }
    }
  });
  const gates = runGates(spec, selections, tokens, "Pitch");
  const deck = await renderDeckFromSpec(spec, selections, { id });
  deck.name = name;
  fs.writeFileSync(path.join(outDir, "deckspec.json"), JSON.stringify(spec, null, 2));
  fs.writeFileSync(path.join(outDir, "deck.json"), JSON.stringify(deck, null, 2));
  fs.writeFileSync(path.join(outDir, "gates.json"), JSON.stringify(gates, null, 2));
  fs.writeFileSync(
    path.join(outDir, "selections.json"),
    JSON.stringify(
      {
        lock: lock && lock.id,
        typeTreatment: spec.style.typeTreatment,
        selections: selections.map((s: any) => s.role + "/" + s.variant),
      },
      null,
      2
    )
  );
  for (let i = 0; i < deck.layoutSequence.length; i++) {
    const lid = deck.layoutSequence[i];
    const file = path.join(outDir, "slide-" + String(i + 1).padStart(2, "0") + ".png");
    renderSlidePng(deck, lid, file);
  }
  try {
    await exportDeckPptx(deck, path.join(outDir, "deck.pptx"));
  } catch (err: any) {
    console.warn("pptx", id, err && err.message);
  }
  return { outDir, deck, selections, lock, gates };
}

async function writeCompareGrid(corpDir: string, agencyDir: string, dest: string) {
  const corpSlides = fs
    .readdirSync(corpDir)
    .filter((n: string) => /^slide-\d{2}\.png$/.test(n))
    .sort();
  const agencySlides = fs
    .readdirSync(agencyDir)
    .filter((n: string) => /^slide-\d{2}\.png$/.test(n))
    .sort();
  const rows = Math.max(corpSlides.length, agencySlides.length);
  const cellW = 640;
  const cellH = 360;
  const labelH = 36;
  const canvas = createCanvas(cellW * 2 + 48, rows * (cellH + labelH) + 72);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0e1116";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f2f4f7";
  ctx.font = "bold 22px Arial";
  ctx.fillText("Creative Mutation — Corporate SaaS  |  Creative Agency", 24, 36);
  ctx.font = "14px Arial";
  ctx.fillStyle = "#9aa8c2";
  ctx.fillText("grid / dashboard lock", 24, 58);
  ctx.fillText("brutalist / editorial + outline type", 24 + cellW + 24, 58);

  for (let i = 0; i < rows; i++) {
    const y = 72 + i * (cellH + labelH);
    const left = corpSlides[i];
    const right = agencySlides[i];
    if (left) {
      const img = await loadImage(path.join(corpDir, left));
      ctx.drawImage(img, 16, y, cellW, cellH);
      ctx.fillStyle = "#9aa8c2";
      ctx.font = "12px Arial";
      ctx.fillText("Corporate · " + left, 16, y + cellH + 18);
    }
    if (right) {
      const img = await loadImage(path.join(agencyDir, right));
      ctx.drawImage(img, 24 + cellW, y, cellW, cellH);
      ctx.fillStyle = "#9aa8c2";
      ctx.font = "12px Arial";
      ctx.fillText("Agency · " + right, 24 + cellW, y + cellH + 18);
    }
  }
  fs.writeFileSync(dest, canvas.toBuffer("image/png"));
  return dest;
}

async function main() {
  ensureDir(OUT);
  console.log("Building Corporate SaaS (paper-blue lock)…");
  const corp = await buildDeck("corporate-saas-mutated", "LedgerFlow — Corporate SaaS Mutated", corporateSpec);
  console.log(
    "  lock",
    corp.lock && corp.lock.id,
    corp.selections.map((s: any) => s.role + "/" + s.variant).join(" → ")
  );

  console.log("Building Creative Agency (mist-teal lock)…");
  const agency = await buildDeck("creative-agency-mutated", "Mist Studio — Creative Agency Mutated", agencySpec);
  console.log(
    "  lock",
    agency.lock && agency.lock.id,
    agency.selections.map((s: any) => s.role + "/" + s.variant).join(" → ")
  );

  const grid = path.join(OUT, "compare-grid.png");
  await writeCompareGrid(corp.outDir, agency.outDir, grid);
  const summary = {
    corporate: {
      dir: corp.outDir,
      lock: corp.lock && corp.lock.id,
      selections: corp.selections.map((s: any) => s.role + "/" + s.variant),
      gates: corp.gates.pass,
    },
    agency: {
      dir: agency.outDir,
      lock: agency.lock && agency.lock.id,
      selections: agency.selections.map((s: any) => s.role + "/" + s.variant),
      typeTreatment: agencySpec.style.typeTreatment,
      gates: agency.gates.pass,
    },
    compareGrid: grid,
  };
  fs.writeFileSync(path.join(OUT, "mutate-summary.json"), JSON.stringify(summary, null, 2));
  console.log("\nCompare grid →", grid);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
