/**
 * Totally different motion flagships — NOT card/ticket walls.
 *
 *   orbit-meridian  — concentric rings + orbs (circle-native)
 *   wire-latitude   — hairline grid + type + node dots (no filled panels)
 *
 *   node -r ts-node/register/transpile-only scripts/generate-orbit-wire.ts [--publish-local] [--only=id]
 */
import {
  Template,
  text,
  rect,
  circle,
  photo,
  writeKit,
  runTemplates,
  El,
  asBeat,
  asChrome,
  asLabel,
  asDot,
  asTitle,
  asStage,
} from "./lib/designKit";

/** Avoid textStyleRole — theme display size (~41) fights hand-tuned boxes. */
const display = { fontRole: "display", fontWeight: 700 };
const kicker = { fontRole: "label", letterSpacing: 2, fontWeight: 600 };

/** Thin structural line (wire), never a content card. */
const wire = (id: string, x: number, y: number, w: number, h: number, fill = "line"): El =>
  asChrome(rect(id, x, y, w, h, fill, { z: 1 }));

/** Annular ring: outer disc + inner punch (bg) so it reads as a stroke. */
const annulus = (
  id: string,
  cx: number,
  cy: number,
  outer: number,
  thickness: number,
  fill: string,
  punch = "bg",
  z = 1
): El[] => {
  const ox = cx - outer / 2;
  const oy = cy - outer / 2;
  const inner = Math.max(outer - thickness * 2, 8);
  const ix = cx - inner / 2;
  const iy = cy - inner / 2;
  return [
    asChrome(circle(id + "o", ox, oy, outer, fill, { z, opacity: fill === "line" ? 0.55 : 1 })),
    asChrome(circle(id + "i", ix, iy, inner, punch, { z: z + 1 })),
  ];
};

/** Soft depth disc behind an orb. */
const shade = (id: string, x: number, y: number, s: number, z = 1): El =>
  asChrome(circle(id, x + 14, y + 18, s, "ink", { z, opacity: 0.12 }));

/** Dotted trail between two centers (orbital connector). */
const trail = (
  id: string,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  n = 7,
  fill = "line",
  z = 1
): El[] => {
  const out: El[] = [];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t - 5;
    const y = y0 + (y1 - y0) * t - 5;
    out.push(asChrome(circle(id + "_" + i, x, y, 10, fill, { z, opacity: 0.7 })));
  }
  return out;
};

/** Tick marks around a circle (degree markers). */
const ticks = (
  id: string,
  cx: number,
  cy: number,
  r: number,
  count: number,
  fill = "accent",
  size = 14,
  z = 2
): El[] => {
  const out: El[] = [];
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(ang) * r - size / 2;
    const y = cy + Math.sin(ang) * r - size / 2;
    out.push(asChrome(circle(id + "_" + i, x, y, size, i % 4 === 0 ? fill : "ink", { z, opacity: i % 4 === 0 ? 1 : 0.45 })));
  }
  return out;
};

