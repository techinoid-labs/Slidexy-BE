/**
 * Register fonts for node-canvas so deck JSON family names
 * (Calibri, Cambria, Verdana, Arial, Georgia, Segoe UI) paint without fallback.
 *
 * Prefer Windows system faces; otherwise register bundled Carlito→Calibri and
 * Caladea→Cambria metrically-compatible substitutes under the Office names.
 *
 * Required at load from scripts/slideSvg.js. Missing files warn once; never throw.
 */

const fs = require("fs");
const path = require("path");
const { registerFont } = require("canvas");

const WIN_FONTS = process.env.WINDIR ? path.join(process.env.WINDIR, "Fonts") : "";
const LOCAL_FONTS = path.join(__dirname, "fonts");

/** Family name as used in deck JSON → [regular file, bold file?] under WIN_FONTS */
const SYSTEM_FONT_FILES = {
  Calibri: ["calibri.ttf", "calibrib.ttf"],
  // cambria.ttc is a collection; node-canvas often cannot register it — prefer Caladea local
  Cambria: ["cambria.ttf", "cambriab.ttf"],
  Verdana: ["verdana.ttf", "verdanab.ttf"],
  Arial: ["arial.ttf", "arialbd.ttf"],
  Georgia: ["georgia.ttf", "georgiab.ttf"],
  "Segoe UI": ["segoeui.ttf", "segoeuib.ttf"],
  Constantia: ["constan.ttf", "constanb.ttf"],
  Candara: ["candara.ttf", "candarab.ttf"],
  "Trebuchet MS": ["trebuc.ttf", "trebucbd.ttf"],
  "Franklin Gothic Medium": ["framd.ttf", "FRABK.TTF"],
  "Franklin Gothic Heavy": ["FRAHV.TTF", "FRAHV.TTF"],
  Garamond: ["GARA.TTF", "GARABD.TTF"],
  "Bookman Old Style": ["BOOKOS.TTF", "BOOKOSB.TTF"],
  Rockwell: ["ROCK.TTF", "ROCKB.TTF"],
};

/** Bundled metric-compatible substitutes registered under Office family names */
const LOCAL_SUBSTITUTES = {
  Calibri: ["Carlito-Regular.ttf", "Carlito-Bold.ttf"],
  Cambria: ["Caladea-Regular.ttf", "Caladea-Bold.ttf"],
};

const registered = new Set();
const warned = new Set();

function warnOnce(key, message) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}

function tryRegister(family, regularPath, boldPath) {
  if (!fs.existsSync(regularPath)) return false;
  try {
    // Register normal + bold. Some faces (Franklin Gothic Heavy) only paint when
    // canvas requests bold — register the same file under both weights.
    registerFont(regularPath, { family });
    registerFont(regularPath, { family, weight: "normal" });
    const bold = boldPath && fs.existsSync(boldPath) ? boldPath : regularPath;
    registerFont(bold, { family, weight: "bold" });
    registered.add(family);
    return true;
  } catch (error) {
    warnOnce(family + "-err", "fonts.js: registerFont failed for " + family + ": " + (error && error.message ? error.message : error));
    return false;
  }
}

function registerPipelineFonts() {
  Object.keys(SYSTEM_FONT_FILES).forEach((family) => {
    const files = SYSTEM_FONT_FILES[family];
    if (WIN_FONTS && fs.existsSync(WIN_FONTS)) {
      const regular = path.join(WIN_FONTS, files[0]);
      const bold = files[1] ? path.join(WIN_FONTS, files[1]) : null;
      if (tryRegister(family, regular, bold)) return;
    }
    const local = LOCAL_SUBSTITUTES[family];
    if (local) {
      const regular = path.join(LOCAL_FONTS, local[0]);
      const bold = local[1] ? path.join(LOCAL_FONTS, local[1]) : null;
      if (tryRegister(family, regular, bold)) {
        warnOnce(family + "-sub", "fonts.js: using " + local[0] + " as " + family);
        return;
      }
    }
    warnOnce(family, "fonts.js: missing system/local face for " + family);
  });
}

function hasRegisteredFont(family) {
  return registered.has(String(family || ""));
}

function systemFontPath(family, weight) {
  const files = SYSTEM_FONT_FILES[String(family || "")];
  if (files && WIN_FONTS) {
    const bold = Number(weight) >= 600 && files[1] ? files[1] : files[0];
    const full = path.join(WIN_FONTS, bold || files[0]);
    if (fs.existsSync(full)) return full;
  }
  const local = LOCAL_SUBSTITUTES[String(family || "")];
  if (local) {
    const bold = Number(weight) >= 600 && local[1] ? local[1] : local[0];
    const full = path.join(LOCAL_FONTS, bold);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

function fontFaceCss() {
  const blocks = [];
  Object.keys(SYSTEM_FONT_FILES).forEach((family) => {
    const files = SYSTEM_FONT_FILES[family];
    const local = LOCAL_SUBSTITUTES[family];
    const sources = [];
    if (WIN_FONTS) {
      files.forEach((name, index) => {
        const full = path.join(WIN_FONTS, name);
        if (fs.existsSync(full)) sources.push({ full, weight: index === 0 ? "400" : "700" });
      });
    }
    if (!sources.length && local) {
      local.forEach((name, index) => {
        const full = path.join(LOCAL_FONTS, name);
        if (fs.existsSync(full)) sources.push({ full, weight: index === 0 ? "400" : "700" });
      });
    }
    sources.forEach((src) => {
      const url = "file:///" + src.full.replace(/\\/g, "/");
      blocks.push(
        "@font-face{font-family:" +
          JSON.stringify(family) +
          ";src:url(" +
          JSON.stringify(url) +
          ") format('truetype');font-weight:" +
          src.weight +
          ";font-style:normal;}"
      );
    });
  });
  return blocks.join("\n");
}

registerPipelineFonts();

module.exports = {
  SYSTEM_FONT_FILES,
  LOCAL_SUBSTITUTES,
  registerPipelineFonts,
  hasRegisteredFont,
  systemFontPath,
  fontFaceCss,
  WIN_FONTS,
  LOCAL_FONTS,
};
