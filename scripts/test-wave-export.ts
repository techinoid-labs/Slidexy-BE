import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
const { renderDeckFromSpec } = require("../engine/render");
const { exportDeckPptx } = require("../services/templatePipeline/catalog");
const JSZip = require("jszip");

async function main() {
  const spec = { style: {palette:"ink-night",typePair:"modern-segoe",motif:"bar-accent"}, slides: [{ role: "cover", title: "Wave regression", items: ["Editable text"] }] };
  const deck = await renderDeckFromSpec(spec, [{ role: "cover", variant: "rolling-wave" }], { id: "wave-test" });
  const layout = deck.layouts[deck.layoutSequence[0]];
  assert.equal(layout.elements.find(e => e.id === "wave").shapeContent.kind, "wave");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "slidexy-wave-test-"));
  const file = path.join(dir, "test.pptx");
  let buffer: Buffer;
  try {
    await exportDeckPptx(deck, file);
    buffer = fs.readFileSync(file);
  } finally {
    if (fs.existsSync(file)) fs.unlinkSync(file);
    fs.rmdirSync(dir);
  }
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file("ppt/slides/slide1.xml").async("string");
  assert.equal((xml.match(/<a:custGeom>/g) || []).length, 1);
  assert.equal((xml.match(/<a:cubicBezTo>/g) || []).length, 10);
  assert.match(xml, /path="M 0 0 L -0\.25 0 E"/);
  assert.match(xml, /dur="8000" accel="0" decel="0" repeatCount="indefinite"/);
  assert.doesNotMatch(xml, /autoRev="1"/);
  assert.match(xml, /<a:t>Wave regression<\/a:t>/);
  assert.match(xml, /<a:t>Editable text<\/a:t>/);
  assert.equal(Object.keys(zip.files).filter(n => /^ppt\/media\//.test(n) && !zip.files[n].dir).length, 0);
  console.log("Wave export passed: native geometry, linear loop, editable text, no media.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
