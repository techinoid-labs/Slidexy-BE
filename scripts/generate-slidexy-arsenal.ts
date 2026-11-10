/**
 * Slidexy website arsenal — 10 niches × 5 variations = 50 templates.
 *
 *   node -r ts-node/register/transpile-only scripts/generate-slidexy-arsenal.ts
 *   node -r ts-node/register/transpile-only scripts/generate-slidexy-arsenal.ts --limit=5
 *
 * Outputs:
 *   out/slidexy-arsenal/<id>/deck.pptx
 *   out/slidexy-arsenal/<id>/cover-preview.png
 *   out/slidexy-arsenal/<id>/grid-preview.png
 *   out/slidexy-arsenal/catalog.json
 *   out/slidexy-arsenal/arsenal-covers-grid.png
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
const { normalizeDeckSpec } = require("../engine/content");
const { assertEngineSchemas } = require("../engine/validateSchema");
const { exportDeckPptx } = require("../services/templatePipeline/catalog");
const { renderSlidePng } = require("./slideSvg");
const { getSequence, listSequences } = require("../engine/sequences");

const ROOT = path.join(__dirname, "..");
const OUT_ROOT = path.join(ROOT, "out", "slidexy-arsenal");

type ThemePreset = {
  label: string;
  palette: string;
  typePair: string;
  imageTreatment: string;
};

type NichePhotos = {
  cover: string;
  product: string[];
  team: string[];
  feature: string[];
  case: string;
};

type NicheBase = {
  nicheKey: string;
  nicheLabel: string;
  brand: string;
  tagline: string;
  photos: NichePhotos;
  primarySequence: string;
  primaryTheme: string;
};

type ArsenalRow = {
  id: string;
  title: string;
  nicheKey: string;
  nicheLabel: string;
  brand: string;
  tagline: string;
  sequence: string;
  theme: ThemePreset;
  photos: NichePhotos;
  variation: number;
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
  "warm-editorial": {
    label: "Warm Editorial",
    palette: "ivory-warm",
    typePair: "luxury-playfair",
    imageTreatment: "sepia-duotone",
  },
};

const SEQ_SHORT: Record<string, string> = {
  "pitch-deck": "pitch",
  "sales-proposal": "sales",
  "marketing-plan": "marketing",
  "consulting-report": "consulting",
  "company-overview": "overview",
};

const ALL_SEQUENCES = [
  "pitch-deck",
  "sales-proposal",
  "marketing-plan",
  "consulting-report",
  "company-overview",
];

const THEME_ROTATION = [
  "tech-minimalist",
  "luxury-editorial",
  "corporate-finance",
  "healthcare-clinical",
  "cyberpunk-gaming",
  "brutalist-agency",
  "warm-editorial",
];

const NICHE_BASES: NicheBase[] = [
  {
    nicheKey: "ai-startup",
    nicheLabel: "AI Startup",
    brand: "Lumen AI",
    tagline: "Copilot for enterprise knowledge work",
    primarySequence: "pitch-deck",
    primaryTheme: "tech-minimalist",
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
    nicheKey: "eco-fashion",
    nicheLabel: "Eco-Fashion Brand",
    brand: "Verdant",
    tagline: "Traceable apparel for the climate-conscious",
    primarySequence: "marketing-plan",
    primaryTheme: "luxury-editorial",
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
    nicheKey: "b2b-saas",
    nicheLabel: "B2B SaaS Platform",
    brand: "Northline",
    tagline: "Revenue operations for modern GTM teams",
    primarySequence: "sales-proposal",
    primaryTheme: "tech-minimalist",
    photos: {
      cover: "saas product team reviewing dashboard modern office",
      product: [
        "crm analytics dashboard laptop clean ui",
        "sales pipeline kanban board screen",
        "customer success metrics chart ultrawide",
      ],
      team: [
        "professional headshot saas founder woman",
        "professional headshot vp sales man",
        "professional headshot product manager woman",
      ],
      feature: [
        "b2b sales call video conference",
        "integration marketplace software ui",
        "automation workflow builder interface",
        "enterprise onboarding checklist tablet",
      ],
      case: "sales team celebrating closed deal office",
    },
  },
  {
    nicheKey: "real-estate",
    nicheLabel: "Real Estate Agency",
    brand: "Harbor Homes",
    tagline: "Boutique brokerage for waterfront living",
    primarySequence: "company-overview",
    primaryTheme: "luxury-editorial",
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
    nicheKey: "cybersecurity",
    nicheLabel: "Cybersecurity Firm",
    brand: "Aegis Secure",
    tagline: "Zero-trust defense for critical infrastructure",
    primarySequence: "consulting-report",
    primaryTheme: "cyberpunk-gaming",
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
  {
    nicheKey: "healthcare-clinic",
    nicheLabel: "Healthcare Clinic",
    brand: "Brightpath Clinic",
    tagline: "Compassionate care with modern systems",
    primarySequence: "company-overview",
    primaryTheme: "healthcare-clinical",
    photos: {
      cover: "modern medical clinic reception warm daylight",
      product: [
        "doctor tablet patient chart consultation",
        "clean clinic exam room natural light",
        "nurse station digital health records",
      ],
      team: [
        "professional headshot female physician white coat",
        "professional headshot male pediatrician smiling",
        "professional headshot clinic administrator woman",
      ],
      feature: [
        "telehealth video consult laptop home",
        "patient check in kiosk lobby",
        "lab technician analyzing samples",
        "family in waiting room soft light",
      ],
      case: "doctor reassuring patient consultation room",
    },
  },
  {
    nicheKey: "creative-agency",
    nicheLabel: "Creative Design Agency",
    brand: "Offset Studio",
    tagline: "Brand systems that refuse to blend in",
    primarySequence: "pitch-deck",
    primaryTheme: "brutalist-agency",
    photos: {
      cover: "creative agency studio moodboard posters harsh light",
      product: [
        "brand identity mockups desk overhead",
        "designer working large monitor typography",
        "printed poster campaign collage wall",
      ],
      team: [
        "professional headshot art director woman tattoos",
        "professional headshot creative director man studio",
        "professional headshot strategist woman glasses",
      ],
      feature: [
        "client workshop sticky notes wall",
        "packaging design prototypes table",
        "photo shoot studio softbox",
        "website design wireframes laptop",
      ],
      case: "agency team reviewing campaign boards",
    },
  },
  {
    nicheKey: "fintech",
    nicheLabel: "Fintech Solution",
    brand: "Ledgerly",
    tagline: "Treasury clarity for growing companies",
    primarySequence: "sales-proposal",
    primaryTheme: "corporate-finance",
    photos: {
      cover: "fintech office glass skyline finance dashboard",
      product: [
        "treasury cashflow dashboard laptop",
        "payment rails network visualization screen",
        "expense analytics charts tablet",
      ],
      team: [
        "professional headshot fintech ceo woman",
        "professional headshot cfo man suit",
        "professional headshot product lead woman finance",
      ],
      feature: [
        "founder reviewing burn runway chart",
        "banking partnership handshake boardroom",
        "mobile banking app close up hands",
        "compliance audit documents desk",
      ],
      case: "cfo presenting quarterly results boardroom",
    },
  },
  {
    nicheKey: "hr-consultancy",
    nicheLabel: "HR Consultancy",
    brand: "Meridian People",
    tagline: "Talent systems for scaling organizations",
    primarySequence: "consulting-report",
    primaryTheme: "corporate-finance",
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
    nicheKey: "coffee-roastery",
    nicheLabel: "Coffee Roastery",
    brand: "Kiln & Cup",
    tagline: "Small-batch roast with a bigger story",
    primarySequence: "marketing-plan",
    primaryTheme: "warm-editorial",
    photos: {
      cover: "coffee roasting facility warm light beans",
      product: [
        "artisan coffee packaging bags flat lay",
        "barista pouring latte art cafe",
        "fresh roasted coffee beans close up",
      ],
      team: [
        "professional headshot roastmaster man apron",
        "professional headshot cafe owner woman smiling",
        "professional headshot brand manager woman",
      ],
      feature: [
        "specialty coffee shop interior morning",
        "farmers market coffee stall outdoor",
        "subscription box unboxing coffee",
        "cupping table coffee tasting",
      ],
      case: "customers enjoying coffee sunny cafe",
    },
  },
];

function seqLabel(sequenceId: string): string {
  const s = getSequence(sequenceId);
  return (s && s.label) || sequenceId;
}

function titleFor(brand: string, sequence: string): string {
  const map: Record<string, string> = {
    "pitch-deck": "Pitch Deck",
    "sales-proposal": "Sales Proposal",
    "marketing-plan": "Marketing Plan",
    "consulting-report": "Consulting Report",
    "company-overview": "Company Overview",
  };
  return brand + " " + (map[sequence] || seqLabel(sequence));
}

/** 5 variations per niche: primary + rotate all other sequences/themes evenly. */
function buildArsenalMatrix(): ArsenalRow[] {
  const rows: ArsenalRow[] = [];
  NICHE_BASES.forEach((base, nicheIndex) => {
    const otherSeqs = ALL_SEQUENCES.filter((s) => s !== base.primarySequence);
    const specs: Array<{ sequence: string; themeKey: string }> = [
      { sequence: base.primarySequence, themeKey: base.primaryTheme },
    ];
    for (let i = 0; i < 4; i++) {
      const sequence = otherSeqs[i % otherSeqs.length];
      // Walk the full theme ring so brutalist / warm / cyberpunk all get share
      let themeKey = THEME_ROTATION[(nicheIndex * 2 + i + 1) % THEME_ROTATION.length];
      if (themeKey === base.primaryTheme) {
        themeKey = THEME_ROTATION[(nicheIndex * 2 + i + 2) % THEME_ROTATION.length];
      }
      specs.push({ sequence, themeKey });
    }

    specs.forEach((spec, i) => {
      const variation = i + 1;
      const short = SEQ_SHORT[spec.sequence] || "deck";
      const id =
        base.nicheKey + "-" + short + "-" + String(variation).padStart(2, "0");
      rows.push({
        id,
        title: titleFor(base.brand, spec.sequence),
        nicheKey: base.nicheKey,
        nicheLabel: base.nicheLabel,
        brand: base.brand,
        tagline: base.tagline,
        sequence: spec.sequence,
        theme: THEMES[spec.themeKey],
        photos: base.photos,
        variation,
      });
    });
  });
  return rows;
}

