/**
 * Batch catalog generation — 5 niches × 10 slides with full motion suite.
 * node -r ts-node/register/transpile-only scripts/generate-catalog-batch.ts
 *
 * Outputs: out/catalog/<niche>/deck.pptx, slide-*.png, preview-grid.png
 *          out/catalog/catalog-index.json, out/catalog/index.html
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
const { exportDeckPptx } = require("../services/templatePipeline/catalog");
const { renderSlidePng } = require("./slideSvg");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "out", "catalog");

type Niche = {
  id: string;
  name: string;
  theme: string;
  deckType: "Pitch" | "Overview";
  motion: {
    morph?: boolean;
    ambient?: boolean;
    cameraPan?: boolean;
    scatter?: boolean;
    parallaxScale?: number;
  };
  spec: any;
};

const niches: Niche[] = [
  {
    id: "b2b-saas-corporate",
    name: "LedgerFlow — B2B SaaS",
    theme: "Corporate",
    deckType: "Pitch",
    motion: { morph: true, ambient: true, cameraPan: true, scatter: false, parallaxScale: 1.22 },
    spec: {
      style: {
        palette: "paper-blue",
        typePair: "corp-calibri",
        imageTreatment: "full-bleed",
        motif: "bar-accent",
        typeTreatment: "solid",
      },
      slides: [
        {
          role: "cover",
          title: "LedgerFlow",
          caption: "EU payroll, done right",
          photoQuery: "modern office desks people working daylight",
          photoOrientation: "landscape",
          transition: "fade",
        },
        {
          role: "agenda",
          title: "Today",
          body: ["Problem", "Product", "Proof", "Plan"],
          transition: "push",
        },
        {
          role: "problem",
          title: "Compliance drag",
          body: ["Manual packs", "Late filings", "Audit panic"],
          photoQuery: "messy desk papers office stress",
          photoOrientation: "landscape",
          transition: "push",
        },
        {
          role: "solution",
          title: "One control plane",
          body: ["Country packs", "Audit trails", "Live approvals"],
          photoQuery: "team collaborating at whiteboard office",
          photoOrientation: "landscape",
          transition: "wipe",
        },
        {
          role: "how-it-works",
          variantHint: "dashboard",
          title: "Rollout",
          body: ["Connect HRIS", "Map rules", "Run payroll"],
          photoQuery: "office hallway coworkers walking",
          photoOrientation: "landscape",
          transition: "fade",
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
          transition: "fade",
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
          transition: "wipe",
        },
        {
          role: "testimonial",
          title: "Finance leads",
          body: ["We closed month-end two days earlier"],
          caption: "CFO, mid-market SaaS",
          photoQuery: "smiling business professional portrait office",
          photoOrientation: "portrait",
          transition: "fade",
        },
        {
          role: "team",
          title: "Builders",
          members: [
            { name: "Nora Hale", role: "CEO" },
            { name: "Ivo Novak", role: "Product" },
            { name: "Lea Ortiz", role: "Compliance" },
          ],
          photoQueries: [
            "ceo woman professional headshot portrait",
            "product manager headshot portrait office",
            "compliance officer professional headshot portrait",
          ],
          photoQuery: "product team meeting modern office",
          photoOrientation: "portrait",
          transition: "fade",
        },
        {
          role: "closing",
          title: "Run payroll calm",
          body: ["Book a demo", "hello@ledgerflow.example"],
          photoQuery: "handshake in bright office",
          photoOrientation: "landscape",
          transition: "fade",
        },
      ],
    },
  },
  {
    id: "luxury-real-estate-editorial",
    name: "Atelier Estates — Luxury Real Estate",
    theme: "Editorial",
    deckType: "Pitch",
    motion: { morph: true, ambient: true, cameraPan: true, scatter: false, parallaxScale: 1.24 },
    spec: {
      style: {
        palette: "slate-light",
        typePair: "classic-georgia",
        imageTreatment: "full-bleed",
        motif: "bar-accent",
        typeTreatment: "solid",
      },
      slides: [
        {
          role: "cover",
          title: "Atelier",
          caption: "Private residences · by appointment",
          photoQuery: "luxury modern mansion exterior dusk",
          photoOrientation: "landscape",
          transition: "fade",
        },
        {
          role: "agenda",
          title: "Portfolio",
          body: ["Estates", "Design", "Service", "Access"],
          transition: "fade",
        },
        {
          role: "problem",
          variantHint: "editorial",
          title: "Generic listings",
          body: ["Flat photos", "No narrative"],
          photoQuery: "empty sterile real estate listing photo",
          photoOrientation: "landscape",
          transition: "push",
        },
        {
          role: "solution",
          variantHint: "a",
          title: "Editorial sale",
          body: ["Story boards", "Private tours"],
          photoQuery: "luxury living room interior design magazine",
          photoOrientation: "landscape",
          transition: "wipe",
        },
        {
          role: "how-it-works",
          title: "Process",
          body: ["Scout", "Stage", "Present"],
          photoQuery: "interior designer staging luxury home",
          photoOrientation: "landscape",
          transition: "fade",
        },
        {
          role: "feature",
          variantHint: "editorial",
          title: "The residence",
          body: ["Skyline views", "Chef kitchen", "Private garden", "Wellness wing"],
          photoQueries: [
            "luxury penthouse skyline view",
            "marble chef kitchen luxury home",
            "private garden courtyard mansion",
            "home spa wellness room luxury",
          ],
          photoQuery: "luxury penthouse skyline view",
          photoOrientation: "landscape",
          transition: "fade",
        },
        {
          role: "stats",
          variantHint: "c",
          title: "Record",
          stats: [
            { value: "$2.4b", label: "closed volume" },
            { value: "41", label: "private sales" },
            { value: "18d", label: "avg close" },
          ],
          transition: "wipe",
        },
        {
          role: "testimonial",
          title: "Clients",
          body: ["They sold our home like a film premiere"],
          caption: "The Meridian family",
          photoQuery: "elegant couple portrait luxury home",
          photoOrientation: "portrait",
          transition: "fade",
        },
        {
          role: "team",
          title: "Advisors",
          members: [
            { name: "Clara Voss", role: "Principal" },
            { name: "Jonah Reed", role: "Stylist" },
            { name: "Amira Cole", role: "Private client" },
          ],
          photoQueries: [
            "luxury realtor woman headshot portrait",
            "interior stylist man headshot portrait",
            "private client advisor woman headshot",
          ],
          photoQuery: "luxury realtor woman headshot portrait",
          photoOrientation: "portrait",
          transition: "fade",
        },
        {
          role: "closing",
          title: "By appointment",
          body: ["atelier.example", "Mon–Sat"],
          photoQuery: "luxury home entrance night warm lights",
          photoOrientation: "landscape",
          transition: "fade",
        },
      ],
    },
  },
  {
    id: "creative-agency-brutalist",
    name: "Mist Studio — Creative Agency",
    theme: "Brutalist",
    deckType: "Pitch",
    motion: { morph: true, ambient: true, cameraPan: true, scatter: false, parallaxScale: 1.25 },
    spec: {
      style: {
        palette: "mist-teal",
        typePair: "display-trebuchet",
        imageTreatment: "tint",
        motif: "brush-stroke",
        typeTreatment: "outline",
      },
      slides: [
        {
          role: "cover",
          variantHint: "brutalist",
          title: "MIST",
          caption: "Brand systems that cut",
          photoQuery: "harsh black and white studio photography",
          photoOrientation: "landscape",
          transition: "fade",
        },
        {
          role: "agenda",
          title: "Agenda",
          body: ["Tension", "Craft", "Cases", "Crew"],
          transition: "push",
        },
        {
          role: "problem",
          variantHint: "editorial",
          title: "Safe brands",
          body: ["Same templates", "No edge"],
          photoQuery: "generic stock photo office handshake",
          photoOrientation: "landscape",
          transition: "push",
        },
        {
          role: "solution",
          title: "Brutal clarity",
          body: ["Type first", "Photo as weapon"],
          photoQuery: "graphic design studio desk collage",
          photoOrientation: "landscape",
          transition: "wipe",
        },
        {
          role: "how-it-works",
          title: "Method",
          body: ["Audit", "Provoke", "Systemize"],
          photoQuery: "creative director reviewing prints wall",
          photoOrientation: "landscape",
          transition: "fade",
        },
        {
          role: "feature",
          variantHint: "editorial",
          title: "Capabilities",
          body: ["Identity", "Campaign", "Motion", "Web"],
          photoQueries: [
            "logo design mockups desk",
            "outdoor advertising campaign billboard",
            "motion design studio screens",
            "web design laptop mockup dark",
          ],
          photoQuery: "logo design mockups desk",
          photoOrientation: "landscape",
          transition: "fade",
        },
        {
          role: "stats",
          variantHint: "c",
          title: "Impact",
          stats: [
            { value: "64", label: "rebrands" },
            { value: "3.1x", label: "share lift" },
            { value: "12", label: "awards" },
          ],
          transition: "wipe",
        },
        {
          role: "testimonial",
          variantHint: "brutalist",
          title: "Clients",
          body: ["They made us look dangerous — in a good way"],
          caption: "VP Brand, retail",
          photoQuery: "creative professional portrait harsh light",
          photoOrientation: "portrait",
          transition: "fade",
        },
        {
          role: "team",
          variantHint: "c",
          title: "Studio",
          members: [
            { name: "Rae Moss", role: "CD" },
            { name: "Kit Hale", role: "Design" },
            { name: "Noor Ali", role: "Motion" },
          ],
          photoQueries: [
            "creative director headshot portrait studio",
            "graphic designer headshot portrait",
            "motion designer headshot portrait",
          ],
          photoQuery: "creative director headshot portrait studio",
          photoOrientation: "portrait",
          transition: "fade",
        },
        {
          role: "closing",
          title: "Start a fight",
          body: ["hello@mist.studio"],
          photoQuery: "neon studio sign night teal",
          photoOrientation: "landscape",
          transition: "fade",
        },
      ],
    },
  },
  {
    id: "pediatric-clinic-warm",
    name: "Little Smiles — Pediatric Clinic",
    theme: "Warm",
    deckType: "Overview",
    motion: { morph: true, ambient: true, cameraPan: true, scatter: false, parallaxScale: 1.2 },
    spec: {
      style: {
        palette: "ivory-warm",
        typePair: "editorial-cambria",
        imageTreatment: "full-bleed",
        motif: "dot-cluster",
        typeTreatment: "solid",
      },
      slides: [
        {
          role: "cover",
          title: "Little Smiles",
          caption: "Pediatric dental care",
          photoQuery: "bright pediatric dental clinic children warm",
          photoOrientation: "landscape",
          transition: "fade",
        },
        {
          role: "agenda",
          title: "Visit guide",
          body: ["Welcome", "Care", "Team", "Book"],
          transition: "fade",
        },
        {
          role: "problem",
          title: "Clinic anxiety",
          body: ["Harsh lights", "Rushed visits"],
          photoQuery: "anxious child waiting room soft light",
          photoOrientation: "landscape",
          transition: "push",
        },
        {
          role: "solution",
          title: "Gentle rooms",
          body: ["Soft light", "Play check-in"],
          photoQuery: "warm pediatric clinic play area",
          photoOrientation: "landscape",
          transition: "wipe",
        },
        {
          role: "how-it-works",
          title: "Visit flow",
          body: ["Welcome", "Exam", "Plan"],
          photoQuery: "dentist talking kindly to child",
          photoOrientation: "landscape",
          transition: "fade",
        },
        {
          role: "feature",
          variantHint: "a",
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
          transition: "fade",
        },
        {
          role: "stats",
          variantHint: "a",
          title: "Trust",
          stats: [
            { value: "4.9", label: "family rating" },
            { value: "2k+", label: "visits yearly" },
            { value: "98%", label: "return rate" },
          ],
          transition: "wipe",
        },
        {
          role: "testimonial",
          title: "Parents",
          body: ["My kids ask to come back"],
          caption: "J. Morgan",
          photoQuery: "parent and child smiling clinic warm",
          photoOrientation: "landscape",
          transition: "fade",
        },
        {
          role: "team",
          variantHint: "b",
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
          transition: "fade",
        },
        {
          role: "closing",
          title: "Visit us",
          body: ["Mon–Sat", "hello@littlesmiles.example"],
          photoQuery: "clinic reception warm light",
          photoOrientation: "landscape",
          transition: "fade",
        },
      ],
    },
  },
  {
    id: "gaming-lounge-dark",
    name: "Nexus Lounge — Gaming",
    theme: "Dark",
    deckType: "Pitch",
    motion: { morph: true, ambient: true, cameraPan: true, scatter: true, parallaxScale: 1.28 },
    spec: {
      style: {
        palette: "charcoal-ember",
        typePair: "slab-rockwell",
        imageTreatment: "tint",
        motif: "bar-accent",
        typeTreatment: "outline",
      },
      slides: [
        {
          role: "cover",
          variantHint: "brutalist",
          title: "Nexus",
          caption: "Play. Compete. Belong.",
          photoQuery: "neon gaming lounge interior night",
          photoOrientation: "landscape",
          transition: "fade",
        },
        {
          role: "agenda",
          title: "Tonight",
          body: ["Arena", "Events", "Crew", "Join"],
          transition: "push",
        },
        {
          role: "problem",
          title: "Scattered sessions",
          body: ["No home base", "Weak community"],
          photoQuery: "lonely gamer at home desk night",
          photoOrientation: "landscape",
          transition: "push",
        },
        {
          role: "solution",
          title: "One arena",
          body: ["Pro rigs", "Shared nights"],
          photoQuery: "esports arena with RGB PCs",
          photoOrientation: "landscape",
          transition: "wipe",
        },
        {
          role: "how-it-works",
          title: "Your night",
          body: ["Book", "Play", "Meet"],
          photoQuery: "friends gaming together lounge",
          photoOrientation: "landscape",
          transition: "fade",
        },
        {
          role: "feature",
          variantHint: "morph-scatter",
          title: "Floor kit",
          body: ["PC Arena", "Booths", "Events", "Cafe"],
          photoQueries: [
            "gaming pc tower rgb fans",
            "private booth pc gaming lounge",
            "esports stage lights crowd",
            "cafe counter neon lounge",
          ],
          photoQuery: "gaming pc tower rgb fans",
          photoOrientation: "landscape",
          transition: "fade",
        },
        {
          role: "stats",
          variantHint: "c",
          title: "Impact",
          stats: [
            { value: "120+", label: "active PCs" },
            { value: "24", label: "weekly events" },
            { value: "4.9", label: "member rating" },
          ],
          transition: "wipe",
        },
        {
          role: "testimonial",
          variantHint: "brutalist",
          title: "Players say",
          body: ["This is where our crew actually meets"],
          caption: "Maya R., captain",
          photoQuery: "smiling gamer with headset portrait",
          photoOrientation: "portrait",
          transition: "fade",
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
          transition: "fade",
        },
        {
          role: "closing",
          title: "Level up here",
          body: ["Open late", "nexus.example"],
          photoQuery: "gaming lounge neon entrance night",
          photoOrientation: "landscape",
          transition: "fade",
        },
      ],
    },
  },
];

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

async function writePreviewGrid(nicheDir: string, niche: Niche, slideMeta: any[]) {
  const slides = fs
    .readdirSync(nicheDir)
    .filter((n: string) => /^slide-\d{2}/.test(n) && n.endsWith(".png"))
    .sort();
  const cols = 5;
  const rows = Math.ceil(slides.length / cols);
  const cellW = 480;
  const cellH = 270;
  const gap = 12;
  const headerH = 72;
  const footerH = 28;
  const canvas = createCanvas(cols * cellW + (cols + 1) * gap, headerH + rows * (cellH + footerH + gap) + gap);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#10141c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f2f4f7";
  ctx.font = "bold 22px Arial";
  ctx.fillText(niche.name, gap, 32);
  ctx.font = "14px Arial";
  ctx.fillStyle = "#93a0b4";
  ctx.fillText(niche.theme + " · " + slides.length + " slides · motion on · catalog review", gap, 54);

  for (let i = 0; i < slides.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = gap + col * (cellW + gap);
    const y = headerH + row * (cellH + footerH + gap);
    const img = await loadImage(path.join(nicheDir, slides[i]));
    ctx.drawImage(img, x, y, cellW, cellH);
    const meta = slideMeta[i] || {};
    ctx.fillStyle = "#c9d4e8";
    ctx.font = "11px Arial";
    const badge = [meta.role, meta.variant, meta.motion].filter(Boolean).join(" · ");
    ctx.fillText(String(i + 1).padStart(2, "0") + "  " + badge, x, y + cellH + 18);
  }

  const dest = path.join(nicheDir, "preview-grid.png");
  fs.writeFileSync(dest, canvas.toBuffer("image/png"));
  return dest;
}

function motionBadge(layout: any): string {
  if (!layout) return "none";
  if (layout.morphDestination || (layout.motion && layout.motion.transition === "morph")) return "morph";
  if (layout.morphKeyframe === "start") return "keyframe";
  const amb = layout.motion && layout.motion.ambient;
  if (amb && amb.effect) return "ambient:" + amb.effect;
  if (layout.motion && layout.motion.transition) return layout.motion.transition;
  return "none";
}

async function buildNiche(niche: Niche) {
  const outDir = path.join(OUT, niche.id);
  ensureDir(outDir);
  console.log("\n===", niche.id, "—", niche.theme, "===");

  const seed = niche.id + "|" + niche.spec.style.palette + "|" + niche.spec.style.typePair;
  const selections = selectAll(niche.spec, seed);
  niche.spec.slides.forEach((slide: any, i: number) => {
    if (slide.variantHint) selections[i] = { role: slide.role, variant: slide.variantHint };
  });
  const lock = resolveThemeLock(niche.spec);
  const gates = runGates(niche.spec, selections, tokens, niche.deckType);

  let deck = await renderDeckFromSpec(niche.spec, selections, { id: niche.id });
  deck.name = niche.name;

  // Stamp transitions before expand
  deck.layoutSequence.forEach((lid: string, i: number) => {
    const slide = niche.spec.slides[i];
    if (slide && slide.transition && deck.layouts[lid]) {
      deck.layouts[lid].motion = Object.assign({}, deck.layouts[lid].motion, {
        transition: slide.transition,
        durationMs: 800,
      });
    }
  });

  deck = expandMotionScenes(deck, {
    morph: niche.motion.morph !== false,
    ambient: niche.motion.ambient !== false,
    cameraPan: niche.motion.cameraPan !== false,
    scatter: niche.motion.scatter === true,
    parallaxScale: niche.motion.parallaxScale || 1.22,
    parallaxTextShift: 0.05,
    durationMs: 2000,
    defaultTransition: "fade",
  });

  // Re-apply role transitions after expand for non-morph slides
  deck.layoutSequence.forEach((lid: string) => {
    const layout = deck.layouts[lid];
    if (!layout || layout.morphKeyframe) return;
    const match = niche.spec.slides.find((s: any) => s.role === layout.role && s.transition);
    if (match && match.transition) {
      layout.motion = Object.assign({}, layout.motion, {
        transition: match.transition,
        durationMs: 800,
      });
    }
  });

  const slideMeta: any[] = [];
  for (let i = 0; i < deck.layoutSequence.length; i++) {
    const lid = deck.layoutSequence[i];
    const layout = deck.layouts[lid];
    const badge = motionBadge(layout);
    const file = path.join(
      outDir,
      "slide-" + String(i + 1).padStart(2, "0") + "-" + (layout.role || "slide") + "-" + badge.replace(":", "-") + ".png"
    );
    slideMeta.push({
      index: i + 1,
      layoutId: lid,
      role: layout.role,
      variant: layout.variant,
      kitId: layout.kitId,
      family: layout.family,
      motion: badge,
      ambient: layout.motion && layout.motion.ambient,
      file: path.basename(file),
    });
    try {
      renderSlidePng(deck, lid, file);
    } catch (err: any) {
      console.warn("png", niche.id, lid, err && err.message);
    }
  }

  const pptxPath = path.join(outDir, "deck.pptx");
  await exportDeckPptx(deck, pptxPath);
  const gridPath = await writePreviewGrid(outDir, niche, slideMeta);

  const kitsUsed = Array.from(
    new Set(slideMeta.map((s) => (s.role && s.variant ? s.role + "/" + s.variant : s.kitId).replace(/^feature\/feature\//, "feature/")))
  );

  const summary = {
    id: niche.id,
    name: niche.name,
    theme: niche.theme,
    deckType: niche.deckType,
    lock: lock && (lock.id || lock.label),
    style: niche.spec.style,
    motion: niche.motion,
    gates: { pass: gates.pass, issues: gates.issues || gates.failures || [] },
    slideCount: deck.layoutSequence.length,
    sequence: deck.layoutSequence,
    selections: selections.map((s: any) => s.role + "/" + s.variant),
    kitsUsed,
    slideMeta,
    pptx: path.relative(ROOT, pptxPath).replace(/\\/g, "/"),
    previewGrid: path.relative(ROOT, gridPath).replace(/\\/g, "/"),
    ambientLoops: (deck.engine && deck.engine.motion && deck.engine.motion.ambientLoops) || [],
    morphScenes: (deck.engine && deck.engine.motion && deck.engine.motion.scenes) || [],
  };

  fs.writeFileSync(path.join(outDir, "deck.json"), JSON.stringify(deck, null, 2));
  fs.writeFileSync(path.join(outDir, "deckspec.json"), JSON.stringify(niche.spec, null, 2));
  fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(outDir, "gates.json"), JSON.stringify(gates, null, 2));

  console.log(
    "  slides",
    deck.layoutSequence.length,
    "| kits",
    kitsUsed.join(", "),
    "| pptx",
    path.basename(pptxPath),
    "| grid ok"
  );
  return summary;
}

function writeCatalogHtml(index: any) {
  const cards = index.niches
    .map((n: any) => {
      const kitList = (n.kitsUsed || [])
        .map((k: string) => "<li><code>" + k + "</code></li>")
        .join("");
      return (
        `<article class="card">` +
        `<div class="head"><h2>${n.name}</h2><span class="chip">${n.theme}</span></div>` +
        `<a href="${n.id}/preview-grid.png" target="_blank"><img src="${n.id}/preview-grid.png" alt="${n.name} grid"/></a>` +
        `<p class="meta">${n.slideCount} slides · lock ${n.lock || "—"} · <a href="${n.id}/deck.pptx">deck.pptx</a></p>` +
        `<div class="kits"><strong>Kits in play</strong><ul>${kitList}</ul></div>` +
        `</article>`
      );
    })
    .join("\n");

  const html =
    `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>` +
    `<meta name="viewport" content="width=device-width, initial-scale=1"/>` +
    `<title>Slidexy Catalog Review</title>` +
    `<style>
      :root{--bg:#12151a;--panel:#1a1f27;--ink:#e8edf5;--muted:#93a0b4;--line:#2e3644;--accent:#e4572e}
      *{box-sizing:border-box} body{margin:0;font:15px/1.45 "IBM Plex Sans",system-ui,sans-serif;background:radial-gradient(900px 400px at 10% -10%,rgba(228,87,46,.14),transparent 55%),var(--bg);color:var(--ink)}
      header{padding:28px 32px 8px} h1{margin:0;font:650 34px/1.1 Fraunces,Georgia,serif}
      header p{color:var(--muted);max-width:62ch}
      .grid{display:grid;grid-template-columns:1fr;gap:28px;padding:16px 32px 48px}
      .card{background:var(--panel);border:1px solid var(--line);border-radius:12px;overflow:hidden}
      .head{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid var(--line)}
      .head h2{margin:0;font-size:18px} .chip{font:11px/1 monospace;border:1px solid var(--line);padding:6px 10px;border-radius:999px;color:var(--muted)}
      img{display:block;width:100%;height:auto;background:#0b0e14}
      .meta{padding:10px 16px;color:var(--muted);font:12px/1.4 monospace;margin:0;border-bottom:1px solid var(--line)}
      .meta a{color:#9ec5ff} .kits{padding:12px 16px 18px} .kits ul{margin:8px 0 0;padding-left:18px;columns:2}
      code{font:12px/1.3 ui-monospace,monospace;color:#ffb39a}
      .note{padding:0 32px 32px;color:var(--muted)}
    </style></head><body>` +
    `<header><h1>Catalog review</h1>` +
    `<p>Five niche decks with Morph / ambient / transitions. Open each grid, mark kits to keep, and lock ~20 Approved Kits for production.</p></header>` +
    `<div class="grid">${cards}</div>` +
    `<p class="note">Generated ${index.generatedAt}. Index: catalog-index.json · Select finals in your review pass.</p>` +
    `</body></html>`;

  fs.writeFileSync(path.join(OUT, "index.html"), html);
}

async function main() {
  ensureDir(OUT);
  const summaries = [];
  for (const niche of niches) {
    summaries.push(await buildNiche(niche));
  }

  const allKits = Array.from(new Set(summaries.flatMap((s: any) => s.kitsUsed || []))).sort();
  const index = {
    generatedAt: new Date().toISOString(),
    goal: "Review catalog and select ~20 Approved Kits for production lock",
    nicheCount: summaries.length,
    niches: summaries,
    kitUniverse: allKits,
    reviewChecklist: allKits.map((k) => ({ kit: k, status: "pending", notes: "" })),
  };
  fs.writeFileSync(path.join(OUT, "catalog-index.json"), JSON.stringify(index, null, 2));
  writeCatalogHtml(index);

  console.log("\nCatalog complete →", OUT);
  console.log("Niches:", summaries.map((s: any) => s.id).join(", "));
  console.log("Kit universe (" + allKits.length + "):", allKits.join(", "));
  console.log("Open out/catalog/index.html to review grids.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
