/**
 * Emits PNG + PPTX per kit variant with placeholder content.
 * node -r ts-node/register/transpile-only scripts/kit-gallery.ts
 */
const fs = require("fs");
const path = require("path");
const { renderDeckFromSpec } = require("../engine/render");
const { renderSlidePng } = require("./slideSvg");
const { exportDeckPptx } = require("../services/templatePipeline/catalog");

const ROOT = path.join(__dirname, "..");
const KIT = path.join(ROOT, "kit");
const OUT = path.join(ROOT, "out", "gallery");

function placeholderSpec(role: string, variant: string): any {
  return {
    style: {
      palette: "slate-light",
      typePair: "technical-sans",
      imageTreatment: "full-bleed",
      motif: "bar-accent",
    },
    slides: [
      {
        role,
        variantHint: variant,
        title: role.replace(/-/g, " "),
        body: ["Fragment one", "Fragment two", "Fragment three", "Fragment four"],
        stat: "98%",
        caption: "Placeholder caption line",
        photoQuery: "abstract architectural texture",
        photoOrientation: "landscape",
      },
    ],
  };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const roles = fs.readdirSync(KIT).filter((n: string) => fs.statSync(path.join(KIT, n)).isDirectory() && n !== "families");
  const results: string[] = [];
  for (const role of roles) {
    for (const variant of ["a", "b"]) {
      const file = path.join(KIT, role, variant + ".json");
      if (!fs.existsSync(file)) continue;
      const id = role + "-" + variant;
      const dir = path.join(OUT, id);
      fs.mkdirSync(dir, { recursive: true });
      const spec = placeholderSpec(role, variant);
      const deck = await renderDeckFromSpec(spec, [{ role, variant }], { id: "gallery-" + id });
      fs.writeFileSync(path.join(dir, "deck.json"), JSON.stringify(deck, null, 2));
      const layoutId = deck.layoutSequence[0];
      const png = path.join(dir, "slide.png");
      renderSlidePng(deck, layoutId, png);
      const pptx = path.join(dir, "slide.pptx");
      await exportDeckPptx(deck, pptx);
      results.push(id);
      console.log("gallery", id, fs.statSync(png).size, fs.statSync(pptx).size);
    }
  }
  fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(results, null, 2));
  console.log("total", results.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
