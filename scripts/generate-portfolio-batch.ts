/**
 * Portfolio decks — four unique showcase systems (not recolors of hearth/oxide).
 *
 *   vitrine-case     — museum vitrine / plinth
 *   dossier-clip     — clipped paper dossier
 *   mezzanine-cube   — white-cube gallery
 *   platepress-rack  — printmaker plate rack
 *
 *   node -r ts-node/register/transpile-only scripts/generate-portfolio-batch.ts [--publish-local] [--only=id]
 */
import { Template, text, rect, circle, photo, writeKit, runTemplates, El } from "./lib/designKit";
import {
  glassPane,
  plinthBlock,
  captionRail,
  clipBar,
  tabIndex,
  folioSheet,
  whiteCube,
  wallLabel,
  pedestalDot,
  plateRack,
  inkWell,
  pullPrint,
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

for (const family of ["vitrine", "dossier", "mezzanine", "platepress"]) {
  const sel = familySel(family);
  if (sel) assertUniqueSel(family, sel.units);
}

const vitrine: Template = {
  id: "vitrine-case",
  name: "Vitrine • Case",
  description: "Museum portfolio — glass vitrine cover, plinth works, caption rails and a view close.",
  family: "vitrine",
  motion: FLAGSHIP_MOTION,
  brand: {
    colors: {
      bg: "#E8E6E1",
      surface: "#F5F3EE",
      surface_color: "#D8D5CE",
      ink: "#1C1F24",
      muted: "#6F737A",
      accent: "#8B7355",
      line: "#C4C0B8",
    },
    fonts: { display: "Playfair Display", body: "Georgia" },
  },
  slides: [
    { role: "cover", title: "Vitrine", items: ["Case study · selected works", "on view", "08"], photoQuery: "092c8c1420fb" },
    { role: "feature", title: "Works", items: ["Study I", "charcoal on linen", "Study II", "ink wash", "Study III", "bronze maquette", "Three objects. One case."], photoQuery: "141ae86a78f3" },
    { role: "feature", title: "Plinth", items: ["Left", "earliest cast", "Center", "hero piece", "Right", "late revision"], photoQuery: "16df8343dc3d" },
    { role: "feature", title: "Labels", items: ["01", "Title", "02", "Medium", "03", "Year", "04", "Note"] },
    { role: "feature", title: "Distance makes the work quieter.", items: ["— Gallery notes"], photoQuery: "092c8c1420fb" },
    { role: "closing", title: "View.", items: ["Vitrine Case · by appointment"] },
  ],
  kits: () => {
    const f = "vitrine";
    const kits = [];
    kits.push(
      writeKit("cover", "vitrine-cover", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        ...glassPane("gp", { x: 180, y: 60, w: 1240, h: 560, z: 1 }),
        ...plinthBlock("pl", { x: 480, y: 640, w: 640, h: 90, z: 2 }),
        text("copy0", 80, 780, 700, 40, 20, "copy0", "muted", { ...kicker, z: 3 }),
        text("title", 80, 820, 700, 60, 48, "title", "ink", { ...display, ...serif, morphId: "title", z: 3 }),
        text("copy1", 1000, 830, 300, 40, 24, "copy1", "accent", { align: "right", z: 3 }),
        circle("badge", 1380, 760, 120, "accent", { z: 3, morphId: "accent" }),
        text("copy2", 1405, 795, 70, 60, 36, "copy2", "bg", { ...stat, align: "center", z: 4 }),
      ])
    );
    {
      const works: El[] = [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 40, 900, 80, 56, "title", "ink", { ...display, ...serif, morphId: "title" }),
        ...glassPane("w1", { x: 580, y: 140, w: 460, h: 480, z: 1 }),
        rect("w0frame", 80, 140, 460, 480, "surface_color", { z: 1 }),
        rect("w0glass", 108, 168, 404, 424, "surface", { z: 2, opacity: 0.4 }),
        rect("w2frame", 1080, 140, 460, 480, "surface_color", { z: 1 }),
        rect("w2glass", 1108, 168, 404, 424, "surface", { z: 2, opacity: 0.4 }),
      ];
      for (let i = 0; i < 3; i++) {
        const x = 80 + i * 500;
        works.push(...captionRail("c" + i, { x, y: 660, w: 460, h: 110, z: 3 }));
        works.push(text("copy" + i * 2, x + 30, 675, 400, 50, 26, "copy" + i * 2, "ink", { ...serif, z: 4 }));
        works.push(text("copy" + (i * 2 + 1), x + 30, 730, 400, 30, 18, "copy" + (i * 2 + 1), "muted", { z: 4 }));
      }
      works.push(text("copy6", 80, 800, 1400, 40, 24, "copy6", "muted"));
      kits.push(writeKit("feature", "vitrine-works", f, works));
    }
    kits.push(
      writeKit("feature", "vitrine-plinth", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 40, 700, 80, 56, "title", "ink", { ...display, ...serif, morphId: "title" }),
        photo("photo", 860, 120, 660, 680, { zoom: 1.2, z: 1 }),
        ...plinthBlock("p0", { x: 80, y: 160, w: 700, h: 160, z: 2 }),
        text("copy0", 110, 185, 640, 50, 24, "copy0", "accent", { ...kicker, z: 3 }),
        text("copy1", 110, 245, 640, 50, 24, "copy1", "ink", { z: 3 }),
        ...plinthBlock("p1", { x: 80, y: 360, w: 700, h: 160, z: 2 }),
        text("copy2", 110, 385, 640, 50, 24, "copy2", "accent", { ...kicker, z: 3 }),
        text("copy3", 110, 445, 640, 50, 24, "copy3", "ink", { z: 3 }),
        ...plinthBlock("p2", { x: 80, y: 560, w: 700, h: 160, z: 2 }),
        text("copy4", 110, 585, 640, 50, 24, "copy4", "accent", { ...kicker, z: 3 }),
        text("copy5", 110, 645, 640, 50, 24, "copy5", "ink", { z: 3 }),
      ])
    );
    {
      const labels: El[] = [rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }), text("title", 80, 50, 1400, 90, 64, "title", "ink", { ...display, ...serif, morphId: "title" })];
      for (let i = 0; i < 4; i++) {
        const y = 180 + i * 150;
        labels.push(...captionRail("l" + i, { x: 80, y, w: 1440, h: 120, z: 1 }));
        labels.push(text("copy" + i * 2, 120, y + 25, 200, 60, 40, "copy" + i * 2, "accent", { ...display, ...serif, z: 2 }));
        labels.push(text("copy" + (i * 2 + 1), 360, y + 35, 1100, 50, 32, "copy" + (i * 2 + 1), "ink", { z: 2 }));
      }
      kits.push(writeKit("feature", "vitrine-labels", f, labels));
    }
    kits.push(
      writeKit("feature", "vitrine-quote", f, [
        rect("bg", 0, 0, 1600, 900, "surface", { z: 0 }),
        ...captionRail("q", { x: 400, y: 280, w: 800, h: 40, z: 1 }),
        text("title", 160, 360, 1280, 180, 56, "title", "ink", { ...display, ...serif, textStyleRole: "quote", align: "center", lineHeight: 1.2, z: 2 }),
        text("copy0", 160, 580, 1280, 40, 24, "copy0", "accent", { align: "center", z: 2 }),
      ])
    );
    kits.push(
      writeKit("closing", "vitrine-view", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        rect("cgframe", 320, 60, 960, 420, "surface_color", { z: 1, morphId: "plate" }),
        rect("cgglass", 348, 88, 904, 364, "surface", { z: 2, opacity: 0.45 }),
        ...plinthBlock("cp", { x: 520, y: 520, w: 560, h: 80, z: 3 }),
        circle("pulse-bg", 760, 220, 100, "accent", { z: 3, morphId: "pulse-bg", opacity: 0.5 }),
        text("title", 80, 640, 1440, 120, 96, "title", "ink", { ...display, ...serif, align: "center", morphId: "title", z: 4 }),
        text("copy0", 80, 780, 1440, 40, 24, "copy0", "muted", { align: "center", z: 4 }),
      ])
    );
    return kits;
  },
};

