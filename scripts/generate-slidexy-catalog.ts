/**
 * Slidexy website template arsenal — niche × theme × sequence batch generator.
 *
 *   node -r ts-node/register/transpile-only scripts/generate-slidexy-catalog.ts --proof
 *   node -r ts-node/register/transpile-only scripts/generate-slidexy-catalog.ts --limit=5
 *   node -r ts-node/register/transpile-only scripts/generate-slidexy-catalog.ts
 *
 * Outputs per template:
 *   out/slidexy-catalog/<niche>-<sequence>/deck.pptx
 *   out/slidexy-catalog/<niche>-<sequence>/cover-preview.png
 *   out/slidexy-catalog/<niche>-<sequence>/grid-preview.png
 *   out/slidexy-catalog/catalog.json
 */
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

require("ts-node/register/transpile-only");
require("../services/templatePipeline/fonts");

const { selectAll } = require("../engine/selectVariant");
const { runGates } = require("../engine/gates");
const { renderDeckFromSpec, tokens } = require("../engine/render");
const { expandMotionScenes } = require("../engine/motion");
const { normalizeDeckSpec, resolveContentDensity } = require("../engine/content");
const { assertEngineSchemas } = require("../engine/validateSchema");
const { exportDeckPptx } = require("../services/templatePipeline/catalog");
const { renderSlidePng } = require("./slideSvg");
const { getSequence, listSequences } = require("../engine/sequences");

const ROOT = path.join(__dirname, "..");
const OUT_ROOT = path.join(ROOT, "out", "slidexy-catalog");

type ThemePreset = {
  label: string;
  palette: string;
  typePair: string;
  imageTreatment: string;
};

type NicheDef = {
  id: string;
  title: string;
  brand: string;
  tagline: string;
  nicheLabel: string;
  sequence: string;
  theme: ThemePreset;
  photos: {
    cover: string;
    product: string[];
    team: string[];
    feature: string[];
    case: string;
  };
};

const THEMES: Record<string, ThemePreset> = {
  "tech-minimalist": {
    label: "Tech Minimalist",
    palette: "tech-minimalist",
    typePair: "tech-inter",
    imageTreatment: "full-bleed",
  },
  "luxury-editorial": {
    label: "Luxury Editorial",
    palette: "luxury-editorial",
    typePair: "luxury-playfair",
    imageTreatment: "sepia-duotone",
  },
  "corporate-finance": {
    label: "Corporate Finance",
    palette: "corporate-finance",
    typePair: "finance-georgia",
    imageTreatment: "navy-duotone",
  },
  "healthcare-clinical": {
    label: "Healthcare Clinical",
    palette: "healthcare-clinical",
    typePair: "clinical-nunito",
    imageTreatment: "full-bleed",
  },
  "cyberpunk-gaming": {
    label: "Cyberpunk Gaming",
    palette: "cyberpunk-gaming",
    typePair: "cyber-orbitron",
    imageTreatment: "neon-tint",
  },
  "brutalist-agency": {
    label: "Brutalist Agency",
    palette: "brutalist-agency",
    typePair: "brutalist-grotesk",
    imageTreatment: "contrast-bw",
  },
};

