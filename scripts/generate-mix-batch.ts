/**
 * Mix batch — two funky + two soft presentation systems.
 *
 * Funky:  marquee-board, strike-lane
 * Soft:   apiary-jar, newsstand-rack
 *
 *   node -r ts-node/register/transpile-only scripts/generate-mix-batch.ts [--publish-local] [--only=id]
 */
import { Template, text, rect, circle, photo, writeKit, runTemplates, El } from "./lib/designKit";
import {
  bulbRow,
  marqueePanel,
  stubTicket,
  laneStripe,
  pinSet,
  scoreBox,
  combCell,
  jarLabel,
  hiveBar,
  magazineSpine,
  mastheadRule,
  issueBadge,
  assertUniqueSel,
  familySel,
} from "./lib/sel";

const serif = { fontWeight: 400 };
const display = { textStyleRole: "display", fontRole: "display" };
const kicker = { textStyleRole: "kicker", fontRole: "label" };
const stat = { textStyleRole: "stat", fontRole: "display" };

const FLAGSHIP_MOTION = {
  morph: false,
  ambient: true,
  cameraPan: false,
  scatter: false,
  defaultTransition: "fade" as const,
  durationMs: 800,
};

for (const family of ["marquee", "strike", "apiary", "newsstand"]) {
  const sel = familySel(family);
  if (sel) assertUniqueSel(family, sel.units);
}

