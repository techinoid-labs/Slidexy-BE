/**
 * Renders every palette × typePair to one contact sheet PNG.
 * node -r ts-node/register/transpile-only scripts/contact-sheet.ts
 */
const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

require("../services/templatePipeline/fonts"); // register Office faces for canvas
const tokens = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "engine", "tokens.json"), "utf8"));
const outDir = path.join(__dirname, "..", "out", "contact-sheet");
fs.mkdirSync(outDir, { recursive: true });

const palettes = Object.keys(tokens.palettes);
const pairs = Object.keys(tokens.typePairs);
const cellW = 420;
const cellH = 240;
const cols = pairs.length;
const rows = palettes.length;
const canvas = createCanvas(cols * cellW + 40, rows * cellH + 80);
const ctx = canvas.getContext("2d");
ctx.fillStyle = "#111";
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = "#fff";
ctx.font = "20px Arial";
ctx.fillText("Engine v1 — palette × typePair", 20, 36);

palettes.forEach((pName, r) => {
  const p = tokens.palettes[pName];
  pairs.forEach((tName, c) => {
    const t = tokens.typePairs[tName];
    const x = 20 + c * cellW;
    const y = 60 + r * cellH;
    ctx.fillStyle = p.bg;
    ctx.fillRect(x, y, cellW - 16, cellH - 16);
    ctx.fillStyle = p.surface;
    ctx.fillRect(x + 24, y + 40, cellW - 64, 120);
    ctx.fillStyle = p.ink;
    ctx.font = 'bold 28px "' + t.display + '"';
    ctx.fillText("Aa Title", x + 40, y + 90);
    ctx.fillStyle = p.muted;
    ctx.font = '16px "' + t.body + '"';
    ctx.fillText(pName + " / " + tName, x + 40, y + 130);
    ctx.fillStyle = p.accent;
    ctx.fillRect(x + 40, y + 150, 64, 8);
  });
});

const file = path.join(outDir, "palette-type-sheet.png");
fs.writeFileSync(file, canvas.toBuffer("image/png"));
console.log("wrote", file);

// grep guard helper note
console.log("palettes", palettes.length, "typePairs", pairs.length, "dark", palettes.filter((n) => tokens.palettes[n].dark).length);
