/**
 * PPTX round-trip gate: export → soffice PDF → pdftotext -bbox vs textMeasure.
 * Offline. Missing soffice → { skipped: true, reason: "pptx gate skipped" }.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");
const { exportDeckPptx } = require("../catalog");
const { findPdftotext } = require("./loLines");
const { countCanvasLines } = require("./canvasLines");

const ROOT = path.join(__dirname, "..", "..", "..");

function findBin(names, fallbacks) {
  for (let i = 0; i < names.length; i += 1) {
    try {
      const found = spawnSync("where.exe", [names[i]], { encoding: "utf8" }).stdout
        .split(/\r?\n/).map((l) => l.trim()).filter(Boolean)[0];
      if (found && fs.existsSync(found)) return found;
    } catch (error) { /* keep looking */ }
  }
  for (let i = 0; i < fallbacks.length; i += 1) {
    if (fs.existsSync(fallbacks[i])) return fallbacks[i];
  }
  return "";
}

function findSoffice() {
  return findBin(["soffice.com", "soffice"], [
    "C:\\Program Files\\LibreOffice\\program\\soffice.com",
    "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
    "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.com",
  ]);
}

function findPdftoppm() {
  return findBin(["pdftoppm"], []);
}

function spanText(el) {
  const spans = (el.textContent && el.textContent.spans) || [];
  return spans.map((s) => String(s && s.text != null ? s.text : "")).join("");
}

