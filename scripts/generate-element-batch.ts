/**
 * Element-first creative templates — each family owns one signature object
 * and a set of unique graphic elements that never appear in other families.
 *
 *   gridlock-radio   — pit-lane radio plate; compound pills, sector deltas, pit light
 *   lantern-counter  — glowing cafe window; mosaic tile strip, taped notes, OPEN neon
 *   grade-suite      — color-grade desk; RGB waveforms, color wheels, node chain, timeline
 *   hearth-folio     — fireplace surround; tile stack, room folio cards, ember close
 *
 *   node -r ts-node/register/transpile-only scripts/generate-element-batch.ts [--publish-local] [--only=id]
 */
import { Template, text, rect, circle, photo, writeKit, runTemplates, El } from "./lib/designKit";
import { waveform, colorWheels, nodeChain, neonBadge, assertUniqueSel, familySel } from "./lib/sel";

const serif = { fontWeight: 400 };
const display = { textStyleRole: "display", fontRole: "display" };
const kicker = { textStyleRole: "kicker", fontRole: "label" };
const stat = { textStyleRole: "stat", fontRole: "display" };
/** Morph/camera-pan retired — keep ambient until a stronger motion system lands. */
const FLAGSHIP_MOTION = {
  morph: false,
  ambient: true,
  cameraPan: false,
  scatter: false,
  defaultTransition: "fade" as const,
  durationMs: 800,
};

