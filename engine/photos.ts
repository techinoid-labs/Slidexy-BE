const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");

const CACHE = path.join(__dirname, "cache", "photos");

function loadEnv() {
  const file = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(file)) return;
  fs.readFileSync(file, "utf8").split(/\r?\n/).forEach((line: string) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) return;
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  });
}

function cacheKey(query: string, orientation: string, treatment: string): string {
  return crypto.createHash("sha1").update([query, orientation, treatment].join("|")).digest("hex");
}

async function fetchPexels(query: string, orientation: string): Promise<Buffer> {
  loadEnv();
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error("PEXELS_API_KEY is not set");
  const orient = orientation === "portrait" ? "portrait" : orientation === "square" ? "square" : "landscape";
  const url =
    "https://api.pexels.com/v1/search?query=" +
    encodeURIComponent(query || "abstract texture") +
    "&per_page=1&orientation=" +
    orient;
  const res = await fetch(url, { headers: { Authorization: key } });
  if (!res.ok) throw new Error("Pexels HTTP " + res.status);
  const data: any = await res.json();
  const photo = data.photos && data.photos[0];
  if (!photo) throw new Error("Pexels empty for " + query);
  const src = photo.src.large2x || photo.src.large || photo.src.original;
  const img = await fetch(src);
  if (!img.ok) throw new Error("Pexels image download failed");
  return Buffer.from(await img.arrayBuffer());
}

async function applyTreatment(buf: Buffer, treatment: string, palette: any): Promise<Buffer> {
  let img = sharp(buf).resize(1600, 900, { fit: "cover", position: "attention" });
  if (treatment === "duotone" && palette) {
    const shadow = (palette.ink || "#111111").replace("#", "");
    const highlight = (palette.accent || "#888888").replace("#", "");
    // approximate duotone: greyscale then tint via linear
    img = img.greyscale().tint("#" + highlight);
    void shadow;
  }
  return img.png().toBuffer();
}

export async function resolvePhoto(
  query: string,
  orientation: string,
  treatment: string,
  palette: any
): Promise<string> {
  fs.mkdirSync(CACHE, { recursive: true });
  const id = cacheKey(query || "texture", orientation || "landscape", treatment || "full-bleed");
  const dest = path.join(CACHE, id + ".png");
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) return dest;
  const raw = await fetchPexels(query || "abstract texture", orientation || "landscape");
  const treated = await applyTreatment(raw, treatment || "full-bleed", palette);
  fs.writeFileSync(dest, treated);
  return dest;
}

/** Offline placeholder when network unavailable — solid gradient PNG. */
export async function placeholderPhoto(label: string): Promise<string> {
  fs.mkdirSync(CACHE, { recursive: true });
  const id = cacheKey("placeholder:" + label, "landscape", "full-bleed");
  const dest = path.join(CACHE, id + ".png");
  if (fs.existsSync(dest)) return dest;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2a3140"/><stop offset="100%" stop-color="#5b8cff"/>
    </linearGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/>
    <text x="80" y="820" fill="#ffffff99" font-size="28" font-family="Arial">${String(label).slice(0, 40)}</text>
  </svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  fs.writeFileSync(dest, buf);
  return dest;
}

export async function safePhoto(
  query: string,
  orientation: string,
  treatment: string,
  palette: any
): Promise<string> {
  try {
    return await resolvePhoto(query, orientation, treatment, palette);
  } catch (err) {
    console.warn("photo fallback:", (err as Error).message);
    return placeholderPhoto(query || "photo");
  }
}

module.exports = { resolvePhoto, placeholderPhoto, safePhoto };
