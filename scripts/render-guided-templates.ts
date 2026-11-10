/**
 * Export five review decks using local cached sample photography (no API calls).
 * node -r ts-node/register/transpile-only scripts/render-guided-templates.ts
 * These are demonstration assets, not representations of the named sample people.
 */
import * as fs from "fs";
import * as path from "path";
import * as assert from "assert";
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "out", "guided-templates");
const { createCanvas, loadImage } = require("canvas");
const { validateDeckSpec } = require("../engine/validate");
const { selectAll } = require("../engine/selectVariant");
const { runGates } = require("../engine/gates");
const { renderDeckFromSpec, tokens } = require("../engine/render");
const { renderSlidePng, textWasClipped } = require("./slideSvg");
const { exportDeckPptx } = require("../services/templatePipeline/catalog");
const { assertEngineSchemas } = require("../engine/validateSchema");
const assets = {
  workplace: ["06deb5843eea613508512a10ae8b12dcb0435cdf.png","030052bf4adb2b2e2ccc29c2e9cc5b60db414442.png","07fef60a176fe808bce7b5e27be85558af722b78.png","00dc682cdd3d7d1949008bd04da15a74df169d7a.png","0746be1cf35916afd50fa2824fbcd5d89d8f5551.png","05913e2000d6707606fedb57ea842b82e04f0828.png","010f55d65d4f4b7de01647f0dd378e6b29a6faa2.png"],
  portraits: ["01bdf201e11b9209f8f27a5eebe968c4483558ba.png","01c1358c7bf81c1535a66cf06348673ad53648d4.png","101631d6fe5ee3246ddf5cb3c1686959af45523b.png","104868264fb55720c0ad9e736a094c6fa720fedb.png"],
};
async function grid(files: string[], file: string) {
  const cols = Math.min(3, files.length), rows = Math.ceil(files.length / cols);
  const canvas = createCanvas(cols * 480, rows * 294);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#202329"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < files.length; i++) {
    const image = await loadImage(files[i]);
    const x = i % cols * 480, y = Math.floor(i / cols) * 294;
    ctx.drawImage(image, x + 6, y + 6, 468, 263.25);
    ctx.fillStyle = "#FFFFFF"; ctx.font = "14px Segoe UI";
    ctx.fillText(path.basename(files[i], ".png"), x + 10, y + 287);
  }
  fs.writeFileSync(file, canvas.toBuffer("image/png"));
}
async function main() {
  assertEngineSchemas();
  fs.mkdirSync(OUT, { recursive: true });
  const catalog: any[] = [];
  for (const file of fs.readdirSync(path.join(ROOT, "examples", "design-guides")).filter((f) => f.endsWith(".json"))) {
    const id = path.basename(file, ".json");
    const spec = JSON.parse(fs.readFileSync(path.join(ROOT, "examples", "design-guides", file), "utf8"));
    const valid = validateDeckSpec(spec);
    assert.ok(valid.ok, JSON.stringify(valid.errors));
    const selections = selectAll(spec, "guided-sample-" + id);
    const gates = runGates(spec, selections, tokens);
    assert.ok(gates.pass, JSON.stringify(gates.slides.filter((s: any) => !s.pass)));
    const dir = path.join(OUT, id);
    fs.mkdirSync(dir, { recursive: true });
    let photoIndex = 0, portraitIndex = 0;
    const photoResolver = async (query: string) => {
      const portrait = /headshot/.test(query);
      const pool = portrait ? assets.portraits : assets.workplace;
      const index = portrait ? portraitIndex++ : photoIndex++;
      const name = pool[index % pool.length];
      const photo = path.join(ROOT, "engine", "cache", "photos", name);
      if (!fs.existsSync(photo)) throw new Error("Missing local sample asset: " + photo);
      return { path: photo, pexelsId: "local-demo:" + name };
    };
    const deck = await renderDeckFromSpec(spec, selections, { id: "guided-" + id, photoResolver });
    deck.name = id.replace(/-/g, " ");
    const previews: string[] = [];
    const clipped: string[] = [];
    deck.layoutSequence.forEach((lid: string, i: number) => {
      const layout = deck.layouts[lid];
      assert.strictEqual(layout.kitId, selections[i].role + "/" + selections[i].variant);
      for (const e of layout.elements) {
        if (e.type === "text" && textWasClipped(e, deck.tokens)) clipped.push(lid + "/" + e.id);
        if (e.type === "text") assert.ok(!e.textContent.spans.some((s: any) => /…/.test(s.text)), "Truncated content: " + lid + "/" + e.id);
      }
      const preview = path.join(dir, String(i + 1).padStart(2, "0") + "-" + layout.variant + ".png");
      const warnings = renderSlidePng(deck, lid, preview);
      assert.deepStrictEqual(warnings, [], "Preview warnings: " + warnings.join(", "));
      previews.push(preview);
    });
    assert.deepStrictEqual(clipped, [], "Preview text clipped: " + clipped.join(", "));
    const pptx = path.join(dir, "template.pptx");
    await exportDeckPptx(deck, pptx);
    fs.writeFileSync(path.join(dir, "deck.json"), JSON.stringify(deck, null, 2));
    await grid(previews, path.join(dir, "preview.png"));
    catalog.push({ id, slideCount: previews.length, sequence: spec.style.sequence,
      kits: selections.map((s: any) => s.role + "/" + s.variant),
      pptx: path.relative(ROOT, pptx).replace(/\\/g, "/"),
      preview: path.relative(ROOT, path.join(dir, "preview.png")).replace(/\\/g, "/"),
      clipping: clipped, demoContent: true, photography: "Local cached demonstration assets; sample names and affiliations are fictional." });
    console.log("Exported " + id + ": " + previews.length + " slides.");
  }
  fs.writeFileSync(path.join(OUT, "catalog.json"), JSON.stringify({ templates: catalog }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