const gridlock: Template = {
  id: "gridlock-radio",
  name: "Gridlock • Radio",
  description: "Pit-lane deck — radio call plate cover, tire compound pills, sector deltas and a pit-light close.",
  family: "gridlock",
  motion: FLAGSHIP_MOTION,
  brand: {
    colors: {
      bg: "#070B14",
      surface: "#121826",
      surface_color: "#1B2436",
      ink: "#F4F6FA",
      muted: "#8B93A7",
      accent: "#FFCC00",
      line: "#2A3348",
    },
    fonts: { display: "Antonio", body: "Space Grotesk" },
  },
  slides: [
    {
      role: "cover",
      title: "GRID **LOCK**",
      items: ["Team radio · Lap 38", "BOX BOX", "P2"],
      photoQuery: "334783120c",
    },
    {
      role: "feature",
      title: "Compounds",
      items: ["SOFT", "12 laps", "MEDIUM", "28 laps", "HARD", "40 laps", "INTER", "wet only"],
    },
    {
      role: "feature",
      title: "Sectors",
      items: ["S1", "-0.12", "S2", "+0.08", "S3", "-0.21", "LAP", "-0.25"],
    },
    {
      role: "feature",
      title: "Pit wall",
      items: ["Fuel", "On target", "Wing", "Minus 1", "Brake", "Cooling", "Mode", "Push"],
      photoQuery: "334783120c",
    },
    {
      role: "feature",
      title: "Box this lap.",
      items: ["— Race engineer"],
      photoQuery: "334783120c",
    },
    {
      role: "closing",
      title: "Lights out.",
      items: ["Gridlock Radio · pit wall"],
    },
  ],
  kits: () => {
    const f = "gridlock";
    const kits = [];

    kits.push(
      writeKit("cover", "gridlock-call", f, [
        photo("photo", 0, 0, 1600, 900, { morphId: "hero" }),
        rect("scrim", 0, 0, 1600, 900, "bg", { z: 2, opacity: 0.45 }),
        rect("plate", 80, 160, 980, 520, "surface", { z: 3, morphId: "titlePlate" }),
        rect("led", 80, 160, 980, 14, "accent", { z: 4 }),
        text("copy0", 120, 210, 800, 40, 22, "copy0", "muted", { ...kicker, z: 4 }),
        text("title", 110, 280, 900, 180, 110, "title", "ink", { ...display, letterSpacing: 2, z: 4, morphId: "title" }),
        text("copy1", 120, 500, 700, 80, 56, "copy1", "accent", { ...display, z: 4 }),
        circle("badge", 1280, 620, 200, "accent", { z: 3, morphId: "accent" }),
        text("copy2", 1305, 675, 150, 100, 64, "copy2", "bg", { ...stat, align: "center", z: 4 }),
      ])
    );

    const compounds: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1440, 90, 64, "title", "ink", display),
    ];
    const fills = ["accent", "muted", "ink", "line"];
    for (let i = 0; i < 4; i++) {
      const x = 80 + i * 380;
      compounds.push(rect("pill" + i, x, 280, 340, 280, "surface", { z: 1 }));
      compounds.push(rect("band" + i, x, 280, 340, 28, fills[i], { z: 2 }));
      compounds.push(circle("dot" + i, x + 130, 360, 80, fills[i], { z: 2 }));
      compounds.push(text("copy" + i * 2, x + 20, 460, 300, 60, 28, "copy" + i * 2, "ink", { align: "center", fontWeight: 700 }));
      compounds.push(text("copy" + (i * 2 + 1), x + 20, 530, 300, 40, 22, "copy" + (i * 2 + 1), "muted", { align: "center" }));
    }
    kits.push(writeKit("feature", "gridlock-compounds", f, compounds));

    const sectors: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1440, 90, 64, "title", "ink", display),
    ];
    const widths = [520, 380, 700, 820];
    for (let i = 0; i < 4; i++) {
      const y = 180 + i * 160;
      sectors.push(rect("track" + i, 80, y + 40, 1440, 24, "line", { z: 1 }));
      sectors.push(rect("delta" + i, 80, y + 40, widths[i], 24, i % 2 ? "muted" : "accent", { z: 2 }));
      sectors.push(text("copy" + i * 2, 80, y, 200, 40, 26, "copy" + i * 2, "muted", { ...kicker }));
      sectors.push(text("copy" + (i * 2 + 1), 1200, y, 320, 60, 36, "copy" + (i * 2 + 1), "ink", { align: "right", fontWeight: 700 }));
    }
    kits.push(writeKit("feature", "gridlock-sectors", f, sectors));

    kits.push(
      writeKit("feature", "gridlock-wall", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        photo("photo", 980, 80, 540, 740, { zoom: 1.5, alignX: 0.45, z: 1 }),
        rect("edge", 980, 80, 12, 740, "accent", { z: 2 }),
        text("title", 80, 50, 800, 90, 64, "title", "ink", display),
        ...[0, 1, 2, 3].flatMap((i) => {
          const y = 180 + i * 160;
          return [
            rect("card" + i, 80, y, 840, 130, "surface", { z: 1 }),
            text("copy" + i * 2, 110, y + 35, 280, 60, 36, "copy" + i * 2, "accent", { ...display }),
            text("copy" + (i * 2 + 1), 420, y + 40, 450, 50, 30, "copy" + (i * 2 + 1), "ink"),
          ] as El[];
        }),
      ])
    );

    kits.push(
      writeKit("feature", "gridlock-quote", f, [
        photo("photo", 0, 0, 1600, 900),
        rect("scrim", 180, 250, 1240, 400, "bg", { z: 2, opacity: 0.78 }),
        text("title", 240, 340, 1120, 160, 84, "title", "ink", {
          ...display,
          textStyleRole: "quote",
          align: "center",
          z: 3,
        }),
        text("copy0", 240, 540, 1120, 50, 26, "copy0", "accent", { align: "center", z: 3 }),
      ])
    );

    kits.push(
      writeKit("closing", "gridlock-lights", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        ...[0, 1, 2, 3, 4].map((i) =>
          circle("light" + i, 420 + i * 150, 220, 100, i < 4 ? "accent" : "line", {
            z: 1,
            morphId: i === 0 ? "pulse-bg" : undefined,
          })
        ),
        text("title", 80, 420, 1440, 140, 110, "title", "ink", { ...display, align: "center", morphId: "title" }),
        text("copy0", 80, 600, 1440, 50, 28, "copy0", "muted", { align: "center" }),
      ])
    );

    return kits;
  },
};