const dossier: Template = {
  id: "dossier-clip",
  name: "Dossier • Clip",
  description: "Clipped dossier portfolio — binder sheets, index tabs, case pages and a filed close.",
  family: "dossier",
  motion: FLAGSHIP_MOTION,
  brand: {
    colors: {
      bg: "#1A1C18",
      surface: "#2A2E28",
      surface_color: "#3A4036",
      ink: "#F2EFE6",
      muted: "#9AA094",
      accent: "#C4A35A",
      line: "#4A5248",
    },
    fonts: { display: "Rockwell", body: "Georgia" },
  },
  slides: [
    { role: "cover", title: "DOSSIER", items: ["Clip set · selected briefs", "confidential", "A"], photoQuery: "01c1358c7bf8" },
    { role: "feature", title: "Index", items: ["Brief", "scope locked", "Research", "field notes", "Build", "prototype", "Review", "sign-off", "Ship", "handoff"], photoQuery: "05b78bfac32c" },
    { role: "feature", title: "Pages", items: ["Problem", "What broke the old flow.", "Approach", "Clip only what matters.", "Outcome", "Quiet, measurable lift."], photoQuery: "0aaf07e051b3" },
    { role: "feature", title: "Order", items: ["01", "Collect", "02", "Clip", "03", "Annotate", "04", "File"] },
    { role: "feature", title: "Keep the brief thin.", items: ["— Studio lead"], photoQuery: "01c1358c7bf8" },
    { role: "closing", title: "Filed.", items: ["Dossier Clip · archive"] },
  ],
  kits: () => {
    const f = "dossier";
    const kits = [];
    kits.push(
      writeKit("cover", "dossier-cover", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        ...folioSheet("fs", { x: 140, y: 80, w: 1180, h: 700, stack: 3, z: 1 }),
        ...clipBar("cb", { x: 620, y: 40, w: 280, z: 4 }),
        ...tabIndex("ti", { x: 1360, y: 180, count: 5, z: 2 }),
        photo("photo", 220, 160, 1020, 420, { zoom: 1.15, z: 3 }),
        text("copy0", 220, 620, 700, 40, 20, "copy0", "muted", { ...kicker, z: 4 }),
        text("title", 220, 670, 900, 80, 64, "title", "ink", { ...display, morphId: "title", z: 4 }),
        text("copy1", 220, 760, 500, 40, 28, "copy1", "accent", { z: 4 }),
        text("copy2", 1380, 210, 60, 50, 36, "copy2", "bg", { ...stat, align: "center", z: 3 }),
      ])
    );
    {
      const index: El[] = [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 50, 900, 90, 64, "title", "ink", { ...display, morphId: "title" }),
        ...tabIndex("ix", { x: 1420, y: 160, count: 5, z: 1 }),
      ];
      for (let i = 0; i < 5; i++) {
        const y = 160 + i * 120;
        index.push(rect("row" + i, 80, y, 1280, 100, i % 2 ? "surface" : "surface_color", { z: 1, morphId: i === 0 ? "plate" : undefined }));
        index.push(text("copy" + i * 2, 120, y + 25, 360, 50, 32, "copy" + i * 2, "accent", { ...display, z: 2 }));
        index.push(text("copy" + (i * 2 + 1), 520, y + 30, 780, 40, 26, "copy" + (i * 2 + 1), "ink", { z: 2 }));
      }
      kits.push(writeKit("feature", "dossier-index", f, index));
    }
    kits.push(
      writeKit("feature", "dossier-pages", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 40, 700, 80, 56, "title", "ink", { ...display, morphId: "title" }),
        photo("photo", 920, 140, 600, 640, { zoom: 1.2, z: 1 }),
        ...folioSheet("pg", { x: 80, y: 140, w: 780, h: 640, stack: 2, z: 2 }),
        text("copy0", 140, 200, 660, 50, 32, "copy0", "accent", { ...kicker, z: 4 }),
        text("copy1", 140, 270, 660, 80, 28, "copy1", "ink", { z: 4, lineHeight: 1.3 }),
        text("copy2", 140, 400, 660, 50, 32, "copy2", "accent", { ...kicker, z: 4 }),
        text("copy3", 140, 470, 660, 80, 28, "copy3", "ink", { z: 4, lineHeight: 1.3 }),
        text("copy4", 140, 600, 660, 50, 32, "copy4", "accent", { ...kicker, z: 4 }),
        text("copy5", 140, 670, 660, 80, 28, "copy5", "ink", { z: 4, lineHeight: 1.3 }),
      ])
    );
    {
      const order: El[] = [rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }), text("title", 80, 50, 1400, 90, 64, "title", "ink", { ...display, morphId: "title" }), ...clipBar("oc", { x: 680, y: 140, w: 240, z: 2 })];
      for (let i = 0; i < 4; i++) {
        const x = 80 + i * 380;
        order.push(rect("step" + i, x, 240, 340, 480, "surface", { z: 1, morphId: i === 0 ? "plate" : undefined }));
        order.push(text("copy" + i * 2, x + 30, 300, 280, 80, 56, "copy" + i * 2, "accent", { ...stat, z: 2 }));
        order.push(text("copy" + (i * 2 + 1), x + 30, 420, 280, 120, 36, "copy" + (i * 2 + 1), "ink", { z: 2 }));
      }
      kits.push(writeKit("feature", "dossier-order", f, order));
    }
    kits.push(
      writeKit("feature", "dossier-quote", f, [
        photo("photo", 0, 0, 1600, 900, { zoom: 1.1 }),
        ...folioSheet("qq", { x: 280, y: 220, w: 1040, h: 420, stack: 2, z: 2 }),
        ...clipBar("qc", { x: 680, y: 180, w: 240, z: 4 }),
        text("title", 360, 340, 880, 160, 56, "title", "ink", { ...display, textStyleRole: "quote", align: "center", z: 4 }),
        text("copy0", 360, 540, 880, 40, 24, "copy0", "accent", { align: "center", z: 4 }),
      ])
    );
    kits.push(
      writeKit("closing", "dossier-filed", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        ...folioSheet("cf", { x: 260, y: 80, w: 1000, h: 480, stack: 3, z: 1 }),
        ...clipBar("cc", { x: 660, y: 40, w: 280, z: 4 }),
        ...tabIndex("ct", { x: 1320, y: 140, count: 4, z: 2 }),
        circle("pulse-bg", 740, 260, 120, "accent", { z: 3, morphId: "pulse-bg" }),
        text("title", 80, 620, 1440, 120, 100, "title", "ink", { ...display, align: "center", morphId: "title", z: 3 }),
        text("copy0", 80, 780, 1440, 40, 26, "copy0", "muted", { align: "center", z: 3 }),
      ])
    );
    return kits;
  },
};

