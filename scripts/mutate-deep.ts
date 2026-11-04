/**
 * In-depth Creative Mutation gallery.
 * Isolates editorial / brutalist / dashboard kits across palettes,
 * builds extra full decks, and writes dense compare sheets + an HTML index.
 *
 *   node -r ts-node/register/transpile-only scripts/mutate-deep.ts
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
const OUT = path.join(ROOT, "out", "mutate", "deep");

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

async function renderOne(
  outDir: string,
  id: string,
  name: string,
  spec: any,
  selections: Array<{ role: string; variant: string }>
) {
  ensureDir(outDir);
  const gates = runGates(spec, selections, tokens, "Pitch");
  const deck = await renderDeckFromSpec(spec, selections, { id });
  deck.name = name;
  fs.writeFileSync(path.join(outDir, "deckspec.json"), JSON.stringify(spec, null, 2));
  fs.writeFileSync(path.join(outDir, "deck.json"), JSON.stringify(deck, null, 2));
  fs.writeFileSync(path.join(outDir, "gates.json"), JSON.stringify(gates, null, 2));
  fs.writeFileSync(
    path.join(outDir, "selections.json"),
    JSON.stringify(
      selections.map((s) => s.role + "/" + s.variant),
      null,
      2
    )
  );
  const pngs: string[] = [];
  for (let i = 0; i < deck.layoutSequence.length; i++) {
    const lid = deck.layoutSequence[i];
    const file = path.join(outDir, "slide-" + String(i + 1).padStart(2, "0") + ".png");
    renderSlidePng(deck, lid, file);
    pngs.push(file);
  }
  try {
    await exportDeckPptx(deck, path.join(outDir, "deck.pptx"));
  } catch (err: any) {
    console.warn("pptx skip", id, err && err.message);
  }
  return { outDir, deck, selections, gates, pngs, name };
}

async function sheetFromPngs(
  items: Array<{ file: string; label: string }>,
  dest: string,
  title: string,
  cols: number
) {
  const cellW = 520;
  const cellH = 292;
  const gap = 16;
  const labelH = 28;
  const headerH = 64;
  const rows = Math.ceil(items.length / cols);
  const canvas = createCanvas(
    cols * (cellW + gap) + gap,
    headerH + rows * (cellH + labelH + gap) + gap
  );
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0c0f14";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f2f4f7";
  ctx.font = "bold 22px Arial";
  ctx.fillText(title, gap, 36);
  ctx.fillStyle = "#8b97ab";
  ctx.font = "13px Arial";
  ctx.fillText(items.length + " slides", gap, 56);

  for (let i = 0; i < items.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = gap + col * (cellW + gap);
    const y = headerH + row * (cellH + labelH + gap);
    try {
      const img = await loadImage(items[i].file);
      ctx.drawImage(img, x, y, cellW, cellH);
    } catch {
      ctx.fillStyle = "#1a2030";
      ctx.fillRect(x, y, cellW, cellH);
    }
    ctx.fillStyle = "#c5cedo";
    ctx.font = "12px Arial";
    ctx.fillText(items[i].label.slice(0, 70), x, y + cellH + 18);
  }
  fs.writeFileSync(dest, canvas.toBuffer("image/png"));
  return dest;
}

/** Isolation matrix: each mutated kit × several palettes / type treatments. */
async function buildIsolationGallery() {
  const dir = path.join(OUT, "isolation");
  ensureDir(dir);
  const cases = [
    {
      id: "editorial-ember",
      role: "feature",
      variant: "editorial",
      style: {
        palette: "charcoal-ember",
        typePair: "slab-rockwell",
        imageTreatment: "tint",
        motif: "bar-accent",
        typeTreatment: "outline",
      },
      slide: {
        role: "feature",
        variantHint: "editorial",
        title: "Arena nights",
        body: ["Book a bay", "Queue ranked", "Meet the floor crew", "Stay until close"],
        caption: "Feature",
        photoQuery: "esports arena rgb lighting crowd",
        photoOrientation: "landscape",
      },
    },
    {
      id: "editorial-ivory",
      role: "problem",
      variant: "editorial",
      style: {
        palette: "ivory-warm",
        typePair: "editorial-cambria",
        imageTreatment: "full-bleed",
        motif: "dot-cluster",
        typeTreatment: "outline",
      },
      slide: {
        role: "problem",
        variantHint: "editorial",
        title: "Clinic anxiety",
        body: ["Harsh lights", "Rushed visits", "Cold waiting rooms"],
        caption: "Problem",
        photoQuery: "anxious child waiting room soft light",
        photoOrientation: "landscape",
      },
    },
    {
      id: "editorial-ink",
      role: "feature",
      variant: "editorial",
      style: {
        palette: "ink-night",
        typePair: "display-trebuchet",
        imageTreatment: "full-bleed",
        motif: "bar-accent",
        typeTreatment: "outline",
      },
      slide: {
        role: "feature",
        variantHint: "editorial",
        title: "Signal graph",
        body: ["Triggers", "Guards", "Actions", "Replay"],
        caption: "Product",
        photoQuery: "developer dual monitors night office",
        photoOrientation: "landscape",
      },
    },
    {
      id: "brutalist-mist",
      role: "cover",
      variant: "brutalist",
      style: {
        palette: "mist-teal",
        typePair: "poster-franklin",
        imageTreatment: "full-bleed",
        motif: "brush-stroke",
        typeTreatment: "outline",
      },
      slide: {
        role: "cover",
        variantHint: "brutalist",
        title: "North Atelier",
        caption: "Systems with teeth",
        photoQuery: "architect portrait studio harsh light",
        photoOrientation: "portrait",
      },
    },
    {
      id: "brutalist-ember",
      role: "cover",
      variant: "brutalist",
      style: {
        palette: "charcoal-ember",
        typePair: "slab-rockwell",
        imageTreatment: "contrast-bw",
        motif: "bar-accent",
        typeTreatment: "outline",
      },
      slide: {
        role: "cover",
        variantHint: "brutalist",
        title: "Nexus",
        caption: "Play. Compete. Belong.",
        photoQuery: "gamer with headset neon portrait",
        photoOrientation: "portrait",
      },
    },
    {
      id: "brutalist-testimonial",
      role: "testimonial",
      variant: "brutalist",
      style: {
        palette: "mist-teal",
        typePair: "display-trebuchet",
        imageTreatment: "full-bleed",
        motif: "brush-stroke",
        typeTreatment: "outline",
      },
      slide: {
        role: "testimonial",
        variantHint: "brutalist",
        title: "Clients",
        body: ["They made the brand feel inevitable"],
        caption: "CMO · consumer",
        photoQuery: "creative director portrait black and white",
        photoOrientation: "portrait",
      },
    },
    {
      id: "dashboard-paper",
      role: "stats",
      variant: "dashboard",
      style: {
        palette: "paper-blue",
        typePair: "tech-verdana",
        imageTreatment: "full-bleed",
        motif: "bar-accent",
        typeTreatment: "solid",
      },
      slide: {
        role: "stats",
        variantHint: "dashboard",
        title: "Operating pulse",
        stats: [
          { value: "24k", label: "weekly runs" },
          { value: "99.99%", label: "uptime" },
          { value: "11", label: "regions" },
        ],
      },
    },
    {
      id: "dashboard-slate",
      role: "stats",
      variant: "dashboard",
      style: {
        palette: "slate-light",
        typePair: "modern-segoe",
        imageTreatment: "full-bleed",
        motif: "bar-accent",
        typeTreatment: "solid",
      },
      slide: {
        role: "stats",
        variantHint: "dashboard",
        title: "Pipeline health",
        stats: [
          { value: "$4.2m", label: "ARR" },
          { value: "38%", label: "win rate" },
          { value: "19d", label: "cycle" },
        ],
      },
    },
    {
      id: "dashboard-how",
      role: "how-it-works",
      variant: "dashboard",
      style: {
        palette: "paper-blue",
        typePair: "corp-calibri",
        imageTreatment: "full-bleed",
        motif: "bar-accent",
        typeTreatment: "solid",
      },
      slide: {
        role: "how-it-works",
        variantHint: "dashboard",
        title: "Implementation",
        body: ["Connect systems", "Map policy packs", "Go live calmly"],
      },
    },
    {
      id: "editorial-vs-a",
      role: "feature",
      variant: "editorial",
      style: {
        palette: "mist-teal",
        typePair: "book-garamond",
        imageTreatment: "full-bleed",
        motif: "brush-stroke",
        typeTreatment: "outline",
      },
      slide: {
        role: "feature",
        variantHint: "editorial",
        title: "Type as image",
        body: ["Scale breaks the grid", "Body shrinks to margin dust", "Photos refuse the box"],
        caption: "Editorial",
        photoQuery: "typography print shop letterpress",
        photoOrientation: "landscape",
      },
    },
  ];

  const items: Array<{ file: string; label: string }> = [];
  for (const c of cases) {
    const outDir = path.join(dir, c.id);
    const spec = { style: c.style, slides: [c.slide] };
    const built = await renderOne(outDir, "iso-" + c.id, c.id, spec, [
      { role: c.role, variant: c.variant },
    ]);
    items.push({
      file: built.pngs[0],
      label: c.id + " · " + c.role + "/" + c.variant + " · " + c.style.palette,
    });
    console.log("iso", c.id);
  }
  const sheet = path.join(dir, "isolation-sheet.png");
  await sheetFromPngs(items, sheet, "Mutated kits — isolation matrix", 3);
  return { dir, sheet, count: items.length };
}

