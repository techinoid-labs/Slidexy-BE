/**
 * Spike Rail — kitchen order tickets slammed onto a steel rail (12 slides).
 * Motion grammar exemplar: beats + labels + dots + chrome/stage.
 *
 *   node -r ts-node/register/transpile-only scripts/generate-spike-rail.ts [--publish-local]
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

const display = { textStyleRole: "display", fontRole: "display" };
const kicker = { textStyleRole: "kicker", fontRole: "label" };
const mono = { fontRole: "body", letterSpacing: 1.5 };

const spikeRail: Template = {
  id: "spike-rail",
  name: "Spike Rail • Service kit",
  description:
    "12-slide back-of-house kit — tickets on a steel rail, fire times, stations, allergies, 86 board, covers, and clear-down.",
  family: "spike-rail",
  brand: {
    colors: {
      bg: "#141618",
      surface: "#E7F2EC",
      surface_color: "#C8E6D4",
      ink: "#121417",
      muted: "#6B7570",
      accent: "#E23D28",
      line: "#2A2E32",
    },
    fonts: { display: "Poppins Bold", body: "Consolas" },
  },
  slides: [
    {
      role: "cover",
      title: "Spike **Rail**",
      items: ["Service kit · Friday rush", "Table 12 · fire now"],
      photoQuery: "081717d284",
    },
    {
      role: "feature",
      title: "How we run",
      items: ["01", "Ticket lands", "Spike it · read allergies", "02", "Fire call", "Expo owns the clock", "03", "Pass clean", "No orphan plates"],
    },
    {
      role: "feature",
      title: "On the rail",
      items: [
        "T12",
        "Steak frites",
        "Allergy: butter",
        "T4",
        "Omakase set",
        "Seat 2 no shellfish",
        "T9",
        "Negroni · up",
        "Bar · rush",
      ],
    },
    {
      role: "feature",
      title: "Fire times",
      items: ["Apps", "0:00 fire", "Mains", "0:08 fire", "Dessert", "hold"],
    },
    {
      role: "feature",
      title: "Course ladder",
      items: ["Bread", "drop", "App", "fire", "Main", "hold :08", "Dessert", "walk"],
    },
    {
      role: "feature",
      title: "Stations",
      items: [
        "Grill",
        "Proteins rest · mark temps · call expo before plating.",
        "Pass",
        "Wipe · wipe · wipe",
        "Bar",
        "Garnish ready",
        "Pastry",
        "Cold box full",
      ],
    },
    {
      role: "feature",
      title: "Allergy flags",
      items: ["GF", "No wheat", "NF", "No tree nuts", "DF", "Butter swap"],
    },
    {
      role: "feature",
      title: "86 board",
      items: ["Oysters · sold out", "Lamb chop · ask expo", "Sorrel · sub kale", "OUT"],
      photoQuery: "081717d284",
    },
    {
      role: "feature",
      title: "Covers tonight",
      items: ["Patio", "42", "Main", "68", "Bar", "24"],
    },
    {
      role: "feature",
      title: "Ticket age",
      items: ["0–5m", "18", "green", "5–10m", "9", "watch", "10m+", "3", "red"],
    },
    {
      role: "quote",
      title: "BRIEF",
      items: ["If it’s on the rail, it’s owned.", "— Expo · Friday briefing"],
    },
    {
      role: "closing",
      title: "Clear the rail.",
      items: ["Spike Rail · service kit"],
    },
  ],
  kits: () => {
    const f = "spike-rail";
    const kits: ReturnType<typeof writeKit>[] = [];

    // 1 Cover
    kits.push(
      writeKit("cover", "spike-rail-pinned", f, [
        photo("photo", 0, 0, 1600, 900),
        asChrome(rect("scrim", 0, 0, 1600, 900, "ink", { z: 2, opacity: 0.35 })),
        asChrome(rect("shadow", 470, 168, 660, 560, "ink", { z: 3, opacity: 0.4 })),
        asBeat(rect("note", 450, 140, 660, 560, "surface", { z: 4 }), { morphId: "note-0" }),
        asChrome(circle("pin", 750, 120, 56, "accent", { z: 5 })),
        asLabel(
          text("copy0", 500, 200, 560, 36, 22, "copy0", "muted", { ...kicker, align: "center", z: 5, ...mono }),
          "note"
        ),
        asTitle(
          text("title", 490, 260, 580, 280, 110, "title", "ink", {
            ...display,
            align: "center",
            lineHeight: 0.95,
            z: 5,
          })
        ),
        asLabel(text("copy1", 500, 580, 560, 50, 24, "copy1", "ink", { align: "center", z: 5, ...mono }), "note"),
      ])
    );

    // 2 How we run — vertical spike list (not a 3-card wall)
    const how: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asChrome(rect("spine", 120, 160, 18, 640, "accent", { z: 1 })),
      asTitle(text("title", 200, 50, 1280, 90, 72, "title", "surface", display)),
    ];
    for (let i = 0; i < 3; i++) {
      const y = 180 + i * 220;
      const id = "note" + i;
      how.push(asChrome(circle("hole" + i, 99, y + 40, 60, "accent", { z: 2 })));
      how.push(asBeat(rect(id, 200, y, 1280, 180, i === 1 ? "accent" : "surface", { z: 2 }), { morphId: "note-" + i }));
      const ink = i === 1 ? "surface" : "ink";
      const muted = i === 1 ? "surface" : "muted";
      how.push(
        asLabel(text("copy" + i * 3, 240, y + 28, 160, 80, 56, "copy" + i * 3, ink, { ...display, z: 3 }), id)
      );
      how.push(
        asLabel(text("copy" + (i * 3 + 1), 440, y + 36, 480, 60, 36, "copy" + (i * 3 + 1), ink, { z: 3 }), id)
      );
      how.push(
        asLabel(
          text("copy" + (i * 3 + 2), 940, y + 44, 480, 90, 24, "copy" + (i * 3 + 2), muted, { z: 3, ...mono }),
          id
        )
      );
    }
    kits.push(writeKit("feature", "spike-rail-how", f, how));

    // 3 On the rail
    const rail: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asChrome(rect("rail", 0, 200, 1600, 28, "line", { z: 1 })),
      asTitle(text("title", 80, 60, 1440, 100, 72, "title", "surface", display)),
    ];
    const ticketPos = [
      [90, 280],
      [580, 300],
      [1070, 260],
    ];
    const fills = ["surface", "surface_color", "surface"];
    ticketPos.forEach(([x, y], i) => {
      const id = "note" + i;
      rail.push(asChrome(rect("shade" + i, x + 12, y + 14, 420, 480, "ink", { opacity: 0.35, z: 2 })));
      rail.push(asBeat(rect(id, x, y, 420, 480, fills[i], { z: 3 }), { morphId: "note-" + i }));
      rail.push(asChrome(circle("hole" + i, x + 182, y - 18, 40, "bg", { z: 4 })));
      rail.push(
        asLabel(text("copy" + i * 3, x + 36, y + 48, 348, 70, 56, "copy" + i * 3, "ink", { ...display, z: 4 }), id)
      );
      rail.push(
        asLabel(text("copy" + (i * 3 + 1), x + 36, y + 140, 348, 50, 28, "copy" + (i * 3 + 1), "ink", { z: 4 }), id)
      );
      rail.push(
        asLabel(
          text("copy" + (i * 3 + 2), x + 36, y + 210, 348, 180, 22, "copy" + (i * 3 + 2), "muted", {
            lineHeight: 1.35,
            z: 4,
            ...mono,
          }),
          id
        )
      );
    });
    kits.push(writeKit("feature", "spike-rail-tickets", f, rail));

    // 4 Fire times
    const fire: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 50, 1440, 90, 72, "title", "surface", display)),
    ];
    [
      [80, 200],
      [820, 200],
      [80, 520],
    ].forEach(([x, y], i) => {
      const id = "note" + i;
      fire.push(asBeat(rect(id, x, y, 700, 240, i === 2 ? "accent" : "surface", { z: 2 }), { morphId: "note-" + i }));
      fire.push(
        asLabel(
          text("copy" + i * 2, x + 40, y + 40, 620, 60, 40, "copy" + i * 2, i === 2 ? "surface" : "ink", {
            ...display,
            z: 3,
          }),
          id
        )
      );
      fire.push(
        asLabel(
          text("copy" + (i * 2 + 1), x + 40, y + 120, 620, 70, 28, "copy" + (i * 2 + 1), i === 2 ? "surface" : "muted", {
            z: 3,
            ...mono,
          }),
          id
        )
      );
    });
    kits.push(writeKit("feature", "spike-rail-fire", f, fire));

    // 5 Course ladder — full-width stacked bands (timeline, not hanging tickets)
    const ladder: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 40, 1440, 80, 64, "title", "surface", display)),
    ];
    for (let i = 0; i < 4; i++) {
      const y = 150 + i * 175;
      const id = "note" + i;
      const fill = i === 2 ? "accent" : i % 2 === 0 ? "surface" : "surface_color";
      ladder.push(asBeat(rect(id, 80, y, 1440, 150, fill, { z: 2 }), { morphId: "note-" + i }));
      ladder.push(asChrome(circle("hole" + i, 110, y + 45, 60, i === 2 ? "surface" : "bg", { z: 3 })));
      const ink = i === 2 ? "surface" : "ink";
      const muted = i === 2 ? "surface" : "muted";
      ladder.push(
        asLabel(text("copy" + i * 2, 200, y + 35, 500, 80, 48, "copy" + i * 2, ink, { ...display, z: 3 }), id)
      );
      ladder.push(
        asLabel(
          text("copy" + (i * 2 + 1), 760, y + 45, 680, 60, 28, "copy" + (i * 2 + 1), muted, { z: 3, ...mono }),
          id
        )
      );
    }
    kits.push(writeKit("feature", "spike-rail-ladder", f, ladder));

    // 6 Stations — index column + one hero detail ticket
    const stations: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 40, 600, 80, 64, "title", "surface", display)),
      asChrome(rect("index", 80, 150, 420, 680, "line", { z: 1 })),
    ];
    for (let i = 0; i < 4; i++) {
      const y = 180 + i * 150;
      const id = "note" + i;
      stations.push(
        asBeat(rect(id, 110, y, 360, 120, i === 0 ? "accent" : "surface", { z: 2 }), { morphId: "note-" + i })
      );
      stations.push(
        asLabel(
          text("copy" + i * 2, 140, y + 28, 300, 64, 24, "copy" + i * 2, i === 0 ? "surface" : "ink", {
            ...display,
            z: 3,
          }),
          id
        )
      );
    }
    // Hero detail mirrors the selected (first) station
    stations.push(asBeat(rect("noteHero", 560, 150, 960, 680, "surface", { z: 2 }), { morphId: "note-hero" }));
    stations.push(
      asChrome(text("heroTitle", 620, 220, 840, 120, 36, "copy0", "ink", { ...display, z: 3 }))
    );
    stations.push(
      asLabel(
        text("copy1", 620, 360, 840, 340, 28, "copy1", "muted", { z: 3, ...mono, lineHeight: 1.45 }),
        "noteHero"
      )
    );
    kits.push(writeKit("feature", "spike-rail-stations", f, stations));

    // 7 Allergy flags — wide banner strips with code badges
    const allergy: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asChrome(rect("banner", 0, 0, 1600, 160, "accent", { z: 1 })),
      asTitle(text("title", 80, 45, 1440, 90, 64, "title", "surface", display)),
    ];
    for (let i = 0; i < 3; i++) {
      const y = 220 + i * 200;
      const id = "note" + i;
      allergy.push(asBeat(rect(id, 80, y, 1440, 160, "surface", { z: 2 }), { morphId: "note-" + i }));
      allergy.push(asBeat(rect("badge" + i, 80, y, 220, 160, "accent", { z: 3 }), { morphId: "note-badge-" + i }));
      allergy.push(
        asLabel(
          text("copy" + i * 2, 100, y + 40, 180, 80, 56, "copy" + i * 2, "surface", {
            ...display,
            align: "center",
            z: 4,
          }),
          "badge" + i
        )
      );
      allergy.push(
        asLabel(
          text("copy" + (i * 2 + 1), 340, y + 50, 1100, 70, 36, "copy" + (i * 2 + 1), "ink", { z: 3, ...mono }),
          id
        )
      );
    }
    kits.push(writeKit("feature", "spike-rail-allergy", f, allergy));

    // 8 86 board
    kits.push(
      writeKit("feature", "spike-rail-86", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        photo("photo", 0, 0, 980, 900),
        asChrome(rect("stickerShade", 860, 560, 280, 240, "ink", { z: 2, opacity: 0.4 })),
        asBeat(rect("sticker", 840, 540, 280, 240, "accent", { z: 3 }), { morphId: "note-sticker" }),
        asLabel(
          text("copy3", 860, 600, 240, 120, 56, "copy3", "surface", { ...display, align: "center", z: 4 }),
          "sticker"
        ),
        asTitle(text("title", 1080, 80, 460, 100, 72, "title", "surface", display)),
        asChrome(rect("rule", 1080, 200, 90, 8, "accent")),
        asChrome(text("copy0", 1080, 240, 440, 50, 28, "copy0", "accent", { ...mono })),
        asChrome(text("copy1", 1080, 310, 440, 160, 26, "copy1", "muted", { lineHeight: 1.4 })),
        asChrome(text("copy2", 1080, 500, 440, 160, 26, "copy2", "muted", { lineHeight: 1.4 })),
      ])
    );

    // 9 Covers — punch dots
    const covers: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 60, 1440, 100, 72, "title", "surface", display)),
    ];
    [12, 8, 5].forEach((n, i) => {
      const y = 240 + i * 170;
      covers.push(asChrome(text("copy" + i * 2, 80, y, 360, 50, 28, "copy" + i * 2, "surface")));
      for (let d = 0; d < n; d++) {
        covers.push(asDot(circle("v" + i + "_" + d, 480 + d * 70, y + 4, 48, i === 0 ? "accent" : "surface"), i, d));
      }
      covers.push(
        asChrome(
          text("copy" + (i * 2 + 1), 1400, y - 4, 120, 60, 40, "copy" + (i * 2 + 1), "accent", {
            ...display,
            align: "right",
          })
        )
      );
      covers.push(asChrome(rect("rule" + i, 80, y + 100, 1440, 2, "line")));
    });
    kits.push(writeKit("feature", "spike-rail-covers", f, covers));

    // 10 Ticket age — hero metric + two side stacks
    const age: El[] = [
      asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
      asTitle(text("title", 80, 40, 1440, 80, 64, "title", "surface", display)),
      asBeat(rect("note0", 80, 160, 900, 660, "accent", { z: 2 }), { morphId: "note-0" }),
      asLabel(text("copy0", 120, 220, 800, 50, 28, "copy0", "surface", { z: 3, ...mono }), "note0"),
      asLabel(text("copy1", 120, 300, 800, 280, 180, "copy1", "surface", { ...display, z: 3 }), "note0"),
      asLabel(text("copy2", 120, 620, 800, 60, 32, "copy2", "surface", { z: 3, ...kicker }), "note0"),
    ];
    [
      [1040, 160, 1],
      [1040, 500, 2],
    ].forEach(([x, y, i]) => {
      const id = "note" + i;
      age.push(asBeat(rect(id, x, y, 480, 300, "surface", { z: 2 }), { morphId: "note-" + i }));
      age.push(
        asLabel(text("copy" + i * 3, x + 36, y + 36, 400, 40, 22, "copy" + i * 3, "muted", { z: 3, ...mono }), id)
      );
      age.push(
        asLabel(
          text("copy" + (i * 3 + 1), x + 36, y + 90, 400, 120, 96, "copy" + (i * 3 + 1), "ink", { ...display, z: 3 }),
          id
        )
      );
      age.push(
        asLabel(
          text("copy" + (i * 3 + 2), x + 36, y + 230, 400, 40, 22, "copy" + (i * 3 + 2), "muted", { z: 3, ...kicker }),
          id
        )
      );
    });
    kits.push(writeKit("feature", "spike-rail-age", f, age));

    // 11 Quote / briefing — whole ticket slams as one unit
    kits.push(
      writeKit("quote", "spike-rail-brief", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "bg", { z: 0 })),
        asChrome(rect("rail", 0, 140, 1600, 20, "line", { z: 1 })),
        asBeat(rect("note", 200, 220, 1200, 460, "surface", { z: 2 }), { morphId: "note-quote" }),
        asChrome(circle("pin", 772, 200, 48, "accent", { z: 3 })),
        asTitle(text("title", 280, 250, 1040, 56, 20, "title", "accent", { ...kicker, align: "center", z: 3, ...mono })),
        asLabel(
          text("copy0", 280, 340, 1040, 180, 44, "copy0", "ink", {
            ...display,
            align: "center",
            lineHeight: 1.2,
            z: 3,
          }),
          "note"
        ),
        asLabel(text("copy1", 280, 560, 1040, 50, 24, "copy1", "muted", { align: "center", z: 3, ...mono }), "note"),
      ])
    );

    // 12 Close
    kits.push(
      writeKit("closing", "spike-rail-clear", f, [
        asStage(rect("bg", 0, 0, 1600, 900, "surface", { z: 0 })),
        asChrome(circle("pin", 772, 180, 56, "accent")),
        asTitle(text("title", 80, 300, 1440, 160, 100, "title", "ink", { ...display, align: "center" })),
        asChrome(text("copy0", 80, 520, 1440, 50, 26, "copy0", "muted", { align: "center", ...mono })),
      ])
    );

    return kits;
  },
};

runTemplates([spikeRail]).catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