const mezzanine: Template = {
  id: "mezzanine-cube",
  name: "Mezzanine • Cube",
  description: "White-cube gallery portfolio — wall works, didactic labels, pedestal markers and an install close.",
  family: "mezzanine",
  motion: FLAGSHIP_MOTION,
  brand: {
    colors: {
      bg: "#F7F7F5",
      surface: "#FFFFFF",
      surface_color: "#ECECE8",
      ink: "#111111",
      muted: "#6B6B6B",
      accent: "#E10600",
      line: "#D0D0CC",
    },
    fonts: { display: "Antonio", body: "Calibri" },
  },
  slides: [
    { role: "cover", title: "MEZZANINE", items: ["Cube · installation view", "level 2", "02"], photoQuery: "0ca17fecb06d" },
    { role: "feature", title: "Hang", items: ["North", "triptych", "East", "single large", "South", "study wall", "West", "projection"], photoQuery: "005c50a2a14e" },
    { role: "feature", title: "Didactics", items: ["Artist", "name only", "Title", "italic, soft", "Year", "flush right"], photoQuery: "030052bf4adb" },
    { role: "feature", title: "Walk", items: ["01", "Enter", "02", "Pause", "03", "Circle", "04", "Exit"] },
    { role: "feature", title: "The room does half the work.", items: ["— Install notes"], photoQuery: "0ca17fecb06d" },
    { role: "closing", title: "Install.", items: ["Mezzanine Cube · open hours"] },
  ],
  kits: () => {
    const f = "mezzanine";
    const kits = [];
    kits.push(
      writeKit("cover", "mezz-cover", f, [
        ...whiteCube("wc", { x: 0, y: 0, w: 1600, h: 900, z: 0 }),
        photo("photo", 280, 80, 1040, 560, { zoom: 1.1, z: 1 }),
        ...wallLabel("wl", { x: 280, y: 680, w: 480, h: 140, z: 2 }),
        text("copy0", 310, 720, 420, 30, 18, "copy0", "muted", { ...kicker, z: 3 }),
        text("title", 310, 760, 420, 50, 40, "title", "ink", { ...display, morphId: "title", z: 3 }),
        ...pedestalDot("pd", { x: 360, y: 860, count: 4, gap: 240, size: 24, z: 2 }),
        text("copy1", 900, 720, 400, 40, 24, "copy1", "accent", { z: 3 }),
        text("copy2", 1400, 100, 120, 80, 56, "copy2", "accent", { ...stat, z: 3 }),
      ])
    );
    kits.push(
      writeKit("feature", "mezz-hang", f, [
        ...whiteCube("h", { z: 0 }),
        text("title", 80, 40, 900, 80, 56, "title", "ink", { ...display, morphId: "title" }),
        photo("photo", 80, 140, 700, 320, { zoom: 1.2, z: 1 }),
        rect("p1", 820, 140, 700, 320, "surface_color", { z: 1 }),
        rect("p2", 80, 500, 700, 280, "surface_color", { z: 1 }),
        rect("p3", 820, 500, 700, 280, "surface", { z: 1, morphId: "plate" }),
        text("copy0", 110, 180, 640, 40, 28, "copy0", "accent", { ...kicker, z: 2 }),
        text("copy1", 110, 230, 640, 40, 26, "copy1", "ink", { z: 2 }),
        text("copy2", 850, 180, 640, 40, 28, "copy2", "accent", { ...kicker, z: 2 }),
        text("copy3", 850, 230, 640, 40, 26, "copy3", "ink", { z: 2 }),
        text("copy4", 110, 540, 640, 40, 28, "copy4", "accent", { ...kicker, z: 2 }),
        text("copy5", 110, 590, 640, 40, 26, "copy5", "ink", { z: 2 }),
        text("copy6", 850, 540, 640, 40, 28, "copy6", "accent", { ...kicker, z: 2 }),
        text("copy7", 850, 590, 640, 40, 26, "copy7", "ink", { z: 2 }),
      ])
    );
    kits.push(
      writeKit("feature", "mezz-didactics", f, [
        ...whiteCube("d", { z: 0 }),
        text("title", 80, 40, 800, 80, 56, "title", "ink", { ...display, morphId: "title" }),
        photo("photo", 900, 140, 620, 640, { zoom: 1.15, z: 1 }),
        ...wallLabel("a", { x: 80, y: 160, w: 740, h: 180, z: 2 }),
        text("copy0", 120, 210, 660, 40, 28, "copy0", "accent", { ...kicker, z: 3 }),
        text("copy1", 120, 270, 660, 40, 26, "copy1", "ink", { z: 3 }),
        ...wallLabel("b", { x: 80, y: 380, w: 740, h: 180, z: 2 }),
        text("copy2", 120, 430, 660, 40, 28, "copy2", "accent", { ...kicker, z: 3 }),
        text("copy3", 120, 490, 660, 40, 26, "copy3", "ink", { z: 3 }),
        ...wallLabel("c", { x: 80, y: 600, w: 740, h: 180, z: 2 }),
        text("copy4", 120, 650, 660, 40, 28, "copy4", "accent", { ...kicker, z: 3 }),
        text("copy5", 120, 710, 660, 40, 26, "copy5", "ink", { z: 3 }),
      ])
    );
    {
      const walk: El[] = [
        ...whiteCube("w", { z: 0 }),
        text("title", 80, 50, 1400, 90, 64, "title", "ink", { ...display, morphId: "title" }),
        ...pedestalDot("wd", { x: 200, y: 780, count: 4, gap: 320, size: 32, z: 1 }),
      ];
      for (let i = 0; i < 4; i++) {
        const x = 80 + i * 380;
        walk.push(rect("step" + i, x, 200, 340, 480, "surface", { z: 1, morphId: i === 0 ? "plate" : undefined }));
        walk.push(text("copy" + i * 2, x + 30, 280, 280, 80, 56, "copy" + i * 2, "accent", { ...stat, z: 2 }));
        walk.push(text("copy" + (i * 2 + 1), x + 30, 400, 280, 100, 36, "copy" + (i * 2 + 1), "ink", { z: 2 }));
      }
      kits.push(writeKit("feature", "mezz-walk", f, walk));
    }
    kits.push(
      writeKit("feature", "mezz-quote", f, [
        ...whiteCube("q", { z: 0 }),
        ...wallLabel("ql", { x: 560, y: 300, w: 480, h: 40, z: 1 }),
        text("title", 160, 380, 1280, 160, 56, "title", "ink", { ...display, textStyleRole: "quote", align: "center", z: 2 }),
        text("copy0", 160, 580, 1280, 40, 24, "copy0", "accent", { align: "center", z: 2 }),
        ...pedestalDot("qd", { x: 500, y: 720, count: 3, gap: 200, z: 1 }),
      ])
    );
    kits.push(
      writeKit("closing", "mezz-install", f, [
        ...whiteCube("c", { z: 0 }),
        rect("frame", 400, 80, 800, 420, "surface_color", { z: 1, morphId: "plate" }),
        ...wallLabel("cl", { x: 560, y: 200, w: 480, h: 160, z: 2 }),
        circle("pulse-bg", 740, 240, 100, "accent", { z: 3, morphId: "pulse-bg" }),
        text("title", 80, 560, 1440, 120, 96, "title", "ink", { ...display, align: "center", morphId: "title", z: 3 }),
        text("copy0", 80, 720, 1440, 40, 24, "copy0", "muted", { align: "center", z: 3 }),
        ...pedestalDot("cd", { x: 400, y: 820, count: 4, gap: 200, z: 2 }),
      ])
    );
    return kits;
  },
};