function ensureDir(d: string) {
  fs.mkdirSync(d, { recursive: true });
}

function nicheAsCatalog(n: ArsenalRow): any {
  return {
    id: n.nicheKey,
    title: n.title,
    brand: n.brand,
    tagline: n.tagline,
    nicheLabel: n.nicheLabel,
    sequence: n.sequence,
    theme: n.theme,
    photos: n.photos,
  };
}

// --- Slide builders (mirrored from catalog generator) ---

function slidesPitch(n: any): any[] {
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
      title: "Where to play",
      headers: ["Quick wins", "Big bets", "Fill-ins", "Avoid"],
      body: [
        "Ship the workspace in 30 days with one champion team",
        "Rebuild the operating system for knowledge work",
        "Nice-to-have integrations that can wait a quarter",
        "Custom one-offs that don't compound",
      ],
    },
    {
      role: "feature",
      title: "What you get",
      body: [
        "Unified search across every system of record",
        "Copilot answers grounded in your permissions",
        "Adoption analytics your ops team can trust",
      ],
      photoQuery: n.photos.feature[0],
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
        { date: "Days 1–20", title: "Connect", body: "Integrate systems and stand up the first workspace" },
        { date: "Days 21–40", title: "Adopt", body: "Train champions and lock the weekly operating cadence" },
        { date: "Days 41–60", title: "Prove", body: "Publish KPI deltas for leadership review" },
        { date: "Days 61–80", title: "Expand", body: "Roll out secondary workflows and new teams" },
        { date: "Day 80+", title: "Scale", body: "Lock the operating rhythm and renew" },
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
        { name: "Starter", price: "$49", features: ["Core workspace", "Email support", "Up to 15 seats"] },
        {
          name: "Growth",
          price: "$149",
          popular: true,
          badge: "Most Popular",
          features: ["Intelligence layer", "SSO", "Priority support", "Up to 75 seats"],
        },
        { name: "Enterprise", price: "Custom", features: ["Dedicated CSM", "Custom SLA", "Data residency"] },
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
      photoQuery: n.photos.case,
      photoOrientation: "landscape",
    },
  ];
}

