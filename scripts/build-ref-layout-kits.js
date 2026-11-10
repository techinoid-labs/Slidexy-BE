/**
 * Translate docs/layout-dna/canva-reference-layouts.json (first 5 slides)
 * into engine kits. Source canvas 1920×1080 → engine 1600×900 (×5/6).
 */
const fs = require("fs");
const path = require("path");

const dna = require("../docs/layout-dna/canva-reference-layouts.json");
const S = 5 / 6;
const r = (n) => Math.round(n);
const sb = (b) => ({
  x: r(b.x * S),
  y: r(b.y * S),
  width: r(b.width * S),
  height: r(Math.max(1, b.height * S)),
});
const sf = (px) => r(px * S);

function write(role, variant, kit) {
  const dir = path.join(__dirname, "..", "kit", role);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, variant + ".json");
  fs.writeFileSync(file, JSON.stringify(kit, null, 2));
  console.log("wrote", path.relative(path.join(__dirname, ".."), file));
  // User-requested path: kit/feature/ref-layout-N.json for all five
  if (role !== "feature") {
    const alias = JSON.parse(JSON.stringify(kit));
    alias.id = "feature/" + variant;
    alias.role = "feature";
    alias.aliasOf = kit.id;
    const feat = path.join(__dirname, "..", "kit", "feature", variant + ".json");
    fs.writeFileSync(feat, JSON.stringify(alias, null, 2));
    console.log("  +", path.relative(path.join(__dirname, ".."), feat));
  }
}

function baseKit(role, variant, slide, extra) {
  return Object.assign(
    {
      id: role + "/" + variant,
      role,
      variant,
      family: "canva-ref",
      steal: slide.spatialGeometry,
      sourceRef: slide.id,
      status: "draft",
      motion: { transition: "fade", fallbackTransition: "fade", durationMs: 500 },
    },
    extra
  );
}

// 1 — cover
(() => {
  const slide = dna.slides[0];
  const variant = "ref-layout-1";
  const titleFs = sf(164);
  write(
    "cover",
    variant,
    baseKit("cover", variant, slide, {
      requiresPhoto: false,
      photoSlots: [],
      slots: {
        brand: { kind: "text", optional: true, from: "caption" },
        title: { kind: "text", optional: false, from: "title" },
        date: { kind: "text", optional: true, from: "caption" },
        website: { kind: "text", optional: true },
      },
      fit: {
        brand: { maxFont: sf(24), minFont: 14, lineClamp: 1, shrinkMin: 0.9 },
        title: { maxFont: titleFs, minFont: r(titleFs * 0.7), lineClamp: 2, shrinkMin: 0.85 },
        date: { maxFont: sf(24), minFont: 14, lineClamp: 1, shrinkMin: 0.9 },
        website: { maxFont: sf(24), minFont: 14, lineClamp: 1, shrinkMin: 0.9 },
      },
      pptxMapping: {
        brand: { kind: "text" },
        title: { kind: "text" },
        date: { kind: "text" },
        website: { kind: "text" },
      },
      layout: {
        elements: [
          {
            id: "brand-symbol",
            type: "shape",
            shape: "rect",
            tokenFill: "accent",
            ...sb({ x: 270, y: 201, width: 28, height: 28 }),
            z: 1,
            morphId: "brand-symbol",
          },
          {
            id: "brand",
            type: "text",
            slot: "brand",
            literal: "BORCELLE",
            ...sb({ x: 320, y: 198, width: 190, height: 34 }),
            z: 3,
            tokenColor: "muted",
            fontRole: "label",
            fontSize: sf(24),
            align: "left",
            morphId: "brand",
          },
          {
            id: "arrow",
            type: "shape",
            shape: "rect",
            tokenFill: "accent",
            ...sb({ x: 1610, y: 200, width: 40, height: 40 }),
            z: 1,
            morphId: "arrow",
          },
          {
            id: "title",
            type: "text",
            slot: "title",
            ...sb({ x: 270, y: 370, width: 790, height: 340 }),
            z: 4,
            tokenColor: "ink",
            fontRole: "display",
            fontSize: titleFs,
            align: "left",
            lineHeight: 1.03,
            textTransform: "uppercase",
            usePrimitive: false,
            morphId: "title",
          },
          {
            id: "date",
            type: "text",
            slot: "date",
            literal: "DECEMBER 2030",
            ...sb({ x: 270, y: 847, width: 300, height: 36 }),
            z: 3,
            tokenColor: "muted",
            fontRole: "label",
            fontSize: sf(24),
            align: "left",
            morphId: "date",
          },
          {
            id: "website",
            type: "text",
            slot: "website",
            literal: "reallygreatsite.com",
            ...sb({ x: 1320, y: 847, width: 330, height: 36 }),
            z: 3,
            tokenColor: "muted",
            fontRole: "label",
            fontSize: sf(24),
            align: "right",
            morphId: "website",
          },
        ],
      },
    })
  );
})();

