const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");

const CACHE = path.join(__dirname, "cache", "photos");

export type PhotoResult = { path: string; pexelsId: string };

/** Non-person / non-team subjects that must not win team portrait slots. */
const TEAM_REJECT =
  /\b(car|cars|supercar|vehicle|vehicles|garage|dealership|abstract|texture|skyline|landscape|neon\s+entrance|workshop|interior\s+only|distressed|crying|anxious|lonely|silhouette|crowd\s+only|hands\s+only)\b/i;
/** Signals a bust / headshot / people portrait facing camera. */
const TEAM_FACE =
  /\b(portrait|headshot|person|people|face|staff|dentist|doctor|founder|clinician|professional|crew|manager|hygienist|team\s+member)\b/i;
const TEAM_CAMERA =
  /\b(looking\s+at\s+camera|facing\s+camera|eye\s+contact|smiling\s+at\s+camera|headshot)\b/i;

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

function cacheKey(
  query: string,
  orientation: string,
  pexelsId: string | number,
  crop: string,
  tone?: string
): string {
  return crypto
    .createHash("sha1")
    .update([query, orientation, String(pexelsId), tone || "color", crop || "cover"].join("|"))
    .digest("hex");
}

/** True when a team photo query is a people headshot facing camera. */
export function isTeamPortraitQuery(query: string): boolean {
  const q = String(query || "").trim();
  if (!q) return false;
  if (TEAM_REJECT.test(q) && !TEAM_FACE.test(q)) return false;
  if (TEAM_REJECT.test(q) && !/\b(portrait|headshot|person|face|staff)\b/i.test(q)) return false;
  if (!TEAM_FACE.test(q)) return false;
  // Prefer explicit camera-facing language after normalize; allow plain headshot/portrait
  return TEAM_CAMERA.test(q) || /\b(headshot|portrait)\b/i.test(q);
}

/**
 * Strip vehicle/abstract nouns; force headshot + looking-at-camera language.
 */
export function normalizeTeamQuery(query: string): string {
  let q = String(query || "")
    .replace(TEAM_REJECT, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!q) q = "professional person";
  if (!/\b(portrait|headshot)\b/i.test(q)) q = q + " professional headshot portrait";
  if (!/\b(person|people|staff|dentist|doctor|founder|professional|crew|face)\b/i.test(q)) {
    q = q + " person";
  }
  if (!TEAM_CAMERA.test(q)) q = q + " looking at camera smiling";
  return q.trim();
}

async function fetchPexelsRaw(
  query: string,
  orientation: string,
  excludeIds: Set<string>
): Promise<{ buffer: Buffer; pexelsId: string }> {
  loadEnv();
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error("PEXELS_API_KEY is not set");
  const orient =
    orientation === "portrait" ? "portrait" : orientation === "square" ? "square" : "landscape";
  const url =
    "https://api.pexels.com/v1/search?query=" +
    encodeURIComponent(query || "abstract texture") +
    "&per_page=15&orientation=" +
    orient;
  const res = await fetch(url, { headers: { Authorization: key } });
  if (!res.ok) throw new Error("Pexels HTTP " + res.status);
  const data: any = await res.json();
  const photos: any[] = (data.photos || []).filter((p: any) => p && p.id != null);
  const pick = photos.find((p) => !excludeIds.has(String(p.id))) || photos[0];
  if (!pick) throw new Error("Pexels empty for " + query);
  const src = pick.src.large2x || pick.src.large || pick.src.original;
  const img = await fetch(src);
  if (!img.ok) throw new Error("Pexels image download failed");
  return { buffer: Buffer.from(await img.arrayBuffer()), pexelsId: String(pick.id) };
}

/**
 * Color resize only. Team framing uses display `cover` + top-center align —
 * no extract/attention face pipelines (those spliced/clipped heads).
 * `top-center` pre-sizes into a square or 4:5 frame with north gravity.
 */
async function toColorPng(buf: Buffer, crop?: string, tone?: string): Promise<Buffer> {
  let pipeline = sharp(buf);
  if (crop === "top-center-square") {
    pipeline = pipeline.resize(1200, 1200, { fit: "cover", position: "north" });
  } else if (crop === "top-center-45") {
    pipeline = pipeline.resize(900, 1125, { fit: "cover", position: "north" });
  } else {
    pipeline = pipeline.resize(1600, 900, { fit: "cover", position: "attention" });
  }
  // Brutalist: harsh high-contrast black-and-white cutout
  if (tone === "bw-harsh" || tone === "contrast-bw") {
    pipeline = pipeline.greyscale().normalise().linear(1.55, -48);
  } else if (tone === "sepia" || tone === "sepia-duotone") {
    // Luxury editorial — warm sepia / cream duotone
    pipeline = pipeline.greyscale().normalise().modulate({ brightness: 1.04 }).tint("#C4A574");
  } else if (tone === "navy-duotone") {
    // Corporate finance — navy + white conservative duotone
    pipeline = pipeline.greyscale().normalise().tint("#0B1F3A");
  } else if (tone === "neon" || tone === "neon-tint") {
    // Cyberpunk — high saturation + purple/cyan cast
    pipeline = pipeline.modulate({ saturation: 1.65, brightness: 1.06 }).tint("#7C3AED");
  } else if (tone === "color-soft") {
    // Healthcare — airy lift
    pipeline = pipeline.modulate({ brightness: 1.08, saturation: 0.92 });
  }
  return pipeline.png().toBuffer();
}

