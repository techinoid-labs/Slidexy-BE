/**
 * OOXML snapshot test — Nexus Cover (cover/brutalist) golden slide1.xml
 * Compares <p:transition> and <p:timing> blocks (ignores image blips / ids churn).
 *
 *   node -r ts-node/register/transpile-only scripts/ooxml-snapshot-test.ts
 *   UPDATE_GOLDEN=1 node -r ts-node/register/transpile-only scripts/ooxml-snapshot-test.ts
 */
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const JSZip = require("jszip");

require("ts-node/register/transpile-only");
require("../services/templatePipeline/fonts");

const { selectAll } = require("../engine/selectVariant");
const { renderDeckFromSpec } = require("../engine/render");
const { expandMotionScenes } = require("../engine/motion");
const { exportDeckPptx } = require("../services/templatePipeline/catalog");
const { assertEngineSchemas } = require("../engine/validateSchema");

const ROOT = path.join(__dirname, "..");
const GOLDEN_DIR = path.join(ROOT, "fixtures", "golden", "nexus-cover");
const GOLDEN_FILE = path.join(GOLDEN_DIR, "slide1.motion.xml");

function extractMotionBlocks(slideXml: string) {
  const transition = (slideXml.match(/<p:transition\b[\s\S]*?<\/p:transition>/) || [""])[0];
  const timing = (slideXml.match(/<p:timing\b[\s\S]*?<\/p:timing>/) || [""])[0];
  return normalizeMotion(transition + "\n" + timing);
}

function normalizeMotion(xml: string) {
  return String(xml || "")
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .replace(/> </g, "><")
    .replace(/id="\d+"/g, 'id="N"')
    .replace(/spid="\d+"/g, 'spid="N"')
    .trim();
}

async function buildNexusCoverPptx(tmpDir: string) {
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
        caption: "Play. Compete. Belong.",
        photoQuery: "neon gaming lounge interior night",
        photoOrientation: "landscape",
        transition: "fade",
      },
    ],
  };
  const selections = [{ role: "cover", variant: "brutalist" }];
  let deck = await renderDeckFromSpec(spec, selections, { id: "nexus-cover-snapshot" });
  deck.name = "Nexus Cover Snapshot";
  deck = expandMotionScenes(deck, {
    morph: true,
    ambient: true,
    cameraPan: true,
    scatter: false,
    parallaxScale: 1.28,
    defaultTransition: "fade",
  });
  const pptxPath = path.join(tmpDir, "nexus-cover.pptx");
  await exportDeckPptx(deck, pptxPath);
  return pptxPath;
}

async function main() {
  console.log("schema gate…");
  const schema = assertEngineSchemas();
  console.log("  kits", schema.checked, "locked", schema.locked.join(", "));

  fs.mkdirSync(GOLDEN_DIR, { recursive: true });
  const tmpDir = path.join(ROOT, "out", "snapshots");
  fs.mkdirSync(tmpDir, { recursive: true });

  const pptxPath = await buildNexusCoverPptx(tmpDir);
  const zip = await JSZip.loadAsync(fs.readFileSync(pptxPath));
  // Camera pan expands cover → slide1 start, slide2 morph dest. Snapshot the Morph destination timing.
  const slide1 = await zip.file("ppt/slides/slide1.xml").async("string");
  const slide2 = zip.file("ppt/slides/slide2.xml")
    ? await zip.file("ppt/slides/slide2.xml").async("string")
    : "";
  const motionXml = extractMotionBlocks(slide1) + "\n---\n" + extractMotionBlocks(slide2);

  if (process.env.UPDATE_GOLDEN === "1" || !fs.existsSync(GOLDEN_FILE)) {
    fs.writeFileSync(GOLDEN_FILE, motionXml);
    console.log("wrote golden", path.relative(ROOT, GOLDEN_FILE));
  }

  const golden = fs.readFileSync(GOLDEN_FILE, "utf8").trim();
  const got = motionXml.trim();
  assert.strictEqual(
    got,
    golden,
    "Nexus Cover OOXML motion snapshot mismatch — transition/timing changed unexpectedly.\n" +
      "If intentional, re-run with UPDATE_GOLDEN=1"
  );

  // Sanity: ambient/entrance easing markers present on at least one slide
  const combined = slide1 + slide2;
  assert.ok(/accel="50000"|accel="100000"/.test(combined), "missing accel easing");
  assert.ok(/decel="50000"|decel="100000"/.test(combined), "missing decel easing");

  console.log("ooxml-snapshot-test PASSED");
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
