/**
 * Print how many decoration assets are in each vibe folder.
 *
 *   node scripts/list_assets.js
 *
 * A PNG and an SVG that share a name count as one asset.
 */

const fs = require("fs");
const path = require("path");

const LIBRARY = path.join(__dirname, "..", "assets", "decorations");

function vibeFolders() {
  if (!fs.existsSync(LIBRARY)) return [];
  return fs.readdirSync(LIBRARY, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function countAssets(vibe) {
  const dir = path.join(LIBRARY, vibe);
  if (!fs.existsSync(dir)) return 0;
  const names = new Set();
  fs.readdirSync(dir).forEach((name) => {
    if (name.startsWith(".")) return;
    if (!/\.(png|svg)$/i.test(name)) return;
    names.add(name.replace(/\.(png|svg)$/i, "").toLowerCase());
  });
  return names.size;
}

function listAssets() {
  const line = vibeFolders().map((vibe) => {
    const label = vibe.charAt(0).toUpperCase() + vibe.slice(1);
    const count = countAssets(vibe);
    return label + ": " + count + " assets";
  }).join(", ");
  console.log(line);
  return line;
}

if (require.main === module) listAssets();

module.exports = { listAssets, countAssets };