const lantern: Template = {
  id: "lantern-counter",
  name: "Lantern • Counter",
  description: "Night cafe deck — glowing window cover, mosaic tile strip, taped menu notes and an OPEN neon.",
  family: "lantern",
  motion: FLAGSHIP_MOTION,
  brand: {
    colors: {
      bg: "#1A1410",
      surface: "#2A211A",
      surface_color: "#F3D5B5",
      ink: "#FFF6EC",
      muted: "#B9A28C",
      accent: "#FF8A4C",
      line: "#3D3228",
    },
    fonts: { display: "Fraunces", body: "Calibri" },
  },
  slides: [
    {
      role: "cover",
      title: "Lantern",
      items: ["Corner cafe · after dark", "Open till 1", "ON"],
      photoQuery: "77e1fce26a",
    },
    {
      role: "feature",
      title: "On the board",
      items: [
        "Oat flat white",
        "warm milk, short pull",
        "Yuzu soda",
        "sparkling, no ice",
        "Sesame bun",
        "toasted, salted butter",
        "House lemonade",
        "mint leaf",
      ],
    },
    {
      role: "feature",
      title: "Tile night",
      items: ["Peach", "Clay", "Sand", "Rose", "The mosaic wraps the takeout ledge."],
    },
    {
      role: "feature",
      title: "Notes on glass",
      items: ["Free Wi-Fi", "Soy milk ok", "Last pour 00:45", "Ask for the playlist"],
      photoQuery: "77e1fce26a",
    },
    {
      role: "feature",
      title: "Stay a while.",
      items: ["— Counter note"],
      photoQuery: "77e1fce26a",
    },
    {
      role: "closing",
      title: "Still open.",
      items: ["Lantern Counter · night shift", "ON"],
    },
  ],
  kits: () => {
    const f = "lantern";
    const kits = [];

    kits.push(
      writeKit("cover", "lantern-window", f, [
        photo("photo", 0, 0, 1600, 900, { morphId: "hero" }),
        rect("shade", 0, 0, 1600, 140, "bg", { z: 2, opacity: 0.55 }),
        rect("shade2", 0, 760, 1600, 140, "bg", { z: 2, opacity: 0.55 }),
        rect("pane", 120, 180, 900, 540, "bg", { z: 2, opacity: 0.55, morphId: "titlePlate" }),
        rect("glow", 120, 180, 900, 18, "accent", { z: 3 }),
        text("copy0", 160, 230, 700, 40, 22, "copy0", "muted", { ...kicker, z: 3 }),
        text("title", 150, 320, 820, 160, 120, "title", "ink", { ...display, ...serif, z: 3, morphId: "title" }),
        text("copy1", 160, 520, 700, 50, 32, "copy1", "accent", { z: 3 }),
        circle("neon", 1220, 560, 220, "accent", { z: 3, morphId: "accent" }),
        text("copy2", 1250, 625, 160, 100, 56, "copy2", "bg", { ...stat, align: "center", z: 4 }),
      ])
    );

    const board: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1440, 90, 64, "title", "ink", { ...display, ...serif }),
    ];
    for (let i = 0; i < 4; i++) {
      const y = 170 + i * 160;
      board.push(rect("slip" + i, 80, y, 1440, 130, "surface", { z: 1 }));
      board.push(rect("tape" + i, 120, y - 12, 80, 28, "accent", { z: 2, opacity: 0.85 }));
      board.push(text("copy" + i * 2, 140, y + 30, 600, 60, 36, "copy" + i * 2, "ink", { ...display, ...serif }));
      board.push(text("copy" + (i * 2 + 1), 800, y + 40, 650, 50, 26, "copy" + (i * 2 + 1), "muted", { align: "right" }));
    }
    kits.push(writeKit("feature", "lantern-board", f, board));

    const tiles: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1440, 90, 64, "title", "ink", { ...display, ...serif }),
    ];
    const tf = ["accent", "surface_color", "muted", "ink"];
    for (let i = 0; i < 4; i++) {
      const x = 80 + i * 380;
      tiles.push(rect("tile" + i, x, 220, 340, 340, tf[i], { z: 1 }));
      tiles.push(text("copy" + i, x, 600, 340, 50, 28, "copy" + i, "ink", { align: "center" }));
    }
    tiles.push(text("copy4", 80, 720, 1440, 80, 28, "copy4", "muted", { lineHeight: 1.3 }));
    kits.push(writeKit("feature", "lantern-tiles", f, tiles));

    kits.push(
      writeKit("feature", "lantern-notes", f, [
        photo("photo", 0, 0, 1000, 900, { zoom: 1.2, alignX: 0.35 }),
        rect("side", 1000, 0, 600, 900, "bg", { z: 1 }),
        text("title", 1060, 80, 480, 100, 56, "title", "ink", { ...display, ...serif }),
        ...[0, 1, 2, 3].flatMap((i) => {
          const y = 220 + i * 140;
          return [
            rect("note" + i, 1060, y, 460, 110, i % 2 ? "surface" : "surface_color", { z: 2 }),
            text("copy" + i, 1090, y + 30, 400, 50, 28, "copy" + i, i % 2 ? "ink" : "bg"),
          ] as El[];
        }),
      ])
    );

    kits.push(
      writeKit("feature", "lantern-quote", f, [
        photo("photo", 0, 0, 1600, 900),
        rect("card", 280, 260, 1040, 380, "bg", { z: 2, opacity: 0.78 }),
        text("title", 340, 340, 920, 160, 84, "title", "ink", {
          ...display,
          ...serif,
          textStyleRole: "quote",
          align: "center",
          z: 3,
        }),
        text("copy0", 340, 540, 920, 50, 26, "copy0", "accent", { align: "center", z: 3 }),
      ])
    );

    kits.push(
      writeKit("closing", "lantern-open", f, [
        rect("bg", 0, 0, 1600, 900, "accent", { z: 0 }),
        circle("pulse-bg", 680, 160, 240, "bg", { z: 1, morphId: "pulse-bg" }),
        text("on", 720, 235, 160, 90, 48, "copy1", "accent", { ...display, align: "center", z: 2 }),
        text("title", 80, 480, 1440, 140, 110, "title", "bg", { ...display, ...serif, align: "center", morphId: "title" }),
        text("copy0", 80, 660, 1440, 50, 28, "copy0", "bg", { align: "center" }),
      ])
    );

    return kits;
  },
};

