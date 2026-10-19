/**
 * Builds an original deck. The model invents the idea, palette, fonts,
 * and cover. A reasoning step then gives each body slide a job and a
 * composition for that job. Cover and close stay with the idea.
 */

const { CANVAS } = require("./deckSchema");
const { antiTells } = require("./antiTells");
const { inventBrief } = require("./inventBrief");
const { validateDeck } = require("./generateDeck");
const { readCatalog } = require("./catalogCaps");
const { planReasoning, previewFor, buildStrategy } = require("./reasonDeck");

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

function decor(id, x, y, w, h, name, params, fill, z, opacity) {
  const element = {
    id, type: "shape", x, y, width: w, height: h, zIndex: z,
    shapeContent: { kind: "decor", decorName: name, fill, decorParams: params },
  };
  if (opacity != null) element.opacity = opacity;
  return element;
}

function shape(id, x, y, w, h, fill, z, radius) {
  const shapeContent = { kind: radius ? "roundedRect" : "rectangle", fill };
  if (radius) shapeContent.cornerRadius = radius;
  return { id, type: "shape", x, y, width: w, height: h, zIndex: z, shapeContent };
}

function text(id, x, y, w, h, style, content, extra) {
  return {
    id, type: "text", x, y, width: w, height: h, zIndex: 8,
    textStyle: {
      fontFamily: style.font,
      fontSize: style.size,
      fontWeight: style.weight || 500,
      color: style.color,
      textAlign: style.align || "left",
      themeLocked: true,
      lineHeight: style.lineHeight || 1.15,
    },
    textContent: content,
    ...(extra || {}),
  };
}

function item(binding, index) {
  return { content: { binding }, extra: { itemIndex: index, visibleWhen: "hasLabeledItem" } };
}

function layout(id, elements) {
  return { version: 2, id, canvas: { ...CANVAS }, elements };
}

function densityMargin(density, base) {
  if (density === "airy") return Math.max(base, 128);
  if (density === "dense") return Math.min(base, 72);
  return base;
}

function densityType(density, base) {
  if (density === "airy") return base * 1.08;
  if (density === "dense") return base * 0.94;
  return base;
}

