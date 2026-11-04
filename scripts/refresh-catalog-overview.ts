const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

const OUT = path.join(__dirname, "..", "out", "theme-catalog");
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

async function main() {
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
  ctx.fillText("Theme Catalog — People Strategy 2026 (token-only worlds)", pad, 34);
  for (let i = 0; i < WORLDS.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col * (cellW + pad);
    const y = header + pad + row * (cellH + pad);
    ctx.fillStyle = "#152238";
    ctx.fillRect(x, y, cellW, cellH);
    const img = await loadImage(path.join(OUT, WORLDS[i], "preview-grid.png"));
    const scale = Math.min((cellW - 16) / img.width, (cellH - 40) / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, x + (cellW - dw) / 2, y + 28, dw, dh);
    ctx.fillStyle = "#E2E8F0";
    ctx.font = "600 14px Segoe UI";
    ctx.fillText(LABELS[WORLDS[i]], x + 12, y + 20);
  }
  const outPath = path.join(OUT, "catalog-overview.png");
  fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
  console.log("Wrote", outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
