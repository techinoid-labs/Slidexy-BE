/**
 * One hundred and four SVG motifs in the six decoration families.
 * Paths are built once from fixed seeds so every rater of the code
 * gets the same outlines.
 */

const FAMILIES = [
  "organic",
  "geometric",
  "editorial_rule",
  "technical_grid",
  "hand_drawn",
  "photographic_frame",
];

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function n(value) {
  return Math.round(value * 10) / 10;
}

function poly(points, close) {
  const body = points.map((point, index) => (index ? "L" : "M") + " " + point[0] + " " + point[1]).join(" ");
  return close === false ? body : body + " Z";
}

function circle(cx, cy, r) {
  return "M " + n(cx - r) + " " + cy
    + " A " + r + " " + r + " 0 1 0 " + n(cx + r) + " " + cy
    + " A " + r + " " + r + " 0 1 0 " + n(cx - r) + " " + cy + " Z";
}

function ngon(sides, turn, radius) {
  const points = [];
  for (let i = 0; i < sides; i += 1) {
    const angle = turn + (i / sides) * Math.PI * 2;
    points.push([n(50 + Math.cos(angle) * radius), n(50 + Math.sin(angle) * radius)]);
  }
  return poly(points);
}

function star(points, turn, outer, inner) {
  const path = [];
  for (let i = 0; i < points * 2; i += 1) {
    const angle = turn + (i * Math.PI) / points;
    const radius = i % 2 ? inner : outer;
    path.push([n(50 + Math.cos(angle) * radius), n(50 + Math.sin(angle) * radius)]);
  }
  return poly(path);
}

function blob(seed, bumps) {
  const rng = mulberry32(seed);
  const points = [];
  for (let i = 0; i < bumps; i += 1) {
    const angle = (i / bumps) * Math.PI * 2;
    const radius = 18 + rng() * 26;
    points.push([n(50 + Math.cos(angle) * radius), n(50 + Math.sin(angle) * radius)]);
  }
  let d = "M " + n((points[0][0] + points[points.length - 1][0]) / 2) + " " + n((points[0][1] + points[points.length - 1][1]) / 2);
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    d += " Q " + current[0] + " " + current[1] + " " + n((current[0] + next[0]) / 2) + " " + n((current[1] + next[1]) / 2);
  }
  return d + " Z";
}

function squiggle(seed, loops) {
  const rng = mulberry32(seed);
  let x = 8;
  let y = 50;
  let d = "M " + x + " " + y;
  for (let i = 0; i < loops; i += 1) {
    x += 84 / loops;
    const cy = n(18 + rng() * 64);
    d += " Q " + n(x - 6) + " " + cy + " " + n(x) + " " + n(30 + rng() * 40);
  }
  return d;
}

function leaf(seed) {
  const rng = mulberry32(seed);
  const bend = n(30 + rng() * 40);
  return "M 50 88 C " + bend + " 70 18 40 50 8 C 82 40 " + n(100 - bend) + " 70 50 88 Z";
}

const elements = [];

function add(family, paint, aspect, d, strokeWidth) {
  const index = elements.filter((item) => item.family === family).length + 1;
  elements.push({
    id: family + "-" + String(index).padStart(2, "0"),
    family,
    paint,
    aspect,
    d,
    viewBox: "0 0 100 100",
    strokeWidth: strokeWidth || (paint === "stroke" ? 3 : 0),
  });
}

for (let i = 0; i < 12; i += 1) add("organic", "fill", 1, blob(4100 + i * 17, 6 + (i % 5)), 0);
for (let i = 0; i < 6; i += 1) add("organic", "fill", 0.62, leaf(5200 + i * 9), 0);

for (let sides = 3; sides <= 8; sides += 1) add("geometric", "fill", 1, ngon(sides, -Math.PI / 2, 38), 0);
for (let sides = 3; sides <= 8; sides += 1) add("geometric", "stroke", 1, ngon(sides, Math.PI / sides, 34), 3);
add("geometric", "fill", 1, star(5, -Math.PI / 2, 42, 18), 0);
add("geometric", "fill", 1, star(6, -Math.PI / 2, 42, 20), 0);
add("geometric", "stroke", 1, star(4, Math.PI / 4, 40, 16), 3);
add("geometric", "fill", 1, circle(50, 50, 36), 0);
add("geometric", "stroke", 1, circle(50, 50, 34) + " " + circle(50, 50, 18), 3);
add("geometric", "fill", 1.6, poly([[8, 62], [78, 8], [92, 38], [22, 92]]), 0);

