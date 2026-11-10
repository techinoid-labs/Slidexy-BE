/**
 * Cover-first templates — each family is built around one striking cover idea,
 * and its interiors extend that idea instead of reusing a shared skeleton.
 *
 *   tidewater-regatta   — cream disc over aerial boards; buoys, pill photo, sunset close
 *   golden-hour-estate  — arch-cropped house; spec row, roman-numeral rooms, deed quote
 *   roast-theory        — long-shadow / outline poster; roast-curve bars, origin cards
 *   idea-wall           — pinned sticky note over a real wall; staggered notes, dot vote
 *
 *   node -r ts-node/register/transpile-only scripts/generate-cover-first-batch.ts [--publish-local] [--only=id]
 */
import { Template, text, rect, circle, photo, writeKit, runTemplates, El } from "./lib/designKit";

const serif = { fontWeight: 400 };
const display = { textStyleRole: "display", fontRole: "display" };
const kicker = { textStyleRole: "kicker", fontRole: "label" };
const stat = { textStyleRole: "stat", fontRole: "display" };

const tidewater: Template = {
  id: "tidewater-regatta",
  name: "Tidewater • Summer regatta",
  description: "Coastal festival deck — cream disc over aerial boards, buoy stats, pill-cropped photo and a sunset close.",
  family: "tidewater",
  brand: {
    colors: {
      bg: "#0B2E3A",
      surface: "#F4EBDD",
      surface_color: "#FFC857",
      ink: "#F4EBDD",
      muted: "#9FC3C9",
      accent: "#EE4F3A",
      line: "#16485A",
    },
    fonts: { display: "DM Serif Display", body: "Calibri" },
  },
  slides: [
    {
      role: "cover",
      title: "Tide **water**",
      items: ["Summer regatta", "July 19 · Harbour Mile", "07"],
      photoQuery: "80346a24bf",
    },
    {
      role: "feature",
      title: "The course",
      items: [
        "3.2 km",
        "Course length",
        "14",
        "Boards per heat",
        "6",
        "Buoys to round",
        "Start horn at 09:00 from the harbour wall. Round every buoy to port and finish under the red flag.",
      ],
    },
    {
      role: "feature",
      title: "Heats",
      items: [
        "09:00",
        "Sprint — open",
        "10:30",
        "Relay — teams of four",
        "12:00",
        "Paddle parade",
        "14:00",
        "Long course final",
      ],
      photoQuery: "80346a24bf",
    },
    {
      role: "feature",
      title: "From above",
      items: [
        "Bring colour",
        "Every board in a different livery reads beautifully from the drone at noon.",
        "Stay close",
        "Rafting up between heats keeps the course clear and the photos full.",
      ],
      photoQuery: "80346a24bf",
    },
    {
      role: "feature",
      title: "Read the water before you read the map.",
      items: ["— Harbour master’s briefing"],
      photoQuery: "ed2250ed0c",
    },
    { role: "feature", title: "See you on the water.", items: ["Tidewater Regatta · Harbour Mile"] },
  ],
  kits: () => {
    const f = "tidewater";
    const kits = [];
    kits.push(
      writeKit("cover", "tidewater-disc", f, [
        photo("photo", 0, 0, 1600, 900),
        circle("disc", 70, 90, 720, "surface", { z: 2 }),
        text("copy0", 170, 220, 520, 44, 26, "copy0", "accent", { ...kicker, align: "center", z: 3 }),
        text("title", 150, 270, 560, 340, 130, "title", "bg", { ...display, ...serif, align: "center", lineHeight: 1.0, z: 3 }),
        rect("dash", 400, 620, 60, 4, "accent", { z: 3 }),
        text("copy1", 170, 645, 520, 50, 30, "copy1", "bg", { align: "center", z: 3 }),
        circle("sticker", 1290, 80, 230, "accent", { z: 3 }),
        text("copy2", 1310, 125, 190, 140, 88, "copy2", "surface", { ...stat, ...serif, align: "center", z: 4 }),
      ])
    );
    const buoy: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 60, 1440, 110, 84, "title", "ink", { ...display, ...serif }),
    ];
    ["surface", "accent", "surface_color"].forEach((fill, i) => {
      const x = 80 + i * 530;
      buoy.push(circle("buoy" + i, x, 230, 380, fill));
      buoy.push(text("copy" + i * 2, x + 40, 330, 300, 120, 96, "copy" + i * 2, "bg", { ...stat, ...serif, align: "center" }));
      buoy.push(text("copy" + (i * 2 + 1), x + 40, 460, 300, 50, 28, "copy" + (i * 2 + 1), "bg", { align: "center" }));
    });
    buoy.push(rect("rule", 80, 680, 1440, 2, "line"));
    buoy.push(text("copy6", 80, 720, 1300, 100, 30, "copy6", "muted", { lineHeight: 1.3 }));
    kits.push(writeKit("feature", "tidewater-buoys", f, buoy));

    const heats: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      photo("photo", 80, 150, 600, 600, { mask: "circle", zoom: 1.6, alignX: 0.3 }),
      circle("ring", 600, 140, 120, "accent", { z: 2 }),
      text("title", 760, 70, 780, 110, 84, "title", "ink", { ...display, ...serif }),
    ];
    for (let i = 0; i < 4; i++) {
      const y = 230 + i * 150;
      heats.push(circle("dot" + i, 760, y + 14, 26, "accent"));
      heats.push(text("copy" + i * 2, 810, y, 190, 52, 36, "copy" + i * 2, "accent", { ...serif }));
      heats.push(text("copy" + (i * 2 + 1), 1010, y + 2, 530, 50, 32, "copy" + (i * 2 + 1), "ink"));
      heats.push(rect("rule" + i, 760, y + 90, 780, 2, "line"));
    }
    kits.push(writeKit("feature", "tidewater-heats", f, heats));

    kits.push(
      writeKit("feature", "tidewater-pill", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 50, 1000, 110, 84, "title", "ink", { ...display, ...serif }),
        circle("sun", 1420, 60, 100, "surface_color"),
        photo("photo", 80, 190, 1440, 420, { mask: "pill", alignY: 0.45 }),
        text("copy0", 80, 650, 680, 48, 34, "copy0", "accent", { ...serif }),
        text("copy1", 80, 710, 680, 140, 26, "copy1", "muted", { lineHeight: 1.3 }),
        text("copy2", 840, 650, 680, 48, 34, "copy2", "accent", { ...serif }),
        text("copy3", 840, 710, 680, 140, 26, "copy3", "muted", { lineHeight: 1.3 }),
      ])
    );

    kits.push(
      writeKit("feature", "tidewater-texture", f, [
        photo("photo", 0, 0, 1600, 900),
        rect("plate", 200, 220, 1200, 460, "surface", { z: 2 }),
        rect("tab", 760, 200, 80, 40, "accent", { z: 3 }),
        text("title", 280, 300, 1040, 220, 72, "title", "bg", { textStyleRole: "quote", fontRole: "display", ...serif, align: "center", lineHeight: 1.15, z: 3 }),
        text("copy0", 280, 560, 1040, 50, 28, "copy0", "accent", { align: "center", z: 3 }),
      ])
    );

    kits.push(
      writeKit("feature", "tidewater-sunset", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 100, 1440, 130, 100, "title", "ink", { ...display, ...serif, align: "center" }),
        text("copy0", 80, 245, 1440, 50, 30, "copy0", "muted", { align: "center" }),
        circle("sun", 540, 380, 520, "surface_color"),
        rect("sea", 0, 640, 1600, 260, "line", { z: 2 }),
        rect("glint0", 640, 690, 320, 8, "accent", { z: 3 }),
        rect("glint1", 700, 735, 200, 8, "accent", { z: 3 }),
        rect("glint2", 750, 780, 100, 8, "accent", { z: 3 }),
      ])
    );
    return kits;
  },
};

