const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");
import { DeckSpec, ValidateResult } from "./types";

const ROOT = __dirname;
const tokens = JSON.parse(fs.readFileSync(path.join(ROOT, "tokens.json"), "utf8"));
const schema = JSON.parse(fs.readFileSync(path.join(ROOT, "deckspec.schema.json"), "utf8"));

const ajv = new Ajv({ allErrors: true, strict: false });
const validateSchema = ajv.compile(schema);

const HEX = /#[0-9a-fA-F]{3,8}\b/;
const PX = /\b\d+(\.\d+)?px\b/i;
const FONT_NAMES = [
  "Arial",
  "Georgia",
  "Impact",
  "Helvetica",
  "Roboto",
  "Inter",
  "Poppins",
  "Montserrat",
  "Times",
  "Courier",
  "Calibri",
  "Cambria",
  "Verdana",
  "Carlito",
  "Caladea",
  "Constantia",
  "Candara",
  "Segoe UI",
  "Trebuchet MS",
  "Trebuchet",
  "Corbel",
  "Tahoma",
  "Franklin Gothic Heavy",
  "Franklin Gothic Medium",
  "Garamond",
  "Bookman Old Style",
  "Rockwell",
  "Palatino Linotype",
];

const ENUM_FIELDS: Record<string, string[]> = {
  palette: Object.keys(tokens.palettes),
  typePair: Object.keys(tokens.typePairs),
  imageTreatment: Object.keys(tokens.imageTreatments),
  motif: Object.keys(tokens.motifs),
};

function listJoin(ids: string[]): string {
  return ids.join(" | ");
}

function deepForbidden(value: any, errors: string[], pathKey = "") {
  if (value == null) return;
  if (typeof value === "string") {
    if (HEX.test(value)) errors.push("DeckSpec must not contain hex colors");
    if (PX.test(value)) errors.push("DeckSpec must not contain px values");
    // Font-family names only forbidden as style.typePair (titles like "Impact" are fine)
    if (
      pathKey === "style.typePair" &&
      FONT_NAMES.some((f) => value.toLowerCase() === f.toLowerCase())
    ) {
      errors.push(
        'font name literal "' +
          value +
          '" is not allowed for typePair; allowed: ' +
          listJoin(ENUM_FIELDS.typePair)
      );
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
    Object.keys(value).forEach((k) =>
      deepForbidden(value[k], errors, pathKey ? pathKey + "." + k : k)
    );
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
    (Object.keys(ENUM_FIELDS) as Array<keyof typeof ENUM_FIELDS>).forEach((field) => {
      const value = (spec.style as any)[field];
      if (value == null) return;
      const allowed = ENUM_FIELDS[field];
      if (allowed.indexOf(value) < 0) {
        errors.push(
          'unknown ' + field + ' "' + value + '"; allowed: ' + listJoin(allowed)
        );
      }
    });
  }

  const limits = tokens.limits;
  (spec.slides || []).forEach((slide, i) => {
    if (!slide) return;
    if (tokens.roles.indexOf(slide.role) < 0) {
      errors.push(
        'slide ' + i + ' unknown role "' + slide.role + '"; allowed: ' + listJoin(tokens.roles)
      );
    }
    if (slide.title && slide.title.length > limits.title) {
      errors.push("slide " + i + " title exceeds " + limits.title + " chars");
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

    if (slide.role === "stats") {
      const stats = slide.stats;
      if (!Array.isArray(stats) || stats.length < 1 || stats.length > 3) {
        errors.push("slide " + i + " stats role requires stats array length 1–3");
      } else {
        stats.forEach((s, j) => {
          if (!s || typeof s !== "object") {
            errors.push("slide " + i + " stats[" + j + "] must be {value,label}");
            return;
          }
          if (!s.value || String(s.value).length > limits.statValue) {
            errors.push(
              "slide " + i + " stats[" + j + "].value missing or exceeds " + limits.statValue + " chars"
            );
          }
          if (!s.label || String(s.label).length > limits.statLabel) {
            errors.push(
              "slide " + i + " stats[" + j + "].label missing or exceeds " + limits.statLabel + " chars"
            );
          }
        });
      }
      if ((slide as any).stat != null) {
        errors.push('slide ' + i + ' use stats[{value,label}] not legacy "stat" string');
      }
    }

    if (slide.role === "team") {
      const members = slide.members;
      if (!Array.isArray(members) || members.length < 2 || members.length > 4) {
        errors.push("slide " + i + " team role requires members array length 2–4");
      } else {
        members.forEach((m, j) => {
          if (!m || typeof m !== "object") {
            errors.push("slide " + i + " members[" + j + "] must be {name,role}");
            return;
          }
          if (!m.name || String(m.name).length > limits.memberName) {
            errors.push(
              "slide " + i + " members[" + j + "].name missing or exceeds " + limits.memberName + " chars"
            );
          }
          if (!m.role || String(m.role).length > limits.memberRole) {
            errors.push(
              "slide " + i + " members[" + j + "].role missing or exceeds " + limits.memberRole + " chars"
            );
          }
        });
      }
    }
  });

  return { ok: errors.length === 0, errors };
}

module.exports = { validateDeckSpec, ENUM_FIELDS };
