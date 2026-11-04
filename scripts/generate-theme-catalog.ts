/**
 * Theme Catalog — regenerate People Strategy 2026 once per visual world.
 *
 *   node -r ts-node/register/transpile-only scripts/generate-theme-catalog.ts
 *
 * Layouts are identical; only theme.json / tokens change aesthetics.
 * Outputs: out/theme-catalog/<world>/preview-grid.png + deck.pptx
 *           out/theme-catalog/catalog-overview.png
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { createCanvas, loadImage } = require("canvas");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "out", "theme-catalog");

const WORLDS = [
  "tech-minimalist",
  "luxury-editorial",
  "brutalist-agency",
  "healthcare-clinical",
  "corporate-finance",
  "cyberpunk-gaming",
];

const LABELS: Record<string, string> = {
  "tech-minimalist": "1 · Tech Minimalist",
  "luxury-editorial": "2 · Luxury Editorial",
  "brutalist-agency": "3 · Brutalist Agency",
  "healthcare-clinical": "4 · Healthcare Clinical",
  "corporate-finance": "5 · Corporate Finance",
  "cyberpunk-gaming": "6 · Cyberpunk Gaming",
};

function ensureDir(d: string) {
  fs.mkdirSync(d, { recursive: true });
}

function generateWorld(world: string) {
  console.log("\n========== " + world + " ==========");
  const result = spawnSync(
    process.execPath,
    ["-r", "ts-node/register/transpile-only", "scripts/generate-dense-report-deck.ts", world],
    {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
      shell: false,
    }
  );
  if (result.status !== 0) {
    throw new Error("Theme catalog failed for " + world + " (exit " + result.status + ")");
  }
}

async function writeOverview(gridPaths: Array<{ world: string; grid: string }>) {
  const cols = 3;
  const rows = 2;
  const cellW = 640;
  const cellH = 400;
  const pad = 20;
  const header = 56;
  const canvas = createCanvas(cols * (cellW + pad) + pad, rows * (cellH + pad) + pad + header);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0B1220";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#F8FAFC";
  ctx.font = "700 22px Segoe UI";
  ctx.fillText("Theme Catalog — People Strategy 2026 (same layouts, token-only worlds)", pad, 34);
  for (let i = 0; i < gridPaths.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col * (cellW + pad);
    const y = header + pad + row * (cellH + pad);
    ctx.fillStyle = "#152238";
    ctx.fillRect(x, y, cellW, cellH);
    try {
      const img = await loadImage(gridPaths[i].grid);
      const scale = Math.min((cellW - 16) / img.width, (cellH - 40) / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, x + (cellW - dw) / 2, y + 28, dw, dh);
    } catch {
      ctx.fillStyle = "#334155";
      ctx.fillRect(x + 8, y + 28, cellW - 16, cellH - 40);
    }
    ctx.fillStyle = "#E2E8F0";
    ctx.font = "600 14px Segoe UI";
    ctx.fillText(LABELS[gridPaths[i].world] || gridPaths[i].world, x + 12, y + 20);
  }
  const outPath = path.join(OUT, "catalog-overview.png");
  fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
  return outPath;
}

async function main() {
  ensureDir(OUT);
  const grids: Array<{ world: string; grid: string }> = [];
  for (const world of WORLDS) {
    generateWorld(world);
    const grid = path.join(OUT, world, "preview-grid.png");
    if (!fs.existsSync(grid)) throw new Error("Missing preview grid for " + world);
    grids.push({ world, grid });
  }
  const overview = await writeOverview(grids);
  const index = {
    generatedAt: new Date().toISOString(),
    note: "Identical report layouts; aesthetics from theme.json catalog + tokens only.",
    worlds: WORLDS.map((w) => ({
      id: w,
      label: LABELS[w],
      dir: "out/theme-catalog/" + w,
      previewGrid: "out/theme-catalog/" + w + "/preview-grid.png",
      pptx: "out/theme-catalog/" + w + "/deck.pptx",
    })),
    overview: "out/theme-catalog/catalog-overview.png",
  };
  fs.writeFileSync(path.join(OUT, "catalog-index.json"), JSON.stringify(index, null, 2));
  console.log("\n=== THEME CATALOG READY ===");
  console.log("Overview:", overview);
  WORLDS.forEach((w) => console.log(" -", w, "→", path.join(OUT, w, "preview-grid.png")));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
