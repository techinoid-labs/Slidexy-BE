/**
 * Regenerate a published/out deck with the same DeckSpec seed + photo cache,
 * then emit an old|new PNG grid.
 *
 *   node -r ts-node/register/transpile-only scripts/compare.ts <deckId>
 *   node -r ts-node/register/transpile-only scripts/compare.ts <deckId> --prompt "…" [--brand-lock] [--deckType Pitch]
 *
 * Without --prompt: re-render from saved deckspec.json (or reverse-engineered
 * DeckSpec) using saved engine.selections (same variant seed).
 * With --prompt: full generateKitV1 (LLM) then grid vs prior PNGs.
 * --brand-lock forces charcoal-ember + slab-rockwell + tint + bar-accent.
 */
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

require("ts-node/register/transpile-only");
require("../services/templatePipeline/fonts");

const ROOT = path.join(__dirname, "..");
const { renderDeckFromSpec } = require("../engine/render");
const { generateKitV1 } = require("../engine/generateKitV1");
const { selectAll } = require("../engine/selectVariant");
const { runGates } = require("../engine/gates");
const { tokens } = require("../engine/render");
const { renderSlidePng } = require("./slideSvg");

function findDeckDir(deckId: string): string {
  const candidates = [
    path.join(ROOT, "app-library", "published", deckId),
    path.join(ROOT, "out", "compare", deckId, "old"),
    path.join(ROOT, "out", "proof-llm", deckId),
    path.join(ROOT, "generated-templates", deckId),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "slide-01.png")) || fs.existsSync(path.join(dir, "deck.json"))) {
      return dir;
    }
  }
  throw new Error("No deck folder with slides for " + deckId);
}

function textFromEl(el: any): string {
  if (!el || !el.textContent) return "";
  if (Array.isArray(el.textContent.spans)) {
    return el.textContent.spans.map((s: any) => s.text || "").join("");
  }
  return String(el.textContent.text || "");
}

/** Reverse a rendered deck into a DeckSpec for deterministic re-render. */
function deckSpecFromDeck(deck: any): any {
  const style = (deck.engine && deck.engine.style) || {
    palette: "charcoal-ember",
    typePair: "slab-rockwell",
    imageTreatment: "tint",
    motif: "bar-accent",
  };
  if (style.imageTreatment === "duotone") style.imageTreatment = "tint";

  const slides = (deck.layoutSequence || []).map((layoutId: string) => {
    const layout = deck.layouts[layoutId];
    const els = layout.elements || [];
    const byId: Record<string, any> = {};
    els.forEach((el: any) => {
      byId[el.id] = el;
    });
    const title =
      textFromEl(byId.title) ||
      textFromEl(els.find((e: any) => e.type === "text" && e.zIndex >= 2)) ||
      layout.name ||
      layout.role;
    const body: string[] = [];
    ["b1", "b2", "b3", "b4", "body"].forEach((id) => {
      const t = textFromEl(byId[id]);
      if (t) {
        if (id === "body") body.push(...t.split(/\n+/).map((x) => x.trim()).filter(Boolean));
        else body.push(t.trim());
      }
    });
    const caption = textFromEl(byId.caption) || undefined;
    const members: any[] = [];
    for (let m = 0; m < 4; m++) {
      const name = textFromEl(byId["name" + m] || byId["m" + m + "name"]);
      const role = textFromEl(byId["role" + m] || byId["m" + m + "role"]);
      if (name) members.push({ name, role: role || "" });
    }
    const stats: any[] = [];
    for (let s = 0; s < 3; s++) {
      const value = textFromEl(byId["statValue" + s] || byId["v" + s]);
      const label = textFromEl(byId["statLabel" + s] || byId["l" + s]);
      if (value) stats.push({ value, label: label || "" });
    }

    const photoEls = els.filter((e: any) => e.type === "image");
    const noun = String(title || layout.role || "scene")
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .trim();
    const slide: any = {
      role: layout.role || layout.name,
      title: title.slice(0, 60),
    };
    if (caption) slide.caption = caption.slice(0, 80);
    if (body.length) slide.body = body.slice(0, 4).map((b) => b.slice(0, 90));
    if (members.length >= 2) slide.members = members.slice(0, 4);
    if (stats.length) slide.stats = stats.slice(0, 3);

    if (photoEls.length > 1) {
      const labels = body.length ? body : photoEls.map((_: any, i: number) => "detail " + (i + 1));
      slide.photoQueries = photoEls.map((_: any, i: number) => {
        const bit = (labels[i] || "detail " + (i + 1)).toLowerCase();
        return (noun + " " + bit + " gaming lounge").slice(0, 120);
      });
      slide.photoQuery = slide.photoQueries[0];
      slide.photoOrientation = "landscape";
    } else if (photoEls.length === 1) {
      slide.photoQuery = (noun + " scene").slice(0, 120);
      slide.photoOrientation = "landscape";
    }
    return slide;
  });

  return { style, slides };
}

