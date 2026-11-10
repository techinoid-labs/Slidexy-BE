/**
 * Free Asset Generation Pipeline — Iconify icons, Pexels photos, Recraft illustrations.
 * Cached under assets/cache/{type}/{keyword}.{ext}.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const CACHE_ROOT = path.join(ROOT, "assets", "cache");

export type SmartAssetKind = "icon" | "photo" | "illustration";

export type AssetResult = {
  kind: SmartAssetKind;
  query: string;
  path: string;
  ext: string;
  /** SVG or PNG data URI when available (icons always include SVG + raster). */
  dataUri?: string;
  /** Iconify id e.g. mdi:recycle */
  iconId?: string;
  /** True when Recraft was mocked (no API key / failed). */
  mocked?: boolean;
  source: "cache" | "network" | "mock";
};

function loadEnv() {
  const file = path.join(ROOT, ".env");
  if (!fs.existsSync(file)) return;
  fs.readFileSync(file, "utf8").split(/\r?\n/).forEach((line: string) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) return;
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  });
}

function slugKeyword(keyword: string): string {
  const raw = String(keyword || "asset")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return raw || "asset";
}

function cachePath(type: SmartAssetKind, keyword: string, ext: string, style?: string): string {
  const dir = path.join(CACHE_ROOT, type);
  fs.mkdirSync(dir, { recursive: true });
  const stylePart = style ? "--" + slugKeyword(style) : "";
  return path.join(dir, slugKeyword(keyword) + stylePart + "." + ext);
}

