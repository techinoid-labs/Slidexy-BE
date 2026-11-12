/**
 * Stage (if needed) → bake Tier B → copy into Flutter assets for offline picker.
 *
 *   FLUTTER_ROOT=C:\work\slidesX npm run sync:tier-b-flutter
 *   FLUTTER_ROOT=... node -r ts-node/register/transpile-only scripts/sync-tier-b-to-flutter.ts --all
 *   FLUTTER_ROOT=... node -r ts-node/register/transpile-only scripts/sync-tier-b-to-flutter.ts --remaining
 *   FLUTTER_ROOT=... node -r ts-node/register/transpile-only scripts/sync-tier-b-to-flutter.ts --only=dossier-clip
 */
import * as fs from "fs";
import * as path from "path";
import { bakeTierBDeck } from "./lib/tierBBake";

const ROOT = path.join(__dirname, "..");
const PUBLISHED = path.join(ROOT, "app-library", "published");
const OUT = path.join(ROOT, "out");
const PHOTOS_V1 = path.join(ROOT, "generated-templates", "photos", "engine-v1");

/** Prefer these at the front of the mobile picker when present. */
const PINNED_ORDER = [
  "night-market",
  "idea-wall",
  "tide-form",
  "arcade-signal-dense",
  "channel-nine",
  "dossier-clip",
  "eclipse-vault",
  "vitrine-case",
  "mezzanine-cube",
  "platepress-rack",
  "darkroom-proof",
  "hearth-folio",
  "oxide-atelier",
  "gulhane-line",
];

const SKIP_IDS = new Set([
  "_manifest",
  "kit-v1-gaming-lounge-overview-mvt8jmat",
]);

const DISPLAY_NAMES: Record<string, string> = {
  "night-market": "NIGHT MARKET",
  "idea-wall": "IDEA WALL",
  "tide-form": "TIDE FORM",
  "arcade-signal-dense": "ARCADE SIGNAL",
  "channel-nine": "CHANNEL NINE",
  "dossier-clip": "DOSSIER CLIP",
  "eclipse-vault": "ECLIPSE VAULT",
  "vitrine-case": "VITRINE NEW",
  "mezzanine-cube": "MEZZANINE CUBE",
  "platepress-rack": "PLATEPRESS",
  "darkroom-proof": "DARKROOM PROOF",
  "hearth-folio": "HEARTH FOLIO",
  "oxide-atelier": "OXIDE ATELIER",
  "gulhane-line": "GULHANE LINE",
};

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith("--" + name + "="));
  return hit ? hit.slice(name.length + 3) : undefined;
}

function hasFlag(name: string) {
  return process.argv.includes("--" + name);
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

function listReadyPublishedIds(): string[] {
  if (!fs.existsSync(PUBLISHED)) return [];
  return fs
    .readdirSync(PUBLISHED)
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.slice(0, -5))
    .filter((id) => !SKIP_IDS.has(id))
    .filter((id) => {
      try {
        const deck = JSON.parse(
          fs.readFileSync(path.join(PUBLISHED, id + ".json"), "utf8")
        );
        const layouts = deck.layouts || {};
        return Object.keys(layouts).length > 0;
      } catch {
        return false;
      }
    })
    .sort((a, b) => a.localeCompare(b));
}

function shipOrder(ids: string[]): string[] {
  const set = new Set(ids);
  const pinned = PINNED_ORDER.filter((id) => set.has(id));
  const rest = ids.filter((id) => !PINNED_ORDER.includes(id)).sort();
  return [...pinned, ...rest];
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

  // Copy every rendered slide frame so the mobile picker can show the
  // exact BE catalog look (not a Tier-B reconstruction).
  for (let i = 1; i <= 24; i++) {
    const padded = `slide-${String(i).padStart(2, "0")}.png`;
    const plain = `slide-${i}.png`;
    const src =
      [path.join(OUT, id, padded), path.join(OUT, id, plain), path.join(PUBLISHED, id, padded)].find(
        (p) => fs.existsSync(p)
      ) || null;
    if (!src) continue;
    const slideName = `slide_${String(i).padStart(2, "0")}.png`;
    fs.copyFileSync(src, path.join(chromeDir, slideName));
    copied.push(slideName);
    if (i <= 3) {
      const destName = `preview_${i}.png`;
      fs.copyFileSync(src, path.join(chromeDir, destName));
      copied.push(destName);
    }
  }

  return copied;
}

