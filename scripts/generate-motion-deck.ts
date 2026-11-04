/**
 * Motion Engine test deck — Camera Pan + Scatter Morph + classic entrances + transitions.
 * node -r ts-node/register/transpile-only scripts/generate-motion-deck.ts
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
const { renderSlidePng } = require("./slideSvg");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "out", "motion");

const spec = {
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
      caption: "Motion-ready lounge pitch",
      photoQuery: "neon gaming lounge interior night",
      photoOrientation: "landscape",
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
};

async function auditMotion(pptxPath: string) {
  const buf = fs.readFileSync(pptxPath);
  const zip = await JSZip.loadAsync(buf);
  const slides = Object.keys(zip.files)
    .filter((n) => /ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => parseInt(a.match(/slide(\d+)/)[1], 10) - parseInt(b.match(/slide(\d+)/)[1], 10));
  const report = [];
  for (const name of slides) {
    const xml = await zip.file(name).async("string");
    report.push({
      slide: name,
      morph: /p159:morph/.test(xml),
      fade: /<p:fade\/>/.test(xml),
      push: /<p:push/.test(xml),
      wipe: /<p:wipe/.test(xml),
      timing: /<p:timing/.test(xml),
      fadeIn: /presetID="10"/.test(xml),
      flyIn: /presetID="2"/.test(xml),
      zoomIn: /presetID="53"/.test(xml),
      morphNames: (xml.match(/!!morph:[a-zA-Z0-9_-]+/g) || []).slice(0, 12),
      depth: /depth:1/.test(xml) || /outerShdw/.test(xml),
    });
  }
  return report;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const seed = "motion-engine|charcoal-ember|slab-rockwell";
  const selections = selectAll(spec, seed);
  spec.slides.forEach((slide: any, i: number) => {
    if (slide.variantHint) selections[i] = { role: slide.role, variant: slide.variantHint };
  });
  const gates = runGates(spec, selections, tokens, "Pitch");
  let deck = await renderDeckFromSpec(spec, selections, { id: "motion-nexus" });
  deck.name = "Nexus — Motion Engine";

  // Stamp per-slide transition hints from DeckSpec before expand
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
    morph: true,
    cameraPan: true,
    scatter: true,
    parallaxScale: 1.28,
    parallaxTextShift: 0.05,
    durationMs: 2000,
    defaultTransition: "fade",
    // Role-default entrances (fadeIn / flyInFromBottom / zoomIn) applied in motionOoxml
  });

  // Re-apply non-morph transitions from original slide roles after expand
  deck.layoutSequence.forEach((lid: string) => {
    const layout = deck.layouts[lid];
    if (!layout || layout.morphKeyframe) return;
    const match = spec.slides.find((s: any) => s.role === layout.role && s.transition);
    if (match && match.transition) {
      layout.motion = Object.assign({}, layout.motion, {
        transition: match.transition,
        durationMs: 800,
      });
    }
  });

  fs.writeFileSync(path.join(OUT, "deckspec.json"), JSON.stringify(spec, null, 2));
  fs.writeFileSync(path.join(OUT, "deck.json"), JSON.stringify(deck, null, 2));
  fs.writeFileSync(path.join(OUT, "gates.json"), JSON.stringify(gates, null, 2));
  fs.writeFileSync(
    path.join(OUT, "selections.json"),
    JSON.stringify(
      {
        selections: selections.map((s: any) => s.role + "/" + s.variant),
        sequence: deck.layoutSequence,
        motion: deck.engine && deck.engine.motion,
      },
      null,
      2
    )
  );

  for (let i = 0; i < deck.layoutSequence.length; i++) {
    const lid = deck.layoutSequence[i];
    const layout = deck.layouts[lid];
    const badge =
      (layout.motion && layout.motion.transition) ||
      (layout.morphDestination ? "morph" : layout.morphKeyframe === "start" ? "keyframe" : "none");
    try {
      renderSlidePng(
        deck,
        lid,
        path.join(OUT, "slide-" + String(i + 1).padStart(2, "0") + "-" + badge + ".png")
      );
    } catch (err: any) {
      console.warn("png", lid, err && err.message);
    }
  }

  const pptxPath = path.join(OUT, "motion-engine-deck.pptx");
  await exportDeckPptx(deck, pptxPath);
  const audit = await auditMotion(pptxPath);
  fs.writeFileSync(path.join(OUT, "motion-audit.json"), JSON.stringify(audit, null, 2));

  console.log("sequence", deck.layoutSequence);
  console.log("pptx", pptxPath);
  console.log(
    "audit",
    audit.map((a) => ({
      s: a.slide,
      morph: a.morph,
      fade: a.fade,
      push: a.push,
      wipe: a.wipe,
      timing: a.timing,
    }))
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
