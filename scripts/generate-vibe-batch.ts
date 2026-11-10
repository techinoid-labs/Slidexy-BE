/**
 * Vibe templates — funky + soft old-school presentation decks.
 * Unique silhouettes per family (no shared close recipe).
 *
 * Funky:
 *   jukebox-reel   — diner jukebox / vinyl night
 *   carnival-lot   — night carnival booth
 * Soft:
 *   parlor-ink     — letterpress parlor stationery
 *   linen-post     — linen postcard rack
 *
 *   node -r ts-node/register/transpile-only scripts/generate-vibe-batch.ts [--publish-local] [--only=id]
 */
import { Template, text, rect, circle, photo, writeKit, runTemplates, El } from "./lib/designKit";
import {
  vinylSpines,
  songTicket,
  neonArch,
  tentStripe,
  prizeTag,
  ferrisCab,
  waxSeal,
  callingCard,
  letterRule,
  stampBlock,
  postcardFrame,
  softRibbon,
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

for (const family of ["jukebox", "carnival", "parlor", "linen"]) {
  const sel = familySel(family);
  if (sel) assertUniqueSel(family, sel.units);
}

const jukebox: Template = {
  id: "jukebox-reel",
  name: "Jukebox • Reel",
  description: "Funky diner jukebox deck — neon arch cover, vinyl spines, song tickets and a play close.",
  family: "jukebox",
  motion: FLAGSHIP_MOTION,
  brand: {
    colors: {
      bg: "#14080C",
      surface: "#2A1218",
      surface_color: "#3D1A24",
      ink: "#FFF4E8",
      muted: "#C49AA6",
      accent: "#FF2E63",
      line: "#5A2A38",
    },
    fonts: { display: "Impact", body: "Bahnschrift" },
  },
  slides: [
    {
      role: "cover",
      title: "JUKEBOX",
      items: ["Reel 12 · late night", "credits", "A1"],
      photoQuery: "07c71ad45242",
    },
    {
      role: "feature",
      title: "Spines",
      items: ["Red", "Mint", "Gold", "Ink", "Rose", "Navy", "Chrome", "Dust", "Pull one. Play loud."],
    },
    {
      role: "feature",
      title: "Requests",
      items: ["Side A", "Slow burn opener", "Side B", "Crowd chorus", "Encore", "Leave the needle warm."],
      photoQuery: "0506d14bb966",
    },
    {
      role: "feature",
      title: "Setlist",
      items: ["01", "Walk in", "02", "Drop the coin", "03", "Hold the chorus", "04", "Fade out"],
    },
    {
      role: "feature",
      title: "Keep the coin warm.",
      items: ["— Night host"],
      photoQuery: "07c71ad45242",
    },
    {
      role: "closing",
      title: "Play.",
      items: ["Jukebox Reel · last dance"],
    },
  ],
  kits: () => {
    const f = "jukebox";
    const kits = [];

    kits.push(
      writeKit("cover", "jukebox-arch", f, [
        photo("photo", 0, 0, 1600, 900, { morphId: "hero", zoom: 1.2 }),
        rect("scrim", 0, 0, 820, 900, "bg", { z: 2, opacity: 0.68, morphId: "titlePlate" }),
        ...neonArch("na", { x: 980, y: 80, w: 520, h: 720, z: 3 }),
        text("copy0", 70, 90, 680, 40, 22, "copy0", "muted", { ...kicker, z: 4 }),
        text("title", 55, 240, 740, 220, 120, "title", "ink", {
          ...display,
          letterSpacing: 2,
          lineHeight: 0.92,
          z: 4,
          morphId: "title",
        }),
        text("copy1", 70, 520, 600, 60, 40, "copy1", "accent", { ...display, z: 4 }),
        circle("badge", 70, 680, 160, "accent", { z: 4, morphId: "accent" }),
        text("copy2", 95, 725, 110, 80, 48, "copy2", "bg", { ...stat, align: "center", z: 5 }),
      ])
    );

    const spines: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 900, 90, 64, "title", "ink", { ...display, morphId: "title" }),
      ...vinylSpines("vs", { x: 80, y: 160, count: 10, h: 480, z: 1 }),
    ];
    for (let i = 0; i < 8; i++) {
      spines.push(
        text("copy" + i, 80 + i * 150, 680, 140, 40, 22, "copy" + i, i % 3 === 0 ? "accent" : "muted", {
          align: "center",
          z: 2,
        })
      );
    }
    spines.push(text("copy8", 80, 780, 1200, 50, 28, "copy8", "ink"));
    kits.push(writeKit("feature", "jukebox-spines", f, spines));

    kits.push(
      writeKit("feature", "jukebox-requests", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 40, 700, 80, 56, "title", "ink", { ...display, morphId: "title" }),
        photo("photo", 900, 140, 620, 640, { zoom: 1.25, z: 1 }),
        ...songTicket("t0", { x: 80, y: 160, w: 740, h: 280, z: 2 }),
        text("copy0", 140, 210, 620, 50, 32, "copy0", "accent", { ...kicker, z: 3 }),
        text("copy1", 140, 280, 620, 80, 32, "copy1", "ink", { z: 3 }),
        ...songTicket("t1", { x: 80, y: 480, w: 740, h: 280, z: 2 }),
        text("copy2", 140, 530, 620, 50, 32, "copy2", "accent", { ...kicker, z: 3 }),
        text("copy3", 140, 600, 620, 80, 32, "copy3", "ink", { z: 3 }),
        text("copy4", 140, 700, 620, 40, 24, "copy4", "muted", { z: 3 }),
        text("copy5", 80, 820, 740, 40, 24, "copy5", "muted"),
      ])
    );

    const setlist: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1400, 90, 64, "title", "ink", { ...display, morphId: "title" }),
    ];
    for (let i = 0; i < 4; i++) {
      const y = 180 + i * 160;
      setlist.push(rect("bar" + i, 80, y, 1440, 130, i % 2 ? "surface" : "surface_color", { z: 1 }));
      setlist.push(text("copy" + i * 2, 120, y + 30, 180, 70, 52, "copy" + i * 2, "accent", { ...display }));
      setlist.push(text("copy" + (i * 2 + 1), 340, y + 40, 1100, 60, 40, "copy" + (i * 2 + 1), "ink"));
    }
    kits.push(writeKit("feature", "jukebox-setlist", f, setlist));

    kits.push(
      writeKit("feature", "jukebox-quote", f, [
        photo("photo", 0, 0, 1600, 900, { zoom: 1.1 }),
        rect("band", 0, 300, 1600, 300, "bg", { z: 2, opacity: 0.8 }),
        text("title", 100, 360, 1400, 120, 64, "title", "ink", {
          ...display,
          textStyleRole: "quote",
          align: "center",
          z: 3,
        }),
        text("copy0", 100, 500, 1400, 50, 26, "copy0", "accent", { align: "center", z: 3 }),
      ])
    );

    kits.push(
      writeKit("closing", "jukebox-play", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        ...vinylSpines("c", { x: 200, y: 80, count: 16, h: 480, z: 1 }),
        rect("plate", 280, 540, 1040, 280, "accent", { z: 2, morphId: "pulse-bg" }),
        text("title", 320, 580, 960, 160, 96, "title", "bg", { ...display, align: "center", morphId: "title", z: 3 }),
        text("copy0", 320, 750, 960, 40, 26, "copy0", "bg", { align: "center", z: 3 }),
      ])
    );

    return kits;
  },
};

