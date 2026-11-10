/**
 * Signature-object templates — each family is drawn around one physical object,
 * and every interior reuses that object's anatomy instead of a shared grid.
 *
 *   side-a-lp        — vinyl half out of its sleeve; tracklist sides, waveform, tour pills
 *   channel-nine     — broadcast test card; programme guide, lower third, VU meters
 *   mono-quarterly   — magazine masthead + barcode; contents, drop cap, hotspot edit
 *   north-cabin      — polaroid stack in falling snow; day polaroids, thermometers, checklist
 *
 *   node -r ts-node/register/transpile-only scripts/generate-signature-batch.ts [--publish-local] [--only=id]
 */
import { Template, text, rect, circle, photo, writeKit, runTemplates, El } from "./lib/designKit";

const serif = { fontWeight: 400 };
const display = { textStyleRole: "display", fontRole: "display" };
const headline = { textStyleRole: "headline", fontRole: "display" };
const kicker = { textStyleRole: "kicker", fontRole: "label" };
const stat = { textStyleRole: "stat", fontRole: "display" };

function vinyl(prefix: string, cx: number, cy: number, size: number, label = "accent", z = 1): El[] {
  const out: El[] = [];
  [1, 0.93, 0.86, 0.79, 0.72, 0.62, 0.5].forEach((r, i) => {
    const s = Math.round(size * r);
    out.push(circle(prefix + "ring" + i, cx - s / 2, cy - s / 2, s, i % 2 ? "surface_color" : "surface", { z }));
  });
  const l = Math.round(size * 0.34);
  out.push(circle(prefix + "label", cx - l / 2, cy - l / 2, l, label, { z }));
  const h = Math.max(10, Math.round(size * 0.03));
  out.push(circle(prefix + "hole", cx - h / 2, cy - h / 2, h, "bg", { z }));
  return out;
}

function barcode(prefix: string, x: number, y: number, w: number, h: number, z: number): El[] {
  const pattern = [2, 1, 4, 1, 1, 2, 3, 1, 1, 3, 2, 1, 4, 2, 1, 1, 3, 1, 2, 2, 1, 4, 1, 1, 2, 3, 1, 2];
  const unit = w / pattern.reduce((a, b) => a + b, 0);
  const out: El[] = [];
  let cursor = x;
  pattern.forEach((p, i) => {
    const width = p * unit;
    if (i % 2 === 0) out.push(rect(prefix + i, Math.round(cursor), y, Math.max(2, Math.round(width)), h, "surface_color", { z }));
    cursor += width;
  });
  return out;
}

function snow(prefix: string, count: number, seed: number, z = 1): El[] {
  let s = seed;
  const rand = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const out: El[] = [];
  for (let i = 0; i < count; i++) {
    const size = Math.round(6 + rand() * 12);
    out.push(
      circle(prefix + i, Math.round(rand() * (1600 - size)), Math.round(rand() * (900 - size)), size, "surface", {
        z,
        opacity: Math.round((0.25 + rand() * 0.55) * 100) / 100,
      })
    );
  }
  return out;
}