const gradeSel = familySel("grade");
if (gradeSel) assertUniqueSel("grade", gradeSel.units);

const grade: Template = {
  id: "grade-suite",
  name: "Grade • Suite",
  description: "Color-grade deck — RGB waveform cover, color wheels, node chain and a timeline scrubber.",
  family: "grade",
  motion: FLAGSHIP_MOTION,
  brand: {
    colors: {
      bg: "#0D0F12",
      surface: "#171A20",
      surface_color: "#22262F",
      ink: "#F2F4F7",
      muted: "#8B919C",
      accent: "#6C8CFF",
      line: "#2C313C",
    },
    fonts: { display: "Syne", body: "IBM Plex Mono" },
  },
  slides: [
    {
      role: "cover",
      title: "GRADE",
      items: ["Edit suite · node graph", "LUT pack 04", "4K"],
      photoQuery: "8260f0bf57",
    },
    {
      role: "feature",
      title: "Waveforms",
      items: ["R", "72%", "G", "58%", "B", "41%", "Y", "66%"],
    },
    {
      role: "feature",
      title: "Wheels",
      items: ["Lift", "warm", "Gamma", "neutral", "Gain", "cool"],
    },
    {
      role: "feature",
      title: "Node graph",
      items: ["01", "Raw", "02", "Balance", "03", "Look", "04", "Export"],
    },
    {
      role: "feature",
      title: "Timeline",
      items: ["00:00", "Teaser", "00:42", "Interview", "01:18", "B-roll", "02:05", "End card"],
      photoQuery: "8260f0bf57",
    },
    {
      role: "closing",
      title: "Render.",
      items: ["Grade Suite · overnight queue"],
    },
  ],
  kits: () => {
    const f = "grade";
    const kits = [];

    kits.push(
      writeKit("cover", "grade-scopes", f, [
        photo("photo", 0, 0, 1600, 900, { morphId: "hero" }),
        rect("scrim", 0, 0, 780, 900, "bg", { z: 2, opacity: 0.72, morphId: "titlePlate" }),
        text("copy0", 70, 80, 600, 40, 22, "copy0", "muted", { ...kicker, z: 3 }),
        text("title", 60, 200, 680, 160, 120, "title", "ink", { ...display, letterSpacing: -2, z: 3, morphId: "title" }),
        text("copy1", 70, 400, 500, 50, 28, "copy1", "accent", { z: 3 }),
        ...waveform("wf", { x: 70, y: 520, count: 8, barW: 48, gap: 22 }),
        ...neonBadge("nb", { x: 1280, y: 640, size: 200, slot: "copy2", fontSize: 56, z: 3 }),
      ])
    );

    const waves: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1440, 90, 64, "title", "ink", { ...display, morphId: "title" }),
    ];
    const wh = [420, 340, 240, 380];
    const wc = ["accent", "ink", "muted", "line"];
    for (let i = 0; i < 4; i++) {
      const x = 120 + i * 370;
      waves.push(rect("col" + i, x, 760 - wh[i], 280, wh[i], wc[i], { z: 1, morphId: i === 0 ? "accent" : undefined }));
      waves.push(text("copy" + i * 2, x, 200, 280, 60, 48, "copy" + i * 2, "ink", { ...display, align: "center" }));
      waves.push(text("copy" + (i * 2 + 1), x, 780, 280, 40, 24, "copy" + (i * 2 + 1), "muted", { align: "center" }));
    }
    kits.push(writeKit("feature", "grade-waveforms", f, waves));

    kits.push(
      writeKit("feature", "grade-wheels", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 50, 1440, 90, 64, "title", "ink", { ...display, morphId: "title" }),
        ...colorWheels("cw", { x: 140, y: 200, count: 3, size: 360, gap: 120, slotStart: 0 }),
      ])
    );

    kits.push(
      writeKit("feature", "grade-nodes", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 50, 1440, 90, 64, "title", "ink", { ...display, morphId: "title" }),
        ...nodeChain("nc", { labels: ["Raw", "Balance", "Look", "Export"], activeIndex: 2, slotStart: 0 }),
      ])
    );

    const timeline: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 900, 90, 64, "title", "ink", { ...display, morphId: "title" }),
      photo("photo", 1100, 40, 420, 300, { zoom: 1.3, alignY: 0.4 }),
      rect("rail", 80, 420, 1440, 120, "surface", { z: 1, morphId: "plate" }),
      rect("playhead", 620, 400, 8, 160, "accent", { z: 3, morphId: "accent" }),
    ];
    const clips = [280, 220, 320, 260];
    let cx = 100;
    for (let i = 0; i < 4; i++) {
      timeline.push(rect("clip" + i, cx, 445, clips[i], 70, i === 1 ? "accent" : "surface_color", { z: 2 }));
      timeline.push(text("copy" + i * 2, cx + 10, 560, 200, 40, 22, "copy" + i * 2, "muted"));
      timeline.push(text("copy" + (i * 2 + 1), cx + 10, 600, 240, 40, 26, "copy" + (i * 2 + 1), "ink"));
      cx += clips[i] + 40;
    }
    kits.push(writeKit("feature", "grade-timeline", f, timeline));

    kits.push(
      writeKit("closing", "grade-render", f, [
        rect("bg", 0, 0, 1600, 900, "accent", { z: 0 }),
        rect("bar", 400, 280, 800, 28, "bg", { z: 1, opacity: 0.35, morphId: "plate" }),
        rect("fill", 400, 280, 560, 28, "bg", { z: 2, morphId: "accent" }),
        text("title", 80, 400, 1440, 140, 110, "title", "bg", { ...display, align: "center", morphId: "title" }),
        text("copy0", 80, 580, 1440, 50, 28, "copy0", "bg", { align: "center" }),
      ])
    );

    return kits;
  },
};

