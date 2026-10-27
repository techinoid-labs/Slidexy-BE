/**
 * Golden PPTX slide XML for phase-3-payroll (catalog.js regression).
 * 1) Stripped fields → fixtures/golden/phase-3-payroll (guard identity)
 * 2) Unstripped deck → fixtures/golden/phase-3-payroll-unstripped (real-deck catch)
 *
 *   node services/templatePipeline/catalogGolden.test.js
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const assert = require("assert");
const JSZip = require("jszip");
const { exportDeckPptx } = require("./catalog");

const ROOT = path.join(__dirname, "..", "..");
const DECK = path.join(ROOT, "docs", "template-pipeline", "merge", "phase-3-payroll", "deck.json");
const GOLDEN = path.join(__dirname, "fixtures", "golden", "phase-3-payroll");
const GOLDEN_UNSTRIPPED = path.join(__dirname, "fixtures", "golden", "phase-3-payroll-unstripped");

function normalize(xml) {
  return String(xml || "")
    .replace(/\r\n/g, "\n")
    .replace(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/g, "TIMESTAMP")
    .replace(/rId\d+/g, "rIdN")
    .replace(/image-\d+-\d+\./g, "image-N-N.")
    .replace(/id="\d+"/g, 'id="N"');
}

function stripFidelityFields(deck) {
  const clone = JSON.parse(JSON.stringify(deck));
  Object.values(clone.layouts || {}).forEach((layout) => {
    (layout.elements || []).forEach((el) => {
      if (el.textStyle && el.textStyle.lineHeight != null) delete el.textStyle.lineHeight;
      const content = el.imageContent || el.maskedImageContent;
      if (!content) return;
      if (content.alignX != null) delete content.alignX;
      if (content.alignY != null) delete content.alignY;
    });
  });
  return clone;
}

async function compareExport(deck, goldenDir, label) {
  assert.ok(fs.existsSync(goldenDir), "golden dir missing: " + goldenDir);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "catalog-golden-"));
  const pptxPath = path.join(tmp, "deck.pptx");
  await exportDeckPptx(deck, pptxPath);
  const zip = await JSZip.loadAsync(fs.readFileSync(pptxPath));
  const names = Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => {
    const na = Number((a.match(/slide(\d+)/) || [])[1] || 0);
    const nb = Number((b.match(/slide(\d+)/) || [])[1] || 0);
    return na - nb;
  });
  assert.ok(names.length > 0, "no slide xml in pptx (" + label + ")");
  const goldenFiles = fs.readdirSync(goldenDir).filter((n) => /^slide\d+\.xml$/.test(n)).sort((a, b) => {
    const na = Number((a.match(/slide(\d+)/) || [])[1] || 0);
    const nb = Number((b.match(/slide(\d+)/) || [])[1] || 0);
    return na - nb;
  });
  assert.strictEqual(names.length, goldenFiles.length, label + " slide count mismatch");
  for (let i = 0; i < names.length; i += 1) {
    const base = path.basename(names[i]);
    const got = normalize(await zip.file(names[i]).async("string"));
    const want = normalize(fs.readFileSync(path.join(goldenDir, base), "utf8"));
    assert.strictEqual(got, want, label + " mismatch " + base);
  }
  return names.length;
}

async function run() {
  assert.ok(fs.existsSync(DECK), "phase-3-payroll deck missing");
  const raw = JSON.parse(fs.readFileSync(DECK, "utf8"));
  const n1 = await compareExport(stripFidelityFields(raw), GOLDEN, "stripped");
  const n2 = await compareExport(raw, GOLDEN_UNSTRIPPED, "unstripped");
  console.log("catalogGolden test passed (stripped " + n1 + ", unstripped " + n2 + ")");
}

run().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