export async function resolvePhoto(
  query: string,
  orientation: string,
  treatment: string,
  _palette: any,
  excludeIds?: Set<string>,
  crop?: string,
  tone?: string
): Promise<PhotoResult> {
  fs.mkdirSync(CACHE, { recursive: true });
  const excluded = excludeIds || new Set<string>();
  const cropMode =
    crop === "top-center-square" || crop === "top-center-45"
      ? crop
      : crop === "top-center"
        ? "top-center-square"
        : "cover";
  const orient =
    cropMode.startsWith("top-center") || orientation === "portrait"
      ? "portrait"
      : orientation === "square"
        ? "square"
        : orientation || "landscape";
  const photoTone =
    tone ||
    (treatment === "contrast-bw" || treatment === "bw-harsh"
      ? "bw-harsh"
      : treatment === "sepia-duotone"
        ? "sepia"
        : treatment === "navy-duotone"
          ? "navy-duotone"
          : treatment === "neon-tint"
            ? "neon"
            : "color");
  const raw = await fetchPexelsRaw(query || "abstract texture", orient, excluded);
  const id = cacheKey(query || "texture", orient, raw.pexelsId, cropMode, photoTone);
  const dest = path.join(CACHE, id + ".png");
  if (!(fs.existsSync(dest) && fs.statSync(dest).size > 1000)) {
    const treated = await toColorPng(raw.buffer, cropMode, photoTone);
    fs.writeFileSync(dest, treated);
  }
  return { path: dest, pexelsId: raw.pexelsId };
}

/** Offline placeholder when network unavailable — solid gradient PNG. */
export async function placeholderPhoto(label: string): Promise<PhotoResult> {
  fs.mkdirSync(CACHE, { recursive: true });
  const id = cacheKey("placeholder:" + label, "landscape", "0", "cover");
  const dest = path.join(CACHE, id + ".png");
  if (!fs.existsSync(dest)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2a3140"/><stop offset="100%" stop-color="#5b8cff"/>
    </linearGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/>
    <text x="80" y="820" fill="#ffffff99" font-size="28" font-family="Arial">${String(label).slice(0, 40)}</text>
  </svg>`;
    const buf = await sharp(Buffer.from(svg)).png().toBuffer();
    fs.writeFileSync(dest, buf);
  }
  return { path: dest, pexelsId: "placeholder:" + id };
}

export async function safePhoto(
  query: string,
  orientation: string,
  treatment: string,
  palette: any,
  excludeIds?: Set<string>,
  crop?: string,
  tone?: string
): Promise<PhotoResult> {
  try {
    return await resolvePhoto(query, orientation, treatment, palette, excludeIds, crop, tone);
  } catch (err) {
    console.warn("photo fallback:", (err as Error).message);
    return placeholderPhoto(query || "photo");
  }
}

/**
 * One query per photo slot. Repeater kits (feature/b) use photoQueries[i] or
 * photoQuery + body[i] so slots never share a single search.
 * Team role: normalize toward headshot/portrait and away from cars/abstract.
 */
export function queriesForSlots(slide: any, slotCount: number): string[] {
  const members: any[] = Array.isArray(slide.members) ? slide.members : [];
  let n = Math.max(0, slotCount | 0);
  // Team kits reserve up to 4 slots; only fetch portraits for real members
  if (slide.role === "team" && members.length > 0) {
    n = Math.min(n, members.length);
  }
  if (n === 0) return [];
  const listed: string[] = Array.isArray(slide.photoQueries)
    ? slide.photoQueries.map((q: any) => String(q || "").trim()).filter(Boolean)
    : [];
  const base = String(slide.photoQuery || "").trim();
  const body: string[] = Array.isArray(slide.body) ? slide.body.map((b: any) => String(b || "").trim()) : [];
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    if (listed[i]) {
      out.push(listed[i]);
      continue;
    }
    if (slide.role === "team" && members[i] && (members[i].name || members[i].role)) {
      const who = [members[i].role, members[i].name, base || "professional"]
        .filter(Boolean)
        .join(" ");
      out.push(who);
      continue;
    }
    if (n === 1 && base) {
      out.push(base);
      continue;
    }
    if (base && body[i]) {
      out.push(base + " " + body[i]);
      continue;
    }
    if (body[i]) {
      out.push(body[i]);
      continue;
    }
    if (base) {
      out.push(base + (n > 1 ? " detail " + (i + 1) : ""));
      continue;
    }
    out.push("abstract texture " + (i + 1));
  }
  if (slide.role === "team") {
    return out.map((q) => normalizeTeamQuery(q));
  }
  return out;
}

module.exports = {
  resolvePhoto,
  placeholderPhoto,
  safePhoto,
  queriesForSlots,
  isTeamPortraitQuery,
  normalizeTeamQuery,
};