/** Primary niche → theme → sequence pairings (proof set = these 5). */
const PRIMARY_NICHES: NicheDef[] = [
  {
    id: "ai-startup",
    title: "Lumen AI Pitch",
    brand: "Lumen AI",
    tagline: "Copilot for enterprise knowledge work",
    nicheLabel: "AI Startup",
    sequence: "pitch-deck",
    theme: THEMES["tech-minimalist"],
    photos: {
      cover: "modern ai startup office laptop holographic interface daylight",
      product: [
        "ai dashboard analytics ultrawide monitor clean ui",
        "machine learning engineer reviewing model charts",
        "close up neural network visualization screen",
      ],
      team: [
        "professional headshot asian woman ceo studio",
        "professional headshot black man cto studio",
        "professional headshot woman product lead studio",
      ],
      feature: [
        "saas knowledge base search ui",
        "ai chatbot conversation interface",
        "enterprise security compliance dashboard",
        "team collaboration software whiteboard",
      ],
      case: "executive presenting ai results boardroom",
    },
  },
  {
    id: "real-estate",
    title: "Harbor Homes Proposal",
    brand: "Harbor Homes",
    tagline: "Boutique brokerage for waterfront living",
    nicheLabel: "Real Estate Agency",
    sequence: "sales-proposal",
    theme: THEMES["corporate-finance"],
    photos: {
      cover: "luxury waterfront home exterior golden hour",
      product: [
        "modern living room staging luxury real estate",
        "kitchen island marble sunlight",
        "rooftop terrace city skyline evening",
      ],
      team: [
        "professional headshot realtor woman blazer",
        "professional headshot realtor man suit",
        "professional headshot property manager woman",
      ],
      feature: [
        "open house welcome desk modern foyer",
        "drone aerial suburban neighborhood",
        "signed contract keys on table",
        "luxury bathroom spa design",
      ],
      case: "happy couple receiving house keys agent",
    },
  },
  {
    id: "eco-fashion",
    title: "Verdant Market Plan",
    brand: "Verdant",
    tagline: "Traceable apparel for the climate-conscious",
    nicheLabel: "Eco-Fashion Brand",
    sequence: "marketing-plan",
    theme: THEMES["luxury-editorial"],
    photos: {
      cover: "sustainable fashion studio linen clothing racks warm light",
      product: [
        "organic cotton clothing flat lay editorial",
        "fashion model outdoor natural light eco brand",
        "textile workshop natural dyes hands",
      ],
      team: [
        "professional headshot creative director woman",
        "professional headshot designer man atelier",
        "professional headshot sustainability lead woman",
      ],
      feature: [
        "young professional shopping ethical fashion",
        "outdoor adventure apparel lifestyle",
        "urban creative wearing linen outfit",
        "family sustainable lifestyle home",
      ],
      case: "fashion runway sustainable materials",
    },
  },
  {
    id: "hr-consultancy",
    title: "Meridian People Report",
    brand: "Meridian People",
    tagline: "Talent systems for scaling organizations",
    nicheLabel: "HR Consultancy",
    sequence: "consulting-report",
    theme: THEMES["healthcare-clinical"],
    photos: {
      cover: "hr team workshop collaboration daylight office",
      product: [
        "people analytics dashboard laptop",
        "manager coaching employee meeting room",
        "diverse team standup agile office",
      ],
      team: [
        "professional headshot hr director woman",
        "professional headshot consultant man glasses",
        "professional headshot organizational psychologist woman",
      ],
      feature: [
        "hiring interview modern office glass",
        "employee engagement survey tablet",
        "leadership offsite whiteboard strategy",
        "onboarding welcome desk office",
      ],
      case: "executive handshake consulting firm",
    },
  },
  {
    id: "cybersecurity",
    title: "Aegis Secure Overview",
    brand: "Aegis Secure",
    tagline: "Zero-trust defense for critical infrastructure",
    nicheLabel: "Cybersecurity Firm",
    sequence: "company-overview",
    theme: THEMES["cyberpunk-gaming"],
    photos: {
      cover: "cybersecurity operations center blue neon screens",
      product: [
        "security operations dashboard dark ui",
        "network firewall rack datacenter purple light",
        "close up encryption key visualization",
      ],
      team: [
        "professional headshot security engineer woman",
        "professional headshot ethical hacker man",
        "professional headshot ciso executive woman",
      ],
      feature: [
        "threat detection heatmap screen",
        "pen tester laptop terminal code",
        "secure identity badge access control",
        "incident response war room",
      ],
      case: "security analyst monitoring alerts night",
    },
  },
];