const goldenHour: Template = {
  id: "golden-hour-estate",
  name: "Golden Hour • Shoreline listing",
  description: "Luxury listing deck — arch-cropped house at dusk, serif spec row, roman-numeral rooms and a deed quote.",
  family: "golden-hour",
  brand: {
    colors: {
      bg: "#F3ECE2",
      surface: "#E9DFD2",
      surface_color: "#2A1E18",
      ink: "#2A1E18",
      muted: "#7A6658",
      accent: "#B5562A",
      line: "#D6C8B8",
    },
    fonts: { display: "Instrument Serif", body: "Calibri" },
  },
  slides: [
    {
      role: "cover",
      title: "Golden **Hour**",
      items: ["14 Shoreline Drive", "A shingle-style house on the water, listed at dusk.", "For sale"],
      photoQuery: "af9632a845",
    },
    {
      role: "feature",
      title: "The facts",
      items: [
        "5",
        "Bedrooms",
        "4",
        "Bathrooms",
        "0.8",
        "Acres",
        "1927",
        "Built",
        "Restored in 2019. Private beach, boat house and a south-facing lawn that catches the last light.",
      ],
    },
    {
      role: "feature",
      title: "The approach",
      items: [
        "The drive",
        "Oaks line the last quarter mile. The house appears only at the final bend.",
        "The lawn",
        "South-facing, sloping gently down to a private strip of sand.",
        "The light",
        "At dusk every west window turns gold. These photos were taken at 4:52pm.",
      ],
      photoQuery: "af9632a845",
    },
    {
      role: "feature",
      title: "Rooms",
      items: [
        "I",
        "Great room with open hearth",
        "II",
        "Kitchen facing the dunes",
        "III",
        "Primary suite over the water",
        "IV",
        "Boat house with guest loft",
      ],
      photoQuery: "af9632a845",
    },
    {
      role: "feature",
      title: "Every window faces the **water**.",
      items: ["— From the 1927 deed"],
    },
    {
      role: "feature",
      title: "Arrange a viewing.",
      items: ["Harlow & Finch Estates · by appointment"],
      photoQuery: "af9632a845",
    },
  ],
  kits: () => {
    const f = "golden-hour";
    const kits = [];
    kits.push(
      writeKit("cover", "golden-hour-arch", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        photo("photo", 860, 60, 660, 780, { mask: "arch", alignX: 0.45 }),
        text("copy0", 80, 110, 700, 40, 24, "copy0", "accent", kicker),
        text("title", 80, 190, 560, 380, 160, "title", "ink", { ...display, ...serif, lineHeight: 0.95 }),
        rect("rule", 80, 610, 120, 3, "accent"),
        text("copy1", 80, 640, 640, 100, 30, "copy1", "muted", { lineHeight: 1.3 }),
        circle("badge", 760, 650, 180, "accent", { z: 3 }),
        text("copy2", 775, 712, 150, 56, 34, "copy2", "bg", { align: "center", z: 4 }),
      ])
    );

    const facts: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 70, 1440, 110, 88, "title", "ink", { ...display, ...serif }),
      rect("top", 80, 210, 1440, 2, "line"),
    ];
    for (let i = 0; i < 4; i++) {
      const x = 80 + i * 360;
      if (i > 0) facts.push(rect("div" + i, x - 20, 270, 2, 300, "line"));
      facts.push(text("copy" + i * 2, x, 280, 320, 160, 120, "copy" + i * 2, "accent", { ...stat, ...serif }));
      facts.push(text("copy" + (i * 2 + 1), x, 480, 320, 44, 26, "copy" + (i * 2 + 1), "muted", kicker));
    }
    facts.push(rect("bottom", 80, 640, 1440, 2, "line"));
    facts.push(text("copy8", 80, 690, 1100, 110, 30, "copy8", "ink", { lineHeight: 1.3 }));
    kits.push(writeKit("feature", "golden-hour-facts", f, facts));

    const band: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      photo("photo", 0, 0, 1600, 520, { alignY: 0.55 }),
      text("title", 80, 555, 900, 100, 80, "title", "ink", { ...display, ...serif }),
    ];
    for (let i = 0; i < 3; i++) {
      const x = 80 + i * 500;
      band.push(text("copy" + i * 2, x, 685, 440, 40, 24, "copy" + i * 2, "accent", kicker));
      band.push(text("copy" + (i * 2 + 1), x, 732, 440, 140, 24, "copy" + (i * 2 + 1), "muted", { lineHeight: 1.3 }));
    }
    kits.push(writeKit("feature", "golden-hour-band", f, band));

    const rooms: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 70, 900, 110, 88, "title", "ink", { ...display, ...serif }),
      photo("photo", 1040, 80, 480, 740, { mask: "roundedRect", zoom: 1.8, alignX: 0.62 }),
    ];
    for (let i = 0; i < 4; i++) {
      const y = 230 + i * 150;
      rooms.push(text("copy" + i * 2, 80, y, 130, 72, 60, "copy" + i * 2, "accent", { ...display, ...serif }));
      rooms.push(text("copy" + (i * 2 + 1), 230, y + 12, 750, 56, 38, "copy" + (i * 2 + 1), "ink", serif));
      rooms.push(rect("rule" + i, 80, y + 105, 900, 1, "line"));
    }
    kits.push(writeKit("feature", "golden-hour-rooms", f, rooms));

    kits.push(
      writeKit("feature", "golden-hour-deed", f, [
        rect("bg", 0, 0, 1600, 900, "surface_color", { z: 0 }),
        rect("mark", 770, 280, 60, 3, "accent"),
        text("title", 100, 330, 1400, 240, 84, "title", "bg", { textStyleRole: "quote", fontRole: "display", ...serif, align: "center", lineHeight: 1.12 }),
        text("copy0", 160, 560, 1280, 50, 28, "copy0", "accent", { align: "center" }),
      ])
    );

    kits.push(
      writeKit("feature", "golden-hour-viewing", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        photo("photo", 650, 70, 300, 420, { mask: "arch", zoom: 1.4, alignX: 0.42 }),
        text("title", 80, 530, 1440, 130, 100, "title", "ink", { ...display, ...serif, align: "center" }),
        text("copy0", 80, 680, 1440, 50, 30, "copy0", "muted", { align: "center" }),
      ])
    );
    return kits;
  },
};

