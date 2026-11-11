/**
 * Bake a BE published deck into Flutter-safe Tier B JSON.
 * - strips Tier A-only fields (fancy type treatments, morph, motion, tones)
 * - rewrites relative photo URLs to absolute catalog URLs
 * - infers Flutter bindings from element ids so generate-dynamic can fill slots
 */
import * as fs from "fs";
import * as path from "path";

const ROOT = path.join(__dirname, "..", "..");
const PUBLISHED = path.join(ROOT, "app-library", "published");

export type BakeOptions = {
  id: string;
  /** Public origin for photo URLs, e.g. https://api.example.com */
  publicBaseUrl?: string;
  outDir?: string;
};

const FANCY_TREATMENTS = new Set(["outline", "long-shadow", "offset-3d"]);

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function walkElements(deck: any, visit: (el: any, layoutId: string) => void) {
  for (const layoutId of Object.keys(deck.layouts || {})) {
    const layout = deck.layouts[layoutId];
    if (!layout || !Array.isArray(layout.elements)) continue;
    for (const el of layout.elements) visit(el, layoutId);
  }
}

function inferTextBinding(el: any): string | null {
  const id = String(el.id || "");
  const role = String(el.role || "");
  if (id === "title" || role === "title") return "title";
  if (id === "subtitle" || role === "subtitle") return "subtitle";
  if (id === "eyebrow" || role === "eyebrow" || id === "copy0") return "eyebrow";
  if (/^copy\d+$/.test(id)) return "bullets";
  if (role === "body") return "bullets";
  return null;
}

function inferImageBinding(el: any): string | null {
  const id = String(el.id || "");
  if (el.slot === "photo") return "image";
  if (id === "photo" || id.endsWith("photo") || id.includes("hero")) return "image";
  return null;
}

function stripTierA(el: any) {
  delete el.morphId;
  delete el.mask;
  delete el.maskedImageContent;
  if (el.textStyle) {
    if (FANCY_TREATMENTS.has(String(el.textStyle.typeTreatment || ""))) {
      el.textStyle.typeTreatment = "solid";
    }
    delete el.textStyle.offsetSteps;
    delete el.textStyle.offsetX;
    delete el.textStyle.offsetY;
    delete el.textStyle.shadowLength;
    delete el.textStyle.shadowStep;
    delete el.textStyle.strokeWidth;
  }
  if (el.textContent && Array.isArray(el.textContent.spans)) {
    for (const span of el.textContent.spans) {
      if (FANCY_TREATMENTS.has(String(span.typeTreatment || ""))) {
        span.typeTreatment = "solid";
      }
    }
  }
  if (el.imageContent) {
    delete el.imageContent.tone;
    delete el.imageContent.zoom;
  }
}

function applyBindings(el: any) {
  if (el.type === "text") {
    const binding = inferTextBinding(el);
    if (binding) {
      el.textContent = el.textContent || {};
      el.textContent.binding = binding;
      if (binding === "title") el.role = el.role || "title";
      if (binding === "bullets") el.role = el.role || "body";
      if (binding === "eyebrow") el.role = el.role || "eyebrow";
    }
  }
  if (el.type === "image") {
    const binding = inferImageBinding(el);
    if (binding) {
      el.imageContent = el.imageContent || {};
      el.imageContent.binding = binding;
    }
  }
}

