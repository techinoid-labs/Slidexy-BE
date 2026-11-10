/**
 * Offline kit-authoring prompts. No LLM requests or production kit writes.
 * node -r ts-node/register/transpile-only scripts/build-design-guide.ts --list
 * node -r ts-node/register/transpile-only scripts/build-design-guide.ts architecture-portfolio --pattern=ref-masonry-showcase
 */
import * as fs from "fs";
import * as path from "path";

const ROOT = path.join(__dirname, "..");
const GUIDE_ROOT = path.join(ROOT, "design-guides");
const DNA_PATH = path.join(ROOT, "docs", "layout-dna", "canva-reference-layouts.json");
const SCALE = 5 / 6;

export function listDesignGuides(): any[] {
  return fs.readdirSync(GUIDE_ROOT)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => JSON.parse(fs.readFileSync(path.join(GUIDE_ROOT, name), "utf8")));
}

function scaleBounds(bounds: any): any {
  return Object.fromEntries(["x", "y", "width", "height"].map((key) => [
    key, Math.round(bounds[key] * SCALE * 100) / 100,
  ]));
}

export function buildDesignGuidePrompt(guideId: string, patternId?: string): string {
  const guides = listDesignGuides();
  const guide = guides.find((item) => item.id === guideId);
  if (!guide) throw new Error("Unknown design guide: " + guideId + ". Use --list.");
  const target = patternId || guide.referenceLayoutIds[0];
  if (!guide.referenceLayoutIds.includes(target)) {
    throw new Error("Pattern " + target + " is not in " + guideId + ". Allowed: " + guide.referenceLayoutIds.join(", "));
  }
  const dna = JSON.parse(fs.readFileSync(DNA_PATH, "utf8"));
  const reference = dna.slides.find((slide: any) => slide.id === target);
  if (!reference) throw new Error("Missing reference layout: " + target);
  const authoring = fs.readFileSync(path.join(GUIDE_ROOT, "KIT-AUTHORING.md"), "utf8");
  const schema = JSON.parse(fs.readFileSync(path.join(ROOT, "engine", "schemas", "kit.schema.json"), "utf8"));
  const blueprint = {
    id: reference.suggestedEngineRole + "/" + reference.id,
    role: reference.suggestedEngineRole,
    variant: reference.id,
    canvas: guide.canvas,
    sourceFile: reference.sourceFile,
    precision: dna.measurement.precision,
    spatialGeometry: reference.spatialGeometry,
    elements: reference.elements.map((element: any) => {
      const result: any = {
        id: element.id,
        type: element.type,
        role: element.role || element.assetRole || element.semanticRole,
        ...scaleBounds(element.bounds),
        z: element.z,
      };
      if (element.typography) {
        const floor = element.role === "title" ? 40 : element.role === "chart-label" ? 20 : 24;
        result.typography = {
          ...element.typography,
          fontSize: Math.max(floor, Math.round(element.typography.fontSizePx * SCALE * 100) / 100),
          letterSpacing: Math.round(element.typography.letterSpacingPx * SCALE * 100) / 100,
        };
        delete result.typography.fontSizePx;
        delete result.typography.letterSpacingPx;
        delete result.typography.referenceText;
        result.typography.content = "Bind to slide data; do not copy reference brand or wording.";
      }
      if (element.fit) result.imageFit = element.fit;
      if (element.mask) result.mask = element.mask;
      if (element.edgeTreatment) result.edgeTreatmentIntent = element.edgeTreatment;
      if (element.cornerRadiusPx) result.cornerRadius = element.cornerRadiusPx * SCALE;
      if (element.chartType) result.chartType = element.chartType;
      if (element.fraction != null) result.exampleFraction = element.fraction;
      if (element.fill === "none") result.fillIntent = "transparent";
      return result;
    }),
    reservedWhitespace: reference.negativeSpace.zones.map((zone: any) => ({
      id: zone.id, ...scaleBounds(zone.bounds), reason: zone.reason,
    })),
    spacingRules: reference.negativeSpace.rules,
    unsupportedIntentPolicy: "Inspect current renderer before mapping edge fades, logos, charts, tracking or progress. Use supported shapes/native charts or report the exact capability gap.",
  };
  return [
    authoring,
    "## Selected design family", JSON.stringify(guide, null, 2),
    "## Selected blueprint in 1600 x 900 engine units", JSON.stringify(blueprint, null, 2),
    "## Current kit schema", JSON.stringify(schema, null, 2),
    "Author or refine exactly one draft kit for " + blueprint.id + ". Inspect the existing kit first and preserve unrelated work. Output the kit JSON plus a short implementation note separately. Never put prose in the JSON.",
  ].join("\n\n");
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    if (args.length === 1 && args[0] === "--list") {
      for (const guide of listDesignGuides()) {
        console.log(guide.id + " — " + guide.name);
        console.log("  patterns: " + guide.referenceLayoutIds.join(", "));
      }
    } else {
      const guideId = args[0];
      const patternArg = args[1];
      if (!guideId || args.length > 2 || (patternArg && !patternArg.startsWith("--pattern="))) {
        throw new Error("Usage: build-design-guide.ts --list | <guide-id> [--pattern=<reference-id>]");
      }
      process.stdout.write(buildDesignGuidePrompt(guideId, patternArg?.slice("--pattern=".length)) + "\n");
    }
  } catch (error) {
    console.error((error as Error).message);
    process.exitCode = 1;
  }
}
