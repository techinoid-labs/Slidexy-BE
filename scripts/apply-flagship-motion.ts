/**
 * Re-stamp flagship motion (role transitions + ambient) onto published decks.
 *
 *   node -r ts-node/register/transpile-only scripts/apply-flagship-motion.ts
 *   node -r ts-node/register/transpile-only scripts/apply-flagship-motion.ts --only=vitrine-case
 */
import * as fs from "fs";
import * as path from "path";

const { expandMotionScenes, FLAGSHIP_MOTION } = require("../engine/motion");

const ROOT = path.join(__dirname, "..");
const PUBLISHED = path.join(ROOT, "app-library", "published");

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith("--" + name + "="));
  return hit ? hit.slice(name.length + 3) : undefined;
}

function listIds(): string[] {
  return fs
    .readdirSync(PUBLISHED)
    .filter((n) => n.endsWith(".json") && !n.startsWith("_"))
    .map((n) => n.slice(0, -5));
}

function main() {
  const only = arg("only");
  const ids = only ? [only] : listIds();
  let ok = 0;
  for (const id of ids) {
    const file = path.join(PUBLISHED, id + ".json");
    if (!fs.existsSync(file)) {
      console.warn("SKIP missing", id);
      continue;
    }
    const deck = JSON.parse(fs.readFileSync(file, "utf8"));
    deck.motion = { ...(deck.motion || {}), ...FLAGSHIP_MOTION };
    const next = expandMotionScenes(deck, FLAGSHIP_MOTION);
    fs.writeFileSync(file, JSON.stringify(next, null, 2) + "\n");
    // Mirror folder deck.json when present
    const mirror = path.join(PUBLISHED, id, "deck.json");
    if (fs.existsSync(path.dirname(mirror))) {
      fs.mkdirSync(path.dirname(mirror), { recursive: true });
      fs.writeFileSync(mirror, JSON.stringify(next, null, 2) + "\n");
    }
    const roles = (next.layoutSequence || []).map((lid: string) => {
      const lay = next.layouts[lid] || {};
      return `${lay.role || "?"}:${(lay.motion && lay.motion.transition) || "none"}`;
    });
    console.log("OK", id, roles.slice(0, 6).join(", "));
    ok++;
  }
  console.log(`Done ${ok}/${ids.length} with flagship motion v1.2`);
}

main();