const sideA: Template = {
  id: "side-a-lp",
  name: "Side A • Low Tide LP",
  description: "Album launch deck — a record sliding out of its sleeve, side A/B tracklist, waveform single, tour pills.",
  family: "side-a",
  brand: {
    colors: {
      bg: "#EDE6D8",
      surface: "#141414",
      surface_color: "#262626",
      card_bg: "#4A4A4A",
      ink: "#141414",
      muted: "#6E675C",
      accent: "#FF5A1F",
      accent2: "#2F45FF",
      line: "#D3CABA",
    },
    fonts: { display: "Syne", body: "Space Grotesk" },
  },
  slides: [
    {
      role: "cover",
      title: "Low **Tide**",
      items: ["New LP · Out Friday", "Marlow Vance", "12 tracks · 180 g vinyl", "LP"],
      photoQuery: "3410c0ffb7",
    },
    {
      role: "feature",
      title: "Tracklist",
      items: [
        "Side A",
        "Glass Harbour",
        "3:52",
        "Salt Lines",
        "4:10",
        "Northern Room",
        "3:27",
        "Undertow",
        "5:04",
        "Side B",
        "Lamplight",
        "3:41",
        "Ferry at Six",
        "4:22",
        "Low Tide",
        "6:08",
        "Coming Home Slow",
        "4:47",
      ],
    },
    {
      role: "feature",
      title: "Glass **Harbour**",
      items: [
        "The single",
        "1:48",
        "3:52",
        "Recorded live in one take at the old harbour church, with the doors left open to the sea.",
      ],
    },
    {
      role: "feature",
      title: "Pressed",
      items: [
        "33",
        "Revolutions per minute, slow and warm",
        "180",
        "Grams of heavyweight black vinyl",
        "12",
        "Tracks across two sides",
      ],
    },
    {
      role: "feature",
      title: "On tour",
      items: [
        "MAR 14",
        "Glasgow",
        "Barrowland Ballroom",
        "Sold out",
        "MAR 16",
        "Manchester",
        "Albert Hall",
        "Sold out",
        "MAR 19",
        "Bristol",
        "SWX",
        "Tickets",
        "MAR 22",
        "London",
        "Roundhouse",
        "Tickets",
      ],
    },
    { role: "feature", title: "Play it loud.", items: ["Afterglow Records · out 14 March"] },
  ],
  kits: () => {
    const f = "side-a";
    const kits = [];
    kits.push(
      writeKit("cover", "side-a-sleeve", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        ...vinyl("disc", 1240, 450, 600, "accent", 1),
        photo("photo", 640, 150, 600, 600, { z: 3, zoom: 1.1, alignX: 0.5 }),
        circle("sticker", 570, 630, 150, "accent2", { z: 4 }),
        text("copy3", 570, 662, 150, 80, 56, "copy3", "bg", { ...display, align: "center", z: 5 }),
        text("copy0", 80, 170, 480, 40, 26, "copy0", "accent", kicker),
        text("title", 80, 220, 520, 330, 140, "title", "ink", { ...display, lineHeight: 1.0 }),
        rect("rule", 80, 560, 80, 6, "accent"),
        text("copy1", 80, 590, 500, 60, 48, "copy1", "ink"),
        text("copy2", 80, 670, 500, 44, 28, "copy2", "muted"),
      ])
    );

    const tracks: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 60, 900, 110, 88, "title", "ink", display),
    ];
    for (let s = 0; s < 2; s++) {
      const x0 = 80 + s * 760;
      tracks.push(...vinyl("mini" + s, x0 + 35, 235, 70, s ? "accent2" : "accent", 1));
      tracks.push(text("copy" + s * 9, x0 + 100, 208, 400, 56, 40, "copy" + s * 9, "ink", headline));
      for (let k = 0; k < 4; k++) {
        const y = 320 + k * 125;
        tracks.push(text("copy" + (s * 9 + 1 + k * 2), x0, y, 520, 52, 36, "copy" + (s * 9 + 1 + k * 2), "ink"));
        tracks.push(text("copy" + (s * 9 + 2 + k * 2), x0 + 540, y + 2, 140, 48, 32, "copy" + (s * 9 + 2 + k * 2), "muted", { align: "right" }));
        tracks.push(rect("rule" + s + k, x0, y + 80, 680, 2, "line"));
      }
    }
    kits.push(writeKit("feature", "side-a-tracklist", f, tracks));

    const wave: El[] = [
      rect("bg", 0, 0, 1600, 900, "surface", { z: 0 }),
      text("copy0", 80, 90, 600, 40, 26, "copy0", "accent", kicker),
      text("title", 80, 140, 1440, 160, 110, "title", "bg", display),
    ];
    for (let i = 0; i < 72; i++) {
      const h = Math.round(30 + 190 * Math.abs(Math.sin(i * 0.41) * Math.cos(i * 0.17)) + 50 * Math.abs(Math.sin(i * 1.9)));
      wave.push(rect("bar" + i, 80 + i * 20, 520 - Math.round(h / 2), 10, h, i < 30 ? "accent" : "card_bg", { radius: 5 }));
    }
    wave.push(rect("playhead", 676, 380, 3, 280, "bg", { z: 2 }));
    wave.push(circle("playknob", 668, 368, 20, "bg", { z: 2 }));
    wave.push(text("copy1", 80, 690, 200, 40, 28, "copy1", "line"));
    wave.push(text("copy2", 1320, 690, 200, 40, 28, "copy2", "line", { align: "right" }));
    wave.push(text("copy3", 80, 760, 1100, 90, 28, "copy3", "line", { lineHeight: 1.3 }));
    kits.push(writeKit("feature", "side-a-wave", f, wave));

    const pressed: El[] = [
      rect("bg", 0, 0, 1600, 900, "accent", { z: 0 }),
      ...vinyl("disc", 430, 450, 700, "bg", 1),
      text("title", 900, 70, 620, 110, 72, "title", "surface", display),
    ];
    for (let i = 0; i < 3; i++) {
      const y = 220 + i * 200;
      pressed.push(text("copy" + i * 2, 900, y, 300, 170, 120, "copy" + i * 2, "surface", { ...stat, letterSpacing: -3 }));
      pressed.push(text("copy" + (i * 2 + 1), 1220, y + 40, 300, 90, 28, "copy" + (i * 2 + 1), "surface", { lineHeight: 1.25 }));
      if (i < 2) pressed.push(rect("rule" + i, 900, y + 180, 620, 2, "surface", { opacity: 0.35 }));
    }
    kits.push(writeKit("feature", "side-a-pressed", f, pressed));

    const tour: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 60, 900, 110, 88, "title", "ink", display),
    ];
    for (let k = 0; k < 4; k++) {
      const y = 210 + k * 150;
      const soldOut = k < 2;
      tour.push(text("copy" + k * 4, 80, y + 4, 300, 70, 48, "copy" + k * 4, "accent", headline));
      tour.push(text("copy" + (k * 4 + 1), 420, y, 520, 56, 40, "copy" + (k * 4 + 1), "ink", { fontWeight: 700 }));
      tour.push(text("copy" + (k * 4 + 2), 420, y + 58, 520, 40, 26, "copy" + (k * 4 + 2), "muted"));
      tour.push(rect("pill" + k, 1280, y + 10, 240, 64, soldOut ? "accent" : "surface", { radius: 32 }));
      tour.push(text("copy" + (k * 4 + 3), 1280, y + 20, 240, 44, 28, "copy" + (k * 4 + 3), soldOut ? "surface" : "bg", { align: "center", z: 5 }));
      tour.push(rect("rule" + k, 80, y + 122, 1440, 2, "line"));
    }
    kits.push(writeKit("feature", "side-a-tour", f, tour));

    kits.push(
      writeKit("feature", "side-a-loud", f, [
        rect("bg", 0, 0, 1600, 900, "accent2", { z: 0 }),
        ...vinyl("disc", 1210, 450, 700, "accent", 1),
        text("title", 80, 300, 720, 250, 110, "title", "bg", { ...display, lineHeight: 1.0 }),
        text("copy0", 80, 590, 720, 44, 30, "copy0", "bg"),
      ])
    );
    return kits;
  },
};

