/**
 * Ambient Motion test deck — Pulse / Float / Ken Burns / Teeter (one loop per slide).
 * node -r ts-node/register/transpile-only scripts/generate-ambient-deck.ts
 */
const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");

require("ts-node/register/transpile-only");
require("../services/templatePipeline/fonts");

const { selectAll } = require("../engine/selectVariant");
const { runGates } = require("../engine/gates");
const { renderDeckFromSpec, tokens } = require("../engine/render");
const { expandMotionScenes } = require("../engine/motion");
const { exportDeckPptx } = require("../services/templatePipeline/catalog");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "out", "motion");

const spec = {
  style: {
    palette: "charcoal-ember",
    typePair: "slab-rockwell",
    imageTreatment: "tint",
    motif: "bar-accent",
  },
  slides: [
    {
      role: "cover",
      variantHint: "brutalist",
      title: "Nexus",
      caption: "Ambient loops — alive on screen",
      photoQuery: "neon gaming lounge interior night",
      photoOrientation: "landscape",
      transition: "fade",
    },
    {
      role: "testimonial",
      variantHint: "a",
      title: "Member nights",
      body: ["Best lounge in town", "— Alex, weekly regular"],
      photoQuery: "esports arena crowd lights",
      photoOrientation: "landscape",
      transition: "fade",
    },
    {
      role: "stats",
      variantHint: "c",
      title: "Pulse",
      stats: [
        { value: "120+", label: "active PCs" },
        { value: "24", label: "weekly events" },
        { value: "4.9", label: "member rating" },
      ],
      transition: "wipe",
    },
    {
      role: "feature",
      variantHint: "a",
      title: "Float accent",
      body: ["Ambient path on the motif bar", "Soft 8s circle"],
      photoQuery: "gaming pc tower rgb fans",
      photoOrientation: "landscape",
      transition: "push",
    },
    {
      role: "feature",
      variantHint: "isometric",
      title: "Teeter card",
      body: ["Isometric image-card", "±2° indefinite teeter"],
      photoQuery: "private booth pc gaming lounge",
      photoOrientation: "landscape",
      transition: "fade",
    },
    {
      role: "closing",
      title: "Stay awhile",
      body: ["Open late", "nexus.example"],
      photoQuery: "gaming lounge neon entrance night",
      photoOrientation: "landscape",
      transition: "fade",
    },
  ],
};

async function auditAmbient(pptxPath: string, deck: any) {
  const buf = fs.readFileSync(pptxPath);
  const zip = await JSZip.loadAsync(buf);
  const slides = Object.keys(zip.files)
    .filter((n) => /ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => parseInt(a.match(/slide(\d+)/)[1], 10) - parseInt(b.match(/slide(\d+)/)[1], 10));

  const report = [];
  for (let i = 0; i < slides.length; i++) {
    const name = slides[i];
    const xml = await zip.file(name).async("string");
    const lid = deck.layoutSequence[i];
    const layout = deck.layouts[lid] || {};
    const ambient = (layout.motion && layout.motion.ambient) || null;
    const accelVals = Array.from(new Set((xml.match(/accel="(\d+)"/g) || []).map((s) => s.replace(/\D/g, ""))));
    const decelVals = Array.from(new Set((xml.match(/decel="(\d+)"/g) || []).map((s) => s.replace(/\D/g, ""))));
    const delays = (xml.match(/<p:cond delay="(\d+)"\/>/g) || [])
      .map((s) => Number((s.match(/delay="(\d+)"/) || [])[1]))
      .filter((n) => n > 0);
    report.push({
      slide: name,
      layoutId: lid,
      role: layout.role,
      variant: layout.variant,
      ambient,
      hasTiming: /<p:timing/.test(xml),
      indefinite: /repeatCount="indefinite"/.test(xml),
      accelValues: accelVals,
      decelValues: decelVals,
      accel50k: /accel="50000"/.test(xml),
      accel100k: /accel="100000"/.test(xml),
      decel50k: /decel="50000"/.test(xml),
      decel100k: /decel="100000"/.test(xml),
      staggerDelays: delays,
      fadeUp: /path="M 0 0\.02222 L 0 0"/.test(xml) || /path="M 0 0\.022/.test(xml),
      wipeRight: /wipe\(right\)/.test(xml),
      zoomSettle: /from x="105000"/.test(xml),
      animEffect: /<p:animEffect/.test(xml),
      animMotion: /<p:animMotion/.test(xml),
      animScale: /<p:animScale/.test(xml),
      clickEffect: /clickEffect/.test(xml),
      morphNames: (xml.match(/!!morph:[a-zA-Z0-9_-]+/g) || []).slice(0, 12),
    });
  }
  return report;
}

