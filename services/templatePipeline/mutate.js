/**
 * Palette-and-photo variants, a creative batch, or the unified reviewed run.
 *
 *   node services/templatePipeline/mutate.js
 *   node services/templatePipeline/mutate.js <seed-id> --mode=creative
 *   node services/templatePipeline/mutate.js --mode=unified
 *   node services/templatePipeline/mutate.js --mode=shipping
 */

const fs = require("fs");
const path = require("path");
const { createCanvas, Image } = require("canvas");
const { renderSlidePng } = require("../../scripts/slideSvg");
const { normHex, contrast, shiftHue, fitContrast } = require("./dna/color");
const { writeSeedDna, eachElement, leaf, SEEDS } = require("./dna/extract");
const { gateAgainstDna, dominantColors } = require("./dna/gate");
const { highlightWord, textMaskImage, overlapDepth, textureOverlay } = require("./mutate_creative");
const { applyOperator, renderPptx, reviewRendered, SEEDS: PPTX_SEEDS } = require("./mutate_safe");

const SHIFTS = [16, -18, 28, -24, 34];
const ROOT = path.join(__dirname, "..", "..");
const PHOTO_ROOT = path.join(ROOT, "generated-templates");

function clone(deck) {
  return JSON.parse(JSON.stringify(deck));
}

function replaceColors(node, replace) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((item) => replaceColors(item, replace));
    return;
  }
  Object.keys(node).forEach((key) => {
    const hex = normHex(node[key]);
    if (hex && replace.has(hex)) node[key] = replace.get(hex);
    else if (node[key] && typeof node[key] === "object") replaceColors(node[key], replace);
  });
}

function sameHex(a, b) {
  return normHex(a) && normHex(a) === normHex(b);
}

function collectHexes(node, found) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((item) => collectHexes(item, found));
    return;
  }
  Object.values(node).forEach((value) => {
    const hex = normHex(value);
    if (hex) found.add(hex);
    else if (value && typeof value === "object") collectHexes(value, found);
  });
}

function remapPalette(deck, shift) {
  const paints = dominantColors(deck);
  const hexes = new Set();
  collectHexes(deck, hexes);
  const replace = new Map();
  hexes.forEach((hex) => replace.set(hex, shiftHue(hex, shift)));
  if (paints.ink && paints.bg) {
    const shiftedBg = replace.get(paints.bg) || paints.bg;
    replace.set(paints.bg, fitContrast(paints.ink, shiftedBg, contrast(paints.bg, paints.ink)));
  }
  const bg = paints.bg && (replace.get(paints.bg) || paints.bg);
  if (paints.accent && paints.bg && bg && paints.accent !== paints.ink && paints.accent !== paints.bg) {
    replace.set(paints.accent, fitContrast(bg, replace.get(paints.accent) || paints.accent, contrast(paints.bg, paints.accent)));
  }
  const color = deck.tokens && deck.tokens.color;
  if (color && normHex(color.bg) && normHex(color.ink)) {
    const newBg = replace.get(normHex(color.bg)) || normHex(color.bg);
    replace.set(normHex(color.ink), fitContrast(newBg, replace.get(normHex(color.ink)) || normHex(color.ink), contrast(color.bg, color.ink)));
  }
  if (color && normHex(color.bg) && normHex(color.accent)) {
    const newBg = replace.get(normHex(color.bg)) || normHex(color.bg);
    replace.set(normHex(color.accent), fitContrast(newBg, replace.get(normHex(color.accent)) || normHex(color.accent), contrast(color.bg, color.accent)));
  }
  if (color && sameHex(color.surface, color.bg) && replace.get(normHex(color.bg))) {
    replace.set(normHex(color.surface), replace.get(normHex(color.bg)));
  }
  if (color && sameHex(color.muted, color.ink) && replace.get(normHex(color.ink))) {
    replace.set(normHex(color.muted), replace.get(normHex(color.ink)));
  }
  if (color && sameHex(color.accent2, color.accent) && replace.get(normHex(color.accent))) {
    replace.set(normHex(color.accent2), replace.get(normHex(color.accent)));
  }
  replaceColors(deck, replace);
}

function fileOf(url) {
  if (!url || /^https?:/i.test(url)) return null;
  const rel = String(url).replace(/\\/g, "/").replace(/^\/+/, "");
  return path.resolve(PHOTO_ROOT, rel);
}