const marquee: Template = {
  id: "marquee-board",
  name: "Marquee • Board",
  description: "Theater marquee night — bulb row cover, letterboard acts, stub tickets and a lights-up close.",
  family: "marquee",
  motion: FLAGSHIP_MOTION,
  brand: {
    colors: {
      bg: "#0C0A08",
      surface: "#1C1612",
      surface_color: "#2A221C",
      ink: "#FFF6E8",
      muted: "#B8A48C",
      accent: "#F5C518",
      line: "#3D3228",
    },
    fonts: { display: "Impact", body: "Trebuchet MS" },
  },
  slides: [
    { role: "cover", title: "MARQUEE", items: ["Board · Friday night", "now playing", "01"], photoQuery: "01c1358c7bf8" },
    { role: "feature", title: "Acts", items: ["Opener", "soft warm-up", "Feature", "main bill", "Encore", "last glow", "Hold the lights."], photoQuery: "0506d14bb966" },
    { role: "feature", title: "Stubs", items: ["Row A", "center left", "Row C", "balcony right", "Keep your stub."], photoQuery: "07c71ad45242" },
    { role: "feature", title: "Cue", items: ["01", "House down", "02", "Curtain", "03", "Spotlight", "04", "Bow"] },
    { role: "feature", title: "The house goes quiet first.", items: ["— Stage note"], photoQuery: "01c1358c7bf8" },
    { role: "closing", title: "Lights.", items: ["Marquee Board · last show"] },
  ],
  kits: () => {
    const f = "marquee";
    const kits = [];
    kits.push(
      writeKit("cover", "marquee-night", f, [
        photo("photo", 0, 0, 1600, 900, { morphId: "hero", zoom: 1.15 }),
        rect("scrim", 0, 0, 1600, 280, "bg", { z: 2, opacity: 0.72, morphId: "titlePlate" }),
        ...bulbRow("br", { x: 80, y: 40, count: 18, size: 32, gap: 14, z: 3 }),
        ...marqueePanel("mp", { x: 80, y: 320, w: 980, h: 380, z: 3 }),
        text("copy0", 120, 360, 880, 40, 22, "copy0", "muted", { ...kicker, z: 4 }),
        text("title", 120, 420, 880, 160, 110, "title", "ink", { ...display, z: 4, morphId: "title" }),
        text("copy1", 120, 600, 600, 50, 36, "copy1", "accent", { z: 4 }),
        ...stubTicket("st", { x: 1140, y: 360, w: 380, h: 240, z: 3 }),
        text("copy2", 1180, 450, 200, 80, 56, "copy2", "bg", { ...stat, z: 4 }),
      ])
    );
    {
      const acts: El[] = [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 50, 900, 90, 64, "title", "ink", { ...display, morphId: "title" }),
        ...bulbRow("a", { x: 80, y: 140, count: 14, size: 28, z: 1 }),
      ];
      for (let i = 0; i < 3; i++) {
        const y = 220 + i * 170;
        acts.push(rect("row" + i, 80, y, 1000, 140, "surface", { z: 2, morphId: i === 0 ? "plate" : undefined }));
        acts.push(text("copy" + i * 2, 120, y + 30, 300, 50, 36, "copy" + i * 2, "accent", { ...display }));
        acts.push(text("copy" + (i * 2 + 1), 120, y + 80, 900, 40, 26, "copy" + (i * 2 + 1), "ink"));
      }
      acts.push(photo("photo", 1160, 220, 360, 520, { zoom: 1.2, z: 1 }));
      acts.push(text("copy6", 80, 780, 1000, 50, 26, "copy6", "muted"));
      kits.push(writeKit("feature", "marquee-acts", f, acts));
    }
    kits.push(
      writeKit("feature", "marquee-stubs", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 40, 800, 80, 56, "title", "ink", { ...display, morphId: "title" }),
        photo("photo", 900, 140, 620, 640, { zoom: 1.2, z: 1 }),
        ...stubTicket("a", { x: 80, y: 160, w: 720, h: 260, z: 2 }),
        text("copy0", 120, 210, 500, 50, 32, "copy0", "bg", { ...kicker, z: 3 }),
        text("copy1", 120, 280, 500, 60, 28, "copy1", "bg", { z: 3 }),
        ...stubTicket("b", { x: 80, y: 460, w: 720, h: 260, z: 2 }),
        text("copy2", 120, 510, 500, 50, 32, "copy2", "bg", { ...kicker, z: 3 }),
        text("copy3", 120, 580, 500, 60, 28, "copy3", "bg", { z: 3 }),
        text("copy4", 80, 780, 720, 40, 24, "copy4", "muted"),
      ])
    );
    {
      const cue: El[] = [rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }), text("title", 80, 50, 1400, 90, 64, "title", "ink", { ...display, morphId: "title" })];
      for (let i = 0; i < 4; i++) {
        const y = 180 + i * 150;
        cue.push(rect("bar" + i, 80, y, 1440, 120, i % 2 ? "surface" : "surface_color", { z: 1 }));
        cue.push(text("copy" + i * 2, 120, y + 25, 180, 70, 48, "copy" + i * 2, "accent", { ...display }));
        cue.push(text("copy" + (i * 2 + 1), 340, y + 35, 1100, 50, 36, "copy" + (i * 2 + 1), "ink"));
      }
      kits.push(writeKit("feature", "marquee-cue", f, cue));
    }
    kits.push(
      writeKit("feature", "marquee-quote", f, [
        photo("photo", 0, 0, 1600, 900, { zoom: 1.1 }),
        ...bulbRow("q", { x: 200, y: 280, count: 16, size: 28, z: 2 }),
        rect("band", 0, 360, 1600, 240, "bg", { z: 3, opacity: 0.8 }),
        text("title", 100, 400, 1400, 120, 56, "title", "ink", { ...display, textStyleRole: "quote", align: "center", z: 4 }),
        text("copy0", 100, 540, 1400, 40, 24, "copy0", "accent", { align: "center", z: 4 }),
      ])
    );
    kits.push(
      writeKit("closing", "marquee-lights", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        ...bulbRow("c1", { x: 120, y: 120, count: 20, size: 40, gap: 16, z: 1 }),
        ...bulbRow("c2", { x: 120, y: 200, count: 20, size: 40, gap: 16, z: 1 }),
        ...marqueePanel("cp", { x: 280, y: 320, w: 1040, h: 280, z: 2 }),
        circle("pulse-bg", 760, 400, 120, "accent", { z: 3, morphId: "pulse-bg" }),
        text("title", 320, 420, 960, 140, 100, "title", "ink", { ...display, align: "center", morphId: "title", z: 4 }),
        text("copy0", 320, 700, 960, 40, 26, "copy0", "muted", { align: "center", z: 4 }),
      ])
    );
    return kits;
  },
};