const channelNine: Template = {
  id: "channel-nine",
  name: "Channel Nine • Media kit",
  description: "Broadcast media kit — test-card cover, prime-time guide grid, live lower third, VU audience meters.",
  family: "channel-nine",
  brand: {
    colors: {
      bg: "#0D0D0F",
      surface: "#EDEDE6",
      surface_color: "#F2C83A",
      card_bg: "#4CB963",
      ink: "#EDEDE6",
      muted: "#9A9AA3",
      accent: "#E5403A",
      accent2: "#35BEDD",
      line: "#3046D8",
    },
    fonts: { display: "Antonio", body: "Space Grotesk" },
  },
  slides: [
    {
      role: "cover",
      title: "Channel **Nine**",
      items: ["On air", "Media kit 2027", "Season 14 · weeknights 21:00", "9"],
    },
    {
      role: "feature",
      title: "Tonight on Nine",
      items: [
        "19:00",
        "20:00",
        "21:00",
        "22:00",
        "Nine",
        "Nine+",
        "Nine Sport",
        "Nine News",
        "The Long Table",
        "Harbour Lights",
        "Quiz",
        "Night Market",
        "Feature: Northbound",
        "Live: Cup semi-final",
        "Extra Time",
        "Highlights",
      ],
    },
    {
      role: "feature",
      title: "Nightly at Nine",
      items: [
        "Hosted by Ren Adler · weeknights 21:00",
        "Up next: Harbour Lights  ·  Then: The Long Table  ·  Weather at 22:55",
        "Live",
        "9",
      ],
      photoQuery: "2c29305c6d",
    },
    {
      role: "feature",
      title: "The numbers",
      items: [
        "Weekly reach",
        "Viewers across TV and stream",
        "2.4M",
        "Prime-time share",
        "Of everyone watching at 21:00",
        "38%",
        "Under 35",
        "Of the Nine+ audience",
        "61%",
      ],
    },
    {
      role: "feature",
      title: "Formats",
      items: [
        "News",
        "Thirty minutes at seven. Local first, then the world.",
        "Drama",
        "Six-part series filmed on the coast, released weekly.",
        "Live sport",
        "Cup nights, finals and highlights straight after.",
      ],
    },
    { role: "feature", title: "Stay tuned.", items: ["Please stand by", "sales@channelnine.tv · +44 20 7946 0109"] },
  ],
  kits: () => {
    const f = "channel-nine";
    const bars = ["surface", "surface_color", "accent2", "card_bg", "accent", "line"];
    const kits = [];

    const card: El[] = [rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })];
    bars.forEach((fill, i) => card.push(rect("bar" + i, i * 267, 0, i === 5 ? 1600 - 5 * 267 : 267, 590, fill)));
    const strip = ["line", "accent", "accent2", "surface"];
    for (let i = 0; i < 16; i++) card.push(rect("strip" + i, i * 100, 590, 100, 60, i % 2 ? "bg" : strip[(i / 2) % 4]));
    card.push(
      circle("ringOuter", 590, 85, 420, "surface", { z: 3 }),
      circle("ringInner", 610, 105, 380, "bg", { z: 4 }),
      text("copy3", 610, 120, 380, 360, 260, "copy3", "surface", { ...stat, align: "center", z: 5 }),
      rect("onair", 80, 60, 200, 60, "accent", { z: 3, radius: 30 }),
      text("copy0", 80, 70, 200, 40, 26, "copy0", "surface", { ...kicker, align: "center", z: 5 }),
      text("title", 80, 680, 900, 185, 130, "title", "ink", display),
      text("copy1", 1000, 700, 520, 40, 28, "copy1", "accent2", { ...kicker, align: "right" }),
      text("copy2", 1000, 760, 520, 44, 28, "copy2", "muted", { align: "right" })
    );
    kits.push(writeKit("cover", "channel-nine-testcard", f, card));

    const guide: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1000, 125, 88, "title", "ink", display),
    ];
    for (let i = 0; i < 4; i++) {
      guide.push(text("copy" + i, 320 + i * 300, 190, 200, 40, 26, "copy" + i, "muted"));
      guide.push(rect("tick" + i, 320 + i * 300, 235, 2, 555, "muted", { opacity: 0.35 }));
    }
    const rows: [number, string][][] = [
      [[1, "surface_color"], [1.5, "accent2"], [1.5, "accent"]],
      [[0.5, "card_bg"], [1.5, "surface"], [2, "surface_color"]],
      [[2, "accent"], [1, "accent2"], [1, "card_bg"]],
    ];
    rows.forEach((row, r) => {
      const y = 260 + r * 180;
      guide.push(text("copy" + (4 + r), 80, y + 50, 230, 56, 38, "copy" + (4 + r), "ink", headline));
      let x = 320;
      row.forEach(([hours, fill], p) => {
        const w = hours * 300;
        const slot = "copy" + (7 + r * 3 + p);
        guide.push(rect("prog" + r + p, x + 4, y, w - 8, 150, fill, { radius: 10 }));
        guide.push(text(slot, x + 24, y + 24, w - 48, 44, 28, slot, "bg", { fontWeight: 700, z: 5 }));
        x += w;
      });
    });
    kits.push(writeKit("feature", "channel-nine-guide", f, guide));

    kits.push(
      writeKit("feature", "channel-nine-lower", f, [
        photo("photo", 0, 0, 1600, 900),
        rect("live", 80, 70, 150, 60, "accent", { z: 2, radius: 6 }),
        text("copy2", 80, 80, 150, 40, 26, "copy2", "surface", { ...kicker, align: "center", z: 3 }),
        circle("bug", 1410, 60, 110, "surface", { z: 2 }),
        text("copy3", 1410, 64, 110, 102, 72, "copy3", "bg", { ...stat, align: "center", z: 3 }),
        rect("tab", 80, 650, 20, 180, "accent", { z: 2 }),
        rect("nameBar", 100, 650, 1000, 110, "surface", { z: 2 }),
        text("title", 130, 655, 940, 102, 72, "title", "bg", { ...display, z: 3 }),
        rect("roleBar", 100, 760, 760, 70, "line", { z: 2 }),
        text("copy0", 130, 773, 720, 44, 28, "copy0", "surface", { z: 3 }),
        rect("crawl", 0, 850, 1600, 50, "surface_color", { z: 2 }),
        text("copy1", 80, 858, 1440, 36, 22, "copy1", "bg", { fontWeight: 700, z: 3 }),
      ])
    );

    const meters: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 60, 1000, 125, 88, "title", "ink", display),
    ];
    const fills = ["surface_color", "accent2", "accent"];
    [17, 12, 14].forEach((n, i) => {
      const y = 250 + i * 190;
      meters.push(text("copy" + i * 3, 80, y, 380, 46, 32, "copy" + i * 3, "ink", { fontWeight: 700 }));
      meters.push(text("copy" + (i * 3 + 1), 80, y + 50, 380, 40, 22, "copy" + (i * 3 + 1), "muted"));
      for (let b = 0; b < 20; b++) {
        meters.push(rect("m" + i + "_" + b, 500 + b * 40, y, 32, 90, b < n ? fills[i] : "surface", b < n ? {} : { opacity: 0.12 }));
      }
      meters.push(text("copy" + (i * 3 + 2), 1320, y - 10, 200, 125, 88, "copy" + (i * 3 + 2), fills[i], { ...stat, align: "right" }));
    });
    kits.push(writeKit("feature", "channel-nine-meters", f, meters));

    const sets: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 60, 1000, 125, 88, "title", "ink", display),
    ];
    ["surface_color", "accent2", "accent"].forEach((fill, i) => {
      const x = 80 + i * 500;
      sets.push(rect("screen" + i, x, 210, 440, 300, fill, { radius: 40 }));
      sets.push(text("copy" + i * 2, x + 30, 300, 380, 110, 72, "copy" + i * 2, "bg", { ...display, align: "center", z: 5 }));
      sets.push(rect("neck" + i, x + 190, 510, 60, 36, "muted"));
      sets.push(rect("foot" + i, x + 120, 546, 200, 12, "muted", { radius: 6 }));
      sets.push(text("copy" + (i * 2 + 1), x, 600, 440, 150, 26, "copy" + (i * 2 + 1), "muted", { align: "center", lineHeight: 1.35 }));
    });
    kits.push(writeKit("feature", "channel-nine-sets", f, sets));

    const standby: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("copy0", 80, 220, 1440, 40, 26, "copy0", "accent2", { ...kicker, align: "center" }),
      text("title", 80, 280, 1440, 215, 150, "title", "ink", { ...display, align: "center" }),
    ];
    bars.forEach((fill, i) => standby.push(rect("bar" + i, 80 + i * 240, 540, 240, 28, fill)));
    standby.push(text("copy1", 80, 610, 1440, 44, 30, "copy1", "muted", { align: "center" }));
    kits.push(writeKit("feature", "channel-nine-standby", f, standby));
    return kits;
  },
};

