/**
 * Build + optionally publish three new lookbook templates:
 *   night-market-dense | harbor-ops-dense | atelier-runway-dense
 *
 *   node -r ts-node/register/transpile-only scripts/generate-lookbook-batch.ts
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
      slots[e.slot] = {
        kind: "text",
        from: e.slot === "title" ? "title" : "items" + String(e.slot).replace("copy", ""),
      };
      if (e.slot.startsWith("copy")) {
        const n = Number(String(e.slot).replace("copy", ""));
        slots[e.slot] = { kind: "text", from: "items" + n };
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
  photos: [string, string, string];
  slides: El[];
  kits: () => { role: string; variant: string }[];
};

const LOOKBOOKS: Lookbook[] = [
  {
    id: "night-market-dense",
    name: "Night Market • Lantern edition",
    description: "Street-food lookbook — charcoal fields, amber accents, menu board and tasting notes.",
    brand: {
      colors: {
        bg: "#161210",
        surface: "#241E1A",
        surface_color: "#2E2620",
        ink: "#F6EFE6",
        muted: "#B7A89A",
        accent: "#FF6B2C",
        line: "#3D332C",
      },
      fonts: { display: "Archivo Black", body: "Arial" },
    },
    photos: ["0288432f0b", "02a4552b25", "03664cda80"],
    slides: [
      { role: "cover", title: "Night Market", items: ["Lantern street", "Open till late"] },
      {
        role: "feature",
        title: "Along the lane",
        items: [
          "Steam and neon",
          "Skewers hit the grill as the first lanterns light. Follow the smoke and you will find the queue that stays longest.",
          "Shared tables",
          "Pull up a stool. Order what the next table is having. The best dishes rarely need a menu.",
        ],
        photoQuery: "0288432f0b",
      },
      {
        role: "feature",
        title: "Tonight’s board",
        items: [
          "Chili oil noodles   6.50",
          "Hand-pulled, tossed hot, finished with peanuts and spring onion.",
          "Charcoal skewer   4.00",
          "Lamb or mushroom. Salt, cumin, a little heat.",
          "Crispy pancake   3.50",
          "Layered dough, sesame, eaten standing up.",
          "Sugarcane tea   2.50",
          "Pressed fresh, served over ice in a tall plastic cup.",
        ],
      },
      {
        role: "feature",
        title: "Hot & loud",
        items: [
          "The wok station",
          "Flame climbs the steel. Garlic hits oil. In thirty seconds the whole lane smells like dinner.",
          "Ask for",
          "Extra chili crisp and one more skewer than you planned.",
        ],
        photoQuery: "02a4552b25",
      },
      {
        role: "feature",
        title: "House heat",
        items: [
          "Chili crisp",
          "Crunch first, then a slow burn that stays friendly.",
          "Cumin salt",
          "The skewer staple. Loud enough to taste through smoke.",
          "Lime finish",
          "A squeeze at the end wakes every fried thing up.",
        ],
        photoQuery: "03664cda80",
      },
      { role: "feature", title: "See you after dark.", items: ["Night Market Collective"] },
    ],
    kits: () => {
      const f = "night-market";
      writeKit("cover", "night-market-masthead", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        rect("bar", 0, 0, 1600, 18, "accent"),
        rect("side", 0, 0, 22, 900, "accent"),
        t("title", 80, 220, 1100, 200, 120, "title", "ink"),
        rect("rule", 80, 450, 180, 6, "accent", 2),
        t("copy0", 80, 490, 900, 80, 48, "copy0", "accent"),
        t("copy1", 80, 780, 700, 50, 26, "copy1", "muted", { textStyleRole: "kicker", fontRole: "label" }),
      ]);
      writeKit(
        "feature",
        "night-market-interior",
        f,
        [
          img("photo", 0, 0, 720, 900),
          rect("panel", 720, 0, 880, 900, "surface"),
          t("title", 780, 70, 740, 120, 72, "title"),
          rect("rule", 780, 210, 140, 5, "accent", 2),
          t("copy0", 780, 250, 720, 55, 34, "copy0", "accent"),
          t("copy1", 780, 320, 720, 200, 30, "copy1", "ink", { lineHeight: 1.28 }),
          rect("line", 780, 545, 720, 2, "line"),
          t("copy2", 780, 580, 720, 55, 34, "copy2", "accent"),
          t("copy3", 780, 655, 720, 180, 28, "copy3", "ink", { lineHeight: 1.28 }),
        ],
        { requiresPhoto: true }
      );
      writeKit("feature", "night-market-menu", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        t("title", 80, 50, 1440, 120, 92, "title", "accent"),
        rect("rule", 80, 185, 160, 5, "accent", 2),
        t("copy0", 80, 240, 680, 65, 44, "copy0"),
        t("copy1", 80, 320, 680, 100, 26, "copy1", "muted", { lineHeight: 1.25 }),
        rect("l1", 80, 440, 680, 2, "line"),
        t("copy2", 840, 240, 680, 65, 44, "copy2"),
        t("copy3", 840, 320, 680, 100, 26, "copy3", "muted", { lineHeight: 1.25 }),
        rect("l2", 840, 440, 680, 2, "line"),
        t("copy4", 80, 490, 680, 65, 44, "copy4"),
        t("copy5", 80, 570, 680, 100, 26, "copy5", "muted", { lineHeight: 1.25 }),
        rect("l3", 80, 690, 680, 2, "line"),
        t("copy6", 840, 490, 680, 65, 44, "copy6"),
        t("copy7", 840, 570, 680, 100, 26, "copy7", "muted", { lineHeight: 1.25 }),
        rect("l4", 840, 690, 680, 2, "line"),
      ]);
      writeKit(
        "feature",
        "night-market-portrait",
        f,
        [
          rect("panel", 0, 0, 740, 900, "bg", 0),
          rect("rail", 0, 0, 18, 900, "accent", 2),
          img("photo", 740, 0, 860, 900),
          t("title", 70, 80, 620, 140, 72, "title", "accent"),
          t("copy0", 70, 260, 600, 60, 36, "copy0"),
          t("copy1", 70, 350, 600, 240, 30, "copy1", "muted", { lineHeight: 1.28 }),
          rect("line", 70, 620, 360, 2, "line"),
          t("copy2", 70, 655, 600, 50, 32, "copy2", "accent"),
          t("copy3", 70, 730, 600, 120, 26, "copy3", "muted", { lineHeight: 1.28 }),
        ],
        { requiresPhoto: true }
      );
      writeKit(
        "feature",
        "night-market-notes",
        f,
        [
          rect("bg", 0, 0, 1600, 900, "bg", 0),
          t("title", 70, 45, 1460, 110, 84, "title", "accent"),
          img("photo", 70, 200, 560, 620),
          t("copy0", 700, 200, 820, 55, 40, "copy0", "accent"),
          t("copy1", 700, 275, 820, 100, 26, "copy1", "muted", { lineHeight: 1.28 }),
          rect("r1", 700, 400, 820, 2, "line"),
          t("copy2", 700, 430, 820, 55, 40, "copy2", "accent"),
          t("copy3", 700, 505, 820, 100, 26, "copy3", "muted", { lineHeight: 1.28 }),
          rect("r2", 700, 630, 820, 2, "line"),
          t("copy4", 700, 660, 820, 55, 40, "copy4", "accent"),
          t("copy5", 700, 735, 820, 100, 26, "copy5", "muted", { lineHeight: 1.28 }),
        ],
        { requiresPhoto: true }
      );
      writeKit("feature", "night-market-closing", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        rect("bar", 0, 850, 1600, 50, "accent"),
        t("title", 100, 320, 1400, 180, 110, "title", "ink", { align: "center" }),
        t("copy0", 300, 560, 1000, 60, 36, "copy0", "accent", { align: "center" }),
      ]);
      return [
        { role: "cover", variant: "night-market-masthead" },
        { role: "feature", variant: "night-market-interior" },
        { role: "feature", variant: "night-market-menu" },
        { role: "feature", variant: "night-market-portrait" },
        { role: "feature", variant: "night-market-notes" },
        { role: "feature", variant: "night-market-closing" },
      ];
    },
  },
  {
    id: "harbor-ops-dense",
    name: "Harbor Ops • Morning brief",
    description: "Logistics briefing deck — cool slate, teal markers, clear ownership and next moves.",
    brand: {
      colors: {
        bg: "#F1F5F7",
        surface: "#DCE8EC",
        surface_color: "#E8F0F3",
        ink: "#0F2A3D",
        muted: "#4A6675",
        accent: "#0D9488",
        line: "#B7CBD2",
      },
      fonts: { display: "Arial", body: "Calibri" },
    },
    photos: ["005c50a2a1", "010f55d65d", "03b756c19e"],
    slides: [
      { role: "cover", title: "Harbor Ops", items: ["Morning brief · Shift 06:00–14:00", "01"] },
      {
        role: "feature",
        title: "On the quay",
        items: [
          "Berth status",
          "Three vessels alongside. Crane two is online. Pilot boat standing by for the 09:40 departure.",
          "Weather window",
          "Wind stays under twelve knots until noon. Keep the outbound schedule tight.",
        ],
        photoQuery: "005c50a2a1",
      },
      {
        role: "feature",
        title: "Priority board",
        items: [
          "Unload bay A   08:15",
          "Container block C12–C18. Confirm seal check before release.",
          "Pilot call   09:10",
          "Outbound tanker. Bridge team briefed; tug assist reserved.",
          "Yard sweep   10:00",
          "Clear empty chassis from lane 4 before the midday inbound.",
          "Gate audit   11:30",
          "Random inspection sample. Log exceptions in the shift report.",
        ],
      },
      {
        role: "feature",
        title: "Signal clear",
        items: [
          "Radio net",
          "Channel 12 for quay. Channel 8 for yard. Keep chatter short when the pilot is on.",
          "Escalation",
          "Anything that slips the weather window goes to the duty superintendent first.",
        ],
        photoQuery: "010f55d65d",
      },
      {
        role: "feature",
        title: "Watch items",
        items: [
          "Crane two",
          "Back online after overnight service. Watch the first three lifts.",
          "Lane 4",
          "Empty chassis stacking is blocking the sweep route.",
          "Tide turn",
          "Outbound window closes at 12:20. No soft delays.",
        ],
        photoQuery: "03b756c19e",
      },
      { role: "feature", title: "Keep the tide.", items: ["Harbor Ops Control"] },
    ],
    kits: () => {
      const f = "harbor-ops";
      writeKit("cover", "harbor-ops-masthead", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        rect("panel", 1040, 0, 560, 900, "ink"),
        rect("mark", 1100, 120, 420, 120, "accent"),
        t("folio", 1120, 140, 380, 90, 64, "copy1", "ink", { textStyleRole: "stat" }),
        t("title", 70, 220, 900, 200, 110, "title"),
        rect("rule", 70, 450, 220, 10, "accent", 2),
        t("copy0", 70, 500, 850, 80, 42, "copy0", "muted"),
      ]);
      writeKit(
        "feature",
        "harbor-ops-interior",
        f,
        [
          img("photo", 0, 0, 680, 900),
          rect("panel", 680, 0, 920, 900, "surface"),
          t("title", 740, 70, 780, 120, 70, "title"),
          rect("rule", 740, 210, 160, 8, "accent", 2),
          t("copy0", 740, 250, 760, 55, 34, "copy0", "accent"),
          t("copy1", 740, 320, 760, 200, 30, "copy1", "ink", { lineHeight: 1.28 }),
          rect("line", 740, 545, 760, 2, "line"),
          t("copy2", 740, 580, 760, 55, 34, "copy2", "accent"),
          t("copy3", 740, 655, 760, 180, 28, "copy3", "ink", { lineHeight: 1.28 }),
        ],
        { requiresPhoto: true }
      );
      writeKit("feature", "harbor-ops-menu", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        t("title", 70, 45, 1460, 110, 88, "title"),
        rect("rule", 70, 175, 200, 8, "accent", 2),
        t("copy0", 70, 230, 700, 60, 40, "copy0", "accent"),
        t("copy1", 70, 305, 700, 100, 26, "copy1", "ink", { lineHeight: 1.25 }),
        rect("l1", 70, 425, 700, 2, "line"),
        t("copy2", 830, 230, 700, 60, 40, "copy2", "accent"),
        t("copy3", 830, 305, 700, 100, 26, "copy3", "ink", { lineHeight: 1.25 }),
        rect("l2", 830, 425, 700, 2, "line"),
        t("copy4", 70, 470, 700, 60, 40, "copy4", "accent"),
        t("copy5", 70, 545, 700, 100, 26, "copy5", "ink", { lineHeight: 1.25 }),
        rect("l3", 70, 665, 700, 2, "line"),
        t("copy6", 830, 470, 700, 60, 40, "copy6", "accent"),
        t("copy7", 830, 545, 700, 100, 26, "copy7", "ink", { lineHeight: 1.25 }),
        rect("l4", 830, 665, 700, 2, "line"),
      ]);
      writeKit(
        "feature",
        "harbor-ops-portrait",
        f,
        [
          rect("panel", 0, 0, 760, 900, "ink", 0),
          img("photo", 760, 0, 840, 900),
          t("title", 70, 90, 640, 150, 72, "title", "bg"),
          t("copy0", 70, 290, 620, 60, 34, "copy0", "accent"),
          t("copy1", 70, 370, 620, 240, 28, "copy1", "bg", { lineHeight: 1.28 }),
          rect("line", 70, 640, 400, 3, "accent"),
          t("copy2", 70, 675, 620, 50, 30, "copy2", "accent"),
          t("copy3", 70, 745, 620, 110, 26, "copy3", "bg", { lineHeight: 1.28 }),
        ],
        { requiresPhoto: true }
      );
      writeKit(
        "feature",
        "harbor-ops-notes",
        f,
        [
          rect("bg", 0, 0, 1600, 900, "bg", 0),
          t("title", 70, 40, 1460, 110, 82, "title"),
          img("photo", 70, 190, 540, 620),
          t("copy0", 680, 190, 840, 55, 38, "copy0", "accent"),
          t("copy1", 680, 260, 840, 110, 26, "copy1", "ink", { lineHeight: 1.28 }),
          rect("r1", 680, 395, 840, 2, "line"),
          t("copy2", 680, 425, 840, 55, 38, "copy2", "accent"),
          t("copy3", 680, 495, 840, 110, 26, "copy3", "ink", { lineHeight: 1.28 }),
          rect("r2", 680, 630, 840, 2, "line"),
          t("copy4", 680, 660, 840, 55, 38, "copy4", "accent"),
          t("copy5", 680, 730, 840, 110, 26, "copy5", "ink", { lineHeight: 1.28 }),
        ],
        { requiresPhoto: true }
      );
      writeKit("feature", "harbor-ops-closing", f, [
        rect("bg", 0, 0, 1600, 900, "ink", 0),
        rect("mark", 0, 780, 1600, 120, "accent"),
        t("title", 90, 280, 1420, 180, 100, "title", "bg"),
        t("copy0", 90, 820, 1420, 55, 34, "copy0", "ink"),
      ]);
      return [
        { role: "cover", variant: "harbor-ops-masthead" },
        { role: "feature", variant: "harbor-ops-interior" },
        { role: "feature", variant: "harbor-ops-menu" },
        { role: "feature", variant: "harbor-ops-portrait" },
        { role: "feature", variant: "harbor-ops-notes" },
        { role: "feature", variant: "harbor-ops-closing" },
      ];
    },
  },
  {
    id: "atelier-runway-dense",
    name: "Atelier Runway • Season look",
    description: "Fashion lookbook — ivory paper, oxblood accents, serif statements and quiet notes.",
    brand: {
      colors: {
        bg: "#F6F1E8",
        surface: "#EFE7DA",
        surface_color: "#E8DECE",
        ink: "#1A1512",
        muted: "#5C5147",
        accent: "#7B2D26",
        line: "#D8CBB6",
      },
      fonts: { display: "Georgia", body: "Calibri" },
    },
    photos: ["0d31bc91f0", "01bd4afba9", "00dc682cdd"],
    slides: [
      { role: "cover", title: "Atelier Runway", items: ["Season look · Private showing", "01"] },
      {
        role: "feature",
        title: "The fitting room",
        items: [
          "First pass",
          "Cloth on the stand before coffee. Pins mark where the shoulder wants to sit and where the hem should fall.",
          "Quiet notes",
          "We keep the lighting soft and the talk shorter than the fabric. The garment decides the pace.",
        ],
        photoQuery: "0d31bc91f0",
      },
      {
        role: "feature",
        title: "The line",
        items: [
          "Ivory coat   look 01",
          "Double-faced wool. Clean collar. A belt that almost disappears.",
          "Oxblood dress   look 02",
          "Bias cut. No decoration. Movement does the work.",
          "Ink trousers   look 03",
          "High rise, soft crease, worn with a white shirt left open.",
          "Stone cape   look 04",
          "One piece of boiled wool. Held at the shoulder with a single clasp.",
        ],
      },
      {
        role: "feature",
        title: "Cloth & light",
        items: [
          "Daylight test",
          "Every look walks the courtyard once. If the colour dies in sun, it leaves the line.",
          "From the atelier",
          "We photograph on paper, never on a screen. The print is the proof.",
        ],
        photoQuery: "01bd4afba9",
      },
      {
        role: "feature",
        title: "Material notes",
        items: [
          "Wool",
          "Heavy enough to hold a line, soft enough to move with the body.",
          "Silk",
          "Used sparingly. A lining, a bias panel, never the whole story.",
          "Hardware",
          "Brass that ages. No shine that competes with the cloth.",
        ],
        photoQuery: "00dc682cdd",
      },
      { role: "feature", title: "Until next season.", items: ["Atelier Runway"] },
    ],
    kits: () => {
      const f = "atelier-runway";
      writeKit("cover", "atelier-runway-masthead", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        rect("side", 0, 0, 420, 900, "accent"),
        t("folio", 60, 80, 300, 160, 110, "copy1", "bg", { textStyleRole: "stat" }),
        t("title", 500, 220, 1000, 220, 100, "title"),
        rect("rule", 500, 470, 180, 4, "accent", 2),
        t("copy0", 500, 510, 900, 70, 40, "copy0", "muted"),
      ]);
      writeKit(
        "feature",
        "atelier-runway-interior",
        f,
        [
          img("photo", 0, 0, 700, 900),
          rect("panel", 700, 0, 900, 900, "surface"),
          t("title", 760, 80, 760, 130, 68, "title"),
          rect("rule", 760, 230, 120, 3, "accent", 2),
          t("copy0", 760, 270, 740, 50, 32, "copy0", "accent"),
          t("copy1", 760, 340, 740, 200, 28, "copy1", "ink", { lineHeight: 1.3 }),
          rect("line", 760, 570, 740, 2, "line"),
          t("copy2", 760, 610, 740, 50, 32, "copy2", "accent"),
          t("copy3", 760, 680, 740, 160, 26, "copy3", "ink", { lineHeight: 1.3 }),
        ],
        { requiresPhoto: true }
      );
      writeKit("feature", "atelier-runway-menu", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        t("title", 80, 50, 1440, 120, 90, "title"),
        rect("rule", 80, 190, 140, 3, "accent", 2),
        t("copy0", 80, 240, 680, 60, 40, "copy0", "accent"),
        t("copy1", 80, 315, 680, 100, 26, "copy1", "ink", { lineHeight: 1.28 }),
        rect("l1", 80, 435, 680, 1, "line"),
        t("copy2", 840, 240, 680, 60, 40, "copy2", "accent"),
        t("copy3", 840, 315, 680, 100, 26, "copy3", "ink", { lineHeight: 1.28 }),
        rect("l2", 840, 435, 680, 1, "line"),
        t("copy4", 80, 480, 680, 60, 40, "copy4", "accent"),
        t("copy5", 80, 555, 680, 100, 26, "copy5", "ink", { lineHeight: 1.28 }),
        rect("l3", 80, 675, 680, 1, "line"),
        t("copy6", 840, 480, 680, 60, 40, "copy6", "accent"),
        t("copy7", 840, 555, 680, 100, 26, "copy7", "ink", { lineHeight: 1.28 }),
        rect("l4", 840, 675, 680, 1, "line"),
      ]);
      writeKit(
        "feature",
        "atelier-runway-portrait",
        f,
        [
          rect("panel", 0, 0, 720, 900, "bg", 0),
          img("photo", 720, 0, 880, 900),
          t("title", 70, 90, 600, 150, 68, "title", "accent"),
          t("copy0", 70, 280, 580, 55, 34, "copy0"),
          t("copy1", 70, 360, 580, 230, 28, "copy1", "muted", { lineHeight: 1.3 }),
          rect("line", 70, 620, 280, 2, "line"),
          t("copy2", 70, 655, 580, 50, 30, "copy2", "accent"),
          t("copy3", 70, 730, 580, 120, 26, "copy3", "muted", { lineHeight: 1.3 }),
        ],
        { requiresPhoto: true }
      );
      writeKit(
        "feature",
        "atelier-runway-notes",
        f,
        [
          rect("bg", 0, 0, 1600, 900, "bg", 0),
          t("title", 70, 45, 1460, 110, 80, "title"),
          img("photo", 70, 200, 560, 620),
          t("copy0", 700, 200, 820, 55, 38, "copy0", "accent"),
          t("copy1", 700, 275, 820, 100, 26, "copy1", "muted", { lineHeight: 1.3 }),
          rect("r1", 700, 400, 820, 1, "line"),
          t("copy2", 700, 430, 820, 55, 38, "copy2", "accent"),
          t("copy3", 700, 505, 820, 100, 26, "copy3", "muted", { lineHeight: 1.3 }),
          rect("r2", 700, 630, 820, 1, "line"),
          t("copy4", 700, 660, 820, 55, 38, "copy4", "accent"),
          t("copy5", 700, 735, 820, 100, 26, "copy5", "muted", { lineHeight: 1.3 }),
        ],
        { requiresPhoto: true }
      );
      writeKit("feature", "atelier-runway-closing", f, [
        rect("bg", 0, 0, 1600, 900, "accent", 0),
        t("title", 100, 300, 1400, 180, 96, "title", "bg", { align: "center" }),
        t("copy0", 400, 560, 800, 55, 32, "copy0", "bg", { align: "center" }),
      ]);
      return [
        { role: "cover", variant: "atelier-runway-masthead" },
        { role: "feature", variant: "atelier-runway-interior" },
        { role: "feature", variant: "atelier-runway-menu" },
        { role: "feature", variant: "atelier-runway-portrait" },
        { role: "feature", variant: "atelier-runway-notes" },
        { role: "feature", variant: "atelier-runway-closing" },
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
      style: { palette: "ink-night", typePair: "modern-segoe", motif: "bar-accent", family: book.id.replace(/-dense$/, "") },
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
  if (!books.length) throw Error("No lookbooks matched");
  for (const book of books) await renderAndPublish(book);
  console.log("Done:", books.map((b) => b.id).join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
