/**
 * Writes one SVG per slide for a deck JSON.
 *
 *   node scripts/write_deck_svgs.js deck.json out-dir
 */

const fs = require("fs");
const path = require("path");
const { slideSvg } = require("./slideSvg");

const deckPath = process.argv[2];
const outDir = process.argv[3];
if (!deckPath || !outDir) {
  console.error("usage: node scripts/write_deck_svgs.js deck.json out-dir");
  process.exit(1);
}
const deck = JSON.parse(fs.readFileSync(deckPath, "utf8"));
fs.mkdirSync(outDir, { recursive: true });
(deck.layoutSequence || []).forEach((layoutId, index) => {
  const name = "slide-" + String(index + 1).padStart(2, "0") + ".svg";
  fs.writeFileSync(path.join(outDir, name), slideSvg(deck, layoutId));
});
console.log((deck.layoutSequence || []).length);