const sizeCache = new Map();

function readSize(file) {
  if (sizeCache.has(file)) return sizeCache.get(file);
  let size = null;
  if (file && fs.existsSync(file)) {
    const img = new Image();
    img.src = fs.readFileSync(file);
    if (img.width && img.height) {
      size = { w: img.width, h: img.height, aspect: img.width / img.height, graphic: isGraphic(img) };
    }
  }
  sizeCache.set(file, size);
  return size;
}

function isGraphic(img) {
  const w = Math.min(img.width, 48);
  const h = Math.min(img.height, 48);
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  let clear = 0;
  const pixels = data.length / 4;
  for (let i = 3; i < data.length; i += 4) if (data[i] < 250) clear += 1;
  return clear / pixels > 0.02;
}

function buildPool() {
  const pools = {};
  SEEDS.forEach((id) => {
    const pool = [];
    const dir = path.join(PHOTO_ROOT, "photos", id);
    if (!fs.existsSync(dir)) {
      pools[id] = pool;
      return;
    }
    const walk = (folder) => {
      fs.readdirSync(folder, { withFileTypes: true }).forEach((entry) => {
        const full = path.join(folder, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(png|jpe?g|webp)$/i.test(entry.name)) {
          const size = readSize(full);
          if (!size || size.graphic) return;
          const url = path.relative(PHOTO_ROOT, full).replace(/\\/g, "/");
          pool.push({ url, aspect: size.aspect });
        }
      });
    };
    walk(dir);
    pool.sort((a, b) => (a.url < b.url ? -1 : 1));
    pools[id] = pool;
  });
  return pools;
}

function pictureSlots(deck) {
  const slots = [];
  eachElement(deck, (element) => {
    const node = leaf(element);
    if (!node) return;
    if (node.type === "image" && node.imageContent) slots.push(node.imageContent);
    if (node.type === "maskedImage" && node.maskedImageContent) slots.push(node.maskedImageContent);
    if (node.type === "collage" && node.collageContent) {
      (node.collageContent.cells || []).forEach((cell) => slots.push(cell));
    }
  });
  return slots;
}

function swapPhotos(deck, pools, variantIndex) {
  let swapped = 0;
  let kept = 0;
  const pool = pools[deck.id] || [];
  pictureSlots(deck).forEach((slot, slotIndex) => {
    const current = readSize(fileOf(slot.url));
    if (!current || current.graphic) {
      kept += 1;
      return;
    }
    const ranked = pool
      .filter((item) => item.url !== slot.url)
      .map((item) => ({ url: item.url, delta: Math.abs(item.aspect / current.aspect - 1) }))
      .filter((item) => item.delta <= 0.2)
      .sort((a, b) => a.delta - b.delta || (a.url < b.url ? -1 : 1));
    if (!ranked.length) {
      kept += 1;
      return;
    }
    const choice = ranked[(variantIndex + slotIndex) % ranked.length];
    slot.url = choice.url;
    swapped += 1;
  });
  return { swapped, kept };
}

