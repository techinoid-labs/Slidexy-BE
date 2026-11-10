/**
 * Second lookbook batch — structurally distinct from night-market / harbor / atelier:
 *   arcade-signal-dense | pantry-counter-dense | softbox-studio-dense
 *
 *   node -r ts-node/register/transpile-only scripts/generate-lookbook-batch-2.ts
 *   … --publish-local
 *   … --only=arcade-signal-dense
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
  letterSpacing: extras.letterSpacing != null ? extras.letterSpacing : slot === "title" ? 0 : 0,
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
    id: "arcade-signal-dense",
    name: "Arcade Signal • Late session",
    description: "Esports lounge lookbook — ink field, neon magenta, letterbox photo and playlist board.",
    brand: {
      colors: {
        bg: "#0B0B12",
        surface: "#161622",
        surface_color: "#1E1E2C",
        ink: "#F4F0FF",
        muted: "#9B95B0",
        accent: "#FF3D81",
        line: "#2C2C3C",
      },
      fonts: { display: "Archivo Black", body: "Arial" },
    },
    photos: ["08de969478", "0b7195874a", "01f3884069"],
    slides: [
      { role: "cover", title: "Arcade Signal", items: ["Late session · Floor B", "88"] },
      {
        role: "feature",
        title: "On the floor",
        items: [
          "Couch queue",
          "Controllers warm up first. The arcade cabinet keeps score while the back row watches the draft.",
          "Desk lane",
          "Four stations, matched chairs, one rule: winner stays, loser buys the next round of drinks.",
        ],
        photoQuery: "08de969478",
      },
      {
        role: "feature",
        title: "Tonight’s playlist",
        items: [
          "Warm-up lobby   19:00",
          "Free play and seat claims. Bring your own headset if you care about callouts.",
          "Squad draft   19:40",
          "Random teams for the first bracket. Captains pick last.",
          "Main bracket   20:15",
          "Best of three. Losers drop to the side board.",
          "Afterglow   22:00",
          "Arcade tokens, soft drinks, and the highlight reel on the wall.",
        ],
      },
      {
        role: "feature",
        title: "Signal check",
        items: [
          "House rules",
          "No rage-quits. Pause only for hardware. Keep drinks off the mousepads.",
          "Host note",
          "If the neon strip flickers, leave it. That is part of the room now.",
        ],
        photoQuery: "0b7195874a",
      },
      {
        role: "feature",
        title: "Kit list",
        items: [
          "Pads",
          "Wired controllers preferred. Wireless only if the battery is full.",
          "Audio",
          "Shared chat on channel 3. Mute when you are not in the match.",
          "Seats",
          "Racing chairs for desk lane. Couch for spectators and co-op.",
        ],
        photoQuery: "01f3884069",
      },
      { role: "feature", title: "Stay for one more.", items: ["Arcade Signal Collective"] },
    ],
    kits: () => {
      const f = "arcade-signal";
      // Cover: huge folio left + stacked title mid — not a top bar masthead.
      writeKit("cover", "arcade-signal-masthead", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        rect("glow", 0, 0, 28, 900, "accent"),
        t("folio", 90, 80, 520, 280, 220, "copy1", "accent", { textStyleRole: "stat", letterSpacing: -4 }),
        t("title", 90, 420, 1200, 200, 96, "title"),
        rect("rule", 90, 650, 220, 8, "accent", 2),
        t("copy0", 90, 690, 1000, 70, 36, "copy0", "muted"),
      ]);
      // Letterbox photo band through the middle.
      writeKit(
        "feature",
        "arcade-signal-letterbox",
        f,
        [
          rect("bg", 0, 0, 1600, 900, "bg", 0),
          t("title", 70, 40, 1460, 100, 72, "title", "accent"),
          img("photo", 0, 160, 1600, 420),
          t("copy0", 70, 610, 700, 50, 32, "copy0", "accent"),
          t("copy1", 70, 670, 700, 180, 26, "copy1", "muted", { lineHeight: 1.28 }),
          t("copy2", 840, 610, 700, 50, 32, "copy2", "accent"),
          t("copy3", 840, 670, 700, 180, 26, "copy3", "muted", { lineHeight: 1.28 }),
        ],
        { requiresPhoto: true }
      );
      // Single-column schedule with time rail (not 2×2 menu).
      writeKit("feature", "arcade-signal-playlist", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        rect("rail", 0, 0, 220, 900, "surface"),
        rect("tick", 0, 0, 16, 900, "accent", 2),
        t("title", 280, 40, 1240, 90, 72, "title", "accent"),
        t("copy0", 280, 160, 1240, 55, 40, "copy0"),
        t("copy1", 280, 225, 1240, 70, 26, "copy1", "muted", { lineHeight: 1.25 }),
        rect("l1", 280, 310, 1240, 2, "line"),
        t("copy2", 280, 340, 1240, 55, 40, "copy2"),
        t("copy3", 280, 405, 1240, 70, 26, "copy3", "muted", { lineHeight: 1.25 }),
        rect("l2", 280, 490, 1240, 2, "line"),
        t("copy4", 280, 520, 1240, 55, 40, "copy4"),
        t("copy5", 280, 585, 1240, 70, 26, "copy5", "muted", { lineHeight: 1.25 }),
        rect("l3", 280, 670, 1240, 2, "line"),
        t("copy6", 280, 700, 1240, 55, 40, "copy6"),
        t("copy7", 280, 765, 1240, 70, 26, "copy7", "muted", { lineHeight: 1.25 }),
      ]);
      // Full-bleed photo with bottom caption strip.
      writeKit(
        "feature",
        "arcade-signal-strip",
        f,
        [
          img("photo", 0, 0, 1600, 900),
          rect("scrim", 0, 560, 1600, 340, "bg", 2),
          rect("bar", 0, 560, 1600, 10, "accent", 3),
          t("title", 70, 590, 1460, 100, 68, "title", "accent"),
          t("copy0", 70, 710, 700, 45, 30, "copy0"),
          t("copy1", 70, 765, 700, 100, 24, "copy1", "muted", { lineHeight: 1.25 }),
          t("copy2", 840, 710, 700, 45, 30, "copy2", "accent"),
          t("copy3", 840, 765, 700, 100, 24, "copy3", "muted", { lineHeight: 1.25 }),
        ],
        { requiresPhoto: true }
      );
      // Numbered vertical stack + portrait photo right.
      writeKit(
        "feature",
        "arcade-signal-kit",
        f,
        [
          rect("bg", 0, 0, 1600, 900, "bg", 0),
          t("title", 70, 50, 820, 110, 78, "title", "accent"),
          t("copy0", 70, 200, 820, 50, 36, "copy0"),
          t("copy1", 70, 265, 820, 110, 26, "copy1", "muted", { lineHeight: 1.28 }),
          rect("r1", 70, 400, 820, 2, "line"),
          t("copy2", 70, 430, 820, 50, 36, "copy2"),
          t("copy3", 70, 495, 820, 110, 26, "copy3", "muted", { lineHeight: 1.28 }),
          rect("r2", 70, 630, 820, 2, "line"),
          t("copy4", 70, 660, 820, 50, 36, "copy4"),
          t("copy5", 70, 725, 820, 110, 26, "copy5", "muted", { lineHeight: 1.28 }),
          img("photo", 960, 0, 640, 900),
        ],
        { requiresPhoto: true }
      );
      writeKit("feature", "arcade-signal-closing", f, [
        rect("bg", 0, 0, 1600, 900, "surface", 0),
        rect("mark", 0, 0, 1600, 24, "accent"),
        t("title", 100, 320, 1400, 180, 96, "title", "ink", { align: "center" }),
        t("copy0", 300, 560, 1000, 60, 34, "copy0", "accent", { align: "center" }),
      ]);
      return [
        { role: "cover", variant: "arcade-signal-masthead" },
        { role: "feature", variant: "arcade-signal-letterbox" },
        { role: "feature", variant: "arcade-signal-playlist" },
        { role: "feature", variant: "arcade-signal-strip" },
        { role: "feature", variant: "arcade-signal-kit" },
        { role: "feature", variant: "arcade-signal-closing" },
      ];
    },
  },
  {
    id: "pantry-counter-dense",
    name: "Pantry Counter • Morning service",
    description: "Cafe pantry lookbook — green tile, warm wood, shelf grid and service board.",
    brand: {
      colors: {
        bg: "#F3EDE3",
        surface: "#E4D9C8",
        surface_color: "#EBE2D4",
        ink: "#1F2A24",
        muted: "#5C6B62",
        accent: "#2F6B4F",
        line: "#C9BBA6",
      },
      fonts: { display: "Georgia", body: "Calibri" },
    },
    photos: ["092c8c1420", "0affe30f6e", "0506d14bb9"],
    slides: [
      { role: "cover", title: "Pantry Counter", items: ["Morning service · Open 7–2", "07"] },
      {
        role: "feature",
        title: "Behind the glass",
        items: [
          "Shelf order",
          "Jars high, glassware mid, bowls low. Everything faces the window so the street can read the shelf.",
          "First pull",
          "Grind for the first six drinks before the door unlocks. The machine likes a warm start.",
        ],
        photoQuery: "092c8c1420",
      },
      {
        role: "feature",
        title: "Counter board",
        items: [
          "Filter pour   3.50",
          "Single origin. Served in ceramic, never in paper before noon.",
          "Oat latte   4.20",
          "Two pulls, soft foam, a little cinnamon if asked.",
          "Seed loaf   3.00",
          "Toasted thick. Butter on the side. Jam only on request.",
          "Citrus bun   3.80",
          "Orange peel glaze. Best while still warm from the tray.",
        ],
      },
      {
        role: "feature",
        title: "Hands on the cup",
        items: [
          "Takeaway line",
          "Name on the cup, lid stack ready, stir sticks in the black pot. Keep the glass case clear of elbows.",
          "Stay a while",
          "The window seats are for people who read. The counter is for people who talk to the barista.",
        ],
        photoQuery: "0affe30f6e",
      },
      {
        role: "feature",
        title: "House notes",
        items: [
          "Beans",
          "Roasted mid-week. We finish a bag before we open the next.",
          "Milk",
          "Whole by default. Oat and almond without a surcharge.",
          "Quiet hour",
          "From opening until nine the playlist stays instrumental.",
        ],
        photoQuery: "0506d14bb9",
      },
      { role: "feature", title: "Come back thirsty.", items: ["Pantry Counter"] },
    ],
    kits: () => {
      const f = "pantry-counter";
      // Cover: top kicker strip + title left + stacked color swatches right.
      writeKit("cover", "pantry-counter-masthead", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        rect("top", 0, 0, 1600, 90, "accent"),
        t("copy1", 70, 22, 900, 50, 28, "copy1", "bg", { textStyleRole: "kicker", fontRole: "label" }),
        t("title", 70, 220, 980, 280, 108, "title"),
        rect("sw1", 1180, 200, 320, 160, "accent"),
        rect("sw2", 1180, 380, 320, 160, "ink"),
        rect("sw3", 1180, 560, 320, 160, "surface"),
        t("copy0", 70, 560, 900, 80, 40, "copy0", "muted"),
      ]);
      // Photo on top half; text band below (horizontal split, not side panel).
      writeKit(
        "feature",
        "pantry-counter-shelf",
        f,
        [
          img("photo", 0, 0, 1600, 480),
          rect("panel", 0, 480, 1600, 420, "bg", 2),
          t("title", 70, 510, 1460, 90, 64, "title"),
          t("copy0", 70, 620, 700, 45, 30, "copy0", "accent"),
          t("copy1", 70, 675, 700, 180, 26, "copy1", { lineHeight: 1.28 }),
          t("copy2", 840, 620, 700, 45, 30, "copy2", "accent"),
          t("copy3", 840, 675, 700, 180, 26, "copy3", { lineHeight: 1.28 }),
        ],
        { requiresPhoto: true }
      );
      // Three-column service cards.
      writeKit("feature", "pantry-counter-board", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        t("title", 70, 45, 1460, 100, 80, "title"),
        rect("rule", 70, 160, 160, 4, "accent", 2),
        rect("c1", 70, 210, 470, 620, "surface"),
        t("copy0", 100, 250, 410, 90, 36, "copy0", "accent"),
        t("copy1", 100, 360, 410, 400, 26, "copy1", { lineHeight: 1.3 }),
        rect("c2", 565, 210, 470, 620, "surface"),
        t("copy2", 595, 250, 410, 90, 36, "copy2", "accent"),
        t("copy3", 595, 360, 410, 400, 26, "copy3", { lineHeight: 1.3 }),
        rect("c3", 1060, 210, 470, 620, "surface"),
        t("copy4", 1090, 250, 410, 90, 36, "copy4", "accent"),
        t("copy5", 1090, 360, 410, 220, 26, "copy5", { lineHeight: 1.3 }),
        t("copy6", 1090, 600, 410, 70, 32, "copy6", "accent"),
        t("copy7", 1090, 680, 410, 120, 24, "copy7", { lineHeight: 1.28 }),
      ]);
      // Photo left 55%, quiet text right (cafe hands).
      writeKit(
        "feature",
        "pantry-counter-hands",
        f,
        [
          img("photo", 0, 0, 880, 900),
          rect("panel", 880, 0, 720, 900, "surface"),
          t("title", 940, 80, 600, 140, 64, "title"),
          rect("rule", 940, 250, 120, 4, "accent", 2),
          t("copy0", 940, 290, 580, 50, 32, "copy0", "accent"),
          t("copy1", 940, 360, 580, 200, 26, "copy1", { lineHeight: 1.3 }),
          rect("line", 940, 590, 580, 2, "line"),
          t("copy2", 940, 630, 580, 50, 32, "copy2", "accent"),
          t("copy3", 940, 700, 580, 150, 26, "copy3", { lineHeight: 1.3 }),
        ],
        { requiresPhoto: true }
      );
      // Notes with photo as a small inset bottom-right.
      writeKit(
        "feature",
        "pantry-counter-notes",
        f,
        [
          rect("bg", 0, 0, 1600, 900, "bg", 0),
          t("title", 70, 50, 1000, 110, 78, "title"),
          t("copy0", 70, 200, 900, 55, 38, "copy0", "accent"),
          t("copy1", 70, 270, 900, 100, 26, "copy1", "muted", { lineHeight: 1.28 }),
          rect("r1", 70, 400, 900, 2, "line"),
          t("copy2", 70, 430, 900, 55, 38, "copy2", "accent"),
          t("copy3", 70, 500, 900, 100, 26, "copy3", "muted", { lineHeight: 1.28 }),
          rect("r2", 70, 630, 900, 2, "line"),
          t("copy4", 70, 660, 900, 55, 38, "copy4", "accent"),
          t("copy5", 70, 730, 900, 100, 26, "copy5", "muted", { lineHeight: 1.28 }),
          img("photo", 1060, 280, 470, 540),
        ],
        { requiresPhoto: true }
      );
      writeKit("feature", "pantry-counter-closing", f, [
        rect("bg", 0, 0, 1600, 900, "accent", 0),
        t("title", 100, 300, 1400, 180, 92, "title", "bg", { align: "center" }),
        t("copy0", 400, 560, 800, 55, 34, "copy0", "bg", { align: "center" }),
      ]);
      return [
        { role: "cover", variant: "pantry-counter-masthead" },
        { role: "feature", variant: "pantry-counter-shelf" },
        { role: "feature", variant: "pantry-counter-board" },
        { role: "feature", variant: "pantry-counter-hands" },
        { role: "feature", variant: "pantry-counter-notes" },
        { role: "feature", variant: "pantry-counter-closing" },
      ];
    },
  },
  {
    id: "softbox-studio-dense",
    name: "Softbox Studio • Set notes",
    description: "Production studio lookbook — charcoal, warm gel light, call sheet and kit notes.",
    brand: {
      colors: {
        bg: "#141210",
        surface: "#221E1B",
        surface_color: "#2C2723",
        ink: "#F3EDE6",
        muted: "#A89A8E",
        accent: "#E8A05C",
        line: "#3A322C",
      },
      fonts: { display: "Arial", body: "Calibri" },
    },
    photos: ["07c71ad452", "0aaf07e051", "01bdf201e1"],
    slides: [
      { role: "cover", title: "Softbox Studio", items: ["Set notes · Day 02", "02"] },
      {
        role: "feature",
        title: "On set",
        items: [
          "Key light",
          "Nanlite softbox camera-left. Keep the curtain deep red and out of specular highlights.",
          "Fill pass",
          "Panel on low power camera-right. We want cheek light, not a second sun.",
        ],
        photoQuery: "07c71ad452",
      },
      {
        role: "feature",
        title: "Call sheet",
        items: [
          "08:00   Grip load-in",
          "Softboxes, stands, and the wood riser for the desk insert.",
          "09:30   Talent ready",
          "Wardrobe black. Headphones as prop only for the first three frames.",
          "11:00   Desk insert",
          "Monitor shows a real timeline. No fake UI. Plant stays in frame left.",
          "14:00   Portrait wall",
          "Neutral gray. Soft smile. Keep the vignette honest.",
        ],
      },
      {
        role: "feature",
        title: "Edit bay",
        items: [
          "Color pass",
          "Warm wood and orange keys stay. Push shadows toward charcoal, not blue.",
          "Delivery",
          "Export stills at slide size. Motion tests wait until the stills are approved.",
        ],
        photoQuery: "0aaf07e051",
      },
      {
        role: "feature",
        title: "Talent notes",
        items: [
          "Wardrobe",
          "Matte black layers. No logos. Texture over shine.",
          "Expression",
          "Quiet confidence. Eyes to lens. Soft smile only.",
          "Hands",
          "Rest natural. If holding a prop, keep knuckles relaxed.",
        ],
        photoQuery: "01bdf201e1",
      },
      { role: "feature", title: "Wrap when it is right.", items: ["Softbox Studio"] },
    ],
    kits: () => {
      const f = "softbox-studio";
      // Cover: bottom-heavy title band under a tall empty field (stage feel).
      writeKit("cover", "softbox-studio-masthead", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        rect("gel", 1320, 0, 280, 900, "accent"),
        t("copy1", 70, 70, 400, 80, 64, "copy1", "accent", { textStyleRole: "stat" }),
        t("title", 70, 520, 1180, 180, 100, "title"),
        rect("rule", 70, 730, 200, 6, "accent", 2),
        t("copy0", 70, 770, 1000, 60, 34, "copy0", "muted"),
      ]);
      // Narrow text column left, tall photo right.
      writeKit(
        "feature",
        "softbox-studio-onset",
        f,
        [
          rect("panel", 0, 0, 560, 900, "surface", 0),
          t("title", 50, 70, 460, 160, 64, "title", "accent"),
          t("copy0", 50, 280, 460, 50, 30, "copy0"),
          t("copy1", 50, 350, 460, 200, 26, "copy1", "muted", { lineHeight: 1.3 }),
          rect("line", 50, 580, 300, 2, "line"),
          t("copy2", 50, 620, 460, 50, 30, "copy2", "accent"),
          t("copy3", 50, 690, 460, 160, 26, "copy3", "muted", { lineHeight: 1.3 }),
          img("photo", 560, 0, 1040, 900),
        ],
        { requiresPhoto: true }
      );
      // Timeline: time column + description (call sheet).
      writeKit("feature", "softbox-studio-callsheet", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        t("title", 70, 40, 1460, 100, 78, "title", "accent"),
        rect("rule", 70, 155, 180, 5, "accent", 2),
        t("copy0", 70, 200, 420, 55, 34, "copy0"),
        t("copy1", 520, 200, 1000, 90, 28, "copy1", "muted", { lineHeight: 1.25 }),
        rect("l1", 70, 310, 1460, 2, "line"),
        t("copy2", 70, 340, 420, 55, 34, "copy2"),
        t("copy3", 520, 340, 1000, 90, 28, "copy3", "muted", { lineHeight: 1.25 }),
        rect("l2", 70, 450, 1460, 2, "line"),
        t("copy4", 70, 480, 420, 55, 34, "copy4"),
        t("copy5", 520, 480, 1000, 90, 28, "copy5", "muted", { lineHeight: 1.25 }),
        rect("l3", 70, 590, 1460, 2, "line"),
        t("copy6", 70, 620, 420, 55, 34, "copy6"),
        t("copy7", 520, 620, 1000, 90, 28, "copy7", "muted", { lineHeight: 1.25 }),
      ]);
      // Photo left, dark quote-style panel right.
      writeKit(
        "feature",
        "softbox-studio-editbay",
        f,
        [
          img("photo", 0, 0, 900, 900),
          rect("panel", 900, 0, 700, 900, "ink", 2),
          t("title", 960, 90, 580, 140, 60, "title", "accent"),
          t("copy0", 960, 280, 580, 50, 30, "copy0", "accent"),
          t("copy1", 960, 350, 580, 200, 28, "copy1", "bg", { lineHeight: 1.3 }),
          rect("line", 960, 580, 400, 3, "accent"),
          t("copy2", 960, 620, 580, 50, 30, "copy2", "accent"),
          t("copy3", 960, 690, 580, 150, 26, "copy3", "bg", { lineHeight: 1.3 }),
        ],
        { requiresPhoto: true }
      );
      // 2×2 notes with centered portrait.
      writeKit(
        "feature",
        "softbox-studio-talent",
        f,
        [
          rect("bg", 0, 0, 1600, 900, "bg", 0),
          t("title", 70, 40, 1460, 90, 72, "title", "accent"),
          img("photo", 560, 160, 480, 620),
          t("copy0", 70, 180, 450, 50, 34, "copy0"),
          t("copy1", 70, 250, 450, 160, 26, "copy1", "muted", { lineHeight: 1.28 }),
          t("copy2", 70, 480, 450, 50, 34, "copy2"),
          t("copy3", 70, 550, 450, 160, 26, "copy3", "muted", { lineHeight: 1.28 }),
          t("copy4", 1080, 180, 450, 50, 34, "copy4"),
          t("copy5", 1080, 250, 450, 160, 26, "copy5", "muted", { lineHeight: 1.28 }),
        ],
        { requiresPhoto: true }
      );
      writeKit("feature", "softbox-studio-closing", f, [
        rect("bg", 0, 0, 1600, 900, "bg", 0),
        rect("bar", 0, 820, 1600, 80, "accent"),
        t("title", 90, 300, 1420, 180, 92, "title"),
        t("copy0", 90, 845, 1420, 40, 28, "copy0", "ink"),
      ]);
      return [
        { role: "cover", variant: "softbox-studio-masthead" },
        { role: "feature", variant: "softbox-studio-onset" },
        { role: "feature", variant: "softbox-studio-callsheet" },
        { role: "feature", variant: "softbox-studio-editbay" },
        { role: "feature", variant: "softbox-studio-talent" },
        { role: "feature", variant: "softbox-studio-closing" },
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
  if (!books.length) throw Error("No lookbooks matched");
  for (const book of books) await renderAndPublish(book);
  console.log("Done:", books.map((b) => b.id).join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
