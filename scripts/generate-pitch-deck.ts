/**
 * Pitch Deck archetype — Tech Minimalist theme + pitch-deck sequence.
 *
 *   node -r ts-node/register/transpile-only scripts/generate-pitch-deck.ts
 *
 * Outputs: out/pitch-deck/deck.pptx, preview-grid.png, …
 */
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

require("ts-node/register/transpile-only");
require("../services/templatePipeline/fonts");

const { selectAll, resolveThemeLock } = require("../engine/selectVariant");
const { runGates } = require("../engine/gates");
const { renderDeckFromSpec, tokens } = require("../engine/render");
const { expandMotionScenes } = require("../engine/motion");
const { normalizeDeckSpec, resolveContentDensity, typographyFloors } = require("../engine/content");
const { assertEngineSchemas } = require("../engine/validateSchema");
const { exportDeckPptx } = require("../services/templatePipeline/catalog");
const { renderSlidePng } = require("./slideSvg");
const { getSequence } = require("../engine/sequences");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "out", "pitch-deck");

function ensureDir(d: string) {
  fs.mkdirSync(d, { recursive: true });
}

const SEQUENCE = getSequence("pitch-deck");

const spec = {
  style: {
    palette: "tech-minimalist",
    typePair: "tech-inter",
    imageTreatment: "full-bleed",
    motif: "refined",
    typeTreatment: "solid",
    contentDensity: "keynote",
    sequence: "pitch-deck",
  },
  slides: [
    {
      role: "cover",
      title: "Northline",
      caption: "B2B workflow OS for revenue teams — Series A",
      photoQuery: "modern saas product workspace laptop dashboard daylight",
      photoOrientation: "landscape",
      transition: "fade",
    },
    {
      role: "comparison",
      title: "The revenue ops tax",
      headers: ["Before", "After"],
      before: [
        "Reps live in 6 tabs to update one deal",
        "Forecasts lag by 9 days on average",
        "CS handoffs lose context every time",
        "Managers rebuild the same board weekly",
      ],
      after: [
        "One deal room — CRM, docs, and tasks",
        "Live forecast from stage evidence",
        "Context travels with every handoff",
        "Boards update themselves from activity",
      ],
      transition: "fade",
    },
    {
      role: "feature",
      title: "One system. Three surfaces.",
      body: [
        "Deal Rooms — shared truth for every opportunity",
        "Signal Inbox — next-best action from activity",
        "Forecast Graph — evidence-backed pipeline",
        "Playbooks — enforce the motion, not the myth",
      ],
      photoQueries: [
        "saas crm deal pipeline ui clean",
        "product analytics dashboard abstract",
        "team collaboration whiteboard modern office",
        "software notification inbox minimal ui",
      ],
      photoOrientations: ["landscape", "landscape", "landscape", "landscape"],
      transition: "fade",
    },
    {
      role: "portfolio",
      title: "Product in the wild",
      body: ["Deal Room — Acme renewal", "Signal Inbox", "Forecast Graph"],
      photoQueries: [
        "enterprise software dashboard ultrawide monitor",
        "product manager reviewing analytics tablet",
        "close up of clean mobile saas app interface",
      ],
      photoOrientations: ["landscape", "landscape", "portrait"],
      transition: "fade",
    },
    {
      role: "timeline",
      title: "90-day launch plan",
      caption: "Land, expand, and prove ROI before the board meeting",
      steps: [
        {
          date: "Days 1–30",
          title: "Connect",
          body: "CRM sync, SSO, and first Deal Rooms for top 20 accounts",
        },
        {
          date: "Days 31–60",
          title: "Adopt",
          body: "Playbooks live; managers run weekly forecast from evidence",
        },
        {
          date: "Days 61–90",
          title: "Prove",
          body: "Cycle-time and forecast accuracy deltas for ELT review",
        },
        {
          date: "Day 90+",
          title: "Scale",
          body: "Roll out to CS + partner channels with shared rooms",
        },
      ],
      transition: "fade",
    },
    {
      role: "stats",
      title: "Traction",
      caption: "Net revenue retention — last 8 quarters",
      stats: [{ value: "128%", label: "net revenue retention" }],
      chart: {
        type: "line",
        labels: ["Q1", "Q2", "Q3", "Q4", "Q1", "Q2", "Q3", "Q4"],
        series: [{ name: "NRR", values: [102, 105, 109, 112, 116, 119, 124, 128] }],
        showLegend: false,
      },
      transition: "wipe",
    },
    {
      role: "pricing",
      title: "Simple packages",
      caption: "Annual billing · seats include Deal Rooms + Forecast Graph",
      tiers: [
        {
          name: "Starter",
          price: "$49",
          features: ["Up to 15 seats", "Deal Rooms", "CRM sync", "Email support"],
        },
        {
          name: "Growth",
          price: "$129",
          popular: true,
          badge: "Most Popular",
          features: [
            "Up to 75 seats",
            "Signal Inbox",
            "Forecast Graph",
            "Playbooks + SSO",
            "Priority support",
          ],
        },
        {
          name: "Enterprise",
          price: "Custom",
          features: [
            "Unlimited seats",
            "Sandbox + SCIM",
            "Dedicated CSM",
            "Custom data residency",
          ],
        },
      ],
      transition: "fade",
    },
    {
      role: "team",
      title: "Team",
      members: [
        { name: "Maya Chen", role: "CEO" },
        { name: "Omar Ruiz", role: "CTO" },
        { name: "Priya Shah", role: "VP Product" },
      ],
      photoQueries: [
        "professional headshot asian woman executive studio",
        "professional headshot latino man engineer studio",
        "professional headshot south asian woman product leader studio",
      ],
      photoOrientations: ["portrait", "portrait", "portrait"],
      transition: "fade",
    },
    {
      role: "closing",
      title: "Let's build the operating system for revenue",
      body: ["Book a 30-minute product walkthrough", "northline.io/demo"],
      caption: "Northline — Series A",
      transition: "fade",
    },
  ],
};