function mutate(seed, variantIndex, pool) {
  const deck = clone(seed);
  const shift = SHIFTS[variantIndex - 1];
  remapPalette(deck, shift);
  const photos = swapPhotos(deck, pool, variantIndex);
  deck.id = seed.id + "-v" + variantIndex;
  deck.name = (seed.name || seed.id) + " variant " + variantIndex;
  deck.mutation = { seed: seed.id, variant: variantIndex, hueShift: shift, photos };
  return deck;
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
          const i = (y + yy) * w + (x + xx);
          meanA += a[i];
          meanB += b[i];
        }
      }
      meanA /= n;
      meanB /= n;
      let varA = 0;
      let varB = 0;
      let cov = 0;
      for (let yy = 0; yy < win; yy += 1) {
        for (let xx = 0; xx < win; xx += 1) {
          const i = (y + yy) * w + (x + xx);
          const da = a[i] - meanA;
          const db = b[i] - meanB;
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

function renderDeck(deck, dir, label) {
  fs.mkdirSync(dir, { recursive: true });
  const files = [];
  const warn = console.warn;
  console.warn = () => {};
  try {
    deck.layoutSequence.forEach((layoutId, index) => {
      const file = path.join(dir, label + "-" + String(index + 1).padStart(2, "0") + ".png");
      renderSlidePng(deck, layoutId, file);
      files.push(file);
    });
  } finally {
    console.warn = warn;
  }
  return files;
}

function aspectFailures(seed, variant) {
  const failures = [];
  const before = pictureSlots(seed);
  const after = pictureSlots(variant);
  after.forEach((slot, index) => {
    if (!before[index] || slot.url === before[index].url) return;
    const left = readSize(fileOf(before[index].url));
    const right = readSize(fileOf(slot.url));
    if (!left || !right) {
      failures.push("photo " + (index + 1) + " is missing on disk");
      return;
    }
    const delta = Math.abs(right.aspect / left.aspect - 1);
    if (delta > 0.2) failures.push("photo " + (index + 1) + " aspect changed by " + Math.round(delta * 100) + "%");
  });
  return failures;
}

const CREATIVE_PLAN = [
  "highlight_word",
  "highlight_word",
  "highlight_word",
  "highlight_word",
  "text_mask_image",
  "text_mask_image",
  "text_mask_image",
  "overlap_depth",
  "overlap_depth",
  "overlap_depth",
];

const CREATIVE_HUES = [12, -14, 18, -22, 26, -30, 34, -16, 20, -36, 28, -24, 16, -18, 32, -12];

function hashString(value) {
  let hash = 2166136261;
  const text = String(value);
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function creativeShifts(seedId) {
  const rand = mulberry32(hashString("creative:" + seedId));
  const bag = CREATIVE_HUES.slice();
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const swap = bag[i];
    bag[i] = bag[j];
    bag[j] = swap;
  }
  return bag.slice(0, 10);
}

function creativeVariant(seed, variantIndex, shift, operator) {
  const deck = clone(seed);
  remapPalette(deck, shift);
  const run = { highlight_word: highlightWord, text_mask_image: textMaskImage, overlap_depth: overlapDepth }[operator];
  const notes = run(deck);
  const texture = textureOverlay(deck);
  deck.id = seed.id + "-creative-v" + variantIndex;
  deck.name = (seed.name || seed.id) + " creative " + variantIndex;
  deck.creative = { mode: "creative", variant: variantIndex, operator, hueShift: shift, notes, texture };
  return deck;
}

async function creativeBatch(seedId) {
  if (!PPTX_SEEDS[seedId]) throw new Error("unknown seed " + seedId);
  const outRoot = path.join(ROOT, "docs", "template-pipeline", "unified");
  fs.mkdirSync(outRoot, { recursive: true });
  const rows = [];
  for (const operator of ["highlight_word", "text_mask_image", "overlap_depth"]) {
    await runVariant({ seed: seedId, kind: "creative", operator }, rows, outRoot);
  }
  console.log("done " + seedId + " " + rows.length);
  return rows;
}

function variantDirName(item) {
  const hue = item.degrees == null ? "" : (item.degrees > 0 ? "+" + item.degrees : String(item.degrees));
  const operator = item.operator === "palette" ? "palette_swap" : item.operator;
  const prefix = item.index ? "v" + String(item.index).padStart(2, "0") + "-" : "";
  return prefix + operator + hue;
}

async function runVariant(item, rows, outRoot) {
  const name = variantDirName(item);
  const pptxPath = path.join(ROOT, PPTX_SEEDS[item.seed]);
  console.log("unify " + item.seed + " " + item.kind + " " + name);
  const result = await applyOperator(pptxPath, item.operator, { degrees: item.degrees });
  const dir = path.join(outRoot, item.seed, name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const row = {
    seed: item.seed,
    kind: item.kind,
    operator: item.operator,
    degrees: item.degrees == null ? null : item.degrees,
    ok: !!result.ok,
    preserved: !!result.preserved,
    before: result.before,
    after: result.after,
    added: result.added,
    lost: result.lost || [],
    skipped: !!result.skipped,
    call: result.call || null,
    error: result.error || null,
    note: result.note || null,
    slides: 0,
    keptSlides: 0,
    rejectedSlides: 0,
    passedBoth: false,
    discarded: true,
  };
  if (result.ok && result.bytes) {
    const pptxFile = path.join(dir, name + ".pptx");
    fs.writeFileSync(pptxFile, Buffer.from(result.bytes));
    const pngs = renderPptx(pptxFile, path.join(dir, "slides"));
    const review = await reviewRendered(pngs, {
      seed: item.seed,
      operator: name,
      kind: item.kind,
      run: item.run || "unification",
    });
    row.slides = pngs.length;
    row.mean = review.mean;
    row.scores = review.scores;
    row.dir = dir;
    row.cover = pngs[0] || null;
    row.keptSlides = review.kept;
    row.rejectedSlides = review.rejected;
    row.passedBoth = row.preserved && pngs.length > 0 && review.rejected === 0 && review.kept === pngs.length;
    row.discarded = !row.passedBoth;
  }
  rows.push(row);
  fs.writeFileSync(path.join(outRoot, "results.json"), JSON.stringify(rows, null, 2) + "\n");
  console.log(JSON.stringify({
    seed: row.seed,
    kind: row.kind,
    operator: name,
    preserved: row.preserved,
    before: row.before,
    after: row.after,
    kept: row.keptSlides,
    rejected: row.rejectedSlides,
    passedBoth: row.passedBoth,
  }));
  return row;
}

async function unifiedBatch() {
  const outRoot = path.join(ROOT, "docs", "template-pipeline", "unified");
  fs.mkdirSync(outRoot, { recursive: true });
  const plan = [];
  const seeds = ["health-medical", "cinema-neon", "company-minimal"];
  seeds.forEach((seed) => {
    ["highlight_word", "text_mask_image", "overlap_depth"].forEach((operator) => {
      plan.push({ seed, kind: "creative", operator });
    });
  });
  plan.push({ seed: "health-medical", kind: "safe", operator: "palette", degrees: 16 });
  plan.push({ seed: "cinema-neon", kind: "safe", operator: "palette", degrees: -18 });
  const rows = [];
  for (const item of plan) await runVariant(item, rows, outRoot);
  const passed = rows.filter((row) => row.passedBoth);
  const summary = {
    variants: rows.length,
    passedBoth: passed.length,
    slidesReviewed: rows.reduce((sum, row) => sum + row.slides, 0),
    slidesPassedVisionOnPreservedVariants: rows
      .filter((row) => row.preserved)
      .reduce((sum, row) => sum + row.keptSlides, 0),
  };
  fs.writeFileSync(path.join(outRoot, "summary.json"), JSON.stringify(summary, null, 2) + "\n");
  console.log(JSON.stringify(summary));
  return { rows, summary };
}

const SHIPPING_RECIPE = [
  ["palette_swap", 16],
  ["palette_swap", -18],
  ["palette_swap", 28],
  ["palette_swap", -24],
  ["highlight_word", 16],
  ["highlight_word", -22],
  ["text_mask_image", 26],
  ["text_mask_image", -30],
  ["overlap_depth", 34],
  ["overlap_depth", -16],
];

function shippingGrid(entries, file) {
  const cols = 3;
  const rows = 3;
  const cellW = 640;
  const cellH = 360;
  const labelH = 32;
  const gap = 16;
  const width = cols * cellW + (cols + 1) * gap;
  const height = rows * (cellH + labelH) + (rows + 1) * gap;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#141210";
  ctx.fillRect(0, 0, width, height);
  ctx.font = "18px Arial";
  ctx.textBaseline = "middle";
  for (let i = 0; i < cols * rows; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = gap + col * (cellW + gap);
    const y = gap + row * (cellH + labelH + gap);
    const entry = entries[i];
    ctx.fillStyle = "#2A2622";
    ctx.fillRect(x, y, cellW, cellH + labelH);
    if (!entry) continue;
    const image = new Image();
    image.src = fs.readFileSync(entry.cover);
    ctx.drawImage(image, x, y, cellW, cellH);
    ctx.fillStyle = "#F4F1EA";
    ctx.fillText(entry.label, x + 10, y + cellH + labelH / 2);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, canvas.toBuffer("image/png"));
}

async function shippingBatch() {
  const outRoot = path.join(ROOT, "docs", "template-pipeline", "shipping");
  const candidates = path.join(ROOT, "docs", "template-pipeline", "shipping-candidates");
  fs.rmSync(candidates, { recursive: true, force: true });
  fs.mkdirSync(outRoot, { recursive: true });
  fs.mkdirSync(candidates, { recursive: true });
  const seeds = ["health-medical", "cinema-neon", "company-minimal"];
  const plan = [];
  seeds.forEach((seed) => {
    SHIPPING_RECIPE.forEach(([operator, degrees], index) => {
      plan.push({
        seed,
        kind: operator === "palette_swap" ? "safe" : "creative",
        operator,
        degrees,
        index: index + 1,
        run: "shipping",
      });
    });
  });
  const rows = [];
  for (const item of plan) await runVariant(item, rows, outRoot);
  const passed = rows.filter((row) => row.passedBoth);
  passed.forEach((row) => {
    const slides = path.join(row.dir, "slides");
    const dest = path.join(candidates, row.seed, path.basename(row.dir));
    fs.cpSync(slides, dest, { recursive: true });
  });
  const best = passed.slice().sort((a, b) => (b.mean || 0) - (a.mean || 0) || a.seed.localeCompare(b.seed)).slice(0, 9);
  const gridFile = path.join(candidates, "shipping-grid.png");
  shippingGrid(best.map((row) => ({
    cover: row.cover,
    label: row.seed + "  " + path.basename(row.dir) + "  " + row.mean,
  })), gridFile);
  const summary = {
    variants: rows.length,
    passedBoth: passed.length,
    candidates: passed.map((row) => ({
      seed: row.seed,
      operator: row.operator,
      degrees: row.degrees,
      mean: row.mean,
      before: row.before,
      after: row.after,
    })),
  };
  fs.writeFileSync(path.join(outRoot, "summary.json"), JSON.stringify(summary, null, 2) + "\n");
  console.log(JSON.stringify(summary));
  return { rows, summary, gridFile };
}

async function main() {
  writeSeedDna(ROOT);
  const pool = buildPool();
  const outDir = path.join(ROOT, "docs", "template-pipeline", "mutations");
  const jsonDir = path.join(ROOT, "generated-templates", "mutations");
  const results = [];
  for (const id of SEEDS) {
    const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "app-library", id + ".json"), "utf8"));
    const renderDir = path.join(outDir, id);
    console.log("render seed " + id);
    const seedPngs = renderDeck(seed, renderDir, "seed");
    for (let variantIndex = 1; variantIndex <= 5; variantIndex += 1) {
      const variant = mutate(seed, variantIndex, pool);
      const file = path.join(jsonDir, id, "v" + variantIndex + ".json");
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(variant, null, 2) + "\n");
      console.log("render " + variant.id);
      const pngs = renderDeck(variant, renderDir, "v" + variantIndex);
      const review = await reviewRendered(pngs, {
        seed: id,
        operator: "palette-v" + variantIndex,
        kind: "safe",
        run: "dna",
      });
      const scores = seedPngs.map((png, index) => Math.round(windowSsim(gray(png), gray(pngs[index])) * 10000) / 100);
      const mean = Math.round((scores.reduce((sum, n) => sum + n, 0) / scores.length) * 100) / 100;
      const gate = gateAgainstDna(variant, seed);
      const failures = gate.failures.concat(aspectFailures(seed, variant));
      const row = {
        id: variant.id,
        seed: id,
        variant: variantIndex,
        hueShift: SHIFTS[variantIndex - 1],
        photos: variant.mutation.photos,
        scores,
        mean,
        ok: failures.length === 0,
        failures,
        keptSlides: review.kept,
        rejectedSlides: review.rejected,
        visionPassed: review.rejected === 0 && review.kept === pngs.length,
      };
      results.push(row);
      console.log(JSON.stringify(row));
    }
  }
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "results.json"), JSON.stringify(results, null, 2) + "\n");
  console.log("done " + results.length);
}

function cli(argv) {
  const modeArg = argv.find((arg) => arg.startsWith("--mode="));
  const seedId = argv.find((arg) => arg && !arg.startsWith("-"));
  return { seedId, mode: modeArg ? modeArg.slice("--mode=".length) : "" };
}

if (require.main === module) {
  const { seedId, mode } = cli(process.argv.slice(2));
  let job;
  if (mode === "shipping") job = shippingBatch();
  else if (mode === "unified") job = unifiedBatch();
  else if (mode === "creative") {
    if (!seedId) {
      console.error("usage: node services/templatePipeline/mutate.js <seed-id> --mode=creative");
      process.exit(1);
    }
    job = creativeBatch(seedId);
  } else job = main();
  Promise.resolve(job).catch((error) => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  });
}

module.exports = { mutate, SHIFTS, creativeBatch, unifiedBatch, shippingBatch };
