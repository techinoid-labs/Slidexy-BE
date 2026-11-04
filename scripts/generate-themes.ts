/**
 * Generate the six catalog theme decks without LLM (hand DeckSpecs + renderer).
 * node -r ts-node/register/transpile-only scripts/generate-themes.ts
 */
const fs = require("fs");
const path = require("path");

require("ts-node/register/transpile-only");
require("../services/templatePipeline/fonts");

const { selectAll } = require("../engine/selectVariant");
const { runGates } = require("../engine/gates");
const { renderDeckFromSpec, tokens } = require("../engine/render");
const { renderSlidePng } = require("./slideSvg");
const { exportDeckPptx } = require("../services/templatePipeline/catalog");

const ROOT = path.join(__dirname, "..");

type Theme = {
  id: string;
  name: string;
  deckType: "Pitch" | "Overview";
  spec: any;
};

const themes: Theme[] = [
  {
    id: "ember-night-gaming-lounge",
    name: "Ember Night — Gaming Lounge",
    deckType: "Pitch",
    spec: {
      style: {
        palette: "charcoal-ember",
        typePair: "slab-rockwell",
        imageTreatment: "tint",
        motif: "bar-accent",
      },
      slides: [
        {
          role: "cover",
          title: "Nexus Lounge",
          caption: "Play. Compete. Belong.",
          photoQuery: "neon gaming lounge interior night",
          photoOrientation: "landscape",
        },
        {
          role: "problem",
          title: "Scattered sessions",
          body: ["No home base", "Weak community"],
          photoQuery: "lonely gamer at home desk night",
          photoOrientation: "landscape",
        },
        {
          role: "solution",
          title: "One arena",
          body: ["Pro rigs", "Shared nights"],
          photoQuery: "esports arena with RGB PCs",
          photoOrientation: "landscape",
        },
        {
          role: "how-it-works",
          title: "Your night",
          body: ["Book", "Play", "Meet"],
          photoQuery: "friends gaming together lounge",
          photoOrientation: "landscape",
        },
        {
          role: "feature",
          title: "PC Arena",
          body: ["Top tier rigs", "High refresh", "Ergo chairs", "Private booths"],
          photoQueries: [
            "gaming pc tower rgb fans",
            "ultrawide gaming monitor desk",
            "gaming chair close up",
            "private booth pc gaming lounge",
          ],
          photoQuery: "gaming pc tower rgb fans",
          photoOrientation: "landscape",
        },
        {
          role: "stats",
          title: "Impact",
          stats: [
            { value: "120+", label: "active PCs" },
            { value: "24", label: "weekly events" },
            { value: "4.9", label: "member rating" },
          ],
        },
        {
          role: "testimonial",
          title: "Players say",
          body: ["This is where our crew actually meets"],
          caption: "Maya R., captain",
          photoQuery: "smiling gamer with headset portrait",
          photoOrientation: "portrait",
        },
        {
          role: "team",
          title: "Floor crew",
          members: [
            { name: "Alex Kim", role: "Manager" },
            { name: "Samira Khan", role: "Community" },
            { name: "Ben Carter", role: "Tech" },
          ],
          photoQueries: [
            "gaming lounge manager headshot portrait person",
            "community host headset headshot portrait person",
            "tech staff professional headshot portrait person",
          ],
          photoQuery: "gaming lounge staff headshot portrait person",
          photoOrientation: "portrait",
        },
        {
          role: "closing",
          title: "Level up here",
          body: ["Open late", "nexus.example"],
          photoQuery: "gaming lounge neon entrance night",
          photoOrientation: "landscape",
        },
      ],
    },
  },
  {
    id: "ember-night-performance-garage",
    name: "Ember Night — Performance Garage",
    deckType: "Pitch",
    spec: {
      style: {
        palette: "charcoal-ember",
        typePair: "slab-rockwell",
        imageTreatment: "tint",
        motif: "brush-stroke",
      },
      slides: [
        {
          role: "cover",
          title: "Apex Garage",
          caption: "Performance culture",
          photoQuery: "supercar garage night dramatic lighting",
          photoOrientation: "landscape",
        },
        {
          role: "problem",
          title: "Generic dealers",
          body: ["No brand soul", "Cold showrooms"],
          photoQuery: "empty sterile car dealership",
          photoOrientation: "landscape",
        },
        {
          role: "solution",
          title: "Member pits",
          body: ["Private bays", "Curated nights"],
          photoQuery: "luxury car workshop leather lounge",
          photoOrientation: "landscape",
        },
        {
          role: "how-it-works",
          title: "Three moves",
          body: ["Scout", "Stage", "Host"],
          photoQuery: "mechanic detailing red supercar",
          photoOrientation: "landscape",
        },
        {
          role: "feature",
          title: "The pit",
          body: ["Private bays", "Tool wall", "Late hours", "Detail desk"],
          photoQueries: [
            "private garage bay supercar",
            "tool wall luxury garage",
            "night garage bay lights",
            "car detailing desk microfiber",
          ],
          photoQuery: "private garage bay supercar",
          photoOrientation: "landscape",
        },
        {
          role: "stats",
          variantHint: "c",
          title: "Proof",
          stats: [
            { value: "40%", label: "repeat bookings" },
            { value: "12", label: "member nights" },
            { value: "3.2x", label: "referral lift" },
          ],
        },
        {
          role: "testimonial",
          title: "Owners",
          body: ["They rebuilt how we show cars"],
          caption: "A. Rivera, founder",
          photoQuery: "confident founder portrait garage",
          photoOrientation: "portrait",
        },
        {
          role: "team",
          title: "Crew",
          members: [
            { name: "A. Rivera", role: "Founder" },
            { name: "J. Cole", role: "Curator" },
            { name: "M. Park", role: "Host" },
          ],
          photoQuery: "team in luxury garage",
          photoOrientation: "landscape",
        },
        {
          role: "closing",
          title: "Book a bay",
          body: ["hello@apex.example"],
          photoQuery: "garage doors open night supercar",
          photoOrientation: "landscape",
        },
      ],
    },
  },
  {
    id: "paper-ops-b2b-saas",
    name: "Paper Ops — B2B SaaS Pitch",
    deckType: "Pitch",
    spec: {
      style: {
        palette: "paper-blue",
        typePair: "corp-calibri",
        imageTreatment: "full-bleed",
        motif: "bar-accent",
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
          title: "Rollout",
          body: ["Connect HRIS", "Map rules", "Run payroll"],
          photoQuery: "office hallway coworkers walking",
          photoOrientation: "landscape",
        },
        {
          role: "feature",
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
    },
  },
  {
    id: "clinic-warm-pediatric",
    name: "Clinic Warm — Pediatric Overview",
    deckType: "Overview",
    spec: {
      style: {
        palette: "ivory-warm",
        typePair: "editorial-cambria",
        imageTreatment: "full-bleed",
        motif: "dot-cluster",
      },
      slides: [
        {
          role: "cover",
          title: "Little Smiles",
          caption: "Pediatric dental care",
          photoQuery: "bright pediatric dental clinic children",
          photoOrientation: "landscape",
        },
        {
          role: "problem",
          title: "Clinic anxiety",
          body: ["Harsh lights", "Rushed visits"],
          photoQuery: "anxious child waiting room soft light",
          photoOrientation: "landscape",
        },
        {
          role: "feature",
          title: "Gentle care",
          body: ["Play check-in", "Quiet rooms", "Parent notes", "Soft tools"],
          photoQueries: [
            "pediatric dental play area",
            "quiet dental exam room warm",
            "parent reading with child clinic",
            "friendly dentist tools soft colors",
          ],
          photoQuery: "pediatric dental play area",
          photoOrientation: "landscape",
        },
        {
          role: "how-it-works",
          title: "Visit flow",
          body: ["Welcome", "Exam", "Plan"],
          photoQuery: "dentist talking kindly to child",
          photoOrientation: "landscape",
        },
        {
          role: "team",
          title: "Clinicians",
          members: [
            { name: "Dr. Lee", role: "Lead" },
            { name: "Sam Ortiz", role: "Hygienist" },
            { name: "Mia Chen", role: "Care lead" },
          ],
          photoQueries: [
            "friendly dentist headshot portrait soft light person",
            "dental hygienist professional headshot portrait person",
            "clinic care lead headshot portrait soft light person",
          ],
          photoQuery: "friendly dentist headshot portrait soft light person",
          photoOrientation: "portrait",
        },
        {
          role: "stats",
          title: "Trust",
          stats: [
            { value: "4.9", label: "family rating" },
            { value: "2k+", label: "visits yearly" },
            { value: "98%", label: "return rate" },
          ],
        },
        {
          role: "testimonial",
          title: "Parents",
          body: ["My kids ask to come back"],
          caption: "J. Morgan",
          photoQuery: "parent and child smiling clinic",
          photoOrientation: "landscape",
        },
        {
          role: "closing",
          title: "Visit us",
          body: ["Mon–Sat", "hello@littlesmiles.example"],
          photoQuery: "clinic reception warm light",
          photoOrientation: "landscape",
        },
      ],
    },
  },
  {
    id: "ink-signal-startup",
    name: "Ink Signal — Startup Pitch",
    deckType: "Pitch",
    spec: {
      style: {
        palette: "ink-night",
        typePair: "display-trebuchet",
        imageTreatment: "tint",
        motif: "bar-accent",
      },
      slides: [
        {
          role: "cover",
          title: "Signalflow",
          caption: "Automation that ships",
          photoQuery: "startup office night city lights",
          photoOrientation: "landscape",
        },
        {
          role: "problem",
          title: "Busywork wins",
          body: ["Tool sprawl", "Missed handoffs"],
          photoQuery: "overwhelmed founder laptop night",
          photoOrientation: "landscape",
        },
        {
          role: "solution",
          title: "One workflow graph",
          body: ["Triggers", "Guards", "Actions"],
          photoQuery: "product team whiteboard night office",
          photoOrientation: "landscape",
        },
        {
          role: "how-it-works",
          title: "Ship in a week",
          body: ["Map", "Automate", "Measure"],
          photoQuery: "engineers collaborating dual monitors",
          photoOrientation: "landscape",
        },
        {
          role: "feature",
          title: "Stack",
          body: ["Connectors", "Approvals", "Replay", "Alerts"],
          photoQueries: [
            "developer pair programming office",
            "standup meeting startup team",
            "laptop code close up hands",
            "modern coworking space night",
          ],
          photoQuery: "developer pair programming office",
          photoOrientation: "landscape",
        },
        {
          role: "stats",
          variantHint: "c",
          title: "Traction",
          stats: [
            { value: "8x", label: "faster handoffs" },
            { value: "40", label: "design partners" },
            { value: "12m", label: "seed raised" },
          ],
        },
        {
          role: "testimonial",
          title: "Operators",
          body: ["We deleted three internal tools"],
          caption: "Head of Ops, Series A",
          photoQuery: "confident startup operator portrait",
          photoOrientation: "portrait",
        },
        {
          role: "team",
          title: "Founders",
          members: [
            { name: "Rae Quinn", role: "CEO" },
            { name: "Tom Hale", role: "CTO" },
            { name: "Ira Bell", role: "Design" },
          ],
          photoQuery: "startup founding team portrait office",
          photoOrientation: "landscape",
        },
        {
          role: "closing",
          title: "Automate the boring",
          body: ["Join the waitlist", "hi@signalflow.example"],
          photoQuery: "city skyline night from office window",
          photoOrientation: "landscape",
        },
      ],
    },
  },
  {
    id: "mist-studio-agency",
    name: "Mist Studio — Agency Overview",
    deckType: "Overview",
    spec: {
      style: {
        palette: "mist-teal",
        typePair: "modern-segoe",
        imageTreatment: "full-bleed",
        motif: "brush-stroke",
      },
      slides: [
        {
          role: "cover",
          title: "Mist Studio",
          caption: "Brand, campaigns, craft",
          photoQuery: "bright design studio with moodboards",
          photoOrientation: "landscape",
        },
        {
          role: "problem",
          title: "Scattered craft",
          body: ["Inconsistent brand", "Slow reviews"],
          photoQuery: "cluttered creative desk papers",
          photoOrientation: "landscape",
        },
        {
          role: "feature",
          title: "What we make",
          body: ["Identity", "Campaigns", "Motion", "Web"],
          photoQueries: [
            "brand identity print samples desk",
            "photo shoot campaign studio lights",
            "motion designer at computer studio",
            "web design mockups on desk",
          ],
          photoQuery: "brand identity print samples desk",
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
          role: "stats",
          title: "Outcomes",
          stats: [
            { value: "60+", label: "brands" },
            { value: "4.8", label: "client NPS" },
            { value: "3wk", label: "avg sprint" },
          ],
        },
        {
          role: "testimonial",
          title: "Clients",
          body: ["They made our brand feel inevitable"],
          caption: "CMO, consumer brand",
          photoQuery: "smiling creative professional portrait",
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
    },
  },
];

async function buildOne(theme: Theme) {
  const outDir = path.join(ROOT, "out", "themes", theme.id);
  fs.mkdirSync(outDir, { recursive: true });
  const seed = theme.name + "|" + theme.spec.style.palette + "|" + theme.spec.style.typePair;
  const selections = selectAll(theme.spec, seed);
  // honor variantHint c for stats
  theme.spec.slides.forEach((slide: any, i: number) => {
    if (slide.variantHint) selections[i] = { role: slide.role, variant: slide.variantHint };
  });
  const gates = runGates(theme.spec, selections, tokens, theme.deckType);
  const deck = await renderDeckFromSpec(theme.spec, selections, { id: theme.id });
  deck.name = theme.name;
  deck.description = theme.name;
  if (deck.engine) deck.engine.themeName = theme.name;

  fs.writeFileSync(path.join(outDir, "deckspec.json"), JSON.stringify(theme.spec, null, 2));
  fs.writeFileSync(path.join(outDir, "deck.json"), JSON.stringify(deck, null, 2));
  fs.writeFileSync(path.join(outDir, "gates.json"), JSON.stringify(gates, null, 2));
  deck.layoutSequence.forEach((layoutId: string, index: number) => {
    renderSlidePng(
      deck,
      layoutId,
      path.join(outDir, "slide-" + String(index + 1).padStart(2, "0") + ".png")
    );
  });
  await exportDeckPptx(deck, path.join(outDir, "deck.pptx"));

  const pubDir = path.join(ROOT, "app-library", "published", theme.id);
  fs.mkdirSync(pubDir, { recursive: true });
  fs.writeFileSync(path.join(pubDir, "deck.json"), JSON.stringify(deck, null, 2));
  fs.writeFileSync(path.join(pubDir, "deckspec.json"), JSON.stringify(theme.spec, null, 2));
  fs.writeFileSync(path.join(ROOT, "app-library", "published", theme.id + ".json"), JSON.stringify(deck, null, 2));
  fs.readdirSync(outDir)
    .filter((n: string) => /^slide-\d{2}\.png$/.test(n) || n.endsWith(".pptx"))
    .forEach((n: string) => fs.copyFileSync(path.join(outDir, n), path.join(pubDir, n)));

  return {
    id: theme.id,
    name: theme.name,
    gates: gates.pass,
    style: theme.spec.style,
    slides: deck.layoutSequence.length,
    selections: selections.map((s: any) => s.role + "/" + s.variant),
  };
}

async function main() {
  const only = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const selected = only.length
    ? themes.filter((t) => only.some((id) => t.id === id || t.id.includes(id)))
    : themes;
  if (!selected.length) {
    console.error("No themes matched", only.join(", "));
    process.exit(1);
  }
  const summary = [];
  for (const theme of selected) {
    console.log("===", theme.id);
    try {
      const row = await buildOne(theme);
      summary.push(row);
      console.log("ok", row.id, "gates", row.gates, row.style.palette, row.style.typePair);
    } catch (err) {
      console.error("FAIL", theme.id, (err as Error).message);
      summary.push({ id: theme.id, name: theme.name, error: (err as Error).message });
    }
  }
  const out = path.join(ROOT, "out", "themes", "summary.json");
  if (!only.length) {
    fs.writeFileSync(out, JSON.stringify(summary, null, 2));
    console.log("wrote", out);
  } else {
    console.log("partial run", JSON.stringify(summary, null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
