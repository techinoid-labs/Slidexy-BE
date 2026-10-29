const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");
import { DeckSpec, ValidateResult } from "./types";

const ROOT = __dirname;
const tokens = JSON.parse(fs.readFileSync(path.join(ROOT, "tokens.json"), "utf8"));
const schema = JSON.parse(fs.readFileSync(path.join(ROOT, "deckspec.schema.json"), "utf8"));

const ajv = new Ajv({ allErrors: true, strict: false });
const validateSchema = ajv.compile(schema);

const GEOM_KEYS = /("x"|"y"|"width"|"height")\s*:/;
const HEX = /#[0-9a-fA-F]{3,8}\b/;
const PX = /\b\d+(\.\d+)?px\b/i;
const FONT_NAMES = ["Arial", "Georgia", "Impact", "Helvetica", "Roboto", "Inter", "Poppins", "Montserrat", "Times", "Courier"];

function deepForbidden(value: any, errors: string[], pathKey = "") {
  if (value == null) return;
  if (typeof value === "string") {
    if (HEX.test(value)) errors.push("DeckSpec must not contain hex colors");
    if (PX.test(value)) errors.push("DeckSpec must not contain px values");
    // Font literals only when the string IS a font name (not token ids like condensed-impact)
    if (FONT_NAMES.some((f) => value.toLowerCase() === f.toLowerCase())) {
      errors.push("DeckSpec must not contain font name literals");
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => deepForbidden(item, errors, pathKey + "[" + i + "]"));
    return;
  }
  if (typeof value === "object") {
    ["x", "y", "width", "height"].forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(value, k)) {
        errors.push("DeckSpec must not contain geometry keys (x/y/width/height)");
      }
    });
    Object.keys(value).forEach((k) => deepForbidden(value[k], errors, pathKey + "." + k));
  }
}

export function validateDeckSpec(input: unknown): ValidateResult {
  const errors: string[] = [];
  if (input == null || typeof input !== "object") {
    return { ok: false, errors: ["DeckSpec must be an object"] };
  }

  deepForbidden(input, errors);

  const okSchema = validateSchema(input);
  if (!okSchema) {
    (validateSchema.errors || []).forEach((err: any) => {
      errors.push((err.instancePath || "/") + " " + (err.message || "invalid"));
    });
  }

  const spec = input as DeckSpec;
  if (spec.style) {
    if (!tokens.palettes[spec.style.palette]) errors.push("unknown palette: " + spec.style.palette);
    if (!tokens.typePairs[spec.style.typePair]) errors.push("unknown typePair: " + spec.style.typePair);
    if (!tokens.imageTreatments[spec.style.imageTreatment]) {
      errors.push("unknown imageTreatment: " + spec.style.imageTreatment);
    }
    if (!tokens.motifs[spec.style.motif]) errors.push("unknown motif: " + spec.style.motif);
  }

  const limits = tokens.limits;
  (spec.slides || []).forEach((slide, i) => {
    if (!slide) return;
    if (tokens.roles.indexOf(slide.role) < 0) errors.push("slide " + i + " unknown role: " + slide.role);
    if (slide.title && slide.title.length > limits.title) {
      errors.push("slide " + i + " title exceeds " + limits.title + " chars");
    }
    if (slide.stat && slide.stat.length > limits.stat) {
      errors.push("slide " + i + " stat exceeds " + limits.stat + " chars");
    }
    if (slide.caption && slide.caption.length > limits.caption) {
      errors.push("slide " + i + " caption exceeds " + limits.caption + " chars");
    }
    const body = slide.body || [];
    if (body.length > limits.bodyItemsMax) {
      errors.push("slide " + i + " body has more than " + limits.bodyItemsMax + " items");
    }
    body.forEach((item, j) => {
      if (String(item).length > limits.bodyItem) {
        errors.push("slide " + i + " body[" + j + "] exceeds " + limits.bodyItem + " chars");
      }
    });
  });

  return { ok: errors.length === 0, errors };
}

module.exports = { validateDeckSpec };