function writeAuditMarkdown(report: any[], deck: any, pptxPath: string) {
  const loops = (deck.engine && deck.engine.motion && deck.engine.motion.ambientLoops) || [];
  const lines = [];
  lines.push("# Premium Motion Smoothing Audit");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`PPTX: \`${path.relative(ROOT, pptxPath).replace(/\\/g, "/")}\``);
  lines.push("");
  lines.push("## Smoothing rules");
  lines.push("");
  lines.push("| Rule | Value | Purpose |");
  lines.push("|------|-------|---------|");
  lines.push("| Entrance ease | `accel=\"50000\"` `decel=\"50000\"` | Ease-in-out on finite anims |");
  lines.push("| Ambient ease | `accel=\"100000\"` `decel=\"100000\"` | Full smoothness on loops |");
  lines.push("| Stagger | `delay=\"200\"` (+200ms / line) | Waterfall text / list entrances |");
  lines.push("| Presets | `fadeUp` · `wipeRight` · `zoomSettle` | Premium library |");
  lines.push("| Morph isolation | text + accent only | Images left to Morph |");
  lines.push("| Shadowed pics | ambient retarget / skip | Prevents detached shadows |");
  lines.push("");
  lines.push("## Per-slide accel / decel / delay");
  lines.push("");
  lines.push("| Slide | Role | Ambient | accel | decel | stagger delays (ms) | Presets hit |");
  lines.push("|------:|------|---------|-------|-------|---------------------|-------------|");
  report.forEach((r, idx) => {
    const a = r.ambient ? r.ambient.effect : "—";
    const accel = (r.accelValues || []).join(",") || "—";
    const decel = (r.decelValues || []).join(",") || "—";
    const delays = (r.staggerDelays || []).length ? (r.staggerDelays || []).join(", ") : "—";
    const presets = [
      r.fadeUp ? "fadeUp" : null,
      r.wipeRight ? "wipeRight" : null,
      r.zoomSettle ? "zoomSettle" : null,
      r.animMotion && a === "kenBurns" ? "kenBurns-pan" : null,
      r.animMotion && a === "float" ? "float-y" : null,
      r.animScale && a === "pulse" ? "pulse" : null,
    ]
      .filter(Boolean)
      .join(", ");
    lines.push(
      `| ${idx + 1} | ${r.role}/${r.variant || "—"} | ${a} | ${accel} | ${decel} | ${delays} | ${presets || "—"} |`
    );
  });
  lines.push("");
  lines.push("## Loops applied");
  lines.push("");
  lines.push("| Slide | Effect | Target | Duration |");
  lines.push("|------:|--------|--------|----------|");
  report.forEach((r, idx) => {
    const a = r.ambient;
    if (!a) {
      lines.push(`| ${idx + 1} | — | — | — |`);
      return;
    }
    lines.push(`| ${idx + 1} | **${a.effect}** | \`!!morph:${a.morphId}\` | ${a.durationMs}ms |`);
  });
  lines.push("");
  lines.push("## OOXML checks");
  lines.push("");
  report.forEach((r, idx) => {
    lines.push(
      `- Slide ${idx + 1}: timing=${r.hasTiming} indefinite=${r.indefinite} accel50k=${r.accel50k} accel100k=${r.accel100k} decel50k=${r.decel50k} decel100k=${r.decel100k} clickEffect=${r.clickEffect}`
    );
  });
  lines.push("");
  lines.push("## engine.motion.ambientLoops");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(loops, null, 2));
  lines.push("```");
  lines.push("");
  return lines.join("\n");
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const seed = "ambient-engine|charcoal-ember|slab-rockwell";
  const selections = selectAll(spec, seed);
  spec.slides.forEach((slide: any, i: number) => {
    if (slide.variantHint) selections[i] = { role: slide.role, variant: slide.variantHint };
  });
  const gates = runGates(spec, selections, tokens, "Pitch");
  let deck = await renderDeckFromSpec(spec, selections, { id: "ambient-nexus" });
  deck.name = "Nexus — Ambient Motion";

  deck.layoutSequence.forEach((lid: string, i: number) => {
    const slide = spec.slides[i];
    if (slide && slide.transition && deck.layouts[lid]) {
      deck.layouts[lid].motion = Object.assign({}, deck.layouts[lid].motion, {
        transition: slide.transition,
        durationMs: 800,
      });
    }
  });

  deck = expandMotionScenes(deck, {
    morph: false,
    ambient: true,
    cameraPan: false,
    scatter: false,
    defaultTransition: "fade",
  });

  // Ensure ambient flag survived morph:false early path
  deck.engine = deck.engine || {};
  deck.engine.motion = Object.assign({}, deck.engine.motion, { ambient: true, morph: false });
  const { applyAmbientToDeck } = require("../engine/ambient");
  applyAmbientToDeck(deck);

  let pptxPath = path.join(OUT, "ambient-motion-deck.pptx");
  try {
    await exportDeckPptx(deck, pptxPath);
  } catch (err: any) {
    if (err && (err.code === "EBUSY" || err.code === "EPERM")) {
      pptxPath = path.join(OUT, "ambient-motion-deck-fixed.pptx");
      console.warn("Primary PPTX locked; writing", pptxPath);
      await exportDeckPptx(deck, pptxPath);
    } else {
      throw err;
    }
  }
  const report = await auditAmbient(pptxPath, deck);

  fs.writeFileSync(path.join(OUT, "ambient-deck.json"), JSON.stringify(deck, null, 2));
  fs.writeFileSync(path.join(OUT, "ambient-audit.json"), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(OUT, "motion-audit.md"), writeAuditMarkdown(report, deck, pptxPath));
  fs.writeFileSync(path.join(OUT, "ambient-gates.json"), JSON.stringify(gates, null, 2));

  console.log("sequence", deck.layoutSequence);
  console.log(
    "ambientLoops",
    (deck.engine.motion.ambientLoops || []).map((l: any) => ({
      slide: l.slideIndex,
      effect: l.effect,
      path: l.path,
      target: l.morphId,
      durationMs: l.durationMs,
      containerScale: l.containerScale,
    }))
  );
  console.log("pptx", pptxPath);
  console.log("audit", path.join(OUT, "motion-audit.md"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