// 2 — agenda
(() => {
  const slide = dna.slides[1];
  const variant = "ref-layout-2";
  const titleFs = sf(72);
  const numFs = sf(42);
  const itemFs = sf(24);
  const slots = { title: { kind: "text", optional: false, from: "title" } };
  const fit = {
    title: { maxFont: titleFs, minFont: r(titleFs * 0.7), lineClamp: 2, shrinkMin: 0.85 },
  };
  const pptx = { title: { kind: "text" } };
  const elements = [];
  for (const e of slide.elements) {
    const b = sb(e.bounds);
    if (e.id === "title") {
      elements.push({
        id: "title",
        type: "text",
        slot: "title",
        ...b,
        z: 3,
        tokenColor: "ink",
        fontRole: "display",
        fontSize: titleFs,
        align: "left",
        textTransform: "uppercase",
        usePrimitive: false,
        morphId: "title",
      });
      continue;
    }
    if (e.type === "shape") {
      elements.push({
        id: e.id,
        type: "shape",
        shape: "rect",
        tokenFill: e.id === "title-rule" ? "accent" : "line",
        ...b,
        z: e.z || 1,
        morphId: e.id,
      });
      continue;
    }
    const mNum = e.id.match(/^number-(\d+)$/);
    const mItem = e.id.match(/^item-(\d+)$/);
    if (mNum) {
      const lit = String(mNum[1]).padStart(2, "0");
      slots[e.id] = { kind: "text", optional: true };
      fit[e.id] = { maxFont: numFs, minFont: r(numFs * 0.75), lineClamp: 1, shrinkMin: 1 };
      pptx[e.id] = { kind: "text" };
      elements.push({
        id: e.id,
        type: "text",
        slot: e.id,
        literal: lit,
        ...b,
        z: 3,
        tokenColor: "accent",
        fontRole: "display",
        fontSize: numFs,
        align: "left",
        morphId: e.id,
      });
    } else if (mItem) {
      const idx = Number(mItem[1]) - 1;
      slots[e.id] = { kind: "text", optional: true, from: "body" + idx };
      fit[e.id] = { maxFont: itemFs, minFont: r(itemFs * 0.75), lineClamp: 1, shrinkMin: 0.9 };
      pptx[e.id] = { kind: "text" };
      elements.push({
        id: e.id,
        type: "text",
        slot: e.id,
        ...b,
        z: 3,
        tokenColor: "ink",
        fontRole: "body",
        fontSize: itemFs,
        align: "left",
        morphId: e.id,
      });
    }
  }
  write(
    "agenda",
    variant,
    baseKit("agenda", variant, slide, {
      requiresPhoto: false,
      photoSlots: [],
      slots,
      fit,
      pptxMapping: pptx,
      layout: { elements },
    })
  );
})();

// 3 — team
(() => {
  const slide = dna.slides[2];
  const variant = "ref-layout-3";
  const titleFs = sf(72);
  const slots = { title: { kind: "text", optional: false, from: "title" } };
  const fit = {
    title: { maxFont: titleFs, minFont: r(titleFs * 0.7), lineClamp: 1, shrinkMin: 0.85 },
  };
  const pptx = { title: { kind: "text" } };
  const photoSlots = [];
  const elements = [];
  for (const e of slide.elements) {
    const b = sb(e.bounds);
    if (e.id === "title") {
      elements.push({
        id: "title",
        type: "text",
        slot: "title",
        ...b,
        z: 3,
        tokenColor: "ink",
        fontRole: "display",
        fontSize: titleFs,
        align: "left",
        textTransform: "uppercase",
        morphId: "title",
      });
      continue;
    }
    if (e.type === "shape") {
      elements.push({
        id: e.id,
        type: "shape",
        shape: "rect",
        tokenFill: "accent",
        ...b,
        z: 2,
        morphId: e.id,
      });
      continue;
    }
    const pm = e.id.match(/^portrait-(\d+)$/);
    const im = e.id.match(/^index-(\d+)$/);
    const nm = e.id.match(/^name-(\d+)$/);
    const jm = e.id.match(/^job-(\d+)$/);
    if (pm) {
      photoSlots.push(e.id);
      slots[e.id] = { kind: "image", optional: Number(pm[1]) > 0, from: "photo" };
      pptx[e.id] = { kind: "picture" };
      elements.push({
        id: e.id,
        type: "image",
        slot: e.id,
        crop: "top-center",
        ...b,
        z: 1,
        morphId: e.id,
      });
    } else if (im) {
      const lit = String(Number(im[1]) + 1).padStart(2, "0");
      slots[e.id] = { kind: "text", optional: true };
      fit[e.id] = { maxFont: sf(36), minFont: 20, lineClamp: 1, shrinkMin: 1 };
      pptx[e.id] = { kind: "text" };
      elements.push({
        id: e.id,
        type: "text",
        slot: e.id,
        literal: lit,
        ...b,
        z: 3,
        tokenColor: "accent",
        fontRole: "display",
        fontSize: sf(36),
        align: "left",
        morphId: e.id,
      });
    } else if (nm) {
      slots[e.id] = { kind: "text", optional: true, from: "members" + nm[1] + ".name" };
      fit[e.id] = { maxFont: sf(28), minFont: 16, lineClamp: 1, shrinkMin: 0.9 };
      pptx[e.id] = { kind: "text" };
      elements.push({
        id: e.id,
        type: "text",
        slot: e.id,
        ...b,
        z: 3,
        tokenColor: "ink",
        fontRole: "label",
        fontSize: sf(28),
        align: "left",
        morphId: e.id,
      });
    } else if (jm) {
      slots[e.id] = { kind: "text", optional: true, from: "members" + jm[1] + ".role" };
      fit[e.id] = { maxFont: sf(22), minFont: 14, lineClamp: 1, shrinkMin: 0.9 };
      pptx[e.id] = { kind: "text" };
      elements.push({
        id: e.id,
        type: "text",
        slot: e.id,
        ...b,
        z: 3,
        tokenColor: "muted",
        fontRole: "body",
        fontSize: sf(22),
        align: "left",
        morphId: e.id,
      });
    }
  }
  write(
    "team",
    variant,
    baseKit("team", variant, slide, {
      requiresPhoto: true,
      photoSlots,
      slots,
      fit,
      pptxMapping: pptx,
      layout: { elements },
    })
  );
})();

