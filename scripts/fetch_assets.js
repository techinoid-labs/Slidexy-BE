/**
 * Fill assets/decorations/{tech,organic,corporate,creative}/ with
 * original transparent SVG and PNG decorations.
 *
 *   node scripts/fetch_assets.js
 *
 * Each category gets eight shapes. The PNG is what the slide renderer
 * draws. The SVG is the same shape for editing. Names stay short:
 * grid-01, blob-02, frame-03.
 */

const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

const ROOT = path.join(__dirname, "..");
const LIBRARY = path.join(ROOT, "assets", "decorations");
const SIZE = 512;

const SETS = {
  tech: [
    ["grid-01", "#9aa7b2", drawGrid],
    ["node-02", "#7f8c99", drawNodes],
    ["ring-03", "#c5d0d6", drawRings],
    ["hex-04", "#8ea4b2", drawHex],
    ["circuit-05", "#6f7c88", drawCircuit],
    ["orbit-06", "#d5dee4", drawOrbit],
    ["chip-07", "#5e6a74", drawChip],
    ["dash-08", "#a8b4bc", drawDashes],
  ],
  organic: [
    ["blob-01", "#6d8f72", drawBlob],
    ["blob-02", "#c4a574", drawBlob],
    ["leaf-03", "#3f6b4a", drawLeaf],
    ["pebble-04", "#8d9a86", drawPebble],
    ["wave-05", "#6e8b74", drawWave],
    ["sprout-06", "#2f4f38", drawSprout],
    ["drop-07", "#7fa37a", drawDrop],
    ["moss-08", "#4e6b52", drawMoss],
  ],
  corporate: [
    ["bar-01", "#1e3a5f", drawBars],
    ["frame-02", "#8d97a3", drawFrame],
    ["column-03", "#243044", drawColumns],
    ["rule-04", "#5c6b7a", drawRule],
    ["block-05", "#d5dbe3", drawBlocks],
    ["diamond-06", "#31475f", drawDiamond],
    ["stack-07", "#1a2b3c", drawStack],
    ["line-08", "#9aa3ad", drawLine],
  ],
  creative: [
    ["splash-01", "#e07a5f", drawBlob],
    ["star-02", "#f2cc8f", drawStar],
    ["burst-03", "#3d405b", drawBurst],
    ["squiggle-04", "#e07a5f", drawSquiggle],
    ["confetti-05", "#81b29a", drawConfetti],
    ["arc-06", "#f2cc8f", drawArc],
    ["blob-07", "#3d405b", drawBlob],
    ["dot-08", "#e07a5f", drawDots],
  ],
};

function svgWrap(body) {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">',
    body,
    "</svg>",
    "",
  ].join("\n");
}

function drawGrid(ctx) {
  ctx.lineWidth = 8;
  ctx.strokeStyle = ctx.fillStyle;
  for (let i = 48; i <= 464; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 40);
    ctx.lineTo(i, 472);
    ctx.moveTo(40, i);
    ctx.lineTo(472, i);
    ctx.stroke();
  }
}