async function composeDeck(seed) {
  const numeric = Number.isFinite(Number(seed)) ? (Number(seed) >>> 0) || 1 : 1;
  const rng = mulberry32(numeric);
  const idea = await inventBrief();
  const palette = idea.palette;
  const fonts = idea.fonts;
  const margin = densityMargin(idea.density, pick(rng, [72, 96, 128]));
  const radius = pick(rng, [0, 8, 28]);
  const imageSplit = pick(rng, [0.38, 0.48, 0.58, 0.68]);
  const typeScale = densityType(idea.density, pick(rng, [0.88, 1, 1.14]));
  const groundMode = idea.groundMode || "noise";

  const m = margin;
  const r = radius;
  const D = "{font.display}";
  const F = "{font.text}";
  const ink = "{color.ink}";
  const muted = "{color.muted}";
  const accent = "{color.accent}";
  const card = "{color.card}";
  const bg = "{color.bg}";
  const on = "{color.onAccent}";
  const W = CANVAS.width;
  const H = CANVAS.height;
  const inner = W - m * 2;
  const titleAlign = idea.align === "center" ? "center" : "left";
  const titleX = idea.align === "asymmetric" ? m + Math.round(inner * 0.12) : m;
  const titleW = idea.align === "asymmetric" ? Math.round(inner * 0.78) : idea.align === "center" ? inner : Math.min(inner, 1200);

  const bgShape = () => shape("bg", 0, 0, W, H, bg, 0);
  const wash = () => {
    if (groundMode === "flat") return null;
    if (groundMode === "noise") {
      return decor("grain", 0, 0, W, H, "noise", { density: 0.45, dotSize: 1.4, seed: numeric % 40 }, "{color.ink}", 1, 0.14);
    }
    if (groundMode === "dotGrid") {
      return decor("wash", 0, 0, W, H, "dotGrid", { spacing: 28, dotSize: 1.7 }, "{color.ink}", 1, 0.22);
    }
    if (groundMode === "lineGrid") {
      return decor("wash", 0, 0, W, H, "lineGrid", { spacing: 56, strokeWidth: 1 }, "{color.ink}", 1, 0.16);
    }
    if (groundMode === "glow") {
      return decor("wash", 0, 0, W, H, "glow", { centerX: 0.82, centerY: 0.18, radius: 0.72 }, "{color.accent}", 1, 0.45);
    }
    return decor("wash", 0, 0, W, H, "meshGradient", {
      colors: ["{color.accent}", "{color.accent2}"],
      points: [[0.08, 0.12], [0.92, 0.2], [0.45, 1.05]],
      radius: 0.65,
    }, "{color.accent}", 1, 0.28);
  };
  const ground = () => {
    const layer = wash();
    return layer ? [bgShape(), layer] : [bgShape()];
  };

  function photo(id, x, y, w, h, url, z) {
    return {
      id, type: "image", role: "image",
      x, y, width: w, height: h, zIndex: z,
      imageContent: { binding: "image", url, fit: "cover", alignX: 0.5, alignY: 0.5 },
    };
  }

  function ideaCover() {
    if (idea.cover === "band") {
      return [
        photo("photo", 0, 0, W, H, idea.photo, 1),
        shape("band", 0, 280, W, 300, bg, 4),
        text("title", 70, 320, 1460, 150, { font: D, size: 110, weight: 750, color: ink, align: "center" }, { binding: "title" }),
        text("body", 360, 490, 880, 50, { font: F, size: 26, color: muted, align: "center" }, { binding: "bullets" }),
      ];
    }
    if (idea.cover === "split") {
      return [
        shape("field", 0, 0, W, H, bg, 0),
        shape("panel", 0, 0, 760, H, accent, 1),
        text("title", 56, 260, 650, 240, { font: D, size: 96, weight: 750, color: on }, { binding: "title" }),
        text("body", 56, 530, 620, 70, { font: F, size: 26, color: on }, { binding: "bullets" }),
        photo("photo", 760, 0, 840, H, idea.photo, 2),
      ];
    }
    if (idea.cover === "stack") {
      return [
        shape("field", 0, 0, W, H, bg, 0),
        text("body", 80, 180, 1200, 50, { font: F, size: 28, color: accent }, { binding: "bullets" }),
        text("title", 60, 260, 1480, 340, { font: D, size: 150, weight: 800, color: ink }, { binding: "title" }),
      ];
    }
    if (idea.cover === "photo") {
      const veil = shape("scrim", 0, 0, W, H, "#000000", 3);
      veil.opacity = 0.35;
      return [
        photo("photo", 0, 0, W, H, idea.photo, 1),
        veil,
        text("title", 120, 320, 1360, 180, { font: D, size: 120, weight: 600, color: "#F4F1EA", align: "center" }, { binding: "title" }),
        text("body", 360, 520, 880, 60, { font: F, size: 28, color: "#F4F1EA", align: "center" }, { binding: "bullets" }),
      ];
    }
    if (idea.cover === "browser") {
      return [
        ...ground(),
        text("title", m, 70, inner, 90, { font: D, size: 72, weight: 650, color: ink }, { binding: "title" }),
        shape("chrome", m, 190, inner, 620, card, 2, 18),
        shape("bar", m, 190, inner, 56, "{color.surface}", 3, 18),
        shape("dot1", m + 22, 208, 18, 18, "#E11D48", 4, 9),
        shape("dot2", m + 48, 208, 18, 18, "#F59E0B", 4, 9),
        shape("dot3", m + 74, 208, 18, 18, "#16A34A", 4, 9),
        photo("photo", m + 16, 260, inner - 32, 530, idea.photo, 4),
      ];
    }
    const ghost = text("ghost", 80, 180, 1440, 260, { font: D, size: 200, weight: 800, color: "{color.surface}", align: "left" }, { spans: [{ text: idea.title }] });
    ghost.opacity = 0.35;
    return [
      shape("bg", 0, 0, W, H, bg, 0),
      ghost,
      text("title", 80, 280, 1440, 280, { font: D, size: 160, weight: 800, color: ink }, { binding: "title" }),
      text("body", 80, 600, 700, 50, { font: F, size: 28, color: muted }, { binding: "bullets" }),
    ];
  }

  function agenda() {
    const elements = [...ground(), text("title", titleX, m, titleW, 90, { font: D, size: "{type.h2}", weight: 650, color: ink, align: titleAlign }, { binding: "title" })];
    if (idea.list === "columns") {
      for (let i = 0; i < 4; i += 1) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = m + col * (inner / 2 + 12);
        const y = 240 + row * 280;
        const slot = item("itemNumber", i);
        const label = item("labeledLabel", i);
        const detail = item("labeledDetail", i);
        elements.push(
          text("n" + i, x, y, 120, 70, { font: D, size: "{type.h2}", weight: 700, color: accent }, slot.content, slot.extra),
          text("al" + i, x, y + 80, inner / 2 - 40, 50, { font: D, size: "{type.h4}", weight: 650, color: ink }, label.content, label.extra),
          text("ad" + i, x, y + 140, inner / 2 - 40, 80, { font: F, size: "{type.body}", color: muted }, detail.content, detail.extra),
        );
      }
      return elements;
    }
    if (idea.list === "stack") {
      for (let i = 0; i < 4; i += 1) {
        const y = 210 + i * 155;
        const slot = item("itemNumber", i);
        const label = item("labeledLabel", i);
        const detail = item("labeledDetail", i);
        elements.push(
          shape("bar" + i, m, y, inner, 130, i % 2 ? card : "{color.surface}", 2, r),
          text("n" + i, m + 28, y + 30, 100, 70, { font: D, size: "{type.h2}", weight: 700, color: accent }, slot.content, slot.extra),
          text("al" + i, m + 150, y + 28, 500, 50, { font: D, size: "{type.h4}", weight: 650, color: ink }, label.content, label.extra),
          text("ad" + i, m + 680, y + 28, inner - 720, 80, { font: F, size: "{type.body}", color: muted }, detail.content, detail.extra),
        );
      }
      return elements;
    }
    const rows = idea.list === "short" ? 3 : 5;
    for (let i = 0; i < rows; i += 1) {
      const y = 220 + i * ((H - 280) / rows);
      const slot = item("itemNumber", i);
      const label = item("labeledLabel", i);
      const detail = item("labeledDetail", i);
      elements.push(
        text("n" + i, m, y, 90, 48, { font: D, size: "{type.h3}", weight: 700, color: accent }, slot.content, slot.extra),
        text("al" + i, m + 120, y, 420, 48, { font: D, size: "{type.h4}", weight: 650, color: ink }, label.content, label.extra),
        text("ad" + i, m + 560, y, inner - 560, 48, { font: F, size: "{type.body}", color: muted }, detail.content, detail.extra),
      );
    }
    return elements;
  }

  function timeline() {
    const elements = [...ground(), text("title", titleX, m, titleW, 80, { font: D, size: "{type.h2}", weight: 650, color: ink, align: titleAlign }, { binding: "title" })];
    if (idea.timeline === "cards") {
      const gap = 24;
      const colW = (inner - gap * 3) / 4;
      for (let i = 0; i < 4; i += 1) {
        const x = m + i * (colW + gap);
        const marker = item("timelineMarker", i);
        const label = item("timelineLabel", i);
        const detail = item("labeledDetail", i);
        elements.push(
          shape("card" + i, x, 240, colW, 520, card, 2, r),
          shape("top" + i, x, 240, colW, 12, accent, 3),
          text("m" + i, x + 24, 280, colW - 48, 40, { font: D, size: "{type.h4}", weight: 700, color: accent }, marker.content, marker.extra),
          text("tl" + i, x + 24, 340, colW - 48, 80, { font: D, size: "{type.h4}", weight: 650, color: ink }, label.content, label.extra),
          text("td" + i, x + 24, 440, colW - 48, 240, { font: F, size: "{type.body}", color: muted }, detail.content, detail.extra),
        );
      }
      return elements;
    }
    if (idea.timeline === "vertical") {
      elements.push(shape("spine", m + 16, 240, 4, 560, "{color.rule}", 2));
      for (let i = 0; i < 4; i += 1) {
        const y = 250 + i * 140;
        const marker = item("timelineMarker", i);
        const label = item("timelineLabel", i);
        const detail = item("labeledDetail", i);
        elements.push(
          shape("dot" + i, m, y + 8, 36, 36, accent, 4, 18),
          text("m" + i, m + 64, y, 120, 40, { font: D, size: "{type.h4}", weight: 700, color: accent }, marker.content, marker.extra),
          text("tl" + i, m + 200, y, 400, 40, { font: D, size: "{type.h4}", weight: 650, color: ink }, label.content, label.extra),
          text("td" + i, m + 640, y, inner - 640, 70, { font: F, size: "{type.body}", color: muted }, detail.content, detail.extra),
        );
      }
      return elements;
    }
    elements.push(shape("line", m, 470, inner, 4, "{color.rule}", 2));
    for (let i = 0; i < 4; i += 1) {
      const x = m + i * (inner / 4);
      const marker = item("timelineMarker", i);
      const label = item("timelineLabel", i);
      const detail = item("labeledDetail", i);
      elements.push(
        shape("dot" + i, x, 456, 32, 32, accent, 4, 16),
        text("m" + i, x, 390, 200, 40, { font: D, size: "{type.h4}", weight: 700, color: accent }, marker.content, marker.extra),
        text("tl" + i, x, 520, inner / 4 - 24, 40, { font: D, size: "{type.h4}", weight: 650, color: ink }, label.content, label.extra),
        text("td" + i, x, 570, inner / 4 - 24, 80, { font: F, size: "{type.caption}", color: muted }, detail.content, detail.extra),
      );
    }
    return elements;
  }

  function stat() {
    if (idea.stat === "huge") {
      return [
        ...ground(),
        text("stat", m, 180, inner, 280, { font: D, size: Math.round(180 * typeScale), weight: 800, color: accent, align: titleAlign }, { binding: "subtitle" }),
        text("title", titleX, 500, titleW, 120, { font: D, size: "{type.h2}", weight: 650, color: ink, align: titleAlign }, { binding: "title" }),
        text("body", titleX, 640, Math.min(titleW, 900), 80, { font: F, size: "{type.body}", color: muted, align: titleAlign }, { binding: "bullets" }),
      ];
    }
    if (idea.stat === "split") {
      return [
        ...ground(),
        shape("left", 0, 0, W / 2, H, accent, 1),
        text("stat", 80, 280, W / 2 - 160, 220, { font: D, size: "{type.stat}", weight: 700, color: on }, { binding: "subtitle" }),
        text("title", W / 2 + 60, 280, W / 2 - 140, 160, { font: D, size: "{type.h2}", weight: 650, color: ink }, { binding: "title" }),
        text("body", W / 2 + 60, 470, W / 2 - 160, 120, { font: F, size: "{type.body}", color: muted }, { binding: "bullets" }),
      ];
    }
    if (idea.stat === "panel") {
      return [
        ...ground(),
        shape("block", W - 620, 0, 620, H, accent, 1),
        text("stat", W - 540, 300, 480, 200, { font: D, size: "{type.stat}", weight: 700, color: on }, { binding: "subtitle" }),
        text("title", m, 280, W - 760, 180, { font: D, size: "{type.h2}", weight: 650, color: ink }, { binding: "title" }),
        text("body", m, 500, W - 760, 120, { font: F, size: "{type.body}", color: muted }, { binding: "bullets" }),
      ];
    }
    return [
      ...ground(),
      shape("halo", m, 180, 300, 300, "{color.surface}", 2, 150),
      text("stat", m + 24, 230, 260, 180, { font: D, size: "{type.stat}", weight: 700, color: accent, align: "center" }, { binding: "subtitle" }),
      text("title", m + 360, 240, 900, 140, { font: D, size: "{type.h2}", weight: 650, color: ink }, { binding: "title" }),
      text("body", m + 360, 400, 800, 80, { font: F, size: "{type.body}", color: muted }, { binding: "bullets" }),
    ];
  }

  function three() {
    const elements = [...ground(), text("title", titleX, m, titleW, 80, { font: D, size: "{type.h2}", weight: 650, color: ink, align: titleAlign }, { binding: "title" })];
    if (idea.three === "band") {
      for (let i = 0; i < 3; i += 1) {
        const y = 220 + i * 210;
        const label = item("labeledLabel", i);
        const detail = item("labeledDetail", i);
        const num = item("itemNumber", i);
        elements.push(
          shape("band" + i, 0, y, W, 180, i === 1 ? accent : card, 2),
          text("n" + i, m, y + 40, 80, 50, { font: D, size: "{type.h3}", weight: 700, color: i === 1 ? on : accent }, num.content, num.extra),
          text("al" + i, m + 120, y + 36, 500, 50, { font: D, size: "{type.h3}", weight: 650, color: i === 1 ? on : ink }, label.content, label.extra),
          text("ad" + i, m + 660, y + 36, inner - 660, 100, { font: F, size: "{type.body}", color: i === 1 ? on : muted }, detail.content, detail.extra),
        );
      }
      return elements;
    }
    if (idea.three === "cards") {
      const gap = 28;
      const colW = (inner - gap * 2) / 3;
      for (let i = 0; i < 3; i += 1) {
        const x = m + i * (colW + gap);
        const label = item("labeledLabel", i);
        const detail = item("labeledDetail", i);
        const num = item("itemNumber", i);
        elements.push(
          shape("card" + i, x, 240, colW, 520, card, 2, r),
          text("n" + i, x + 28, 280, 80, 50, { font: D, size: "{type.h3}", weight: 700, color: accent }, num.content, num.extra),
          text("al" + i, x + 28, 360, colW - 56, 80, { font: D, size: "{type.h4}", weight: 650, color: ink }, label.content, label.extra),
          text("ad" + i, x + 28, 460, colW - 56, 220, { font: F, size: "{type.body}", color: muted }, detail.content, detail.extra),
        );
      }
      return elements;
    }
    for (let i = 0; i < 3; i += 1) {
      const y = 230 + i * 200;
      const label = item("labeledLabel", i);
      const detail = item("labeledDetail", i);
      const num = item("itemNumber", i);
      elements.push(
        shape("rule" + i, m, y, 48, 6, accent, 3),
        text("n" + i, m + 70, y - 8, 80, 50, { font: D, size: "{type.h3}", weight: 700, color: accent }, num.content, num.extra),
        text("al" + i, m + 160, y - 8, 420, 50, { font: D, size: "{type.h3}", weight: 650, color: ink }, label.content, label.extra),
        text("ad" + i, m + 600, y - 8, inner - 600, 80, { font: F, size: "{type.body}", color: muted }, detail.content, detail.extra),
      );
    }
    return elements;
  }

  function comparison() {
    if (idea.compare === "stacked") {
      const elements = [...ground(), text("title", titleX, m, titleW, 80, { font: D, size: "{type.h2}", weight: 650, color: ink, align: titleAlign }, { binding: "title" })];
      const leftLabel = item("labeledLabel", 0);
      const leftDetail = item("labeledDetail", 0);
      const rightLabel = item("labeledLabel", 1);
      const rightDetail = item("labeledDetail", 1);
      elements.push(
        shape("top", m, 220, inner, 280, card, 2, r),
        shape("bottom", m, 530, inner, 280, "{color.surface}", 2, r),
        text("ll", m + 40, 250, inner - 80, 50, { font: D, size: "{type.h3}", weight: 650, color: ink }, leftLabel.content, leftLabel.extra),
        text("ld", m + 40, 320, inner - 80, 140, { font: F, size: "{type.body}", color: muted }, leftDetail.content, leftDetail.extra),
        text("rl", m + 40, 560, inner - 80, 50, { font: D, size: "{type.h3}", weight: 650, color: ink }, rightLabel.content, rightLabel.extra),
        text("rd", m + 40, 630, inner - 80, 140, { font: F, size: "{type.body}", color: muted }, rightDetail.content, rightDetail.extra),
      );
      return elements;
    }
    const leftW = idea.compare === "even" ? inner * 0.5 : inner * 0.42;
    const elements = [
      ...ground(),
      text("title", titleX, m, titleW, 80, { font: D, size: "{type.h2}", weight: 650, color: ink, align: titleAlign }, { binding: "title" }),
      shape("left", m, 230, leftW - 16, 560, card, 2, r),
      shape("right", m + leftW, 230, inner - leftW, 560, idea.compare === "even" ? accent : "{color.surface}", 2, r),
    ];
    const leftLabel = item("labeledLabel", 0);
    const leftDetail = item("labeledDetail", 0);
    const rightLabel = item("labeledLabel", 1);
    const rightDetail = item("labeledDetail", 1);
    const rightInk = idea.compare === "even" ? on : ink;
    const rightMuted = idea.compare === "even" ? on : muted;
    elements.push(
      text("ll", m + 32, 270, leftW - 80, 60, { font: D, size: "{type.h3}", weight: 650, color: ink }, leftLabel.content, leftLabel.extra),
      text("ld", m + 32, 350, leftW - 80, 360, { font: F, size: "{type.body}", color: muted }, leftDetail.content, leftDetail.extra),
      text("rl", m + leftW + 32, 270, inner - leftW - 64, 60, { font: D, size: "{type.h3}", weight: 650, color: rightInk }, rightLabel.content, rightLabel.extra),
      text("rd", m + leftW + 32, 350, inner - leftW - 64, 360, { font: F, size: "{type.body}", color: rightMuted }, rightDetail.content, rightDetail.extra),
    );
    return elements;
  }

  function team() {
    const elements = [...ground(), text("title", titleX, m, titleW, 80, { font: D, size: "{type.h2}", weight: 650, color: ink, align: titleAlign }, { binding: "title" })];
    if (idea.team === "duo") {
      for (let i = 0; i < 2; i += 1) {
        const x = m + i * (inner / 2 + 20);
        const label = item("labeledLabel", i);
        const detail = item("labeledDetail", i);
        elements.push(
          shape("card" + i, x, 230, inner / 2 - 20, 560, card, 2, r),
          shape("mark" + i, x + 40, 280, 72, 10, accent, 4),
          text("al" + i, x + 40, 330, inner / 2 - 100, 80, { font: D, size: "{type.h2}", weight: 650, color: ink }, label.content, label.extra),
          text("ad" + i, x + 40, 440, inner / 2 - 100, 240, { font: F, size: "{type.body}", color: muted }, detail.content, detail.extra),
        );
      }
      return elements;
    }
    if (idea.team === "strip") {
      for (let i = 0; i < 4; i += 1) {
        const y = 220 + i * 150;
        const label = item("labeledLabel", i);
        const detail = item("labeledDetail", i);
        elements.push(
          shape("bar" + i, m, y, 10, 100, accent, 3),
          text("al" + i, m + 40, y, 360, 50, { font: D, size: "{type.h4}", weight: 650, color: ink }, label.content, label.extra),
          text("ad" + i, m + 430, y, inner - 430, 90, { font: F, size: "{type.body}", color: muted }, detail.content, detail.extra),
        );
      }
      return elements;
    }
    const colW = (inner - 36 * 3) / 4;
    for (let i = 0; i < 4; i += 1) {
      const x = m + i * (colW + 36);
      const label = item("labeledLabel", i);
      const detail = item("labeledDetail", i);
      elements.push(
        shape("card" + i, x, 260, colW, 460, card, 2, r),
        shape("mark" + i, x + 28, 300, 48, 8, accent, 4),
        text("al" + i, x + 28, 340, colW - 56, 70, { font: D, size: "{type.h4}", weight: 650, color: ink }, label.content, label.extra),
        text("ad" + i, x + 28, 430, colW - 56, 200, { font: F, size: "{type.body}", color: muted }, detail.content, detail.extra),
      );
    }
    return elements;
  }

  function image() {
    if (idea.imageMode === "inset") {
      const photoW = Math.round(inner * 0.55);
      const left = idea.imageSide === "left";
      const photoX = left ? m : W - m - photoW;
      const textX = left ? m + photoW + 40 : m;
      const textW = inner - photoW - 40;
      return [
        ...ground(),
        {
          id: "photo", type: "image", role: "image",
          x: photoX, y: 180, width: photoW, height: H - 260, zIndex: 2,
          imageContent: { binding: "image", fit: "cover", alignX: 0.5, alignY: 0.5 },
          visibleWhen: "hasImage",
        },
        text("title", textX, 240, textW, 180, { font: D, size: "{type.h2}", weight: 650, color: ink }, { binding: "title" }),
        text("body", textX, 450, textW, 160, { font: F, size: "{type.body}", color: muted }, { binding: "bullets" }),
      ];
    }
    const photoW = Math.round(W * imageSplit);
    const left = idea.imageSide === "left";
    const photoX = left ? 0 : W - photoW;
    const textX = left ? photoW + 48 : m;
    const textW = W - photoW - m - 48;
    return [
      ...ground(),
      {
        id: "photo", type: "image", role: "image",
        x: photoX, y: 0, width: photoW, height: H, zIndex: 2,
        imageContent: { binding: "image", fit: "cover", alignX: 0.5, alignY: 0.5 },
        visibleWhen: "hasImage",
      },
      text("title", textX, 240, textW, 180, { font: D, size: "{type.h2}", weight: 650, color: ink }, { binding: "title" }),
      text("body", textX, 450, textW, 160, { font: F, size: "{type.body}", color: muted }, { binding: "bullets" }),
    ];
  }

  function textOnly() {
    const x = idea.align === "center" ? m + Math.round(inner * 0.1) : titleX;
    const w = idea.align === "center" ? Math.round(inner * 0.8) : titleW;
    if (idea.text === "accent") {
      return [
        ...ground(),
        shape("panel", 0, 0, W, H, accent, 1),
        text("title", x, 260, w, 220, { font: D, size: "{type.h1}", weight: 700, color: on, align: titleAlign }, { binding: "title" }),
        text("body", x, 520, Math.min(w, 900), 120, { font: F, size: "{type.body}", color: on, align: titleAlign }, { binding: "bullets" }),
      ];
    }
    if (idea.text === "rule") {
      return [
        ...ground(),
        shape("rule", x, 220, 96, 8, accent, 3),
        text("title", x, 260, w, 200, { font: D, size: "{type.h1}", weight: 650, color: ink, align: titleAlign }, { binding: "title" }),
        text("body", x, 500, Math.min(w, 900), 120, { font: F, size: "{type.body}", color: muted, align: titleAlign }, { binding: "bullets" }),
      ];
    }
    return [
      ...ground(),
      text("title", x, 240, w, 200, { font: D, size: "{type.h1}", weight: 650, color: ink, align: titleAlign }, { binding: "title" }),
      text("body", x, 480, Math.min(w, 900), 120, { font: F, size: "{type.body}", color: muted, align: titleAlign }, { binding: "bullets" }),
    ];
  }

  function quote() {
    if (idea.quote === "band") {
      return [
        ...ground(),
        shape("band", 0, 220, W, 460, accent, 2),
        text("title", m, 300, inner, 240, { font: D, size: "{type.h2}", weight: 600, color: on, align: "center", lineHeight: 1.2 }, { binding: "title" }),
        text("body", m, 580, inner, 50, { font: F, size: "{type.body}", color: on, align: "center" }, { binding: "bullets" }),
      ];
    }
    if (idea.quote === "corner") {
      return [
        ...ground(),
        shape("block", W - 520, 0, 520, H, "{color.surface}", 1),
        text("mark", m, 200, 160, 120, { font: D, size: 120, weight: 600, color: accent, lineHeight: 1 }, { spans: [{ text: "\u201c" }] }),
        text("title", m + 20, 320, inner - 560, 280, { font: D, size: "{type.h2}", weight: 600, color: ink, lineHeight: 1.2 }, { binding: "title" }),
        text("body", W - 460, 360, 380, 160, { font: F, size: "{type.body}", color: muted }, { binding: "bullets" }),
      ];
    }
    return [
      ...ground(),
      text("mark", m, 140, 160, 120, { font: D, size: 120, weight: 600, color: accent, lineHeight: 1 }, { spans: [{ text: "\u201c" }] }),
      text("title", m + 20, 260, inner - 40, 240, { font: D, size: "{type.h2}", weight: 600, color: ink, lineHeight: 1.2 }, { binding: "title" }),
      text("body", m + 20, 540, 700, 60, { font: F, size: "{type.body}", color: muted }, { binding: "bullets" }),
    ];
  }

  function close() {
    if (idea.close === "panel") {
      return [
        ...ground(),
        shape("panel", m, 180, inner, 540, accent, 2, r),
        text("title", m + 60, 320, inner - 120, 160, { font: D, size: "{type.h1}", weight: 650, color: on, align: "center" }, { binding: "title" }),
        text("body", m + 200, 520, inner - 400, 70, { font: F, size: "{type.body}", color: on, align: "center" }, { binding: "bullets" }),
      ];
    }
    if (idea.close === "center") {
      return [
        ...ground(),
        shape("rule", W / 2 - 60, 280, 120, 6, accent, 3),
        text("title", m, 320, inner, 160, { font: D, size: "{type.h1}", weight: 650, color: ink, align: "center" }, { binding: "title" }),
        text("body", m + 200, 520, inner - 400, 70, { font: F, size: "{type.body}", color: muted, align: "center" }, { binding: "bullets" }),
      ];
    }
    const align = idea.close === "right" ? "right" : "left";
    const x = idea.close === "right" ? W - m - 1000 : m;
    return [
      ...ground(),
      shape("rule", idea.close === "right" ? W - m - 120 : m, 300, 120, 6, accent, 3),
      text("title", x, 340, 1000, 160, { font: D, size: "{type.h1}", weight: 650, color: ink, align }, { binding: "title" }),
      text("body", x, 530, 700, 70, { font: F, size: "{type.body}", color: muted, align }, { binding: "bullets" }),
    ];
  }

  const builders = {
    layoutTitleFocus: ideaCover,
    layoutAgendaList: agenda,
    layoutTimeline: timeline,
    layoutStatHighlight: stat,
    layoutThreeUp: three,
    layoutComparison: comparison,
    layoutTeam: team,
    layoutImageLeft: image,
    layoutTextOnly: textOnly,
    layoutQuoteBanner: quote,
    layoutClosingCta: close,
  };

  const previewCopy = {
    layoutTitleFocus: [idea.title, [idea.subtitle]],
    layoutAgendaList: ["What this covers", ["Place — Where the work happens", "People — Who it is for", "Proof — What changed", "Next — The first step", "Care — What we will not rush"]],
    layoutTimeline: ["How it unfolds", ["Start — Name the job", "Build — Make the first cut", "Show — Put it in front of someone"]],
    layoutStatHighlight: ["The figure that matters", ["One number, then stop"]],
    layoutThreeUp: ["Three parts", ["See — Look at the real thing", "Make — Shape a response", "Share — Hand it to someone"]],
    layoutComparison: ["Two ways", ["Before — The old habit", "After — The new one"]],
    layoutTeam: ["Who holds it", ["Lead — Sets the direction", "Make — Does the work", "Tell — Writes it down", "Host — Welcomes people"]],
    layoutImageLeft: ["Beside the picture", ["One point next to the photograph", "Leave the rest of the frame quiet"]],
    layoutTextOnly: ["Say it in one line", ["A single idea"]],
    layoutQuoteBanner: ["A line worth keeping", ["Said in the room"]],
    layoutClosingCta: ["Begin here", ["Take the first step"]],
  };

  const reasoning = planReasoning(readCatalog(), rng);
  const kit = {
    ground, shape, text, photo, item, m, r, W, H, D, F,
    ink, muted, accent, card, bg, on, photoUrl: idea.photo,
  };
  const sequence = ["layoutTitleFocus", ...reasoning.map((step) => step.layoutId), "layoutClosingCta"];
  const id = "gen-" + String(numeric).padStart(4, "0");
  const taste = {
    cover: idea.cover,
    density: idea.density,
    align: idea.align,
    slides: reasoning.map((step) => step.layoutId),
    groundMode,
    designLanguage: idea.designLanguage || "editorial",
  };
  const deck = {
    version: 2,
    schemaVersion: 2,
    id,
    name: idea.name,
    description: idea.name + " — " + fonts.display + " and " + fonts.text + ".",
    category: idea.name,
    visualMode: "hybrid",
    seed: numeric,
    taste,
    reasoning,
    geometry: [
      idea.cover, idea.density, idea.align, idea.list, idea.timeline, idea.stat,
      idea.compare, idea.imageSide, idea.imageMode, idea.three, idea.team, idea.text, idea.quote, idea.close,
      margin, radius, imageSplit, groundMode, idea.designLanguage || "editorial",
      idea.name, reasoning.map((step) => step.strategy).join("~"),
    ].join("."),
    tokens: {
      color: {
        bg: palette.bg,
        surface: palette.surface,
        card: palette.card,
        ink: palette.ink,
        muted: palette.muted,
        rule: palette.rule,
        accent: palette.accent,
        accent2: palette.accent2,
        onAccent: palette.onAccent,
      },
      font: { display: fonts.display, text: fonts.text },
      type: {
        eyebrow: 18,
        h1: Math.round(84 * typeScale),
        h2: Math.round(52 * typeScale),
        h3: Math.round(34 * typeScale),
        h4: Math.round(26 * typeScale),
        body: Math.round(24 * typeScale),
        caption: 20,
        stat: Math.round(120 * typeScale),
        micro: 16,
      },
    },
    theme: {
      name: palette.name,
      backgroundColor: "{color.bg}",
      fontFamily: "{font.text}",
      titleFontSize: 40,
      titleColor: "{color.ink}",
      titleBold: true,
      titleItalic: false,
      bodyFontSize: 20,
      bodyColor: "{color.muted}",
      bodyBold: false,
      bodyItalic: false,
    },
    layoutSequence: sequence.slice(),
    layouts: Object.fromEntries(sequence.map((layoutId) => {
      if (layoutId === "layoutTitleFocus") return [layoutId, layout(layoutId, ideaCover())];
      if (layoutId === "layoutClosingCta") return [layoutId, layout(layoutId, close())];
      const step = reasoning.find((item) => item.layoutId === layoutId);
      return [layoutId, layout(layoutId, buildStrategy(step.strategy, kit))];
    })),
    previewSlides: sequence.map((layoutId, index) => {
      const step = reasoning.find((item) => item.layoutId === layoutId);
      const copy = step ? previewFor(step.strategy) : { title: (previewCopy[layoutId] || ["Slide"])[0], bullets: (previewCopy[layoutId] || ["Slide", ["Content"]])[1] };
      return {
        id: id + "-p" + (index + 1),
        layout: layoutId,
        title: copy.title,
        bullets: copy.bullets,
      };
    }),
  };

  const errors = validateDeck(deck);
  if (errors.length) {
    const error = new Error(errors.join("; "));
    error.status = 500;
    throw error;
  }
  const tells = antiTells(deck, null);
  deck.tells = tells;
  if (tells.length >= 3) {
    const error = new Error("Rejected AI tells: " + tells.join(", "));
    error.status = 422;
    error.tells = true;
    throw error;
  }
  return deck;
}

module.exports = { composeDeck };
