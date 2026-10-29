/**
 * ONE-TIME / DEV ONLY. Wrote initial kit/<role>/{a,b}.json from NOTES.md.
 * Runtime source of truth is the JSON under kit/ — do not call from build or generateKitV1.
 * See scripts/dev/README.md. Re-run: node scripts/dev/build-kit-variants.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const KIT = path.join(ROOT, "kit");

function el(partial) {
  return Object.assign({ z: 1 }, partial);
}

function textFit(maxFont, minFont, lineClamp) {
  return { maxFont, minFont, lineClamp, shrinkMin: 0.75 };
}

function baseMeta(role, variant, steal, opts) {
  return Object.assign(
    {
      id: role + "/" + variant,
      role,
      variant,
      steal,
      requiresPhoto: !!(opts && opts.requiresPhoto),
      photoSlots: (opts && opts.photoSlots) || [],
      slots: {},
      fit: {},
      pptxMapping: {},
      layout: { elements: [] },
    },
    opts && opts.family ? { family: opts.family } : {}
  );
}

function registerSlots(meta, defs) {
  defs.forEach((d) => {
    const slot = { kind: d.kind, optional: !!d.optional };
    if (d.from != null) slot.from = d.from;
    meta.slots[d.id] = slot;
    meta.pptxMapping[d.id] = { kind: d.pptx };
    if (d.fit) meta.fit[d.id] = d.fit;
  });
}

/** Shared photo-footer family — footerH and copy density differ per role. */
function photoFooter(role, footerH, steal) {
  const photoH = 900 - footerH;
  const meta = baseMeta(role, "a", steal, {
    family: "photo-footer",
    requiresPhoto: true,
    photoSlots: ["photo"],
  });
  registerSlots(meta, [
    { id: "photo", kind: "image", from: "photo", pptx: "picture" },
    { id: "title", kind: "text", from: "title", pptx: "text", fit: textFit(64, 32, 1) },
    { id: "body", kind: "text", from: "body0", pptx: "text", fit: textFit(28, 18, 2), optional: true },
    { id: "footer", kind: "shape", from: null, pptx: "shape" },
    { id: "accent", kind: "shape", from: null, pptx: "shape" },
  ]);
  meta.layout.elements = [
    el({ id: "photo", type: "image", slot: "photo", x: 0, y: 0, width: 1600, height: photoH, z: 1 }),
    el({ id: "footer", type: "shape", shape: "rect", tokenFill: "surface", x: 0, y: photoH, width: 1600, height: footerH, z: 2 }),
    el({
      id: "title",
      type: "text",
      slot: "title",
      tokenColor: "ink",
      fontRole: "display",
      fontSize: 56,
      align: "left",
      verticalAlign: "middle",
      x: 72,
      y: photoH + 24,
      width: 640,
      height: footerH - 48,
      z: 3,
    }),
    el({
      id: "body",
      type: "text",
      slot: "body",
      tokenColor: "muted",
      fontRole: "body",
      fontSize: 24,
      align: "right",
      verticalAlign: "middle",
      x: 760,
      y: photoH + 36,
      width: 760,
      height: footerH - 72,
      z: 3,
    }),
    // DESIGN REVIEW: single motif bar on footer leading edge
    el({
      id: "accent",
      type: "shape",
      shape: "rect",
      motif: true,
      tokenFill: "accent",
      x: 0,
      y: photoH,
      width: 12,
      height: footerH,
      z: 4,
    }),
  ];
  return meta;
}