const mono: Template = {
  id: "mono-quarterly",
  name: "Mono • Issue 04",
  description: "Magazine deck — masthead cover with barcode, contents with page numerals, drop-cap opener, hotspot edit.",
  family: "mono-quarterly",
  brand: {
    colors: {
      bg: "#F4F0E8",
      surface: "#FFFFFF",
      surface_color: "#151515",
      ink: "#151515",
      muted: "#6A645B",
      accent: "#C4202F",
      line: "#D8D1C4",
    },
    fonts: { display: "Playfair Display", body: "Calibri" },
  },
  slides: [
    {
      role: "cover",
      title: "MONO",
      items: [
        "Issue 04 · Winter 2027 · £12",
        "The quiet issue",
        "12 rooms that changed how we live",
        "Linen, light and the art of staying in",
        "04",
      ],
      photoQuery: "40d44af8da",
    },
    {
      role: "feature",
      title: "Contents",
      items: [
        "Issue 04 · Winter",
        "08",
        "The reading room",
        "A library built for one chair and a long winter.",
        "24",
        "Rooms that breathe",
        "Four homes where the windows stay open.",
        "41",
        "Slow furniture",
        "Pieces that take a year to make.",
        "56",
        "The edit",
        "Damask, brass and the return of pattern.",
        "Cover: the reading room at Halloran House",
      ],
      photoQuery: "2f2c9b2667",
    },
    {
      role: "feature",
      title: "Rooms that **breathe**",
      items: [
        "Interiors",
        "Four homes where the windows stay open and the furniture stays put.",
        "Words Ines Halloran · Photographs Teo Marsh",
        "T",
        "he house sits back from the road behind a hedge of hawthorn. Inside, nothing is new and nothing is precious: a linen sofa, a table built from an old barn door, and light that moves through the rooms like a slow tide.",
      ],
      photoQuery: "9979c5dbc7",
    },
    {
      role: "feature",
      title: "We stopped buying things for the house and started **living** in it.",
      items: ["— Ines Halloran, page 41", "Mono · Issue 04", "41", "“"],
    },
    {
      role: "feature",
      title: "The edit",
      items: [
        "1",
        "2",
        "3",
        "1",
        "Brass oval mirror",
        "Hand-finished, 90 cm. £420",
        "2",
        "Damask wall linen",
        "Printed in Lyon, by the metre. £68",
        "3",
        "Velvet drape",
        "Floor-length in oxblood. £210",
      ],
      photoQuery: "141ae86a78",
    },
    { role: "feature", title: "Next issue: Light.", items: ["MONO", "On newsstands 1 March", "05"] },
  ],
  kits: () => {
    const f = "mono-quarterly";
    const kits = [];
    kits.push(
      writeKit("cover", "mono-masthead", f, [
        photo("photo", 0, 0, 1600, 900, { alignX: 0.5 }),
        rect("scrim", 0, 0, 1600, 900, "surface_color", { z: 2, opacity: 0.22 }),
        text("title", 60, 10, 1200, 426, 300, "title", "surface", { ...display, letterSpacing: 8, lineHeight: 1.0, z: 3 }),
        text("copy0", 70, 420, 700, 40, 24, "copy0", "surface", { ...kicker, z: 3 }),
        text("copy1", 70, 490, 480, 200, 76, "copy1", "surface", { ...display, ...serif, lineHeight: 1.05, z: 3 }),
        rect("rule", 70, 700, 60, 4, "accent", { z: 3 }),
        text("copy2", 70, 725, 600, 44, 30, "copy2", "surface", { z: 3 }),
        text("copy3", 70, 778, 600, 40, 26, "copy3", "surface", { z: 3 }),
        rect("codeCard", 1330, 720, 200, 130, "surface", { z: 3 }),
        ...barcode("code", 1345, 735, 170, 78, 4),
        text("copy4", 1345, 818, 170, 29, 20, "copy4", "ink", { z: 5 }),
      ])
    );

    const contents: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 860, 137, 96, "title", "ink", { ...display, ...serif }),
      text("copy0", 80, 190, 600, 36, 22, "copy0", "accent", kicker),
      photo("photo", 1040, 60, 480, 700, { zoom: 1.4, alignX: 0.45 }),
      text("copy13", 1040, 780, 480, 40, 22, "copy13", "muted"),
    ];
    for (let k = 0; k < 4; k++) {
      const y = 250 + k * 140;
      contents.push(text("copy" + (1 + k * 3), 80, y, 170, 120, 84, "copy" + (1 + k * 3), "accent", { ...stat, ...serif }));
      contents.push(text("copy" + (2 + k * 3), 280, y + 10, 680, 54, 38, "copy" + (2 + k * 3), "ink", { ...headline, ...serif }));
      contents.push(text("copy" + (3 + k * 3), 280, y + 66, 680, 40, 24, "copy" + (3 + k * 3), "muted"));
      contents.push(rect("rule" + k, 80, y + 128, 880, 1, "line"));
    }
    kits.push(writeKit("feature", "mono-contents", f, contents));

    kits.push(
      writeKit("feature", "mono-opener", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        photo("photo", 0, 0, 760, 900, { alignX: 0.6 }),
        text("copy0", 840, 90, 680, 36, 22, "copy0", "accent", kicker),
        text("title", 840, 140, 680, 200, 84, "title", "ink", { ...display, ...serif, lineHeight: 1.05 }),
        text("copy1", 840, 360, 680, 100, 30, "copy1", "ink", { lineHeight: 1.3 }),
        text("copy2", 840, 480, 680, 30, 18, "copy2", "muted", kicker),
        rect("rule", 840, 540, 680, 1, "line"),
        text("copy3", 840, 560, 120, 242, 170, "copy3", "accent", { ...stat, ...serif, lineHeight: 1.0 }),
        text("copy4", 980, 585, 540, 230, 24, "copy4", "ink", { lineHeight: 1.4 }),
      ])
    );

    kits.push(
      writeKit("feature", "mono-quote", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("copy3", 80, 40, 240, 520, 360, "copy3", "accent", { ...stat, ...serif, lineHeight: 1.0 }),
        text("title", 360, 180, 900, 240, 64, "title", "ink", { textStyleRole: "quote", fontRole: "display", ...serif, lineHeight: 1.15 }),
        text("copy0", 360, 470, 900, 36, 22, "copy0", "muted", kicker),
        rect("rule", 80, 800, 1440, 1, "line"),
        text("copy1", 80, 820, 500, 30, 20, "copy1", "muted", kicker),
        text("copy2", 1220, 820, 300, 30, 20, "copy2", "muted", { ...kicker, align: "right" }),
      ])
    );

    const edit: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      photo("photo", 0, 0, 900, 900, { alignX: 0.45 }),
      text("title", 980, 70, 540, 120, 84, "title", "ink", { ...display, ...serif }),
    ];
    [
      [300, 220],
      [620, 380],
      [260, 620],
    ].forEach(([x, y], i) => {
      edit.push(circle("spotHalo" + i, x - 10, y - 10, 84, "surface", { z: 2, opacity: 0.55 }));
      edit.push(circle("spot" + i, x, y, 64, "accent", { z: 3 }));
      edit.push(text("copy" + i, x, y + 14, 64, 36, 26, "copy" + i, "surface", { fontWeight: 700, align: "center", z: 4 }));
    });
    for (let k = 0; k < 3; k++) {
      const y = 250 + k * 190;
      edit.push(text("copy" + (3 + k * 3), 980, y - 6, 60, 57, 40, "copy" + (3 + k * 3), "accent", { ...display, ...serif }));
      edit.push(text("copy" + (4 + k * 3), 1050, y, 470, 46, 32, "copy" + (4 + k * 3), "ink", { ...headline, ...serif }));
      edit.push(text("copy" + (5 + k * 3), 1050, y + 52, 470, 70, 24, "copy" + (5 + k * 3), "muted", { lineHeight: 1.3 }));
      edit.push(rect("rule" + k, 980, y + 150, 540, 1, "line"));
    }
    kits.push(writeKit("feature", "mono-edit", f, edit));

    kits.push(
      writeKit("feature", "mono-back", f, [
        rect("bg", 0, 0, 1600, 900, "accent", { z: 0 }),
        text("copy0", 80, 90, 1440, 91, 64, "copy0", "surface", { ...display, letterSpacing: 20, align: "center" }),
        text("title", 80, 330, 1440, 157, 110, "title", "surface", { ...display, ...serif, align: "center" }),
        text("copy1", 80, 500, 1440, 44, 30, "copy1", "surface", { align: "center" }),
        rect("codeCard", 1330, 720, 200, 130, "surface", { z: 2 }),
        ...barcode("code", 1345, 735, 170, 78, 3),
        text("copy2", 1345, 818, 170, 29, 20, "copy2", "ink", { z: 5 }),
      ])
    );
    return kits;
  },
};

