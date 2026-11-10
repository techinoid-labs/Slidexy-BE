/** Regression coverage for guide sequence selection and dynamic rendering contracts. */
import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
const { validateDeckSpec } = require("./validate");
const { selectAll } = require("./selectVariant");
const { renderDeckFromSpec, slotText } = require("./render");
const { validateKitObject } = require("./validateSchema");
const catalog = require("./design-guide-catalog.json");
async function main() {
  assert.strictEqual(catalog.entries.length, 16);
  assert.strictEqual(catalog.sequences.length, 5);
  for (const entry of catalog.entries) {
    const kit = require("../kit/" + entry.kitId + ".json");
    validateKitObject(kit);
    assert.strictEqual(kit.preserveLayout, true);
    assert.strictEqual(kit.status, "draft");
  }
  const root = path.join(__dirname, "..");
  const photo = path.join(root, "engine/cache/photos/06deb5843eea613508512a10ae8b12dcb0435cdf.png");
  assert.ok(fs.existsSync(photo), "Run with the local sample photo cache available");
  const photoResolver = async () => ({ path: photo, pexelsId: "local-regression" });
  for (const sequence of catalog.sequences) {
    const name = sequence.id.slice("guide-".length);
    const spec = JSON.parse(fs.readFileSync(path.join(root, "examples/design-guides", name + ".json"), "utf8"));
    const valid = validateDeckSpec(spec);
    assert.ok(valid.ok, JSON.stringify(valid.errors));
    const selections = selectAll(spec, "regression");
    assert.deepStrictEqual(selections.map((s: any) => s.variant), sequence.beats.map((b: any) => b.variant));
    const deck = await renderDeckFromSpec(spec, selections, { photoResolver });
    deck.layoutSequence.forEach((id: string, i: number) => {
      const layout = deck.layouts[id];
      const kit = require("../kit/" + layout.kitId + ".json");
      const expected = kit.layout.elements.find((e: any) => e.id === "title");
      const actual = layout.elements.find((e: any) => e.id === "title");
      assert.strictEqual(actual.x, expected.x, "Header primitive must not move guide geometry");
      assert.strictEqual(actual.y, expected.y);
      assert.strictEqual(actual.textStyle.fontWeight, 300);
      if (selections[i].variant === "ref-photo-progress") {
        const track = layout.elements.find((e: any) => e.id === "track-1");
        const fill = layout.elements.find((e: any) => e.id === "fill-1");
        assert.ok(Math.abs(fill.width / track.width - 0.8) < 0.0001);
      }
    });
  }
  assert.strictEqual(slotText({ items: ["a","b","c","d","e","f","g","h"] }, "items7"), "h");
  const zero: any = { style: { palette: "ink-night", typePair: "modern-segoe", motif: "bar-accent", imageTreatment: "full-bleed" }, slides: [{ role: "report", title: "Progress", variantHint: "ref-photo-progress", stats: [{value:"0%",label:"A"},{value:"50%",label:"B"},{value:"100%",label:"C"}], body:["A short project update."] }] };
  const selections = selectAll(zero, "zero");
  const rendered = await renderDeckFromSpec(zero, selections, { photoResolver });
  const elements = rendered.layouts[rendered.layoutSequence[0]].elements;
  assert.strictEqual(elements.find((e: any) => e.id === "fill-0").width, 0);
  assert.strictEqual(elements.find((e: any) => e.id === "fill-2").width, elements.find((e: any) => e.id === "track-2").width);
  for (const value of ["101%", "-1%", "NaN", "50"]) {
    zero.slides[0].stats[0].value = value;
    await assert.rejects(() => renderDeckFromSpec(zero, selections, { photoResolver }), /must be a percentage/);
  }
  zero.slides[0].variantHint = "ref-nonexistent";
  assert.strictEqual(validateDeckSpec(zero).ok, false);
  console.log("PASS: 16 kits, five sequences, preserved geometry/weight, eighth agenda item, progress 0/50/100 and invalid input rejection.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