// ─────────────────────────────────────────────────────────────
// ORBIT MERIDIAN — rings, orbs, radial reading
// ─────────────────────────────────────────────────────────────
const orbit: Template = {
  id: "orbit-meridian",
  name: "Orbit Meridian • Field kit",
  description:
    "Circle-native deck — deep ice field, annular meridians, shaded orbs, radial trails. No rectangular cards.",
  family: "orbit-meridian",
  brand: {
    colors: {
      bg: "#C9DCE6",
      surface: "#F7FBFD",
      surface_color: "#8FB4C6",
      ink: "#061018",
      muted: "#3D5A68",
      accent: "#FF3B1F",
      line: "#5E8496",
    },
    fonts: { display: "Georgia", body: "Calibri" },
  },
  slides: [
    {
      role: "cover",
      title: "ORBIT",
      items: ["FIELD KIT · LAT 41", "Ring · mark · return"],
      photoQuery: "ed2250ed0c",
    },
    {
      role: "feature",
      title: "Three rings",
      items: ["Core", "Decide", "Orbit", "Explore", "Rim", "Watch"],
    },
    {
      role: "feature",
      title: "Meridian",
      items: ["North", "Brief", "East", "Build", "South", "Ship", "West", "Learn", "Core", "Hold"],
    },
    {
      role: "feature",
      title: "Constellation",
      items: ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta"],
    },
    {
      role: "feature",
      title: "Pulse",
      items: ["Day", "18", "Week", "64", "Month", "210"],
    },
    {
      role: "feature",
      title: "Sighting",
      items: ["Hold", "True north holds when the rim is quiet."],
      photoQuery: "ed2250ed0c",
    },
    {
      role: "quote",
      title: "LOG",
      items: ["Stay in orbit until the signal is clean.", "— Field note"],
    },
    {
      role: "closing",
      title: "Return.",
      items: ["Orbit Meridian · field kit"],
    },
  ],
  kits: () => {
    const f = "orbit-meridian";
    const kits: ReturnType<typeof writeKit>[] = [];
    const cx = 800;
    const cy = 470;

    // 1 Cover — off-center seal, translucent rings, ticks, accent satellite
    kits.push(
      writeKit("cover", "orbit-cover", f, [
        photo("photo", 0, 0, 1600, 900),
        asChrome(rect("veil", 0, 0, 1600, 900, "ink", { z: 2, opacity: 0.45 })),
        asChrome(rect("vignetteL", 0, 0, 260, 900, "ink", { z: 2, opacity: 0.4 })),
        asChrome(rect("vignetteR", 1340, 0, 260, 900, "ink", { z: 2, opacity: 0.4 })),
        asChrome(circle("ringA", 330, 70, 780, "surface", { z: 3, opacity: 0.12 })),
        asChrome(circle("ringB", 400, 140, 640, "accent", { z: 3, opacity: 0.16 })),
        asChrome(circle("ringC", 470, 210, 500, "surface", { z: 3, opacity: 0.2 })),
        ...ticks("ct", 720, 460, 340, 24, "accent", 12, 4),
        shade("sh", 530, 280, 380, 4),
        asBeat(circle("note", 530, 280, 380, "surface", { z: 5 }), { morphId: "note-0" }),
        asChrome(circle("rim", 548, 298, 344, "accent", { z: 5, opacity: 0.14 })),
        asLabel(text("copy0", 575, 340, 290, 36, 16, "copy0", "accent", { ...kicker, align: "center", z: 6 }), "note"),
        asTitle(text("title", 555, 390, 330, 110, 68, "title", "ink", { ...display, align: "center", z: 6 })),
        asLabel(text("copy1", 575, 530, 290, 40, 18, "copy1", "muted", { align: "center", z: 6 }), "note"),
        asBeat(circle("note1", 1180, 160, 140, "accent", { z: 5 }), { morphId: "note-1" }),
        asChrome(circle("note1in", 1210, 190, 80, "surface", { z: 5, opacity: 0.35 })),
        asBeat(circle("note2", 1280, 620, 100, "surface", { z: 5 }), { morphId: "note-2" }),
        ...trail("tr", 720, 460, 1250, 230, 6, "accent", 4),
      ])
    );

    // 2 Three rings — nested guides + shaded overlapping orbs + rank numbers
    const rings: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asChrome(circle("wash", -120, -80, 520, "surface", { z: 0, opacity: 0.55 })),
      asChrome(circle("wash2", 1280, 560, 480, "surface_color", { z: 0, opacity: 0.35 })),
      asTitle(text("title", 80, 36, 1440, 70, 48, "title", "ink", display)),
      ...annulus("g0", 800, 520, 820, 10, "line", "bg", 1),
      ...annulus("g1", 800, 520, 580, 8, "line", "bg", 1),
      ...ticks("rt", 800, 520, 410, 12, "accent", 10, 2),
    ];
    const orbs = [
      { id: "note0", x: 140, y: 240, s: 400, fill: "surface" },
      { id: "note1", x: 580, y: 280, s: 380, fill: "accent" },
      { id: "note2", x: 1020, y: 340, s: 320, fill: "ink" },
    ];
    orbs.forEach((o, i) => {
      rings.push(shade("sh" + i, o.x, o.y, o.s, 2));
      rings.push(asBeat(circle(o.id, o.x, o.y, o.s, o.fill, { z: 3 }), { morphId: "note-" + i }));
      // inner glow ring
      rings.push(
        asChrome(
          circle(o.id + "glow", o.x + o.s * 0.08, o.y + o.s * 0.08, o.s * 0.84, o.fill === "accent" ? "ink" : "accent", {
            z: 3,
            opacity: 0.08,
          })
        )
      );
      const ink = o.fill === "surface" ? "ink" : "surface";
      const muted = o.fill === "surface" ? "muted" : "surface";
      rings.push(
        asLabel(
          text("copy" + i * 2, o.x + o.s * 0.16, o.y + o.s * 0.3, o.s * 0.68, 70, 38, "copy" + i * 2, ink, {
            ...display,
            align: "center",
            z: 4,
          }),
          o.id
        )
      );
      rings.push(
        asLabel(
          text("copy" + (i * 2 + 1), o.x + o.s * 0.16, o.y + o.s * 0.52, o.s * 0.68, 50, 20, "copy" + (i * 2 + 1), muted, {
            align: "center",
            z: 4,
          }),
          o.id
        )
      );
    });
    kits.push(writeKit("feature", "orbit-rings", f, rings));

    // 3 Meridian — hub + radial trails + annular field
    const mer: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asChrome(circle("wash", 1100, -100, 600, "surface", { z: 0, opacity: 0.5 })),
      asTitle(text("title", 80, 28, 900, 60, 46, "title", "ink", display)),
      ...annulus("mh", cx, cy, 520, 12, "line", "bg", 1),
      ...annulus("mh2", cx, cy, 320, 8, "accent", "bg", 1),
      ...ticks("mt", cx, cy, 260, 16, "accent", 11, 2),
      shade("hubsh", cx - 120, cy - 120, 240, 2),
      asBeat(circle("hub", cx - 120, cy - 120, 240, "accent", { z: 3 }), { morphId: "note-hub" }),
      asChrome(circle("hubin", cx - 70, cy - 70, 140, "surface", { z: 3, opacity: 0.2 })),
      asLabel(text("copy0", cx - 85, cy - 55, 170, 50, 28, "copy0", "surface", { ...display, align: "center", z: 4 }), "hub"),
      asLabel(text("copy1", cx - 85, cy + 5, 170, 40, 18, "copy1", "surface", { align: "center", z: 4 }), "hub"),
    ];
    // 4 satellites use copy2..copy9
    const sats = [
      [160, 160, 1, 2],
      [1220, 160, 2, 4],
      [160, 600, 3, 6],
      [1220, 600, 4, 8],
    ];
    sats.forEach(([x, y, i, c0]) => {
      const id = "note" + i;
      const scx = x + 115;
      const scy = y + 115;
      mer.push(...trail("t" + i, cx, cy, scx, scy, 8, i % 2 === 0 ? "accent" : "ink", 2));
      mer.push(shade("sh" + i, x, y, 230, 2));
      mer.push(asBeat(circle(id, x, y, 230, "surface", { z: 3 }), { morphId: "note-" + i }));
      mer.push(asChrome(circle(id + "rim", x + 12, y + 12, 206, "line", { z: 3, opacity: 0.35 })));
      mer.push(
        asLabel(text("copy" + c0, x + 30, y + 70, 170, 50, 28, "copy" + c0, "ink", { ...display, align: "center", z: 4 }), id)
      );
      mer.push(
        asLabel(text("copy" + (c0 + 1), x + 30, y + 130, 170, 40, 18, "copy" + (c0 + 1), "muted", { align: "center", z: 4 }), id)
      );
    });
    kits.push(writeKit("feature", "orbit-meridian", f, mer));

    // 4 Constellation — depth, trails between neighbors, accent hero
    const cons: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "ink", { z: 0 })),
      asChrome(circle("wash", -80, -60, 420, "muted", { z: 0, opacity: 0.35 })),
      asChrome(circle("wash2", 1280, 600, 500, "muted", { z: 0, opacity: 0.25 })),
      asTitle(text("title", 80, 40, 1440, 60, 48, "title", "surface", display)),
      ...annulus("cg", 820, 480, 700, 6, "line", "ink", 1),
    ];
    const stars = [
      [100, 150, 240],
      [480, 200, 190],
      [880, 130, 260],
      [1260, 240, 170],
      [260, 520, 210],
      [680, 460, 300],
      [1160, 540, 230],
    ];
    // trails between a few stars
    const links: [number, number][] = [
      [0, 1],
      [1, 2],
      [2, 3],
      [4, 5],
      [5, 6],
      [1, 5],
    ];
    links.forEach(([a, b], li) => {
      const [ax, ay, as] = stars[a];
      const [bx, by, bs] = stars[b];
      cons.push(...trail("cl" + li, ax + as / 2, ay + as / 2, bx + bs / 2, by + bs / 2, 5, "line", 1));
    });
    stars.slice(0, 6).forEach(([x, y, s], i) => {
      const id = "note" + i;
      const hero = i === 5;
      cons.push(shade("csh" + i, x, y, s, 2));
      cons.push(asBeat(circle(id, x, y, s, hero ? "accent" : "surface", { z: 3 }), { morphId: "note-" + i }));
      if (!hero) cons.push(asChrome(circle(id + "rim", x + 10, y + 10, s - 20, "line", { z: 3, opacity: 0.25 })));
      const ink = hero ? "surface" : "ink";
      cons.push(
        asLabel(
          text("copy" + i, x + s * 0.12, y + s * 0.36, s * 0.76, 55, 24, "copy" + i, ink, {
            ...display,
            align: "center",
            z: 4,
          }),
          id
        )
      );
    });
    kits.push(writeKit("feature", "orbit-constellation", f, cons));

    // 5 Pulse — annular path + mixed tick sizes + side meters
    const pulse: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asChrome(circle("wash", 1200, -40, 520, "surface_color", { z: 0, opacity: 0.4 })),
      asTitle(text("title", 80, 36, 900, 60, 46, "title", "ink", display)),
      ...annulus("pr", 860, 500, 700, 14, "line", "bg", 1),
      ...annulus("pr2", 860, 500, 560, 6, "accent", "bg", 1),
      shade("psh", 580, 240, 520, 2),
      asBeat(circle("note0", 580, 240, 520, "surface", { z: 3 }), { morphId: "note-0" }),
      asChrome(circle("pring", 610, 270, 460, "accent", { z: 3, opacity: 0.1 })),
      asLabel(text("copy0", 680, 380, 320, 40, 20, "copy0", "muted", { align: "center", z: 4 }), "note0"),
      asLabel(text("copy1", 660, 430, 360, 140, 92, "copy1", "ink", { ...display, align: "center", z: 4 }), "note0"),
    ];
    for (let d = 0; d < 20; d++) {
      const ang = (d / 20) * Math.PI * 2 - Math.PI / 2;
      const rr = 350;
      const size = d % 5 === 0 ? 44 : 22;
      const dx = 860 + Math.cos(ang) * rr - size / 2;
      const dy = 500 + Math.sin(ang) * rr - size / 2;
      pulse.push(asDot(circle("v0_" + d, dx, dy, size, d % 5 === 0 ? "accent" : "ink"), 0, d));
    }
    [
      [60, 180, 1],
      [60, 520, 2],
    ].forEach(([x, y, i]) => {
      const id = "note" + i;
      pulse.push(shade("psh" + i, x, y, 210, 2));
      pulse.push(asBeat(circle(id, x, y, 210, "ink", { z: 3 }), { morphId: "note-" + i }));
      pulse.push(
        asLabel(text("copy" + i * 2, x + 30, y + 50, 150, 40, 16, "copy" + i * 2, "surface_color", { align: "center", z: 4, ...kicker }), id)
      );
      pulse.push(
        asLabel(
          text("copy" + (i * 2 + 1), x + 30, y + 95, 150, 70, 40, "copy" + (i * 2 + 1), "accent", {
            ...display,
            align: "center",
            z: 4,
          }),
          id
        )
      );
    });
    kits.push(writeKit("feature", "orbit-pulse", f, pulse));

    // 6 Sighting — deep photo, annular frame around callout, accent ticks
    kits.push(
      writeKit("feature", "orbit-sighting", f, [
        photo("photo", 0, 0, 1600, 900),
        asChrome(rect("dim", 0, 0, 1600, 900, "ink", { z: 2, opacity: 0.38 })),
        asChrome(rect("band", 0, 0, 1600, 160, "ink", { z: 2, opacity: 0.45 })),
        asTitle(text("title", 80, 50, 700, 80, 52, "title", "surface", display)),
        ...annulus("sr", 1240, 480, 640, 16, "accent", "ink", 3),
        ...ticks("st", 1240, 480, 300, 12, "accent", 12, 4),
        shade("ssh", 1000, 240, 480, 4),
        asBeat(circle("note", 1000, 240, 480, "surface", { z: 5 }), { morphId: "note-0" }),
        asLabel(text("copy0", 1100, 340, 280, 40, 18, "copy0", "accent", { ...kicker, align: "center", z: 6 }), "note"),
        asLabel(
          text("copy1", 1060, 400, 360, 200, 28, "copy1", "ink", {
            ...display,
            align: "center",
            lineHeight: 1.3,
            z: 6,
          }),
          "note"
        ),
      ])
    );

    // 7 Quote — oversized seal with nested rings
    kits.push(
      writeKit("quote", "orbit-quote", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "ink", { z: 0 })),
        asChrome(circle("wash", -100, 400, 500, "muted", { z: 0, opacity: 0.3 })),
        ...annulus("qh", 800, 450, 820, 14, "line", "ink", 1),
        ...annulus("qh2", 800, 450, 680, 8, "accent", "ink", 1),
        ...ticks("qt", 800, 450, 410, 20, "accent", 10, 2),
        shade("qsh", 420, 150, 760, 2),
        asBeat(circle("note", 420, 150, 760, "surface", { z: 3 }), { morphId: "note-quote" }),
        asTitle(text("title", 500, 260, 600, 56, 20, "title", "accent", { ...kicker, align: "center", z: 4 })),
        asLabel(
          text("copy0", 500, 340, 600, 220, 30, "copy0", "ink", {
            ...display,
            align: "center",
            lineHeight: 1.3,
            z: 4,
          }),
          "note"
        ),
        asLabel(text("copy1", 560, 590, 480, 40, 18, "copy1", "muted", { align: "center", z: 4 }), "note"),
      ])
    );

    // 8 Close — nested rings, tick orbit, accent core
    kits.push(
      writeKit("closing", "orbit-close", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        ...annulus("ch0", 800, 380, 620, 16, "line", "bg", 1),
        ...annulus("ch1", 800, 380, 460, 10, "line", "bg", 1),
        ...annulus("ch2", 800, 380, 320, 8, "accent", "bg", 1),
        ...ticks("cht", 800, 380, 310, 18, "accent", 12, 2),
        shade("csh", 650, 230, 300, 2),
        asBeat(circle("note", 650, 230, 300, "accent", { z: 3 }), { morphId: "note-0" }),
        asChrome(circle("core", 720, 300, 160, "surface", { z: 3, opacity: 0.22 })),
        asTitle(text("title", 80, 700, 1440, 100, 64, "title", "ink", { ...display, align: "center", z: 4 })),
        asChrome(text("copy0", 80, 820, 1440, 40, 18, "copy0", "muted", { align: "center", z: 4, ...kicker })),
      ])
    );

    return kits;
  },
};