function rewriteToAssetUrls(deck: any, flutterDeckId: string) {
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

function displayNameFor(id: string, deck: any): string {
  if (DISPLAY_NAMES[id]) return DISPLAY_NAMES[id];
  const raw = String(deck.name || id)
    .replace(/\s*[•·].*$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
  return raw.toUpperCase();
}

function firstAuthoredPhotoUrl(layoutObj: any): string {
  for (const el of layoutObj?.elements || []) {
    const url = el?.imageContent?.url;
    if (typeof url !== "string" || !url) continue;
    const name = path.basename(url.split("?")[0]).toLowerCase();
    if (name === "cover.png" || name.startsWith("preview_") || name === "preview.png") {
      continue;
    }
    return url;
  }
  return "";
}

function buildPreviewSlides(deck: any, flutterDeckId: string, chromePrefix: string, chromeDir: string) {
  const seq: string[] = deck.layoutSequence || [];
  const cover = chromePrefix + "cover.png";
  const slides = [];
  const count = Math.min(Math.max(seq.length, 1), 12);
  for (let i = 0; i < count; i++) {
    const layout = seq[i] || seq[0] || "layoutTitleFocus";
    const layoutObj = deck.layouts?.[layout];
    const slideName = `slide_${String(i + 1).padStart(2, "0")}.png`;
    const slidePath = path.join(chromeDir, slideName);
    const previewPath = path.join(chromeDir, `preview_${i + 1}.png`);
    // Exact BE render wins — this is what makes mobile match the catalog.
    let exact = "";
    if (fs.existsSync(slidePath)) exact = chromePrefix + slideName;
    else if (fs.existsSync(previewPath)) exact = chromePrefix + `preview_${i + 1}.png`;
    else if (i === 0 && fs.existsSync(path.join(chromeDir, "cover.png"))) exact = cover;

    const titleEl = (layoutObj?.elements || []).find(
      (e: any) => e.type === "text" && (e.role === "title" || e.id === "title")
    );
    const title =
      titleEl?.textContent?.text ||
      titleEl?.textContent?.spans?.map((s: any) => s.text).join("") ||
      deck.name ||
      flutterDeckId;
    const authored = firstAuthoredPhotoUrl(layoutObj);
    slides.push({
      id: `${flutterDeckId}-p${i + 1}`,
      layout,
      title: String(title).slice(0, 80),
      bullets: [deck.description || "Design system template"].filter(Boolean).slice(0, 2),
      image: exact || authored || cover,
      exactRender: Boolean(exact),
    });
  }
  deck.previewSlides = slides;
  // Generation must walk the same order the picker shows.
  deck.fixedSequence = true;
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
  deck.name = displayNameFor(id, deck);
  const chromePrefix = rewriteToAssetUrls(deck, fid);
  buildPreviewSlides(deck, fid, chromePrefix, chromeDir);
  deck.description = deck.description || `${deck.name} — BE design system`;
  deck.enabled = true;

  const decksDir = path.join(flutterRoot, "assets", "templates", "decks");
  fs.mkdirSync(decksDir, { recursive: true });
  fs.writeFileSync(path.join(decksDir, fid + ".json"), JSON.stringify(deck, null, 2) + "\n");

  console.log("FLUTTER", fid, "→", path.relative(flutterRoot, path.join(decksDir, fid + ".json")));
}

function rewriteIndex(beIds: string[]) {
  const flutterRoot = resolveFlutterRoot();
  const indexPath = path.join(flutterRoot, "assets", "templates", "index.json");
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const beFlutterIds = beIds.map(flutterId);
  const beSet = new Set(beFlutterIds);
  const legacy = (Array.isArray(index.order) ? index.order : []).filter(
    (id: string) => !beSet.has(id)
  );
  index.order = [...beFlutterIds, ...legacy];
  index.version = (Number(index.version) || 0) + 1;
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n");
  return index.version as number;
}

async function main() {
  const only = arg("only");
  const ready = listReadyPublishedIds();
  let ids: string[];
  if (only) {
    ids = [only];
  } else if (hasFlag("remaining")) {
    const flutterRoot = resolveFlutterRoot();
    const decksDir = path.join(flutterRoot, "assets", "templates", "decks");
    ids = shipOrder(
      ready.filter((id) => !fs.existsSync(path.join(decksDir, flutterId(id) + ".json")))
    );
  } else {
    // Default / --all: every ready published deck.
    ids = shipOrder(ready);
  }

  if (!ids.length) {
    console.log("Nothing to sync.");
    return;
  }

  console.log(`Syncing ${ids.length} deck(s)…`);
  for (const id of ids) stagePublished(id);

  const failed: string[] = [];
  for (const id of ids) {
    try {
      const result = bakeTierBDeck({
        id,
        publicBaseUrl: process.env.PUBLIC_CATALOG_BASE || "http://127.0.0.1:4000",
      });
      console.log("BAKED", result.meta.id);
      installIntoFlutter(id);
    } catch (e: any) {
      failed.push(id);
      console.error("FAIL", id, e?.message || e);
    }
  }

  const ok = ids.filter((id) => !failed.includes(id));
  // Rebuild picker order from the full ready set that exists in Flutter, so
  // --remaining still lands in the pinned+alpha ship order.
  const flutterRoot = resolveFlutterRoot();
  const decksDir = path.join(flutterRoot, "assets", "templates", "decks");
  const present = shipOrder(
    ready.filter((id) => fs.existsSync(path.join(decksDir, flutterId(id) + ".json")))
  );
  const version = rewriteIndex(present);

  console.log(
    "Done:",
    ok.map(flutterId).join(", "),
    "index v" + version,
    failed.length ? `| failed: ${failed.join(", ")}` : ""
  );
  if (failed.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
