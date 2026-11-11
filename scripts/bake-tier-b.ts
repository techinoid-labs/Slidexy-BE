/**
 * Bake published BE decks into Flutter-safe Tier B packages.
 *
 *   node -r ts-node/register/transpile-only scripts/bake-tier-b.ts
 *   node -r ts-node/register/transpile-only scripts/bake-tier-b.ts --only=vitrine-case
 *   PUBLIC_CATALOG_BASE=https://api.example.com node -r ts-node/register/transpile-only scripts/bake-tier-b.ts
 */
import { bakeCuratedSet } from "./lib/tierBBake";

const DEFAULT_SET = [
  "vitrine-case",
  "dossier-clip",
  "mezzanine-cube",
  "platepress-rack",
  "darkroom-proof",
  "hearth-folio",
  "oxide-atelier",
  "gulhane-line",
  "night-market",
  "idea-wall",
  "tide-form",
  "arcade-signal-dense",
  "channel-nine",
  "eclipse-vault",
];

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith("--" + name + "="));
  return hit ? hit.slice(name.length + 3) : undefined;
}

async function main() {
  const only = arg("only");
  const ids = only ? [only] : DEFAULT_SET.filter((id) => {
    try {
      require("fs").accessSync(require("path").join(__dirname, "..", "app-library", "published", id + ".json"));
      return true;
    } catch {
      return false;
    }
  });
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