function slidesConsulting(n: any): any[] {
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
      takeaway:
        "Replacement cycles still average **94 days** from intake to productive ramp — span of control expanded after reorganization, diluting coaching capacity.",
      body: ["Fund a twelve-month rebuild spanning velocity, enablement, and mobility."],
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
        "Engagement themes cluster around path ambiguity and uneven stretch assignments. Compensation remains competitive for senior ICs while manager bands lag peers.",
        "NAM fills fastest but carries highest regretted attrition. EMEA pay lags; APAC mobility improves once pathways are visible.",
      ],
    },
    {
      role: "report",
      title: "Priority workstreams",
      caption: "90-day actions",
      takeaway:
        "Four workstreams — hiring system, manager enablement, internal mobility, and people analytics — must move in parallel with named ELT owners.",
      body: [
        "Weekly funnel reviews and stage SLAs · span guardrails and coaching curriculum · published pathways before external post · monthly ELT review",
      ],
    },
    {
      role: "closing",
      title: "Decision requested",
      body: ["Approve the operating rebuild", "Confirm ELT monthly owners"],
      caption: n.brand + " — " + n.nicheLabel,
      photoQuery: n.photos.case,
      photoOrientation: "landscape",
    },
  ];
}

function slidesSales(n: any): any[] {
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
      title: "Effort vs impact",
      headers: ["Quick wins", "Strategic bets", "Maintenance", "Distractions"],
      body: [
        "Fix the proposal template and stage gates",
        "Rebuild the full commercial engine",
        "Keep CRM hygiene and weekly reviews",
        "One-off custom decks that don't scale",
      ],
    },
    {
      role: "feature",
      title: "How we solve it",
      body: [
        "Discovery that maps to outcomes",
        "A single narrative the buying committee trusts",
        "Enablement that sticks after kickoff",
      ],
      photoQuery: n.photos.feature[0],
      photoQueries: n.photos.feature,
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
      caption: "Scoped engagements with clear outcomes",
      tiers: [
        { name: "Pilot", price: "$8k", features: ["6-week engagement", "One workstream", "Weekly readout"] },
        {
          name: "Program",
          price: "$24k",
          popular: true,
          badge: "Most Popular",
          features: ["Quarter partnership", "Two workstreams", "Executive sponsor"],
        },
        { name: "Retainer", price: "Custom", features: ["Ongoing advisory", "Priority response", "Quarterly offsite"] },
      ],
    },
    {
      role: "closing",
      title: "Next steps",
      body: ["Confirm scope this week", "Kickoff within ten business days"],
      caption: n.brand + " — proposal",
      photoQuery: n.photos.feature[1] || n.photos.cover,
      photoOrientation: "landscape",
    },
  ];
}

