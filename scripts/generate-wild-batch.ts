/**
 * Wild creative templates — presentation-first silhouettes with alien metaphors.
 * Motifs accent the deck; photos + talk track carry it (oxide/hearth pattern).
 *
 *   abyss-sonar     — deep-ocean dive brief
 *   eclipse-vault   — planetarium night
 *   voltaic-foundry — foundry pour night
 *   prism-crypt     — stained-glass hall
 *
 *   node -r ts-node/register/transpile-only scripts/generate-wild-batch.ts [--publish-local] [--only=id]
 */
import { Template, text, rect, circle, photo, writeKit, runTemplates, El } from "./lib/designKit";
import {
  sonarRings,
  pressureGauge,
  constellationMap,
  eclipseBite,
  heatBars,
  pourPath,
  prismShards,
  spectrumStrip,
  roseWindow,
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

for (const family of ["abyss", "eclipse", "voltaic", "prism"]) {
  const sel = familySel(family);
  if (sel) assertUniqueSel(family, sel.units);
}

const abyss: Template = {
  id: "abyss-sonar",
  name: "Abyss • Sonar",
  description: "Deep-ocean dive brief — full-bleed sonar cover, contact list, porthole split, pressure board and dive close.",
  family: "abyss",
  motion: FLAGSHIP_MOTION,
  brand: {
    colors: {
      bg: "#021018",
      surface: "#0A2230",
      surface_color: "#123848",
      ink: "#E8F7F4",
      muted: "#7AA4B0",
      accent: "#2EF3C5",
      line: "#1A4A5C",
    },
    fonts: { display: "Orbitron", body: "Space Grotesk" },
  },
  slides: [
    {
      role: "cover",
      title: "ABYSS",
      items: ["Sonar lab · 4100m", "dive brief", "01"],
      photoQuery: "005c50a2a14e",
    },
    {
      role: "feature",
      title: "Contacts",
      items: ["Alpha", "1200m — soft return", "Bravo", "2400m — hard ping", "Charlie", "4100m — hull check", "Three pings. One hull."],
    },
    {
      role: "feature",
      title: "Through the glass",
      items: ["Black water", "Green return holds the beam longer than sight.", "Keep the lamp low", "Listen before you push ballast."],
      photoQuery: "0ca17fecb06d",
    },
    {
      role: "feature",
      title: "Board",
      items: ["01", "Set depth", "02", "Open ballast", "03", "Hold beam", "04", "Log return"],
    },
    {
      role: "feature",
      title: "Listen longer.",
      items: ["— Dive log, trench 7"],
      photoQuery: "005c50a2a14e",
    },
    {
      role: "closing",
      title: "Dive.",
      items: ["Abyss Sonar · night watch"],
    },
  ],
  kits: () => {
    const f = "abyss";
    const kits = [];

    kits.push(
      writeKit("cover", "abyss-dive", f, [
        photo("photo", 0, 0, 1600, 900, { morphId: "hero", zoom: 1.15 }),
        rect("scrim", 0, 0, 920, 900, "bg", { z: 2, opacity: 0.62, morphId: "titlePlate" }),
        ...sonarRings("sr", { x: 1080, y: 480, size: 420, rings: 3, z: 3 }),
        text("copy0", 70, 90, 700, 40, 22, "copy0", "muted", { ...kicker, z: 4 }),
        text("title", 60, 220, 820, 220, 160, "title", "ink", {
          ...display,
          typeTreatment: "outline",
          letterSpacing: 4,
          lineHeight: 0.92,
          z: 4,
          morphId: "title",
        }),
        text("copy1", 70, 500, 700, 70, 48, "copy1", "accent", { ...display, z: 4 }),
        circle("badge", 1280, 80, 180, "accent", { z: 4, morphId: "accent" }),
        text("copy2", 1300, 125, 140, 90, 64, "copy2", "bg", { ...stat, align: "center", z: 5 }),
      ])
    );

    const contacts: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1200, 90, 64, "title", "ink", { ...display, morphId: "title" }),
      ...sonarRings("map", { x: 1180, y: 140, size: 360, rings: 3, z: 1 }),
    ];
    for (let i = 0; i < 3; i++) {
      const y = 180 + i * 170;
      contacts.push(rect("row" + i, 80, y, 1000, 140, i % 2 ? "surface" : "surface_color", { z: 2, morphId: i === 0 ? "plate" : undefined }));
      contacts.push(text("copy" + i * 2, 120, y + 35, 320, 60, 40, "copy" + i * 2, "accent", { ...display }));
      contacts.push(text("copy" + (i * 2 + 1), 460, y + 40, 560, 60, 32, "copy" + (i * 2 + 1), "ink"));
    }
    contacts.push(text("copy6", 80, 760, 1000, 50, 28, "copy6", "muted"));
    kits.push(writeKit("feature", "abyss-contacts", f, contacts));

    kits.push(
      writeKit("feature", "abyss-glass", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 40, 700, 80, 56, "title", "ink", { ...display, morphId: "title" }),
        photo("photo", 820, 120, 700, 680, { zoom: 1.25, alignX: 0.4, z: 1 }),
        circle("ring", 860, 160, 620, "accent", { z: 2, opacity: 0.2 }),
        rect("card0", 80, 180, 680, 240, "surface", { z: 2, morphId: "plate" }),
        text("copy0", 110, 220, 600, 50, 32, "copy0", "accent", { ...kicker }),
        text("copy1", 110, 290, 600, 90, 28, "copy1", "ink", { lineHeight: 1.3 }),
        rect("card1", 80, 460, 680, 240, "surface_color", { z: 2 }),
        text("copy2", 110, 500, 600, 50, 32, "copy2", "accent", { ...kicker }),
        text("copy3", 110, 570, 600, 90, 28, "copy3", "ink", { lineHeight: 1.3 }),
        ...pressureGauge("g", { x: 80, y: 740, size: 100, z: 3 }),
      ])
    );

    const board: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1400, 90, 64, "title", "ink", { ...display, morphId: "title" }),
    ];
    for (let i = 0; i < 4; i++) {
      const y = 180 + i * 160;
      board.push(rect("bar" + i, 80, y, 1440, 130, i % 2 ? "surface" : "surface_color", { z: 1 }));
      board.push(text("copy" + i * 2, 120, y + 30, 180, 70, 52, "copy" + i * 2, "accent", { ...display }));
      board.push(text("copy" + (i * 2 + 1), 340, y + 40, 1100, 60, 40, "copy" + (i * 2 + 1), "ink"));
    }
    kits.push(writeKit("feature", "abyss-board", f, board));

    kits.push(
      writeKit("feature", "abyss-quote", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        ...sonarRings("qq", { x: 780, y: -80, size: 900, rings: 4, z: 1 }),
        text("title", 80, 300, 900, 220, 80, "title", "ink", {
          ...display,
          textStyleRole: "quote",
          lineHeight: 1.1,
          z: 3,
        }),
        text("copy0", 80, 560, 700, 50, 26, "copy0", "accent", { z: 3 }),
        rect("rule", 80, 640, 240, 6, "accent", { z: 3 }),
      ])
    );

    kits.push(
      writeKit("closing", "abyss-close", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        ...sonarRings("c", { x: 280, y: -40, size: 1040, rings: 5, z: 1 }),
        circle("pulse-bg", 680, 360, 240, "accent", { z: 2, morphId: "pulse-bg" }),
        text("title", 80, 420, 1440, 140, 120, "title", "bg", { ...display, align: "center", morphId: "title", z: 3 }),
        text("copy0", 80, 780, 1440, 50, 28, "copy0", "muted", { align: "center", z: 3 }),
        rect("keel", 0, 860, 1600, 40, "accent", { z: 3 }),
      ])
    );

    return kits;
  },
};

