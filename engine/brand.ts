/**
 * brand.json token injection — locks client hex / fonts / logo across a deck.
 */
const fs = require("fs");
const path = require("path");

export type BrandConfig = {
  name?: string;
  colors?: {
    bg?: string;
    surface?: string;
    ink?: string;
    muted?: string;
    accent?: string;
    line?: string;
  };
  fonts?: {
    display?: string;
    body?: string;
  };
  logoUrl?: string;
};

function normalizeHex(value: string | undefined): string | null {
  if (!value) return null;
  const t = String(value).trim();
  if (/^#[0-9a-fA-F]{6}$/.test(t)) return t.toUpperCase();
  if (/^[0-9a-fA-F]{6}$/.test(t)) return ("#" + t).toUpperCase();
  return null;
}

export function loadBrand(fileOrObj: string | BrandConfig): BrandConfig {
  if (fileOrObj && typeof fileOrObj === "object") return sanitizeBrand(fileOrObj);
  const file = path.resolve(String(fileOrObj));
  if (!fs.existsSync(file)) throw new Error("brand.json not found: " + file);
  return sanitizeBrand(JSON.parse(fs.readFileSync(file, "utf8")));
}

function sanitizeBrand(raw: any): BrandConfig {
  const colors: BrandConfig["colors"] = {};
  const src = (raw && raw.colors) || {};
  ["bg", "surface", "ink", "muted", "accent", "line"].forEach((k) => {
    const hex = normalizeHex(src[k]);
    if (hex) (colors as any)[k] = hex;
  });
  const fonts: BrandConfig["fonts"] = {};
  if (raw && raw.fonts) {
    if (raw.fonts.display) fonts.display = String(raw.fonts.display).trim();
    if (raw.fonts.body) fonts.body = String(raw.fonts.body).trim();
  }
  const out: BrandConfig = {};
  if (raw && raw.name) out.name = String(raw.name);
  if (Object.keys(colors).length) out.colors = colors;
  if (Object.keys(fonts).length) out.fonts = fonts;
  if (raw && raw.logoUrl) out.logoUrl = String(raw.logoUrl).trim();
  return out;
}

/** Merge brand tokens onto a palette + typePair (mutates copies). */
export function applyBrandTokens(
  palette: Record<string, any>,
  typePair: Record<string, any>,
  brand: BrandConfig | null | undefined
): { palette: any; typePair: any; brand: BrandConfig | null } {
  if (!brand) return { palette, typePair, brand: null };
  const nextPalette = { ...palette };
  const nextPair = { ...typePair };
  if (brand.colors) {
    Object.keys(brand.colors).forEach((k) => {
      if ((brand.colors as any)[k]) nextPalette[k] = (brand.colors as any)[k];
    });
  }
  if (brand.fonts) {
    if (brand.fonts.display) nextPair.display = brand.fonts.display;
    if (brand.fonts.body) nextPair.body = brand.fonts.body;
  }
  return { palette: nextPalette, typePair: nextPair, brand };
}

/** Patch an already-rendered deck's tokens + live text/shape colors for brand lock. */
export function injectBrandIntoDeck(deck: any, brand: BrandConfig | null | undefined): any {
  if (!deck || !brand) return deck;
  const tokens = deck.tokens || (deck.tokens = { color: {}, font: {} });
  tokens.color = tokens.color || {};
  tokens.font = tokens.font || {};
  if (brand.colors) {
    Object.assign(tokens.color, brand.colors);
  }
  if (brand.fonts) {
    if (brand.fonts.display) tokens.font.display = brand.fonts.display;
    if (brand.fonts.body) tokens.font.body = brand.fonts.body;
  }
  const layouts = deck.layouts || {};
  Object.keys(layouts).forEach((lid) => {
    const els = (layouts[lid] && layouts[lid].elements) || [];
    els.forEach((el: any) => {
      if (el.type === "text") {
        if (brand.fonts) {
          const role = el.textStyle && Number(el.textStyle.fontWeight) >= 600 ? "display" : "body";
          const face =
            (el.textStyle && Number(el.textStyle.fontWeight) >= 600 && brand.fonts.display) ||
            brand.fonts.body ||
            brand.fonts.display;
          if (el.textStyle && face) {
            // Prefer display for heavy/display text, body otherwise
            const useDisplay =
              el.textStyle.fontWeight >= 600 ||
              (el.textStyle.fontSize && el.textStyle.fontSize >= 36);
            el.textStyle.fontFamily = useDisplay
              ? brand.fonts.display || brand.fonts.body
              : brand.fonts.body || brand.fonts.display;
          }
          (el.textContent && el.textContent.spans || []).forEach((span: any) => {
            if (!span) return;
            const useDisplay = Number(span.fontWeight) >= 600 || Number(span.fontSize) >= 36;
            span.fontFamily = useDisplay
              ? brand.fonts!.display || brand.fonts!.body
              : brand.fonts!.body || brand.fonts!.display;
          });
          void role;
        }
        if (brand.colors) {
          // Remap common defaults: ink/muted only when element used token colors
          // Safer: leave explicit hex; brand lock already set deck.tokens for export.
        }
      }
    });
  });
  if (!deck.engine) deck.engine = {};
  deck.engine.brand = {
    name: brand.name || null,
    fonts: brand.fonts || null,
    colors: brand.colors || null,
    logoUrl: brand.logoUrl || null,
  };
  return deck;
}

module.exports = {
  loadBrand,
  applyBrandTokens,
  injectBrandIntoDeck,
  sanitizeBrand,
};