function drawNodes(ctx) {
  const points = [[120, 140], [280, 90], [390, 210], [250, 280], [140, 360], [360, 390]];
  ctx.lineWidth = 10;
  ctx.strokeStyle = ctx.fillStyle;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (!index) ctx.moveTo(point[0], point[1]);
    else ctx.lineTo(point[0], point[1]);
  });
  ctx.stroke();
  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point[0], point[1], 22, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawRings(ctx) {
  ctx.lineWidth = 16;
  ctx.strokeStyle = ctx.fillStyle;
  [90, 150, 210].forEach((radius) => {
    ctx.beginPath();
    ctx.arc(256, 256, radius, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawHex(ctx) {
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const angle = Math.PI / 6 + (i * Math.PI) / 3;
    const x = 256 + Math.cos(angle) * 190;
    const y = 256 + Math.sin(angle) * 190;
    if (!i) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.globalAlpha = 0.9;
  ctx.fill();
}

function drawCircuit(ctx) {
  ctx.lineWidth = 12;
  ctx.lineJoin = "round";
  ctx.strokeStyle = ctx.fillStyle;
  ctx.beginPath();
  ctx.moveTo(60, 120);
  ctx.lineTo(200, 120);
  ctx.lineTo(200, 280);
  ctx.lineTo(360, 280);
  ctx.lineTo(360, 400);
  ctx.lineTo(460, 400);
  ctx.stroke();
  [[200, 120], [200, 280], [360, 280], [360, 400]].forEach((point) => {
    ctx.fillRect(point[0] - 16, point[1] - 16, 32, 32);
  });
}

function drawOrbit(ctx) {
  ctx.lineWidth = 10;
  ctx.strokeStyle = ctx.fillStyle;
  ctx.beginPath();
  ctx.ellipse(256, 256, 200, 90, -0.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(400, 190, 28, 0, Math.PI * 2);
  ctx.fill();
}

function drawChip(ctx) {
  ctx.fillRect(140, 140, 232, 232);
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < 5; i += 1) {
    ctx.fillRect(80, 170 + i * 36, 60, 14);
    ctx.fillRect(372, 170 + i * 36, 60, 14);
  }
}

function drawDashes(ctx) {
  for (let i = 0; i < 7; i += 1) {
    ctx.fillRect(70, 80 + i * 56, 370 - (i % 2) * 80, 18);
  }
}

function drawBlob(ctx, seed) {
  const wobble = (seed || 1) * 17;
  ctx.beginPath();
  ctx.moveTo(160, 90);
  ctx.bezierCurveTo(300, 40, 460, 120 + wobble, 430, 250);
  ctx.bezierCurveTo(400, 420, 260, 470, 150, 400);
  ctx.bezierCurveTo(40, 330, 30, 160, 160, 90);
  ctx.closePath();
  ctx.fill();
}

function drawLeaf(ctx) {
  ctx.beginPath();
  ctx.moveTo(256, 40);
  ctx.bezierCurveTo(420, 140, 400, 360, 256, 470);
  ctx.bezierCurveTo(112, 360, 92, 140, 256, 40);
  ctx.fill();
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = "#f4f1ea";
  ctx.fillRect(248, 90, 12, 340);
}

function drawPebble(ctx) {
  ctx.beginPath();
  ctx.ellipse(256, 270, 180, 120, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawWave(ctx) {
  ctx.lineWidth = 28;
  ctx.lineCap = "round";
  ctx.strokeStyle = ctx.fillStyle;
  [140, 230, 320].forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.bezierCurveTo(140, y - 70, 240, y + 70, 340, y);
    ctx.bezierCurveTo(400, y - 30, 450, y + 20, 480, y);
    ctx.stroke();
  });
}

function drawSprout(ctx) {
  ctx.lineWidth = 16;
  ctx.lineCap = "round";
  ctx.strokeStyle = ctx.fillStyle;
  ctx.beginPath();
  ctx.moveTo(256, 430);
  ctx.quadraticCurveTo(250, 260, 256, 150);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(190, 180, 70, 36, -0.8, 0, Math.PI * 2);
  ctx.ellipse(330, 160, 70, 36, 0.7, 0, Math.PI * 2);
  ctx.fill();
}

function drawDrop(ctx) {
  ctx.beginPath();
  ctx.moveTo(256, 50);
  ctx.bezierCurveTo(390, 180, 380, 360, 256, 450);
  ctx.bezierCurveTo(132, 360, 122, 180, 256, 50);
  ctx.fill();
}

function drawMoss(ctx) {
  [[140, 180, 70], [250, 140, 90], [360, 200, 64], [180, 300, 80], [310, 330, 76]].forEach((dot) => {
    ctx.beginPath();
    ctx.arc(dot[0], dot[1], dot[2], 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawBars(ctx) {
  [80, 160, 240, 320].forEach((x, index) => {
    const height = 180 + index * 50;
    ctx.fillRect(x, 430 - height, 48, height);
  });
}

function drawFrame(ctx) {
  ctx.lineWidth = 22;
  ctx.strokeStyle = ctx.fillStyle;
  ctx.strokeRect(70, 70, 372, 372);
}

function drawColumns(ctx) {
  [90, 210, 330].forEach((x) => ctx.fillRect(x, 80, 70, 350));
}

function drawRule(ctx) {
  ctx.fillRect(40, 230, 432, 18);
  ctx.fillRect(40, 280, 280, 18);
}

function drawBlocks(ctx) {
  ctx.fillRect(70, 70, 160, 160);
  ctx.globalAlpha = 0.7;
  ctx.fillRect(190, 190, 160, 160);
  ctx.globalAlpha = 0.45;
  ctx.fillRect(280, 90, 150, 150);
}

function drawDiamond(ctx) {
  ctx.beginPath();
  ctx.moveTo(256, 50);
  ctx.lineTo(450, 256);
  ctx.lineTo(256, 462);
  ctx.lineTo(62, 256);
  ctx.closePath();
  ctx.fill();
}

function drawStack(ctx) {
  [300, 210, 120].forEach((y, index) => {
    ctx.globalAlpha = 1 - index * 0.2;
    ctx.fillRect(80 + index * 30, y, 300, 70);
  });
}

function drawLine(ctx) {
  ctx.lineWidth = 14;
  ctx.strokeStyle = ctx.fillStyle;
  ctx.beginPath();
  ctx.moveTo(40, 256);
  ctx.lineTo(472, 256);
  ctx.moveTo(256, 40);
  ctx.lineTo(256, 472);
  ctx.stroke();
}

function drawStar(ctx) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 ? 80 : 200;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = 256 + Math.cos(angle) * radius;
    const y = 256 + Math.sin(angle) * radius;
    if (!i) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawBurst(ctx) {
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.strokeStyle = ctx.fillStyle;
  for (let i = 0; i < 12; i += 1) {
    const angle = (i * Math.PI) / 6;
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(angle) * 40, 256 + Math.sin(angle) * 40);
    ctx.lineTo(256 + Math.cos(angle) * 210, 256 + Math.sin(angle) * 210);
    ctx.stroke();
  }
}

function drawSquiggle(ctx) {
  ctx.lineWidth = 22;
  ctx.lineCap = "round";
  ctx.strokeStyle = ctx.fillStyle;
  ctx.beginPath();
  ctx.moveTo(60, 180);
  ctx.bezierCurveTo(140, 40, 200, 400, 280, 200);
  ctx.bezierCurveTo(340, 40, 400, 420, 460, 260);
  ctx.stroke();
}

function drawConfetti(ctx) {
  const spots = [[90, 100], [200, 80], [340, 140], [430, 90], [120, 240], [260, 220], [400, 280], [80, 380], [220, 400], [360, 390], [450, 360]];
  spots.forEach((spot, index) => {
    ctx.save();
    ctx.translate(spot[0], spot[1]);
    ctx.rotate(index * 0.4);
    ctx.fillRect(-16, -8, 32, 16);
    ctx.restore();
  });
}

function drawArc(ctx) {
  ctx.lineWidth = 28;
  ctx.strokeStyle = ctx.fillStyle;
  ctx.beginPath();
  ctx.arc(256, 300, 180, Math.PI, 0);
  ctx.stroke();
}

function drawDots(ctx) {
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      ctx.beginPath();
      ctx.arc(90 + col * 80, 90 + row * 80, 16, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function svgFor(name, color) {
  if (name.startsWith("grid")) {
    const lines = [];
    for (let i = 48; i <= 464; i += 64) {
      lines.push('<path d="M' + i + ' 40 V472 M40 ' + i + ' H472" stroke="' + color + '" stroke-width="8"/>');
    }
    return svgWrap(lines.join("\n"));
  }
  if (name.startsWith("blob") || name.startsWith("splash")) {
    return svgWrap('<path d="M160 90 C300 40 460 140 430 250 C400 420 260 470 150 400 C40 330 30 160 160 90 Z" fill="' + color + '"/>');
  }
  if (name.startsWith("ring") || name.startsWith("orbit")) {
    return svgWrap('<circle cx="256" cy="256" r="180" stroke="' + color + '" stroke-width="16"/>');
  }
  if (name.startsWith("hex")) {
    return svgWrap('<polygon points="256,66 420,161 420,351 256,446 92,351 92,161" fill="' + color + '"/>');
  }
  if (name.startsWith("leaf") || name.startsWith("drop")) {
    return svgWrap('<path d="M256 40 C420 140 400 360 256 470 C112 360 92 140 256 40 Z" fill="' + color + '"/>');
  }
  if (name.startsWith("star")) {
    return svgWrap('<polygon points="256,56 300,180 430,180 326,260 366,390 256,314 146,390 186,260 82,180 212,180" fill="' + color + '"/>');
  }
  if (name.startsWith("frame")) {
    return svgWrap('<rect x="70" y="70" width="372" height="372" stroke="' + color + '" stroke-width="22"/>');
  }
  if (name.startsWith("bar") || name.startsWith("column") || name.startsWith("block") || name.startsWith("stack")) {
    return svgWrap('<rect x="90" y="80" width="70" height="350" fill="' + color + '"/><rect x="210" y="140" width="70" height="290" fill="' + color + '"/><rect x="330" y="200" width="70" height="230" fill="' + color + '"/>');
  }
  return svgWrap('<circle cx="256" cy="256" r="160" fill="' + color + '"/>');
}

function writeSet(vibe, items) {
  const dir = path.join(LIBRARY, vibe);
  fs.mkdirSync(dir, { recursive: true });
  items.forEach((item, index) => {
    const name = item[0];
    const color = item[1];
    const draw = item[2];
    const canvas = createCanvas(SIZE, SIZE);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    draw(ctx, index + 1);
    fs.writeFileSync(path.join(dir, name + ".png"), canvas.toBuffer("image/png"));
    fs.writeFileSync(path.join(dir, name + ".svg"), svgFor(name, color));
  });
  return items.length;
}

function fetchAssets() {
  const counts = {};
  Object.keys(SETS).forEach((vibe) => {
    counts[vibe] = writeSet(vibe, SETS[vibe]);
    console.log(vibe + " " + counts[vibe] + " assets");
  });
  return counts;
}

if (require.main === module) {
  fetchAssets();
}

module.exports = { fetchAssets, SETS };