/** Extra arsenal rows to approach ~50 when full batch runs (variants of themes/sequences). */
function expandArsenal(): NicheDef[] {
  const extras: NicheDef[] = [];
  const altThemes = [
    THEMES["brutalist-agency"],
    THEMES["tech-minimalist"],
    THEMES["luxury-editorial"],
    THEMES["corporate-finance"],
    THEMES["healthcare-clinical"],
  ];
  const altSequences = [
    "pitch-deck",
    "sales-proposal",
    "marketing-plan",
    "consulting-report",
    "company-overview",
  ];
  // Cross-product: each primary niche × alternate sequence
  PRIMARY_NICHES.forEach((base, ni) => {
    altSequences.forEach((seq, si) => {
      if (seq === base.sequence) return;
      const theme = altThemes[(ni + si) % altThemes.length];
      extras.push({
        ...base,
        id: base.id + "--" + seq,
        title: base.brand + " " + (getSequence(seq)?.label || seq),
        sequence: seq,
        theme,
      });
    });
  });
  // Theme remaps of primaries (same sequence, different world)
  PRIMARY_NICHES.forEach((base) => {
    altThemes.forEach((theme) => {
      if (theme.palette === base.theme.palette) return;
      extras.push({
        ...base,
        id: base.id + "--" + theme.palette,
        title: base.brand + " · " + theme.label,
        theme,
      });
    });
  });
  const seen = new Set<string>();
  const all = [...PRIMARY_NICHES, ...extras];
  const out: NicheDef[] = [];
  for (const row of all) {
    const slug = catalogId(row);
    if (seen.has(slug)) continue;
    seen.add(slug);
    out.push(row);
    if (out.length >= 50) break;
  }
  return out;
}