const roastTheory: Template = {
  id: "roast-theory",
  name: "Roast Theory • Lot 12",
  description: "Coffee roaster deck — long-shadow poster cover, rising roast-curve bars, origin cards and a giant brew ratio.",
  family: "roast-theory",
  brand: {
    colors: {
      bg: "#140D09",
      surface: "#24170F",
      surface_color: "#2E1F15",
      ink: "#F5E9DA",
      muted: "#B89C82",
      accent: "#E07A2F",
      line: "#3A2A1E",
    },
    fonts: { display: "Archivo Black", body: "Arial" },
  },
  slides: [
    {
      role: "cover",
      title: "ROAST",
      items: ["THEORY", "Small batch roastery · est. 2014", "12", "Lot 12 — Huila, Colombia · medium roast"],
      photoQuery: "a721c1cf1b",
    },
    {
      role: "feature",
      title: "The roast curve",
      items: ["Green", "24°", "Yellowing", "160°", "First crack", "196°", "Development", "205°", "Drop", "212°"],
    },
    {
      role: "feature",
      title: "Origins",
      items: [
        "CO",
        "Huila, Colombia",
        "1,750 m. Red apple, panela and a soft cocoa finish.",
        "ET",
        "Guji, Ethiopia",
        "2,100 m. Bergamot, peach and black tea.",
        "GT",
        "Huehuetenango",
        "1,900 m. Toffee, orange peel and a gentle body.",
      ],
    },
    {
      role: "feature",
      title: "In the drum",
      items: [
        "Charge",
        "Beans drop into a drum already at 200°. The first minute decides the evenness.",
        "Turn",
        "Airflow rises as moisture leaves. We listen for first crack before we look.",
        "Drop",
        "Out onto the cooling tray. Four minutes later the lot is bagged and dated.",
      ],
      photoQuery: "a721c1cf1b",
    },
    {
      role: "feature",
      title: "The house ratio",
      items: [
        "1:16",
        "Dose",
        "20 g of coffee to 320 g of water.",
        "Water",
        "94°C, filtered, never straight off the boil.",
        "Time",
        "Three minutes thirty, give or take a breath.",
      ],
    },
    { role: "feature", title: "Drink it fresh.", items: ["Roast Theory · roasted Tuesdays, shipped Wednesdays"] },
  ],
  kits: () => {
    const f = "roast-theory";
    const kits = [];
    kits.push(
      writeKit("cover", "roast-theory-poster", f, [
        photo("photo", 0, 0, 1600, 900),
        rect("scrim", 0, 0, 1600, 900, "bg", { z: 2, opacity: 0.45 }),
        text("copy1", 80, 80, 1000, 44, 26, "copy1", "accent", { ...kicker, z: 3 }),
        text("title", 70, 150, 1440, 300, 280, "title", "ink", { ...display, typeTreatment: "long-shadow", letterSpacing: -4, lineHeight: 0.95, z: 3 }),
        text("copy0", 70, 460, 1140, 230, 200, "copy0", "accent", { ...display, typeTreatment: "outline", letterSpacing: -2, lineHeight: 0.95, z: 3 }),
        text("copy3", 80, 770, 1000, 50, 28, "copy3", "ink", { z: 3 }),
        circle("badge", 1290, 620, 220, "accent", { z: 3 }),
        text("copy2", 1310, 670, 180, 120, 96, "copy2", "bg", { ...stat, align: "center", z: 4 }),
      ])
    );

    const curve: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1440, 100, 76, "title", "ink", display),
      rect("base", 80, 760, 1440, 3, "line"),
    ];
    const heights = [140, 230, 330, 450, 580];
    const fills = ["surface", "surface_color", "line", "muted", "accent"];
    heights.forEach((h, i) => {
      const x = 80 + i * 296;
      curve.push(rect("bar" + i, x, 760 - h, 260, h, fills[i]));
      curve.push(text("copy" + (i * 2 + 1), x, 760 - h + 24, 260, 52, 40, "copy" + (i * 2 + 1), i === 4 ? "bg" : "ink", { ...display, align: "center" }));
      curve.push(text("copy" + i * 2, x, 785, 260, 44, 26, "copy" + i * 2, "muted", { align: "center" }));
    });
    kits.push(writeKit("feature", "roast-theory-curve", f, curve));

    const origins: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1440, 100, 76, "title", "ink", display),
    ];
    for (let i = 0; i < 3; i++) {
      const x = 80 + i * 480;
      origins.push(rect("card" + i, x, 190, 440, 640, "surface"));
      origins.push(rect("stripe" + i, x, 190, 440, 10, "accent", { z: 2 }));
      origins.push(text("copy" + i * 3, x + 40, 240, 360, 170, 150, "copy" + i * 3, "accent", { ...stat, letterSpacing: -2 }));
      origins.push(text("copy" + (i * 3 + 1), x + 40, 440, 360, 50, 34, "copy" + (i * 3 + 1), "ink"));
      origins.push(text("copy" + (i * 3 + 2), x + 40, 510, 360, 260, 26, "copy" + (i * 3 + 2), "muted", { lineHeight: 1.35 }));
    }
    kits.push(writeKit("feature", "roast-theory-origins", f, origins));

    const drum: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      photo("photo", 80, 110, 680, 680, { mask: "circle", zoom: 1.3 }),
      circle("dot", 640, 120, 90, "accent", { z: 2 }),
      text("title", 840, 100, 700, 100, 76, "title", "ink", display),
    ];
    for (let i = 0; i < 3; i++) {
      const y = 250 + i * 210;
      drum.push(text("copy" + i * 2, 840, y, 680, 48, 34, "copy" + i * 2, "accent"));
      drum.push(text("copy" + (i * 2 + 1), 840, y + 56, 680, 110, 26, "copy" + (i * 2 + 1), "muted", { lineHeight: 1.3 }));
      if (i < 2) drum.push(rect("rule" + i, 840, y + 185, 680, 2, "line"));
    }
    kits.push(writeKit("feature", "roast-theory-drum", f, drum));

    const ratio: El[] = [
      rect("bg", 0, 0, 1600, 900, "surface_color", { z: 0 }),
      text("title", 80, 70, 1440, 70, 48, "title", "muted", { align: "center" }),
      text("copy0", 80, 170, 1440, 340, 300, "copy0", "accent", { ...stat, align: "center", letterSpacing: -6, lineHeight: 1.0 }),
    ];
    for (let i = 0; i < 3; i++) {
      const x = 80 + i * 500;
      ratio.push(rect("tick" + i, x, 590, 60, 6, "accent"));
      ratio.push(text("copy" + (i * 2 + 1), x, 615, 440, 48, 32, "copy" + (i * 2 + 1), "ink"));
      ratio.push(text("copy" + (i * 2 + 2), x, 672, 440, 120, 24, "copy" + (i * 2 + 2), "muted", { lineHeight: 1.3 }));
    }
    kits.push(writeKit("feature", "roast-theory-ratio", f, ratio));

    kits.push(
      writeKit("feature", "roast-theory-fresh", f, [
        rect("bg", 0, 0, 1600, 900, "accent", { z: 0 }),
        circle("bean", 720, 150, 160, "bg"),
        text("title", 80, 360, 1440, 140, 110, "title", "bg", { ...display, align: "center" }),
        text("copy0", 80, 530, 1440, 50, 30, "copy0", "bg", { align: "center" }),
      ])
    );
    return kits;
  },
};

