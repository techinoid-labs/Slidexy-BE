/**
 * Rasterize each gallery PPTX via LibreOffice and compare to canvas PNG.
 * Reports mean absolute pixel diff (0–255 scale on RGB).
 *
 * node -r ts-node/register/transpile-only scripts/pptx-diff.ts
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");
const { createCanvas, loadImage } = require("canvas");

const ROOT = path.join(__dirname, "..");
const GALLERY = path.join(ROOT, "out", "gallery");
const OUT = path.join(ROOT, "out", "pptx-diff");

function findSoffice(): string {
  const names = ["soffice.com", "soffice"];
  for (const n of names) {
    try {
      const found = spawnSync("where.exe", [n], { encoding: "utf8" })
        .stdout.split(/\r?\n/)
        .map((l: string) => l.trim())
        .filter(Boolean)[0];
      if (found && fs.existsSync(found)) return found;
    } catch (e) { /* continue */ }
  }
  const fallbacks = [
    "C:\\Program Files\\LibreOffice\\program\\soffice.com",
    "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
    "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.com",
    "/usr/bin/soffice",
    "/Applications/LibreOffice.app/Contents/MacOS/soffice",
  ];
  for (const f of fallbacks) if (fs.existsSync(f)) return f;
  return "";
}

function findPdftoppm(): string {
  try {
    const found = spawnSync("where.exe", ["pdftoppm"], { encoding: "utf8" })
      .stdout.split(/\r?\n/)
      .map((l: string) => l.trim())
      .filter(Boolean)[0];
    if (found) return found;
  } catch (e) { /* */ }
  const fb = ["C:\\Program Files\\poppler\\Library\\bin\\pdftoppm.exe", "/usr/bin/pdftoppm"];
  for (const f of fb) if (fs.existsSync(f)) return f;
  return "";
}

function rasterizePptx(pptxPath: string, workDir: string): string {
  const soffice = findSoffice();
  const pdftoppm = findPdftoppm();
  if (!soffice) throw new Error("LibreOffice soffice not found");
  if (!pdftoppm) throw new Error("pdftoppm not found");

  fs.mkdirSync(workDir, { recursive: true });
  const userInstall = path.join(os.tmpdir(), "lo-pptx-diff-" + Date.now());
  fs.mkdirSync(userInstall, { recursive: true });
  const envArg = "-env:UserInstallation=file:///" + userInstall.replace(/\\/g, "/");
  const conv = spawnSync(
    soffice,
    ["--headless", "--norestore", envArg, "--convert-to", "pdf", "--outdir", workDir, pptxPath],
    { encoding: "utf8", timeout: 120000 }
  );
  if (conv.status !== 0) {
    throw new Error("soffice convert failed: " + (conv.stderr || conv.stdout || "").slice(0, 300));
  }
  const pdf = path.join(workDir, path.basename(pptxPath, ".pptx") + ".pdf");
  if (!fs.existsSync(pdf)) throw new Error("pdf missing after convert");
  const prefix = path.join(workDir, "lo");
  const ppm = spawnSync(pdftoppm, ["-png", "-r", "72", "-singlefile", pdf, prefix], {
    encoding: "utf8",
    timeout: 60000,
  });
  if (ppm.status !== 0) throw new Error("pdftoppm failed: " + (ppm.stderr || "").slice(0, 200));
  const png = prefix + ".png";
  if (!fs.existsSync(png)) throw new Error("raster png missing");
  return png;
}

async function meanAbsDiff(canvasPng: string, loPng: string): Promise<{ mad: number; maxDiff: number; pixels: number }> {
  const a = await loadImage(canvasPng);
  const b = await loadImage(loPng);
  const w = 1600;
  const h = 900;
  const ca = createCanvas(w, h);
  const cb = createCanvas(w, h);
  const xa = ca.getContext("2d");
  const xb = cb.getContext("2d");
  xa.drawImage(a, 0, 0, w, h);
  xb.drawImage(b, 0, 0, w, h);
  const da = xa.getImageData(0, 0, w, h).data;
  const db = xb.getImageData(0, 0, w, h).data;
  let sum = 0;
  let maxDiff = 0;
  const n = w * h;
  for (let i = 0; i < da.length; i += 4) {
    const dr = Math.abs(da[i] - db[i]);
    const dg = Math.abs(da[i + 1] - db[i + 1]);
    const dbv = Math.abs(da[i + 2] - db[i + 2]);
    const d = (dr + dg + dbv) / 3;
    sum += d;
    if (d > maxDiff) maxDiff = d;
  }
  return { mad: sum / n, maxDiff, pixels: n };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const entries = fs.readdirSync(GALLERY).filter((n: string) => fs.statSync(path.join(GALLERY, n)).isDirectory());
  const results: any[] = [];
  let skipped = false;

  if (!findSoffice() || !findPdftoppm()) {
    skipped = true;
    console.warn("pptx-diff skipped: missing soffice or pdftoppm");
    const summary = { skipped: true, reason: "missing soffice or pdftoppm", results: [] };
    fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 2));
    return;
  }

  for (const id of entries) {
    const dir = path.join(GALLERY, id);
    const canvasPng = path.join(dir, "slide.png");
    const pptx = path.join(dir, "slide.pptx");
    if (!fs.existsSync(canvasPng) || !fs.existsSync(pptx)) {
      results.push({ id, error: "missing slide.png or slide.pptx" });
      continue;
    }
    const work = path.join(OUT, id);
    try {
      const loPng = rasterizePptx(pptx, work);
      const copy = path.join(work, "lo-slide.png");
      if (loPng !== copy) fs.copyFileSync(loPng, copy);
      const stats = await meanAbsDiff(canvasPng, copy);
      results.push({ id, mad: Number(stats.mad.toFixed(3)), maxDiff: stats.maxDiff, ok: stats.mad < 40 });
      console.log(id, "MAD", stats.mad.toFixed(2), "max", stats.maxDiff);
    } catch (err) {
      results.push({ id, error: (err as Error).message });
      console.log(id, "ERROR", (err as Error).message);
    }
  }

  const mads = results.filter((r) => r.mad != null).map((r) => r.mad);
  const summary = {
    skipped,
    count: results.length,
    compared: mads.length,
    meanMad: mads.length ? mads.reduce((a: number, b: number) => a + b, 0) / mads.length : null,
    maxMad: mads.length ? Math.max(...mads) : null,
    minMad: mads.length ? Math.min(...mads) : null,
    withinTolerance40: mads.filter((m: number) => m < 40).length,
    results,
  };
  fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 2));
  console.log("SUMMARY", JSON.stringify({ meanMad: summary.meanMad, maxMad: summary.maxMad, compared: summary.compared }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