const eclipse: Template = {
  id: "eclipse-vault",
  name: "Eclipse • Vault",
  description: "Planetarium night — photo cover with eclipse accent, star routes, orbit cards, phase grid and look-up close.",
  family: "eclipse",
  motion: FLAGSHIP_MOTION,
  brand: {
    colors: {
      bg: "#07060A",
      surface: "#14121A",
      surface_color: "#221E2A",
      ink: "#F3EFE6",
      muted: "#9A9288",
      accent: "#E8C36A",
      line: "#3A342C",
    },
    fonts: { display: "Playfair Display", body: "Space Grotesk" },
  },
  slides: [
    {
      role: "cover",
      title: "ECLIPSE",
      items: ["Vault 09 · totality", "night program", "09"],
      photoQuery: "01f388406977",
    },
    {
      role: "feature",
      title: "Routes",
      items: ["Lyra", "Vega holds the wire", "Cygnus", "Deneb marks the wing", "Orion", "Rigel opens the belt", "Draw the night in ink."],
    },
    {
      role: "feature",
      title: "Dome seats",
      items: ["Inner ring", "Closest to the lamp — short stories.", "Mid ring", "Best totality view, two hours.", "Outer ring", "Quiet seats for late arrivals."],
      photoQuery: "0aaf07e051b3",
    },
    {
      role: "feature",
      title: "Phases",
      items: ["Wax", "opening", "Full", "hold", "Wane", "release", "New", "reset"],
    },
    {
      role: "feature",
      title: "Totality is brief.",
      items: ["— Observatory note"],
      photoQuery: "01f388406977",
    },
    {
      role: "closing",
      title: "Look up.",
      items: ["Eclipse Vault · dome open"],
    },
  ],
  kits: () => {
    const f = "eclipse";
    const kits = [];

    kits.push(
      writeKit("cover", "eclipse-night", f, [
        photo("photo", 0, 0, 1600, 900, { morphId: "hero", zoom: 1.2, alignY: 0.35 }),
        rect("scrim", 0, 480, 1600, 420, "bg", { z: 2, opacity: 0.78, morphId: "titlePlate" }),
        ...eclipseBite("ec", { x: 1180, y: 40, size: 360, offset: 100, z: 3 }),
        text("copy0", 80, 540, 900, 40, 22, "copy0", "muted", { ...kicker, z: 4 }),
        text("title", 70, 600, 1100, 140, 110, "title", "ink", { ...display, ...serif, z: 4, morphId: "title" }),
        text("copy1", 80, 760, 700, 50, 32, "copy1", "accent", { z: 4 }),
        circle("badge", 1360, 700, 160, "accent", { z: 4, morphId: "accent" }),
        text("copy2", 1380, 745, 120, 80, 48, "copy2", "bg", { ...stat, align: "center", z: 5 }),
      ])
    );

    const routes: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 900, 90, 64, "title", "ink", { ...display, ...serif, morphId: "title" }),
      ...constellationMap("cm", {
        x: 900,
        y: 140,
        w: 620,
        h: 620,
        z: 1,
      }),
    ];
    for (let i = 0; i < 3; i++) {
      const y = 170 + i * 180;
      routes.push(rect("row" + i, 80, y, 760, 150, "surface", { z: 2, morphId: i === 0 ? "plate" : undefined }));
      routes.push(text("copy" + i * 2, 110, y + 25, 640, 55, 32, "copy" + i * 2, "accent", { ...display, ...serif }));
      routes.push(text("copy" + (i * 2 + 1), 110, y + 90, 680, 40, 24, "copy" + (i * 2 + 1), "ink"));
    }
    routes.push(text("copy6", 80, 760, 760, 50, 26, "copy6", "muted"));
    kits.push(writeKit("feature", "eclipse-routes", f, routes));

    kits.push(
      writeKit("feature", "eclipse-dome", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 40, 700, 80, 56, "title", "ink", { ...display, ...serif, morphId: "title" }),
        photo("photo", 860, 120, 660, 680, { zoom: 1.3, alignX: 0.45, z: 1 }),
        rect("c0", 80, 160, 720, 200, "surface", { z: 2, morphId: "plate" }),
        text("copy0", 110, 190, 660, 40, 28, "copy0", "accent", { ...kicker }),
        text("copy1", 110, 250, 660, 80, 28, "copy1", "ink", { lineHeight: 1.3 }),
        rect("c1", 80, 390, 720, 200, "surface_color", { z: 2 }),
        text("copy2", 110, 420, 660, 40, 28, "copy2", "accent", { ...kicker }),
        text("copy3", 110, 480, 660, 80, 28, "copy3", "ink", { lineHeight: 1.3 }),
        rect("c2", 80, 620, 720, 180, "surface", { z: 2 }),
        text("copy4", 110, 650, 660, 40, 28, "copy4", "accent", { ...kicker }),
        text("copy5", 110, 710, 660, 60, 28, "copy5", "ink"),
      ])
    );

    const phases: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1400, 90, 64, "title", "ink", { ...display, ...serif, morphId: "title" }),
    ];
    for (let i = 0; i < 4; i++) {
      const x = 80 + i * 380;
      phases.push(rect("card" + i, x, 220, 340, 480, i === 1 ? "accent" : "surface", { z: 1, morphId: i === 1 ? "accent" : i === 0 ? "plate" : undefined }));
      phases.push(
        circle("moon" + i, x + 90, 300, 160, i === 1 ? "bg" : "surface_color", { z: 2, opacity: i === 3 ? 0.35 : 1 })
      );
      phases.push(
        text("copy" + i * 2, x + 30, 520, 280, 60, 40, "copy" + i * 2, i === 1 ? "bg" : "ink", {
          ...display,
          ...serif,
          align: "center",
        })
      );
      phases.push(
        text("copy" + (i * 2 + 1), x + 30, 590, 280, 40, 24, "copy" + (i * 2 + 1), i === 1 ? "bg" : "muted", {
          align: "center",
        })
      );
    }
    kits.push(writeKit("feature", "eclipse-phases", f, phases));

    kits.push(
      writeKit("feature", "eclipse-quote", f, [
        rect("bg", 0, 0, 1600, 900, "surface_color", { z: 0 }),
        rect("mark", 760, 260, 80, 4, "accent", { z: 1 }),
        text("title", 160, 340, 1280, 200, 72, "title", "ink", {
          ...display,
          ...serif,
          textStyleRole: "quote",
          align: "center",
          lineHeight: 1.15,
          z: 2,
        }),
        text("copy0", 160, 580, 1280, 50, 26, "copy0", "accent", { align: "center", z: 2 }),
      ])
    );

    kits.push(
      writeKit("closing", "eclipse-close", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        ...eclipseBite("c", { x: 720, y: -40, size: 980, offset: 260, z: 1 }),
        text("title", 80, 320, 700, 220, 110, "title", "ink", {
          ...display,
          ...serif,
          lineHeight: 1.05,
          morphId: "title",
          z: 3,
        }),
        text("copy0", 80, 580, 640, 50, 28, "copy0", "muted", { z: 3 }),
        circle("pulse-bg", 80, 700, 80, "accent", { z: 3, morphId: "pulse-bg" }),
      ])
    );

    return kits;
  },
};

