/**
 * Object-first creative templates — each family is built around one physical
 * metaphor, with a cover that sells the idea and interiors that reuse its anatomy.
 *
 *   oxide-atelier   — spray wall texture; outline type, paint drips, stencil steps
 *   gulhane-line    — tram destination board; stop dots, timetable, fare cards
 *   darkroom-proof  — film strip + contact sheet; exposure dials, chemical baths
 *   rosso-bay       — garage platform with red underglow; specs, lineup, telemetry
 *
 *   node -r ts-node/register/transpile-only scripts/generate-object-batch.ts [--publish-local] [--only=id]
 */
import { Template, text, rect, circle, photo, writeKit, runTemplates, El } from "./lib/designKit";
import { filmStrip, dial, neonBadge, assertUniqueSel, familySel } from "./lib/sel";

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

const oxide: Template = {
  id: "oxide-atelier",
  name: "Oxide • Atelier 01",
  description: "Street mural deck — outline type over oxidized paint, drip swatches, stencil steps and a tag close.",
  family: "oxide",
  motion: FLAGSHIP_MOTION,
  brand: {
    colors: {
      bg: "#0E0E0E",
      surface: "#1A1A1A",
      surface_color: "#2A2A2A",
      ink: "#F5F0E8",
      muted: "#9A958C",
      accent: "#FF3D8B",
      line: "#333333",
    },
    fonts: { display: "Archivo Black", body: "Space Grotesk" },
  },
  slides: [
    {
      role: "cover",
      title: "OXIDE",
      items: ["Atelier 01 · street mural", "atelier", "01"],
      photoQuery: "1564ac7082",
    },
    {
      role: "feature",
      title: "Pigments",
      items: ["Magenta", "Teal", "Oxide", "Mustard", "Ink", "Five cans. One wall. No sketch first."],
    },
    {
      role: "feature",
      title: "Three walls",
      items: [
        "North",
        "Hard light, raw concrete, overnight cure.",
        "East",
        "Morning sun bleeds the pinks softer.",
        "Alley",
        "Narrow throw, big letters, keep walking.",
      ],
      photoQuery: "1564ac7082",
    },
    {
      role: "feature",
      title: "Stencil",
      items: ["01", "Mask the wall", "02", "Lay the drip", "03", "Pull the tape", "04", "Walk away"],
    },
    {
      role: "feature",
      title: "Leave the drip.",
      items: ["— Studio note, May"],
      photoQuery: "1564ac7082",
    },
    {
      role: "closing",
      title: "Tag it.",
      items: ["Oxide Atelier · night shift"],
    },
  ],
  kits: () => {
    const f = "oxide";
    const kits = [];

    kits.push(
      writeKit("cover", "oxide-spray", f, [
        photo("photo", 0, 0, 1600, 900, { morphId: "hero" }),
        rect("scrim", 0, 0, 900, 900, "bg", { z: 2, opacity: 0.55, morphId: "titlePlate" }),
        text("copy0", 70, 90, 700, 40, 22, "copy0", "muted", { ...kicker, z: 3 }),
        text("title", 60, 220, 820, 220, 180, "title", "ink", {
          ...display,
          typeTreatment: "outline",
          letterSpacing: -2,
          lineHeight: 0.92,
          z: 3,
          morphId: "title",
        }),
        text("copy1", 70, 480, 700, 90, 64, "copy1", "accent", { ...display, z: 3 }),
        circle("badge", 1280, 640, 200, "accent", { z: 3, morphId: "accent" }),
        text("copy2", 1300, 690, 160, 110, 84, "copy2", "bg", { ...stat, align: "center", z: 4 }),
      ])
    );

    const drips: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 70, 50, 1400, 90, 64, "title", "ink", display),
    ];
    const fills = ["accent", "muted", "surface_color", "ink", "line"];
    for (let i = 0; i < 5; i++) {
      const x = 70 + i * 300;
      const h = 420 + (i % 2) * 80;
      drips.push(rect("drip" + i, x, 180, 220, h, fills[i], { z: 1 }));
      drips.push(circle("blob" + i, x + 70, 160 + h, 80, fills[i], { z: 1 }));
      drips.push(text("copy" + i, x, 180 + h + 100, 220, 44, 26, "copy" + i, "ink", { align: "center" }));
    }
    drips.push(text("copy5", 70, 820, 1460, 50, 26, "copy5", "muted"));
    kits.push(writeKit("feature", "oxide-drips", f, drips));

    kits.push(
      writeKit("feature", "oxide-walls", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 70, 40, 1460, 80, 56, "title", "ink", display),
        photo("photo", 70, 160, 480, 560, { tone: "bw-harsh", zoom: 1.3 }),
        rect("p2", 580, 160, 480, 560, "surface", { z: 1 }),
        rect("p3", 1090, 160, 440, 560, "accent", { z: 1 }),
        text("copy0", 90, 200, 440, 50, 32, "copy0", "accent", { ...kicker }),
        text("copy1", 90, 270, 440, 160, 28, "copy1", "ink", { lineHeight: 1.3 }),
        text("copy2", 600, 200, 440, 50, 32, "copy2", "accent", { ...kicker }),
        text("copy3", 600, 270, 440, 160, 28, "copy3", "ink", { lineHeight: 1.3 }),
        text("copy4", 1110, 200, 400, 50, 32, "copy4", "bg", { ...kicker }),
        text("copy5", 1110, 270, 400, 160, 28, "copy5", "bg", { lineHeight: 1.3 }),
      ])
    );

    const stencil: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 70, 50, 1460, 90, 64, "title", "ink", display),
    ];
    for (let i = 0; i < 4; i++) {
      const y = 180 + i * 160;
      stencil.push(rect("bar" + i, 70, y, 1460, 130, i % 2 ? "surface" : "surface_color", { z: 1 }));
      stencil.push(
        text("copy" + i * 2, 100, y + 30, 160, 70, 52, "copy" + i * 2, "accent", { ...display })
      );
      stencil.push(text("copy" + (i * 2 + 1), 300, y + 35, 1100, 60, 40, "copy" + (i * 2 + 1), "ink"));
    }
    kits.push(writeKit("feature", "oxide-stencil", f, stencil));

    kits.push(
      writeKit("feature", "oxide-quote", f, [
        photo("photo", 0, 0, 1600, 900),
        rect("scrim", 200, 220, 1200, 460, "bg", { z: 2, opacity: 0.72 }),
        text("title", 260, 320, 1080, 200, 72, "title", "ink", {
          ...display,
          textStyleRole: "quote",
          align: "center",
          lineHeight: 1.1,
          z: 3,
        }),
        text("copy0", 260, 560, 1080, 50, 26, "copy0", "accent", { align: "center", z: 3 }),
      ])
    );

    kits.push(
      writeKit("closing", "oxide-tag", f, [
        rect("bg", 0, 0, 1600, 900, "accent", { z: 0 }),
        circle("pulse-bg", 640, 180, 320, "bg", { z: 1, morphId: "pulse-bg" }),
        text("title", 80, 560, 1440, 140, 110, "title", "bg", { ...display, align: "center", morphId: "title" }),
        text("copy0", 80, 720, 1440, 50, 28, "copy0", "bg", { align: "center" }),
      ])
    );

    return kits;
  },
};

