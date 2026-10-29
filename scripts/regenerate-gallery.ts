/**
 * Rebuild all 20 gallery PNG+PPTX from kit JSON (source of truth).
 * node -r ts-node/register/transpile-only scripts/regenerate-gallery.ts
 */
const fs = require("fs");
const path = require("path");
const { renderDeckFromSpec } = require("../engine/render");
const { renderSlidePng } = require("./slideSvg");
const { exportDeckPptx } = require("../services/templatePipeline/catalog");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "out", "gallery");
const ROLES = [
  "cover",
  "agenda",
  "problem",
  "solution",
  "how-it-works",
  "feature",
  "stats",
  "testimonial",
  "team",
  "closing",
];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const role of ROLES) {
    for (const variant of ["a", "b"]) {
      const id = role + "-" + variant;
      const dir = path.join(OUT, id);
      fs.mkdirSync(dir, { recursive: true });
      const spec = {
        style: {
          palette: "slate-light",
          typePair: "corp-calibri",
          imageTreatment: "full-bleed",
          motif: "bar-accent",
        },
        slides: [
          {
            role,
            title: role.replace(/-/g, " "),
            body: ["Fragment one", "Fragment two", "Fragment three", "Fragment four"],
            stat: "98%",
            caption: "Placeholder caption line",
            photoQuery: "abstract architectural texture",
            photoOrientation: "landscape",
          },
        ],
      };
      const deck = await renderDeckFromSpec(spec, [{ role, variant }], { id: "gallery-" + id });
      fs.writeFileSync(path.join(dir, "deck.json"), JSON.stringify(deck, null, 2));
      renderSlidePng(deck, deck.layoutSequence[0], path.join(dir, "slide.png"));
      await exportDeckPptx(deck, path.join(dir, "slide.pptx"));
      console.log("gallery", id);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