/** pdftotext -bbox emits HTML entities (&amp;, &apos;, &#39;, …). */
function decodePdfText(raw) {
  return String(raw || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function parseBboxPage(xml, pageIndex1) {
  const pages = [];
  const pageRe = /<page\b[^>]*>[\s\S]*?<\/page>/gi;
  let match;
  while ((match = pageRe.exec(xml))) pages.push(match[0]);
  const pageXml = pages[pageIndex1 - 1] || "";
  if (!pageXml) return { words: [], pageW: 1600, pageH: 900 };
  const dims = pageXml.match(/<page[^>]*width="([^"]+)"[^>]*height="([^"]+)"/i);
  const pageW = dims ? Number(dims[1]) : 1600;
  const pageH = dims ? Number(dims[2]) : 900;
  const scaleX = 1600 / pageW;
  const scaleY = 900 / pageH;
  const words = [];
  const re = /<word[^>]*xMin="([^"]+)"[^>]*yMin="([^"]+)"[^>]*xMax="([^"]+)"[^>]*yMax="([^"]+)"[^>]*>([^<]*)<\/word>/gi;
  let m;
  while ((m = re.exec(pageXml))) {
    words.push({
      xMin: Number(m[1]) * scaleX,
      yMin: Number(m[2]) * scaleY,
      xMax: Number(m[3]) * scaleX,
      yMax: Number(m[4]) * scaleY,
      // pdftotext -bbox HTML-escapes entities; decode so needles match deck copy
      text: decodePdfText(m[5]),
    });
  }
  return { words, pageW, pageH };
}

function checkSlide(deck, layoutId, words) {
  const layout = deck.layouts && deck.layouts[layoutId];
  const reasons = [];
  const pageText = words.map((w) => w.text).join(" ");
  (layout && layout.elements || []).forEach((el) => {
    if (!el || el.type !== "text") return;
    const full = spanText(el).replace(/\s+/g, " ").trim();
    if (!full) return;
    const needle = full.slice(0, 12);
    if (needle && pageText.indexOf(needle) < 0 && pageText.replace(/\s+/g, " ").indexOf(needle) < 0) {
      // also try without spaces for OCR-ish joins
      const compactPage = pageText.replace(/\s+/g, "");
      const compactNeedle = needle.replace(/\s+/g, "");
      if (!compactNeedle || compactPage.indexOf(compactNeedle) < 0) {
        reasons.push("pptx mismatch: " + el.id + " missing text");
        return;
      }
    }
    const box = {
      x: Number(el.x) || 0,
      y: Number(el.y) || 0,
      right: (Number(el.x) || 0) + (Number(el.width) || 0),
      bottom: (Number(el.y) || 0) + (Number(el.height) || 0),
    };
    const inside = words.filter((w) => {
      const cx = (w.xMin + w.xMax) / 2;
      const cy = (w.yMin + w.yMax) / 2;
      return cx >= box.x - 2 && cx <= box.right + 2 && cy >= box.y - 2 && cy <= box.bottom + 8;
    });
    if (!inside.length) {
      reasons.push("pptx mismatch: " + el.id + " missing text");
      return;
    }
    const baselines = [];
    inside.forEach((w) => {
      const key = Math.round(w.yMin / 4) * 4;
      if (baselines.indexOf(key) < 0) baselines.push(key);
    });
    baselines.sort((a, b) => a - b);
    const measured = el.textMeasure && Number(el.textMeasure.lines);
    const expected = Number.isFinite(measured)
      ? measured
      : countCanvasLines(el, deck.tokens).lines;
    if (Number.isFinite(expected) && baselines.length > expected) {
      reasons.push("pptx mismatch: " + el.id + " line count");
    }
    const last = baselines[baselines.length - 1];
    if (Number.isFinite(last) && last > box.bottom + 4) {
      reasons.push("pptx mismatch: " + el.id + " baseline");
    }
  });
  return reasons;
}

function rasterize(pptxPath, workDir) {
  const sofficeBin = findSoffice();
  if (!sofficeBin) return { ok: false, skipped: true, reason: "pptx gate skipped" };
  const pdftoppmBin = findPdftoppm();
  const pdftotextBin = findPdftotext();
  if (!pdftoppmBin || !pdftotextBin) return { ok: false, skipped: true, reason: "pptx gate skipped" };

  const userInstall = path.join(os.tmpdir(), "lo-pptx-gate-" + Date.now());
  fs.mkdirSync(userInstall, { recursive: true });
  const envArg = "-env:UserInstallation=file:///" + userInstall.replace(/\\/g, "/");
  const soffice = spawnSync(sofficeBin, [
    "--headless",
    "--norestore",
    envArg,
    "--convert-to", "pdf",
    "--outdir", workDir,
    pptxPath,
  ], { encoding: "utf8", cwd: workDir, shell: false, timeout: 180000 });
  if (soffice.error || soffice.status !== 0) {
    return {
      ok: false,
      skipped: true,
      reason: "pptx gate skipped",
      detail: (soffice.stderr || "") + (soffice.stdout || "") + (soffice.error ? String(soffice.error) : ""),
    };
  }
  const pdfPath = path.join(workDir, path.basename(pptxPath, ".pptx") + ".pdf");
  if (!fs.existsSync(pdfPath)) {
    return { ok: false, skipped: true, reason: "pptx gate skipped", detail: "pdf missing" };
  }
  const prefix = path.join(workDir, "lo-slide");
  const ppm = spawnSync(pdftoppmBin, ["-png", "-scale-to-x", "1600", "-scale-to-y", "900", pdfPath, prefix], {
    encoding: "utf8",
    timeout: 120000,
  });
  if (ppm.error || ppm.status !== 0) {
    return {
      ok: false,
      skipped: true,
      reason: "pptx gate skipped",
      detail: (ppm.stderr || "") + (ppm.error ? String(ppm.error) : ""),
    };
  }
  const text = spawnSync(pdftotextBin, ["-bbox", pdfPath, "-"], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    timeout: 60000,
  });
  if (text.error || text.status !== 0) {
    return {
      ok: false,
      skipped: true,
      reason: "pptx gate skipped",
      detail: (text.stderr || "") + (text.error ? String(text.error) : ""),
    };
  }
  return { ok: true, pdfPath, bboxXml: text.stdout || "", workDir, sofficeBin };
}

/**
 * Export deck to outDir/deck.pptx, rasterize, compare text boxes.
 * @returns {{ pass: boolean, skipped?: boolean, reason?: string, pptxPath: string, slides: Array, failures: string[] }}
 */
async function runPptxGate(deck, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const pptxPath = path.join(outDir, "deck.pptx");
  await exportDeckPptx(deck, pptxPath);

  const workDir = path.join(outDir, "_pptx-gate");
  fs.mkdirSync(workDir, { recursive: true });
  const gateCopy = path.join(workDir, "deck.pptx");
  fs.copyFileSync(pptxPath, gateCopy);

  const raster = rasterize(gateCopy, workDir);
  if (raster.skipped || !raster.ok) {
    console.log("pptx gate skipped");
    return {
      pass: true,
      skipped: true,
      reason: raster.reason || "pptx gate skipped",
      pptxPath,
      slides: [],
      failures: [],
    };
  }

  const sequence = deck.layoutSequence || Object.keys(deck.layouts || {});
  const slides = [];
  const failures = [];
  sequence.forEach((layoutId, index) => {
    const page = parseBboxPage(raster.bboxXml, index + 1);
    const reasons = checkSlide(deck, layoutId, page.words);
    const pass = reasons.length === 0;
    slides.push({ slide: index + 1, pass, reasons });
    reasons.forEach((reason) => failures.push(reason + " on slide " + (index + 1)));
  });
  return {
    pass: failures.length === 0,
    skipped: false,
    pptxPath,
    slides,
    failures,
  };
}

function applyPptxGate(analysis, gate) {
  if (!gate || gate.skipped) {
    const next = Object.assign({}, analysis || {});
    next.pptxGate = { skipped: true, reason: (gate && gate.reason) || "pptx gate skipped" };
    return next;
  }
  const next = Object.assign({}, analysis || {});
  const slides = Array.isArray(next.slides) ? next.slides.slice() : [];
  const failures = Array.isArray(next.failures) ? next.failures.slice() : [];
  (gate.slides || []).forEach((item) => {
    const index = item.slide - 1;
    const slide = slides[index] || { slide: item.slide, pass: true, score: 100, reasons: [], vision: null };
    if (!item.pass) {
      slide.pass = false;
      slide.score = 0;
      slide.reasons = (slide.reasons || []).concat(item.reasons);
      item.reasons.forEach((reason) => {
        const labeled = reason + " on slide " + item.slide;
        if (failures.indexOf(labeled) < 0) failures.push(labeled);
      });
    }
    slides[index] = slide;
  });
  const total = slides.length || 1;
  const passed = slides.filter((s) => s.pass).length;
  next.slides = slides;
  next.failures = failures;
  next.passed = passed;
  next.total = total;
  next.score = Math.round((passed / total) * 100);
  next.pptxGate = { skipped: false, pass: gate.pass, failures: gate.failures };
  return next;
}

module.exports = {
  runPptxGate,
  applyPptxGate,
  findSoffice,
  checkSlide,
  ROOT,
};