const gulhane: Template = {
  id: "gulhane-line",
  name: "Gülhane • Line T1",
  description: "Transit deck — destination board cover, stop dots, timetable strip, fare cards and alight signal.",
  family: "gulhane",
  motion: FLAGSHIP_MOTION,
  brand: {
    colors: {
      bg: "#F4F1EC",
      surface: "#FFFFFF",
      surface_color: "#0B3D91",
      ink: "#121212",
      muted: "#6B6B6B",
      accent: "#E31C23",
      line: "#D8D4CC",
    },
    fonts: { display: "Antonio", body: "IBM Plex Mono" },
  },
  slides: [
    {
      role: "cover",
      title: "GÜLHANE",
      items: ["T1 · Kabataş–Bağcılar", "Next stop Topkapı", "T1"],
      photoQuery: "8e3702f1cc",
    },
    {
      role: "feature",
      title: "Stops",
      items: [
        "Kabataş",
        "terminus",
        "Gülhane",
        "you are here",
        "Sultanahmet",
        "3 min",
        "Beyazıt",
        "7 min",
        "Aksaray",
        "11 min",
      ],
    },
    {
      role: "feature",
      title: "Today",
      items: [
        "06:12",
        "First eastbound",
        "09:40",
        "Peak every 4 min",
        "14:00",
        "Midday every 7",
        "23:48",
        "Last westbound",
      ],
    },
    {
      role: "feature",
      title: "Fares",
      items: ["15", "Single · TRY", "50", "Day pass · TRY", "180", "Weekly · TRY"],
    },
    {
      role: "feature",
      title: "From the platform",
      items: ["Stone walls, yellow facades, the line cuts the city in half."],
      photoQuery: "8e3702f1cc",
    },
    {
      role: "closing",
      title: "Alight here.",
      items: ["Gülhane · Line T1", "GO"],
    },
  ],
  kits: () => {
    const f = "gulhane";
    const kits = [];

    kits.push(
      writeKit("cover", "gulhane-board", f, [
        photo("photo", 0, 0, 1600, 900, { morphId: "hero" }),
        rect("board", 80, 520, 1440, 300, "bg", { z: 2, morphId: "titlePlate" }),
        rect("led", 80, 520, 1440, 12, "accent", { z: 3 }),
        text("copy0", 120, 560, 900, 40, 22, "copy0", "muted", { ...kicker, z: 3 }),
        text("title", 110, 600, 1100, 120, 96, "title", "ink", { ...display, letterSpacing: 4, z: 3, morphId: "title" }),
        text("copy1", 120, 740, 900, 40, 26, "copy1", "surface_color", { z: 3 }),
        circle("badge", 1280, 590, 180, "surface_color", { z: 3, morphId: "accent" }),
        text("copy2", 1300, 635, 140, 100, 64, "copy2", "bg", { ...stat, align: "center", z: 4 }),
      ])
    );

    const stops: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1440, 90, 64, "title", "ink", display),
      rect("rail", 160, 200, 8, 620, "line", { z: 1 }),
    ];
    for (let i = 0; i < 5; i++) {
      const y = 200 + i * 130;
      const here = i === 1;
      stops.push(circle("dot" + i, 140, y + 10, 48, here ? "accent" : "surface_color", { z: 2 }));
      stops.push(
        text("copy" + i * 2, 230, y, 700, 60, 40, "copy" + i * 2, here ? "accent" : "ink", {
          ...display,
          fontWeight: 700,
        })
      );
      stops.push(text("copy" + (i * 2 + 1), 1000, y + 8, 480, 50, 28, "copy" + (i * 2 + 1), "muted", { align: "right" }));
    }
    kits.push(writeKit("feature", "gulhane-stops", f, stops));

    const today: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1440, 90, 64, "title", "ink", display),
    ];
    for (let i = 0; i < 4; i++) {
      const y = 180 + i * 160;
      today.push(rect("row" + i, 80, y, 1440, 130, "surface", { z: 1 }));
      today.push(rect("tick" + i, 80, y, 14, 130, "accent", { z: 2 }));
      today.push(text("copy" + i * 2, 130, y + 30, 360, 70, 48, "copy" + i * 2, "surface_color", { ...display }));
      today.push(text("copy" + (i * 2 + 1), 520, y + 40, 900, 50, 32, "copy" + (i * 2 + 1), "ink"));
    }
    kits.push(writeKit("feature", "gulhane-today", f, today));

    const fares: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1440, 90, 64, "title", "ink", display),
    ];
    for (let i = 0; i < 3; i++) {
      const x = 80 + i * 500;
      fares.push(rect("card" + i, x, 200, 460, 520, i === 1 ? "surface_color" : "surface", { z: 1 }));
      fares.push(
        text("copy" + i * 2, x + 40, 320, 380, 140, 96, "copy" + i * 2, i === 1 ? "bg" : "accent", {
          ...stat,
          align: "center",
        })
      );
      fares.push(
        text("copy" + (i * 2 + 1), x + 40, 500, 380, 60, 32, "copy" + (i * 2 + 1), i === 1 ? "bg" : "ink", {
          align: "center",
        })
      );
    }
    kits.push(writeKit("feature", "gulhane-fares", f, fares));

    kits.push(
      writeKit("feature", "gulhane-platform", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        photo("photo", 200, 80, 1200, 560, { zoom: 1.15 }),
        rect("frame", 200, 80, 1200, 24, "accent", { z: 2 }),
        rect("frame2", 200, 616, 1200, 24, "surface_color", { z: 2 }),
        text("title", 80, 680, 1440, 90, 56, "title", "ink", { ...display, align: "center" }),
        text("copy0", 200, 780, 1200, 60, 26, "copy0", "muted", { align: "center", lineHeight: 1.3 }),
      ])
    );

    kits.push(
      writeKit("closing", "gulhane-alight", f, [
        rect("bg", 0, 0, 1600, 900, "surface_color", { z: 0 }),
        circle("pulse-bg", 700, 180, 200, "accent", { z: 1, morphId: "pulse-bg" }),
        text("goLabel", 720, 245, 160, 80, 48, "copy1", "bg", { ...display, align: "center", z: 2 }),
        text("title", 80, 460, 1440, 140, 110, "title", "bg", { ...display, align: "center", morphId: "title" }),
        text("copy0", 80, 640, 1440, 50, 28, "copy0", "bg", { align: "center" }),
      ])
    );

    return kits;
  },
};

