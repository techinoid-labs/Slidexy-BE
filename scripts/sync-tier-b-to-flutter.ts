/**
 * Stage (if needed) → bake Tier B → copy into Flutter assets for offline picker.
 *
 *   node -r ts-node/register/transpile-only scripts/sync-tier-b-to-flutter.ts
 *   node -r ts-node/register/transpile-only scripts/sync-tier-b-to-flutter.ts --only=dossier-clip
 *   FLUTTER_ROOT=C:\work\slidesX node -r ts-node/register/transpile-only scripts/sync-tier-b-to-flutter.ts
 */
import * as fs from "fs";
import * as path from "path";
import { bakeTierBDeck } from "./lib/tierBBake";

const ROOT = path.join(__dirname, "..");
const PUBLISHED = path.join(ROOT, "app-library", "published");
const OUT = path.join(ROOT, "out");
const PHOTOS_V1 = path.join(ROOT, "generated-templates", "photos", "engine-v1");

const DEFAULT_IDS = [
  "night-market",
  "idea-wall",
  "tide-form",
  "arcade-signal-dense",
  "channel-nine",
  "dossier-clip",
  "eclipse-vault",
];

const DISPLAY_NAMES: Record<string, string> = {
  "night-market": "NIGHT MARKET",
  "idea-wall": "IDEA WALL",
  "tide-form": "TIDE FORM",
  "arcade-signal-dense": "ARCADE SIGNAL",
  "channel-nine": "CHANNEL NINE",
  "dossier-clip": "DOSSIER CLIP",
  "eclipse-vault": "ECLIPSE VAULT",
  "vitrine-case": "VITRINE NEW",
};

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith("--" + name + "="));
  return hit ? hit.slice(name.length + 3) : undefined;
}

function flutterId(id: string) {
  return id.replace(/-/g, "_");
}

function resolveFlutterRoot(): string {
  if (process.env.FLUTTER_ROOT) return process.env.FLUTTER_ROOT;
  const candidates = [
    path.join(ROOT, "..", "slidesX-Flutter-POC"),
    "C:\\work\\slidesX",
    path.join(ROOT, "..", "slidesX"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, "pubspec.yaml"))) return c;
  }
  throw new Error("Flutter root not found. Set FLUTTER_ROOT.");
}