const ideaWall: Template = {
  id: "idea-wall",
  name: "Idea Wall • Workshop kit",
  description: "Workshop deck — a pinned sticky note over a real wall, staggered step notes, affinity clusters and a dot vote.",
  family: "idea-wall",
  brand: {
    colors: {
      bg: "#FFFDF7",
      surface: "#FFE45C",
      surface_color: "#7BD3F7",
      ink: "#161616",
      muted: "#55524A",
      accent: "#D92638",
      line: "#E6E1D3",
    },
    fonts: { display: "Poppins Bold", body: "Poppins" },
  },
  slides: [
    {
      role: "cover",
      title: "Idea **Wall**",
      items: ["Workshop kit · 3 hours", "40 notes · 6 clusters · 1 decision"],
      photoQuery: "95988ad283",
    },
    {
      role: "feature",
      title: "How it works",
      items: [
        "01",
        "Dump",
        "Everyone writes alone for ten minutes. One idea per note.",
        "02",
        "Cluster",
        "Silently move notes into groups. Name a group only when it is obvious.",
        "03",
        "Vote",
        "Three dots each. Spend them on what you would actually fund.",
      ],
    },
    {
      role: "feature",
      title: "Clusters",
      items: [
        "Onboarding",
        "Shorter first-run checklist",
        "Welcome call in week one",
        "Pricing",
        "One plan for small teams",
        "Annual discount up front",
        "Support",
        "Reply inside four hours",
        "Public status page",
      ],
    },
    {
      role: "feature",
      title: "Day one",
      items: [
        "Before lunch",
        "Two hundred notes went up before anyone sat back down.",
        "After lunch",
        "The wall got quieter. Duplicates were stacked, not thrown away.",
        "214 notes",
      ],
      photoQuery: "95988ad283",
    },
    {
      role: "feature",
      title: "Dot vote",
      items: [
        "Welcome call in week one",
        "14",
        "One plan for small teams",
        "9",
        "Public status page",
        "5",
        "The top cluster ships first. Everything else stays on the wall for next quarter.",
      ],
    },
    { role: "feature", title: "Stick with it.", items: ["Idea Wall · workshop kit"] },
  ],
  kits: () => {
    const f = "idea-wall";
    const kits = [];
    kits.push(
      writeKit("cover", "idea-wall-pinned", f, [
        photo("photo", 0, 0, 1600, 900),
        rect("shadow", 478, 170, 680, 600, "ink", { z: 2, opacity: 0.35 }),
        rect("note", 460, 150, 680, 600, "surface", { z: 3 }),
        circle("pin", 770, 118, 60, "accent", { z: 4 }),
        text("copy0", 510, 215, 580, 40, 24, "copy0", "ink", { ...kicker, align: "center", z: 4 }),
        text("title", 500, 270, 600, 350, 130, "title", "ink", { ...display, align: "center", lineHeight: 1.0, z: 4 }),
        text("copy1", 510, 640, 580, 50, 26, "copy1", "ink", { align: "center", z: 4 }),
      ])
    );

    const steps: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 60, 1440, 110, 80, "title", "ink", display),
    ];
    const pos = [
      [80, 230],
      [580, 290],
      [1080, 210],
    ];
    const noteFills = ["surface", "surface_color", "accent"];
    pos.forEach(([x, y], i) => {
      steps.push(rect("shade" + i, x + 14, y + 16, 440, 440, "ink", { opacity: 0.18 }));
      steps.push(rect("note" + i, x, y, 440, 440, noteFills[i], { z: 2 }));
      steps.push(text("copy" + i * 3, x + 40, y + 36, 360, 110, 96, "copy" + i * 3, "ink", { ...stat, z: 3 }));
      steps.push(text("copy" + (i * 3 + 1), x + 40, y + 170, 360, 52, 36, "copy" + (i * 3 + 1), "ink", { z: 3 }));
      steps.push(text("copy" + (i * 3 + 2), x + 40, y + 236, 360, 170, 24, "copy" + (i * 3 + 2), "ink", { lineHeight: 1.35, z: 3 }));
    });
    kits.push(writeKit("feature", "idea-wall-steps", f, steps));

    const clusters: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1440, 110, 80, "title", "ink", display),
    ];
    for (let i = 0; i < 3; i++) {
      const x = 80 + i * 500;
      clusters.push(rect("head" + i, x, 190, 440, 80, "ink"));
      clusters.push(text("copy" + i * 3, x + 30, 208, 380, 46, 30, "copy" + i * 3, "bg", { z: 2 }));
      [0, 1].forEach((k) => {
        const y = 300 + k * 270;
        const nx = x + (k === 0 ? 10 : 30);
        clusters.push(rect("n" + i + k, nx, y, 400, 230, k === 0 ? "surface" : "surface_color"));
        clusters.push(text("copy" + (i * 3 + 1 + k), nx + 30, y + 30, 340, 150, 30, "copy" + (i * 3 + 1 + k), "ink", { lineHeight: 1.25, z: 2 }));
      });
    }
    kits.push(writeKit("feature", "idea-wall-clusters", f, clusters));

    kits.push(
      writeKit("feature", "idea-wall-dayone", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        photo("photo", 0, 0, 1000, 900),
        rect("stickerShade", 892, 652, 220, 200, "ink", { z: 2, opacity: 0.3 }),
        rect("sticker", 880, 640, 220, 200, "surface", { z: 3 }),
        text("copy4", 895, 685, 190, 110, 36, "copy4", "ink", { ...display, align: "center", z: 4 }),
        text("title", 1140, 80, 400, 110, 80, "title", "ink", display),
        rect("rule", 1140, 210, 80, 6, "accent"),
        text("copy0", 1140, 250, 400, 46, 30, "copy0", "accent"),
        text("copy1", 1140, 305, 400, 170, 24, "copy1", "muted", { lineHeight: 1.35 }),
        text("copy2", 1140, 500, 400, 46, 30, "copy2", "accent"),
        text("copy3", 1140, 555, 400, 170, 24, "copy3", "muted", { lineHeight: 1.35 }),
      ])
    );

    const votes: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 60, 1440, 110, 80, "title", "ink", display),
    ];
    [14, 9, 5].forEach((n, i) => {
      const y = 250 + i * 160;
      votes.push(text("copy" + i * 2, 80, y, 440, 50, 28, "copy" + i * 2, "ink"));
      for (let d = 0; d < n; d++) votes.push(circle("v" + i + "_" + d, 560 + d * 58, y + 2, 44, "accent"));
      votes.push(text("copy" + (i * 2 + 1), 1420, y - 6, 120, 60, 44, "copy" + (i * 2 + 1), "accent", { ...display, align: "right" }));
      votes.push(rect("rule" + i, 80, y + 95, 1440, 2, "line"));
    });
    votes.push(text("copy6", 80, 760, 1300, 80, 26, "copy6", "muted", { lineHeight: 1.3 }));
    kits.push(writeKit("feature", "idea-wall-votes", f, votes));

    kits.push(
      writeKit("feature", "idea-wall-stick", f, [
        rect("bg", 0, 0, 1600, 900, "surface", { z: 0 }),
        circle("pin", 770, 200, 60, "accent"),
        text("title", 80, 320, 1440, 150, 120, "title", "ink", { ...display, align: "center" }),
        text("copy0", 80, 500, 1440, 50, 30, "copy0", "ink", { align: "center" }),
      ])
    );
    return kits;
  },
};

runTemplates([tidewater, goldenHour, roastTheory, ideaWall]).catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
