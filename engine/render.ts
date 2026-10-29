const fs = require("fs");
const path = require("path");
import { DeckSpec } from "./types";
const { fitText } = require("./fit");
const { safePhoto } = require("./photos");

const ROOT = path.join(__dirname, "..");
const KIT = path.join(ROOT, "kit");
const PHOTO_PUB = path.join(ROOT, "generated-templates", "photos", "engine-v1");
const tokensDoc = JSON.parse(fs.readFileSync(path.join(__dirname, "tokens.json"), "utf8"));

function loadVariant(role: string, variant: string) {
  return JSON.parse(fs.readFileSync(path.join(KIT, role, variant + ".json"), "utf8"));
}

function slotText(slide: any, from: string): string {
  if (!from) return "";
  if (from === "title") return slide.title || "";
  if (from === "caption") return slide.caption || "";
  if (from === "body") return (slide.body || []).join("\n");
  const bodyM = String(from).match(/^body(\d)$/);
  if (bodyM) return (slide.body && slide.body[Number(bodyM[1])]) || "";
  const statsM = String(from).match(/^stats(\d)\.(value|label)$/);
  if (statsM) {
    const item = slide.stats && slide.stats[Number(statsM[1])];
    return (item && item[statsM[2]]) || "";
  }
  const memM = String(from).match(/^members(\d)\.(name|role)$/);
  if (memM) {
    const item = slide.members && slide.members[Number(memM[1])];
    return (item && item[memM[2]]) || "";
  }
  if (from === "memberLine") {
    return (slide.members || [])
      .map((m: any) => (m.name || "") + (m.role ? " — " + m.role : ""))
      .join("\n");
  }
  if (from === "memberCard") {
    // name + role stacked for a portrait caption
    const m = slide.members && slide.members[0];
    if (!m) return "";
    return (m.name || "") + (m.role ? "\n" + m.role : "");
  }
  return "";
}

function publishPhoto(absPath: string): string {
  fs.mkdirSync(PHOTO_PUB, { recursive: true });
  const name = path.basename(absPath);
  const dest = path.join(PHOTO_PUB, name);
  if (!fs.existsSync(dest)) fs.copyFileSync(absPath, dest);
  return "photos/engine-v1/" + name;
}

export async function renderDeckFromSpec(
  spec: DeckSpec,
  selections: Array<{ role: string; variant: string }>,
  options?: { id?: string }
): Promise<any> {
  const palette = tokensDoc.palettes[spec.style.palette];
  const typePair = tokensDoc.typePairs[spec.style.typePair];
  const treatment = spec.style.imageTreatment;
  const deckId = (options && options.id) || "kit-v1";
  const layouts: any = {};
  const layoutSequence: string[] = [];
  const photoCache: Record<string, string> = {};

  async function photoRel(slide: any, _slotId: string): Promise<string> {
    const key = (slide.photoQuery || "abstract") + "|" + (slide.photoOrientation || "landscape") + "|" + treatment;
    if (photoCache[key]) return photoCache[key];
    const abs = await safePhoto(
      slide.photoQuery || "abstract texture",
      slide.photoOrientation || "landscape",
      treatment,
      palette
    );
    const rel = publishPhoto(abs);
    photoCache[key] = rel;
    return rel;
  }

  for (let i = 0; i < spec.slides.length; i++) {
    const slide = spec.slides[i];
    const sel = selections[i];
    const variant = loadVariant(sel.role, sel.variant);
    const layoutId = "slide-" + String(i + 1).padStart(2, "0");
    layoutSequence.push(layoutId);
    const elements: any[] = [];

    for (const el of variant.layout.elements || []) {
      const next: any = {
        id: el.id,
        type: el.type,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        zIndex: el.z != null ? el.z : 1,
      };
      if (el.opacity != null) next.opacity = el.opacity;

      if (el.type === "shape") {
        const fillKey = el.tokenFill || "surface";
        next.shapeContent = {
          kind: el.shape === "ellipse" ? "circle" : "rect",
          fill: palette[fillKey] || palette.surface,
          cornerRadius: el.radius || 0,
        };
      } else if (el.type === "text") {
        const slotMeta = variant.slots[el.slot] || {};
        const from = slotMeta.from || el.slot;
        let text = slotText(slide, from);
        const rules = (variant.fit && variant.fit[el.slot]) || {
          minFont: 16,
          maxFont: el.fontSize || 32,
          lineClamp: 4,
        };
        const fitted = fitText(text, { width: el.width, height: el.height }, rules);
        const fontName = el.fontRole === "display" ? typePair.display : typePair.body;
        const colorKey = el.tokenColor || "ink";
        const color = palette[colorKey] || palette.ink;
        const size = fitted.fontSize || el.fontSize || 24;
        const weight = el.fontRole === "display" ? 700 : 400;
        next.textStyle = {
          fontFamily: fontName,
          fontSize: size,
          fontWeight: weight,
          color,
          textAlign: el.align || "left",
          verticalAlign: el.verticalAlign || "top",
          lineHeight: 1.2,
        };
        next.textContent = {
          spans: [{ text: fitted.text || " ", fontFamily: fontName, fontSize: size, fontWeight: weight, color }],
        };
      } else if (el.type === "image") {
        const url = await photoRel(slide, el.id);
        next.imageContent = {
          url,
          fit: "cover",
          alignX: 0.5,
          alignY: 0.5,
        };
        if (el.radius) {
          next.imageContent.clip = {
            kind: el.radius >= Math.min(el.width, el.height) / 2 - 1 ? "ellipse" : "rect",
            cornerRadius: el.radius,
          };
        }
      }
      elements.push(next);
    }

    layouts[layoutId] = {
      id: layoutId,
      name: slide.role,
      role: slide.role,
      variant: variant.id,
      elements,
    };
  }

  return {
    schemaVersion: 2,
    id: deckId,
    name: deckId,
    layoutSequence,
    layouts,
    tokens: {
      color: {
        bg: palette.bg,
        surface: palette.surface,
        ink: palette.ink,
        muted: palette.muted,
        accent: palette.accent,
        line: palette.line,
      },
      font: {
        display: typePair.display,
        body: typePair.body,
      },
    },
    engine: {
      v: 1,
      style: spec.style,
      selections,
    },
  };
}

module.exports = { renderDeckFromSpec, loadVariant, tokens: tokensDoc, slotText };
