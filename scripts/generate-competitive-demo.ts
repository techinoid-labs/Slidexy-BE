/**
 * Competitive remorph demo — same brief routed into two design systems.
 * Shows anatomy (SEL + motion) vs a flat “Gamma-style” homogeneous layout.
 *
 *   node -r ts-node/register/transpile-only scripts/generate-competitive-demo.ts
 */
import * as fs from "fs";
import * as path from "path";
import { ROOT } from "./lib/designKit";
import { routeFamily, listRoutableFamilies } from "./lib/familyRouter";
import { selCatalogJson } from "./lib/sel";

const BRIEF =
  "Overnight color grade for a documentary — LUT pack, node graph, waveform scopes, final render queue.";

async function main() {
  const out = path.join(ROOT, "out", "competitive-demo");
  fs.mkdirSync(out, { recursive: true });

  const hit = routeFamily(BRIEF);
  const alt = listRoutableFamilies().find((f) => f.family !== hit.family && f.units.length >= 3) || listRoutableFamilies()[0];

  const report = {
    brief: BRIEF,
    thesis: "Slidexy routes into a metaphor + SEL set; Gamma-style tools fill one modern grid.",
    primary: hit,
    alternateSystem: {
      family: alt.family,
      metaphor: alt.metaphor,
      units: alt.units,
      motion: alt.motion,
    },
    gammaStyleContrast: {
      silhouette: "single modern card grid",
      elements: ["title", "body", "image", "accent bar"],
      motion: "none or stock fade",
      note: "Same anatomy for every niche — coffee, race, photo lab all look identical.",
    },
    slidexyContrast: {
      silhouette: hit.metaphor,
      elements: hit.units,
      motion: hit.motion,
      note: "Grayscale-recognizable system; remorph = swap family, keep content slots.",
    },
    howToRenderFlagships: [
      "node -r ts-node/register/transpile-only scripts/generate-object-batch.ts --only=darkroom-proof --publish-local",
      "node -r ts-node/register/transpile-only scripts/generate-element-batch.ts --only=grade-suite --publish-local",
    ],
    selCatalog: selCatalogJson(),
    galleryDoc: "docs/template-pipeline/DESIGN-SYSTEMS-GALLERY.md",
  };

  fs.writeFileSync(path.join(out, "remorph-report.json"), JSON.stringify(report, null, 2));

  const md = [
    "# Competitive remorph demo",
    "",
    `**Brief:** ${BRIEF}`,
    "",
    "## Slidexy primary route",
    `- Family: **${hit.family}** (${hit.confidence.toFixed(2)} confidence)`,
    `- Metaphor: ${hit.metaphor}`,
    `- SEL: ${hit.units.join(", ")}`,
    `- Motion: cover ${hit.motion.cover} → feature ${hit.motion.feature} → close ${hit.motion.close}`,
    `- Reasons: ${hit.reasons.join("; ")}`,
    "",
    "## Alternate system (same brief)",
    `- Family: **${alt.family}**`,
    `- Metaphor: ${alt.metaphor}`,
    `- SEL: ${alt.units.join(", ")}`,
    "",
    "## Vs Gamma-style homogeneous deck",
    "- One modern card grid for every topic",
    "- No niche silhouette; no signature elements; fade-only motion",
    "- Remorph is restyling colors, not redesigning anatomy",
    "",
    "See DESIGN-SYSTEMS-GALLERY.md and FIDELITY-TIERS.md.",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(out, "README.md"), md);
  console.log("Competitive demo →", path.relative(ROOT, out));
  console.log("Primary route:", hit.family, hit.units.join("+"));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