const rules = [
  ["M 6 50 H 94", 8, 2.5],
  ["M 6 42 H 94 M 6 58 H 94", 8, 2],
  ["M 8 78 H 92", 7, 6],
  ["M 14 20 V 80", 0.18, 3],
  ["M 12 18 H 40 M 12 18 V 46", 1, 3],
  ["M 88 18 H 60 M 88 18 V 46", 1, 3],
  ["M 12 82 H 40 M 12 82 V 54", 1, 3],
  ["M 88 82 H 60 M 88 82 V 54", 1, 3],
  ["M 8 30 H 28 M 8 50 H 46 M 8 70 H 22", 1.4, 2.5],
  ["M 20 80 H 80 M 50 80 V 28", 1.2, 2.5],
  ["M 10 86 H 90 M 18 78 H 82", 6, 1.6],
  ["M 30 14 V 86 M 30 50 H 86", 1.3, 2.5],
  ["M 16 16 H 34 M 16 16 V 34 M 84 84 H 66 M 84 84 V 66", 1, 3],
  ["M 8 50 H 40 M 48 50 H 60 M 68 50 H 92", 8, 3],
  ["M 18 22 H 82 M 18 22 V 78 H 82", 1.3, 2.4],
  ["M 12 70 H 88 M 70 70 V 18", 1.1, 4],
  ["M 8 8 V 28 M 8 8 H 28 M 92 92 V 72 M 92 92 H 72", 1, 2.2],
];
rules.forEach((rule) => add("editorial_rule", "stroke", rule[1], rule[0], rule[2]));

for (let i = 0; i < 8; i += 1) {
  const cells = 2 + (i % 3);
  const gap = 70 / cells;
  let d = "";
  for (let y = 0; y <= cells; y += 1) d += "M 15 " + n(15 + y * gap) + " H 85 ";
  for (let x = 0; x <= cells; x += 1) d += "M " + n(15 + x * gap) + " 15 V 85 ";
  add("technical_grid", "stroke", 1, d.trim(), i % 2 ? 1.4 : 2.2);
}
for (let i = 0; i < 5; i += 1) {
  let d = "";
  const cols = 3 + (i % 3);
  for (let y = 0; y < cols; y += 1) {
    for (let x = 0; x < cols; x += 1) d += circle(18 + x * (64 / (cols - 1)), 18 + y * (64 / (cols - 1)), 2.2) + " ";
  }
  add("technical_grid", "fill", 1, d.trim(), 0);
}
add("technical_grid", "stroke", 1, "M 50 12 V 88 M 12 50 H 88 M 50 50 " + circle(50, 50, 16).replace("M", "M"), 2);
add("technical_grid", "stroke", 1, "M 20 20 H 80 V 80 H 20 Z M 50 20 V 80 M 20 50 H 80", 1.8);
add("technical_grid", "stroke", 0.4, "M 50 8 V 92 M 42 16 H 58 M 42 84 H 58 M 46 50 H 54", 2);
add("technical_grid", "fill", 1, circle(50, 50, 4) + " " + circle(50, 50, 18).replace(/Z$/, "") , 0);

for (let i = 0; i < 17; i += 1) {
  const stroke = squiggle(7300 + i * 13, 4 + (i % 5));
  add("hand_drawn", "stroke", i % 3 === 0 ? 0.7 : 1.8, stroke, 2.2 + (i % 3));
}

const frames = [
  ["M 14 8 H 8 V 14 M 86 8 H 92 V 14 M 92 86 V 92 H 86 M 14 92 H 8 V 86", 1, 3.2],
  ["M 10 10 H 90 V 90 H 10 Z M 18 18 H 82 V 82 H 18 Z", 1.15, 2.4],
  ["M 8 8 H 92 V 78 H 8 Z M 8 78 H 92 V 92 H 8 Z", 0.9, 2.6],
  ["M 16 12 H 84 V 88 H 16 Z", 0.85, 3],
  ["M 8 20 H 92 M 8 80 H 92 M 8 20 V 80 M 92 20 V 80", 1.3, 2],
  ["M 12 12 H 28 M 12 12 V 28 M 88 12 H 72 M 88 12 V 28 M 12 88 H 28 M 12 88 V 72 M 88 88 H 72 M 88 88 V 72", 1, 4],
  ["M 6 14 H 94 V 86 H 6 Z M 6 28 H 94 M 6 72 H 94", 1.2, 2],
];
frames.forEach((frame) => add("photographic_frame", "stroke", frame[1], frame[0], frame[2]));
for (let i = 0; i < 6; i += 1) {
  let d = "M 12 16 H 88 V 84 H 12 Z";
  const holes = 3 + (i % 3);
  for (let h = 0; h < holes; h += 1) {
    const y = 28 + h * (40 / holes);
    d += " " + circle(6, y, 2.1) + " " + circle(94, y, 2.1);
  }
  add("photographic_frame", "stroke", 0.8, d, 2);
}
for (let i = 0; i < 4; i += 1) {
  const inset = 8 + i * 3;
  add("photographic_frame", "stroke", 1, "M " + inset + " " + inset + " H " + (100 - inset) + " V " + (100 - inset) + " H " + inset + " Z", 2 + i * 0.4);
}

const byFamily = Object.fromEntries(FAMILIES.map((family) => [family, elements.filter((item) => item.family === family)]));
const counts = Object.fromEntries(FAMILIES.map((family) => [family, byFamily[family].length]));

module.exports = { FAMILIES, elements, byFamily, counts };