function readCache(file: string): Buffer | null {
  try {
    if (fs.existsSync(file) && fs.statSync(file).size > 32) {
      return fs.readFileSync(file);
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writeCache(file: string, buf: Buffer) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
}

function toDataUri(mime: string, buf: Buffer): string {
  return "data:" + mime + ";base64," + buf.toString("base64");
}

function tintSvg(svg: string, color: string): string {
  const hex = String(color || "#2563EB").replace(/[^#0-9a-fA-F]/g, "") || "#2563EB";
  let out = String(svg || "");
  // Prefer Iconify currentColor replacement; also force fill/stroke on monotone icons
  out = out.replace(/currentColor/g, hex);
  if (!/fill=/.test(out) && /<svg[\s>]/.test(out)) {
    out = out.replace(/<svg([\s>])/, '<svg fill="' + hex + '"$1');
  }
  return out;
}

async function mockIllustrationPng(prompt: string): Promise<Buffer> {
  const w = 1024;
  const h = 1024;
  const label = String(prompt || "illustration").slice(0, 48);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0%" stop-color="#D9F99D"/><stop offset="100%" stop-color="#65A30D"/>` +
    `</linearGradient></defs>` +
    `<rect width="100%" height="100%" fill="url(#g)"/>` +
    `<circle cx="512" cy="420" r="180" fill="#FFFFFF" fill-opacity="0.35"/>` +
    `<text x="512" y="720" text-anchor="middle" font-family="Arial,sans-serif" font-size="36" fill="#14532D">${label
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")}</text>` +
    `<text x="512" y="780" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="#166534">Recraft mock</text>` +
    `</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export class AssetService {
  lastStatus: {
    icon?: { ok: boolean; detail: string };
    photo?: { ok: boolean; detail: string };
    illustration?: { ok: boolean; detail: string };
  } = {};

  constructor() {
    loadEnv();
    fs.mkdirSync(CACHE_ROOT, { recursive: true });
  }

  /**
   * Iconify: search → fetch SVG → tint → data URI + raster PNG for PPTX/PNG preview.
   */
  async getIcon(keyword: string, opts?: { color?: string; style?: string }): Promise<AssetResult> {
    loadEnv();
    const query = String(keyword || "icon").trim() || "icon";
    const color = opts && opts.color ? String(opts.color) : "#2563EB";
    const style = opts && opts.style ? String(opts.style) : undefined;
    const pngFile = cachePath("icon", query + "-" + color.replace("#", ""), "png", style);
    const svgFile = cachePath("icon", query + "-" + color.replace("#", ""), "svg", style);

    const cachedPng = readCache(pngFile);
    const cachedSvg = readCache(svgFile);
    // Older failures were cached as square glyphs and then reported as successful hits.
    const isFallback = cachedSvg && cachedSvg.toString("utf8").includes('<rect x="3" y="3" width="18" height="18" rx="3"');
    if (cachedPng && cachedSvg && !isFallback) {
      this.lastStatus.icon = { ok: true, detail: "cache hit" };
      return {
        kind: "icon",
        query,
        path: pngFile,
        ext: "png",
        dataUri: toDataUri("image/svg+xml", cachedSvg),
        source: "cache",
      };
    }

    try {
      const searchUrl =
        "https://api.iconify.design/search?query=" + encodeURIComponent(query) + "&limit=32";
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) throw new Error("Iconify search HTTP " + searchRes.status);
      const searchJson: any = await searchRes.json();
      const icons: string[] = Array.isArray(searchJson.icons) ? searchJson.icons : [];
      if (!icons.length) throw new Error("Iconify: no icons for " + query);
      const iconId = icons[0];
      const parts = String(iconId).split(":");
      const prefix = parts[0];
      const name = parts.slice(1).join(":") || parts[0];
      const colorParam = encodeURIComponent(color);
      const svgUrl =
        "https://api.iconify.design/" +
        encodeURIComponent(prefix) +
        "/" +
        encodeURIComponent(name) +
        ".svg?height=128&color=" +
        colorParam;
      const svgRes = await fetch(svgUrl);
      if (!svgRes.ok) throw new Error("Iconify SVG HTTP " + svgRes.status);
      let svgText = await svgRes.text();
      svgText = tintSvg(svgText, color);
      const svgBuf = Buffer.from(svgText, "utf8");
      writeCache(svgFile, svgBuf);
      const pngBuf = await sharp(svgBuf).resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
      writeCache(pngFile, pngBuf);
      this.lastStatus.icon = { ok: true, detail: "fetched " + iconId };
      return {
        kind: "icon",
        query,
        path: pngFile,
        ext: "png",
        dataUri: toDataUri("image/svg+xml", svgBuf),
        iconId,
        source: "network",
      };
    } catch (err: any) {
      // Fallback: simple accent square glyph
      const fallbackSvg =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" fill="${color}"/></svg>`;
      const svgBuf = Buffer.from(fallbackSvg, "utf8");
      const pngBuf = await sharp(svgBuf).resize(256, 256).png().toBuffer();
      // Keep the fallback renderable without poisoning the successful-asset cache.
      const fallbackFile = cachePath("icon", query + "-" + color.replace("#", "") + "-fallback", "png", style);
      writeCache(fallbackFile, pngBuf);
      this.lastStatus.icon = {
        ok: false,
        detail: String((err && err.message) || err || "icon failed"),
      };
      return {
        kind: "icon",
        query,
        path: fallbackFile,
        ext: "png",
        dataUri: toDataUri("image/svg+xml", svgBuf),
        mocked: true,
        source: "mock",
      };
    }
  }

  /** Pexels: search → download large2x JPEG buffer. */
  async getPhoto(keyword: string): Promise<AssetResult> {
    loadEnv();
    const query = String(keyword || "photo").trim() || "photo";
    const file = cachePath("photo", query, "jpg");
    const cached = readCache(file);
    if (cached) {
      this.lastStatus.photo = { ok: true, detail: "cache hit" };
      return { kind: "photo", query, path: file, ext: "jpg", source: "cache" };
    }

    const key = process.env.PEXELS_API_KEY;
    if (!key) {
      const mock = await sharp({
        create: { width: 1600, height: 900, channels: 3, background: { r: 30, g: 41, b: 59 } },
      })
        .jpeg({ quality: 85 })
        .toBuffer();
      writeCache(file, mock);
      this.lastStatus.photo = { ok: false, detail: "PEXELS_API_KEY missing — mock solid" };
      return { kind: "photo", query, path: file, ext: "jpg", mocked: true, source: "mock" };
    }

    try {
      const url =
        "https://api.pexels.com/v1/search?query=" +
        encodeURIComponent(query) +
        "&per_page=1";
      const res = await fetch(url, { headers: { Authorization: key } });
      if (!res.ok) throw new Error("Pexels HTTP " + res.status);
      const data: any = await res.json();
      const photo = data && data.photos && data.photos[0];
      const src = photo && (photo.src.large2x || photo.src.large || photo.src.original);
      if (!src) throw new Error("Pexels empty for " + query);
      const img = await fetch(src);
      if (!img.ok) throw new Error("Pexels download HTTP " + img.status);
      const buf = Buffer.from(await img.arrayBuffer());
      writeCache(file, buf);
      this.lastStatus.photo = {
        ok: true,
        detail: "fetched pexels:" + String(photo.id),
      };
      return { kind: "photo", query, path: file, ext: "jpg", source: "network" };
    } catch (err: any) {
      const mock = await sharp({
        create: { width: 1600, height: 900, channels: 3, background: { r: 55, g: 65, b: 81 } },
      })
        .jpeg({ quality: 85 })
        .toBuffer();
      writeCache(file, mock);
      this.lastStatus.photo = {
        ok: false,
        detail: String((err && err.message) || err || "photo failed"),
      };
      return { kind: "photo", query, path: file, ext: "jpg", mocked: true, source: "mock" };
    }
  }

  /**
   * Recraft: real fetch when RECRAFT_API_TOKEN / RECRAFT_API_KEY is set; otherwise mock PNG.
   */
  async getIllustration(prompt: string, opts?: { style?: string }): Promise<AssetResult> {
    loadEnv();
    const query = String(prompt || "illustration").trim() || "illustration";
    const style = (opts && opts.style) || "Illustration";
    const file = cachePath("illustration", query, "png", style);
    const cached = readCache(file);
    if (cached) {
      this.lastStatus.illustration = { ok: true, detail: "cache hit" };
      return { kind: "illustration", query, path: file, ext: "png", source: "cache" };
    }

    const token =
      process.env.RECRAFT_API_TOKEN ||
      process.env.RECRAFT_API_KEY ||
      process.env.RECRAFT_TOKEN ||
      "";

    if (!token) {
      const mock = await mockIllustrationPng(query);
      writeCache(file, mock);
      this.lastStatus.illustration = {
        ok: false,
        detail: "RECRAFT_API_TOKEN missing — mock illustration",
      };
      return {
        kind: "illustration",
        query,
        path: file,
        ext: "png",
        mocked: true,
        source: "mock",
      };
    }

    try {
      const res = await fetch("https://external.api.recraft.ai/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: query,
          model: "recraftv3",
          style: style === "duotone" ? "Vector art" : style,
          n: 1,
          response_format: "url",
          image_format: "png",
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error("Recraft HTTP " + res.status + ": " + body.slice(0, 200));
      }
      const json: any = await res.json();
      const entry = json && json.data && json.data[0];
      let buf: Buffer | null = null;
      if (entry && entry.b64_json) {
        buf = Buffer.from(entry.b64_json, "base64");
      } else if (entry && entry.url) {
        const img = await fetch(entry.url);
        if (!img.ok) throw new Error("Recraft download HTTP " + img.status);
        buf = Buffer.from(await img.arrayBuffer());
      }
      if (!buf || buf.length < 100) throw new Error("Recraft empty payload");
      writeCache(file, buf);
      this.lastStatus.illustration = { ok: true, detail: "fetched from Recraft" };
      return { kind: "illustration", query, path: file, ext: "png", source: "network" };
    } catch (err: any) {
      const mock = await mockIllustrationPng(query);
      writeCache(file, mock);
      this.lastStatus.illustration = {
        ok: false,
        detail: String((err && err.message) || err || "illustration failed"),
      };
      return {
        kind: "illustration",
        query,
        path: file,
        ext: "png",
        mocked: true,
        source: "mock",
      };
    }
  }

  /** Resolve any smartAsset descriptor. */
  async resolve(
    kind: SmartAssetKind,
    query: string,
    opts?: { color?: string; style?: string }
  ): Promise<AssetResult> {
    if (kind === "icon") return this.getIcon(query, opts);
    if (kind === "photo") return this.getPhoto(query);
    return this.getIllustration(query, opts);
  }
}

/** Singleton for engine render passes. */
let _shared: AssetService | null = null;
export function getAssetService(): AssetService {
  if (!_shared) _shared = new AssetService();
  return _shared;
}

module.exports = {
  AssetService,
  getAssetService,
  slugKeyword,
  CACHE_ROOT,
};