const carnival: Template = {
  id: "carnival-lot",
  name: "Carnival • Lot",
  description: "Funky night carnival — striped awning cover, prize tags, ferris cabs and a ride close.",
  family: "carnival",
  motion: FLAGSHIP_MOTION,
  brand: {
    colors: {
      bg: "#0F1A2E",
      surface: "#1A2B48",
      surface_color: "#243860",
      ink: "#FFF7E8",
      muted: "#9BB0D0",
      accent: "#FFB703",
      line: "#35507A",
    },
    fonts: { display: "Franklin Gothic Heavy", body: "Trebuchet MS" },
  },
  slides: [
    {
      role: "cover",
      title: "CARNIVAL",
      items: ["Lot B · after dark", "tickets", "03"],
      photoQuery: "092c8c1420fb",
    },
    {
      role: "feature",
      title: "Prizes",
      items: ["Goldfish", "easy win", "Bear", "three rings", "Whistle", "side booth", "Crown", "top shelf"],
    },
    {
      role: "feature",
      title: "Booths",
      items: ["Ring toss", "Soft aim, hard laugh.", "Dart wall", "Pop three, walk tall.", "Strongman", "Bell is optional."],
      photoQuery: "0288432f0b82",
    },
    {
      role: "feature",
      title: "Wheel",
      items: ["Cab 1", "Cab 2", "Cab 3", "Cab 4", "Cab 5", "Cab 6"],
    },
    {
      role: "feature",
      title: "Stay for the lights.",
      items: ["— Lot notes"],
      photoQuery: "092c8c1420fb",
    },
    {
      role: "closing",
      title: "Ride.",
      items: ["Carnival Lot · last loop"],
    },
  ],
  kits: () => {
    const f = "carnival";
    const kits = [];

    kits.push(
      writeKit("cover", "carnival-awning", f, [
        photo("photo", 0, 0, 1600, 900, { morphId: "hero", zoom: 1.15 }),
        ...tentStripe("ts", { x: 0, y: 0, w: 1600, h: 160, stripes: 12, z: 2 }),
        rect("scrim", 0, 520, 1600, 380, "bg", { z: 3, opacity: 0.75, morphId: "titlePlate" }),
        text("copy0", 80, 560, 900, 40, 22, "copy0", "muted", { ...kicker, z: 4 }),
        text("title", 70, 620, 1200, 140, 110, "title", "ink", { ...display, z: 4, morphId: "title" }),
        text("copy1", 80, 780, 500, 50, 32, "copy1", "accent", { z: 4 }),
        circle("badge", 1360, 640, 160, "accent", { z: 4, morphId: "accent" }),
        text("copy2", 1385, 685, 110, 80, 52, "copy2", "bg", { ...stat, align: "center", z: 5 }),
      ])
    );

    kits.push(
      writeKit("feature", "carnival-prizes", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 50, 900, 90, 64, "title", "ink", { ...display, morphId: "title" }),
        ...prizeTag("pt", { x: 80, y: 180, count: 4, z: 1 }),
        text("copy0", 110, 260, 260, 50, 32, "copy0", "bg", { ...display, z: 3 }),
        text("copy1", 110, 320, 260, 40, 22, "copy1", "bg", { z: 3 }),
        text("copy2", 470, 260, 260, 50, 32, "copy2", "ink", { ...display, z: 3 }),
        text("copy3", 470, 320, 260, 40, 22, "copy3", "muted", { z: 3 }),
        text("copy4", 110, 480, 260, 50, 32, "copy4", "ink", { ...display, z: 3 }),
        text("copy5", 110, 540, 260, 40, 22, "copy5", "muted", { z: 3 }),
        text("copy6", 470, 480, 260, 50, 32, "copy6", "ink", { ...display, z: 3 }),
        text("copy7", 470, 540, 260, 40, 22, "copy7", "muted", { z: 3 }),
        ...ferrisCab("fc", { x: 820, y: 280, count: 5, size: 100, z: 2 }),
      ])
    );

    kits.push(
      writeKit("feature", "carnival-booths", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 40, 700, 80, 56, "title", "ink", { ...display, morphId: "title" }),
        photo("photo", 900, 120, 620, 680, { zoom: 1.2, z: 1 }),
        ...[0, 1, 2].map((i) => rect("b" + i, 80, 160 + i * 220, 760, 190, "surface", { z: 2, morphId: i === 0 ? "plate" : undefined })),
        ...[0, 1, 2].map((i) => text("copy" + i * 2, 110, 190 + i * 220, 700, 50, 32, "copy" + i * 2, "accent", { ...kicker, z: 3 })),
        ...[0, 1, 2].map((i) => text("copy" + (i * 2 + 1), 110, 250 + i * 220, 700, 60, 28, "copy" + (i * 2 + 1), "ink", { z: 3 })),
      ])
    );

    {
      const cabX0 = 120;
      const cabY0 = 420;
      const cabCount = 6;
      const cabSize = 160;
      const cabGap = 40;
      const wheel: El[] = [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 50, 900, 90, 64, "title", "ink", { ...display, morphId: "title" }),
        ...ferrisCab("w", { x: cabX0, y: cabY0, count: cabCount, size: cabSize, z: 1 }),
      ];
      // Flat caption row under the lowest cab — keeps labels aligned even when cabs arc.
      const labelY = cabY0 + cabSize + 24;
      for (let i = 0; i < cabCount; i++) {
        const cx = cabX0 + i * (cabSize + cabGap);
        wheel.push(
          text("copy" + i, cx, labelY, cabSize, 40, 24, "copy" + i, i === 2 ? "accent" : "ink", {
            align: "center",
            z: 3,
          })
        );
      }
      wheel.push(...tentStripe("foot", { x: 0, y: 780, w: 1600, h: 120, stripes: 14, z: 2 }));
      kits.push(writeKit("feature", "carnival-wheel", f, wheel));
    }

    kits.push(
      writeKit("feature", "carnival-quote", f, [
        photo("photo", 0, 0, 1600, 900, { zoom: 1.1 }),
        ...tentStripe("q", { x: 0, y: 360, w: 1600, h: 220, stripes: 16, z: 2 }),
        text("title", 100, 420, 1400, 100, 56, "title", "bg", {
          ...display,
          textStyleRole: "quote",
          align: "center",
          z: 3,
        }),
        text("copy0", 100, 530, 1400, 40, 24, "copy0", "bg", { align: "center", z: 3 }),
      ])
    );

    kits.push(
      writeKit("closing", "carnival-ride", f, [
        rect("bg", 0, 0, 1600, 900, "accent", { z: 0 }),
        ...ferrisCab("c", { x: 160, y: 180, count: 7, size: 140, z: 1 }),
        text("title", 80, 560, 1440, 140, 120, "title", "bg", { ...display, align: "center", morphId: "title", z: 3 }),
        text("copy0", 80, 720, 1440, 50, 28, "copy0", "bg", { align: "center", z: 3 }),
        circle("pulse-bg", 760, 80, 80, "bg", { z: 2, morphId: "pulse-bg" }),
      ])
    );

    return kits;
  },
};

