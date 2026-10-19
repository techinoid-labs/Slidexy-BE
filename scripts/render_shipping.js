/**
 * Writes the ten Harbor decks, their slide PNGs, and one PPTX per deck.
 *
 *   node scripts/render_shipping.js
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const PptxGenJS = require("pptxgenjs");
const { slideSvg } = require("./slideSvg");

const ROOT = path.join(__dirname, "..");
const DECK_DIR = process.env.HARBOR_DECKS || path.join(os.tmpdir(), "slidexy-harbor");
const SCORES = process.env.HARBOR_SCORES || path.join(os.tmpdir(), "slidexy-aesthetic.json");
const CATALOG = path.join(ROOT, "generated-templates");
const PREVIEW = path.join(ROOT, "docs", "template-pipeline", "shipping-preview");
const PPTX_DIR = path.join(CATALOG, "rendered");
const SOFFICE = "C:\\Program Files\\LibreOffice\\program\\soffice.com";

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || command).trim());
  }
}

function pdftoppm() {
  const found = spawnSync("where.exe", ["pdftoppm"], { encoding: "utf8" });
  const line = String(found.stdout || "").split(/\r?\n/).map((item) => item.trim()).find(Boolean);
  if (!line) throw new Error("pdftoppm was not found");
  return line;
}

function renderPngs(deck, pngDir, sofficeProfile) {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "ship-"));
  const svgDir = path.join(work, "svg");
  fs.mkdirSync(svgDir, { recursive: true });
  fs.mkdirSync(pngDir, { recursive: true });
  const names = (deck.layoutSequence || []).map((_, index) => "slide-" + String(index + 1).padStart(2, "0"));
  names.forEach((name, index) => {
    fs.writeFileSync(path.join(svgDir, name + ".svg"), slideSvg(deck, deck.layoutSequence[index]));
  });
  const svgs = names.map((name) => path.join(svgDir, name + ".svg"));
  run(SOFFICE, [
    "-env:UserInstallation=file:///" + sofficeProfile.replace(/\\/g, "/"),
    "--headless",
    "--norestore",
    "--convert-to",
    "pdf",
    "--outdir",
    work,
    ...svgs,
  ]);
  const poppler = pdftoppm();
  names.forEach((name) => {
    const pdf = path.join(work, name + ".pdf");
    if (!fs.existsSync(pdf)) throw new Error("LibreOffice did not write " + name + ".pdf");
    const prefix = path.join(pngDir, name);
    run(poppler, ["-png", "-scale-to-x", "1600", "-scale-to-y", "900", "-singlefile", pdf, prefix]);
  });
  fs.rmSync(work, { recursive: true, force: true });
  return names.map((name) => path.join(pngDir, name + ".png"));
}

async function writePptx(pngs, file) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
  pptx.layout = "WIDE";
  pngs.forEach((png) => {
    const slide = pptx.addSlide();
    slide.addImage({ path: png, x: 0, y: 0, w: 13.333, h: 7.5 });
  });
  await pptx.writeFile({ fileName: file });
}

async function main() {
  const scoreFile = JSON.parse(fs.readFileSync(SCORES, "utf8"));
  const byId = new Map(scoreFile.decks.map((deck) => [deck.id, deck]));
  fs.mkdirSync(PPTX_DIR, { recursive: true });
  fs.mkdirSync(path.join(PREVIEW, "png"), { recursive: true });
  const written = [];
  const decks = fs.readdirSync(DECK_DIR).filter((name) => name.endsWith(".json")).sort();
  for (const name of decks) {
    const deck = JSON.parse(fs.readFileSync(path.join(DECK_DIR, name), "utf8"));
    const scored = byId.get(deck.id);
    if (!scored) throw new Error("no aesthetic score for " + deck.id);
    deck.scores = {
      aesthetic_mean: scored.deck_mean,
      aesthetic_min: scored.deck_min,
      slide_scores: scored.slide_scores,
    };
    const jsonPath = path.join(CATALOG, deck.id + ".json");
    fs.writeFileSync(jsonPath, JSON.stringify(deck, null, 2) + "\n", "utf8");
    const pngs = renderPngs(deck, path.join(PREVIEW, "png", deck.id), path.join(os.tmpdir(), "slidexy-lo-" + deck.id));
    const pptx = path.join(PPTX_DIR, deck.id + ".pptx");
    await writePptx(pngs, pptx);
    written.push(pptx);
    console.log(deck.id + " " + deck.scores.aesthetic_mean);
  }
  const checkDir = fs.mkdtempSync(path.join(os.tmpdir(), "ship-open-"));
  run(SOFFICE, [
    "-env:UserInstallation=file:///" + path.join(os.tmpdir(), "slidexy-lo-open").replace(/\\/g, "/"),
    "--headless",
    "--norestore",
    "--convert-to",
    "pdf",
    "--outdir",
    checkDir,
    ...written,
  ]);
  written.forEach((pptx) => {
    const pdf = path.join(checkDir, path.basename(pptx, ".pptx") + ".pdf");
    const size = fs.existsSync(pdf) ? fs.statSync(pdf).size : 0;
    if (size < 1000) throw new Error("LibreOffice did not open " + path.basename(pptx));
    console.log("opened " + path.basename(pptx) + " " + size);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