// 4 — feature three objectives
(() => {
  const slide = dna.slides[3];
  const variant = "ref-layout-4";
  const titleFs = sf(72);
  const slots = { title: { kind: "text", optional: false, from: "title" } };
  const fit = {
    title: { maxFont: titleFs, minFont: r(titleFs * 0.7), lineClamp: 2, shrinkMin: 0.85 },
  };
  const pptx = { title: { kind: "text" } };
  const elements = [];
  for (const e of slide.elements) {
    const b = sb(e.bounds);
    if (e.id === "title") {
      elements.push({
        id: "title",
        type: "text",
        slot: "title",
        ...b,
        z: 3,
        tokenColor: "ink",
        fontRole: "display",
        fontSize: titleFs,
        align: "left",
        textTransform: "uppercase",
        morphId: "title",
      });
      continue;
    }
    if (e.type === "shape") {
      elements.push({
        id: e.id,
        type: "shape",
        shape: "rect",
        tokenFill: "accent",
        ...b,
        z: 2,
        morphId: e.id,
      });
      continue;
    }
    if (e.type === "image") {
      elements.push({
        id: e.id,
        type: "shape",
        shape: "rect",
        tokenFill: "accent",
        opacity: 0.9,
        ...b,
        z: 1,
        morphId: e.id,
      });
      continue;
    }
    const hm = e.id.match(/^heading-(\d+)$/);
    const bm = e.id.match(/^body-(\d+)$/);
    if (hm) {
      slots[e.id] = { kind: "text", optional: true, from: "steps" + hm[1] + ".title" };
      fit[e.id] = { maxFont: sf(28), minFont: 16, lineClamp: 2, shrinkMin: 0.9 };
      pptx[e.id] = { kind: "text" };
      elements.push({
        id: e.id,
        type: "text",
        slot: e.id,
        ...b,
        z: 3,
        tokenColor: "ink",
        fontRole: "label",
        fontSize: sf(28),
        align: "left",
        morphId: e.id,
      });
    } else if (bm) {
      slots[e.id] = { kind: "text", optional: true, from: "steps" + bm[1] + ".body" };
      fit[e.id] = { maxFont: sf(22), minFont: 14, lineClamp: 5, shrinkMin: 0.9 };
      pptx[e.id] = { kind: "text" };
      elements.push({
        id: e.id,
        type: "text",
        slot: e.id,
        ...b,
        z: 3,
        tokenColor: "muted",
        fontRole: "body",
        fontSize: sf(22),
        align: "left",
        lineHeight: 1.32,
        morphId: e.id,
      });
    }
  }
  write(
    "feature",
    variant,
    baseKit("feature", variant, slide, {
      requiresPhoto: false,
      photoSlots: [],
      slots,
      fit,
      pptxMapping: pptx,
      layout: { elements },
    })
  );
})();

// 5 — feature centered interlude
(() => {
  const slide = dna.slides[4];
  const variant = "ref-layout-5";
  const titleFs = sf(72);
  const elements = [];
  for (const e of slide.elements) {
    const b = sb(e.bounds);
    if (e.type === "text") {
      elements.push({
        id: "title",
        type: "text",
        slot: "title",
        ...b,
        z: 3,
        tokenColor: "ink",
        fontRole: "display",
        fontSize: titleFs,
        align: "center",
        textTransform: "uppercase",
        morphId: "title",
      });
    } else {
      elements.push({
        id: e.id,
        type: "shape",
        shape: "rect",
        tokenFill: "accent",
        ...b,
        z: 2,
        morphId: e.id,
      });
    }
  }
  write(
    "feature",
    variant,
    baseKit("feature", variant, slide, {
      requiresPhoto: false,
      photoSlots: [],
      slots: { title: { kind: "text", optional: false, from: "title" } },
      fit: {
        title: { maxFont: titleFs, minFont: r(titleFs * 0.7), lineClamp: 2, shrinkMin: 0.85 },
      },
      pptxMapping: { title: { kind: "text" } },
      layout: { elements },
    })
  );
})();

console.log("done");
