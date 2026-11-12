/**
 * Bake published BE decks into Flutter-safe Tier B packages.
 *
 *   node -r ts-node/register/transpile-only scripts/bake-tier-b.ts
 *   node -r ts-node/register/transpile-only scripts/bake-tier-b.ts --only=vitrine-case
 *   PUBLIC_CATALOG_BASE=https://api.example.com node -r ts-node/register/transpile-only scripts/bake-tier-b.ts
 */
import { bakeCuratedSet } from "./lib/tierBBake";

const SKIP = new Set(["_manifest", "kit-v1-gaming-lounge-overview-mvt8jmat"]);

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith("--" + name + "="));
  return hit ? hit.slice(name.length + 3) : undefined;
}

function listPublishedIds(): string[] {
  const fs = require("fs") as typeof import("fs");
  const path = require("path") as typeof import("path");
  const dir = path.join(__dirname, "..", "app-library", "published");
  return fs
    .readdirSync(dir)
    .filter((name: string) => name.endsWith(".json"))
    .map((name: string) => name.slice(0, -5))
    .filter((id: string) => !SKIP.has(id))
    .filter((id: string) => {
      try {
        const deck = JSON.parse(fs.readFileSync(path.join(dir, id + ".json"), "utf8"));
        return Object.keys(deck.layouts || {}).length > 0;
      } catch {
        return false;
      }
    })
    .sort();
}

async function main() {
  const only = arg("only");
  const ids = only ? [only] : listPublishedIds();
  if (!ids.length) {
    console.error("No published decks matched. Publish first, then bake.");
    process.exit(1);
  }
  const results = bakeCuratedSet(ids, {
    publicBaseUrl: process.env.PUBLIC_CATALOG_BASE || "http://127.0.0.1:4000",
  });
  for (const r of results) {
    console.log("BAKED", r.meta.id, "→", r.outRoot);
  }
  console.log("Done:", results.map((r) => r.meta.id).join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
