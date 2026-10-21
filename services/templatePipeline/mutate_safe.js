/**
 * Edits saved through pptx-viewer-core.
 * Structural, palette, and creative operators all load, edit, and save here.
 *
 *   node services/templatePipeline/mutate_safe.js
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { createCanvas, Image } = require("canvas");
const creative = require("./mutate_creative");
const { shiftHue } = require("./dna/color");

const ROOT = path.join(__dirname, "..", "..");
const SOFFICE = "C:\\Program Files\\LibreOffice\\program\\soffice.com";
const SEEDS = {
  "health-medical": "PPTX Slides Templates/Yellow and Blue Illustrative Modern Geometric Health Medical Presentation.pptx",
  "cinema-neon": "PPTX Slides Templates/Red Black Neon Cinema Presentation.pptx",
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

function boxOverflows(box, width, height) {
  return box.x < -0.5
    || box.y < -0.5
    || box.x + box.width > width + 0.5
    || box.y + box.height > height + 0.5;
}

function syncBox(element, data) {
  if (!element || !data || !data.width || !data.height) return;
  const sx = data.widthEmu / data.width;
  const sy = data.heightEmu / data.height;
  if (Number.isFinite(sx) && Number.isFinite(element.x)) element.xEmu = Math.round(element.x * sx);
  if (Number.isFinite(sy) && Number.isFinite(element.y)) element.yEmu = Math.round(element.y * sy);
  if (Number.isFinite(sx) && Number.isFinite(element.width)) element.widthEmu = Math.round(element.width * sx);
  if (Number.isFinite(sy) && Number.isFinite(element.height)) element.heightEmu = Math.round(element.height * sy);
}

function elementIds(slides) {
  const ids = [];
  (slides || []).forEach((slide) => walk(slide.elements, (element) => {
    if (element && element.id) ids.push(String(element.id));
  }));
  return ids;
}

function writeSrgb(xml, hex) {
  if (!xml || typeof xml !== "object") return;
  const node = xml["a:srgbClr"];
  if (node && typeof node === "object") node["@_val"] = String(hex).replace("#", "").toUpperCase();
}

function paintField(style, key, xmlKey, degrees) {
  if (!style || typeof style[key] !== "string") return;
  if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(style[key])) return;
  const next = shiftHue(style[key], degrees);
  if (!next || next === style[key]) return;
  style[key] = next;
  writeSrgb(style[xmlKey], next);
  if (style.authoredRunStyle && typeof style.authoredRunStyle[key] === "string") {
    style.authoredRunStyle[key] = next;
    writeSrgb(style.authoredRunStyle[xmlKey], next);
  }
}

function shiftPalette(data, degrees) {
  const amount = Number(degrees) || 0;
  const paint = (value) => {
    if (typeof value !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(value) && !/^#[0-9A-Fa-f]{3}$/.test(value)) return null;
    return shiftHue(value, amount);
  };
  if (data.theme && data.theme.colorScheme) {
    Object.keys(data.theme.colorScheme).forEach((key) => {
      const next = paint(data.theme.colorScheme[key]);
      if (next) data.theme.colorScheme[key] = next;
    });
  }
  data.slides.forEach((slide) => {
    const background = paint(slide.backgroundColor);
    if (background) slide.backgroundColor = background;
    walk(slide.elements, (element) => {
      paintField(element.shapeStyle, "fillColor", "fillColorXml", amount);
      paintField(element.textStyle, "color", "colorXml", amount);
      (element.textSegments || []).forEach((segment) => paintField(segment.style, "color", "colorXml", amount));
    });
  });
  return { operator: "palette", degrees: amount, added: 0 };
}

function mirrorHorizontal(data) {
  const slideWidth = data.width;
  const violations = [];
  data.slides.forEach((slide, slideIndex) => {
    (slide.elements || []).forEach((element) => {
      if (!Number.isFinite(element.x) || !Number.isFinite(element.width)) return;
      const newX = slideWidth - element.x - element.width;
      element.x = Math.round(Math.max(0, Math.min(slideWidth - element.width, newX)));
      syncBox(element, data);
      if (element.x < -0.5 || element.x + element.width > slideWidth + 0.5) {
        violations.push({ slide: slideIndex + 1, id: element.id, x: element.x, width: element.width });
      }
    });
  });
  return { operator: "mirror_horizontal", violations, added: 0 };
}

function largestOn(slide, test) {
  let best = null;
  let bestArea = 0;
  walk(slide.elements, (element) => {
    if (!test(element)) return;
    const next = area(element);
    if (next > bestArea) {
      best = element;
      bestArea = next;
    }
  });
  return best;
}

function restoreBox(element, box, data) {
  element.x = box.x;
  element.y = box.y;
  element.width = box.width;
  element.height = box.height;
  syncBox(element, data);
}

function swapSides(data) {
  const applied = [];
  const skipped = [];
  data.slides.forEach((slide, slideIndex) => {
    const slideNumber = slideIndex + 1;
    const image = largestOn(slide, isImage);
    const text = largestOn(slide, isText);
    if (!image || !text || image === text) {
      skipped.push({ slide: slideNumber, reason: "missing an image or a text element" });
      return;
    }
    const imageBox = { x: image.x, y: image.y, width: image.width, height: image.height };
    const textBox = { x: text.x, y: text.y, width: text.width, height: text.height };
    const swappedImage = { x: textBox.x, y: textBox.y, width: textBox.width, height: textBox.height };
    const swappedText = { x: imageBox.x, y: imageBox.y, width: imageBox.width, height: imageBox.height };
    if (boxOverflows(swappedImage, data.width, data.height) || boxOverflows(swappedText, data.width, data.height)) {
      console.warn("swap_sides slide " + slideNumber + ": swapped size exceeds the canvas. Swapping x only and keeping the original width. The text box may need wrapping.");
      image.x = textBox.x;
      text.x = imageBox.x;
      syncBox(image, data);
      syncBox(text, data);
      if (overflows(image, data.width, data.height) || overflows(text, data.width, data.height)) {
        restoreBox(image, imageBox, data);
        restoreBox(text, textBox, data);
        console.warn("swap_sides slide " + slideNumber + ": skipped. The x swap still leaves an element outside the slide.");
        skipped.push({ slide: slideNumber, reason: "x swap still outside the slide" });
        return;
      }
      applied.push({ slide: slideNumber, mode: "x", image: image.id, text: text.id });
      return;
    }
    image.x = swappedImage.x;
    image.y = swappedImage.y;
    image.width = swappedImage.width;
    image.height = swappedImage.height;
    text.x = swappedText.x;
    text.y = swappedText.y;
    text.width = swappedText.width;
    text.height = swappedText.height;
    syncBox(image, data);
    syncBox(text, data);
    applied.push({ slide: slideNumber, mode: "box", image: image.id, text: text.id });
  });
  return { operator: "swap_sides", applied, skipped, scales: 0, added: 0 };
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
  syncBox(element, data);
  return {
    operator: "scale_hero",
    image: element.id,
    slide: image.slideIndex + 1,
    inside: !overflows(element, data.width, data.height),
    added: 0,
  };
}

const STRUCTURAL = {
  mirror_horizontal: mirrorHorizontal,
  swap_sides: swapSides,
  scale_hero: scaleHero,
};

function runOperator(data, operator, options) {
  const name = operator === "palette_swap" ? "palette" : operator;
  const degrees = options && options.degrees;
  if (name !== "palette" && degrees) shiftPalette(data, degrees);
  if (name === "palette") return shiftPalette(data, degrees);
  if (STRUCTURAL[name]) return STRUCTURAL[name](data);
  const creativeRun = {
    highlight_word: creative.highlightWordPptx,
    text_mask_image: creative.textMaskImagePptx,
    overlap_depth: creative.overlapDepthPptx,
  }[name];
  if (!creativeRun) throw new Error("unknown operator " + operator);
  return creativeRun(data);
}

async function loadHandler() {
  const { PptxHandler } = await import("pptx-viewer-core");
  return PptxHandler;
}

async function applyOperator(pptxPath, operator, options) {
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
  const beforeIds = elementIds(data.slides);
  let note;
  try {
    note = runOperator(data, operator, options || {});
  } catch (error) {
    return {
      ok: false,
      call: operator + "(data)",
      error: error && error.message ? error.message : String(error),
      before,
    };
  }
  if (note && note.skipped === true) {
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
  const afterSlides = perSlideCounts(reloaded.slides);
  const afterIds = new Set(elementIds(reloaded.slides));
  const lost = beforeIds.filter((id) => !afterIds.has(id));
  const added = note && Number(note.added) || 0;
  const perSlideOk = beforeSlides.every((count, index) => {
    const extra = note && note.operator === "highlight_word" && note.notes && note.notes[index] && note.notes[index].applied ? 1 : 0;
    return afterSlides[index] === count + extra;
  });
  return {
    ok: true,
    note,
    before,
    after,
    added,
    lost,
    beforeSlides,
    afterSlides,
    preserved: perSlideOk && after === before + added,
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

const REJECTED = path.join(ROOT, "docs", "template-pipeline", "rejected-variants.jsonl");

async function reviewRendered(pngs, meta) {
  const { reviewSlide } = require("./reviewer");
  let kept = 0;
  let rejected = 0;
  const scores = [];
  for (const png of pngs) {
    let verdict;
    let lastError = null;
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        verdict = await reviewSlide(png);
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        const message = error && error.message ? error.message : String(error);
        if (!/429|rate|unavailable|503|500/i.test(message) || attempt === 4) break;
        await new Promise((resolve) => setTimeout(resolve, 5000 * attempt));
      }
    }
    if (!verdict) {
      const message = lastError && lastError.message ? lastError.message : "review failed";
      verdict = { passed: false, quality_score: 0, issues: [message] };
    }
    const record = {
      run: meta.run || "",
      kind: meta.kind || "",
      seed: meta.seed,
      operator: meta.operator,
      png: path.relative(ROOT, png).replace(/\\/g, "/"),
      passed: verdict.passed,
      quality_score: verdict.quality_score,
      issues: verdict.issues || [],
      washed_out: verdict.washed_out,
      legible: verdict.legible,
      broken_layout: verdict.broken_layout,
      model: verdict.model,
    };
    if (!verdict.passed) {
      fs.appendFileSync(REJECTED, JSON.stringify(record) + "\n");
      rejected += 1;
    } else kept += 1;
    scores.push(Number(verdict.quality_score) || 0);
    console.log((verdict.passed ? "keep " : "reject ") + record.png + " " + verdict.quality_score);
  }
  const mean = scores.length ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100) / 100 : 0;
  return { kept, rejected, scores, mean };
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
        const review = await reviewRendered(pngs, { seed: seedId, operator });
        row.keptSlides = review.kept;
        row.rejectedSlides = review.rejected;
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

async function reviewExisting() {
  const summary = [];
  for (const seedId of Object.keys(SEEDS)) {
    for (const operator of OPERATORS) {
      const dir = path.join(ROOT, "docs", "template-pipeline", "safe-mutations", seedId, operator);
      const pngs = fs.readdirSync(dir)
        .filter((name) => name.toLowerCase().endsWith(".png"))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        .map((name) => path.join(dir, name));
      console.log("review " + seedId + " " + operator);
      const review = await reviewRendered(pngs, { seed: seedId, operator });
      summary.push({ seed: seedId, operator, kept: review.kept, rejected: review.rejected });
    }
  }
  const file = path.join(ROOT, "docs", "template-pipeline", "safe-mutations", "review.json");
  fs.writeFileSync(file, JSON.stringify(summary, null, 2) + "\n");
  console.log(JSON.stringify(summary));
}

if (require.main === module) {
  const reviewOnly = process.argv.includes("--review");
  (reviewOnly ? reviewExisting() : main()).catch((error) => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  });
}

module.exports = {
  applyOperator,
  renderPptx,
  reviewRendered,
  mirrorHorizontal,
  swapSides,
  scaleHero,
  creative,
  SEEDS,
  ROOT,
};