const voltaic: Template = {
  id: "voltaic-foundry",
  name: "Voltaic • Foundry",
  description: "Foundry night pour — photo cover with heat accent, ladder, slag samples, pour steps and ignite close.",
  family: "voltaic",
  motion: FLAGSHIP_MOTION,
  brand: {
    colors: {
      bg: "#0C0A08",
      surface: "#1A1410",
      surface_color: "#2A1E16",
      ink: "#F7F0E6",
      muted: "#A89078",
      accent: "#FF5A1F",
      line: "#3D2C20",
    },
    fonts: { display: "Impact", body: "Bahnschrift" },
  },
  slides: [
    {
      role: "cover",
      title: "VOLTAIC",
      items: ["Foundry · pour 07", "night shift", "07"],
      photoQuery: "0506d14bb966",
    },
    {
      role: "feature",
      title: "Heat ladder",
      items: ["Warm", "floor idle", "Hot", "ready to tap", "Bright", "pour window", "Critical", "hold the line", "Keep moving heat."],
    },
    {
      role: "feature",
      title: "Slag samples",
      items: ["A1", "cool edge", "A2", "glass skin", "B1", "dark core", "B2", "spark fleck"],
      photoQuery: "07c71ad45242",
    },
    {
      role: "feature",
      title: "Pour",
      items: ["01", "Tap the gate", "02", "Guide the run", "03", "Quench the skin", "04", "Break the mold"],
    },
    {
      role: "feature",
      title: "Keep the heat moving.",
      items: ["— Floor boss"],
      photoQuery: "0506d14bb966",
    },
    {
      role: "closing",
      title: "Ignite.",
      items: ["Voltaic Foundry · night pour"],
    },
  ],
  kits: () => {
    const f = "voltaic";
    const kits = [];

    kits.push(
      writeKit("cover", "voltaic-night", f, [
        photo("photo", 0, 0, 1600, 900, { morphId: "hero", zoom: 1.15 }),
        rect("scrim", 0, 520, 1600, 380, "bg", { z: 2, opacity: 0.78, morphId: "titlePlate" }),
        ...pourPath("pp", { x: 40, y: 40, w: 420, h: 480, z: 3 }),
        text("copy0", 80, 560, 900, 40, 22, "copy0", "muted", { ...kicker, z: 4 }),
        text("title", 70, 620, 1100, 140, 110, "title", "ink", {
          ...display,
          letterSpacing: 2,
          lineHeight: 0.92,
          z: 4,
          morphId: "title",
        }),
        text("copy1", 80, 780, 600, 50, 36, "copy1", "accent", { ...display, z: 4 }),
        circle("badge", 1360, 620, 160, "accent", { z: 4, morphId: "accent" }),
        text("copy2", 1385, 665, 110, 80, 52, "copy2", "bg", { ...stat, align: "center", z: 5 }),
      ])
    );

    const heat: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1200, 90, 64, "title", "ink", { ...display, morphId: "title" }),
    ];
    for (let i = 0; i < 4; i++) {
      const y = 170 + i * 140;
      const hot = i >= 2;
      heat.push(
        rect("row" + i, 80, y, 1440, 120, hot ? "accent" : i % 2 ? "surface" : "surface_color", {
          z: 1,
          morphId: hot && i === 3 ? "accent" : i === 0 ? "plate" : undefined,
        })
      );
      heat.push(text("copy" + i * 2, 120, y + 30, 360, 60, 40, "copy" + i * 2, hot ? "bg" : "ink", { ...display }));
      heat.push(text("copy" + (i * 2 + 1), 520, y + 35, 900, 50, 32, "copy" + (i * 2 + 1), hot ? "bg" : "muted"));
    }
    heat.push(text("copy8", 80, 780, 1400, 50, 28, "copy8", "muted"));
    kits.push(writeKit("feature", "voltaic-heat", f, heat));

    kits.push(
      writeKit("feature", "voltaic-slag", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 40, 800, 80, 56, "title", "ink", { ...display, morphId: "title" }),
        photo("photo", 980, 140, 540, 640, { zoom: 1.2, alignX: 0.3, z: 1 }),
        ...[0, 1, 2, 3].map((i) => {
          const y = 160 + i * 150;
          return rect("chip" + i, 80, y, 840, 130, i === 1 ? "accent" : "surface", {
            z: 2,
            morphId: i === 1 ? "accent" : i === 0 ? "plate" : undefined,
          });
        }),
        ...[0, 1, 2, 3].map((i) =>
          text("copy" + i * 2, 120, 190 + i * 150, 200, 60, 40, "copy" + i * 2, i === 1 ? "bg" : "ink", { ...display, z: 3 })
        ),
        ...[0, 1, 2, 3].map((i) =>
          text("copy" + (i * 2 + 1), 360, 200 + i * 150, 500, 50, 28, "copy" + (i * 2 + 1), i === 1 ? "bg" : "muted", { z: 3 })
        ),
      ])
    );

    const pour: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1400, 90, 64, "title", "ink", { ...display, morphId: "title" }),
      ...pourPath("seq", { x: 80, y: 160, w: 1440, h: 80, z: 1 }),
    ];
    for (let i = 0; i < 4; i++) {
      const x = 80 + i * 380;
      pour.push(rect("step" + i, x, 300, 340, 420, "surface", { z: 2, morphId: i === 0 ? "plate" : undefined }));
      pour.push(text("copy" + i * 2, x + 30, 360, 280, 80, 64, "copy" + i * 2, "accent", { ...stat }));
      pour.push(text("copy" + (i * 2 + 1), x + 30, 470, 280, 120, 36, "copy" + (i * 2 + 1), "ink", { lineHeight: 1.25 }));
    }
    kits.push(writeKit("feature", "voltaic-pour", f, pour));

    kits.push(
      writeKit("feature", "voltaic-quote", f, [
        photo("photo", 0, 0, 780, 900, { zoom: 1.2, alignX: 0.35, z: 1 }),
        rect("panel", 780, 0, 820, 900, "bg", { z: 2 }),
        ...heatBars("hq", { x: 860, y: 120, w: 640, bars: 3, z: 3 }),
        text("title", 860, 360, 680, 240, 64, "title", "ink", {
          ...display,
          textStyleRole: "quote",
          lineHeight: 1.15,
          z: 3,
        }),
        text("copy0", 860, 660, 600, 50, 26, "copy0", "accent", { z: 3 }),
      ])
    );

    kits.push(
      writeKit("closing", "voltaic-close", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        ...pourPath("c", { x: 200, y: 40, w: 1200, h: 820, z: 1 }),
        rect("band", 0, 560, 1600, 340, "bg", { z: 2, opacity: 0.72 }),
        text("title", 80, 600, 1200, 140, 120, "title", "ink", { ...display, morphId: "title", z: 3 }),
        text("copy0", 80, 760, 1000, 50, 28, "copy0", "muted", { z: 3 }),
        circle("pulse-bg", 1360, 640, 160, "accent", { z: 3, morphId: "pulse-bg" }),
      ])
    );

    return kits;
  },
};