/** Full decks with forced mutation DNA. */
async function buildExtraDecks() {
  const decks = [
    {
      id: "fintech-brutalist",
      name: "Volt Capital — Brutalist Fintech",
      spec: {
        style: {
          palette: "ink-night",
          typePair: "poster-franklin",
          imageTreatment: "contrast-bw",
          motif: "bar-accent",
          typeTreatment: "outline",
        },
        slides: [
          {
            role: "cover",
            variantHint: "brutalist",
            title: "Volt",
            caption: "Private markets, public pace",
            photoQuery: "finance trader portrait dramatic light",
            photoOrientation: "portrait",
          },
          {
            role: "problem",
            variantHint: "editorial",
            title: "Opaque desks",
            body: ["Slow diligence", "Spreadsheet risk"],
            caption: "Problem",
            photoQuery: "messy trading desk papers night",
            photoOrientation: "landscape",
          },
          {
            role: "solution",
            title: "One underwriting graph",
            body: ["Signals", "Guards", "Commit"],
            photoQuery: "fintech dashboard monitors dark room",
            photoOrientation: "landscape",
          },
          {
            role: "how-it-works",
            title: "Deal path",
            body: ["Ingest", "Score", "Allocate"],
            photoQuery: "analyst reviewing charts laptop",
            photoOrientation: "landscape",
          },
          {
            role: "feature",
            variantHint: "editorial",
            title: "Risk lens",
            body: ["Issuer graph", "Covenant watch", "Liquidity map", "Alert bus"],
            caption: "Feature",
            photoQuery: "abstract data visualization wall",
            photoOrientation: "landscape",
          },
          {
            role: "stats",
            variantHint: "c",
            title: "Book",
            stats: [
              { value: "$2.4m", label: "AUM" },
              { value: "99.9%", label: "uptime" },
              { value: "14d", label: "onboard" },
            ],
          },
          {
            role: "testimonial",
            variantHint: "brutalist",
            title: "LPs",
            body: ["Finally a desk that moves at market speed"],
            caption: "Partner, growth fund",
            photoQuery: "confident investor portrait black white",
            photoOrientation: "portrait",
          },
          {
            role: "team",
            title: "Desk",
            members: [
              { name: "R. Okonkwo", role: "PM" },
              { name: "S. Cho", role: "Quant" },
              { name: "M. Berg", role: "Ops" },
            ],
            photoQueries: [
              "portfolio manager headshot portrait person",
              "quant researcher headshot portrait person",
              "operations lead headshot portrait person",
            ],
            photoOrientation: "portrait",
          },
          {
            role: "closing",
            title: "Wire the desk",
            body: ["hello@volt.example"],
            photoQuery: "city skyline night glass towers",
            photoOrientation: "landscape",
          },
        ],
      },
      force: true,
    },
    {
      id: "clinic-editorial",
      name: "Little Smiles — Editorial Clinic",
      spec: {
        style: {
          palette: "ivory-warm",
          typePair: "editorial-cambria",
          imageTreatment: "full-bleed",
          motif: "dot-cluster",
          typeTreatment: "outline",
        },
        slides: [
          {
            role: "cover",
            variantHint: "brutalist",
            title: "Little Smiles",
            caption: "Pediatric dental care",
            photoQuery: "friendly dentist portrait soft clinic",
            photoOrientation: "portrait",
          },
          {
            role: "problem",
            variantHint: "editorial",
            title: "Fear of the chair",
            body: ["Bright lamps", "Cold steel", "Rushed talk"],
            caption: "Problem",
            photoQuery: "empty dental chair clinical light",
            photoOrientation: "landscape",
          },
          {
            role: "feature",
            variantHint: "editorial",
            title: "Gentle rooms",
            body: ["Play check-in", "Quiet chairs", "Parent notes", "Soft tools"],
            caption: "Care",
            photoQuery: "pediatric dental play area warm",
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
              { name: "Mia Chen", role: "Care" },
            ],
            photoQueries: [
              "friendly dentist headshot portrait soft light person",
              "dental hygienist professional headshot portrait person",
              "clinic care lead headshot portrait soft light person",
            ],
            photoOrientation: "portrait",
          },
          {
            role: "stats",
            variantHint: "c",
            title: "Trust",
            stats: [
              { value: "4.9", label: "family rating" },
              { value: "2k+", label: "visits" },
              { value: "98%", label: "return" },
            ],
          },
          {
            role: "testimonial",
            variantHint: "brutalist",
            title: "Parents",
            body: ["My kids ask to come back"],
            caption: "J. Morgan",
            photoQuery: "parent smiling portrait soft light",
            photoOrientation: "portrait",
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
      force: true,
    },
    {
      id: "ops-dashboard",
      name: "Paper Ops — Dashboard Dense",
      spec: {
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
            title: "Paper Ops",
            caption: "Compliance without chaos",
            photoQuery: "modern saas office glass conference",
            photoOrientation: "landscape",
          },
          {
            role: "problem",
            title: "Audit pile-up",
            body: ["Manual packs", "Missed filings"],
            photoQuery: "office desk stacked documents stress",
            photoOrientation: "landscape",
          },
          {
            role: "solution",
            title: "Control plane",
            body: ["Country packs", "Approvals"],
            photoQuery: "product team whiteboard planning",
            photoOrientation: "landscape",
          },
          {
            role: "how-it-works",
            variantHint: "dashboard",
            title: "Rollout board",
            body: ["Connect HRIS", "Map rules", "Run payroll"],
          },
          {
            role: "feature",
            variantHint: "b",
            title: "Control set",
            body: ["Packs", "Approvals", "Exports", "Alerts", "Replay", "Audit"],
            photoQueries: [
              "office meeting professionals",
              "laptop spreadsheet close",
              "manager reviewing tablet",
              "team standup office",
              "server room aisle",
              "handshake bright office",
            ],
            photoOrientation: "landscape",
          },
          {
            role: "stats",
            variantHint: "dashboard",
            title: "Ops dashboard",
            stats: [
              { value: "18", label: "EU countries" },
              { value: "99.9%", label: "run success" },
              { value: "2d", label: "avg onboard" },
            ],
          },
          {
            role: "testimonial",
            title: "Finance",
            body: ["Month-end closed two days early"],
            caption: "CFO",
            photoQuery: "business woman portrait office",
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
            photoOrientation: "portrait",
            photoQueries: [
              "ceo woman headshot portrait person",
              "product manager headshot portrait person",
              "compliance officer headshot portrait person",
            ],
          },
          {
            role: "closing",
            title: "Book a control review",
            body: ["hello@paperops.example"],
            photoQuery: "handshake in bright office",
            photoOrientation: "landscape",
          },
        ],
      },
      force: true,
    },
    {
      id: "agency-max",
      name: "Mist Studio — Max Editorial",
      spec: {
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
            title: "Mist",
            caption: "Brand systems that land hard",
            photoQuery: "fashion editorial portrait studio flash",
            photoOrientation: "portrait",
          },
          {
            role: "problem",
            variantHint: "editorial",
            title: "Template taste",
            body: ["Safe grids", "Borrowed voice", "No tension"],
            caption: "Problem",
            photoQuery: "generic stock photo office bland",
            photoOrientation: "landscape",
          },
          {
            role: "solution",
            title: "Editorial OS",
            body: ["Voice", "Image", "Pace"],
            photoQuery: "art director reviewing proofs desk",
            photoOrientation: "landscape",
          },
          {
            role: "how-it-works",
            title: "Studio loop",
            body: ["Discover", "Provoke", "Ship"],
            photoQuery: "creative workshop sticky notes wall",
            photoOrientation: "landscape",
          },
          {
            role: "feature",
            variantHint: "editorial",
            title: "Craft stack",
            body: ["Identity", "Motion", "Web", "Campaign"],
            caption: "Feature",
            photoQuery: "brand book open on oak table",
            photoOrientation: "landscape",
          },
          {
            role: "stats",
            variantHint: "c",
            title: "Proof",
            stats: [
              { value: "62", label: "brands" },
              { value: "18x", label: "referral" },
              { value: "3wk", label: "sprint" },
            ],
          },
          {
            role: "testimonial",
            variantHint: "brutalist",
            title: "Clients",
            body: ["They made our brand feel inevitable"],
            caption: "CMO, consumer",
            photoQuery: "smiling creative professional portrait harsh light",
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
            photoQueries: [
              "strategy director headshot portrait person",
              "art director headshot portrait person",
              "motion designer headshot portrait person",
            ],
            photoOrientation: "portrait",
          },
          {
            role: "closing",
            title: "Start loud",
            body: ["hello@mist.studio"],
            photoQuery: "sunlit design studio windows plants",
            photoOrientation: "landscape",
          },
        ],
      },
      force: true,
    },
  ];

  const built = [];
  for (const d of decks) {
    const outDir = path.join(OUT, "decks", d.id);
    const seed = d.name + "|" + d.spec.style.palette + "|deep";
    let selections = selectAll(d.spec, seed);
    if (d.force) {
      d.spec.slides.forEach((slide: any, i: number) => {
        if (slide.variantHint) selections[i] = { role: slide.role, variant: slide.variantHint };
      });
    }
    const lock = resolveThemeLock(d.spec);
    const result = await renderOne(outDir, d.id, d.name, d.spec, selections);
    built.push({
      id: d.id,
      name: d.name,
      dir: outDir,
      lock: lock && lock.id,
      selections: selections.map((s: any) => s.role + "/" + s.variant),
      pngs: result.pngs,
    });
    console.log(
      "deck",
      d.id,
      selections.map((s: any) => s.role + "/" + s.variant).join(" → ")
    );
  }
  return built;
}

