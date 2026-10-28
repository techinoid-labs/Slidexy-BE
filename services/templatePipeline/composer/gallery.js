/**
 * One-slide gallery for every component × variant (corp-calibri + light-neutral),
 * plus dark-neutral for cover / divider / big-number.
 *
 *   node services/templatePipeline/composer/gallery.js
 */

const fs = require("fs");
const path = require("path");
const { applyParametric } = require("../parametric");
const { checkGeometry } = require("../scoring/analyzeDeck");
const { renderSlidePng } = require("../../../scripts/slideSvg");
const { FONT_PAIRS, OUT_DIR, DESIGN, ANCHORS } = require("./compileKit");
const { COPY, applyCopy, stagePhoto } = require("./proofCover");
const catalogCaps = require("../catalogCaps");

const ROOT = path.join(__dirname, "..", "..", "..");
const OUT = path.join(ROOT, "docs", "template-pipeline", "composer", "gallery");
const PALETTE = (catalogCaps.ANCHORS || ANCHORS);

const FIXTURE = {
  title: "Payroll that stays out of the way",
  body: "Apex runs payroll, tax, and filings so finance teams close the books without weekend fire drills.",
  kicker: "APEX",
  bullets: [
    "Same-day corrections without reopening the whole run",
    "Tax filings stay aligned to every local jurisdiction",
    "Founders see cash impact before approving pay",
  ],
  stats: ["99.9%", "12d", "47%"],
  labels: ["On-time accuracy", "Median close", "Less admin time"],
  statement: "Payroll should disappear into the workday.",
  number: "99.9%",
  label: "On-time payroll accuracy",
  quote: "We stopped chasing payroll deadlines and started leading again.",
  attribution: "Jordan Lee, COO",
  items: ["Connect systems", "Configure pay", "Approve runs", "File taxes", "Review audits", "Scale hiring"],
  stepTitles: ["Connect", "Configure", "Run", "Review"],
  stepBodies: [
    "Link HRIS and bank details in a guided setup.",
    "Map pay codes, taxes, and approval chains once.",
    "Approve a preview and fund payroll with one click.",
    "Audit trails and filings stay ready for finance.",
  ],
  names: ["Alex Morgan", "Sam Rivera", "Casey Nguyen", "Riley Chen"],
  roles: ["Chief Executive Officer", "Head of Customer Success", "VP of Engineering", "Finance Partner"],
};

function paletteFor(bucket) {
  const { paletteFor: runtimePalette } = require("./composeRuntime");
  return runtimePalette(bucket);
}

function buildSlide(component, variant, fontPair, bucket, photoUrl) {
  const compiled = JSON.parse(fs.readFileSync(path.join(OUT_DIR, component + "-" + variant + "-" + fontPair + ".json"), "utf8"));
  const saved = Object.assign({}, COPY);
  Object.keys(FIXTURE).forEach((k) => { COPY[k] = FIXTURE[k]; });
  const elements = applyCopy(JSON.parse(JSON.stringify(compiled.layout.elements)), photoUrl, component);
  Object.keys(saved).forEach((k) => { COPY[k] = saved[k]; });
  const colors = paletteFor(bucket);
  const pair = FONT_PAIRS[fontPair];
  const layoutId = "slide-1";
  const deck = {
    schemaVersion: 2,
    id: "gallery-" + component + "-" + variant + "-" + bucket,
    name: component + " / " + variant,
    tokens: {
      color: colors,
      font: { display: pair.display, text: pair.text },
      type: { h1: 64, body: 22 },
    },
    layoutSequence: [layoutId],
    layouts: {
      [layoutId]: {
        version: 2,
        id: layoutId,
        canvas: { width: 1600, height: 900, aspectRatio: "16:9" },
        elements,
        stacks: compiled.layout.stacks || [],
      },
    },
  };
  applyParametric(deck, {
    prompt: "Apex Payroll gallery",
    title: FIXTURE.title,
    density: "balanced",
    skipCover: true,
    skipDensity: true,
    skipTypeContrast: true,
  });
  return deck;
}

function needsPhoto(component, variant, manifest) {
  const spec = (manifest.components || []).find((c) => c.id === component);
  if (!spec) return false;
  return (spec.photoSlots || []).some((slot) => {
    if (!slot.variants) return true;
    return slot.variants.indexOf(variant) >= 0;
  });
}

const LIBRARY = path.join(ROOT, "app-library");
const KEPT_SEEDS = [
  "dependent-and-independent-variables-lesson-for-middle-school",
  "first-aid-medicine-life-skills-presentation",
  "geometric-history-of-graphic-design-slides",
  "personal-trainer-portfolio-black-and-beige-modern-minimal-presentation",
  "pitch-deck-competitor-analysis-slides",
  "seo-competitor-analysis-slides",
];