function nicheSlug(label: string): string {
  return String(label || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Website folder / catalog id: <niche>-<sequence>[, -<theme> when remapped]. */
function catalogId(n: NicheDef): string {
  const base = nicheSlug(n.nicheLabel) + "-" + n.sequence;
  const primary = PRIMARY_NICHES.find(
    (p) => nicheSlug(p.nicheLabel) === nicheSlug(n.nicheLabel) && p.sequence === n.sequence
  );
  if (primary && primary.theme.palette !== n.theme.palette) {
    return base + "-" + n.theme.palette;
  }
  // Cross-sequence rows already unique via sequence; theme remaps of those:
  if (!primary && n.id.includes("--") && !n.id.endsWith("--" + n.sequence)) {
    // theme remap of a cross-sequence variant — shouldn't happen with current expand
    return base + "-" + n.theme.palette;
  }
  return base;
}

function ensureDir(d: string) {
  fs.mkdirSync(d, { recursive: true });
}

function parseArgs() {
  const argv = process.argv.slice(2);
  let proof = false;
  let limit = 0;
  argv.forEach((a) => {
    if (a === "--proof") proof = true;
    const m = a.match(/^--limit=(\d+)$/);
    if (m) limit = Number(m[1]);
  });
  if (proof && !limit) limit = 5;
  return { proof, limit };
}

function buildSlides(n: NicheDef): any[] {
  const seq = n.sequence;
  if (seq === "pitch-deck") return slidesPitch(n);
  if (seq === "consulting-report") return slidesConsulting(n);
  if (seq === "sales-proposal") return slidesSales(n);
  if (seq === "marketing-plan") return slidesMarketing(n);
  if (seq === "company-overview") return slidesOverview(n);
  return slidesPitch(n);
}

function slidesPitch(n: NicheDef): any[] {
  return [
    {
      role: "cover",
      title: n.brand,
      caption: n.tagline,
      photoQuery: n.photos.cover,
      photoOrientation: "landscape",
    },
    {
      role: "comparison",
      title: "The status quo tax",
      headers: ["Before", "After"],
      before: [
        "Scattered tools and tribal knowledge",
        "Slow decisions from incomplete data",
        "Handoffs that drop context",
        "Reporting rebuilt every Monday",
      ],
      after: [
        "One system of record for the work",
        "Live signals for every decision",
        "Context that travels with the team",
        "Boards that update themselves",
      ],
    },
    {
      role: "feature",
      title: "What you get",
      body: [
        "Core platform — the daily operating surface",
        "Intelligence layer — recommendations that stick",
        "Integrations — meet teams where they work",
        "Governance — audit-ready by default",
      ],
      photoQueries: n.photos.feature,
      photoOrientations: ["landscape", "landscape", "landscape", "landscape"],
    },
    {
      role: "portfolio",
      title: "Product in the wild",
      body: ["Primary workspace", "Insight surface", "Mobile companion"],
      photoQueries: n.photos.product,
      photoOrientations: ["landscape", "landscape", "portrait"],
    },
    {
      role: "timeline",
      title: "90-day plan",
      caption: "Land, adopt, and prove value",
      steps: [
        { date: "Days 1–30", title: "Connect", body: "Integrate systems and stand up the first workspace" },
        { date: "Days 31–60", title: "Adopt", body: "Train champions and lock the weekly operating cadence" },
        { date: "Days 61–90", title: "Prove", body: "Publish KPI deltas for leadership review" },
        { date: "Day 90+", title: "Scale", body: "Expand seats and secondary workflows" },
      ],
    },
    {
      role: "stats",
      title: "Traction",
      caption: "Leading indicator — last 8 periods",
      stats: [{ value: "3.4×", label: "engagement lift" }],
      chart: {
        type: "line",
        labels: ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"],
        series: [{ name: "Index", values: [1.0, 1.2, 1.5, 1.8, 2.1, 2.5, 2.9, 3.4] }],
        showLegend: false,
      },
    },
    {
      role: "pricing",
      title: "Packages",
      caption: "Annual billing · cancel anytime in year one",
      tiers: [
        {
          name: "Starter",
          price: "$49",
          features: ["Core workspace", "Email support", "Up to 15 seats"],
        },
        {
          name: "Growth",
          price: "$149",
          popular: true,
          badge: "Most Popular",
          features: ["Intelligence layer", "SSO", "Priority support", "Up to 75 seats"],
        },
        {
          name: "Enterprise",
          price: "Custom",
          features: ["Dedicated CSM", "Custom SLA", "Data residency"],
        },
      ],
    },
    {
      role: "team",
      title: "Leadership",
      members: [
        { name: "Ava Kim", role: "CEO" },
        { name: "Jordan Lee", role: "CTO" },
        { name: "Sam Rivera", role: "VP Product" },
      ],
      photoQueries: n.photos.team,
      photoOrientations: ["portrait", "portrait", "portrait"],
    },
    {
      role: "closing",
      title: "Let's build what comes next",
      body: ["Book a 30-minute walkthrough", n.brand.toLowerCase().replace(/\s+/g, "") + ".io/demo"],
      caption: n.brand + " — " + n.nicheLabel,
    },
  ];
}

function slidesConsulting(n: NicheDef): any[] {
  return [
    {
      role: "cover",
      title: n.brand,
      caption: n.tagline + " — confidential",
      photoQuery: n.photos.cover,
      photoOrientation: "landscape",
    },
    {
      role: "report",
      title: "Agenda",
      body: [
        "Executive diagnosis and thesis",
        "Evidence and leading indicators",
        "Workstreams and investment case",
        "90-day actions and governance",
      ],
    },
    {
      role: "report",
      title: "Executive summary",
      caption: "KEY TAKEAWAY",
      takeaway: "Cut critical-path cycle time **30%** in four quarters with a funded system rebuild.",
      body: [
        "Stabilize the operating model with clear owners and weekly cadence.",
        "Rebuild the intake-to-delivery funnel with measurable stage SLAs.",
        "Fund enablement so managers can coach instead of firefight.",
      ],
    },
    {
      role: "report",
      title: "The productivity gap",
      caption: "Critical-path replacement cycle",
      body: [
        "Replacement cycles still average **94 days** from intake to productive ramp. " +
          "Span of control expanded after reorganization, diluting coaching capacity. " +
          "Recommendation: fund a twelve-month rebuild spanning velocity, enablement, and mobility.",
      ],
    },
    {
      role: "report",
      title: "Evidence snapshot",
      caption: "Composition of exits — trailing twelve months",
      chart: {
        type: "donut",
        labels: ["Regretted", "Non-regretted", "Restructure"],
        series: [{ name: "Exits", values: [42, 38, 20] }],
        holeSize: 55,
        showPercent: true,
        showLegend: true,
      },
    },
    {
      role: "report",
      title: "Workforce diagnosis",
      headers: ["Current State", "Regional Differences"],
      body: [
        "Engagement themes cluster around path ambiguity and uneven stretch assignments. " +
          "Compensation remains competitive for senior ICs while manager bands lag peers.",
        "NAM fills fastest but carries highest regretted attrition. " +
          "EMEA pay lags; APAC mobility improves once pathways are visible.",
      ],
    },
    {
      role: "report",
      title: "Priority workstreams",
      body: [
        "• Hiring system — weekly funnel reviews and stage SLAs",
        "• Manager enablement — span guardrails and coaching curriculum",
        "• Internal mobility — published pathways before external post",
        "• People analytics — clean job codes and monthly ELT review",
      ],
    },
    {
      role: "closing",
      title: "Decision requested",
      body: ["Approve the operating rebuild", "Confirm ELT monthly owners"],
      caption: n.brand + " — " + n.nicheLabel,
    },
  ];
}

function slidesSales(n: NicheDef): any[] {
  return [
    {
      role: "cover",
      title: n.brand,
      caption: n.tagline,
      photoQuery: n.photos.cover,
      photoOrientation: "landscape",
    },
    {
      role: "comparison",
      title: "Pain points we hear",
      headers: ["Before", "After"],
      before: [
        "Fragmented buyer journey",
        "Proposals that stall for weeks",
        "No shared view of value",
        "Handoffs that feel cold",
      ],
      after: [
        "One guided commercial motion",
        "Decisions in days, not weeks",
        "Proof points tied to outcomes",
        "Warm, consistent ownership",
      ],
    },
    {
      role: "feature",
      title: "How we solve it",
      body: [
        "Discovery that maps to outcomes",
        "Proof packs tailored to stakeholders",
        "Implementation with named owners",
        "Success reviews on a fixed cadence",
      ],
      photoQueries: n.photos.feature,
      photoOrientations: ["landscape", "landscape", "landscape", "landscape"],
    },
    {
      role: "testimonial",
      title: "Case study",
      body: [
        "“We cut cycle time in half and finally had one story the whole buying committee trusted.”",
      ],
      caption: "Director of Operations — peer account",
      photoQuery: n.photos.case,
      photoOrientation: "landscape",
    },
    {
      role: "pricing",
      title: "Investment options",
      caption: "Scoped to outcomes — transparent by design",
      tiers: [
        {
          name: "Pilot",
          price: "$8k",
          features: ["6-week engagement", "One workstream", "Weekly readout"],
        },
        {
          name: "Program",
          price: "$24k",
          popular: true,
          badge: "Most Popular",
          features: ["Quarter partnership", "Two workstreams", "Executive sponsor"],
        },
        {
          name: "Retainer",
          price: "Custom",
          features: ["Ongoing advisory", "Priority response", "Quarterly offsite"],
        },
      ],
    },
    {
      role: "closing",
      title: "Next steps",
      body: ["Confirm scope this week", "Kickoff within ten business days"],
      caption: n.brand + " — proposal",
    },
  ];
}

function slidesMarketing(n: NicheDef): any[] {
  return [
    {
      role: "cover",
      title: n.brand,
      caption: "Go-to-market plan — " + n.tagline,
      photoQuery: n.photos.cover,
      photoOrientation: "landscape",
    },
    {
      role: "report",
      title: "Executive summary",
      caption: "KEY TAKEAWAY",
      takeaway: "Win the category narrative and grow qualified demand **40%** in two quarters.",
      body: [
        "Concentrate spend on two high-intent channels with creative that proves craft.",
        "Instrument the funnel end-to-end so every dollar has a learning loop.",
        "Pair brand moments with always-on performance, not either/or.",
      ],
    },
    {
      role: "feature",
      title: "Audience personas",
      body: [
        "Primary buyer — values proof and peer validation",
        "Champion — needs easy internal storytelling",
        "Influencer — cares about craft and credibility",
        "Skeptic — wants risk removed with guarantees",
      ],
      photoQueries: n.photos.feature,
      photoOrientations: ["landscape", "landscape", "landscape", "landscape"],
    },
    {
      role: "timeline",
      title: "Strategy roadmap",
      caption: "Four moves that compound",
      steps: [
        { date: "Q1", title: "Position", body: "Sharpen the category story and proof library" },
        { date: "Q2", title: "Demand", body: "Scale the two winning channels with creative tests" },
        { date: "Q3", title: "Community", body: "Launch owned events and advocate program" },
        { date: "Q4", title: "Expand", body: "Enter adjacent segment with localized creative" },
      ],
    },
    {
      role: "stats",
      title: "KPIs",
      stats: [
        { value: "+40%", label: "qualified demand" },
        { value: "2.1×", label: "content lift" },
        { value: "28%", label: "CAC reduction" },
      ],
    },
    {
      role: "report",
      title: "Budget",
      caption: "Annual media & production mix",
      table: [
        ["Line", "Q1", "Q2", "Q3", "Q4"],
        ["Paid social", "120k", "140k", "160k", "150k"],
        ["Search", "80k", "90k", "95k", "100k"],
        ["Content & production", "60k", "70k", "85k", "75k"],
        ["Events", "40k", "55k", "70k", "50k"],
      ],
    },
  ];
}

function slidesOverview(n: NicheDef): any[] {
  return [
    {
      role: "cover",
      title: n.brand,
      caption: n.tagline,
      photoQuery: n.photos.cover,
      photoOrientation: "landscape",
    },
    {
      role: "problem",
      title: "We exist to make the hard path feel inevitable.",
      caption: "Mission",
    },
    {
      role: "timeline",
      title: "Our story",
      caption: "Milestones that shaped the company",
      steps: [
        { date: "2019", title: "Founded", body: "Started with a focused bet and a small team" },
        { date: "2021", title: "Product-market", body: "First enterprise logos and a repeatable motion" },
        { date: "2023", title: "Scale", body: "Expanded platforms and global coverage" },
        { date: "2026", title: "Category", body: "Recognised as a category leader" },
      ],
    },
    {
      role: "team",
      title: "Leadership",
      members: [
        { name: "Morgan Hale", role: "CEO" },
        { name: "Chris Nguyen", role: "CTO" },
        { name: "Riley Brooks", role: "COO" },
      ],
      photoQueries: n.photos.team,
      photoOrientations: ["portrait", "portrait", "portrait"],
    },
    {
      role: "portfolio",
      title: "What we ship",
      body: ["Flagship platform", "Insight layer", "Field toolkit"],
      photoQueries: n.photos.product,
      photoOrientations: ["landscape", "landscape", "portrait"],
    },
    {
      role: "testimonial",
      title: "Customers say",
      body: ["“They turned a chaotic stack into a system the whole company trusts.”"],
      caption: "VP Operations — flagship customer",
      photoQuery: n.photos.case,
      photoOrientation: "landscape",
    },
    {
      role: "closing",
      title: "Come build with us",
      body: ["Careers and partnerships", n.brand.toLowerCase().replace(/\s+/g, "") + ".com"],
      caption: n.brand + " — company overview",
    },
  ];
}

function outputFolder(n: NicheDef): string {
  return path.join(OUT_ROOT, catalogId(n));
}

async function writeGrid(outDir: string, files: string[], title: string) {
  const cols = Math.min(3, files.length);
  const rows = Math.ceil(files.length / cols);
  const thumbW = 420;
  const thumbH = 236;
  const pad = 16;
  const header = 48;
  const canvas = createCanvas(cols * (thumbW + pad) + pad, rows * (thumbH + pad) + pad + header);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0F172A";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#F8FAFC";
  ctx.font = "700 18px Segoe UI";
  ctx.fillText(title, pad, 30);
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
  }
  const gridPath = path.join(outDir, "grid-preview.png");
  fs.writeFileSync(gridPath, canvas.toBuffer("image/png"));
  return gridPath;
}

async function generateOne(n: NicheDef, index: number) {
  const seq = getSequence(n.sequence);
  if (!seq) throw new Error("Unknown sequence: " + n.sequence);
  const outDir = outputFolder(n);
  ensureDir(outDir);

  const density = n.sequence === "consulting-report" ? "report" : "keynote";
  const spec = {
    style: {
      palette: n.theme.palette,
      typePair: n.theme.typePair,
      imageTreatment: n.theme.imageTreatment,
      motif: "refined",
      typeTreatment: "solid",
      contentDensity: density,
      sequence: n.sequence,
    },
    slides: buildSlides(n),
  };

  // Align slide count to sequence beats
  const beats = seq.beats.length;
  if (spec.slides.length !== beats) {
    throw new Error(
      n.id + " slide count " + spec.slides.length + " != sequence beats " + beats + " (" + n.sequence + ")"
    );
  }

  const prepared = normalizeDeckSpec(spec);
  const seed = "slidexy-catalog|" + n.id + "|" + n.sequence + "|" + n.theme.palette;
  const selections = selectAll(prepared, seed);

  const gates = runGates(prepared, selections, tokens);
  if (!gates.pass) {
    console.warn("  gates FAIL", JSON.stringify(gates.slides.filter((s: any) => !s.pass).slice(0, 2)));
  }

  let deck = await renderDeckFromSpec(prepared, selections, {
    id: "catalog-" + n.id + "-" + n.sequence,
  });
  deck.name = n.title;

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
      outDir,
      "_slide-" + String(i + 1).padStart(2, "0") + "-" + String(layout.kitId || "slide").replace(/\//g, "-") + ".png"
    );
    renderSlidePng(deck, lid, file);
    pngFiles.push(file);
  }

  const coverPath = path.join(outDir, "cover-preview.png");
  fs.copyFileSync(pngFiles[0], coverPath);

  const gridPath = await writeGrid(
    outDir,
    pngFiles,
    n.title + " · " + n.theme.label + " · " + seq.label
  );

  const pptxPath = path.join(outDir, "deck.pptx");
  await exportDeckPptx(deck, pptxPath);

  // Remove intermediate per-slide PNGs to keep website folders clean
  pngFiles.forEach((f) => {
    try {
      fs.unlinkSync(f);
    } catch {
      /* ignore */
    }
  });

  const rel = (p: string) => path.relative(ROOT, p).replace(/\\/g, "/");
  const entry = {
    id: catalogId(n),
    title: n.title,
    category: n.sequence,
    categoryLabel: seq.label,
    niche: n.nicheLabel,
    theme: n.theme.label,
    themeId: n.theme.palette,
    slideCount: deck.layoutSequence.length,
    pptxPath: rel(pptxPath),
    coverPreviewPath: rel(coverPath),
    gridPreviewPath: rel(gridPath),
  };

  fs.writeFileSync(path.join(outDir, "meta.json"), JSON.stringify(entry, null, 2));
  console.log(
    "[" + (index + 1) + "] " + entry.id + " → " + entry.slideCount + " slides · " + n.theme.label
  );
  return entry;
}