function slidesMarketing(n: any): any[] {
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
      ],
      photoQuery: n.photos.feature[0],
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
        { date: "Q4+", title: "Compound", body: "Reinvest winners and cut lagging bets" },
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

function slidesOverview(n: any): any[] {
  return [
    {
      role: "cover",
      title: n.brand,
      caption: n.tagline,
      photoQuery: n.photos.cover,
      photoOrientation: "landscape",
    },
    {
      role: "feature",
      title: "We exist to make the hard path feel inevitable.",
      body: [
        "Mission — remove friction from critical work",
        "Belief — systems beat heroics",
        "Promise — clarity in every handoff",
      ],
      photoQuery: n.photos.cover,
      photoQueries: n.photos.feature,
    },
    {
      role: "timeline",
      title: "Our story",
      caption: "Milestones that shaped the company",
      steps: [
        { date: "2019", title: "Founded", body: "Started with a focused bet and a small team" },
        { date: "2021", title: "Product-market", body: "First enterprise logos and a repeatable motion" },
        { date: "2023", title: "Scale", body: "Expanded platforms and global coverage" },
        { date: "2025", title: "Platform", body: "Unified data layer across products" },
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
      photoQuery: n.photos.feature[0] || n.photos.cover,
      photoOrientation: "landscape",
    },
  ];
}

function buildSlides(n: ArsenalRow): any[] {
  const cat = nicheAsCatalog(n);
  if (n.sequence === "pitch-deck") return slidesPitch(cat);
  if (n.sequence === "consulting-report") return slidesConsulting(cat);
  if (n.sequence === "sales-proposal") return slidesSales(cat);
  if (n.sequence === "marketing-plan") return slidesMarketing(cat);
  if (n.sequence === "company-overview") return slidesOverview(cat);
  return slidesPitch(cat);
}

const COVER_VARIANTS = [
  "editorial-overlap",
  "band-horizon",
  "bottom-slab",
  "right-bleed",
  "circle-hero",
  "type-wall",
  "brutalist",
];

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

async function writeArsenalCoverGrid(covers: string[], outPath: string) {
  const cols = 10;
  const rows = Math.ceil(covers.length / cols);
  const thumbW = 320;
  const thumbH = 180;
  const pad = 10;
  const header = 56;
  const canvas = createCanvas(cols * (thumbW + pad) + pad, rows * (thumbH + pad) + pad + header);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0B1220";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#F8FAFC";
  ctx.font = "700 22px Segoe UI";
  ctx.fillText("Slidexy Arsenal — " + covers.length + " cover thumbnails", pad, 36);
  for (let i = 0; i < covers.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col * (thumbW + pad);
    const y = header + pad + row * (thumbH + pad);
    try {
      const img = await loadImage(covers[i]);
      ctx.drawImage(img, x, y, thumbW, thumbH);
    } catch {
      ctx.fillStyle = "#1E293B";
      ctx.fillRect(x, y, thumbW, thumbH);
    }
  }
  fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
  return outPath;
}

async function generateOne(n: ArsenalRow, index: number) {
  const seq = getSequence(n.sequence);
  if (!seq) throw new Error("Unknown sequence: " + n.sequence);
  const outDir = path.join(OUT_ROOT, n.id);
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

  if (spec.slides.length !== seq.beats.length) {
    throw new Error(
      n.id + " slide count " + spec.slides.length + " != sequence beats " + seq.beats.length
    );
  }

  const prepared = normalizeDeckSpec(spec);
  const seed = "slidexy-arsenal|" + n.id + "|" + n.theme.palette;
  const selections = selectAll(prepared, seed);

  const coverVariant = COVER_VARIANTS[index % COVER_VARIANTS.length];
  if (selections[0] && selections[0].role === "cover") {
    selections[0].variant = coverVariant;
    if (prepared.slides[0]) (prepared.slides[0] as any).variantHint = coverVariant;
  }

  const gates = runGates(prepared, selections, tokens);
  if (!gates.pass) {
    console.warn(
      "  gates FAIL",
      JSON.stringify(gates.slides.filter((s: any) => !s.pass).slice(0, 1))
    );
  }

  let deck = await renderDeckFromSpec(prepared, selections, {
    id: "arsenal-" + n.id,
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
      "_slide-" +
        String(i + 1).padStart(2, "0") +
        "-" +
        String(layout.kitId || "slide").replace(/\//g, "-") +
        ".png"
    );
    renderSlidePng(deck, lid, file);
    pngFiles.push(file);
  }

  const coverPath = path.join(outDir, "cover-preview.png");
  fs.copyFileSync(pngFiles[0], coverPath);
  await writeGrid(outDir, pngFiles, n.title + " · " + n.theme.label + " · " + seq.label);
  const pptxPath = path.join(outDir, "deck.pptx");
  await exportDeckPptx(deck, pptxPath);

  pngFiles.forEach((f) => {
    try {
      fs.unlinkSync(f);
    } catch {
      /* ignore */
    }
  });

  const entry = {
    id: n.id,
    title: n.title,
    niche: n.nicheLabel,
    category: seq.label,
    theme: n.theme.label,
    slideCount: deck.layoutSequence.length,
    coverImage: n.id + "/cover-preview.png",
    gridImage: n.id + "/grid-preview.png",
    pptxFile: n.id + "/deck.pptx",
  };

  fs.writeFileSync(path.join(outDir, "meta.json"), JSON.stringify(entry, null, 2));
  console.log(
    "[" +
      String(index + 1).padStart(2, "0") +
      "/50] " +
      entry.id +
      " → " +
      entry.slideCount +
      " slides · " +
      entry.theme
  );
  return { entry, coverPath };
}

function parseArgs() {
  const argv = process.argv.slice(2);
  let limit = 0;
  argv.forEach((a) => {
    const m = a.match(/^--limit=(\d+)$/);
    if (m) limit = Number(m[1]);
  });
  return { limit };
}

async function main() {
  const { limit } = parseArgs();
  ensureDir(OUT_ROOT);
  console.log("Schema gate…");
  assertEngineSchemas();
  console.log(
    "Sequences:",
    listSequences()
      .map((s: any) => s.id)
      .join(", ")
  );

  let matrix = buildArsenalMatrix();
  if (matrix.length !== 50) {
    throw new Error("Expected 50 arsenal rows, got " + matrix.length);
  }
  if (limit > 0) matrix = matrix.slice(0, limit);

  console.log("Generating", matrix.length, "arsenal templates →", OUT_ROOT);

  const catalog: any[] = [];
  const covers: string[] = [];
  for (let i = 0; i < matrix.length; i++) {
    const { entry, coverPath } = await generateOne(matrix[i], i);
    catalog.push(entry);
    covers.push(coverPath);
  }

  const catalogPath = path.join(OUT_ROOT, "catalog.json");
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));

  const megaPath = path.join(OUT_ROOT, "arsenal-covers-grid.png");
  await writeArsenalCoverGrid(covers, megaPath);

  console.log("\n=== SLIDEXY ARSENAL READY ===");
  console.log("templates:", catalog.length);
  console.log("catalog.json:", catalogPath);
  console.log("covers grid:", megaPath);
  const niches = Array.from(new Set(catalog.map((c) => c.niche)));
  console.log("niches:", niches.length, niches.join(", "));
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
