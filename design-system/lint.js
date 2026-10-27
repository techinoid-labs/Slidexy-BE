/**
 * PPTX-safe CSS subset lint for design-system HTML.
 *
 *   node design-system/lint.js [file...]
 */

const fs = require("fs");
const path = require("path");

const FORBIDDEN = [
  { re: /(?:^|[^a-z-])(?:background-image)\s*:/i, why: "use img[data-role=photo] instead" },
  { re: /gradient\s*\(/i, why: "geometry gradient rule" },
  { re: /(?:^|[^a-z-])box-shadow\s*:/i, why: "geometry box shadow rule" },
  { re: /(?:^|[^a-z-])filter\s*:/i, why: "geometry / PPTX filter" },
  { re: /mix-blend-mode\s*:/i, why: "PPTX unsupported" },
  { re: /(?:^|[^a-z-])transform\s*:/i, why: "no arbitrary transform in deck schema" },
  { re: /clip-path\s*:/i, why: "geometry complex svg / weak PPTX" },
  { re: /::?(?:before|after)\s*\{[^}]*content\s*:/i, why: "pseudo content not measurable" },
];

const ALLOWED_PROPS = new Set([
  "background", "background-color", "color", "border", "border-color", "border-width",
  "border-radius", "border-left", "border-top", "border-right", "border-bottom",
  "font-family", "font-size", "font-weight", "line-height", "letter-spacing",
  "text-align", "text-transform", "object-fit", "opacity",
  "position", "left", "top", "right", "bottom", "width", "height",
  "margin", "padding", "box-sizing", "overflow", "display", "z-index",
]);

function lintSource(source, file) {
  const errors = [];
  FORBIDDEN.forEach((rule) => {
    if (rule.re.test(source)) errors.push(file + ": forbidden — " + rule.why);
  });
  if (/<svg[\s>]/i.test(source) && /[CcQqAaSsTt]/.test(source)) {
    errors.push(file + ": forbidden — complex SVG path commands");
  }
  const styleBlocks = source.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
  styleBlocks.forEach((block) => {
    const body = block.replace(/^<style[^>]*>/i, "").replace(/<\/style>$/i, "");
    const ruleBodies = body.match(/\{([^{}]+)\}/g) || [];
    ruleBodies.forEach((chunk) => {
      const inner = chunk.slice(1, -1);
      const props = inner.match(/(?:^|;)\s*([a-z-]+)\s*:/gi) || [];
      props.forEach((raw) => {
        const name = raw.replace(/^;?\s*/, "").replace(/\s*:$/, "").toLowerCase();
        if (name.startsWith("-")) return;
        if (!ALLOWED_PROPS.has(name)) errors.push(file + ": unknown/disallowed property " + name);
      });
    });
  });
  return errors;
}

function main(argv) {
  const files = argv.length
    ? argv
    : [path.join(__dirname, "components", "cover.html")];
  let failed = false;
  files.forEach((file) => {
    const abs = path.resolve(file);
    const source = fs.readFileSync(abs, "utf8");
    const errors = lintSource(source, path.relative(process.cwd(), abs));
    if (errors.length) {
      failed = true;
      errors.forEach((line) => console.error(line));
    } else {
      console.log("lint ok " + path.relative(process.cwd(), abs));
    }
  });
  if (failed) process.exit(1);
}

if (require.main === module) main(process.argv.slice(2));

module.exports = { lintSource };
