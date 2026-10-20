/**
 * Structural edits saved through pptx-viewer-core.
 * Creative operators stay in mutate_creative.js and are not applied here.
 *
 *   node services/templatePipeline/mutate_safe.js
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { createCanvas, Image } = require("canvas");
const creative = require("./mutate_creative");

const ROOT = path.join(__dirname, "..", "..");
const SOFFICE = "C:\\Program Files\\LibreOffice\\program\\soffice.com";
const SEEDS = {
  "health-medical": "PPTX Slides Templates/Yellow and Blue Illustrative Modern Geometric Health Medical Presentation.pptx",
  "company-minimal": "PPTX Slides Templates/Red Minimalist Company Profile Presentation .pptx",
};
const OPERATORS = ["mirror_horizontal", "swap_sides", "scale_hero"];

function arrayBufferOf(buffer) {
  if (buffer.byteOffset === 0 && buffer.byteLength === buffer.buffer.byteLength) return buffer.buffer;
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

function walk(elements, visit) {
  (elements || []).forEach((element) => {
    visit(element);
    if (element && element.type === "group" && Array.isArray(element.children)) walk(element.children, visit);
  });
}

function countElements(slides) {
  let count = 0;
  (slides || []).forEach((slide) => walk(slide.elements, () => { count += 1; }));
  return count;
}

function perSlideCounts(slides) {
  return (slides || []).map((slide) => {
    let count = 0;
    walk(slide.elements, () => { count += 1; });
    return count;
  });
}

function area(element) {
  const width = Number(element && element.width);
  const height = Number(element && element.height);
  if (!(width > 0) || !(height > 0)) return 0;
  return width * height;
}

function isImage(element) {
  return element && (element.type === "image" || element.type === "picture");
}

function isText(element) {
  return element && element.type === "text" && String(element.text || "").trim();
}

function largest(slides, test) {
  let best = null;
  let bestArea = 0;
  (slides || []).forEach((slide, slideIndex) => {
    walk(slide.elements, (element) => {
      if (!test(element)) return;
      const next = area(element);
      if (next > bestArea) {
        best = { element, slideIndex };
        bestArea = next;
      }
    });
  });
  return best;
}

function overflows(element, width, height) {
  return element.x < -0.5
    || element.y < -0.5
    || element.x + element.width > width + 0.5
    || element.y + element.height > height + 0.5;
}

function mirrorHorizontal(data) {
  const width = data.width;
  const violations = [];
  data.slides.forEach((slide, slideIndex) => {
    (slide.elements || []).forEach((element) => {
      if (!Number.isFinite(element.x) || !Number.isFinite(element.width)) return;
      element.x = Math.round(width - element.x - element.width);
      if (element.x < -0.5 || element.x + element.width > width + 0.5) {
        violations.push({ slide: slideIndex + 1, id: element.id, x: element.x, width: element.width });
      }
    });
  });
  return { operator: "mirror_horizontal", violations };
}

function swapSides(data) {
  const image = largest(data.slides, isImage);
  const text = largest(data.slides, isText);
  if (!image || !text) return { operator: "swap_sides", skipped: true, reason: "missing an image or a text element" };
  const imageBox = { x: image.element.x, y: image.element.y, width: image.element.width, height: image.element.height };
  const textBox = { x: text.element.x, y: text.element.y, width: text.element.width, height: text.element.height };
  image.element.x = textBox.x;
  image.element.y = textBox.y;
  image.element.width = textBox.width;
  image.element.height = textBox.height;
  text.element.x = imageBox.x;
  text.element.y = imageBox.y;
  text.element.width = imageBox.width;
  text.element.height = imageBox.height;
  let scales = 0;
  while (scales < 12 && (overflows(image.element, data.width, data.height) || overflows(text.element, data.width, data.height))) {
    image.element.width = Math.round(image.element.width * 0.9);
    image.element.height = Math.round(image.element.height * 0.9);
    text.element.width = Math.round(text.element.width * 0.9);
    text.element.height = Math.round(text.element.height * 0.9);
    scales += 1;
  }
  return {
    operator: "swap_sides",
    image: image.element.id,
    text: text.element.id,
    scales,
    fits: !overflows(image.element, data.width, data.height) && !overflows(text.element, data.width, data.height),
  };
}

function scaleHero(data) {
  const image = largest(data.slides, isImage);
  if (!image) return { operator: "scale_hero", skipped: true, reason: "missing an image" };
  const element = image.element;
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;
  element.width = Math.round(element.width * 1.4);
  element.height = Math.round(element.height * 1.4);
  element.x = Math.round(centerX - element.width / 2);
  element.y = Math.round(centerY - element.height / 2);
  element.x = Math.min(Math.max(0, element.x), Math.max(0, data.width - element.width));
  element.y = Math.min(Math.max(0, element.y), Math.max(0, data.height - element.height));
  return {
    operator: "scale_hero",
    image: element.id,
    slide: image.slideIndex + 1,
    inside: !overflows(element, data.width, data.height),
  };
}

const STRUCTURAL = {
  mirror_horizontal: mirrorHorizontal,
  swap_sides: swapSides,
  scale_hero: scaleHero,
};

async function loadHandler() {
  const { PptxHandler } = await import("pptx-viewer-core");
  return PptxHandler;
}

async function applyOperator(pptxPath, operator) {
  const PptxHandler = await loadHandler();
  const handler = new PptxHandler();
  const buffer = fs.readFileSync(pptxPath);
  const call = "await handler.load(buffer)";
  let data;
  try {
    data = await handler.load(arrayBufferOf(buffer));
  } catch (error) {
    return { ok: false, call, error: error && error.message ? error.message : String(error) };
  }
  const before = countElements(data.slides);
  const beforeSlides = perSlideCounts(data.slides);
  let note;
  try {
    note = STRUCTURAL[operator](data);
  } catch (error) {
    return {
      ok: false,
      call: operator + "(data)",
      error: error && error.message ? error.message : String(error),
      before,
    };
  }
  if (note && note.skipped) {
    return { ok: false, skipped: true, call: operator + "(data)", note, before };
  }
  let outputBytes;
  try {
    outputBytes = await handler.save(data.slides);
  } catch (error) {
    return {
      ok: false,
      call: "await handler.save(data.slides)",
      error: error && error.message ? error.message : String(error),
      note,
      before,
    };
  }
  const check = new PptxHandler();
  let reloaded;
  try {
    const saved = Buffer.from(outputBytes);
    reloaded = await check.load(arrayBufferOf(saved));
  } catch (error) {
    return {
      ok: false,
      call: "await handler.load(savedBytes)",
      error: error && error.message ? error.message : String(error),
      note,
      before,
    };
  }
  const after = countElements(reloaded.slides);
  return {
    ok: true,
    note,
    before,
    after,
    beforeSlides,
    afterSlides: perSlideCounts(reloaded.slides),
    preserved: before === after,
    bytes: outputBytes,
  };
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", timeout: 180000 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || command + " failed").slice(0, 1000));
}

function pdftoppm() {
  const found = spawnSync("where.exe", ["pdftoppm"], { encoding: "utf8" });
  const line = String(found.stdout || "").split(/\r?\n/).map((item) => item.trim()).find(Boolean);
  if (!line) throw new Error("pdftoppm was not found");
  return line;
}

function renderPptx(pptxFile, pngDir) {
  fs.mkdirSync(pngDir, { recursive: true });
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "safe-pptx-"));
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "lo-safe-"));
  try {
    run(SOFFICE, [
      "-env:UserInstallation=file:///" + profile.replace(/\\/g, "/"),
      "--headless",
      "--norestore",
      "--convert-to",
      "pdf",
      "--outdir",
      work,
      pptxFile,
    ]);
    const pdf = fs.readdirSync(work).find((name) => name.toLowerCase().endsWith(".pdf"));
    if (!pdf) throw new Error("LibreOffice did not write a PDF for " + pptxFile);
    const prefix = path.join(pngDir, "slide");
    run(pdftoppm(), ["-png", "-scale-to-x", "1600", "-scale-to-y", "900", path.join(work, pdf), prefix]);
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
    fs.rmSync(profile, { recursive: true, force: true });
  }
  return fs.readdirSync(pngDir)
    .filter((name) => name.toLowerCase().endsWith(".png"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((name) => path.join(pngDir, name));
}

function gray(file) {
  const img = new Image();
  img.src = fs.readFileSync(file);
  const canvas = createCanvas(160, 90);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, 160, 90);
  const data = ctx.getImageData(0, 0, 160, 90).data;
  const pixels = new Float64Array(160 * 90);
  for (let i = 0; i < pixels.length; i += 1) {
    const p = i * 4;
    pixels[i] = 0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2];
  }
  return pixels;
}

function windowSsim(a, b) {
  const w = 160;
  const h = 90;
  const win = 10;
  const c1 = (0.01 * 255) ** 2;
  const c2 = (0.03 * 255) ** 2;
  let sum = 0;
  let count = 0;
  for (let y = 0; y <= h - win; y += win) {
    for (let x = 0; x <= w - win; x += win) {
      let meanA = 0;
      let meanB = 0;
      const n = win * win;
      for (let yy = 0; yy < win; yy += 1) {
        for (let xx = 0; xx < win; xx += 1) {
          const pixel = (y + yy) * w + (x + xx);
          meanA += a[pixel];
          meanB += b[pixel];
        }
      }
      meanA /= n;
      meanB /= n;
      let varA = 0;
      let varB = 0;
      let cov = 0;
      for (let yy = 0; yy < win; yy += 1) {
        for (let xx = 0; xx < win; xx += 1) {
          const pixel = (y + yy) * w + (x + xx);
          const da = a[pixel] - meanA;
          const db = b[pixel] - meanB;
          varA += da * da;
          varB += db * db;
          cov += da * db;
        }
      }
      varA /= n;
      varB /= n;
      cov /= n;
      sum += ((2 * meanA * meanB + c1) * (2 * cov + c2)) / ((meanA * meanA + meanB * meanB + c1) * (varA + varB + c2));
      count += 1;
    }
  }
  return sum / count;
}

async function runSeed(seedId) {
  const pptxPath = path.join(ROOT, SEEDS[seedId]);
  const outDir = path.join(ROOT, "docs", "template-pipeline", "safe-mutations", seedId);
  fs.mkdirSync(outDir, { recursive: true });
  console.log("render original " + seedId);
  const originalPngs = renderPptx(pptxPath, path.join(outDir, "original"));
  const rows = [];
  for (const operator of OPERATORS) {
    console.log(seedId + " " + operator);
    const result = await applyOperator(pptxPath, operator);
    const row = {
      seed: seedId,
      operator,
      ok: result.ok,
      preserved: !!result.preserved,
      before: result.before,
      after: result.after,
      beforeSlides: result.beforeSlides,
      afterSlides: result.afterSlides,
      note: result.note,
      skipped: !!result.skipped,
      call: result.call,
      error: result.error,
    };
    if (result.ok && result.bytes) {
      const pptxFile = path.join(outDir, operator + ".pptx");
      fs.writeFileSync(pptxFile, Buffer.from(result.bytes));
      try {
        const pngs = renderPptx(pptxFile, path.join(outDir, operator));
        const scores = originalPngs.map((png, index) => {
          if (!pngs[index]) return null;
          return Math.round(windowSsim(gray(png), gray(pngs[index])) * 10000) / 100;
        });
        const usable = scores.filter((score) => score != null);
        row.scores = scores;
        row.mean = usable.length ? Math.round((usable.reduce((sum, score) => sum + score, 0) / usable.length) * 100) / 100 : null;
        row.slides = pngs.length;
      } catch (error) {
        row.renderError = error && error.message ? error.message : String(error);
      }
    }
    rows.push(row);
    console.log(JSON.stringify(row));
  }
  return rows;
}

async function main() {
  const rows = [];
  for (const seedId of Object.keys(SEEDS)) rows.push(...await runSeed(seedId));
  const outDir = path.join(ROOT, "docs", "template-pipeline", "safe-mutations");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "results.json"), JSON.stringify(rows, null, 2) + "\n");
  console.log("done " + rows.length);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  });
}

module.exports = {
  applyOperator,
  mirrorHorizontal,
  swapSides,
  scaleHero,
  creative,
};
