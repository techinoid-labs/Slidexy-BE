/**
 * Writes the ten Harbor decks (seeds 1–10) as JSON.
 *
 *   node scripts/export_harbor_decks.js out-dir
 */

const fs = require("fs");
const path = require("path");
const { composeDeck } = require("../services/templatePipeline/composeDeck");

const COVERS = ["band", "split", "stack", "photo", "browser", "type"];
const CLOSES = ["panel", "center", "left", "right"];
const ALIGNS = ["left", "center", "asymmetric"];
const DENSITIES = ["airy", "balanced", "dense"];

function idea(index) {
  return {
    name: "Harbor " + (index + 1),
    title: "Harbor",
    subtitle: "Night watch",
    cover: COVERS[index % COVERS.length],
    close: CLOSES[index % CLOSES.length],
    density: DENSITIES[index % DENSITIES.length],
    align: ALIGNS[index % ALIGNS.length],
    designLanguage: "editorial",
    groundMode: "flat",
    photo: "",
    palette: {
      name: "Harbor",
      bg: "#F4F7F8",
      surface: "#E6EEEF",
      card: "#FFFFFF",
      ink: "#122026",
      muted: "#4C626A",
      rule: "#D0DEE2",
      accent: "#0E4D6C",
      accent2: "#C46B2F",
      onAccent: "#F4F7F8",
    },
    fonts: { display: "Fraunces", text: "Source Sans 3" },
  };
}

const outDir = process.argv[2];
if (!outDir) {
  console.error("usage: node scripts/export_harbor_decks.js out-dir");
  process.exit(1);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  for (let seed = 1; seed <= 10; seed += 1) {
    const deck = await composeDeck(seed, idea(seed - 1));
    deck.id = "harbor-" + seed;
    const file = path.join(outDir, deck.id + ".json");
    fs.writeFileSync(file, JSON.stringify(deck, null, 2) + "\n", "utf8");
    console.log(file);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
