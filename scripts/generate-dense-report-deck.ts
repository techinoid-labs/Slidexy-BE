/**
 * Data-dense consulting report — themeable via CLI.
 *
 *   node -r ts-node/register/transpile-only scripts/generate-dense-report-deck.ts
 *   node -r ts-node/register/transpile-only scripts/generate-dense-report-deck.ts mist-teal
 *   node -r ts-node/register/transpile-only scripts/generate-dense-report-deck.ts charcoal-ember
 *
 * Outputs: out/dense-report[-theme]/deck.pptx, preview-grid.png, …
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

const ROOT = path.join(__dirname, "..");

const THEME_PRESETS: Record<string, { label: string; palette: string; typePair: string; imageTreatment: string; typeTreatment?: string; outSlug: string }> = {
  "paper-blue": {
    label: "Corporate SaaS",
    palette: "paper-blue",
    typePair: "corp-calibri",
    imageTreatment: "full-bleed",
    typeTreatment: "solid",
    outSlug: "dense-report",
  },
  "mist-teal": {
    label: "Creative Agency",
    palette: "mist-teal",
    typePair: "display-trebuchet",
    imageTreatment: "tint",
    typeTreatment: "solid",
    outSlug: "dense-report-mist-teal",
  },
  "charcoal-ember": {
    label: "Bold Ember",
    palette: "charcoal-ember",
    typePair: "slab-rockwell",
    imageTreatment: "tint",
    typeTreatment: "solid",
    outSlug: "dense-report-charcoal-ember",
  },
  "ivory-warm": {
    label: "Warm Editorial",
    palette: "ivory-warm",
    typePair: "editorial-cambria",
    imageTreatment: "full-bleed",
    typeTreatment: "solid",
    outSlug: "dense-report-ivory-warm",
  },
  "ink-night": {
    label: "Ink Night",
    palette: "ink-night",
    typePair: "modern-segoe",
    imageTreatment: "tint",
    typeTreatment: "solid",
    outSlug: "dense-report-ink-night",
  },
  "slate-light": {
    label: "Luxury Editorial",
    palette: "slate-light",
    typePair: "serif-constantia",
    imageTreatment: "full-bleed",
    typeTreatment: "solid",
    outSlug: "dense-report-slate-light",
  },
  // Theme Catalog — 6 visual worlds (same layouts, token-only)
  "tech-minimalist": {
    label: "Tech Minimalist (Light)",
    palette: "tech-minimalist",
    typePair: "tech-inter",
    imageTreatment: "full-bleed",
    typeTreatment: "solid",
    outSlug: "theme-catalog/tech-minimalist",
  },
  "luxury-editorial": {
    label: "Luxury Editorial (Warm)",
    palette: "luxury-editorial",
    typePair: "luxury-playfair",
    imageTreatment: "sepia-duotone",
    typeTreatment: "solid",
    outSlug: "theme-catalog/luxury-editorial",
  },
  "brutalist-agency": {
    label: "Brutalist Agency (High Contrast)",
    palette: "brutalist-agency",
    typePair: "brutalist-grotesk",
    imageTreatment: "contrast-bw",
    typeTreatment: "solid",
    outSlug: "theme-catalog/brutalist-agency",
  },
  "healthcare-clinical": {
    label: "Healthcare / Clinical (Soft)",
    palette: "healthcare-clinical",
    typePair: "clinical-nunito",
    imageTreatment: "full-bleed",
    typeTreatment: "solid",
    outSlug: "theme-catalog/healthcare-clinical",
  },
  "corporate-finance": {
    label: "Corporate Finance (Classic)",
    palette: "corporate-finance",
    typePair: "finance-georgia",
    imageTreatment: "navy-duotone",
    typeTreatment: "solid",
    outSlug: "theme-catalog/corporate-finance",
  },
  "cyberpunk-gaming": {
    label: "Cyberpunk / Gaming (Dark)",
    palette: "cyberpunk-gaming",
    typePair: "cyber-orbitron",
    imageTreatment: "neon-tint",
    typeTreatment: "solid",
    outSlug: "theme-catalog/cyberpunk-gaming",
  },
};

const themeKey = String(process.argv[2] || "paper-blue").toLowerCase();
const themePreset = THEME_PRESETS[themeKey] || THEME_PRESETS["paper-blue"];
if (!THEME_PRESETS[themeKey]) {
  console.warn("Unknown theme '" + themeKey + "', falling back to paper-blue. Available:", Object.keys(THEME_PRESETS).join(", "));
}
const OUT = path.join(ROOT, "out", themePreset.outSlug);

function ensureDir(d: string) {
  fs.mkdirSync(d, { recursive: true });
}

/** ~95-word consulting prose to exercise overflow routing (split at 80 → 40 + remainder). */
const LONG_PROSE =
  "Attrition in critical product and customer-success roles has stabilized at 18% annualized, " +
  "yet the replacement cycle still averages ninety-four days from requisition to productive ramp. " +
  "Manager span of control expanded from six to nine direct reports after the Q2 reorganization, " +
  "which improved payroll efficiency but diluted coaching capacity for early-tenure employees. " +
  "Engagement survey themes cluster around career-path ambiguity, inconsistent calibration across " +
  "regions, and uneven access to stretch assignments. Compensation bands remain competitive for " +
  "IC3–IC5, while people-manager cash compensation lags peer SaaS medians by roughly six percent " +
  "in EMEA. The working recommendation is to fund a twelve-month talent-system rebuild spanning " +
  "hiring velocity, manager enablement, and internal mobility before the next planning cycle.";