const northCabin: Template = {
  id: "north-cabin",
  name: "North Cabin • Winter retreat",
  description: "Team retreat deck — a polaroid stack in falling snow, day polaroids, thermometer forecast and a packing checklist.",
  family: "north-cabin",
  brand: {
    colors: {
      bg: "#1F3A33",
      surface: "#FBF8F2",
      surface_color: "#2B4A42",
      card_bg: "#E6DFD0",
      ink: "#FBF8F2",
      muted: "#A9BDB5",
      accent: "#EF8354",
      accent2: "#F6C453",
      line: "#36574E",
    },
    fonts: { display: "Fraunces", body: "Calibri" },
  },
  slides: [
    {
      role: "cover",
      title: "North **Cabin**",
      items: ["Winter retreat · 3 nights", "Team offsite · 14–17 February", "Lake Varde, February"],
      photoQuery: "80c3658377",
    },
    {
      role: "feature",
      title: "Three days",
      items: [
        "Fri",
        "Arrive by dark",
        "Sauna, soup and a slow first night by the stove.",
        "Sat",
        "Out on the ice",
        "Snowshoes at nine, strategy in the glass house after lunch.",
        "Sun",
        "Plan the year",
        "One room, one wall, one plan. Train home at four.",
      ],
    },
    {
      role: "feature",
      title: "Where we stay",
      items: [
        "Three glass houses",
        "Each sleeps four, with a wood stove and a view of the lake.",
        "One long table",
        "Breakfast and dinner together in the main cabin.",
        "No signal by design",
        "Wi-Fi in the work room only. The rest of the woods stay quiet.",
        "The glass houses, Varde",
      ],
      photoQuery: "cce4400950",
    },
    {
      role: "feature",
      title: "The forecast",
      items: [
        "-8°",
        "Friday",
        "-12°",
        "Saturday",
        "-3°",
        "Sunday",
        "1°",
        "Monday",
        "Below -10° the lake is safe for skating by the north jetty.",
      ],
    },
    {
      role: "feature",
      title: "Pack light, pack warm",
      items: [
        "Wool socks, two pairs",
        "Thermal base layer",
        "Swimsuit for the sauna",
        "Head torch",
        "Laptop and charger",
        "A paper notebook",
        "A book for the train",
        "Something to share",
        "Boots and crampons are waiting at the cabin.",
      ],
    },
    { role: "feature", title: "See you by the **fire**.", items: ["North Cabin · Lake Varde", "14–17 February"] },
  ],
  kits: () => {
    const f = "north-cabin";
    const kits = [];
    kits.push(
      writeKit("cover", "north-cabin-polaroid", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        ...snow("snow", 46, 7),
        rect("backCard", 175, 150, 600, 690, "card_bg", { z: 2 }),
        rect("frame", 120, 100, 600, 690, "surface", { z: 3 }),
        photo("photo", 150, 130, 540, 520, { z: 4, zoom: 1.5, alignX: 0.62, alignY: 0.55 }),
        text("copy2", 150, 680, 540, 49, 34, "copy2", "bg", { fontRole: "display", ...serif, z: 5 }),
        rect("tape", 360, 78, 120, 48, "accent2", { z: 6, opacity: 0.8 }),
        text("copy0", 840, 230, 680, 40, 26, "copy0", "accent2", kicker),
        text("title", 840, 290, 640, 300, 150, "title", "ink", { ...display, lineHeight: 1.0 }),
        rect("rule", 840, 620, 80, 4, "accent"),
        text("copy1", 840, 650, 640, 46, 32, "copy1", "muted"),
      ])
    );

    const days: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      ...snow("snow", 22, 31),
      text("title", 80, 50, 1000, 125, 88, "title", "ink", display),
    ];
    const blocks = ["accent", "accent2", "muted"];
    [0, 40, 10].forEach((dy, i) => {
      const x = 80 + i * 500;
      const y = 200 + dy;
      days.push(rect("frame" + i, x, y, 440, 600, "surface", { z: 2 }));
      days.push(rect("block" + i, x + 24, y + 24, 392, 380, blocks[i], { z: 3 }));
      days.push(text("copy" + i * 3, x + 24, y + 130, 392, 156, 110, "copy" + i * 3, "bg", { ...display, align: "center", z: 4 }));
      days.push(text("copy" + (i * 3 + 1), x + 24, y + 425, 392, 49, 34, "copy" + (i * 3 + 1), "bg", { fontRole: "display", fontWeight: 600, z: 4 }));
      days.push(text("copy" + (i * 3 + 2), x + 24, y + 480, 392, 100, 22, "copy" + (i * 3 + 2), "surface_color", { lineHeight: 1.3, z: 4 }));
      days.push(rect("tape" + i, x + 170, y - 18, 100, 40, "card_bg", { z: 5, opacity: 0.9 }));
    });
    kits.push(writeKit("feature", "north-cabin-days", f, days));

    const stay: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      ...snow("snow", 18, 53),
      rect("frame", 860, 90, 660, 740, "surface", { z: 2 }),
      photo("photo", 890, 120, 600, 560, { z: 3, zoom: 1.2, alignX: 0.45 }),
      text("copy6", 890, 705, 600, 46, 32, "copy6", "bg", { fontRole: "display", ...serif, z: 4 }),
      rect("tape", 1130, 66, 120, 48, "accent2", { z: 5, opacity: 0.8 }),
      text("title", 80, 100, 740, 114, 80, "title", "ink", display),
    ];
    for (let k = 0; k < 3; k++) {
      const y = 290 + k * 170;
      stay.push(rect("bullet" + k, 80, y + 12, 18, 18, "accent"));
      stay.push(text("copy" + k * 2, 124, y, 640, 46, 32, "copy" + k * 2, "ink", { fontWeight: 700 }));
      stay.push(text("copy" + (k * 2 + 1), 124, y + 50, 640, 90, 24, "copy" + (k * 2 + 1), "muted", { lineHeight: 1.35 }));
    }
    kits.push(writeKit("feature", "north-cabin-stay", f, stay));

    const forecast: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1000, 125, 88, "title", "ink", display),
    ];
    const tempFills = ["muted", "muted", "accent2", "accent"];
    [-8, -12, -3, 1].forEach((t, i) => {
      const cx = 260 + i * 360;
      const fillH = 120 + (t + 14) * 18;
      forecast.push(rect("tube" + i, cx - 28, 230, 56, 430, "line", { radius: 28 }));
      forecast.push(rect("mercury" + i, cx - 28, 660 - fillH, 56, fillH, tempFills[i], { z: 2, radius: 28 }));
      forecast.push(circle("bulb" + i, cx - 55, 610, 110, tempFills[i], { z: 3 }));
      forecast.push(text("copy" + i * 2, cx + 44, 660 - fillH - 30, 160, 91, 64, "copy" + i * 2, "ink", { ...stat, ...serif }));
      forecast.push(text("copy" + (i * 2 + 1), cx - 140, 740, 280, 40, 28, "copy" + (i * 2 + 1), "muted", { align: "center" }));
    });
    forecast.push(text("copy8", 80, 815, 1440, 40, 24, "copy8", "muted", { align: "center" }));
    kits.push(writeKit("feature", "north-cabin-forecast", f, forecast));

    const pack: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1440, 114, 80, "title", "ink", display),
    ];
    for (let c = 0; c < 2; c++) {
      const x0 = 80 + c * 760;
      for (let k = 0; k < 4; k++) {
        const y = 220 + k * 130;
        const n = c * 4 + k;
        pack.push(rect("box" + n, x0, y, 52, 52, "surface", { radius: 8 }));
        pack.push(rect("hole" + n, x0 + 6, y + 6, 40, 40, "bg", { z: 2, radius: 5 }));
        if (n < 5) pack.push(rect("check" + n, x0 + 14, y + 14, 24, 24, "accent", { z: 3, radius: 4 }));
        pack.push(text("copy" + n, x0 + 80, y + 2, 600, 49, 34, "copy" + n, "ink"));
        pack.push(rect("rule" + n, x0, y + 100, 680, 1, "line"));
      }
    }
    pack.push(text("copy8", 80, 780, 1440, 40, 26, "copy8", "muted"));
    kits.push(writeKit("feature", "north-cabin-pack", f, pack));

    kits.push(
      writeKit("feature", "north-cabin-fire", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        ...snow("snow", 40, 97),
        text("copy1", 80, 200, 1440, 40, 26, "copy1", "accent2", { ...kicker, align: "center" }),
        circle("flameOuter", 680, 290, 240, "accent", { z: 2 }),
        circle("flameInner", 720, 370, 160, "accent2", { z: 3 }),
        circle("flameCore", 760, 440, 80, "surface", { z: 4 }),
        rect("log0", 620, 525, 360, 40, "card_bg", { z: 5, radius: 20 }),
        rect("log1", 660, 570, 280, 36, "muted", { z: 5, radius: 18 }),
        text("title", 80, 650, 1440, 137, 96, "title", "ink", { ...display, align: "center" }),
        text("copy0", 80, 800, 1440, 40, 26, "copy0", "muted", { align: "center" }),
      ])
    );
    return kits;
  },
};

runTemplates([sideA, channelNine, mono, northCabin]).catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
