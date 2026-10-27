/**
 * Register Windows system fonts for node-canvas so deck JSON family names
 * (Calibri, Arial, Georgia, Segoe UI) paint without Arial fallback.
 *
 * Required at load from scripts/slideSvg.js. Missing files warn once; never throw.
 */

const fs = require("fs");
const path = require("path");
const { registerFont } = require("canvas");

const WIN_FONTS = process.env.WINDIR ? path.join(process.env.WINDIR, "Fonts") : "";

/** Family name as used in deck JSON → [regular file, bold file?] under WIN_FONTS */
const SYSTEM_FONT_FILES = {
  Calibri: ["calibri.ttf", "calibrib.ttf"],
  Arial: ["arial.ttf", "arialbd.ttf"],
  Georgia: ["georgia.ttf", "georgiab.ttf"],
  "Segoe UI": ["segoeui.ttf", "segoeuib.ttf"],
};

const registered = new Set();
const warned = new Set();

function warnOnce(key, message) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}

function registerPipelineFonts() {
  if (!WIN_FONTS || !fs.existsSync(WIN_FONTS)) {
    warnOnce("windir", "fonts.js: WINDIR Fonts folder not found; system faces not registered");
    return;
  }
  Object.keys(SYSTEM_FONT_FILES).forEach((family) => {
    const files = SYSTEM_FONT_FILES[family];
    const regular = path.join(WIN_FONTS, files[0]);
    if (!fs.existsSync(regular)) {
      warnOnce(family, "fonts.js: missing " + regular + " — skip " + family);
      return;
    }
    try {
      registerFont(regular, { family });
      const boldName = files[1];
      if (boldName) {
        const bold = path.join(WIN_FONTS, boldName);
        if (fs.existsSync(bold)) {
          registerFont(bold, { family, weight: "bold" });
        } else {
          warnOnce(family + "-bold", "fonts.js: missing bold " + bold + " — regular only for " + family);
        }
      }
      registered.add(family);
    } catch (error) {
      warnOnce(family + "-err", "fonts.js: registerFont failed for " + family + ": " + (error && error.message ? error.message : error));
    }
  });
}

function hasRegisteredFont(family) {
  return registered.has(String(family || ""));
}

function systemFontPath(family, weight) {
  const files = SYSTEM_FONT_FILES[String(family || "")];
  if (!files) return null;
  const bold = Number(weight) >= 600 && files[1] ? files[1] : files[0];
  const full = path.join(WIN_FONTS, bold || files[0]);
  return fs.existsSync(full) ? full : null;
}

function fontFaceCss() {
  const blocks = [];
  Object.keys(SYSTEM_FONT_FILES).forEach((family) => {
    const files = SYSTEM_FONT_FILES[family];
    files.forEach((name, index) => {
      const full = path.join(WIN_FONTS, name);
      if (!fs.existsSync(full)) return;
      const url = "file:///" + full.replace(/\\/g, "/");
      const weight = index === 0 ? "400" : "700";
      blocks.push(
        "@font-face{font-family:" + JSON.stringify(family) + ";src:url(" + JSON.stringify(url) + ") format('truetype');font-weight:" + weight + ";font-style:normal;}"
      );
    });
  });
  return blocks.join("\n");
}

registerPipelineFonts();

module.exports = {
  SYSTEM_FONT_FILES,
  registerPipelineFonts,
  hasRegisteredFont,
  systemFontPath,
  fontFaceCss,
  WIN_FONTS,
};
