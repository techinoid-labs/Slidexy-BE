/**
 * Design-first templates — each family has its OWN silhouette language.
 * Forbidden: the lookbook 6-recipe (masthead / interior / menu / portrait / notes / closing).
 *
 *   volt-brief-dense   — KPI tiles + ribbon timeline + L-cut photo
 *   folio-ink-dense    — typography journal (almost no photos)
 *   admit-one-dense    — ticket stub / perforation / seat grid
 *
 *   node -r ts-node/register/transpile-only scripts/generate-design-first-batch.ts
 *   … --publish-local
 */
import * as fs from "fs";
import * as path from "path";

const { renderDeckFromSpec } = require("../engine/render");
const { validateKitObject } = require("../engine/validateSchema");
const { renderSlidePng } = require("./slideSvg");
const { exportDeckPptx } = require("../services/templatePipeline/catalog");
const { createCanvas, loadImage } = require("canvas");

const ROOT = path.join(__dirname, "..");
const PHOTOS = path.join(ROOT, "engine/cache/photos");

type El = Record<string, any>;

const t = (
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fontSize: number,
  slot: string,
  color = "ink",
  extras: El = {}
): El => ({
  id,
  type: "text",
  x,
  y,
  width: w,
  height: h,
  fontSize,
  slot,
  tokenColor: color,
  fontRole: slot === "title" || fontSize >= 70 ? "display" : "body",
  fontWeight: slot === "title" || fontSize >= 48 ? 700 : 400,
  lineHeight: extras.lineHeight || 1.12,
  letterSpacing: extras.letterSpacing != null ? extras.letterSpacing : 0,
  z: 4,
  ...extras,
});

const rect = (id: string, x: number, y: number, w: number, h: number, fill: string, z = 1): El => ({
  id,
  type: "shape",
  shape: "rect",
  x,
  y,
  width: w,
  height: h,
  tokenFill: fill,
  z,
});

const circle = (id: string, x: number, y: number, size: number, fill: string, z = 1): El => ({
  id,
  type: "shape",
  shape: "ellipse",
  x,
  y,
  width: size,
  height: size,
  tokenFill: fill,
  z,
});

const img = (id: string, x: number, y: number, w: number, h: number): El => ({
  id,
  type: "image",
  x,
  y,
  width: w,
  height: h,
  z: 1,
  slot: "photo",
});

function writeKit(role: string, variant: string, family: string, elements: El[], opts: El = {}) {
  const slots: El = {};
  const fit: El = {};
  const pptxMapping: El = {};
  for (const e of elements) {
    if (e.type === "text" && e.slot) {
      if (e.slot.startsWith("copy")) {
        const n = Number(String(e.slot).replace("copy", ""));
        slots[e.slot] = { kind: "text", from: "items" + n };
      } else {
        slots[e.slot] = {
          kind: "text",
          from: e.slot === "title" ? "title" : e.slot,
        };
      }
      fit[e.slot] = {
        minFont: e.fontSize,
        maxFont: e.fontSize,
        lineClamp: Math.max(1, Math.floor(e.height / (e.fontSize * 1.15))),
        shrinkMin: 1,
      };
      pptxMapping[e.slot] = { kind: "text" };
    }
    if (e.type === "image" && e.slot === "photo") {
      slots.photo = { kind: "image", from: "photo" };
      pptxMapping.photo = { kind: "picture" };
    }
  }
  const kit = {
    id: `${role}/${variant}`,
    role,
    variant,
    family,
    status: "approved",
    preserveLayout: true,
    requiresPhoto: !!opts.requiresPhoto,
    photoSlots: opts.requiresPhoto ? ["photo"] : [],
    slots,
    fit,
    pptxMapping,
    layout: { elements },
  };
  validateKitObject(kit);
  const dir = path.join(ROOT, "kit", role);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, variant + ".json"), JSON.stringify(kit, null, 2));
  return kit;
}

type Lookbook = {
  id: string;
  name: string;
  description: string;
  brand: El;
  slides: El[];
  kits: () => { role: string; variant: string }[];
};