async function writeGrid(oldDir: string, newDir: string, outFile: string) {
  const oldSlides = fs
    .readdirSync(oldDir)
    .filter((n: string) => /^slide-\d{2}\.png$/.test(n))
    .sort();
  const newSlides = fs
    .readdirSync(newDir)
    .filter((n: string) => /^slide-\d{2}\.png$/.test(n))
    .sort();
  const ids = oldSlides.length >= newSlides.length ? oldSlides : newSlides;
  const thumbW = 480;
  const thumbH = 270;
  const gap = 16;
  const labelH = 28;
  const cols = 2;
  const rows = ids.length;
  const canvas = createCanvas(cols * thumbW + gap * 3, rows * (thumbH + labelH) + gap * 2 + 40);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0c0c0e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f2f2f2";
  ctx.font = "bold 18px Arial";
  ctx.fillText("OLD", gap, 28);
  ctx.fillText("NEW", gap * 2 + thumbW, 28);

  for (let i = 0; i < ids.length; i++) {
    const name = ids[i] || "slide-" + String(i + 1).padStart(2, "0") + ".png";
    const y = 40 + gap + i * (thumbH + labelH);
    const oldPath = path.join(oldDir, name);
    const newPath = path.join(newDir, name);
    if (fs.existsSync(oldPath)) {
      const img = await loadImage(oldPath);
      ctx.drawImage(img, gap, y, thumbW, thumbH);
    } else {
      ctx.fillStyle = "#333";
      ctx.fillRect(gap, y, thumbW, thumbH);
    }
    if (fs.existsSync(newPath)) {
      const img = await loadImage(newPath);
      ctx.drawImage(img, gap * 2 + thumbW, y, thumbW, thumbH);
    } else {
      ctx.fillStyle = "#333";
      ctx.fillRect(gap * 2 + thumbW, y, thumbW, thumbH);
    }
    ctx.fillStyle = "#aaa";
    ctx.font = "12px Arial";
    ctx.fillText(name, gap, y + thumbH + 16);
  }

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, canvas.toBuffer("image/png"));
  return outFile;
}

