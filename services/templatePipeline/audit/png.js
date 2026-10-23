/**
 * Decodes 8-bit, non-interlaced PNGs far enough to describe them:
 * where the transparent pixels are (mask shape) and how varied the colors
 * are (photo, gradient, texture or flat graphic). Other PNG variants return null.
 */

const zlib = require("zlib");

const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
const ADAM7 = [
  [0, 0, 8, 8],
  [4, 0, 8, 8],
  [0, 4, 4, 8],
  [2, 0, 4, 4],
  [0, 2, 2, 4],
  [1, 0, 2, 2],
  [0, 1, 1, 2],
];

function unfilter(raw, start, width, height, bpp) {
  const stride = width * bpp;
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[start + y * (stride + 1)];
    const src = start + y * (stride + 1) + 1;
    const dst = y * stride;
    const prev = dst - stride;
    for (let x = 0; x < stride; x += 1) {
      const value = raw[src + x];
      const left = x >= bpp ? pixels[dst + x - bpp] : 0;
      const up = y > 0 ? pixels[prev + x] : 0;
      const upLeft = y > 0 && x >= bpp ? pixels[prev + x - bpp] : 0;
      let out;
      if (filter === 0) out = value;
      else if (filter === 1) out = value + left;
      else if (filter === 2) out = value + up;
      else if (filter === 3) out = value + ((left + up) >> 1);
      else {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        out = value + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft);
      }
      pixels[dst + x] = out & 255;
    }
  }
  return { pixels, consumed: (stride + 1) * height };
}

function decode(buffer) {
  if (!buffer || buffer.length < 33 || buffer.readUInt32BE(12) !== 0x49484452) return null;
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const depth = buffer[24];
  const colorType = buffer[25];
  const interlace = buffer[28];
  if (depth !== 8 || interlace > 1 || !CHANNELS[colorType]) return null;
  const idat = [];
  let palette = null;
  let paletteAlpha = null;
  let offset = 8;
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("latin1", offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === "IDAT") idat.push(data);
    else if (type === "PLTE") palette = data;
    else if (type === "tRNS") paletteAlpha = data;
    else if (type === "IEND") break;
    offset += 12 + length;
  }
  let raw;
  try {
    raw = zlib.inflateSync(Buffer.concat(idat));
  } catch (error) {
    return null;
  }
  const bpp = CHANNELS[colorType];
  const stride = width * bpp;
  let pixels;
  if (interlace === 0) {
    if (raw.length < (stride + 1) * height) return null;
    pixels = unfilter(raw, 0, width, height, bpp).pixels;
  } else {
    pixels = Buffer.alloc(stride * height);
    let start = 0;
    for (const [x0, y0, dx, dy] of ADAM7) {
      const pw = Math.ceil((width - x0) / dx);
      const ph = Math.ceil((height - y0) / dy);
      if (pw <= 0 || ph <= 0) continue;
      if (raw.length < start + (pw * bpp + 1) * ph) return null;
      const pass = unfilter(raw, start, pw, ph, bpp);
      start += pass.consumed;
      for (let y = 0; y < ph; y += 1) {
        for (let x = 0; x < pw; x += 1) {
          pass.pixels.copy(pixels, ((y0 + y * dy) * width + x0 + x * dx) * bpp, (y * pw + x) * bpp, (y * pw + x + 1) * bpp);
        }
      }
    }
  }
  function rgba(x, y) {
    const i = y * stride + x * bpp;
    if (colorType === 6) return [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
    if (colorType === 2) return [pixels[i], pixels[i + 1], pixels[i + 2], 255];
    if (colorType === 4) return [pixels[i], pixels[i], pixels[i], pixels[i + 1]];
    if (colorType === 0) return [pixels[i], pixels[i], pixels[i], 255];
    const index = pixels[i];
    const p = palette ? [palette[index * 3], palette[index * 3 + 1], palette[index * 3 + 2]] : [index, index, index];
    return [p[0], p[1], p[2], paletteAlpha && index < paletteAlpha.length ? paletteAlpha[index] : 255];
  }
  return { width, height, rgba };
}