async function writeDeckSheet(deck: any, dest: string) {
  const items = deck.pngs.map((file: string, i: number) => ({
    file,
    label: String(i + 1).padStart(2, "0") + " · " + deck.selections[i],
  }));
  return sheetFromPngs(items, dest, deck.name, 3);
}

async function writeCrossCompare(decks: any[], dest: string) {
  // Row = slide index, Col = deck — deep side-by-side
  const maxSlides = Math.max(...decks.map((d) => d.pngs.length));
  const cols = decks.length;
  const cellW = 420;
  const cellH = 236;
  const gap = 12;
  const headerH = 80;
  const labelH = 24;
  const canvas = createCanvas(
    cols * (cellW + gap) + gap,
    headerH + maxSlides * (cellH + labelH + gap) + gap
  );
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0a0d12";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f2f4f7";
  ctx.font = "bold 20px Arial";
  ctx.fillText("Deep mutation — cross-deck compare", gap, 32);
  ctx.fillStyle = "#8b97ab";
  ctx.font = "12px Arial";
  ctx.fillText("Same slide index across fintech / clinic / ops / agency", gap, 54);

  for (let c = 0; c < cols; c++) {
    const x = gap + c * (cellW + gap);
    ctx.fillStyle = "#e8edf5";
    ctx.font = "bold 13px Arial";
    ctx.fillText(decks[c].id, x, 74);
  }

  for (let r = 0; r < maxSlides; r++) {
    for (let c = 0; c < cols; c++) {
      const x = gap + c * (cellW + gap);
      const y = headerH + r * (cellH + labelH + gap);
      const file = decks[c].pngs[r];
      if (!file) continue;
      try {
        const img = await loadImage(file);
        ctx.drawImage(img, x, y, cellW, cellH);
      } catch {
        ctx.fillStyle = "#182033";
        ctx.fillRect(x, y, cellW, cellH);
      }
      ctx.fillStyle = "#9aa8c2";
      ctx.font = "11px Arial";
      ctx.fillText((decks[c].selections[r] || "—").slice(0, 42), x, y + cellH + 16);
    }
  }
  fs.writeFileSync(dest, canvas.toBuffer("image/png"));
  return dest;
}