function resolvePhoto(relOrName: string): string | null {
  const name = path.basename(relOrName.replace(/^photos\//, "").replace(/^engine-v1\//, ""));
  const tries = [
    path.join(PHOTOS_V1, name),
    path.join(ROOT, "generated-templates", relOrName.replace(/^\//, "")),
    path.join(ROOT, "generated-templates", "photos", name),
    path.join(PUBLISHED, "photos", name),
  ];
  for (const t of tries) if (fs.existsSync(t)) return t;
  return null;
}

/** Ensure app-library/published/<id>.json (+ photos/) exists so bake can run. */
function stagePublished(id: string) {
  const jsonPath = path.join(PUBLISHED, id + ".json");
  if (fs.existsSync(jsonPath)) {
    console.log("PUBLISHED ok", id);
    return;
  }
  const outDeck = path.join(OUT, id, "deck.json");
  if (!fs.existsSync(outDeck)) {
    throw new Error(`Cannot stage ${id}: missing ${jsonPath} and ${outDeck}`);
  }
  const deck = JSON.parse(fs.readFileSync(outDeck, "utf8"));
  const photoDir = path.join(PUBLISHED, id, "photos");
  fs.mkdirSync(photoDir, { recursive: true });

  const walk = (el: any) => {
    const url = el?.imageContent?.url;
    if (typeof url !== "string" || /^https?:\/\//i.test(url) || url.startsWith("data:")) return;
    const src = resolvePhoto(url);
    if (!src) {
      console.warn("  missing photo", url);
      return;
    }
    const name = path.basename(src);
    fs.copyFileSync(src, path.join(photoDir, name));
    el.imageContent.url = `photos/${name}`;
  };
  for (const layout of Object.values(deck.layouts || {}) as any[]) {
    for (const el of layout.elements || []) walk(el);
  }

  fs.writeFileSync(jsonPath, JSON.stringify(deck, null, 2) + "\n");
  // Keep a deck.json mirror in the published folder for catalog tooling.
  fs.mkdirSync(path.join(PUBLISHED, id), { recursive: true });
  fs.copyFileSync(jsonPath, path.join(PUBLISHED, id, "deck.json"));
  console.log("STAGED", id, "→ published");
}

function collectChromeFiles(id: string, chromeDir: string): string[] {
  fs.mkdirSync(chromeDir, { recursive: true });
  const copied: string[] = [];

  const photoDirs = [
    path.join(PUBLISHED, id, "photos"),
    path.join(OUT, id, "photos"),
  ];
  for (const dir of photoDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      const src = path.join(dir, name);
      if (!fs.statSync(src).isFile()) continue;
      fs.copyFileSync(src, path.join(chromeDir, name));
      copied.push(name);
    }
  }

  // Prefer rendered previews as cover + picker thumbs.
  const previewCandidates = [
    path.join(OUT, id, "preview.png"),
    path.join(OUT, id, "slide-01.png"),
    path.join(OUT, id, "slide-1.png"),
    path.join(PUBLISHED, id, "slide-01.png"),
  ];
  for (const c of previewCandidates) {
    if (fs.existsSync(c)) {
      fs.copyFileSync(c, path.join(chromeDir, "cover.png"));
      copied.push("cover.png");
      break;
    }
  }

  for (let i = 1; i <= 3; i++) {
    const padded = `slide-${String(i).padStart(2, "0")}.png`;
    const plain = `slide-${i}.png`;
    const src =
      [path.join(OUT, id, padded), path.join(OUT, id, plain), path.join(PUBLISHED, id, padded)].find(
        (p) => fs.existsSync(p)
      ) || null;
    if (src) {
      const destName = `preview_${i}.png`;
      fs.copyFileSync(src, path.join(chromeDir, destName));
      copied.push(destName);
    }
  }

  return copied;
}

function rewriteToAssetUrls(deck: any, id: string, flutterDeckId: string) {
  const chromePrefix = `assets/templates/chrome/be_${flutterDeckId}/`;
  const rewrite = (url: string): string => {
    if (!url || url.startsWith("assets/")) return url;
    if (url.startsWith("data:")) return url;
    const name = path.basename(url.split("?")[0]);
    return chromePrefix + name;
  };
  for (const layout of Object.values(deck.layouts || {}) as any[]) {
    for (const el of layout.elements || []) {
      if (el?.imageContent?.url) el.imageContent.url = rewrite(el.imageContent.url);
    }
  }
  return chromePrefix;
}

function buildPreviewSlides(deck: any, flutterDeckId: string, chromePrefix: string) {
  const seq: string[] = deck.layoutSequence || [];
  const cover = chromePrefix + "cover.png";
  const slides = [];
  for (let i = 0; i < Math.min(3, Math.max(1, seq.length)); i++) {
    const layout = seq[i] || "layoutTitleFocus";
    const previewFile = fs.existsSync(
      path.join(
        resolveFlutterRoot(),
        "assets",
        "templates",
        "chrome",
        `be_${flutterDeckId}`,
        `preview_${i + 1}.png`
      )
    )
      ? `${chromePrefix}preview_${i + 1}.png`
      : cover;
    const layoutObj = deck.layouts?.[layout];
    const titleEl = (layoutObj?.elements || []).find(
      (e: any) => e.type === "text" && (e.role === "title" || e.id === "title")
    );
    const title =
      titleEl?.textContent?.text ||
      titleEl?.textContent?.spans?.map((s: any) => s.text).join("") ||
      deck.name ||
      flutterDeckId;
    slides.push({
      id: `${flutterDeckId}-p${i + 1}`,
      layout,
      title: String(title).slice(0, 80),
      bullets: [deck.description || "Design system template"].filter(Boolean).slice(0, 2),
      image: previewFile,
    });
  }
  deck.previewSlides = slides;
}

function installIntoFlutter(id: string) {
  const flutterRoot = resolveFlutterRoot();
  const bakedPath = path.join(OUT, "tier-b", id, "deck.json");
  if (!fs.existsSync(bakedPath)) throw new Error("Missing bake: " + bakedPath);

  const fid = flutterId(id);
  const chromeDir = path.join(flutterRoot, "assets", "templates", "chrome", `be_${fid}`);
  collectChromeFiles(id, chromeDir);

  const deck = JSON.parse(fs.readFileSync(bakedPath, "utf8"));
  deck.id = fid;
  deck.name = DISPLAY_NAMES[id] || String(deck.name || id).toUpperCase();
  const chromePrefix = rewriteToAssetUrls(deck, id, fid);
  buildPreviewSlides(deck, fid, chromePrefix);
  deck.description = deck.description || `${deck.name} — BE design system`;
  deck.enabled = true;

  const decksDir = path.join(flutterRoot, "assets", "templates", "decks");
  fs.mkdirSync(decksDir, { recursive: true });
  fs.writeFileSync(path.join(decksDir, fid + ".json"), JSON.stringify(deck, null, 2) + "\n");

  const indexPath = path.join(flutterRoot, "assets", "templates", "index.json");
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const order: string[] = Array.isArray(index.order) ? index.order.filter((x: string) => x !== fid) : [];
  order.unshift(fid);
  index.order = order;
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n");

  console.log("FLUTTER", fid, "→", path.relative(flutterRoot, path.join(decksDir, fid + ".json")));
}

async function main() {
  const only = arg("only");
  const ids = only ? [only] : DEFAULT_IDS;
  for (const id of ids) stagePublished(id);
  for (const id of ids) {
    const result = bakeTierBDeck({
      id,
      publicBaseUrl: process.env.PUBLIC_CATALOG_BASE || "http://127.0.0.1:4000",
    });
    console.log("BAKED", result.meta.id);
  }
  // Install in reverse so DEFAULT_IDS[0] ends up first in the picker.
  for (const id of [...ids].reverse()) installIntoFlutter(id);

  const flutterRoot = resolveFlutterRoot();
  const indexPath = path.join(flutterRoot, "assets", "templates", "index.json");
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  index.version = (Number(index.version) || 0) + 1;
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n");

  console.log("Done:", ids.map(flutterId).join(", "), "index v" + index.version);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