const platepress: Template = {
  id: "platepress-rack",
  name: "Platepress • Rack",
  description: "Printmaker portfolio — plate rack cover, ink well, pull prints and a pull close.",
  family: "platepress",
  motion: FLAGSHIP_MOTION,
  brand: {
    colors: {
      bg: "#12110F",
      surface: "#1E1C18",
      surface_color: "#2C2922",
      ink: "#F5F0E6",
      muted: "#9A9488",
      accent: "#3D6FBF",
      line: "#3A362E",
    },
    fonts: { display: "Impact", body: "Georgia" },
  },
  slides: [
    { role: "cover", title: "PLATEPRESS", items: ["Rack · edition notes", "pull", "07"], photoQuery: "50597e1fdb" },
    { role: "feature", title: "Plates", items: ["Copper", "line cut", "Zinc", "aquatint", "Wood", "relief", "Stone", "litho", "Slot by medium."], photoQuery: "07c71ad45242" },
    { role: "feature", title: "Pulls", items: ["Artist proof", "first clean pull", "Edition", "numbered stack", "State", "before wipe"], photoQuery: "0506d14bb966" },
    { role: "feature", title: "Press", items: ["01", "Ink", "02", "Wipe", "03", "Pull", "04", "Dry"] },
    { role: "feature", title: "Pressure remembers the hand.", items: ["— Print shop"], photoQuery: "50597e1fdb" },
    { role: "closing", title: "Pull.", items: ["Platepress Rack · edition"] },
  ],
  kits: () => {
    const f = "platepress";
    const kits = [];
    kits.push(
      writeKit("cover", "press-cover", f, [
        photo("photo", 0, 0, 1600, 900, { morphId: "hero", zoom: 1.15 }),
        rect("scrim", 0, 0, 820, 900, "bg", { z: 2, opacity: 0.72, morphId: "titlePlate" }),
        ...plateRack("pr", { x: 900, y: 120, slots: 4, z: 3 }),
        text("copy0", 70, 90, 700, 40, 20, "copy0", "muted", { ...kicker, z: 4 }),
        text("title", 55, 220, 740, 220, 100, "title", "ink", { ...display, morphId: "title", z: 4 }),
        text("copy1", 70, 500, 500, 50, 36, "copy1", "accent", { z: 4 }),
        ...inkWell("iw", { x: 70, y: 620, size: 160, z: 4 }),
        text("copy2", 100, 670, 100, 70, 40, "copy2", "bg", { ...stat, align: "center", z: 5 }),
      ])
    );
    {
      const plates: El[] = [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 50, 900, 90, 64, "title", "ink", { ...display, morphId: "title" }),
        ...plateRack("pl", { x: 80, y: 160, slots: 6, z: 1 }),
      ];
      for (let i = 0; i < 4; i++) {
        plates.push(text("copy" + i * 2, 100 + i * 160, 700, 120, 40, 22, "copy" + i * 2, i === 0 ? "accent" : "muted", { align: "center", z: 2 }));
        plates.push(text("copy" + (i * 2 + 1), 100 + i * 160, 750, 120, 40, 18, "copy" + (i * 2 + 1), "ink", { align: "center", z: 2 }));
      }
      plates.push(text("copy8", 80, 840, 1200, 40, 24, "copy8", "muted"));
      kits.push(writeKit("feature", "press-plates", f, plates));
    }
    kits.push(
      writeKit("feature", "press-pulls", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 40, 700, 80, 56, "title", "ink", { ...display, morphId: "title" }),
        ...pullPrint("pp", { x: 80, y: 140, w: 720, h: 640, z: 1 }),
        rect("c0", 860, 140, 660, 180, "surface", { z: 2, morphId: "plate" }),
        text("copy0", 900, 170, 580, 40, 28, "copy0", "accent", { ...kicker, z: 3 }),
        text("copy1", 900, 230, 580, 50, 26, "copy1", "ink", { z: 3 }),
        rect("c1", 860, 360, 660, 180, "surface_color", { z: 2 }),
        text("copy2", 900, 390, 580, 40, 28, "copy2", "accent", { ...kicker, z: 3 }),
        text("copy3", 900, 450, 580, 50, 26, "copy3", "ink", { z: 3 }),
        rect("c2", 860, 580, 660, 180, "surface", { z: 2 }),
        text("copy4", 900, 610, 580, 40, 28, "copy4", "accent", { ...kicker, z: 3 }),
        text("copy5", 900, 670, 580, 50, 26, "copy5", "ink", { z: 3 }),
      ])
    );
    {
      const press: El[] = [rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }), text("title", 80, 50, 1400, 90, 64, "title", "ink", { ...display, morphId: "title" }), ...inkWell("pw", { x: 1320, y: 40, size: 120, z: 2 })];
      for (let i = 0; i < 4; i++) {
        const y = 180 + i * 150;
        press.push(rect("bar" + i, 80, y, 1200, 120, i % 2 ? "surface" : "surface_color", { z: 1 }));
        press.push(text("copy" + i * 2, 120, y + 25, 200, 70, 48, "copy" + i * 2, "accent", { ...display }));
        press.push(text("copy" + (i * 2 + 1), 360, y + 35, 860, 50, 36, "copy" + (i * 2 + 1), "ink"));
      }
      kits.push(writeKit("feature", "press-steps", f, press));
    }
    kits.push(
      writeKit("feature", "press-quote", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        ...pullPrint("pq", { x: 360, y: 160, w: 880, h: 520, z: 2 }),
        text("title", 420, 280, 760, 200, 48, "title", "ink", { ...display, textStyleRole: "quote", align: "center", z: 4 }),
        text("copy0", 420, 520, 760, 40, 24, "copy0", "accent", { align: "center", z: 4 }),
      ])
    );
    kits.push(
      writeKit("closing", "press-pull", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        ...plateRack("cr", { x: 280, y: 40, slots: 6, z: 1 }),
        ...inkWell("cw", { x: 720, y: 560, size: 140, z: 2 }),
        circle("pulse-bg", 755, 595, 70, "accent", { z: 3, morphId: "pulse-bg" }),
        text("title", 80, 740, 1440, 120, 72, "title", "ink", { ...display, align: "center", morphId: "title", z: 3 }),
        text("copy0", 80, 860, 1440, 30, 22, "copy0", "muted", { align: "center", z: 3 }),
      ])
    );
    return kits;
  },
};

runTemplates([vitrine, dossier, mezzanine, platepress]).catch((e) => {
  console.error(e);
  process.exit(1);
});