function writeIndexHtml(payload: any) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Mutation Deep Dive</title>
<style>
  :root { --bg:#0c0f14; --panel:#161b24; --ink:#e8edf5; --muted:#93a0b4; --line:#2a3344; --accent:#3ecf8e; }
  * { box-sizing: border-box; }
  body { margin:0; font:14px/1.45 "Segoe UI",sans-serif; background:var(--bg); color:var(--ink); }
  header { padding:28px 32px; border-bottom:1px solid var(--line); }
  h1 { margin:0 0 8px; font-size:28px; }
  p { margin:0; color:var(--muted); max-width:70ch; }
  main { padding:24px 32px 64px; display:grid; gap:36px; }
  section h2 { margin:0 0 12px; font-size:18px; }
  .sheet { width:100%; border:1px solid var(--line); border-radius:8px; background:var(--panel); }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:14px; }
  .card { background:var(--panel); border:1px solid var(--line); border-radius:8px; overflow:hidden; }
  .card img { width:100%; display:block; aspect-ratio:16/9; object-fit:cover; background:#111; }
  .card .meta { padding:10px 12px; font-size:12px; color:var(--muted); }
  .card strong { color:var(--ink); display:block; margin-bottom:4px; }
  a { color:var(--accent); }
  code { font-family: Consolas, monospace; font-size:12px; color:#c9d4e8; }
</style>
</head>
<body>
<header>
  <h1>Creative Mutation — deep dive</h1>
  <p>Isolation matrix of editorial / brutalist / dashboard kits, plus four full decks and cross-compare grids. Open the PNGs or PPTX beside each card.</p>
</header>
<main>
  <section>
    <h2>Isolation matrix</h2>
    <p><a href="isolation/isolation-sheet.png">isolation-sheet.png</a> · ${payload.isolation.count} kit×palette combos</p>
    <img class="sheet" src="isolation/isolation-sheet.png" alt="isolation sheet" />
  </section>
  <section>
    <h2>Cross-deck compare</h2>
    <p><a href="cross-compare.png">cross-compare.png</a></p>
    <img class="sheet" src="cross-compare.png" alt="cross compare" />
  </section>
  <section>
    <h2>Full decks</h2>
    <div class="grid">
      ${payload.decks
        .map(
          (d: any) => `
      <article class="card">
        <img src="decks/${d.id}/slide-01.png" alt="${d.id} cover" />
        <div class="meta">
          <strong>${d.name}</strong>
          <div><code>${d.selections.slice(0, 4).join(" · ")}…</code></div>
          <div><a href="decks/${d.id}/sheet.png">sheet</a> · <a href="decks/${d.id}/deck.pptx">pptx</a></div>
        </div>
      </article>`
        )
        .join("")}
    </div>
  </section>
  <section>
    <h2>Per-deck sheets</h2>
    ${payload.decks
      .map(
        (d: any) => `
      <h3 style="margin:18px 0 8px">${d.name}</h3>
      <img class="sheet" src="decks/${d.id}/sheet.png" alt="${d.id} sheet" />`
      )
      .join("")}
  </section>
</main>
</body>
</html>`;
  fs.writeFileSync(path.join(OUT, "index.html"), html);
}

async function main() {
  ensureDir(OUT);
  console.log("=== Isolation gallery ===");
  const isolation = await buildIsolationGallery();

  console.log("\n=== Extra full decks ===");
  const decks = await buildExtraDecks();

  console.log("\n=== Sheets ===");
  for (const d of decks) {
    const sheet = path.join(d.dir, "sheet.png");
    await writeDeckSheet(d, sheet);
    d.sheet = sheet;
    console.log("sheet", d.id);
  }

  const cross = path.join(OUT, "cross-compare.png");
  await writeCrossCompare(decks, cross);

  // Family-focused sheets: all editorial / brutalist / dashboard isolations
  const isoDir = path.join(OUT, "isolation");
  const familyBuckets: Record<string, Array<{ file: string; label: string }>> = {
    editorial: [],
    brutalist: [],
    dashboard: [],
  };
  fs.readdirSync(isoDir).forEach((name: string) => {
    const slide = path.join(isoDir, name, "slide-01.png");
    if (!fs.existsSync(slide)) return;
    if (name.startsWith("editorial")) familyBuckets.editorial.push({ file: slide, label: name });
    if (name.startsWith("brutalist")) familyBuckets.brutalist.push({ file: slide, label: name });
    if (name.startsWith("dashboard")) familyBuckets.dashboard.push({ file: slide, label: name });
  });
  for (const fam of Object.keys(familyBuckets)) {
    if (!familyBuckets[fam].length) continue;
    await sheetFromPngs(
      familyBuckets[fam],
      path.join(OUT, fam + "-family-sheet.png"),
      fam.toUpperCase() + " family — deep",
      Math.min(3, familyBuckets[fam].length)
    );
  }

  const payload = { isolation, decks, cross };
  fs.writeFileSync(path.join(OUT, "deep-summary.json"), JSON.stringify(payload, null, 2));
  writeIndexHtml(payload);
  console.log("\nOpen →", path.join(OUT, "index.html"));
  console.log("Cross →", cross);
  console.log("Isolation →", isolation.sheet);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