function rewritePhotoUrl(el: any, id: string, publicBaseUrl: string) {
  if (el.type !== "image" || !el.imageContent || typeof el.imageContent.url !== "string") return;
  const url = el.imageContent.url;
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return;
  const file = path.basename(url.replace(/^photos\//, ""));
  const base = publicBaseUrl.replace(/\/$/, "");
  el.imageContent.url = `${base}/api/catalog/${id}/photos/${file}`;
}

function assertTierBSafe(deck: any) {
  const raw = JSON.stringify(deck);
  const failures: string[] = [];
  if (/maskedImageContent/.test(raw)) failures.push("maskedImageContent present");
  if (/"typeTreatment"\s*:\s*"(outline|long-shadow|offset-3d)"/.test(raw)) {
    failures.push("fancy typeTreatment present");
  }
  if (deck.motion && (deck.motion.morph || deck.motion.cameraPan || deck.motion.scatter)) {
    failures.push("Tier A motion flags present");
  }
  if (failures.length) {
    const err = new Error("Tier-B gate failed: " + failures.join("; "));
    (err as any).failures = failures;
    throw err;
  }
}

export function bakeTierBDeck(opts: BakeOptions) {
  const id = opts.id;
  const src = path.join(PUBLISHED, id + ".json");
  if (!fs.existsSync(src)) throw new Error("Published deck not found: " + id);
  const deck = deepClone(JSON.parse(fs.readFileSync(src, "utf8")));
  const publicBaseUrl = opts.publicBaseUrl || process.env.PUBLIC_CATALOG_BASE || "http://127.0.0.1:4000";

  // Flutter-safe motion: fade only, no morph/camera
  deck.motion = {
    morph: false,
    ambient: false,
    cameraPan: false,
    scatter: false,
    defaultTransition: "fade",
    durationMs: 600,
  };
  delete deck.scenes;
  if (Array.isArray(deck.layoutSequence)) {
    deck.layoutSequence = deck.layoutSequence.filter(
      (lid: string) => !/-pan-|-scatter-|-morph-/i.test(String(lid))
    );
  }

  walkElements(deck, (el) => {
    stripTierA(el);
    applyBindings(el);
    rewritePhotoUrl(el, id, publicBaseUrl);
  });

  // Map BE slide-NN ids onto Flutter SlideLayoutType names so the mobile
  // picker/generation can resolve layouts. Keep compositions deck-scoped
  // (inline `layouts`); do not publish under shared global layout filenames.
  const FLUTTER_LAYOUT_CYCLE = [
    "layoutTitleFocus",
    "layoutThreeUp",
    "layoutImageLeft",
    "layoutAgendaList",
    "layoutQuoteBanner",
    "layoutClosingCta",
    "layoutTextOnly",
    "layoutTimeline",
    "layoutComparison",
    "layoutTeam",
    "layoutStatHighlight",
    "layoutFullBleedHero",
  ];
  const oldLayouts = deck.layouts || {};
  const renamedLayouts: Record<string, any> = {};
  const idMap: Record<string, string> = {};
  const seq = (deck.layoutSequence || Object.keys(oldLayouts)) as string[];
  seq.forEach((layoutId, i) => {
    const nextId = FLUTTER_LAYOUT_CYCLE[i % FLUTTER_LAYOUT_CYCLE.length];
    // If two slides map to the same cycle slot, suffix to keep uniqueness in-deck.
    const unique = renamedLayouts[nextId] ? `${nextId}_${i}` : nextId;
    idMap[layoutId] = unique === nextId ? nextId : nextId; // prefer canonical names in order
    const src = oldLayouts[layoutId];
    if (!src) return;
    const layout = deepClone(src);
    layout.id = nextId;
    // Later slides that collide on cycle get skipped only if identical key —
    // use index-priority: first wins canonical name; extras get numbered role names.
    if (!renamedLayouts[nextId]) {
      renamedLayouts[nextId] = layout;
      idMap[layoutId] = nextId;
    } else {
      const alt = FLUTTER_LAYOUT_CYCLE[(i + 6) % FLUTTER_LAYOUT_CYCLE.length] || `layoutTextOnly`;
      const altId = renamedLayouts[alt] ? `layoutTextOnly` : alt;
      layout.id = altId;
      renamedLayouts[altId] = layout;
      idMap[layoutId] = altId;
    }
  });
  deck.layouts = renamedLayouts;
  deck.layoutSequence = seq.map((lid: string) => idMap[lid] || lid);

  // Picker thumbnails require previewSlides; without them the card is a blank color.
  const firstLayout = deck.layoutSequence[0] || "layoutTitleFocus";
  const coverUrl = (() => {
    let found = "";
    walkElements(deck, (el) => {
      if (found) return;
      if (el.type === "image" && el.imageContent && typeof el.imageContent.url === "string") {
        found = el.imageContent.url;
      }
    });
    return found;
  })();
  deck.previewSlides = [
    {
      id: id + "-p1",
      layout: firstLayout,
      title: deck.name || id,
      bullets: [deck.description || "Design system template"].filter(Boolean),
      image: coverUrl,
    },
  ];

  deck.schemaVersion = 2;
  deck.mobileTier = "B";
  deck.tierB = {
    baked: true,
    bakedAt: new Date().toISOString(),
    sourceId: id,
    publicBaseUrl,
  };
  deck.enabled = true;
  deck.source = "be-published";

  assertTierBSafe(deck);

  const outRoot = opts.outDir || path.join(ROOT, "out", "tier-b", id);
  fs.mkdirSync(outRoot, { recursive: true });
  const deckPath = path.join(outRoot, "deck.json");
  fs.writeFileSync(deckPath, JSON.stringify(deck, null, 2) + "\n");

  // Extract layouts as separate files (Flutter remote catalog shape)
  const layoutsDir = path.join(outRoot, "layouts");
  fs.mkdirSync(layoutsDir, { recursive: true });
  const layoutIds: string[] = [];
  for (const layoutId of Object.keys(deck.layouts || {})) {
    const layout = deck.layouts[layoutId];
    layoutIds.push(layoutId);
    fs.writeFileSync(path.join(layoutsDir, layoutId + ".json"), JSON.stringify(layout, null, 2) + "\n");
  }

  const meta = {
    id,
    name: deck.name,
    family: deck.family || "",
    layoutSequence: deck.layoutSequence,
    layoutIds,
    mobileTier: "B",
    capabilities: ["firestore", "generateDynamic", "catalogPreview"],
    deckPath: path.relative(ROOT, deckPath).replace(/\\/g, "/"),
  };
  fs.writeFileSync(path.join(outRoot, "meta.json"), JSON.stringify(meta, null, 2) + "\n");
  return { deck, meta, outRoot };
}

export function bakeCuratedSet(ids: string[], opts: Omit<BakeOptions, "id"> = {}) {
  return ids.map((id) => bakeTierBDeck({ ...opts, id }));
}