const strike: Template = {
  id: "strike-lane",
  name: "Strike • Lane",
  description: "Funky bowling alley — lane cover, pin set, score frames and a spare close.",
  family: "strike",
  motion: FLAGSHIP_MOTION,
  brand: {
    colors: {
      bg: "#101820",
      surface: "#1A2834",
      surface_color: "#243646",
      ink: "#F2F7FA",
      muted: "#8FA4B4",
      accent: "#FF4D6D",
      line: "#334858",
    },
    fonts: { display: "Franklin Gothic Heavy", body: "Bahnschrift" },
  },
  slides: [
    { role: "cover", title: "STRIKE", items: ["Lane 7 · late league", "open bowl", "X"], photoQuery: "0aaf07e051b3" },
    { role: "feature", title: "Frames", items: ["1", "spare", "2", "open", "3", "strike", "4", "spare", "5", "X"], photoQuery: "0288432f0b82" },
    { role: "feature", title: "Pins", items: ["Head", "clear first", "Pocket", "1-3 line", "Back", "clean sweep"], photoQuery: "05b78bfac32c" },
    { role: "feature", title: "League", items: ["01", "Oil pattern", "02", "Warm-up", "03", "Roll", "04", "Reset"] },
    { role: "feature", title: "Leave nothing standing.", items: ["— Lane boss"], photoQuery: "0aaf07e051b3" },
    { role: "closing", title: "Spare.", items: ["Strike Lane · last frame"] },
  ],
  kits: () => {
    const f = "strike";
    const kits = [];
    kits.push(
      writeKit("cover", "strike-cover", f, [
        photo("photo", 0, 0, 1600, 900, { morphId: "hero", zoom: 1.2 }),
        rect("scrim", 0, 480, 1600, 420, "bg", { z: 2, opacity: 0.78, morphId: "titlePlate" }),
        ...laneStripe("ls", { x: 900, y: 80, w: 620, h: 360, z: 3 }),
        text("copy0", 80, 520, 800, 40, 22, "copy0", "muted", { ...kicker, z: 4 }),
        text("title", 70, 580, 1000, 140, 120, "title", "ink", { ...display, z: 4, morphId: "title" }),
        text("copy1", 80, 740, 500, 50, 32, "copy1", "accent", { z: 4 }),
        circle("badge", 1360, 640, 160, "accent", { z: 4, morphId: "accent" }),
        text("copy2", 1390, 685, 100, 80, 56, "copy2", "bg", { ...stat, align: "center", z: 5 }),
      ])
    );
    kits.push(
      writeKit("feature", "strike-frames", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 50, 900, 90, 64, "title", "ink", { ...display, morphId: "title" }),
        ...scoreBox("sc", { x: 80, y: 200, frames: 5, z: 1 }),
        ...[0, 1, 2, 3, 4].map((i) => text("copy" + i * 2, 100 + i * 236, 230, 180, 50, 36, "copy" + i * 2, i === 4 ? "bg" : "ink", { ...stat, align: "center", z: 2 })),
        ...[0, 1, 2, 3, 4].map((i) => text("copy" + (i * 2 + 1), 100 + i * 236, 280, 180, 40, 22, "copy" + (i * 2 + 1), i === 4 ? "bg" : "muted", { align: "center", z: 2 })),
        photo("photo", 80, 400, 1440, 420, { zoom: 1.15, z: 1 }),
      ])
    );
    kits.push(
      writeKit("feature", "strike-pins", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 40, 700, 80, 56, "title", "ink", { ...display, morphId: "title" }),
        photo("photo", 80, 160, 700, 640, { zoom: 1.2, z: 1 }),
        ...pinSet("ps", { x: 1180, y: 160, size: 64, z: 2 }),
        rect("c0", 820, 520, 680, 120, "surface", { z: 2, morphId: "plate" }),
        text("copy0", 850, 545, 200, 40, 28, "copy0", "accent", { ...kicker, z: 3 }),
        text("copy1", 1080, 545, 380, 40, 26, "copy1", "ink", { z: 3 }),
        rect("c1", 820, 660, 680, 120, "surface_color", { z: 2 }),
        text("copy2", 850, 685, 200, 40, 28, "copy2", "accent", { ...kicker, z: 3 }),
        text("copy3", 1080, 685, 380, 40, 26, "copy3", "ink", { z: 3 }),
        text("copy4", 850, 800, 200, 40, 24, "copy4", "muted", { z: 3 }),
        text("copy5", 1080, 800, 380, 40, 24, "copy5", "ink", { z: 3 }),
      ])
    );
    {
      const league: El[] = [rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }), text("title", 80, 50, 1400, 90, 64, "title", "ink", { ...display, morphId: "title" }), ...laneStripe("lg", { x: 80, y: 160, w: 1440, h: 120, z: 1 })];
      for (let i = 0; i < 4; i++) {
        const x = 80 + i * 380;
        league.push(rect("step" + i, x, 360, 340, 400, "surface", { z: 2, morphId: i === 0 ? "plate" : undefined }));
        league.push(text("copy" + i * 2, x + 30, 420, 280, 80, 56, "copy" + i * 2, "accent", { ...stat }));
        league.push(text("copy" + (i * 2 + 1), x + 30, 520, 280, 120, 32, "copy" + (i * 2 + 1), "ink"));
      }
      kits.push(writeKit("feature", "strike-league", f, league));
    }
    kits.push(
      writeKit("feature", "strike-quote", f, [
        photo("photo", 0, 0, 900, 900, { zoom: 1.15, z: 1 }),
        rect("panel", 900, 0, 700, 900, "bg", { z: 2 }),
        ...pinSet("pq", { x: 1250, y: 80, size: 48, z: 3 }),
        text("title", 960, 360, 580, 200, 56, "title", "ink", { ...display, textStyleRole: "quote", lineHeight: 1.15, z: 3 }),
        text("copy0", 960, 600, 500, 40, 24, "copy0", "accent", { z: 3 }),
      ])
    );
    kits.push(
      writeKit("closing", "strike-spare", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        ...laneStripe("c", { x: 200, y: 80, w: 1200, h: 360, z: 1 }),
        ...scoreBox("cf", { x: 200, y: 480, frames: 5, z: 2 }),
        circle("pulse-bg", 1240, 510, 80, "accent", { z: 3, morphId: "pulse-bg" }),
        text("title", 80, 680, 1440, 120, 100, "title", "ink", { ...display, align: "center", morphId: "title", z: 3 }),
        text("copy0", 80, 820, 1440, 40, 26, "copy0", "muted", { align: "center", z: 3 }),
      ])
    );
    return kits;
  },
};