const prism: Template = {
  id: "prism-crypt",
  name: "Prism • Crypt",
  description: "Glass hall brief — photo cover with rose accent, shard story, spectrum materials, window seats and refract close.",
  family: "prism",
  motion: FLAGSHIP_MOTION,
  brand: {
    colors: {
      bg: "#10140F",
      surface: "#1B2418",
      surface_color: "#2A3624",
      ink: "#F2F5EC",
      muted: "#8FA08A",
      accent: "#D4FF3F",
      line: "#3A4A34",
    },
    fonts: { display: "Rockwell", body: "Candara" },
  },
  slides: [
    {
      role: "cover",
      title: "PRISM",
      items: ["Crypt · glass hall", "morning light", "VII"],
      photoQuery: "0288432f0b82",
    },
    {
      role: "feature",
      title: "Cuts",
      items: ["Facet", "Catch the east pane first.", "Edge", "Keep the lead thin.", "Glow", "Lime only on the hinge.", "Break light on purpose."],
    },
    {
      role: "feature",
      title: "Palette",
      items: ["Lime", "signal", "Bone", "ground", "Moss", "shadow", "Flare", "hit"],
      photoQuery: "092c8c1420fb",
    },
    {
      role: "feature",
      title: "Seats",
      items: ["North", "cool morning", "East", "first flare", "South", "long wash", "West", "last gold"],
    },
    {
      role: "feature",
      title: "Color is structure.",
      items: ["— Glasswright"],
      photoQuery: "0288432f0b82",
    },
    {
      role: "closing",
      title: "Refract.",
      items: ["Prism Crypt · morning light"],
    },
  ],
  kits: () => {
    const f = "prism";
    const kits = [];

    kits.push(
      writeKit("cover", "prism-hall", f, [
        photo("photo", 0, 0, 1600, 900, { morphId: "hero", zoom: 1.15 }),
        rect("scrimTop", 0, 0, 1600, 280, "bg", { z: 2, opacity: 0.7, morphId: "titlePlate" }),
        ...roseWindow("rw", { x: 60, y: 320, size: 480, petals: 6, z: 3 }),
        ...spectrumStrip("ss", { x: 600, y: 820, w: 920, h: 40, segs: 10, z: 4 }),
        text("copy0", 600, 60, 700, 40, 22, "copy0", "muted", { ...kicker, z: 4 }),
        text("title", 580, 110, 900, 140, 110, "title", "ink", {
          ...display,
          letterSpacing: 2,
          lineHeight: 0.92,
          z: 4,
          morphId: "title",
        }),
        text("copy1", 600, 360, 700, 50, 36, "copy1", "accent", { z: 4 }),
        ...prismShards("cov", { x: 1100, y: 340, count: 4, z: 3 }),
        text("copy2", 600, 420, 200, 70, 48, "copy2", "ink", { ...stat, z: 4 }),
      ])
    );

    const cuts: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 900, 90, 64, "title", "ink", { ...display, morphId: "title" }),
      ...prismShards("ps", { x: 1100, y: 160, count: 4, z: 1 }),
    ];
    for (let i = 0; i < 3; i++) {
      const y = 180 + i * 170;
      cuts.push(rect("row" + i, 80, y, 960, 140, "surface", { z: 2, morphId: i === 0 ? "plate" : undefined }));
      cuts.push(text("copy" + i * 2, 120, y + 30, 300, 50, 36, "copy" + i * 2, "accent", { ...display }));
      cuts.push(text("copy" + (i * 2 + 1), 120, y + 80, 860, 40, 26, "copy" + (i * 2 + 1), "ink"));
    }
    cuts.push(text("copy6", 80, 760, 960, 50, 28, "copy6", "muted"));
    kits.push(writeKit("feature", "prism-cuts", f, cuts));

    kits.push(
      writeKit("feature", "prism-palette", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 40, 800, 80, 56, "title", "ink", { ...display, morphId: "title" }),
        photo("photo", 980, 140, 540, 640, { zoom: 1.25, z: 1 }),
        ...spectrumStrip("pal", { x: 80, y: 160, w: 840, h: 80, segs: 8, z: 2 }),
        ...[0, 1, 2, 3].map((i) =>
          rect("sw" + i, 80 + (i % 2) * 430, 280 + Math.floor(i / 2) * 260, 400, 220, i === 0 ? "accent" : "surface", {
            z: 2,
            morphId: i === 0 ? "accent" : undefined,
          })
        ),
        ...[0, 1, 2, 3].map((i) =>
          text(
            "copy" + i * 2,
            110 + (i % 2) * 430,
            340 + Math.floor(i / 2) * 260,
            340,
            60,
            40,
            "copy" + i * 2,
            i === 0 ? "bg" : "ink",
            { ...display, align: "center", z: 3 }
          )
        ),
        ...[0, 1, 2, 3].map((i) =>
          text(
            "copy" + (i * 2 + 1),
            110 + (i % 2) * 430,
            410 + Math.floor(i / 2) * 260,
            340,
            40,
            24,
            "copy" + (i * 2 + 1),
            i === 0 ? "bg" : "muted",
            { align: "center", z: 3 }
          )
        ),
      ])
    );

    const seats: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 900, 90, 64, "title", "ink", { ...display, morphId: "title" }),
      ...roseWindow("seat", { x: 1080, y: 180, size: 440, petals: 6, z: 1 }),
    ];
    for (let i = 0; i < 4; i++) {
      const y = 170 + i * 150;
      seats.push(rect("dir" + i, 80, y, 920, 120, i === 1 ? "accent" : "surface", { z: 2, morphId: i === 1 ? "accent" : i === 0 ? "plate" : undefined }));
      seats.push(text("copy" + i * 2, 120, y + 30, 280, 60, 36, "copy" + i * 2, i === 1 ? "bg" : "ink", { ...display }));
      seats.push(text("copy" + (i * 2 + 1), 440, y + 35, 500, 50, 28, "copy" + (i * 2 + 1), i === 1 ? "bg" : "muted"));
    }
    kits.push(writeKit("feature", "prism-seats", f, seats));

    kits.push(
      writeKit("feature", "prism-quote", f, [
        rect("bg", 0, 0, 1600, 900, "accent", { z: 0 }),
        ...prismShards("pq", { x: 1080, y: 80, count: 5, z: 1 }),
        text("title", 80, 300, 1000, 220, 72, "title", "bg", {
          ...display,
          textStyleRole: "quote",
          lineHeight: 1.1,
          z: 3,
        }),
        text("copy0", 80, 560, 800, 50, 26, "copy0", "bg", { z: 3 }),
      ])
    );

    kits.push(
      writeKit("closing", "prism-close", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        ...roseWindow("c", { x: 520, y: 40, size: 560, petals: 8, z: 1 }),
        circle("pulse-bg", 700, 220, 200, "accent", { z: 2, morphId: "pulse-bg" }),
        text("title", 80, 660, 1440, 120, 100, "title", "ink", { ...display, align: "center", morphId: "title", z: 3 }),
        text("copy0", 80, 800, 1440, 40, 26, "copy0", "muted", { align: "center", z: 3 }),
        ...spectrumStrip("foot", { x: 200, y: 860, w: 1200, h: 28, segs: 12, z: 3 }),
      ])
    );

    return kits;
  },
};

runTemplates([abyss, eclipse, voltaic, prism]).catch((e) => {
  console.error(e);
  process.exit(1);
});