// ─────────────────────────────────────────────────────────────
// WIRE LATITUDE — hairlines + type + nodes (no filled content panels)
// ─────────────────────────────────────────────────────────────
const wireLat: Template = {
  id: "wire-latitude",
  name: "Wire Latitude • Signal kit",
  description:
    "Hairline coordinate deck — type and nodes on a wire grid. No filled cards; structure is the linework.",
  family: "wire-latitude",
  brand: {
    colors: {
      bg: "#F3F4F1",
      surface: "#FFFFFF",
      surface_color: "#E7EAE3",
      ink: "#10140F",
      muted: "#5C6558",
      accent: "#C8F000",
      line: "#10140F",
    },
    fonts: { display: "Arial Black", body: "Consolas" },
  },
  slides: [
    {
      role: "cover",
      title: "WIRE",
      items: ["SIGNAL KIT · LAT 00", "Plot · ping · pass"],
      photoQuery: "80346a24bf",
    },
    {
      role: "feature",
      title: "Axes",
      items: ["X", "Time", "Y", "Force", "Z", "Noise"],
    },
    {
      role: "feature",
      title: "Nodes",
      items: ["N1", "Gate", "N2", "Fork", "N3", "Sink", "N4", "Loop"],
    },
    {
      role: "feature",
      title: "Latitudes",
      items: ["40N", "Brief", "20N", "Draft", "0", "Build", "20S", "Ship"],
    },
    {
      role: "feature",
      title: "Ping count",
      items: ["Live", "42", "Queued", "17", "Drop", "3"],
    },
    {
      role: "feature",
      title: "Trace",
      items: ["HOLD", "Follow the wire until the node goes quiet."],
      photoQuery: "80346a24bf",
    },
    {
      role: "quote",
      title: "NOTE",
      items: ["Empty space is a signal too.", "— Desk wall"],
    },
    {
      role: "closing",
      title: "Cut.",
      items: ["Wire Latitude · signal kit"],
    },
  ],
  kits: () => {
    const f = "wire-latitude";
    const kits: ReturnType<typeof writeKit>[] = [];

    const grid = (els: El[]) => {
      // full-slide wire lattice
      for (let i = 0; i < 9; i++) {
        els.push(wire("h" + i, 0, 60 + i * 100, 1600, 2));
        els.push(wire("v" + i, 80 + i * 180, 0, 2, 900));
      }
    };

    // 1 Cover — solid ink reading band + photo stage on the right
    const cover: El[] = [
      photo("photo", 0, 0, 1600, 900),
      asChrome(rect("veilR", 720, 0, 880, 900, "ink", { z: 2, opacity: 0.25 })),
      asChrome(rect("band", 0, 0, 760, 900, "ink", { z: 3 })),
      asChrome(rect("seam", 760, 0, 8, 900, "accent", { z: 4 })),
    ];
    for (let i = 0; i < 7; i++) {
      cover.push(wire("ch" + i, 780, 80 + i * 110, 820, 2, "accent"));
      cover.push(wire("chb" + i, 40, 100 + i * 110, 680, 2, "muted"));
    }
    cover.push(asTitle(text("title", 70, 280, 640, 180, 120, "title", "accent", { ...display, z: 5 })));
    cover.push(asChrome(text("copy0", 70, 500, 620, 40, 20, "copy0", "surface", { z: 5, ...kicker })));
    cover.push(asChrome(text("copy1", 70, 560, 620, 40, 22, "copy1", "surface", { z: 5 })));
    cover.push(asBeat(circle("note0", 1180, 160, 140, "accent", { z: 5 }), { morphId: "note-0" }));
    cover.push(asBeat(circle("note1", 1360, 400, 90, "surface", { z: 5 }), { morphId: "note-1" }));
    cover.push(asBeat(circle("note2", 1220, 620, 120, "accent", { z: 5 }), { morphId: "note-2" }));
    kits.push(writeKit("cover", "wire-cover", f, cover));

    // 2 Axes — giant letter orbs on wire crossings
    const axes: El[] = [asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }))];
    grid(axes);
    axes.push(asTitle(text("title", 100, 40, 600, 60, 48, "title", "ink", display)));
    [
      [200, 200, 0],
      [700, 320, 1],
      [1200, 440, 2],
    ].forEach(([x, y, i]) => {
      const id = "note" + i;
      axes.push(asBeat(circle(id, x, y, 220, "ink", { z: 3 }), { morphId: "note-" + i }));
      axes.push(
        asLabel(text("copy" + i * 2, x + 40, y + 60, 140, 80, 64, "copy" + i * 2, "accent", { ...display, align: "center", z: 4 }), id)
      );
      axes.push(
        asLabel(text("copy" + (i * 2 + 1), x + 30, y + 150, 160, 40, 18, "copy" + (i * 2 + 1), "surface", { align: "center", z: 4 }), id)
      );
    });
    kits.push(writeKit("feature", "wire-axes", f, axes));

    // 3 Nodes — 2×2 node cluster with connecting wires only
    const nodes: El[] = [asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }))];
    grid(nodes);
    nodes.push(asTitle(text("title", 100, 40, 600, 60, 48, "title", "ink", display)));
    // cross wires thicker accent
    nodes.push(asChrome(rect("ax", 200, 448, 1200, 4, "accent", { z: 2 })));
    nodes.push(asChrome(rect("ay", 798, 160, 4, 620, "accent", { z: 2 })));
    [
      [260, 180, 0],
      [1060, 180, 1],
      [260, 540, 2],
      [1060, 540, 3],
    ].forEach(([x, y, i]) => {
      const id = "note" + i;
      nodes.push(asBeat(circle(id, x, y, 240, i === 0 ? "accent" : "ink", { z: 3 }), { morphId: "note-" + i }));
      const ink = i === 0 ? "ink" : "accent";
      nodes.push(
        asLabel(
          text("copy" + i * 2, x + 40, y + 70, 160, 70, 36, "copy" + i * 2, ink, {
            align: "center",
            z: 4,
            fontRole: "display",
          }),
          id
        )
      );
      nodes.push(
        asLabel(
          text("copy" + (i * 2 + 1), x + 40, y + 145, 160, 50, 18, "copy" + (i * 2 + 1), i === 0 ? "ink" : "surface", {
            align: "center",
            z: 4,
          }),
          id
        )
      );
    });
    kits.push(writeKit("feature", "wire-nodes", f, nodes));

    // 4 Latitudes — horizontal rules with type hanging on the lines (no boxes)
    const lats: El[] = [asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }))];
    lats.push(asTitle(text("title", 100, 40, 800, 60, 48, "title", "ink", display)));
    for (let i = 0; i < 4; i++) {
      const y = 180 + i * 160;
      const id = "note" + i;
      lats.push(asChrome(rect("lat" + i, 80, y + 40, 1440, 3, i === 2 ? "accent" : "ink", { z: 1 })));
      // Larger beat so labels sit inside the host (slamDrop + lint attach)
      lats.push(asBeat(circle(id, 160, y - 20, 100, i === 2 ? "accent" : "ink", { z: 3 }), { morphId: "note-" + i }));
      lats.push(
        asLabel(
          text("copy" + i * 2, 280, y - 20, 320, 80, 32, "copy" + i * 2, "ink", {
            z: 3,
            fontRole: "display",
            fontWeight: 700,
          }),
          id
        )
      );
      lats.push(
        asChrome(text("copy" + (i * 2 + 1), 700, y - 10, 700, 70, 24, "copy" + (i * 2 + 1), "muted", { z: 3 }))
      );
    }
    kits.push(writeKit("feature", "wire-lats", f, lats));

    // 5 Ping count — dots on a wire (data without cards)
    const ping: El[] = [asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }))];
    grid(ping);
    ping.push(asTitle(text("title", 100, 40, 800, 60, 48, "title", "ink", display)));
    [18, 11, 5].forEach((n, i) => {
      const y = 220 + i * 200;
      ping.push(asChrome(rect("pline" + i, 100, y + 30, 1400, 2, "ink", { z: 1 })));
      ping.push(asChrome(text("copy" + i * 2, 100, y - 20, 280, 40, 22, "copy" + i * 2, "muted", { z: 3 })));
      for (let d = 0; d < n; d++) {
        ping.push(asDot(circle("v" + i + "_" + d, 400 + d * 50, y + 10, 40, i === 0 ? "accent" : "ink"), i, d));
      }
      ping.push(
        asChrome(
          text("copy" + (i * 2 + 1), 1380, y - 10, 140, 60, 40, "copy" + (i * 2 + 1), "ink", {
            ...display,
            align: "right",
            z: 3,
          })
        )
      );
    });
    kits.push(writeKit("feature", "wire-ping", f, ping));

    // 6 Trace — photo with wire overlay + lime node
    kits.push(
      writeKit("feature", "wire-trace", f, [
        photo("photo", 0, 0, 1600, 900),
        asChrome(rect("veil", 0, 0, 1600, 900, "ink", { z: 2, opacity: 0.4 })),
        wire("t0", 0, 200, 1600, 3, "accent"),
        wire("t1", 0, 450, 1600, 3, "surface"),
        wire("t2", 0, 700, 1600, 3, "accent"),
        wire("tv", 400, 0, 3, 900, "accent"),
        asTitle(text("title", 80, 80, 600, 70, 56, "title", "accent", display)),
        asBeat(circle("note", 1160, 280, 320, "accent", { z: 4 }), { morphId: "note-0" }),
        asLabel(
          text("copy0", 1210, 390, 220, 80, 32, "copy0", "ink", {
            align: "center",
            z: 5,
            fontRole: "display",
            fontWeight: 700,
          }),
          "note"
        ),
        asChrome(
          text("copy1", 80, 460, 1000, 180, 32, "copy1", "surface", {
            z: 4,
            lineHeight: 1.3,
            fontRole: "display",
            fontWeight: 700,
          })
        ),
      ])
    );

    // 7 Quote — type on wires only
    const quote: El[] = [asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }))];
    for (let i = 0; i < 7; i++) quote.push(wire("qh" + i, 120, 200 + i * 80, 1360, 2));
    quote.push(asTitle(text("title", 160, 210, 400, 56, 20, "title", "muted", { ...kicker, z: 3 })));
    quote.push(
      asBeat(circle("note", 140, 320, 120, "accent", { z: 3 }), { morphId: "note-quote" })
    );
    quote.push(
      asLabel(
        text("copy0", 280, 320, 1080, 160, 36, "copy0", "ink", {
          z: 3,
          lineHeight: 1.25,
          fontRole: "display",
          fontWeight: 700,
        }),
        "note"
      )
    );
    quote.push(asChrome(text("copy1", 260, 520, 800, 40, 20, "copy1", "muted", { z: 3 })));
    kits.push(writeKit("quote", "wire-quote", f, quote));

    // 8 Close
    kits.push(
      writeKit("closing", "wire-close", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "ink", { z: 0 })),
        wire("c0", 0, 300, 1600, 4, "accent"),
        wire("c1", 0, 600, 1600, 4, "accent"),
        asBeat(circle("note", 120, 400, 100, "accent", { z: 2 }), { morphId: "note-0" }),
        asTitle(text("title", 280, 380, 1200, 140, 110, "title", "accent", { ...display, z: 3 })),
        asChrome(text("copy0", 280, 540, 1000, 40, 20, "copy0", "surface", { z: 3 })),
      ])
    );

    return kits;
  },
};

runTemplates([orbit, wireLat]).catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