const apiary: Template = {
  id: "apiary-jar",
  name: "Apiary • Jar",
  description: "Soft honey apiary — jar labels, comb cells, hive bars and a gentle gather close.",
  family: "apiary",
  motion: FLAGSHIP_MOTION,
  brand: {
    colors: {
      bg: "#F7F1E4",
      surface: "#EBE2D0",
      surface_color: "#DDD2BA",
      ink: "#3A3228",
      muted: "#8A7E6E",
      accent: "#D4A017",
      line: "#C8BBA4",
    },
    fonts: { display: "Georgia", body: "Georgia" },
  },
  slides: [
    { role: "cover", title: "Apiary", items: ["Jar shelf · morning", "small batch", "03"], photoQuery: "092c8c1420fb" },
    { role: "feature", title: "Jars", items: ["Spring", "light floral", "Summer", "deep gold", "Fall", "dark amber", "Label by season."], photoQuery: "141ae86a78f3" },
    { role: "feature", title: "Comb", items: ["Cap", "soft white", "Cell", "full weight", "Frame", "warm pull"], photoQuery: "16df8343dc3d" },
    { role: "feature", title: "Hive", items: ["I", "Open", "II", "Smoke", "III", "Lift", "IV", "Close"] },
    { role: "feature", title: "Sweetness keeps its time.", items: ["— Keeper note"], photoQuery: "092c8c1420fb" },
    { role: "closing", title: "Gather.", items: ["Apiary Jar · morning shelf"] },
  ],
  kits: () => {
    const f = "apiary";
    const kits = [];
    kits.push(
      writeKit("cover", "apiary-cover", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        photo("photo", 720, 80, 800, 700, { zoom: 1.15, z: 1 }),
        ...jarLabel("jl", { x: 80, y: 160, w: 560, h: 420, z: 2 }),
        text("copy0", 120, 200, 480, 40, 20, "copy0", "muted", { ...kicker, z: 4 }),
        text("title", 120, 300, 480, 120, 88, "title", "ink", { ...display, ...serif, z: 4, morphId: "title" }),
        text("copy1", 120, 480, 480, 40, 28, "copy1", "bg", { z: 4 }),
        ...hiveBar("hb", { x: 80, y: 620, count: 3, w: 560, z: 2 }),
        text("copy2", 120, 700, 200, 60, 40, "copy2", "ink", { ...stat, z: 3 }),
      ])
    );
    {
      const jars: El[] = [rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }), text("title", 80, 50, 900, 90, 64, "title", "ink", { ...display, ...serif, morphId: "title" })];
      for (let i = 0; i < 3; i++) {
        const x = 80 + i * 500;
        jars.push(...jarLabel("j" + i, { x, y: 180, w: 440, h: 480, z: 1 }));
        jars.push(text("copy" + i * 2, x + 40, 280, 360, 60, 40, "copy" + i * 2, "bg", { ...display, ...serif, z: 3 }));
        jars.push(text("copy" + (i * 2 + 1), x + 40, 380, 360, 80, 28, "copy" + (i * 2 + 1), "ink", { z: 3 }));
      }
      jars.push(text("copy6", 80, 740, 1400, 50, 26, "copy6", "muted"));
      kits.push(writeKit("feature", "apiary-jars", f, jars));
    }
    kits.push(
      writeKit("feature", "apiary-comb", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 40, 700, 80, 56, "title", "ink", { ...display, ...serif, morphId: "title" }),
        photo("photo", 80, 160, 620, 640, { zoom: 1.2, z: 1 }),
        ...combCell("cc", { x: 780, y: 160, cols: 4, rows: 3, size: 100, z: 1 }),
        text("copy0", 780, 560, 200, 40, 28, "copy0", "accent", { ...kicker, z: 3 }),
        text("copy1", 1000, 560, 400, 40, 26, "copy1", "ink", { z: 3 }),
        text("copy2", 780, 640, 200, 40, 28, "copy2", "accent", { ...kicker, z: 3 }),
        text("copy3", 1000, 640, 400, 40, 26, "copy3", "ink", { z: 3 }),
        text("copy4", 780, 720, 200, 40, 28, "copy4", "accent", { ...kicker, z: 3 }),
        text("copy5", 1000, 720, 400, 40, 26, "copy5", "ink", { z: 3 }),
      ])
    );
    {
      const hive: El[] = [rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }), text("title", 80, 50, 1400, 90, 64, "title", "ink", { ...display, ...serif, morphId: "title" }), ...hiveBar("hh", { x: 80, y: 160, count: 1, w: 1440, z: 1 })];
      for (let i = 0; i < 4; i++) {
        const y = 220 + i * 150;
        hive.push(...hiveBar("r" + i, { x: 80, y: y + 90, count: 1, w: 1440, z: 1 }));
        hive.push(text("copy" + i * 2, 80, y, 160, 70, 48, "copy" + i * 2, "accent", { ...display, ...serif }));
        hive.push(text("copy" + (i * 2 + 1), 280, y + 10, 1100, 60, 36, "copy" + (i * 2 + 1), "ink"));
      }
      kits.push(writeKit("feature", "apiary-hive", f, hive));
    }
    kits.push(
      writeKit("feature", "apiary-quote", f, [
        rect("bg", 0, 0, 1600, 900, "surface", { z: 0 }),
        ...combCell("cq", { x: 80, y: 200, cols: 3, rows: 3, size: 80, z: 1 }),
        text("title", 520, 320, 980, 200, 56, "title", "ink", { ...display, ...serif, textStyleRole: "quote", lineHeight: 1.2, z: 2 }),
        text("copy0", 520, 560, 800, 40, 24, "copy0", "accent", { z: 2 }),
      ])
    );
    kits.push(
      writeKit("closing", "apiary-gather", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        ...jarLabel("cj", { x: 480, y: 80, w: 640, h: 420, z: 1 }),
        circle("pulse-bg", 700, 220, 160, "accent", { z: 2, morphId: "pulse-bg" }),
        text("title", 80, 560, 1440, 120, 96, "title", "ink", { ...display, ...serif, align: "center", morphId: "title", z: 3 }),
        text("copy0", 80, 720, 1440, 40, 26, "copy0", "muted", { align: "center", z: 3 }),
        ...hiveBar("cf", { x: 400, y: 800, count: 2, w: 800, z: 2 }),
      ])
    );
    return kits;
  },
};