const parlor: Template = {
  id: "parlor-ink",
  name: "Parlor • Ink",
  description: "Soft old-school parlor stationery — calling cards, wax seals, letter rules and a gentle close.",
  family: "parlor",
  motion: FLAGSHIP_MOTION,
  brand: {
    colors: {
      bg: "#F4EEE4",
      surface: "#E8E0D2",
      surface_color: "#DDD4C4",
      ink: "#2A2E36",
      muted: "#7A808C",
      accent: "#5B7C99",
      line: "#C8C0B2",
    },
    fonts: { display: "Playfair Display", body: "Georgia" },
  },
  slides: [
    {
      role: "cover",
      title: "Parlor",
      items: ["Ink room · afternoon", "by invitation", "IV"],
      photoQuery: "141ae86a78f3",
    },
    {
      role: "feature",
      title: "Calling cards",
      items: ["Host", "tea at four", "Guest", "bring quiet news", "Note", "leave before dusk", "Keep the ink light."],
    },
    {
      role: "feature",
      title: "Letters",
      items: ["Open gently", "The seal remembers the hand.", "Read twice", "Answer when the room is still."],
      photoQuery: "16df8343dc3d",
    },
    {
      role: "feature",
      title: "Hours",
      items: ["I", "Arrive", "II", "Sit", "III", "Speak", "IV", "Part"],
    },
    {
      role: "feature",
      title: "Soft words travel farther.",
      items: ["— Parlor note"],
      photoQuery: "141ae86a78f3",
    },
    {
      role: "closing",
      title: "Yours.",
      items: ["Parlor Ink · afternoon"],
    },
  ],
  kits: () => {
    const f = "parlor";
    const kits = [];

    kits.push(
      writeKit("cover", "parlor-card", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        ...callingCard("cc", { x: 160, y: 140, w: 880, h: 520, stack: 3, z: 1 }),
        photo("photo", 220, 200, 760, 360, { zoom: 1.1, z: 4 }),
        ...letterRule("lr", { x: 240, y: 590, w: 720, z: 5 }),
        text("copy0", 240, 180, 600, 40, 20, "copy0", "muted", { ...kicker, z: 5 }),
        text("title", 240, 640, 700, 100, 72, "title", "ink", { ...display, ...serif, z: 5, morphId: "title" }),
        text("copy1", 240, 760, 500, 40, 24, "copy1", "accent", { z: 5 }),
        ...waxSeal("ws", { x: 1180, y: 200, size: 220, z: 3 }),
        text("copy2", 1230, 270, 120, 80, 48, "copy2", "bg", { ...stat, align: "center", z: 4 }),
      ])
    );

    const cards: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1200, 90, 64, "title", "ink", { ...display, ...serif, morphId: "title" }),
      ...letterRule("top", { x: 80, y: 140, w: 600, z: 1 }),
    ];
    for (let i = 0; i < 3; i++) {
      const x = 80 + i * 500;
      cards.push(rect("card" + i, x, 220, 440, 480, "surface", { z: 2, morphId: i === 0 ? "plate" : undefined }));
      cards.push(...letterRule("r" + i, { x: x + 40, y: 280, w: 360, z: 3 }));
      cards.push(text("copy" + i * 2, x + 40, 340, 360, 60, 36, "copy" + i * 2, "accent", { ...display, ...serif, z: 3 }));
      cards.push(text("copy" + (i * 2 + 1), x + 40, 430, 360, 120, 28, "copy" + (i * 2 + 1), "ink", { z: 3, lineHeight: 1.35 }));
    }
    cards.push(text("copy6", 80, 760, 1400, 50, 26, "copy6", "muted"));
    kits.push(writeKit("feature", "parlor-cards", f, cards));

    kits.push(
      writeKit("feature", "parlor-letters", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 40, 700, 80, 56, "title", "ink", { ...display, ...serif, morphId: "title" }),
        photo("photo", 860, 140, 660, 640, { zoom: 1.15, z: 1 }),
        ...callingCard("note", { x: 80, y: 160, w: 700, h: 280, stack: 2, z: 2 }),
        text("copy0", 120, 220, 620, 50, 32, "copy0", "accent", { ...kicker, z: 4 }),
        text("copy1", 120, 290, 620, 80, 28, "copy1", "ink", { z: 4, lineHeight: 1.3 }),
        ...callingCard("note2", { x: 80, y: 500, w: 700, h: 280, stack: 2, z: 2 }),
        text("copy2", 120, 560, 620, 50, 32, "copy2", "accent", { ...kicker, z: 4 }),
        text("copy3", 120, 630, 620, 80, 28, "copy3", "ink", { z: 4, lineHeight: 1.3 }),
        ...waxSeal("s", { x: 680, y: 700, size: 100, z: 5 }),
      ])
    );

    const hours: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1400, 90, 64, "title", "ink", { ...display, ...serif, morphId: "title" }),
    ];
    for (let i = 0; i < 4; i++) {
      const y = 180 + i * 150;
      hours.push(...letterRule("hr" + i, { x: 80, y: y + 90, w: 1440, z: 1 }));
      hours.push(text("copy" + i * 2, 80, y, 160, 70, 48, "copy" + i * 2, "accent", { ...display, ...serif }));
      hours.push(text("copy" + (i * 2 + 1), 280, y + 10, 1100, 60, 36, "copy" + (i * 2 + 1), "ink"));
    }
    kits.push(writeKit("feature", "parlor-hours", f, hours));

    kits.push(
      writeKit("feature", "parlor-quote", f, [
        rect("bg", 0, 0, 1600, 900, "surface", { z: 0 }),
        ...letterRule("q", { x: 560, y: 280, w: 480, z: 1 }),
        text("title", 160, 360, 1280, 180, 64, "title", "ink", {
          ...display,
          ...serif,
          textStyleRole: "quote",
          align: "center",
          lineHeight: 1.2,
          z: 2,
        }),
        text("copy0", 160, 580, 1280, 50, 26, "copy0", "accent", { align: "center", z: 2 }),
      ])
    );

    kits.push(
      writeKit("closing", "parlor-yours", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        ...callingCard("c", { x: 360, y: 120, w: 880, h: 420, stack: 2, z: 1 }),
        ...waxSeal("cw", { x: 720, y: 240, size: 200, z: 3 }),
        circle("pulse-bg", 760, 280, 120, "accent", { z: 4, morphId: "pulse-bg" }),
        text("title", 80, 620, 1440, 120, 100, "title", "ink", { ...display, ...serif, align: "center", morphId: "title", z: 3 }),
        text("copy0", 80, 760, 1440, 50, 26, "copy0", "muted", { align: "center", z: 3 }),
        ...letterRule("cf", { x: 500, y: 840, w: 600, z: 3 }),
      ])
    );

    return kits;
  },
};