function luminance(c) {
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/**
 * Samples about 160x160 points. Returns transparency layout and color statistics.
 */
function describePng(buffer) {
  const image = decode(buffer);
  if (!image) return null;
  const { width, height, rgba } = image;
  const steps = 160;
  const sx = Math.max(1, Math.floor(width / steps));
  const sy = Math.max(1, Math.floor(height / steps));
  let samples = 0;
  let clear = 0;
  let opaque = 0;
  let sum = 0;
  let sumSq = 0;
  let rough = 0;
  let roughCount = 0;
  let gray = 0;
  let saturated = 0;
  const hues = new Array(12).fill(0);
  const buckets = new Set();
  const exact = new Map();
  for (let y = 0; y < height; y += sy) {
    for (let x = 0; x < width; x += sx) {
      const c = rgba(x, y);
      samples += 1;
      if (c[3] < 32) { clear += 1; continue; }
      opaque += 1;
      const l = luminance(c);
      sum += l;
      sumSq += l * l;
      buckets.add((c[0] >> 4) * 256 + (c[1] >> 4) * 16 + (c[2] >> 4));
      const key = (c[0] >> 3) * 1024 + (c[1] >> 3) * 32 + (c[2] >> 3);
      exact.set(key, (exact.get(key) || 0) + 1);
      const max = Math.max(c[0], c[1], c[2]);
      const min = Math.min(c[0], c[1], c[2]);
      const sat = max ? (max - min) / max : 0;
      if (sat < 0.12 || max < 25) gray += 1;
      if (sat >= 0.2 && max >= 40) {
        saturated += 1;
        const d = max - min;
        let hue;
        if (max === c[0]) hue = ((c[1] - c[2]) / d + 6) % 6;
        else if (max === c[1]) hue = (c[2] - c[0]) / d + 2;
        else hue = (c[0] - c[1]) / d + 4;
        hues[Math.floor(hue * 2) % 12] += 1;
      }
      if (x + 1 < width) {
        const n = rgba(x + 1, y);
        if (n[3] >= 32) {
          rough += Math.abs(luminance(n) - l);
          roughCount += 1;
        }
      }
    }
  }
  const at = (fx, fy) => rgba(Math.min(width - 1, Math.round(fx * (width - 1))), Math.min(height - 1, Math.round(fy * (height - 1))))[3] < 32;
  const inset = 0.02;
  const mean = opaque ? sum / opaque : 0;
  let hueWindow = 0;
  for (let i = 0; i < 12; i += 1) hueWindow = Math.max(hueWindow, hues[i] + hues[(i + 1) % 12]);
  const top = [...exact.values()].sort((a, b) => b - a).slice(0, 8).reduce((s, n) => s + n, 0);
  return {
    width,
    height,
    topShare: opaque ? top / opaque : 0,
    grayFraction: opaque ? gray / opaque : 0,
    saturatedFraction: opaque ? saturated / opaque : 0,
    hueConcentration: saturated ? hueWindow / saturated : 0,
    clearFraction: samples ? clear / samples : 0,
    corners: { tl: at(inset, inset), tr: at(1 - inset, inset), bl: at(inset, 1 - inset), br: at(1 - inset, 1 - inset) },
    mids: { t: at(0.5, inset), r: at(1 - inset, 0.5), b: at(0.5, 1 - inset), l: at(inset, 0.5) },
    colorBuckets: buckets.size,
    lumaStd: opaque ? Math.sqrt(Math.max(0, sumSq / opaque - mean * mean)) : 0,
    roughness: roughCount ? rough / roughCount : 0,
  };
}

/**
 * Names the visible outline of a raster image from its transparency.
 */
function maskShape(stats) {
  if (!stats || stats.clearFraction < 0.02) return "rect";
  const c = stats.corners;
  const m = stats.mids;
  const allCorners = c.tl && c.tr && c.bl && c.br;
  const anyMid = m.t || m.r || m.b || m.l;
  const solid = 1 - stats.clearFraction;
  if (allCorners && !anyMid && solid >= 0.9) return "rounded";
  if (allCorners && !anyMid && solid >= 0.68) return "circle_or_oval";
  if (c.tl && c.tr && !c.bl && !c.br && !m.b && solid >= 0.75) return "arch";
  if (allCorners && !anyMid) return "shaped";
  return "cutout";
}

/**
 * Photo, gradient, texture or flat graphic, from the opaque pixels.
 */
function rasterContent(stats) {
  if (!stats) return null;
  const flat = stats.colorBuckets <= 24
    || stats.topShare >= 0.6
    || (stats.topShare >= 0.45 && (stats.colorBuckets < 40 || stats.roughness < 1));
  if (flat) return "flat";
  if (stats.roughness < 0.35) return "gradient";
  if (stats.lumaStd <= 22 && stats.roughness >= 4) return "texture";
  return "photo";
}

/**
 * Color treatment baked into a photo: grayscale, or a duotone/tint, which
 * shows as photographic detail drawn from very few colors.
 */
function rasterTone(stats) {
  if (!stats) return null;
  if (stats.grayFraction >= 0.9) return "mono";
  if (stats.colorBuckets <= 90 && stats.lumaStd >= 25 && stats.saturatedFraction >= 0.35) return "tinted";
  if (stats.saturatedFraction >= 0.7 && stats.hueConcentration >= 0.92) return "tinted";
  return null;
}

module.exports = { describePng, maskShape, rasterContent, rasterTone };