const spec = {
  style: {
    palette: themePreset.palette,
    typePair: themePreset.typePair,
    imageTreatment: themePreset.imageTreatment,
    motif: "refined",
    typeTreatment: themePreset.typeTreatment || "solid",
    contentDensity: "report",
  },
  slides: [
    {
      role: "cover",
      variantHint: "a",
      title: "People Strategy 2026",
      caption: themePreset.label + " HR operating plan — confidential",
      photoQuery: "corporate office team collaboration daylight",
      photoOrientation: "landscape",
      transition: "fade",
    },
    {
      role: "report",
      variantHint: "agenda",
      title: "Agenda",
      body: [
        "Executive diagnosis and talent-system thesis",
        "Attrition composition and hiring funnel charts",
        "Consulting breakdown — time-to-productivity",
        "Headcount plan, investment case, and risks",
        "90-day actions, governance, and decision",
      ],
      transition: "fade",
    },
    {
      role: "report",
      variantHint: "executive-summary",
      title: "Executive summary",
      caption: "KEY TAKEAWAY",
      takeaway:
        "Cut critical-role time-to-productivity **30%** in four quarters via a funded talent-system rebuild.",
      body: [
        "Hiring: rebuild the requisition-to-offer funnel with weekly capacity planning and a dedicated sourcer pod for product and CS roles.",
        "Managers: restore coaching capacity with span-of-control guardrails and a mandatory enablement curriculum for first-line leaders.",
        "Mobility: publish internal pathways and fill at least **35%** of IC4+ openings from the internal slate before external posting.",
      ],
      transition: "fade",
    },
    {
      role: "report",
      variantHint: "consulting-breakdown",
      title: "The productivity gap",
      caption: "Critical-role replacement cycle",
      body: [
        "Attrition in critical product and customer-success roles has stabilized, yet the replacement cycle still averages **94 days** from requisition to productive ramp. " +
          "Manager span of control expanded after the Q2 reorganization, which improved payroll efficiency but diluted coaching capacity for early-tenure employees. " +
          "The working recommendation is to fund a twelve-month talent-system rebuild spanning hiring velocity, manager enablement, and internal mobility.",
      ],
      transition: "fade",
    },
    {
      role: "report",
      variantHint: "chart-panel",
      title: "Attrition composition",
      caption: "Regretted vs. non-regretted exits — trailing twelve months",
      chart: {
        type: "donut",
        labels: ["Regretted", "Non-regretted", "Restructuring"],
        series: [{ name: "Exits", values: [42, 38, 20] }],
        holeSize: 55,
        showPercent: true,
        showLegend: true,
      },
      transition: "fade",
    },
    {
      role: "report",
      variantHint: "chart-panel",
      title: "Hiring funnel velocity",
      caption: "Average days in stage — critical roles (Q3–Q4)",
      chart: {
        type: "line",
        labels: ["Intake", "Screen", "Onsite", "Offer", "Start"],
        series: [
          { name: "Product", values: [6, 11, 18, 9, 14] },
          { name: "Customer success", values: [5, 9, 14, 8, 12] },
        ],
        showLegend: true,
      },
      transition: "fade",
    },
    {
      role: "report",
      variantHint: "chart-panel",
      title: "Workforce mix by region",
      caption: "Headcount stack — Product, CS, People managers",
      chart: {
        type: "stackedBar",
        labels: ["NAM", "EMEA", "APAC"],
        series: [
          { name: "Product", values: [120, 64, 48] },
          { name: "Customer success", values: [80, 52, 36] },
          { name: "People managers", values: [28, 18, 12] },
        ],
        showLegend: true,
      },
      transition: "fade",
    },
    {
      role: "report",
      variantHint: "two-column-text",
      title: "Workforce diagnosis",
      headers: ["Current State", "Regional Differences"],
      body: [
        LONG_PROSE,
        "NAM fills engineering fastest but carries the highest **regretted attrition** among senior ICs. " +
          "EMEA manager pay lags peer medians; APAC mobility improves once pathways are visible. " +
          "Shared services grew 11% without a productivity model, pushing shadow work onto HRBPs. " +
          "HRIS job-architecture cleanup is the prerequisite for predictive attrition models.",
      ],
      transition: "fade",
    },
    {
      role: "report",
      variantHint: "bulleted-list",
      title: "Priority workstreams",
      body: [
        "• Hiring system rebuild — Install weekly funnel reviews; staff a sourcer pod; publish SLA targets for every stage from intake to offer.",
        "• Manager enablement — Cap spans at **1:7** for early-tenure teams; ship a 6-module coaching curriculum; audit calibration fairness quarterly.",
        "• Internal mobility — Launch role architecture maps; require internal slate review before external post for IC4+; track fill rate monthly.",
        "• Comp & recognition — Re-anchor EMEA manager bands to peer median; expand spot recognition budget tied to engagement drivers.",
        "• People analytics — Clean job codes in HRIS; stand up attrition risk dashboards; review with ELT every month.",
      ],
      transition: "fade",
    },
    {
      role: "report",
      variantHint: "data-table",
      title: "Headcount & hiring plan",
      caption: "FY26 quarterly plan — critical roles only (product, CS, people managers)",
      table: [
        ["Role family", "Q1 hires", "Q2 hires", "Q3 hires", "Q4 hires"],
        ["Product engineering", "14", "16", "12", "10"],
        ["Customer success", "9", "11", "8", "7"],
        ["People managers", "4", "5", "4", "3"],
        ["Total critical", "27", "32", "24", "20"],
      ],
      transition: "fade",
    },
    {
      role: "report",
      variantHint: "two-column-text",
      title: "Investment case",
      headers: ["Budget & Payback", "Risks & Mitigations"],
      body: [
        "The **$4.2M** operating budget covers sourcer capacity, manager curriculum design, HRIS remediation, and EMEA manager band adjustments. " +
          "Modeled payback assumes −30% time-to-productivity and −4pts regretted attrition, unlocking about $6.1M in avoided backfill and ramp cost over eighteen months.",
        "Risks center on ELT attention, HRIS vendor timeline, and headcount freezes. " +
          "Mitigations: monthly ELT talent review, a fixed data-cleanup milestone before dashboards go live, and pre-approved exception lanes for revenue-critical requisitions.",
      ],
      transition: "fade",
    },
    {
      role: "report",
      variantHint: "bulleted-list",
      title: "90-day actions",
      body: [
        "• Stand up the critical-role funnel board — owners, stage SLAs, and a Friday staffing review with Recruiting and HRBPs.",
        "• Freeze new manager spans above 1:8 until enablement modules 1–3 are complete for that leader.",
        "• Publish the IC4+ internal slate policy and run the first mobility council.",
        "• Commission HRIS job-architecture cleanup with a dated acceptance checklist.",
        "• Brief ELT on the investment case and lock Q1–Q2 funding gates.",
      ],
      transition: "fade",
    },
    {
      role: "report",
      variantHint: "executive-summary",
      title: "Governance & metrics",
      takeaway:
        "ELT reviews talent KPIs monthly; funding unlocks only when hiring SLAs, mobility, and attrition stay on plan.",
      body: [
        "North-star metrics: regretted attrition ≤**14%**, time-to-productivity **−30%**, internal fill ≥35% for IC4+.",
        "Operating cadence: weekly funnel, monthly ELT talent review, quarterly calibration fairness audit.",
        "Escalation: any critical-role SLA miss for two consecutive weeks triggers an ELT staffing exception review.",
      ],
      transition: "fade",
    },
    {
      role: "stats",
      variantHint: "dashboard",
      title: "Targets",
      stats: [
        { value: "−30%", label: "time to productivity" },
        { value: "14%", label: "regretted attrition cap" },
        { value: "35%", label: "internal IC4+ fill" },
      ],
      transition: "wipe",
    },
    {
      role: "closing",
      variantHint: "b",
      title: "Next step",
      body: ["Approve the **$4.2M** talent rebuild", "Confirm ELT monthly review owners"],
      caption: "People Strategy 2026 — " + themePreset.label,
      photoQuery: "executive handshake modern office glass",
      photoOrientation: "landscape",
      transition: "fade",
    },
  ],
};