const linen: Template = {
  id: "linen-post",
  name: "Linen • Post",
  description: "Soft linen postcard rack — stamp blocks, postcard frames, ribbon bands and a send close.",
  family: "linen",
  motion: FLAGSHIP_MOTION,
  brand: {
    colors: {
      bg: "#E9EFEA",
      surface: "#DDE6E0",
      surface_color: "#CDD8D1",
      ink: "#2F3B38",
      muted: "#6F817A",
      accent: "#3F7F74",
      line: "#B7C5BE",
    },
    fonts: { display: "Garamond", body: "Georgia" },
  },
  slides: [
    {
      role: "cover",
      title: "Linen",
      items: ["Post rack · morning", "send soft", "02"],
      photoQuery: "0ca17fecb06d",
    },
    {
      role: "feature",
      title: "Stamps",
      items: ["Sea", "field", "Hill", "dusk", "Port", "quiet", "Pick one. Press firm."],
    },
    {
      role: "feature",
      title: "Cards",
      items: ["Front", "Keep the sky wide.", "Back", "Write less than you feel."],
      photoQuery: "005c50a2a14e",
    },
    {
      role: "feature",
      title: "Routes",
      items: ["01", "Address", "02", "Stamp", "03", "Ribbon", "04", "Post"],
    },
    {
      role: "feature",
      title: "Arrive gently.",
      items: ["— Desk clerk"],
      photoQuery: "0ca17fecb06d",
    },
    {
      role: "closing",
      title: "Send.",
      items: ["Linen Post · morning desk"],
    },
  ],
  kits: () => {
    const f = "linen";
    const kits = [];

    kits.push(
      writeKit("cover", "linen-rack", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        ...postcardFrame("pc", { x: 720, y: 100, w: 800, h: 620, z: 1 }),
        ...softRibbon("rb", { x: 0, y: 780, w: 1600, h: 70, z: 3 }),
        text("copy0", 80, 120, 560, 40, 22, "copy0", "muted", { ...kicker, z: 4 }),
        text("title", 70, 220, 600, 180, 120, "title", "ink", {
          ...display,
          ...serif,
          lineHeight: 0.95,
          z: 4,
          morphId: "title",
        }),
        text("copy1", 80, 460, 520, 50, 32, "copy1", "accent", { z: 4 }),
        ...stampBlock("sb", { x: 80, y: 540, cols: 2, rows: 1, z: 2 }),
        text("copy2", 110, 640, 140, 60, 36, "copy2", "bg", { ...stat, align: "center", z: 3 }),
      ])
    );

    kits.push(
      writeKit("feature", "linen-stamps", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 50, 900, 90, 64, "title", "ink", { ...display, ...serif, morphId: "title" }),
        ...stampBlock("st", { x: 80, y: 180, cols: 3, rows: 2, z: 1 }),
        text("copy0", 110, 320, 160, 50, 32, "copy0", "bg", { align: "center", z: 3 }),
        text("copy1", 110, 380, 160, 40, 22, "copy1", "bg", { align: "center", z: 3 }),
        text("copy2", 334, 320, 160, 50, 32, "copy2", "ink", { align: "center", z: 3 }),
        text("copy3", 334, 380, 160, 40, 22, "copy3", "muted", { align: "center", z: 3 }),
        text("copy4", 558, 320, 160, 50, 32, "copy4", "ink", { align: "center", z: 3 }),
        text("copy5", 558, 380, 160, 40, 22, "copy5", "muted", { align: "center", z: 3 }),
        text("copy6", 80, 780, 900, 50, 28, "copy6", "muted"),
        ...softRibbon("side", { x: 900, y: 200, w: 80, h: 520, z: 2 }),
      ])
    );

    kits.push(
      writeKit("feature", "linen-cards", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        text("title", 80, 40, 700, 80, 56, "title", "ink", { ...display, ...serif, morphId: "title" }),
        ...postcardFrame("a", { x: 80, y: 160, w: 700, h: 520, z: 1 }),
        rect("back", 860, 160, 660, 520, "surface", { z: 1, morphId: "plate" }),
        text("copy0", 900, 220, 580, 50, 32, "copy0", "accent", { ...kicker, z: 2 }),
        text("copy1", 900, 300, 580, 120, 32, "copy1", "ink", { z: 2, lineHeight: 1.35 }),
        text("copy2", 900, 460, 580, 50, 32, "copy2", "accent", { ...kicker, z: 2 }),
        text("copy3", 900, 540, 580, 80, 32, "copy3", "ink", { z: 2, lineHeight: 1.35 }),
      ])
    );

    const routes: El[] = [
      rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
      text("title", 80, 50, 1400, 90, 64, "title", "ink", { ...display, ...serif, morphId: "title" }),
      ...softRibbon("top", { x: 80, y: 160, w: 1440, h: 36, z: 1 }),
    ];
    for (let i = 0; i < 4; i++) {
      const y = 240 + i * 140;
      routes.push(rect("step" + i, 80, y, 1440, 110, i % 2 ? "surface" : "surface_color", { z: 1 }));
      routes.push(text("copy" + i * 2, 120, y + 25, 200, 60, 40, "copy" + i * 2, "accent", { ...display, ...serif }));
      routes.push(text("copy" + (i * 2 + 1), 360, y + 30, 1000, 50, 32, "copy" + (i * 2 + 1), "ink"));
    }
    kits.push(writeKit("feature", "linen-routes", f, routes));

    kits.push(
      writeKit("feature", "linen-quote", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        ...postcardFrame("q", { x: 200, y: 80, w: 1200, h: 700, z: 1 }),
        rect("veil", 280, 280, 1040, 280, "bg", { z: 3, opacity: 0.55 }),
        text("title", 320, 330, 960, 140, 56, "title", "ink", {
          ...display,
          ...serif,
          textStyleRole: "quote",
          align: "center",
          z: 4,
        }),
        text("copy0", 320, 490, 960, 40, 24, "copy0", "accent", { align: "center", z: 4 }),
      ])
    );

    kits.push(
      writeKit("closing", "linen-send", f, [
        rect("bg", 0, 0, 1600, 900, "bg", { z: 0 }),
        ...stampBlock("c", { x: 200, y: 80, cols: 4, rows: 1, z: 1 }),
        ...softRibbon("cband", { x: 0, y: 400, w: 1600, h: 120, z: 2 }),
        circle("pulse-bg", 760, 420, 80, "surface", { z: 3, morphId: "pulse-bg" }),
        text("title", 80, 560, 1440, 140, 110, "title", "ink", { ...display, ...serif, align: "center", morphId: "title", z: 3 }),
        text("copy0", 80, 720, 1440, 50, 26, "copy0", "muted", { align: "center", z: 3 }),
      ])
    );

    return kits;
  },
};

runTemplates([jukebox, carnival, parlor, linen]).catch((e) => {
  console.error(e);
  process.exit(1);
});