async function main() {
  const argv = process.argv.slice(2);
  const args = argv.filter((a) => a && !a.startsWith("--"));
  const promptIdx = argv.indexOf("--prompt");
  const promptArg = promptIdx >= 0 ? argv[promptIdx + 1] : "";
  const typeIdx = argv.indexOf("--deckType");
  const deckType = (typeIdx >= 0 ? argv[typeIdx + 1] : "Pitch") as any;
  const brandLock = argv.includes("--brand-lock");
  const deckId = args[0];
  if (!deckId) {
    console.error('Usage: scripts/compare.ts <deckId> [--prompt "…"] [--brand-lock] [--deckType Pitch]');
    process.exit(1);
  }

  const oldDir = findDeckDir(deckId);
  const outRoot = path.join(ROOT, "out", "compare", deckId);
  const oldCopy = path.join(outRoot, "old");
  const newDir = path.join(outRoot, "new");
  fs.mkdirSync(oldCopy, { recursive: true });
  fs.mkdirSync(newDir, { recursive: true });

  // Snapshot prior PNGs
  fs.readdirSync(oldDir)
    .filter((n: string) => /^slide-\d{2}\.png$/.test(n) || n === "deck.json" || n === "deckspec.json")
    .forEach((n: string) => {
      fs.copyFileSync(path.join(oldDir, n), path.join(oldCopy, n));
    });
  const catalogJson = path.join(ROOT, "app-library", "published", deckId + ".json");
  if (fs.existsSync(catalogJson) && !fs.existsSync(path.join(oldCopy, "deck.json"))) {
    fs.copyFileSync(catalogJson, path.join(oldCopy, "deck.json"));
  }

  let deck: any;
  let spec: any;
  let selections: any;

  if (promptArg) {
    console.log("LLM regenerate", { deckType, brandLock });
    const result = await generateKitV1(promptArg, deckType, {
      outDir: newDir,
      id: deckId,
      styleLock: brandLock ? true : undefined,
    });
    deck = result.deck;
    spec = result.spec;
    selections = result.selections;
    console.log(
      "style",
      spec.style,
      "roles",
      spec.slides.map((s: any) => s.role).join("→"),
      "gates",
      result.gates.pass,
      "repaired",
      result.repaired
    );
    fs.writeFileSync(path.join(newDir, "deckspec.json"), JSON.stringify(spec, null, 2));
  } else {
    const deckPath = fs.existsSync(path.join(oldDir, "deck.json"))
      ? path.join(oldDir, "deck.json")
      : fs.existsSync(catalogJson)
        ? catalogJson
        : path.join(oldCopy, "deck.json");
    deck = JSON.parse(fs.readFileSync(deckPath, "utf8"));
    const specPath = path.join(oldDir, "deckspec.json");
    if (fs.existsSync(specPath)) {
      spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
    } else {
      spec = deckSpecFromDeck(deck);
      // Prefer gaming-lounge concrete nouns when reversing this known id
      if (/gaming-lounge/i.test(deckId)) {
        spec.slides.forEach((s: any) => {
          if (s.photoQuery && !/gaming|lounge|esport|pc|gamer/i.test(s.photoQuery)) {
            s.photoQuery = (s.photoQuery + " gaming lounge").slice(0, 120);
          }
          if (Array.isArray(s.photoQueries)) {
            s.photoQueries = s.photoQueries.map((q: string) =>
              /gaming|lounge|esport|pc|gamer/i.test(q) ? q : (q + " gaming lounge").slice(0, 120)
            );
          }
        });
      }
    }
    if (spec.style && spec.style.imageTreatment === "duotone") spec.style.imageTreatment = "tint";
    selections =
      (deck.engine && deck.engine.selections) ||
      selectAll(spec, deckId + "|" + spec.style.palette + "|" + spec.style.typePair);

    // Enforce family rule on re-select if we recompute
    if (!(deck.engine && deck.engine.selections)) {
      selections = selectAll(spec, deckId);
    }

    const gates = runGates(spec, selections, tokens, "Overview");
    fs.writeFileSync(path.join(newDir, "deckspec.json"), JSON.stringify(spec, null, 2));
    fs.writeFileSync(path.join(newDir, "gates.json"), JSON.stringify(gates, null, 2));
    console.log("gates", gates.pass, "fails", gates.slides.filter((s: any) => !s.pass).length);

    deck = await renderDeckFromSpec(spec, selections, { id: deckId });
    fs.writeFileSync(path.join(newDir, "deck.json"), JSON.stringify(deck, null, 2));
    deck.layoutSequence.forEach((layoutId: string, index: number) => {
      const file = path.join(newDir, "slide-" + String(index + 1).padStart(2, "0") + ".png");
      renderSlidePng(deck, layoutId, file);
    });
    try {
      const { exportDeckPptx } = require("../services/templatePipeline/catalog");
      await exportDeckPptx(deck, path.join(newDir, "deck.pptx"));
    } catch (err) {
      console.warn("pptx export skipped:", (err as Error).message);
    }
  }

  const gridPath = path.join(outRoot, "compare-grid.png");
  await writeGrid(oldCopy, newDir, gridPath);
  console.log("wrote", gridPath);

  // Refresh published copy with new render (keep prior PNGs under out/compare/.../old)
  const pubDir = path.join(ROOT, "app-library", "published", deckId);
  if (fs.existsSync(path.dirname(pubDir))) {
    fs.mkdirSync(pubDir, { recursive: true });
    fs.writeFileSync(path.join(pubDir, "deck.json"), JSON.stringify(deck, null, 2));
    fs.writeFileSync(path.join(ROOT, "app-library", "published", deckId + ".json"), JSON.stringify(deck, null, 2));
    if (spec) fs.writeFileSync(path.join(pubDir, "deckspec.json"), JSON.stringify(spec, null, 2));
    fs.readdirSync(newDir)
      .filter((n: string) => /^slide-\d{2}\.png$/.test(n) || n.endsWith(".pptx"))
      .forEach((n: string) => {
        fs.copyFileSync(path.join(newDir, n), path.join(pubDir, n));
      });
    console.log("updated published", pubDir);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
