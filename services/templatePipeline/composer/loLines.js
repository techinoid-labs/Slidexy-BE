/**
 * LibreOffice line counts from pdftotext -bbox word boxes.
 *
 *   const { countLoLines } = require("./loLines");
 *   countLoLines(pdfPath, deck)
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function findPdftotext() {
  try {
    const found = spawnSync("where.exe", ["pdftotext"], { encoding: "utf8" }).stdout.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)[0];
    if (found && fs.existsSync(found)) return found;
  } catch (error) { /* fall through */ }
  const guess = path.join(
    process.env.LOCALAPPDATA || "",
    "Microsoft", "WinGet", "Packages"
  );
  return "pdftotext";
}

function countLoLines(pdfPath, deck, layoutId) {
  const bin = findPdftotext();
  const out = spawnSync(bin, ["-bbox", "-f", "1", "-l", "1", pdfPath, "-"], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
  if (out.error || out.status !== 0) {
    return { ok: false, error: (out.stderr || "") + (out.error ? String(out.error) : ""), elements: {} };
  }
  const xml = out.stdout || "";
  const page = xml.match(/<page[^>]*width="([^"]+)"[^>]*height="([^"]+)"/i);
  const pageW = page ? Number(page[1]) : 1600;
  const pageH = page ? Number(page[2]) : 900;
  const scaleX = 1600 / pageW;
  const scaleY = 900 / pageH;
  const words = [];
  const re = /<word[^>]*xMin="([^"]+)"[^>]*yMin="([^"]+)"[^>]*xMax="([^"]+)"[^>]*yMax="([^"]+)"[^>]*>([^<]*)<\/word>/gi;
  let match;
  while ((match = re.exec(xml))) {
    words.push({
      xMin: Number(match[1]) * scaleX,
      yMin: Number(match[2]) * scaleY,
      xMax: Number(match[3]) * scaleX,
      yMax: Number(match[4]) * scaleY,
      text: match[5],
    });
  }
  const layout = deck.layouts && deck.layouts[layoutId || (deck.layoutSequence || [])[0]];
  const elements = {};
  (layout && layout.elements || []).forEach((el) => {
    if (!el || el.type !== "text") return;
    const box = {
      x: Number(el.x) || 0,
      y: Number(el.y) || 0,
      right: (Number(el.x) || 0) + (Number(el.width) || 0),
      bottom: (Number(el.y) || 0) + (Number(el.height) || 0),
    };
    const inside = words.filter((w) => {
      const cx = (w.xMin + w.xMax) / 2;
      const cy = (w.yMin + w.yMax) / 2;
      return cx >= box.x - 2 && cx <= box.right + 2 && cy >= box.y - 2 && cy <= box.bottom + 2;
    });
    const baselines = new Set();
    inside.forEach((w) => baselines.add(Math.round(w.yMin / 4) * 4));
    elements[el.id] = {
      lines: baselines.size,
      words: inside.length,
      chromeMeasure: el.textMeasure && el.textMeasure.lines,
    };
  });
  return { ok: true, pageW, pageH, scaleX, scaleY, wordCount: words.length, elements };
}

module.exports = { countLoLines, findPdftotext };