const darkroomSel = familySel("darkroom");
if (darkroomSel) assertUniqueSel("darkroom", darkroomSel.units);

const darkroom: Template = {
  id: "darkroom-proof",
  name: "Darkroom • Proof sheet",
  description: "Photography lab deck — film-strip cover, contact sheet, exposure dials, chemical baths and a print.",
  family: "darkroom",
  motion: FLAGSHIP_MOTION,
  brand: {
    colors: {
      bg: "#111111",
      surface: "#1C1C1C",
      surface_color: "#F2EDE4",
      ink: "#F2EDE4",
      muted: "#8A8A8A",
      accent: "#C4A574",
      line: "#2A2A2A",
    },
    fonts: { display: "Playfair Display", body: "IBM Plex Mono" },
  },
  slides: [
    {
      role: "cover",
      title: "Proof",
      items: ["Sheet 14 · Ilford HP5", "14", "f/8 · 1/125"],
      photoQuery: "50597e1fdb",
    },
    {
      role: "feature",
      title: "Contact",
      items: ["01", "02", "03", "04", "05", "06"],
      photoQuery: "50597e1fdb",
    },
    {
      role: "feature",
      title: "Exposure",
      items: ["f/2.8", "Wide open", "f/5.6", "Working stop", "f/11", "Deep field", "f/16", "Landscape"],
    },
    {
      role: "feature",
      title: "Baths",
      items: ["Developer", "2:00", "Stop", "0:30", "Fix", "5:00", "Wash", "10:00"],
    },
    {
      role: "feature",
      title: "Final print",
      items: ["Selenium toned, fibre paper, air dried overnight."],
      photoQuery: "50597e1fdb",
    },
    {
      role: "closing",
      title: "Fix it.",
      items: ["Darkroom Proof · tray three"],
    },
  ],
  kits: () => {
    const f = "darkroom";
    const kits = [];

    kits.push(
      writeKit("cover", "darkroom-strip", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("copy0", 80, 60, 1000, 40, 22, "copy0", "muted", { ...kicker }),
        text("title", 70, 120, 900, 160, 120, "title", "ink", { ...display, ...serif, morphId: "title" }),
        text("copy2", 80, 300, 700, 40, 24, "copy2", "accent"),
        ...filmStrip("fs", { x: 80, y: 420, frames: 5, activeIndex: 2, frameW: 260, frameH: 320, gap: 30 }),
        ...neonBadge("nb", { x: 1320, y: 120, size: 160, slot: "copy1", fontSize: 56, z: 2 }),
      ])
    );

    const contact: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 40, 1440, 80, 56, "title", "ink", { ...display, ...serif }),
    ];
    for (let i = 0; i < 6; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 80 + col * 500;
      const y = 150 + row * 360;
      contact.push(rect("cell" + i, x, y, 460, 320, "surface", { z: 1 }));
      if (i === 0) {
        contact.push(photo("photo", x + 20, y + 20, 420, 220, { tone: "bw-harsh", zoom: 1.2, z: 2 }));
      } else {
        contact.push(
          rect("blank" + i, x + 20, y + 20, 420, 220, i % 2 ? "line" : "surface_color", {
            z: 2,
            opacity: i % 2 ? 1 : 0.15,
          })
        );
      }
      contact.push(text("copy" + i, x + 20, y + 260, 120, 40, 24, "copy" + i, "accent"));
    }
    kits.push(writeKit("feature", "darkroom-contact", f, contact));

    const exposure: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1440, 90, 64, "title", "ink", { ...display, ...serif, morphId: "title" }),
    ];
    for (let i = 0; i < 4; i++) {
      const x = 90 + i * 380;
      exposure.push(...dial("d" + i, { x: x + 40, y: 220, size: 260 }));
      exposure.push(text("copy" + i * 2, x + 40, 520, 260, 70, 40, "copy" + i * 2, "accent", { ...display, align: "center", ...serif }));
      exposure.push(text("copy" + (i * 2 + 1), x + 20, 610, 300, 50, 24, "copy" + (i * 2 + 1), "muted", { align: "center" }));
    }
    kits.push(writeKit("feature", "darkroom-exposure", f, exposure));

    const baths: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1440, 90, 64, "title", "ink", { ...display, ...serif }),
    ];
    for (let i = 0; i < 4; i++) {
      const y = 180 + i * 160;
      const fills = ["accent", "surface_color", "muted", "line"];
      baths.push(rect("tray" + i, 80, y, 1440, 130, "surface", { z: 1 }));
      baths.push(rect("fluid" + i, 80, y, 40 + i * 280, 130, fills[i], { z: 2, opacity: 0.85 }));
      baths.push(text("copy" + i * 2, 140, y + 35, 700, 60, 40, "copy" + i * 2, "ink"));
      baths.push(text("copy" + (i * 2 + 1), 1100, y + 35, 360, 60, 40, "copy" + (i * 2 + 1), "accent", { align: "right", ...display, ...serif }));
    }
    kits.push(writeKit("feature", "darkroom-baths", f, baths));

    kits.push(
      writeKit("feature", "darkroom-print", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        rect("mat", 280, 60, 1040, 680, "surface_color", { z: 1, morphId: "plate" }),
        photo("photo", 340, 100, 920, 520, { tone: "bw-harsh", zoom: 1.1, z: 2 }),
        text("title", 80, 780, 1440, 80, 56, "title", "ink", { ...display, ...serif, align: "center", morphId: "title" }),
        text("copy0", 200, 850, 1200, 40, 22, "copy0", "muted", { align: "center" }),
      ])
    );

    kits.push(
      writeKit("closing", "darkroom-fix", f, [
        rect("bg", 0, 0, 1600, 900, "accent", { z: 0 }),
        circle("pulse-bg", 720, 140, 160, "bg", { z: 1, morphId: "pulse-bg" }),
        text("title", 80, 360, 1440, 160, 120, "title", "bg", { ...display, ...serif, align: "center", morphId: "title" }),
        text("copy0", 80, 560, 1440, 50, 28, "copy0", "bg", { align: "center" }),
      ])
    );

    return kits;
  },
};