const LOOKBOOKS: Lookbook[] = [
  // ─────────────────────────────────────────────────────────────
  // VOLT BRIEF — industrial KPI / ribbon / L-cut (not a lookbook)
  // ─────────────────────────────────────────────────────────────
  {
    id: "volt-brief-dense",
    name: "Volt Brief • Shift report",
    description: "Industrial briefing — KPI tile grid, ribbon timeline, L-cut photo field. Not a cafe lookbook.",
    brand: {
      colors: {
        bg: "#111418",
        surface: "#1C2228",
        surface_color: "#252C34",
        ink: "#E8EEF2",
        muted: "#8A97A3",
        accent: "#F5A623",
        line: "#343C46",
      },
      fonts: { display: "Archivo Black", body: "Arial" },
    },
    slides: [
      { role: "cover", title: "Volt Brief", items: ["Shift report · Bay 4", "06:40"] },
      {
        role: "feature",
        title: "Live meters",
        items: ["94%", "Uptime", "12", "Open tickets", "3.1m", "Mean reply", "0", "Sev-1"],
      },
      {
        role: "feature",
        title: "Ribbon",
        items: [
          "06:40",
          "Handover",
          "08:00",
          "Load test",
          "10:30",
          "Patch window",
          "13:00",
          "Customer call",
          "16:00",
          "Close bay",
        ],
      },
      {
        role: "feature",
        title: "Bay four",
        items: [
          "What moved",
          "Patch landed clean. Latency dropped under eighty milliseconds for the morning cohort.",
          "What waits",
          "Two tickets still need a human walkthrough before we close the bay.",
        ],
        photoQuery: "02956ca2a9",
      },
      {
        role: "feature",
        title: "Owners",
        items: [
          "Priya",
          "Owns uptime and the patch window. Escalates anything that slips past 10:30.",
          "Jonah",
          "Owns customer call notes and the two open walkthroughs.",
        ],
        photoQuery: "0746be1cf3",
      },
      { role: "feature", title: "Hold the line.", items: ["Volt Ops · Bay 4"] },
    ],
    kits: () => {
      const f = "volt-brief";
      // Cover: L-bracket frame + title locked bottom-left + time top-right (not masthead bar).
      writeKit("cover", "volt-brief-bracket", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        rect("L-v", 60, 60, 18, 780, "accent", 2),
        rect("L-h", 60, 822, 520, 18, "accent", 2),
        rect("R-h", 1180, 60, 360, 18, "line", 2),
        rect("R-v", 1522, 60, 18, 200, "line", 2),
        t("copy1", 1220, 100, 280, 80, 56, "copy1", "accent", { textStyleRole: "stat", align: "right" }),
        t("title", 110, 520, 1000, 180, 110, "title"),
        t("copy0", 110, 720, 900, 60, 32, "copy0", "muted"),
      ]);
      // 2×2 KPI tile grid — silhouette unique to this family.
      writeKit("feature", "volt-brief-meters", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        t("title", 60, 40, 1480, 70, 48, "title", "muted", { textStyleRole: "kicker", fontRole: "label" }),
        rect("t0", 60, 140, 720, 340, "surface"),
        t("copy0", 100, 180, 640, 160, 120, "copy0", "accent", { textStyleRole: "stat", letterSpacing: -2 }),
        t("copy1", 100, 370, 640, 60, 32, "copy1", "muted"),
        rect("t1", 820, 140, 720, 340, "surface"),
        t("copy2", 860, 180, 640, 160, 120, "copy2", "ink", { textStyleRole: "stat", letterSpacing: -2 }),
        t("copy3", 860, 370, 640, 60, 32, "copy3", "muted"),
        rect("t2", 60, 520, 720, 320, "surface"),
        t("copy4", 100, 560, 640, 140, 100, "copy4", "ink", { textStyleRole: "stat", letterSpacing: -2 }),
        t("copy5", 100, 730, 640, 60, 32, "copy5", "muted"),
        rect("t3", 820, 520, 720, 320, "accent"),
        t("copy6", 860, 560, 640, 140, 100, "copy6", "bg", { textStyleRole: "stat", letterSpacing: -2 }),
        t("copy7", 860, 730, 640, 60, 32, "copy7", "bg"),
      ]);
      // Ribbon timeline — five equal segments across the slide.
      writeKit("feature", "volt-brief-ribbon", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        t("title", 60, 50, 1480, 80, 56, "title", "accent"),
        rect("r0", 60, 220, 280, 520, "surface"),
        t("copy0", 80, 260, 240, 60, 36, "copy0", "accent"),
        t("copy1", 80, 360, 240, 280, 36, "copy1", "ink", { lineHeight: 1.2 }),
        rect("r1", 360, 220, 280, 520, "surface_color"),
        t("copy2", 380, 260, 240, 60, 36, "copy2", "accent"),
        t("copy3", 380, 360, 240, 280, 36, "copy3", "ink", { lineHeight: 1.2 }),
        rect("r2", 660, 220, 280, 520, "surface"),
        t("copy4", 680, 260, 240, 60, 36, "copy4", "accent"),
        t("copy5", 680, 360, 240, 280, 36, "copy5", "ink", { lineHeight: 1.2 }),
        rect("r3", 960, 220, 280, 520, "surface_color"),
        t("copy6", 980, 260, 240, 60, 36, "copy6", "accent"),
        t("copy7", 980, 360, 240, 280, 36, "copy7", "ink", { lineHeight: 1.2 }),
        rect("r4", 1260, 220, 280, 520, "accent"),
        t("copy8", 1280, 260, 240, 60, 36, "copy8", "bg"),
        t("copy9", 1280, 360, 240, 280, 36, "copy9", "bg", { lineHeight: 1.2 }),
      ]);
      // L-cut: photo fills most of frame; text only in bottom-left L pocket.
      writeKit(
        "feature",
        "volt-brief-lcut",
        f,
        [
          img("photo", 0, 0, 1600, 900),
          rect("cutV", 0, 0, 620, 900, "bg", 2),
          rect("cutH", 0, 620, 1600, 280, "bg", 2),
          t("title", 50, 60, 520, 140, 72, "title", "accent"),
          t("copy0", 50, 240, 520, 50, 30, "copy0", "accent"),
          t("copy1", 50, 310, 520, 220, 26, "copy1", "muted", { lineHeight: 1.28 }),
          t("copy2", 50, 660, 700, 50, 30, "copy2", "accent"),
          t("copy3", 50, 730, 1000, 120, 26, "copy3", "muted", { lineHeight: 1.28 }),
        ],
        { requiresPhoto: true }
      );
      // Owners: stacked horizontal bands (photo as thin top strip).
      writeKit(
        "feature",
        "volt-brief-owners",
        f,
        [
          rect("bg", 0, 0, 1600, 900, "bg", 0),
          img("photo", 0, 0, 1600, 280),
          rect("scrim", 0, 0, 1600, 280, "bg", 2),
          t("title", 60, 90, 1480, 100, 72, "title", "accent"),
          rect("b0", 60, 320, 1480, 250, "surface"),
          t("copy0", 100, 350, 400, 60, 40, "copy0", "accent"),
          t("copy1", 520, 350, 960, 180, 30, "copy1", "ink", { lineHeight: 1.28 }),
          rect("b1", 60, 600, 1480, 250, "surface_color"),
          t("copy2", 100, 630, 400, 60, 40, "copy2", "accent"),
          t("copy3", 520, 630, 960, 180, 30, "copy3", "ink", { lineHeight: 1.28 }),
        ],
        { requiresPhoto: true }
      );
      // Closing: one line, micro meta, no bar-across-bottom cliché — corner stamp instead.
      writeKit("feature", "volt-brief-stamp", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        t("title", 80, 300, 1440, 160, 96, "title", "ink", { align: "center" }),
        rect("stamp", 640, 520, 320, 120, "accent"),
        t("copy0", 660, 555, 280, 60, 28, "copy0", "bg", { align: "center" }),
      ]);
      return [
        { role: "cover", variant: "volt-brief-bracket" },
        { role: "feature", variant: "volt-brief-meters" },
        { role: "feature", variant: "volt-brief-ribbon" },
        { role: "feature", variant: "volt-brief-lcut" },
        { role: "feature", variant: "volt-brief-owners" },
        { role: "feature", variant: "volt-brief-stamp" },
      ];
    },
  },

  // ─────────────────────────────────────────────────────────────
  // FOLIO INK — typography journal (almost photo-free)
  // ─────────────────────────────────────────────────────────────
  {
    id: "folio-ink-dense",
    name: "Folio Ink • Issue 07",
    description: "Editorial typography journal — giant type, margin notes, pull quote, index rows. No lookbook photo splits.",
    brand: {
      colors: {
        bg: "#F7F2E8",
        surface: "#EFE8DA",
        surface_color: "#E6DDCC",
        ink: "#1A1714",
        muted: "#6A6158",
        accent: "#9C2F2F",
        line: "#D2C6B4",
      },
      fonts: { display: "Georgia", body: "Georgia" },
    },
    slides: [
      { role: "cover", title: "Folio Ink", items: ["Issue 07 · Spring paper", "07"] },
      {
        role: "feature",
        title: "On margins",
        items: [
          "Note",
          "We print the essay first and design around the leftover paper.",
          "The page is not a container. It is a second voice.",
          "Keep the outer margin wider than the inner one — the hand needs room.",
        ],
      },
      {
        role: "feature",
        title: "A quiet press still leaves a mark.",
        items: ["— Press room, March"],
      },
      {
        role: "feature",
        title: "Index",
        items: [
          "01",
          "Letter from the press",
          "02",
          "On margins",
          "03",
          "Paper stock tests",
          "04",
          "Contributors",
        ],
      },
      {
        role: "feature",
        title: "Two columns",
        items: [
          "Left",
          "Short lines hold better on warm stock. We cut adjectives before we cut space.",
          "Right",
          "Longer passages belong here. The eye can travel without losing the spine of the argument.",
        ],
      },
      { role: "feature", title: "Printed, not posted.", items: ["Folio Ink Press"] },
    ],
    kits: () => {
      const f = "folio-ink";
      // Cover: title as the whole composition — oversized, flush, page number as art.
      writeKit("cover", "folio-ink-mast", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        t("copy1", 70, 60, 200, 120, 96, "copy1", "accent", { textStyleRole: "stat" }),
        t("title", 70, 280, 1460, 280, 140, "title", "ink", { letterSpacing: -1.5, lineHeight: 0.95 }),
        rect("rule", 70, 600, 1460, 2, "ink", 2),
        t("copy0", 70, 640, 1000, 60, 32, "copy0", "muted"),
      ]);
      // Margin-note: narrow annotation rail + essay body (journal silhouette).
      writeKit("feature", "folio-ink-margin", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        rect("rail", 0, 0, 260, 900, "surface"),
        t("copy0", 40, 80, 180, 40, 22, "copy0", "accent", { textStyleRole: "kicker", fontRole: "label" }),
        t("copy1", 40, 140, 180, 600, 26, "copy1", "muted", { lineHeight: 1.35 }),
        t("title", 340, 80, 1180, 120, 72, "title"),
        t("copy2", 340, 240, 1100, 280, 34, "copy2", "ink", { lineHeight: 1.4 }),
        t("copy3", 340, 560, 1100, 240, 30, "copy3", "muted", { lineHeight: 1.4 }),
      ]);
      // Pull quote: enormous centered statement + small attribution.
      writeKit("feature", "folio-ink-pull", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        rect("mark", 120, 180, 40, 540, "accent", 2),
        t("title", 220, 220, 1240, 400, 64, "title", "ink", { lineHeight: 1.15 }),
        t("copy0", 220, 700, 800, 50, 28, "copy0", "accent"),
      ]);
      // Index: huge leading numerals + titles in rows (contents page).
      writeKit("feature", "folio-ink-index", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        t("title", 70, 50, 1460, 80, 56, "title", "muted", { textStyleRole: "kicker", fontRole: "label" }),
        t("copy0", 70, 160, 220, 100, 72, "copy0", "accent", { textStyleRole: "stat" }),
        t("copy1", 320, 180, 1100, 80, 48, "copy1"),
        rect("l0", 70, 280, 1460, 1, "line"),
        t("copy2", 70, 320, 220, 100, 72, "copy2", "accent", { textStyleRole: "stat" }),
        t("copy3", 320, 340, 1100, 80, 48, "copy3"),
        rect("l1", 70, 440, 1460, 1, "line"),
        t("copy4", 70, 480, 220, 100, 72, "copy4", "accent", { textStyleRole: "stat" }),
        t("copy5", 320, 500, 1100, 80, 48, "copy5"),
        rect("l2", 70, 600, 1460, 1, "line"),
        t("copy6", 70, 640, 220, 100, 72, "copy6", "accent", { textStyleRole: "stat" }),
        t("copy7", 320, 660, 1100, 80, 48, "copy7"),
      ]);
      // Two unequal columns (30/70) — essay spread.
      writeKit("feature", "folio-ink-columns", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        t("title", 70, 50, 1460, 90, 64, "title"),
        rect("rule", 70, 160, 200, 3, "accent", 2),
        t("copy0", 70, 220, 420, 50, 28, "copy0", "accent", { textStyleRole: "kicker", fontRole: "label" }),
        t("copy1", 70, 290, 420, 500, 28, "copy1", "ink", { lineHeight: 1.4 }),
        t("copy2", 560, 220, 960, 50, 28, "copy2", "accent", { textStyleRole: "kicker", fontRole: "label" }),
        t("copy3", 560, 290, 960, 500, 30, "copy3", "ink", { lineHeight: 1.4 }),
      ]);
      // Colophon: tiny centered block on empty paper.
      writeKit("feature", "folio-ink-colophon", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        rect("box", 500, 300, 600, 300, "surface"),
        t("title", 530, 360, 540, 100, 40, "title", "ink", { align: "center" }),
        t("copy0", 530, 480, 540, 50, 24, "copy0", "muted", { align: "center" }),
      ]);
      return [
        { role: "cover", variant: "folio-ink-mast" },
        { role: "feature", variant: "folio-ink-margin" },
        { role: "feature", variant: "folio-ink-pull" },
        { role: "feature", variant: "folio-ink-index" },
        { role: "feature", variant: "folio-ink-columns" },
        { role: "feature", variant: "folio-ink-colophon" },
      ];
    },
  },

  // ─────────────────────────────────────────────────────────────
  // ADMIT ONE — ticket stub / perforation / seat grid
  // ─────────────────────────────────────────────────────────────
  {
    id: "admit-one-dense",
    name: "Admit One • Night gate",
    description: "Event ticket language — stub split, perforation, seat grid, barcode strip. Not a photo lookbook.",
    brand: {
      colors: {
        bg: "#0E0A14",
        surface: "#1A1424",
        surface_color: "#241C32",
        ink: "#F6F0FF",
        muted: "#A89BB8",
        accent: "#C8F542",
        line: "#3A2F4A",
      },
      fonts: { display: "Archivo Black", body: "Arial" },
    },
    slides: [
      { role: "cover", title: "Admit One", items: ["Night gate · Door C", "A14"] },
      {
        role: "feature",
        title: "Your stub",
        items: [
          "GATE C",
          "Keep this half.",
          "Doors 21:00",
          "No re-entry after midnight.",
          "Row A · Seat 14",
          "Standing optional after the first act.",
        ],
      },
      {
        role: "feature",
        title: "Seat map",
        items: ["A", "B", "C", "D", "14", "taken", "open", "hold"],
      },
      {
        role: "feature",
        title: "Lineup",
        items: [
          "21:10",
          "Warm lights — no talking over the openers.",
          "22:00",
          "Headliner. Phones down for the first three songs.",
          "23:30",
          "Encore window. Stub still required at the bar rail.",
        ],
        photoQuery: "01f3884069",
      },
      {
        role: "feature",
        title: "Scan me",
        items: [
          "PASS",
          "Barcode faces up. Tear only on the perforation.",
          "Void if copied",
          "One stub, one body. Plus-ones buy their own.",
        ],
      },
      { role: "feature", title: "Go in loud.", items: ["Night Gate Collective"] },
    ],
    kits: () => {
      const f = "admit-one";
      // Cover: stub on left (torn ticket) + main face; perforation as dotted rects.
      const perfs: El[] = [];
      for (let i = 0; i < 18; i++) {
        perfs.push(rect("perf" + i, 390, 40 + i * 48, 12, 24, "line", 3));
      }
      writeKit("cover", "admit-one-ticket", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        rect("stub", 40, 40, 350, 820, "accent"),
        t("copy1", 70, 280, 290, 160, 88, "copy1", "bg", { textStyleRole: "stat", align: "center" }),
        t("copy0", 70, 500, 290, 200, 32, "copy0", "bg", { align: "center", lineHeight: 1.3 }),
        ...perfs,
        t("title", 460, 300, 1040, 220, 110, "title"),
      ]);
      // Stub detail: vertical stack of ticket fields (not a 2x2 menu).
      writeKit("feature", "admit-one-stubdetail", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        rect("frame", 80, 60, 1440, 780, "surface"),
        t("title", 120, 100, 1360, 90, 64, "title", "accent"),
        rect("row0", 120, 220, 1360, 100, "surface_color"),
        t("copy0", 150, 245, 400, 50, 36, "copy0", "accent"),
        t("copy1", 580, 245, 860, 50, 32, "copy1"),
        rect("row1", 120, 340, 1360, 100, "bg"),
        t("copy2", 150, 365, 400, 50, 36, "copy2", "accent"),
        t("copy3", 580, 365, 860, 50, 32, "copy3"),
        rect("row2", 120, 460, 1360, 100, "surface_color"),
        t("copy4", 150, 485, 400, 50, 36, "copy4", "accent"),
        t("copy5", 580, 485, 860, 50, 32, "copy5"),
        // barcode strips
        rect("b0", 120, 620, 40, 160, "ink", 2),
        rect("b1", 175, 620, 18, 160, "ink", 2),
        rect("b2", 210, 620, 55, 160, "ink", 2),
        rect("b3", 280, 620, 12, 160, "ink", 2),
        rect("b4", 310, 620, 70, 160, "ink", 2),
        rect("b5", 400, 620, 22, 160, "ink", 2),
        rect("b6", 440, 620, 48, 160, "ink", 2),
        rect("b7", 505, 620, 16, 160, "ink", 2),
        rect("b8", 540, 620, 90, 160, "ink", 2),
      ]);
      // Seat map: labeled grid of small seats.
      const seats: El[] = [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        t("title", 70, 40, 1460, 80, 56, "title", "accent"),
        t("copy0", 70, 140, 80, 50, 36, "copy0", "muted"),
        t("copy1", 70, 280, 80, 50, 36, "copy1", "muted"),
        t("copy2", 70, 420, 80, 50, 36, "copy2", "muted"),
        t("copy3", 70, 560, 80, 50, 36, "copy3", "muted"),
        t("copy4", 200, 800, 200, 50, 28, "copy4", "accent"),
        t("copy5", 500, 800, 200, 50, 28, "copy5", "muted"),
        t("copy6", 800, 800, 200, 50, 28, "copy6", "ink"),
        t("copy7", 1100, 800, 200, 50, 28, "copy7", "accent"),
      ];
      const fills = ["surface", "accent", "surface", "line", "surface", "surface", "accent", "surface", "line", "surface", "surface", "accent"];
      let si = 0;
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 10; col++) {
          seats.push(
            rect(
              "seat" + row + "_" + col,
              180 + col * 130,
              140 + row * 140,
              100,
              100,
              fills[si % fills.length],
              2
            )
          );
          si++;
        }
      }
      writeKit("feature", "admit-one-seats", f, seats);
      // Lineup: staggered indents (cascading), photo as small corner stamp.
      writeKit(
        "feature",
        "admit-one-lineup",
        f,
        [
          rect("bg", 0, 0, 1600, 900, "bg", 0),
          t("title", 70, 50, 1000, 100, 72, "title", "accent"),
          t("copy0", 70, 200, 200, 50, 40, "copy0", "accent"),
          t("copy1", 300, 200, 900, 100, 28, "copy1", "ink", { lineHeight: 1.25 }),
          t("copy2", 160, 360, 200, 50, 40, "copy2", "accent"),
          t("copy3", 390, 360, 900, 100, 28, "copy3", "ink", { lineHeight: 1.25 }),
          t("copy4", 250, 520, 200, 50, 40, "copy4", "accent"),
          t("copy5", 480, 520, 900, 100, 28, "copy5", "ink", { lineHeight: 1.25 }),
          img("photo", 1180, 560, 360, 280),
        ],
        { requiresPhoto: true }
      );
      // Scan: giant square "QR" placeholder + void rules.
      writeKit("feature", "admit-one-scan", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        rect("qr", 80, 100, 560, 560, "ink"),
        rect("qrIn", 140, 160, 440, 440, "bg"),
        rect("qrCore", 240, 260, 240, 240, "accent"),
        t("copy0", 720, 120, 800, 80, 64, "copy0", "accent", { textStyleRole: "stat" }),
        t("copy1", 720, 230, 800, 160, 32, "copy1", "ink", { lineHeight: 1.3 }),
        rect("rule", 720, 430, 800, 2, "line"),
        t("copy2", 720, 480, 800, 60, 40, "copy2", "accent"),
        t("copy3", 720, 560, 800, 160, 30, "copy3", "muted", { lineHeight: 1.3 }),
        circle("punch", 1400, 760, 80, "accent", 3),
        t("title", 80, 720, 500, 80, 48, "title", "muted"),
      ]);
      // Admit close: punched hole + giant GO.
      writeKit("feature", "admit-one-go", f, [
        rect("bg", 0, 0, 1600, 900, "accent", 0),
        circle("hole", 80, 80, 120, "bg", 2),
        t("title", 100, 320, 1400, 180, 100, "title", "bg", { align: "center" }),
        t("copy0", 400, 560, 800, 50, 28, "copy0", "bg", { align: "center" }),
      ]);
      return [
        { role: "cover", variant: "admit-one-ticket" },
        { role: "feature", variant: "admit-one-stubdetail" },
        { role: "feature", variant: "admit-one-seats" },
        { role: "feature", variant: "admit-one-lineup" },
        { role: "feature", variant: "admit-one-scan" },
        { role: "feature", variant: "admit-one-go" },
      ];
    },
  },
];