function variants() {
  const out = [];

  // cover/a — cover-01 placement: title slab + photo cutouts (no 3D)
  {
    const m = baseMeta("cover", "a", "Title slab on empty field; oversized photo forms break its edges.", {
      requiresPhoto: true,
      photoSlots: ["photoL", "photoR"],
    });
    registerSlots(m, [
      { id: "title", kind: "text", from: "title", pptx: "text", fit: textFit(72, 36, 2) },
      { id: "caption", kind: "text", from: "caption", pptx: "text", fit: textFit(28, 18, 1), optional: true },
      { id: "slab", kind: "shape", from: null, pptx: "shape" },
      { id: "photoL", kind: "image", from: "photo", pptx: "picture" },
      { id: "photoR", kind: "image", from: "photo", pptx: "picture" },
      { id: "accent", kind: "shape", from: null, pptx: "shape" },
    ]);
    m.layout.elements = [
      el({ id: "slab", type: "shape", shape: "rect", tokenFill: "ink", x: 420, y: 280, width: 760, height: 340, z: 2 }),
      el({
        id: "title",
        type: "text",
        slot: "title",
        tokenColor: "bg",
        fontRole: "display",
        fontSize: 64,
        align: "center",
        verticalAlign: "middle",
        x: 460,
        y: 320,
        width: 680,
        height: 180,
        z: 3,
      }),
      el({
        id: "caption",
        type: "text",
        slot: "caption",
        tokenColor: "muted",
        fontRole: "body",
        fontSize: 22,
        align: "center",
        x: 460,
        y: 520,
        width: 680,
        height: 48,
        z: 3,
      }),
      // DESIGN REVIEW: circular photo cutouts approximating edge-breaking forms
      el({ id: "photoL", type: "image", slot: "photoL", x: -40, y: 120, width: 420, height: 420, radius: 210, z: 4 }),
      el({ id: "photoR", type: "image", slot: "photoR", x: 1220, y: 420, width: 460, height: 460, radius: 40, z: 4 }),
      el({ id: "accent", type: "shape", shape: "rect", motif: true, tokenFill: "accent", x: 420, y: 280, width: 760, height: 8, z: 5 }),
    ];
    out.push(m);
  }

  // cover/b — cover-03: card + photo cutout / color block left
  {
    const m = baseMeta("cover", "b", "Card with oversized left form (photo cutout or color block).", {
      requiresPhoto: true,
      photoSlots: ["cutout"],
    });
    registerSlots(m, [
      { id: "title", kind: "text", from: "title", pptx: "text", fit: textFit(56, 28, 2) },
      { id: "caption", kind: "text", from: "caption", pptx: "text", fit: textFit(22, 16, 2), optional: true },
      { id: "card", kind: "shape", from: null, pptx: "shape" },
      { id: "cutout", kind: "image", from: "photo", pptx: "picture" },
      { id: "accent", kind: "shape", from: null, pptx: "shape" },
    ]);
    m.layout.elements = [
      el({ id: "card", type: "shape", shape: "rect", tokenFill: "surface", x: 280, y: 140, width: 1040, height: 620, z: 1 }),
      el({ id: "cutout", type: "image", slot: "cutout", x: 160, y: 200, width: 380, height: 500, radius: 190, z: 2 }),
      el({
        id: "title",
        type: "text",
        slot: "title",
        tokenColor: "ink",
        fontRole: "display",
        fontSize: 48,
        align: "left",
        x: 600,
        y: 320,
        width: 640,
        height: 160,
        z: 3,
      }),
      el({
        id: "caption",
        type: "text",
        slot: "caption",
        tokenColor: "muted",
        fontRole: "body",
        fontSize: 20,
        align: "left",
        x: 600,
        y: 500,
        width: 640,
        height: 80,
        z: 3,
      }),
      el({ id: "accent", type: "shape", shape: "rect", motif: true, tokenFill: "accent", x: 1220, y: 200, width: 48, height: 12, z: 4 }),
      el({ id: "accent2", type: "shape", shape: "rect", tokenFill: "accent", x: 1220, y: 230, width: 48, height: 12, z: 4 }),
      el({ id: "accent3", type: "shape", shape: "rect", tokenFill: "accent", x: 1220, y: 260, width: 48, height: 12, z: 4 }),
    ];
    out.push(m);
  }

  // agenda/a
  {
    const m = baseMeta("agenda", "a", "Airy agenda list with opposite corner empty of text.", { requiresPhoto: false });
    registerSlots(m, [
      { id: "title", kind: "text", from: "title", pptx: "text", fit: textFit(48, 28, 2) },
      { id: "body", kind: "text", from: "body", pptx: "text", fit: textFit(26, 18, 6) },
      { id: "accent", kind: "shape", from: null, pptx: "shape" },
    ]);
    m.layout.elements = [
      el({
        id: "title",
        type: "text",
        slot: "title",
        tokenColor: "ink",
        fontRole: "display",
        fontSize: 44,
        align: "left",
        x: 80,
        y: 120,
        width: 620,
        height: 140,
        z: 2,
      }),
      el({
        id: "body",
        type: "text",
        slot: "body",
        tokenColor: "ink",
        fontRole: "body",
        fontSize: 24,
        align: "left",
        x: 780,
        y: 180,
        width: 640,
        height: 560,
        z: 2,
      }),
      el({ id: "accent", type: "shape", shape: "ellipse", motif: true, tokenFill: "accent", opacity: 0.35, x: 1180, y: 620, width: 280, height: 280, z: 1 }),
    ];
    out.push(m);
  }

  // agenda/b — numbered list on solid color left, right photo/empty
  {
    const m = baseMeta("agenda", "b", "Numbered list on solid block; right half photo or empty.", {
      requiresPhoto: true,
      photoSlots: ["photo"],
    });
    registerSlots(m, [
      { id: "title", kind: "text", from: "title", pptx: "text", fit: textFit(40, 24, 2) },
      { id: "body", kind: "text", from: "body", pptx: "text", fit: textFit(26, 18, 6) },
      { id: "block", kind: "shape", from: null, pptx: "shape" },
      { id: "photo", kind: "image", from: "photo", pptx: "picture", optional: true },
      { id: "accent", kind: "shape", from: null, pptx: "shape" },
    ]);
    m.layout.elements = [
      el({ id: "block", type: "shape", shape: "rect", tokenFill: "accent", x: 0, y: 0, width: 780, height: 900, z: 1 }),
      el({
        id: "title",
        type: "text",
        slot: "title",
        tokenColor: "bg",
        fontRole: "display",
        fontSize: 40,
        align: "left",
        x: 72,
        y: 100,
        width: 640,
        height: 100,
        z: 2,
      }),
      el({
        id: "body",
        type: "text",
        slot: "body",
        tokenColor: "bg",
        fontRole: "body",
        fontSize: 24,
        align: "left",
        x: 72,
        y: 240,
        width: 640,
        height: 540,
        z: 2,
      }),
      el({ id: "photo", type: "image", slot: "photo", x: 780, y: 0, width: 820, height: 900, z: 1 }),
      el({ id: "accent", type: "shape", shape: "rect", motif: true, tokenFill: "ink", x: 72, y: 210, width: 80, height: 6, z: 3 }),
    ];
    out.push(m);
  }

  out.push(
    photoFooter("problem", 270, "Photo owns top two-thirds; opposing type in footer."),
    photoFooter("solution", 225, "Same photo-footer; quieter shorter footer."),
    photoFooter("closing", 270, "End on shared photo-footer base.")
  );

  // problem/b — dark statement, no image
  {
    const m = baseMeta("problem", "b", "Single short statement centered on a dark block, no image.", { requiresPhoto: false });
    registerSlots(m, [
      { id: "title", kind: "text", from: "title", pptx: "text", fit: textFit(56, 28, 3) },
      { id: "block", kind: "shape", from: null, pptx: "shape" },
      { id: "accent", kind: "shape", from: null, pptx: "shape" },
    ]);
    m.layout.elements = [
      el({ id: "block", type: "shape", shape: "rect", tokenFill: "ink", x: 240, y: 260, width: 1120, height: 380, z: 1 }),
      el({
        id: "title",
        type: "text",
        slot: "title",
        tokenColor: "bg",
        fontRole: "display",
        fontSize: 48,
        align: "center",
        verticalAlign: "middle",
        x: 300,
        y: 300,
        width: 1000,
        height: 300,
        z: 2,
      }),
      el({ id: "accent", type: "shape", shape: "rect", motif: true, tokenFill: "accent", x: 240, y: 260, width: 1120, height: 10, z: 3 }),
    ];
    out.push(m);
  }

  // solution/b — photo half-split right, title + 3 fragments left
  {
    const m = baseMeta("solution", "b", "Photo half-split right; title + three fragments left.", {
      requiresPhoto: true,
      photoSlots: ["photo"],
    });
    registerSlots(m, [
      { id: "title", kind: "text", from: "title", pptx: "text", fit: textFit(48, 28, 2) },
      { id: "body", kind: "text", from: "body", pptx: "text", fit: textFit(26, 18, 4) },
      { id: "photo", kind: "image", from: "photo", pptx: "picture" },
      { id: "accent", kind: "shape", from: null, pptx: "shape" },
    ]);
    m.layout.elements = [
      el({ id: "photo", type: "image", slot: "photo", x: 800, y: 0, width: 800, height: 900, z: 1 }),
      el({
        id: "title",
        type: "text",
        slot: "title",
        tokenColor: "ink",
        fontRole: "display",
        fontSize: 44,
        align: "left",
        x: 80,
        y: 160,
        width: 640,
        height: 160,
        z: 2,
      }),
      el({
        id: "body",
        type: "text",
        slot: "body",
        tokenColor: "muted",
        fontRole: "body",
        fontSize: 24,
        align: "left",
        x: 80,
        y: 360,
        width: 640,
        height: 400,
        z: 2,
      }),
      el({ id: "accent", type: "shape", shape: "rect", motif: true, tokenFill: "accent", x: 80, y: 330, width: 64, height: 8, z: 3 }),
    ];
    out.push(m);
  }

  // how-it-works/a — photo left + steps
  {
    const m = baseMeta("how-it-works", "a", "Photo+title column with vertical step rail.", {
      requiresPhoto: true,
      photoSlots: ["photo"],
    });
    registerSlots(m, [
      { id: "title", kind: "text", from: "title", pptx: "text", fit: textFit(44, 26, 2) },
      { id: "body", kind: "text", from: "body", pptx: "text", fit: textFit(24, 16, 8) },
      { id: "photo", kind: "image", from: "photo", pptx: "picture" },
      { id: "accent", kind: "shape", from: null, pptx: "shape" },
    ]);
    m.layout.elements = [
      el({ id: "photo", type: "image", slot: "photo", x: 80, y: 100, width: 720, height: 480, z: 1 }),
      el({
        id: "title",
        type: "text",
        slot: "title",
        tokenColor: "ink",
        fontRole: "display",
        fontSize: 40,
        align: "left",
        x: 80,
        y: 620,
        width: 720,
        height: 160,
        z: 2,
      }),
      el({
        id: "body",
        type: "text",
        slot: "body",
        tokenColor: "ink",
        fontRole: "body",
        fontSize: 22,
        align: "left",
        x: 880,
        y: 140,
        width: 640,
        height: 640,
        z: 2,
      }),
      el({ id: "accent", type: "shape", shape: "rect", motif: true, tokenFill: "accent", x: 860, y: 140, width: 6, height: 640, z: 3 }),
    ];
    out.push(m);
  }

  // how-it-works/b — timeline
  {
    const m = baseMeta("how-it-works", "b", "Dotted timeline with opposite oversized color form.", { requiresPhoto: false });
    registerSlots(m, [
      { id: "title", kind: "text", from: "title", pptx: "text", fit: textFit(56, 32, 1) },
      { id: "body", kind: "text", from: "body", pptx: "text", fit: textFit(24, 16, 6) },
      { id: "blob", kind: "shape", from: null, pptx: "shape" },
      { id: "accent", kind: "shape", from: null, pptx: "shape" },
    ]);
    m.layout.elements = [
      el({ id: "blob", type: "shape", shape: "ellipse", tokenFill: "accent", opacity: 0.4, x: -120, y: 480, width: 560, height: 560, z: 1 }),
      el({
        id: "title",
        type: "text",
        slot: "title",
        tokenColor: "ink",
        fontRole: "display",
        fontSize: 52,
        align: "left",
        x: 80,
        y: 140,
        width: 600,
        height: 120,
        z: 2,
      }),
      el({
        id: "body",
        type: "text",
        slot: "body",
        tokenColor: "ink",
        fontRole: "body",
        fontSize: 22,
        align: "left",
        x: 820,
        y: 160,
        width: 680,
        height: 620,
        z: 2,
      }),
      el({ id: "accent", type: "shape", shape: "rect", motif: true, tokenFill: "accent", x: 800, y: 180, width: 4, height: 560, z: 3 }),
    ];
    out.push(m);
  }

  // feature/a — twin photos PRIMARY feature-01
  {
    const m = baseMeta("feature", "a", "Twin-photo row over split footer title/copy.", {
      requiresPhoto: true,
      photoSlots: ["photoL", "photoR"],
    });
    registerSlots(m, [
      { id: "title", kind: "text", from: "title", pptx: "text", fit: textFit(40, 24, 2) },
      { id: "body", kind: "text", from: "body0", pptx: "text", fit: textFit(22, 16, 3), optional: true },
      { id: "photoL", kind: "image", from: "photo", pptx: "picture" },
      { id: "photoR", kind: "image", from: "photo", pptx: "picture" },
      { id: "accent", kind: "shape", from: null, pptx: "shape" },
    ]);
    m.layout.elements = [
      el({ id: "photoL", type: "image", slot: "photoL", x: 80, y: 100, width: 700, height: 480, z: 1 }),
      el({ id: "photoR", type: "image", slot: "photoR", x: 820, y: 100, width: 700, height: 480, z: 1 }),
      el({
        id: "title",
        type: "text",
        slot: "title",
        tokenColor: "ink",
        fontRole: "display",
        fontSize: 36,
        align: "left",
        x: 80,
        y: 640,
        width: 700,
        height: 160,
        z: 2,
      }),
      el({
        id: "body",
        type: "text",
        slot: "body",
        tokenColor: "muted",
        fontRole: "body",
        fontSize: 20,
        align: "left",
        x: 820,
        y: 640,
        width: 700,
        height: 160,
        z: 2,
      }),
      el({ id: "accent", type: "shape", shape: "ellipse", motif: true, tokenFill: "accent", x: 80, y: 610, width: 14, height: 14, z: 3 }),
    ];
    out.push(m);
  }

  // feature/b — 2×2 PRIMARY feature-02
  {
    const m = baseMeta("feature", "b", "2×2 visual bullets matrix.", {
      requiresPhoto: true,
      photoSlots: ["p1", "p2", "p3", "p4"],
    });
    registerSlots(m, [
      { id: "title", kind: "text", from: "title", pptx: "text", fit: textFit(40, 24, 2) },
      { id: "b1", kind: "text", from: "body0", pptx: "text", fit: textFit(18, 14, 2), optional: true },
      { id: "b2", kind: "text", from: "body1", pptx: "text", fit: textFit(18, 14, 2), optional: true },
      { id: "b3", kind: "text", from: "body2", pptx: "text", fit: textFit(18, 14, 2), optional: true },
      { id: "b4", kind: "text", from: "body3", pptx: "text", fit: textFit(18, 14, 2), optional: true },
      { id: "p1", kind: "image", from: "photo", pptx: "picture" },
      { id: "p2", kind: "image", from: "photo", pptx: "picture" },
      { id: "p3", kind: "image", from: "photo", pptx: "picture" },
      { id: "p4", kind: "image", from: "photo", pptx: "picture" },
      { id: "accent", kind: "shape", from: null, pptx: "shape" },
    ]);
    const cells = [
      [80, 220],
      [820, 220],
      [80, 560],
      [820, 560],
    ];
    m.layout.elements = [
      el({
        id: "title",
        type: "text",
        slot: "title",
        tokenColor: "ink",
        fontRole: "display",
        fontSize: 36,
        align: "left",
        x: 80,
        y: 60,
        width: 1200,
        height: 100,
        z: 2,
      }),
      el({ id: "accent", type: "shape", shape: "ellipse", motif: true, tokenFill: "accent", x: 80, y: 170, width: 12, height: 12, z: 3 }),
    ];
    cells.forEach((xy, i) => {
      const n = i + 1;
      m.layout.elements.push(
        el({ id: "p" + n, type: "image", slot: "p" + n, x: xy[0], y: xy[1], width: 280, height: 180, z: 1 }),
        el({
          id: "b" + n,
          type: "text",
          slot: "b" + n,
          tokenColor: "ink",
          fontRole: "body",
          fontSize: 18,
          align: "left",
          x: xy[0] + 300,
          y: xy[1] + 20,
          width: 360,
          height: 140,
          z: 2,
        })
      );
    });
    out.push(m);
  }

  // stats/a — three columns
  {
    const m = baseMeta("stats", "a", "Three oversized numbers evenly spaced.", { requiresPhoto: false });
    registerSlots(m, [
      { id: "title", kind: "text", from: "title", pptx: "text", fit: textFit(36, 22, 1) },
      { id: "stat", kind: "text", from: "stat", pptx: "text", fit: textFit(96, 48, 1) },
      { id: "s2", kind: "text", from: "body0", pptx: "text", fit: textFit(72, 40, 1), optional: true },
      { id: "s3", kind: "text", from: "body1", pptx: "text", fit: textFit(72, 40, 1), optional: true },
      { id: "c1", kind: "text", from: "caption", pptx: "text", fit: textFit(20, 14, 2), optional: true },
      { id: "c2", kind: "text", from: "body2", pptx: "text", fit: textFit(20, 14, 2), optional: true },
      { id: "c3", kind: "text", from: "body3", pptx: "text", fit: textFit(20, 14, 2), optional: true },
      { id: "accent", kind: "shape", from: null, pptx: "shape" },
    ]);
    m.layout.elements = [
      el({
        id: "title",
        type: "text",
        slot: "title",
        tokenColor: "ink",
        fontRole: "display",
        fontSize: 32,
        align: "center",
        x: 200,
        y: 100,
        width: 1200,
        height: 80,
        z: 2,
      }),
      el({
        id: "stat",
        type: "text",
        slot: "stat",
        tokenColor: "ink",
        fontRole: "display",
        fontSize: 88,
        align: "center",
        x: 80,
        y: 320,
        width: 460,
        height: 160,
        z: 2,
      }),
      el({
        id: "s2",
        type: "text",
        slot: "s2",
        tokenColor: "ink",
        fontRole: "display",
        fontSize: 88,
        align: "center",
        x: 570,
        y: 320,
        width: 460,
        height: 160,
        z: 2,
      }),
      el({
        id: "s3",
        type: "text",
        slot: "s3",
        tokenColor: "ink",
        fontRole: "display",
        fontSize: 88,
        align: "center",
        x: 1060,
        y: 320,
        width: 460,
        height: 160,
        z: 2,
      }),
      el({ id: "c1", type: "text", slot: "c1", tokenColor: "muted", fontRole: "body", fontSize: 18, align: "center", x: 80, y: 520, width: 460, height: 80, z: 2 }),
      el({ id: "c2", type: "text", slot: "c2", tokenColor: "muted", fontRole: "body", fontSize: 18, align: "center", x: 570, y: 520, width: 460, height: 80, z: 2 }),
      el({ id: "c3", type: "text", slot: "c3", tokenColor: "muted", fontRole: "body", fontSize: 18, align: "center", x: 1060, y: 520, width: 460, height: 80, z: 2 }),
      el({ id: "accent", type: "shape", shape: "ellipse", motif: true, tokenFill: "accent", x: 790, y: 200, width: 16, height: 16, z: 3 }),
    ];
    out.push(m);
  }

  // stats/b — hero number + photo strip
  {
    const m = baseMeta("stats", "b", "One hero number ~6× caption; photo strip across bottom.", {
      requiresPhoto: true,
      photoSlots: ["strip1", "strip2", "strip3"],
    });
    registerSlots(m, [
      { id: "stat", kind: "text", from: "stat", pptx: "text", fit: textFit(160, 72, 1) },
      { id: "caption", kind: "text", from: "caption", pptx: "text", fit: textFit(28, 18, 2), optional: true },
      { id: "title", kind: "text", from: "title", pptx: "text", fit: textFit(28, 18, 1), optional: true },
      { id: "strip1", kind: "image", from: "photo", pptx: "picture" },
      { id: "strip2", kind: "image", from: "photo", pptx: "picture" },
      { id: "strip3", kind: "image", from: "photo", pptx: "picture" },
      { id: "accent", kind: "shape", from: null, pptx: "shape" },
    ]);
    m.layout.elements = [
      el({
        id: "stat",
        type: "text",
        slot: "stat",
        tokenColor: "ink",
        fontRole: "display",
        fontSize: 140,
        align: "center",
        x: 120,
        y: 160,
        width: 1360,
        height: 220,
        z: 2,
      }),
      el({
        id: "caption",
        type: "text",
        slot: "caption",
        tokenColor: "muted",
        fontRole: "body",
        fontSize: 24,
        align: "center",
        x: 300,
        y: 420,
        width: 1000,
        height: 60,
        z: 2,
      }),
      el({ id: "strip1", type: "image", slot: "strip1", x: 0, y: 560, width: 534, height: 340, z: 1 }),
      el({ id: "strip2", type: "image", slot: "strip2", x: 533, y: 560, width: 534, height: 340, z: 1 }),
      el({ id: "strip3", type: "image", slot: "strip3", x: 1066, y: 560, width: 534, height: 340, z: 1 }),
      el({ id: "accent", type: "shape", shape: "rect", motif: true, tokenFill: "accent", x: 720, y: 500, width: 160, height: 8, z: 3 }),
    ];
    out.push(m);
  }

  // testimonial/a — quote + two portraits
  {
    const m = baseMeta("testimonial", "a", "Dense quote with two large portraits.", {
      requiresPhoto: true,
      photoSlots: ["p1", "p2"],
    });
    registerSlots(m, [
      { id: "title", kind: "text", from: "title", pptx: "text", fit: textFit(36, 22, 1) },
      { id: "body", kind: "text", from: "body", pptx: "text", fit: textFit(24, 16, 8) },
      { id: "caption", kind: "text", from: "caption", pptx: "text", fit: textFit(18, 14, 2), optional: true },
      { id: "p1", kind: "image", from: "photo", pptx: "picture" },
      { id: "p2", kind: "image", from: "photo", pptx: "picture" },
      { id: "accent", kind: "shape", from: null, pptx: "shape" },
    ]);
    m.layout.elements = [
      el({
        id: "title",
        type: "text",
        slot: "title",
        tokenColor: "ink",
        fontRole: "display",
        fontSize: 32,
        align: "left",
        x: 80,
        y: 100,
        width: 560,
        height: 80,
        z: 2,
      }),
      el({
        id: "body",
        type: "text",
        slot: "body",
        tokenColor: "ink",
        fontRole: "body",
        fontSize: 22,
        align: "left",
        x: 80,
        y: 220,
        width: 560,
        height: 420,
        z: 2,
      }),
      el({
        id: "caption",
        type: "text",
        slot: "caption",
        tokenColor: "muted",
        fontRole: "body",
        fontSize: 18,
        align: "left",
        x: 80,
        y: 680,
        width: 560,
        height: 80,
        z: 2,
      }),
      el({ id: "p1", type: "image", slot: "p1", x: 720, y: 120, width: 400, height: 660, z: 1 }),
      el({ id: "p2", type: "image", slot: "p2", x: 1160, y: 120, width: 360, height: 660, z: 1 }),
      el({ id: "accent", type: "shape", shape: "rect", motif: true, tokenFill: "accent", x: 80, y: 190, width: 48, height: 6, z: 3 }),
    ];
    out.push(m);
  }

  // testimonial/b — one square portrait
  {
    const m = baseMeta("testimonial", "b", "Quote left, one square portrait right.", {
      requiresPhoto: true,
      photoSlots: ["portrait"],
    });
    registerSlots(m, [
      { id: "body", kind: "text", from: "body", pptx: "text", fit: textFit(28, 18, 8) },
      { id: "caption", kind: "text", from: "caption", pptx: "text", fit: textFit(20, 14, 2), optional: true },
      { id: "title", kind: "text", from: "title", pptx: "text", fit: textFit(28, 18, 1), optional: true },
      { id: "portrait", kind: "image", from: "photo", pptx: "picture" },
      { id: "accent", kind: "shape", from: null, pptx: "shape" },
    ]);
    m.layout.elements = [
      el({
        id: "body",
        type: "text",
        slot: "body",
        tokenColor: "ink",
        fontRole: "display",
        fontSize: 28,
        align: "left",
        x: 80,
        y: 180,
        width: 780,
        height: 420,
        z: 2,
      }),
      el({
        id: "caption",
        type: "text",
        slot: "caption",
        tokenColor: "muted",
        fontRole: "body",
        fontSize: 20,
        align: "left",
        x: 80,
        y: 640,
        width: 780,
        height: 80,
        z: 2,
      }),
      el({ id: "portrait", type: "image", slot: "portrait", x: 960, y: 180, width: 520, height: 520, z: 1 }),
      el({ id: "accent", type: "shape", shape: "rect", motif: true, tokenFill: "accent", x: 80, y: 160, width: 64, height: 8, z: 3 }),
    ];
    out.push(m);
  }

  // team/a — portrait + bio
  {
    const m = baseMeta("team", "a", "Bottom-left portrait with bio copy on the right.", {
      requiresPhoto: true,
      photoSlots: ["photo"],
    });
    registerSlots(m, [
      { id: "title", kind: "text", from: "title", pptx: "text", fit: textFit(40, 24, 2) },
      { id: "body", kind: "text", from: "body", pptx: "text", fit: textFit(22, 16, 8) },
      { id: "photo", kind: "image", from: "photo", pptx: "picture" },
      { id: "accent", kind: "shape", from: null, pptx: "shape" },
    ]);
    m.layout.elements = [
      el({ id: "photo", type: "image", slot: "photo", x: 80, y: 320, width: 560, height: 480, z: 1 }),
      el({
        id: "title",
        type: "text",
        slot: "title",
        tokenColor: "ink",
        fontRole: "display",
        fontSize: 40,
        align: "left",
        x: 720,
        y: 200,
        width: 780,
        height: 120,
        z: 2,
      }),
      el({
        id: "body",
        type: "text",
        slot: "body",
        tokenColor: "muted",
        fontRole: "body",
        fontSize: 22,
        align: "left",
        x: 720,
        y: 360,
        width: 780,
        height: 400,
        z: 2,
      }),
      el({ id: "accent", type: "shape", shape: "ellipse", motif: true, tokenFill: "accent", opacity: 0.45, x: 40, y: 40, width: 180, height: 180, z: 0 }),
    ];
    out.push(m);
  }

  // team/b — row of portraits
  {
    const m = baseMeta("team", "b", "Three or four square portraits in a row with name + role.", {
      requiresPhoto: true,
      photoSlots: ["p1", "p2", "p3", "p4"],
    });
    registerSlots(m, [
      { id: "title", kind: "text", from: "title", pptx: "text", fit: textFit(36, 22, 1) },
      { id: "n1", kind: "text", from: "body0", pptx: "text", fit: textFit(18, 14, 2), optional: true },
      { id: "n2", kind: "text", from: "body1", pptx: "text", fit: textFit(18, 14, 2), optional: true },
      { id: "n3", kind: "text", from: "body2", pptx: "text", fit: textFit(18, 14, 2), optional: true },
      { id: "n4", kind: "text", from: "body3", pptx: "text", fit: textFit(18, 14, 2), optional: true },
      { id: "p1", kind: "image", from: "photo", pptx: "picture" },
      { id: "p2", kind: "image", from: "photo", pptx: "picture" },
      { id: "p3", kind: "image", from: "photo", pptx: "picture" },
      { id: "p4", kind: "image", from: "photo", pptx: "picture", optional: true },
      { id: "accent", kind: "shape", from: null, pptx: "shape" },
    ]);
    m.layout.elements = [
      el({
        id: "title",
        type: "text",
        slot: "title",
        tokenColor: "ink",
        fontRole: "display",
        fontSize: 36,
        align: "left",
        x: 80,
        y: 80,
        width: 1400,
        height: 80,
        z: 2,
      }),
      el({ id: "accent", type: "shape", shape: "rect", motif: true, tokenFill: "accent", x: 80, y: 170, width: 72, height: 8, z: 3 }),
    ];
    [0, 1, 2, 3].forEach((i) => {
      const x = 80 + i * 380;
      const n = i + 1;
      m.layout.elements.push(
        el({ id: "p" + n, type: "image", slot: "p" + n, x, y: 240, width: 320, height: 320, z: 1 }),
        el({
          id: "n" + n,
          type: "text",
          slot: "n" + n,
          tokenColor: "ink",
          fontRole: "body",
          fontSize: 18,
          align: "center",
          x,
          y: 590,
          width: 320,
          height: 100,
          z: 2,
        })
      );
    });
    out.push(m);
  }

  // closing/b — centered contact
  {
    const m = baseMeta("closing", "b", "Centered contact stack with corner motif accents.", { requiresPhoto: false });
    registerSlots(m, [
      { id: "title", kind: "text", from: "title", pptx: "text", fit: textFit(48, 28, 2) },
      { id: "body", kind: "text", from: "body", pptx: "text", fit: textFit(24, 16, 6) },
      { id: "accent", kind: "shape", from: null, pptx: "shape" },
    ]);
    m.layout.elements = [
      el({
        id: "title",
        type: "text",
        slot: "title",
        tokenColor: "ink",
        fontRole: "display",
        fontSize: 44,
        align: "center",
        x: 300,
        y: 260,
        width: 1000,
        height: 100,
        z: 2,
      }),
      el({
        id: "body",
        type: "text",
        slot: "body",
        tokenColor: "muted",
        fontRole: "body",
        fontSize: 22,
        align: "center",
        x: 400,
        y: 400,
        width: 800,
        height: 240,
        z: 2,
      }),
      el({ id: "accent", type: "shape", shape: "ellipse", motif: true, tokenFill: "accent", opacity: 0.35, x: -80, y: 640, width: 320, height: 320, z: 0 }),
      el({ id: "accentR", type: "shape", shape: "ellipse", tokenFill: "line", x: 1360, y: -40, width: 280, height: 280, z: 0 }),
    ];
    out.push(m);
  }

  return out;
}

function main() {
  const list = variants();
  list.forEach((v) => {
    const dir = path.join(KIT, v.role);
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, v.variant + ".json");
    fs.writeFileSync(file, JSON.stringify(v, null, 2));
    console.log("wrote", path.relative(ROOT, file));
  });
  console.log("total", list.length);
}

main();