async function main() {
  const { proof, limit } = parseArgs();
  ensureDir(OUT_ROOT);
  console.log("Schema gate…");
  assertEngineSchemas();
  console.log(
    "Sequences:",
    listSequences()
      .map((s: any) => s.id)
      .join(", ")
  );

  const arsenal = proof || limit ? PRIMARY_NICHES.slice(0, limit || 5) : expandArsenal();
  console.log("Generating", arsenal.length, proof ? "proof templates (1 per niche)" : "catalog templates");

  const catalog: any[] = [];
  for (let i = 0; i < arsenal.length; i++) {
    const entry = await generateOne(arsenal[i], i);
    catalog.push(entry);
  }

  const master = {
    generatedAt: new Date().toISOString(),
    count: catalog.length,
    sequences: listSequences().map((s: any) => ({ id: s.id, label: s.label, slides: s.beats.length })),
    templates: catalog,
  };
  const catalogPath = path.join(OUT_ROOT, "catalog.json");
  fs.writeFileSync(catalogPath, JSON.stringify(master, null, 2));

  console.log("\n=== SLIDEXY CATALOG READY ===");
  console.log("catalog.json:", catalogPath);
  console.log("templates:", catalog.length);
  catalog.forEach((t) => console.log(" -", t.id, "→", t.pptxPath));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