async function writeGrid(outDir: string, files: string[], labels: string[]) {
  const cols = 3;
  const rows = Math.ceil(files.length / cols);
  const thumbW = 420;
  const thumbH = 236;
  const pad = 18;
  const header = 52;
  const canvas = createCanvas(cols * (thumbW + pad) + pad, rows * (thumbH + pad) + pad + header);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0F172A";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#F8FAFC";
  ctx.font = "700 20px Segoe UI";
  ctx.fillText("Pitch Deck — Northline · Tech Minimalist · sequence: pitch-deck", pad, 34);
  for (let i = 0; i < files.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col * (thumbW + pad);
    const y = header + pad + row * (thumbH + pad);
    try {
      const img = await loadImage(files[i]);
      ctx.drawImage(img, x, y, thumbW, thumbH);
    } catch {
      ctx.fillStyle = "#334155";
      ctx.fillRect(x, y, thumbW, thumbH);
    }
    ctx.fillStyle = "#E2E8F0";
    ctx.font = "600 13px Segoe UI";
    ctx.fillText(labels[i] || "S" + (i + 1), x + 8, y + thumbH - 10);
  }
  const gridPath = path.join(outDir, "preview-grid.png");
  fs.writeFileSync(gridPath, canvas.toBuffer("image/png"));
  return gridPath;
}

async function main() {
  ensureDir(OUT);
  console.log("Schema gate…");
  assertEngineSchemas();
  console.log("Sequence:", SEQUENCE && SEQUENCE.id, "→", SEQUENCE && SEQUENCE.beats.map((b: any) => b.role + "/" + b.variant).join(" → "));

  const prepared = normalizeDeckSpec(spec);
  const density = resolveContentDensity(prepared);
  console.log("Density:", density, "floors:", typographyFloors(density));

  const lock = resolveThemeLock(prepared);
  console.log("Theme lock:", lock && (lock.id || lock.label));

  const seed = "northline-pitch|tech-minimalist";
  const selections = selectAll(prepared, seed);
  console.log(
    "Selections:",
    selections.map((s: any, i: number) => (i + 1) + ":" + s.role + "/" + s.variant).join(" | ")
  );

  const gates = runGates(prepared, selections, tokens);
  console.log("Gates:", gates.pass ? "PASS" : "FAIL", !gates.pass ? JSON.stringify(gates.slides.filter((s: any) => !s.pass).slice(0, 3)) : "");

  let deck = await renderDeckFromSpec(prepared, selections, { id: "pitch-northline-tech" });
  deck.name = "Northline Pitch — Tech Minimalist";

  deck.layoutSequence.forEach((lid: string, i: number) => {
    const slide = prepared.slides[i];
    if (slide && slide.transition && deck.layouts[lid]) {
      deck.layouts[lid].motion = Object.assign({}, deck.layouts[lid].motion, {
        transition: slide.transition,
        durationMs: 600,
      });
    }
  });

  deck = expandMotionScenes(deck, {
    morph: false,
    ambient: false,
    cameraPan: false,
    scatter: false,
    defaultTransition: "fade",
    durationMs: 600,
  });

  const pngFiles: string[] = [];
  const labels: string[] = [];
  for (let i = 0; i < deck.layoutSequence.length; i++) {
    const lid = deck.layoutSequence[i];
    const layout = deck.layouts[lid];
    const beat = SEQUENCE && SEQUENCE.beats[i];
    const label =
      "S" +
      String(i + 1).padStart(2, "0") +
      " " +
      (beat ? beat.beat : layout.role) +
      " · " +
      (layout.kitId || selections[i].role + "/" + selections[i].variant);
    const file = path.join(
      OUT,
      "slide-" +
        String(i + 1).padStart(2, "0") +
        "-" +
        String(layout.kitId || layout.role || "slide").replace(/\//g, "-") +
        ".png"
    );
    console.log("  png", path.basename(file));
    renderSlidePng(deck, lid, file);
    pngFiles.push(file);
    labels.push(label);
  }

  const pptxPath = path.join(OUT, "deck.pptx");
  await exportDeckPptx(deck, pptxPath);
  const gridPath = await writeGrid(OUT, pngFiles, labels);

  const summary = {
    id: "pitch-northline-tech",
    theme: "Tech Minimalist",
    sequence: "pitch-deck",
    palette: "tech-minimalist",
    typePair: "tech-inter",
    slideCount: deck.layoutSequence.length,
    selections: selections.map((s: any) => s.role + "/" + s.variant),
    kitsUsed: Array.from(new Set(deck.layoutSequence.map((lid: string) => deck.layouts[lid].kitId))),
    gates: { pass: gates.pass },
    pptx: path.relative(ROOT, pptxPath).replace(/\\/g, "/"),
    previewGrid: path.relative(ROOT, gridPath).replace(/\\/g, "/"),
  };
  fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(OUT, "deckspec.json"), JSON.stringify(prepared, null, 2));
  fs.writeFileSync(path.join(OUT, "deck.json"), JSON.stringify(deck, null, 2));

  console.log("\n=== PITCH DECK READY ===");
  console.log("PPTX:", pptxPath);
  console.log("Grid:", gridPath);
  console.log("Kits:", summary.kitsUsed.join(", "));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