async function writeGrid(outDir: string, files: string[]) {
  const cols = 5;
  const rows = Math.ceil(files.length / cols);
  const thumbW = 320;
  const thumbH = 180;
  const pad = 16;
  const canvas = createCanvas(cols * (thumbW + pad) + pad, rows * (thumbH + pad) + pad + 40);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0F172A";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#E2E8F0";
  ctx.font = "600 18px Calibri";
  ctx.fillText("Data-Dense Report — " + themePreset.label + " (People Strategy 2026)", pad, 28);
  for (let i = 0; i < files.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col * (thumbW + pad);
    const y = 40 + pad + row * (thumbH + pad);
    try {
      const img = await loadImage(files[i]);
      ctx.drawImage(img, x, y, thumbW, thumbH);
    } catch {
      ctx.fillStyle = "#334155";
      ctx.fillRect(x, y, thumbW, thumbH);
    }
    ctx.fillStyle = "#94A3B8";
    ctx.font = "12px Calibri";
    ctx.fillText("S" + String(i + 1).padStart(2, "0"), x + 6, y + thumbH - 8);
  }
  const gridPath = path.join(outDir, "preview-grid.png");
  fs.writeFileSync(gridPath, canvas.toBuffer("image/png"));
  return gridPath;
}

async function main() {
  ensureDir(OUT);
  console.log("Schema gate…");
  assertEngineSchemas();

  const prepared = normalizeDeckSpec(spec);
  const density = resolveContentDensity(prepared);
  const floors = typographyFloors(density);
  console.log("Density:", density, "floors:", floors);
  console.log("Slides after overflow routing:", prepared.slides.length);

  const lock = resolveThemeLock(prepared);
  console.log("Theme lock:", lock && (lock.id || lock.label));

  console.log("Theme:", themePreset.label, "(" + themePreset.palette + " / " + themePreset.typePair + ")");

  const seed = "dense-hr-strategy|" + themePreset.palette;
  const selections = selectAll(prepared, seed);
  prepared.slides.forEach((slide: any, i: number) => {
    if (slide.variantHint) selections[i] = { role: slide.role, variant: String(slide.variantHint) };
  });

  const gates = runGates(prepared, selections, tokens);
  console.log("Gates:", gates.pass ? "PASS" : "FAIL");

  let deck = await renderDeckFromSpec(prepared, selections, { id: "dense-hr-" + themePreset.palette });
  deck.name = "People Strategy 2026 — " + themePreset.label;

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
  for (let i = 0; i < deck.layoutSequence.length; i++) {
    const lid = deck.layoutSequence[i];
    const layout = deck.layouts[lid];
    const file = path.join(
      OUT,
      "slide-" + String(i + 1).padStart(2, "0") + "-" + (layout.role || "slide") + ".png"
    );
    console.log("  png", path.basename(file), layout.kitId || layout.variant);
    renderSlidePng(deck, lid, file);
    pngFiles.push(file);
  }

  const pptxPath = path.join(OUT, "deck.pptx");
  await exportDeckPptx(deck, pptxPath);
  const gridPath = await writeGrid(OUT, pngFiles);

  const summary = {
    id: "dense-hr-" + themePreset.palette,
    theme: themePreset.label,
    palette: themePreset.palette,
    typePair: themePreset.typePair,
    contentDensity: density,
    typographyFloors: floors,
    slideCount: deck.layoutSequence.length,
    overflowSplits: prepared.slides.filter((s: any) => s.continued).length,
    selections: selections.map((s: any) => s.role + "/" + s.variant),
    kitsUsed: Array.from(new Set(deck.layoutSequence.map((lid: string) => deck.layouts[lid].kitId))),
    gates: { pass: gates.pass },
    pptx: path.relative(ROOT, pptxPath).replace(/\\/g, "/"),
    previewGrid: path.relative(ROOT, gridPath).replace(/\\/g, "/"),
  };
  fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(OUT, "deckspec.json"), JSON.stringify(prepared, null, 2));
  fs.writeFileSync(path.join(OUT, "deck.json"), JSON.stringify(deck, null, 2));
  fs.writeFileSync(path.join(OUT, "gates.json"), JSON.stringify(gates, null, 2));

  console.log("\n=== DENSE REPORT DECK READY ===");
  console.log("PPTX:", pptxPath);
  console.log("Grid:", gridPath);
  console.log("Slides:", summary.slideCount, "| continued:", summary.overflowSplits);
  console.log("Kits:", summary.kitsUsed.join(", "));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