const rosso: Template = {
  id: "rosso-bay",
  name: "Rosso • Bay 01",
  description: "Private garage deck — red underglow platform cover, spec dials, bay lineup, telemetry bars and ignition.",
  family: "rosso",
  motion: FLAGSHIP_MOTION,
  brand: {
    colors: {
      bg: "#0A0A0A",
      surface: "#141414",
      surface_color: "#1E1E1E",
      ink: "#F5F5F5",
      muted: "#8A8A8A",
      accent: "#E10600",
      line: "#2A2A2A",
    },
    fonts: { display: "Syne", body: "Space Grotesk" },
  },
  slides: [
    {
      role: "cover",
      title: "ROSSO",
      items: ["Private collection · Bay 01", "01", "SF90 · 986 hp"],
      photoQuery: "d9c6389eb4",
    },
    {
      role: "feature",
      title: "The numbers",
      items: ["986", "hp", "2.5", "s 0–100", "340", "km/h", "1570", "kg"],
    },
    {
      role: "feature",
      title: "The bay",
      items: ["01", "SF90", "02", "Roma", "03", "296 GTB", "04", "Purosangue", "05", "812"],
      photoQuery: "d9c6389eb4",
    },
    {
      role: "feature",
      title: "Telemetry",
      items: ["Idle", "12%", "Cruise", "38%", "Push", "64%", "Launch", "91%", "Redline", "100%"],
    },
    {
      role: "feature",
      title: "Detail",
      items: ["Carbon weave. Red underglow. Mirror floor."],
      photoQuery: "d9c6389eb4",
    },
    {
      role: "closing",
      title: "Ignition.",
      items: ["Rosso Bay · private collection"],
    },
  ],
  kits: () => {
    const f = "rosso";
    const kits = [];

    kits.push(
      writeKit("cover", "rosso-platform", f, [
        photo("photo", 0, 0, 1600, 900, { morphId: "hero" }),
        rect("scrim", 0, 560, 1600, 340, "bg", { z: 2, opacity: 0.72, morphId: "titlePlate" }),
        rect("glow", 200, 860, 1200, 10, "accent", { z: 3 }),
        rect("glow2", 360, 840, 880, 6, "accent", { z: 3, opacity: 0.5 }),
        text("copy0", 80, 590, 900, 40, 22, "copy0", "muted", { ...kicker, z: 3 }),
        text("title", 70, 630, 1000, 150, 120, "title", "ink", {
          ...display,
          letterSpacing: -2,
          lineHeight: 0.92,
          z: 3,
          morphId: "title",
        }),
        text("copy2", 80, 820, 700, 40, 26, "copy2", "accent", { z: 3 }),
        circle("badge", 1320, 620, 180, "accent", { z: 3, morphId: "accent" }),
        text("copy1", 1340, 665, 140, 100, 64, "copy1", "bg", { ...stat, align: "center", z: 4 }),
      ])
    );

    const numbers: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1440, 90, 64, "title", "ink", display),
    ];
    for (let i = 0; i < 4; i++) {
      const x = 80 + i * 380;
      numbers.push(rect("rule" + i, x, 200, 340, 4, "accent", { z: 1 }));
      numbers.push(text("copy" + i * 2, x, 240, 340, 140, 96, "copy" + i * 2, "ink", { ...stat }));
      numbers.push(text("copy" + (i * 2 + 1), x, 400, 340, 50, 28, "copy" + (i * 2 + 1), "muted", { ...kicker }));
    }
    kits.push(writeKit("feature", "rosso-numbers", f, numbers));

    kits.push(
      writeKit("feature", "rosso-bay-line", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 40, 1000, 80, 56, "title", "ink", display),
        photo("photo", 1100, 40, 420, 820, { zoom: 1.4, alignX: 0.55, z: 1 }),
        rect("edge", 1100, 40, 12, 820, "accent", { z: 2 }),
        ...[0, 1, 2, 3, 4].flatMap((i) => {
          const y = 150 + i * 140;
          return [
            rect("slot" + i, 80, y, 960, 110, "surface", { z: 1 }),
            text("copy" + i * 2, 110, y + 25, 120, 60, 40, "copy" + i * 2, "accent", { ...display }),
            text("copy" + (i * 2 + 1), 260, y + 30, 700, 50, 36, "copy" + (i * 2 + 1), "ink"),
          ] as El[];
        }),
      ])
    );

    const telemetry: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1440, 90, 64, "title", "ink", display),
      rect("base", 80, 760, 1440, 4, "line"),
    ];
    const heights = [120, 220, 320, 400, 480];
    for (let i = 0; i < 5; i++) {
      const x = 120 + i * 290;
      const h = heights[i];
      telemetry.push(rect("bar" + i, x, 760 - h, 200, h, i === 4 ? "accent" : "surface_color", { z: 1 }));
      telemetry.push(text("copy" + i * 2, x, 780, 200, 40, 22, "copy" + i * 2, "muted", { align: "center", ...kicker }));
      telemetry.push(
        text("copy" + (i * 2 + 1), x, 760 - h + 16, 200, 40, 26, "copy" + (i * 2 + 1), i === 4 ? "bg" : "ink", {
          align: "center",
        })
      );
    }
    kits.push(writeKit("feature", "rosso-telemetry", f, telemetry));

    kits.push(
      writeKit("feature", "rosso-detail", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        photo("photo", 420, 60, 760, 760, { mask: "circle", zoom: 1.6, alignX: 0.48, alignY: 0.45 }),
        circle("ring", 400, 40, 800, "accent", { z: 0, opacity: 0.25 }),
        text("title", 80, 400, 320, 120, 64, "title", "ink", display),
        text("copy0", 1240, 400, 280, 140, 28, "copy0", "muted", { lineHeight: 1.35 }),
      ])
    );

    kits.push(
      writeKit("closing", "rosso-ignition", f, [
        rect("bg", 0, 0, 1600, 900, "accent", { z: 0 }),
        circle("pulse-bg", 720, 160, 160, "bg", { z: 1, morphId: "pulse-bg" }),
        rect("blade", 780, 220, 40, 200, "bg", { z: 1 }),
        text("title", 80, 480, 1440, 140, 110, "title", "bg", { ...display, align: "center", morphId: "title" }),
        text("copy0", 80, 660, 1440, 50, 28, "copy0", "bg", { align: "center" }),
      ])
    );

    return kits;
  },
};

runTemplates([oxide, gulhane, darkroom, rosso]).catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