const newsstand: Template = {
  id: "newsstand-rack",
  name: "Newsstand • Rack",
  description: "Soft corner newsstand — magazine spines, masthead, issue badge and a read-on close.",
  family: "newsstand",
  motion: FLAGSHIP_MOTION,
  brand: {
    colors: {
      bg: "#F3F0EA",
      surface: "#E5E0D6",
      surface_color: "#D5CFC3",
      ink: "#1F2428",
      muted: "#6E767C",
      accent: "#1F5C57",
      line: "#B8B2A6",
    },
    fonts: { display: "Rockwell", body: "Georgia" },
  },
  slides: [
    { role: "cover", title: "NEWSSTAND", items: ["Rack · Sunday morning", "issue", "24"], photoQuery: "1396e926cdc5" },
    { role: "feature", title: "Spines", items: ["Travel", "Food", "Design", "Sport", "City", "Film", "Art", "Stack by curiosity."], photoQuery: "104868264fb5" },
    { role: "feature", title: "Masthead", items: ["Lead", "Keep the headline short.", "Deck", "One soft line under."], photoQuery: "16df8343dc3d" },
    { role: "feature", title: "Sections", items: ["01", "Front", "02", "Features", "03", "Reviews", "04", "Back"] },
    { role: "feature", title: "Print still holds the morning.", items: ["— Vendor"], photoQuery: "1396e926cdc5" },
    { role: "closing", title: "Read on.", items: ["Newsstand Rack · Sunday"] },
  ],
  kits: () => {
    const f = "newsstand";
    const kits = [];
    kits.push(
      writeKit("cover", "newsstand-cover", f, [
        photo("photo", 0, 0, 1600, 900, { morphId: "hero", zoom: 1.1 }),
        rect("scrim", 0, 0, 780, 900, "bg", { z: 2, opacity: 0.82, morphId: "titlePlate" }),
        ...mastheadRule("mh", { x: 70, y: 100, w: 640, z: 3 }),
        text("copy0", 70, 140, 640, 40, 20, "copy0", "muted", { ...kicker, z: 3 }),
        text("title", 60, 220, 680, 220, 96, "title", "ink", { ...display, z: 3, morphId: "title" }),
        text("copy1", 70, 480, 500, 50, 32, "copy1", "accent", { z: 3 }),
        ...issueBadge("ib", { x: 70, y: 580, size: 180, z: 3 }),
        text("copy2", 105, 635, 110, 80, 48, "copy2", "bg", { ...stat, align: "center", z: 4 }),
      ])
    );
    kits.push(
      writeKit("feature", "newsstand-spines", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 50, 900, 90, 64, "title", "ink", { ...display, morphId: "title" }),
        ...magazineSpine("ms", { x: 80, y: 160, count: 8, z: 1 }),
        ...[0, 1, 2, 3, 4, 5, 6].map((i) =>
          text("copy" + i, 90 + i * 120, 760, 100, 40, 20, "copy" + i, i % 3 === 0 ? "accent" : "muted", { align: "center", z: 2 })
        ),
        text("copy7", 80, 840, 1200, 40, 24, "copy7", "ink"),
      ])
    );
    kits.push(
      writeKit("feature", "newsstand-mast", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 40, 800, 80, 56, "title", "ink", { ...display, morphId: "title" }),
        photo("photo", 900, 140, 620, 640, { zoom: 1.2, z: 1 }),
        ...mastheadRule("m2", { x: 80, y: 160, w: 740, z: 2 }),
        rect("lead", 80, 200, 740, 280, "surface", { z: 2, morphId: "plate" }),
        text("copy0", 120, 240, 660, 50, 32, "copy0", "accent", { ...kicker, z: 3 }),
        text("copy1", 120, 320, 660, 100, 32, "copy1", "ink", { z: 3, lineHeight: 1.3 }),
        rect("deck", 80, 520, 740, 260, "surface_color", { z: 2 }),
        text("copy2", 120, 560, 660, 50, 32, "copy2", "accent", { ...kicker, z: 3 }),
        text("copy3", 120, 640, 660, 80, 32, "copy3", "ink", { z: 3, lineHeight: 1.3 }),
      ])
    );
    {
      const sec: El[] = [rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }), text("title", 80, 50, 1400, 90, 64, "title", "ink", { ...display, morphId: "title" }), ...mastheadRule("s", { x: 80, y: 140, w: 1440, z: 1 })];
      for (let i = 0; i < 4; i++) {
        const y = 200 + i * 150;
        sec.push(rect("row" + i, 80, y, 1440, 120, i % 2 ? "surface" : "surface_color", { z: 1 }));
        sec.push(text("copy" + i * 2, 120, y + 25, 200, 70, 44, "copy" + i * 2, "accent", { ...display }));
        sec.push(text("copy" + (i * 2 + 1), 360, y + 35, 1100, 50, 32, "copy" + (i * 2 + 1), "ink"));
      }
      kits.push(writeKit("feature", "newsstand-sections", f, sec));
    }
    kits.push(
      writeKit("feature", "newsstand-quote", f, [
        photo("photo", 0, 0, 1600, 900, { zoom: 1.1 }),
        rect("plate", 200, 280, 1200, 340, "bg", { z: 2, opacity: 0.88 }),
        ...mastheadRule("qq", { x: 280, y: 320, w: 1040, z: 3 }),
        text("title", 280, 360, 1040, 140, 52, "title", "ink", { ...display, textStyleRole: "quote", align: "center", z: 3 }),
        text("copy0", 280, 540, 1040, 40, 24, "copy0", "accent", { align: "center", z: 3 }),
      ])
    );
    kits.push(
      writeKit("closing", "newsstand-read", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        ...magazineSpine("cs", { x: 200, y: 60, count: 10, z: 1 }),
        ...mastheadRule("cm", { x: 200, y: 680, w: 1200, z: 2 }),
        ...issueBadge("ci", { x: 1320, y: 620, size: 120, z: 3 }),
        circle("pulse-bg", 1345, 645, 70, "surface", { z: 4, morphId: "pulse-bg" }),
        text("title", 80, 720, 1440, 100, 88, "title", "ink", { ...display, align: "center", morphId: "title", z: 3 }),
        text("copy0", 80, 840, 1440, 40, 24, "copy0", "muted", { align: "center", z: 3 }),
      ])
    );
    return kits;
  },
};

runTemplates([marquee, strike, apiary, newsstand]).catch((e) => {
  console.error(e);
  process.exit(1);
});