const hearth: Template = {
  id: "hearth-folio",
  name: "Hearth • Folio",
  description: "Interior folio — fireplace surround cover, tile stack, room cards and an ember close.",
  family: "hearth",
  motion: FLAGSHIP_MOTION,
  brand: {
    colors: {
      bg: "#F4EEE6",
      surface: "#E7DFD4",
      surface_color: "#2B2B2B",
      ink: "#1C1A17",
      muted: "#7A736A",
      accent: "#C45C26",
      line: "#D4CBBF",
    },
    fonts: { display: "Playfair Display", body: "Calibri" },
  },
  slides: [
    {
      role: "cover",
      title: "Hearth",
      items: ["Interior folio · Unit 4B", "For viewing", "4B"],
      photoQuery: "3505b29aab",
    },
    {
      role: "feature",
      title: "The surround",
      items: ["Charcoal tile", "48 modules", "Blue flame", "electric insert", "White trim", "120 mm"],
      photoQuery: "3505b29aab",
    },
    {
      role: "feature",
      title: "Rooms",
      items: ["I", "Living with hearth", "II", "Bay window nook", "III", "Gallery wall", "IV", "Entry gallery"],
    },
    {
      role: "feature",
      title: "Materials",
      items: ["Oak", "floor", "Wool", "rug", "Steel", "table", "Linen", "chair"],
    },
    {
      role: "feature",
      title: "Light settles here.",
      items: ["— Showing notes"],
      photoQuery: "3505b29aab",
    },
    {
      role: "closing",
      title: "Come warm.",
      items: ["Hearth Folio · by appointment"],
    },
  ],
  kits: () => {
    const f = "hearth";
    const kits = [];

    kits.push(
      writeKit("cover", "hearth-surround", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        rect("outer", 180, 80, 1240, 740, "surface_color", { z: 1, morphId: "plate" }),
        rect("inner", 260, 150, 1080, 520, "bg", { z: 2 }),
        photo("photo", 280, 170, 1040, 480, { zoom: 1.15, alignX: 0.35, z: 3 }),
        rect("hearthBar", 260, 680, 1080, 40, "accent", { z: 3, morphId: "accent" }),
        text("copy0", 80, 40, 700, 40, 22, "copy0", "muted", { ...kicker }),
        text("title", 80, 820, 900, 70, 56, "title", "ink", { ...display, ...serif, morphId: "title" }),
        text("copy1", 1000, 835, 300, 40, 24, "copy1", "accent", { align: "right" }),
        circle("badge", 1380, 40, 140, "accent", { z: 3 }),
        text("copy2", 1400, 75, 100, 80, 40, "copy2", "bg", { ...stat, align: "center", z: 4 }),
      ])
    );

    kits.push(
      writeKit("feature", "hearth-tile", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 50, 700, 90, 64, "title", "ink", { ...display, ...serif }),
        photo("photo", 900, 80, 620, 740, { zoom: 1.4, alignX: 0.2, z: 1 }),
        // stacked tile marks
        ...[0, 1, 2, 3, 4, 5].map((i) =>
          rect("tile" + i, 80, 180 + i * 100, 720, 80, i % 2 ? "surface" : "surface_color", { z: 1 })
        ),
        text("copy0", 110, 200, 500, 50, 32, "copy0", "accent"),
        text("copy1", 520, 200, 240, 50, 28, "copy1", "ink", { align: "right" }),
        text("copy2", 110, 400, 500, 50, 32, "copy2", "accent"),
        text("copy3", 520, 400, 240, 50, 28, "copy3", "ink", { align: "right" }),
        text("copy4", 110, 600, 500, 50, 32, "copy4", "accent"),
        text("copy5", 520, 600, 240, 50, 28, "copy5", "bg", { align: "right" }),
      ])
    );

    const rooms: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1440, 90, 64, "title", "ink", { ...display, ...serif }),
    ];
    for (let i = 0; i < 4; i++) {
      const y = 170 + i * 160;
      rooms.push(rect("rule" + i, 80, y + 120, 1440, 2, "line", { z: 1 }));
      rooms.push(text("copy" + i * 2, 80, y, 160, 80, 56, "copy" + i * 2, "accent", { ...display, ...serif }));
      rooms.push(text("copy" + (i * 2 + 1), 280, y + 15, 1100, 60, 40, "copy" + (i * 2 + 1), "ink"));
    }
    kits.push(writeKit("feature", "hearth-rooms", f, rooms));

    const materials: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1440, 90, 64, "title", "ink", { ...display, ...serif }),
    ];
    for (let i = 0; i < 4; i++) {
      const x = 80 + i * 380;
      materials.push(rect("swatch" + i, x, 220, 340, 420, i % 2 ? "surface_color" : "surface", { z: 1 }));
      materials.push(
        text("copy" + i * 2, x + 30, 360, 280, 80, 48, "copy" + i * 2, i % 2 ? "bg" : "ink", {
          ...display,
          ...serif,
          align: "center",
        })
      );
      materials.push(
        text("copy" + (i * 2 + 1), x + 30, 470, 280, 50, 26, "copy" + (i * 2 + 1), i % 2 ? "bg" : "muted", {
          align: "center",
        })
      );
    }
    kits.push(writeKit("feature", "hearth-materials", f, materials));

    kits.push(
      writeKit("feature", "hearth-quote", f, [
        rect("bg", 0, 0, 1600, 900, "surface_color", { z: 0 }),
        rect("mark", 760, 240, 80, 4, "accent"),
        text("title", 160, 320, 1280, 200, 72, "title", "bg", {
          ...display,
          ...serif,
          textStyleRole: "quote",
          align: "center",
          lineHeight: 1.15,
        }),
        text("copy0", 160, 560, 1280, 50, 26, "copy0", "accent", { align: "center" }),
      ])
    );

    kits.push(
      writeKit("closing", "hearth-ember", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        circle("pulse-bg", 680, 160, 240, "accent", { z: 1, morphId: "pulse-bg" }),
        text("title", 80, 480, 1440, 140, 110, "title", "ink", { ...display, ...serif, align: "center", morphId: "title" }),
        text("copy0", 80, 660, 1440, 50, 28, "copy0", "muted", { align: "center" }),
      ])
    );

    return kits;
  },
};

runTemplates([gridlock, lantern, grade, hearth]).catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