function renderSeedEntries() {
  const seedEntries = [];
  KEPT_SEEDS.forEach((id) => {
    const file = path.join(LIBRARY, id + ".json");
    if (!fs.existsSync(file)) return;
    // Seed's own palette tokens; no theming.
    const painted = JSON.parse(fs.readFileSync(file, "utf8"));
    const sequence = painted.layoutSequence || Object.keys(painted.layouts || {});
    sequence.forEach((layoutId, index) => {
      const geometry = checkGeometry(painted, layoutId);
      const fileName = "seed__" + id + "__slide-" + String(index + 1).padStart(2, "0") + ".png";
      const outFile = path.join(OUT, fileName);
      renderSlidePng(painted, layoutId, outFile);
      seedEntries.push({
        kind: "seed",
        // Shape also fits curator Gallery tab (filters bucket === light-neutral).
        component: "seed",
        variant: id + " / slide " + (index + 1),
        bucket: "light-neutral",
        seed: id,
        slide: index + 1,
        layoutId,
        file: fileName,
        geometryPass: Boolean(geometry && geometry.pass),
        geometryReasons: (geometry && geometry.reasons) || [],
      });
      console.log("seed/" + id + "/slide-" + (index + 1) + " geo=" + (geometry && geometry.pass));
    });
  });
  return seedEntries;
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(DESIGN, "manifest.json"), "utf8"));
  safeClean(OUT);
  fs.mkdirSync(OUT, { recursive: true });
  const photoUrl = stagePhoto("generated-templates/photos/thematic/phase-3-payroll/landscape-01.jpg");
  const fontPair = "corp-calibri";
  const entries = [];
  const darkExtra = new Set(["cover", "divider", "big-number"]);

  for (const spec of manifest.components || []) {
    for (const variant of spec.variants || []) {
      const buckets = ["light-neutral"];
      if (darkExtra.has(spec.id)) buckets.push("dark-neutral");
      for (const bucket of buckets) {
        const photo = needsPhoto(spec.id, variant, manifest) ? photoUrl : "";
        const deck = buildSlide(spec.id, variant, fontPair, bucket, photo);
        const geometry = checkGeometry(deck, "slide-1");
        const fileName = spec.id + "__" + variant + "__" + bucket + ".png";
        const file = path.join(OUT, fileName);
        renderSlidePng(deck, "slide-1", file);
        entries.push({
          component: spec.id,
          variant,
          bucket,
          file: fileName,
          geometryPass: Boolean(geometry && geometry.pass),
          geometryReasons: (geometry && geometry.reasons) || [],
        });
        console.log(spec.id + "/" + variant + "/" + bucket + " geo=" + (geometry && geometry.pass));
      }
    }
  }

  const seedEntries = renderSeedEntries();
  const kitEntries = entries.slice();
  // Curator /api/admin/gallery only reads report.entries (light-neutral filter).
  seedEntries.forEach((e) => entries.push(e));
  const failed = kitEntries.filter((e) => !e.geometryPass);
  const seedFailed = seedEntries.filter((e) => !e.geometryPass);
  const html = [
    "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>Composer gallery</title>",
    "<style>body{font-family:Segoe UI,sans-serif;margin:24px;background:#f3f1ee;color:#1c1916}",
    "h1{font-size:28px} h2{font-size:22px;margin-top:36px} .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:20px}",
    "figure{margin:0} img{width:100%;height:auto;display:block;border:1px solid #d9d0c6}",
    "figcaption{padding:8px 0;font-size:13px} .fail{color:#8a1f1f}</style></head><body>",
    "<h1>Composer gallery (" + kitEntries.length + " kit · " + seedEntries.length + " seed slides)</h1>",
    "<p>corp-calibri · light-neutral (plus dark-neutral for cover, divider, big-number). Kit geometry fails: " + failed.length + ". Seed geometry fails: " + seedFailed.length + ".</p>",
    "<h2>Kit pieces</h2>",
    "<div class=\"grid\">",
  ];
  kitEntries.forEach((e) => {
    html.push(
      "<figure><img src=\"" + e.file + "\" alt=\"" + e.component + " " + e.variant + "\">" +
      "<figcaption class=\"" + (e.geometryPass ? "" : "fail") + "\">" +
      e.component + " / " + e.variant + " / " + e.bucket +
      " · geometry " + (e.geometryPass ? "pass" : "FAIL " + (e.geometryReasons || []).join(", ")) +
      "</figcaption></figure>"
    );
  });
  html.push("</div>");
  html.push("<h2>Seeds</h2><p>Kept seeds from app-library (own palette tokens, no theming).</p><div class=\"grid\">");
  seedEntries.forEach((e) => {
    html.push(
      "<figure><img src=\"" + e.file + "\" alt=\"" + e.seed + " slide " + e.slide + "\">" +
      "<figcaption class=\"" + (e.geometryPass ? "" : "fail") + "\">" +
      "seed / " + e.seed + " / slide " + e.slide +
      " · geometry " + (e.geometryPass ? "pass" : "FAIL " + (e.geometryReasons || []).join(", ")) +
      "</figcaption></figure>"
    );
  });
  html.push("</div></body></html>");
  fs.writeFileSync(path.join(OUT, "index.html"), html.join("\n") + "\n");
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify({
    count: kitEntries.length,
    seedCount: seedEntries.length,
    failed,
    seedFailed,
    entries,
    seedEntries,
  }, null, 2) + "\n");
  console.log(JSON.stringify({
    count: kitEntries.length,
    seedCount: seedEntries.length,
    failed: failed.length,
    seedFailed: seedFailed.length,
    out: path.relative(ROOT, OUT),
  }, null, 2));
}

function safeClean(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach((name) => {
    if (name === "flags.json") return;
    const p = path.join(dir, name);
    if (fs.statSync(p).isFile()) fs.unlinkSync(p);
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  });
}

module.exports = { main };