async function renderAndPublish(book: Lookbook) {
  const selections = book.kits();
  const example = {
    name: book.name,
    description: book.description,
    brand: book.brand,
    spec: {
      style: {
        palette: "ink-night",
        typePair: "modern-segoe",
        motif: "bar-accent",
        family: book.id.replace(/-dense$/, ""),
      },
      slides: book.slides,
    },
    selections,
  };
  fs.mkdirSync(path.join(ROOT, "examples"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "examples", book.id + ".json"), JSON.stringify(example, null, 2));

  const output = path.join(ROOT, "out", book.id);
  fs.mkdirSync(output, { recursive: true });

  const deck = await renderDeckFromSpec(example.spec, selections, {
    id: book.id,
    brand: book.brand,
    photoResolver: async (key: string) => {
      const file = fs.readdirSync(PHOTOS).find((name) => name.startsWith(key));
      if (!file) throw Error("Missing photograph " + key + " for " + book.id);
      return { path: path.join(PHOTOS, file), pexelsId: "local:" + key };
    },
  });
  deck.id = book.id;
  deck.name = book.name;
  deck.description = book.description;
  deck.family = book.id.replace(/-dense$/, "");

  const sheet = createCanvas(1280, 1104);
  const ctx = sheet.getContext("2d");
  ctx.fillStyle = book.brand.colors.ink || "#111";
  ctx.fillRect(0, 0, sheet.width, sheet.height);

  for (const [i, lid] of deck.layoutSequence.entries()) {
    const n = String(i + 1);
    const file = path.join(output, "slide-" + n + ".png");
    const padded = path.join(output, "slide-" + n.padStart(2, "0") + ".png");
    for (const e of deck.layouts[lid].elements) {
      if (e.textContent?.spans.some((s: any) => String(s.text).includes("…"))) {
        throw Error(`${book.id} slide ${i + 1} truncated: ${e.id}`);
      }
    }
    const warnings = renderSlidePng(deck, lid, file);
    if (warnings.length) throw Error(`${book.id}: ${warnings.join("; ")}`);
    fs.copyFileSync(file, padded);
    ctx.drawImage(await loadImage(file), (i % 2) * 640 + 4, Math.floor(i / 2) * 368 + 4, 632, 355.5);
  }
  fs.writeFileSync(path.join(output, "preview.png"), sheet.toBuffer("image/png"));

  const pptxTemp = path.join(output, book.id + ".export.pptx");
  const pptxPath = path.join(output, book.id + ".pptx");
  await exportDeckPptx(deck, pptxTemp);
  try {
    fs.copyFileSync(pptxTemp, pptxPath);
    fs.unlinkSync(pptxTemp);
  } catch {
    console.warn(book.id + ": kept export pptx (target locked)");
  }
  const pptxForPublish = fs.existsSync(pptxPath) ? pptxPath : pptxTemp;
  fs.writeFileSync(path.join(output, "deck.json"), JSON.stringify(deck, null, 2));
  console.log("PASS", book.id, "→", path.relative(ROOT, output));

  if (!process.argv.includes("--publish-local")) return book.id;

  const jobId = `${book.id}-release-${Date.now()}`;
  const stage = path.join(ROOT, "docs/template-pipeline/admin-dashboard/tmp", jobId);
  const photoDir = path.join(ROOT, "generated-templates/photos/composer", jobId);
  fs.mkdirSync(stage, { recursive: true });
  fs.mkdirSync(photoDir, { recursive: true });
  const staged = JSON.parse(JSON.stringify(deck));
  for (const lid of staged.layoutSequence) {
    for (const e of staged.layouts[lid].elements) {
      const content = e.imageContent || e.maskedImageContent;
      if (!content?.url) continue;
      const name = path.basename(content.url);
      const candidates = [
        path.join(ROOT, "generated-templates", content.url),
        path.join(ROOT, "generated-templates/photos/engine-v1", name),
        path.join(PHOTOS, name),
      ];
      const source = candidates.find((p) => fs.existsSync(p));
      if (!source) throw Error("Missing publish photo " + content.url);
      fs.copyFileSync(source, path.join(photoDir, name));
      content.url = `photos/composer/${jobId}/${name}`;
    }
  }
  fs.writeFileSync(path.join(stage, "deck.json"), JSON.stringify(staged, null, 2));
  for (let i = 1; i <= 6; i++) {
    const padded = "slide-" + String(i).padStart(2, "0") + ".png";
    fs.copyFileSync(path.join(output, padded), path.join(stage, padded));
  }
  fs.copyFileSync(pptxForPublish, path.join(stage, "deck.pptx"));
  const { publishTemplate } = require("../services/templatePipeline/adminCatalog");
  const result = await publishTemplate(jobId);
  const { listCatalog, readCatalog, buildPptx } = require("../services/templatePipeline/catalog");
  if (!listCatalog().some((e: any) => e.id === book.id)) throw Error("Missing catalog " + book.id);
  if (readCatalog(book.id).slides.length !== 6) throw Error("Missing previews " + book.id);
  const download = await buildPptx(book.id);
  if (!download.buffer || download.buffer.length < 1000) throw Error("Empty pptx " + book.id);
  fs.writeFileSync(
    path.join(output, "release.json"),
    JSON.stringify({ ...result, verified: { previews: 6, downloadBytes: download.buffer.length } }, null, 2)
  );
  console.log("Published", book.id);
  return book.id;
}

async function main() {
  const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
  const books = only ? LOOKBOOKS.filter((b) => b.id === only) : LOOKBOOKS;
  if (!books.length) throw Error("No templates matched");
  for (const book of books) await renderAndPublish(book);
  console.log("Done:", books.map((b) => b.id).join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
