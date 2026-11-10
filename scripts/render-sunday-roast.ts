import * as fs from "fs";
import * as path from "path";
const { renderDeckFromSpec } = require("../engine/render");
const { renderSlidePng } = require("./slideSvg");
const { exportDeckPptx } = require("../services/templatePipeline/catalog");
const { createCanvas, loadImage } = require("canvas");

const ROOT = path.join(__dirname, "..");

async function main() {
  const editions = ["citrus-almanac", "after-hours", "open-volume", "loom-register", "quay-line", "atelier-form", "signal-orange", "tidal-lab", "night-market", "offset-studio", "form-space"];
  const edition = editions.find(id => process.argv.includes(id)) || (process.argv.includes("--dense") ? "sunday-roast-dense" : "sunday-roast");
  const template = require("../examples/" + edition + ".json");
  if (!edition.startsWith("sunday-roast")) {
    const slides = template.spec.slides;
    if (slides.length < 12) throw Error("New lookbooks require at least 12 slides.");
    slides.slice(1, -1).forEach((slide: any, i: number) => {
      const words = slide.items.join(" ").trim().split(/\s+/).length;
      if (words < 50) throw Error(`Slide ${i + 2} needs at least 50 words of interior content.`);
    });
  }
  const output = path.join(ROOT, "out", edition);
  const photos = path.join(ROOT, "engine/cache/photos");
  fs.mkdirSync(output, { recursive: true });

  const deck = await renderDeckFromSpec(template.spec, template.selections, {
    id: edition,
    brand: template.brand,
    photoResolver: async (key: string) => {
      const file = fs.readdirSync(photos).find((name) => name.startsWith(key));
      if (!file) throw Error("Missing lookbook photograph " + key);
      return { path: path.join(photos, file), pexelsId: "local:" + key };
    },
  });
  deck.id = edition;
  deck.name = template.name;
  deck.description =
    template.description ||
    "A warm cafe lookbook — interior, menu, latte, tasting notes and a closing postcard.";
  deck.family = edition.replace(/-dense$/, "");

  const sheet = createCanvas(1280, 368 * Math.ceil(deck.layoutSequence.length / 2));
  const ctx = sheet.getContext("2d");
  ctx.fillStyle = template.brand.colors.ink;
  ctx.fillRect(0, 0, sheet.width, sheet.height);

  for (const [i, id] of deck.layoutSequence.entries()) {
    const n = String(i + 1);
    const file = path.join(output, "slide-" + n + ".png");
    const padded = path.join(output, "slide-" + n.padStart(2, "0") + ".png");
    for (const e of deck.layouts[id].elements) {
      if (e.textContent?.spans.some((s: any) => s.text.includes("…"))) {
        throw Error("Truncated text on slide " + (i + 1));
      }
    }
    const warnings = renderSlidePng(deck, id, file);
    if (warnings.length) throw Error(warnings.join(", "));
    if (file !== padded) fs.copyFileSync(file, padded);
    ctx.drawImage(await loadImage(file), (i % 2) * 640 + 4, Math.floor(i / 2) * 368 + 4, 632, 355.5);
  }

  fs.writeFileSync(path.join(output, "preview.png"), sheet.toBuffer("image/png"));
  const pptxPath = path.join(output, edition + ".pptx");
  const pptxTemp = path.join(output, edition + ".export.pptx");
  await exportDeckPptx(deck, pptxTemp);
  try {
    fs.copyFileSync(pptxTemp, pptxPath);
    fs.unlinkSync(pptxTemp);
  } catch (error: any) {
    // Windows locks an open PowerPoint file — keep the export sibling instead.
    console.warn("Could not replace locked " + path.basename(pptxPath) + "; left " + path.basename(pptxTemp));
  }
  const pptxForPublish = fs.existsSync(pptxPath) ? pptxPath : pptxTemp;
  fs.writeFileSync(path.join(output, "deck.json"), JSON.stringify(deck, null, 2));
  console.log("PASS:", edition, deck.layoutSequence.length, "slides →", path.relative(ROOT, output));

  if (process.argv.includes("--publish-local")) {
    const jobId = `${edition}-release-${Date.now()}`;
    const stage = path.join(ROOT, "docs/template-pipeline/admin-dashboard/tmp", jobId);
    const photoDir = path.join(ROOT, "generated-templates/photos/composer", jobId);
    fs.mkdirSync(stage, { recursive: true });
    fs.mkdirSync(photoDir, { recursive: true });

    const staged = JSON.parse(JSON.stringify(deck));
    for (const lid of staged.layoutSequence) {
      for (const e of staged.layouts[lid].elements) {
        const content = e.imageContent || e.maskedImageContent;
        if (!content?.url || typeof content.url !== "string") continue;
        const name = path.basename(content.url);
        const candidates = [
          path.join(ROOT, "generated-templates", content.url),
          path.join(ROOT, "generated-templates/photos/engine-v1", name),
          path.join(photos, name),
        ];
        const source = candidates.find((p) => fs.existsSync(p));
        if (!source) throw Error("Missing publish photo: " + content.url);
        fs.copyFileSync(source, path.join(photoDir, name));
        content.url = `photos/composer/${jobId}/${name}`;
      }
    }

    fs.writeFileSync(path.join(stage, "deck.json"), JSON.stringify(staged, null, 2));
    for (let i = 1; i <= deck.layoutSequence.length; i++) {
      const padded = "slide-" + String(i).padStart(2, "0") + ".png";
      fs.copyFileSync(path.join(output, padded), path.join(stage, padded));
    }
    fs.copyFileSync(pptxForPublish, path.join(stage, "deck.pptx"));

    const { publishTemplate } = require("../services/templatePipeline/adminCatalog");
    const result = await publishTemplate(jobId);
    const { listCatalog, readCatalog, buildPptx } = require("../services/templatePipeline/catalog");
    if (!listCatalog().some((entry: any) => entry.id === edition)) {
      throw new Error("Published template missing from catalog: " + edition);
    }
    if (readCatalog(edition).slides.length !== deck.layoutSequence.length) {
      throw new Error("Published previews missing");
    }
    const download = await buildPptx(edition);
    if (!download.buffer || download.buffer.length < 1000) {
      throw new Error("Published PPTX download is empty");
    }
    fs.writeFileSync(
      path.join(output, "release.json"),
      JSON.stringify(
        {
          ...result,
          verified: {
            catalog: true,
            previews: deck.layoutSequence.length,
            downloadBytes: download.buffer.length,
          },
        },
        null,
        2
      )
    );
    console.log("Published and verified local catalog entry:", edition);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

