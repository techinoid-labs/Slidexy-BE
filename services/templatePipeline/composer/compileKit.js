/**
 * Build-time Chromium measure for design-system components.
 * Compile cover variants × allowlisted fontPairs into app-library/native/composer/.
 *
 *   node services/templatePipeline/composer/compileKit.js [--only cover]
 */

const fs = require("fs");
const path = require("path");

const { fontFaceCss } = require("../fonts");

const ROOT = path.join(__dirname, "..", "..", "..");
const DESIGN = path.join(ROOT, "design-system");
const OUT_DIR = path.join(ROOT, "app-library", "native", "composer");
const BUILD_DIR = path.join(ROOT, "docs", "template-pipeline", "composer", "_build");

/** Height multiplier on measured line boxes (4c: set from LO/Chrome ratios). */
let HEIGHT_SLACK = 1.1;
/** Width shrink when node-canvas measureText exceeds Chrome Range (applied to box width). */
let WIDTH_SLACK = 1;

function setSlacks(height, width) {
  if (height != null) HEIGHT_SLACK = height;
  if (width != null) WIDTH_SLACK = width;
}

/** Mirrors catalogCaps.ANCHORS (not exported) plus full token fields for decks. */
const ANCHORS = {
  "light-neutral": {
    bg: "#f3f1ee", surface: "#f3f1ee", card: "#FFFFFF", ink: "#1c1916",
    muted: "#5c564e", rule: "#d9d0c6", accent: "#8a8175", accent2: "#8a8175",
    // Dark onAccent — cream-on-taupe was 3.4:1 and failed geometry on divider accent-block.
    onAccent: "#1c1916",
  },
  "light-warm": {
    bg: "#f6efe6", surface: "#f6efe6", card: "#FFFFFF", ink: "#24180f",
    muted: "#6b5344", rule: "#e0d2c4", accent: "#b85a2a", accent2: "#b85a2a", onAccent: "#f6efe6",
  },
  "dark-neutral": {
    bg: "#161616", surface: "#161616", card: "#222222", ink: "#f4f1ea",
    muted: "#b7b1a6", rule: "#3a3a3a", accent: "#b7b1a6", accent2: "#b7b1a6", onAccent: "#161616",
  },
};

/** Families proven installed via GDI+ in phase 4a. */
const FONT_PAIRS = {
  "corp-calibri": { display: "Calibri", text: "Calibri" },
  "corp-arial": { display: "Arial", text: "Arial" },
  editorial: { display: "Georgia", text: "Calibri" },
  modern: { display: "Segoe UI", text: "Segoe UI" },
};

const VARIANTS = ["word", "split", "full-bleed"];

/** Word bank for capacity fillers (5–6 letter avg, none over 12). */
const CAPACITY_WORDS = [
  "words", "about", "theme", "value", "growth", "teams", "clear", "focus",
  "plans", "scale", "trust", "proof", "model", "market", "close", "next",
  "steps", "ready", "office", "people", "system", "simple", "strong", "steady",
  "modern", "design", "report", "result", "number", "figure", "metric", "signal",
];

function quoteFont(family) {
  return '"' + String(family).replace(/"/g, "") + '"';
}

function round(value) {
  return Math.round(Number(value) * 100) / 100;
}

/** Exact maxChars of word-shaped copy; no word >12; no trailing partial word. */
function capacityText(maxChars) {
  const limit = Math.max(1, Number(maxChars) || 1);
  const parts = [];
  let i = 0;
  while (true) {
    const word = CAPACITY_WORDS[i % CAPACITY_WORDS.length];
    i += 1;
    const next = parts.length ? parts.join(" ") + " " + word : word;
    if (next.length > limit) break;
    parts.push(word);
    if (next.length === limit) return next;
  }
  let text = parts.join(" ");
  while (text.length < limit) {
    const rem = limit - text.length;
    const bits = text ? text.split(" ") : [];
    const last = bits.length ? bits[bits.length - 1] : "";
    if (last && last.length < 12 && rem >= 1) {
      const add = Math.min(12 - last.length, rem);
      bits[bits.length - 1] = last + "x".repeat(add);
      text = bits.join(" ");
      continue;
    }
    if (rem >= 2) {
      const wlen = Math.min(12, rem - 1);
      text = text ? text + " " + "x".repeat(wlen) : "x".repeat(Math.min(12, rem));
      continue;
    }
    break;
  }
  if (text.length > limit) {
    text = text.slice(0, limit);
    if (/\s/.test(text[text.length - 1] || "")) text = text.trimEnd();
    const cut = text.lastIndexOf(" ");
    if (text.length < limit && cut > 0) {
      // dropped a partial word; refill by extending prior word
      text = text.slice(0, cut);
      while (text.length < limit) {
        const bits = text.split(" ");
        if (bits[bits.length - 1].length >= 12) break;
        bits[bits.length - 1] += "x";
        text = bits.join(" ");
        if (text.length > limit) {
          bits[bits.length - 1] = bits[bits.length - 1].slice(0, bits[bits.length - 1].length - (text.length - limit));
          text = bits.join(" ");
          break;
        }
      }
    }
  }
  while (text.length < limit) {
    const bits = text.split(" ").filter(Boolean);
    if (!bits.length) return "x".repeat(limit);
    if (bits[bits.length - 1].length >= 12) {
      if (limit - text.length >= 2) {
        text += " " + "x".repeat(Math.min(12, limit - text.length - 1));
      } else break;
    } else {
      bits[bits.length - 1] += "x";
      text = bits.join(" ");
    }
  }
  return text.slice(0, limit);
}

function slotMaxMap(spec) {
  const map = {};
  (spec.slots || []).forEach((slot) => {
    const max = Number(slot.maxChars) || 40;
    const repeat = Number(slot.repeat) || 0;
    if (repeat > 0) {
      for (let i = 1; i <= repeat; i += 1) map[slot.dataRole + "-" + i] = max;
    } else {
      map[slot.dataRole] = max;
    }
  });
  return map;
}

async function measureVariant(browser, htmlPath, variant, fontPairId, componentId, spec) {
  const pair = FONT_PAIRS[fontPairId];
  const colors = ANCHORS["light-neutral"];
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
  let html = fs.readFileSync(htmlPath, "utf8");
  html = html.replace(
    /(<div\s+class="slide"[^>]*\sdata-variant=")[^"]*(")/,
    "$1" + variant + "$2"
  );
  const maxMap = slotMaxMap(spec || { slots: [] });
  Object.keys(maxMap).forEach((role) => {
    const fill = capacityText(maxMap[role]);
    const re = new RegExp("(<[^>]*data-role=\"" + role + "\"[^>]*>)([\\s\\S]*?)(</[^>]+>)", "i");
    if (re.test(html)) html = html.replace(re, "$1" + fill + "$3");
  });
  html = html.replace(/--color-bg:\s*[^;]+;/, "--color-bg: " + colors.bg + ";");
  html = html.replace(/--color-surface:\s*[^;]+;/, "--color-surface: " + colors.surface + ";");
  html = html.replace(/--color-card:\s*[^;]+;/, "--color-card: " + colors.card + ";");
  html = html.replace(/--color-ink:\s*[^;]+;/, "--color-ink: " + colors.ink + ";");
  html = html.replace(/--color-muted:\s*[^;]+;/, "--color-muted: " + colors.muted + ";");
  html = html.replace(/--color-rule:\s*[^;]+;/, "--color-rule: " + colors.rule + ";");
  html = html.replace(/--color-accent:\s*[^;]+;/, "--color-accent: " + colors.accent + ";");
  html = html.replace(/--color-accent2:\s*[^;]+;/, "--color-accent2: " + colors.accent2 + ";");
  html = html.replace(/--color-on-accent:\s*[^;]+;/, "--color-on-accent: " + colors.onAccent + ";");
  html = html.replace(/--font-display:\s*[^;]+;/, "--font-display: " + quoteFont(pair.display) + ";");
  html = html.replace(/--font-text:\s*[^;]+;/, "--font-text: " + quoteFont(pair.text) + ";");
  const faceCss = fontFaceCss();
  if (faceCss) {
    html = html.replace("</style>", faceCss + "\n</style>");
  }
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
  });

  const shotDir = path.join(BUILD_DIR, (componentId || "cover") + "-" + variant + "-" + fontPairId);
  fs.mkdirSync(shotDir, { recursive: true });
  const chromePng = path.join(shotDir, "chrome.png");
  await page.screenshot({ path: chromePng, clip: { x: 0, y: 0, width: 1600, height: 900 } });

  const measured = await page.evaluate((expected) => {
    const slide = document.querySelector(".slide");
    const slideRect = slide.getBoundingClientRect();
    const roles = [];
    slide.querySelectorAll("[data-role]").forEach((el) => {
      const role = el.getAttribute("data-role");
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const display = style.display;
      // Hidden variant slots (display:none) and collapsed flex leftovers must not enter the kit.
      if (display === "none" || rect.width <= 0 || rect.height <= 0) return;
      const transform = style.textTransform;
      let text = (el.innerText || el.textContent || "").trim();
      if (transform === "uppercase") text = text.toUpperCase();
      if (transform === "lowercase") text = text.toLowerCase();
      if (transform === "capitalize") {
        text = text.replace(/\b\w/g, (ch) => ch.toUpperCase());
      }
      const fontSize = parseFloat(style.fontSize) || 16;
      let lineHeight = style.lineHeight;
      let lineHeightRatio = 1.2;
      if (lineHeight === "normal") lineHeightRatio = 1.2;
      else if (lineHeight.endsWith("px")) lineHeightRatio = parseFloat(lineHeight) / fontSize;
      else lineHeightRatio = parseFloat(lineHeight) || 1.2;
      const padL = parseFloat(style.paddingLeft) || 0;
      const padR = parseFloat(style.paddingRight) || 0;
      const padT = parseFloat(style.paddingTop) || 0;
      const padB = parseFloat(style.paddingBottom) || 0;
      const contentWidth = Math.max(0, rect.width - padL - padR);
      const contentHeight = Math.max(0, rect.height - padT - padB);
      const range = document.createRange();
      range.selectNodeContents(el);
      const lineRects = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0);
      const lines = Math.max(1, lineRects.length || Math.round(contentHeight / (fontSize * lineHeightRatio)));
      let textWidth = 0;
      let fontCheck = null;
      let canvasWidth = 0;
      if (role === "title" || role === "body" || role === "kicker" || role === "statement" || role === "quote" || role === "attribution" || role === "number"
        || /^bullet/.test(role) || /^stat/.test(role) || /^label/.test(role) || /^item-/.test(role)
        || /^step-/.test(role) || /^name-/.test(role) || /^role-/.test(role)) {
        const want = (role === "title" || role === "statement" || role === "number" || /^stat/.test(role) || /^step-title/.test(role) || /^name-/.test(role))
          ? expected.display : expected.text;
        const node = el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild : el;
        const tr = document.createRange();
        if (node.nodeType === 3) tr.selectNodeContents(node);
        else tr.selectNodeContents(el);
        const boxes = Array.from(tr.getClientRects()).filter((r) => r.width > 0);
        textWidth = boxes.reduce((sum, box) => sum + box.width, 0);
        try {
          fontCheck = document.fonts.check(fontSize + 'px "' + want + '"');
        } catch (error) {
          fontCheck = false;
        }
        const probe = document.createElement("canvas").getContext("2d");
        probe.font = (parseInt(style.fontWeight, 10) >= 600 ? "bold " : "") + fontSize + 'px "' + want + '"';
        canvasWidth = probe.measureText(text).width;
      }
      const cssZ = parseInt(style.zIndex, 10);
      const stackEl = el.closest("[data-stack]");
      const maxCharsAttr = el.getAttribute("data-max-chars");
      let alignX = 0.5;
      let alignY = 0.5;
      if (role === "photo" || /^photo-/.test(role)) {
        const pos = String(style.objectPosition || "center").trim().toLowerCase();
        const parts = pos.split(/\s+/).filter(Boolean);
        function axis(token, fallback) {
          if (token == null) return fallback;
          if (token === "left" || token === "top") return 0;
          if (token === "center") return 0.5;
          if (token === "right" || token === "bottom") return 1;
          if (/%$/.test(token)) return Math.max(0, Math.min(1, parseFloat(token) / 100));
          const n = parseFloat(token);
          return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback;
        }
        if (parts.length === 1) {
          if (parts[0] === "top" || parts[0] === "bottom") {
            alignY = axis(parts[0], 0.5);
          } else {
            alignX = axis(parts[0], 0.5);
          }
        } else if (parts.length >= 2) {
          alignX = axis(parts[0], 0.5);
          alignY = axis(parts[1], 0.5);
        }
      }
      roles.push({
        role,
        tag: el.tagName.toLowerCase(),
        x: rect.left - slideRect.left + padL,
        y: rect.top - slideRect.top + padT,
        width: contentWidth,
        height: contentHeight,
        layoutWidth: rect.width,
        text,
        fontFamily: style.fontFamily,
        fontSize,
        fontWeight: parseInt(style.fontWeight, 10) || 400,
        color: style.color,
        textAlign: style.textAlign,
        lineHeight: lineHeightRatio,
        letterSpacing: parseFloat(style.letterSpacing) || 0,
        lines,
        textWidth,
        canvasWidth,
        fontCheck,
        computedFamily: style.fontFamily,
        backgroundColor: style.backgroundColor,
        borderRadius: parseFloat(style.borderRadius) || 0,
        opacity: parseFloat(style.opacity),
        cssZ: Number.isFinite(cssZ) ? cssZ : null,
        stackId: stackEl ? stackEl.getAttribute("data-stack") : null,
        maxChars: maxCharsAttr ? parseInt(maxCharsAttr, 10) : null,
        alignX,
        alignY,
      });
    });
    const stacks = [];
    slide.querySelectorAll("[data-stack]").forEach((stackEl) => {
      const id = stackEl.getAttribute("data-stack");
      const align = stackEl.getAttribute("data-stack-align") || "start";
      const rect = stackEl.getBoundingClientRect();
      const style = window.getComputedStyle(stackEl);
      if (style.display === "none") return;
      const gapCss = parseFloat(style.gap) || parseFloat(style.rowGap) || 28;
      // Direct flex children in order — role slots and intervening blocks (e.g. stat-grid).
      const order = [];
      const blocks = [];
      Array.from(stackEl.children).forEach((child, index) => {
        const cs = window.getComputedStyle(child);
        if (cs.display === "none") return;
        const childRect = child.getBoundingClientRect();
        if (child.hasAttribute("data-role")) {
          order.push(child.getAttribute("data-role"));
          return;
        }
        const blockId = id + "-block-" + index;
        order.push(blockId);
        blocks.push({
          id: blockId,
          x: childRect.left - slideRect.left,
          y: childRect.top - slideRect.top,
          width: childRect.width,
          height: childRect.height,
        });
      });
      const flexDir = String(style.flexDirection || "column").toLowerCase();
      stacks.push({
        id,
        order: order.slice(),
        blocks,
        gap: gapCss,
        align: align === "center" || align === "end" ? align : "start",
        direction: flexDir === "row" || flexDir === "row-reverse" ? "row" : "column",
        box: {
          x: rect.left - slideRect.left,
          y: rect.top - slideRect.top,
          width: rect.width,
          height: rect.height,
        },
      });
    });
    return { roles, stacks };
  }, { display: pair.display, text: pair.text });

  await page.close();
  return {
    measured: measured.roles || measured,
    stacks: measured.stacks || [],
    chromePng,
    colors,
    pair,
  };
}

function rgbToHex(rgb) {
  const m = String(rgb || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return null;
  return "#" + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("");
}

function nearestColorToken(hex, palette) {
  const value = String(hex || "").toLowerCase();
  if (!value) return "{color.ink}";
  // Prefer ground tokens first so full-bleed fields stay {color.bg} when bg==onAccent.
  // onAccent is last among equals so accent-block text still maps when colors diverge.
  const prefer = ["bg", "surface", "card", "ink", "muted", "accent", "accent2", "rule", "onAccent"];
  for (let i = 0; i < prefer.length; i += 1) {
    const key = prefer[i];
    if (palette && String(palette[key] || "").toLowerCase() === value) return "{color." + key + "}";
  }
  const keys = Object.keys(palette || {});
  for (let i = 0; i < keys.length; i += 1) {
    if (String(palette[keys[i]]).toLowerCase() === value) return "{color." + keys[i] + "}";
  }
  const m = value.match(/^#([0-9a-f]{6})$/i);
  if (m) {
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return lum > 140 ? "{color.onAccent}" : "{color.ink}";
  }
  return "{color.ink}";
}

function nextZ(item, fallback) {
  return item.cssZ != null && Number.isFinite(item.cssZ) ? item.cssZ : fallback;
}

function toElements(measured, fontPairId, variant, componentId, palette, spec) {
  const elements = [];
  let autoZ = 0;
  const prefix = "composer-" + (componentId || "cover") + "-";
  const maxMap = slotMaxMap(spec || { slots: [] });
  measured.forEach((item) => {
    if (item.role === "field" || item.role === "accent") {
      const fillHex = rgbToHex(item.backgroundColor);
      const fill = item.role === "accent"
        ? "{color.accent}"
        : (fillHex ? nearestColorToken(fillHex, palette) : "{color.bg}");
      elements.push({
        id: prefix + item.role,
        type: "shape",
        x: round(item.x),
        y: round(item.y),
        width: round(item.width),
        height: round(item.height),
        zIndex: nextZ(item, autoZ++),
        opacity: Number.isFinite(item.opacity) ? item.opacity : 1,
        shapeContent: {
          kind: "rect",
          fill,
          cornerRadius: round(item.borderRadius),
        },
      });
      return;
    }
    if (item.role === "photo" || /^photo-/.test(item.role)) {
      const ax = Number.isFinite(item.alignX) ? item.alignX : 0.5;
      const ay = Number.isFinite(item.alignY) ? item.alignY : 0.5;
      const ellipse = item.borderRadius >= Math.min(item.width, item.height) / 2 - 1
        || (componentId === "quote" && variant === "portrait")
        || componentId === "team-grid";
      const content = {
        url: "",
        fit: "cover",
        binding: item.role,
        alignX: Math.max(0, Math.min(1, ax)),
        alignY: Math.max(0, Math.min(1, ay)),
      };
      if (ellipse) content.clip = { kind: "ellipse" };
      elements.push({
        id: prefix + item.role,
        type: ellipse ? "maskedImage" : "image",
        x: round(item.x),
        y: round(item.y),
        width: round(item.width),
        height: round(item.height),
        zIndex: nextZ(item, autoZ++),
        imageContent: ellipse ? undefined : content,
        maskedImageContent: ellipse ? content : undefined,
      });
      return;
    }
    if (/^(title|body|kicker|bullet|stat|label|item|statement|quote|attribution|number|step-title|step-body|name|role)(-\d+)?$/.test(item.role)
      || item.role === "title" || item.role === "body" || item.role === "kicker" || item.role === "statement"
      || item.role === "quote" || item.role === "attribution" || item.role === "number") {
      const fontSize = round(item.fontSize);
      const lineHeight = round(item.lineHeight);
      const lines = item.lines;
      const height = round(lines * lineHeight * fontSize * HEIGHT_SLACK);
      const family = (item.role === "title" || item.role === "statement" || item.role === "number" || item.role === "quote"
        || /^stat/.test(item.role) || /^step-title/.test(item.role) || /^name-/.test(item.role))
        ? "{font.display}" : "{font.text}";
      const colorHex = rgbToHex(item.color);
      let color = colorHex ? nearestColorToken(colorHex, palette) : "{color.ink}";
      // Accent-block text must track onAccent across dark/light buckets (compile measures on light).
      if (componentId === "divider" && variant === "accent-block") color = "{color.onAccent}";
      const width = round((item.width || 0) * (WIDTH_SLACK > 1 ? WIDTH_SLACK : 1));
      const capacityChars = item.maxChars != null ? item.maxChars : (maxMap[item.role] || String(item.text || "").length);
      const charsPerLine = Math.max(1, Math.floor(capacityChars / Math.max(1, lines)));
      const el = {
        id: prefix + item.role,
        type: "text",
        x: round(item.x),
        y: round(item.y),
        width,
        height,
        zIndex: nextZ(item, autoZ++),
        textStyle: {
          fontFamily: family,
          fontSize,
          fontWeight: item.fontWeight,
          color,
          textAlign: item.textAlign === "start" ? "left" : item.textAlign,
          lineHeight,
          letterSpacing: round(item.letterSpacing),
        },
        // Capacity text used only for measure; emitted span is empty until runtime copy.
        textContent: {
          spans: [{ text: "", fontFamily: family, fontSize, fontWeight: item.fontWeight, color }],
        },
        slot: {
          dataRole: item.role,
          maxChars: capacityChars,
          charsPerLine,
          capacityLines: lines,
        },
        textMeasure: {
          lines,
          fontPair: fontPairId,
          capacityChars,
          charsPerLine,
          width: round(item.textWidth || 0),
          canvasWidth: round(item.canvasWidth || 0),
          layoutWidth: round(item.layoutWidth || item.width || 0),
          fontCheck: item.fontCheck,
          computedFamily: item.computedFamily || "",
        },
      };
      if (item.stackId) el.stackId = item.stackId;
      elements.push(el);
    }
  });
  return elements;
}

function toStacks(rawStacks, componentId) {
  const prefix = "composer-" + (componentId || "cover") + "-";
  return (rawStacks || []).map((stack) => {
    const blockIds = {};
    (stack.blocks || []).forEach((b) => { blockIds[b.id] = true; });
    return {
      id: stack.id,
      order: (stack.order || []).map((token) => (blockIds[token] ? token : prefix + token)),
      blocks: (stack.blocks || []).map((b) => ({
        id: b.id,
        x: round(b.x),
        y: round(b.y),
        width: round(b.width),
        height: round(b.height),
      })),
      gap: round(Number(stack.gap) || 28),
      align: stack.align || "start",
      direction: stack.direction === "row" ? "row" : "column",
      box: {
        x: round(stack.box && stack.box.x),
        y: round(stack.box && stack.box.y),
        width: round(stack.box && stack.box.width),
        height: round(stack.box && stack.box.height),
      },
    };
  });
}

const COMPONENT_SPECS = [
  {
    id: "cover",
    file: "cover.html",
    cover: true,
    roles: ["Cover"],
    variants: ["word", "split", "full-bleed"],
    slots: [
      { dataRole: "title", maxChars: 40 },
      { dataRole: "body", maxChars: 160 },
      { dataRole: "kicker", maxChars: 24, optional: true },
    ],
    photoSlots: [{ dataRole: "photo", fit: "cover", optional: true, variants: ["split", "full-bleed"] }],
  },
  {
    id: "agenda",
    file: "agenda.html",
    cover: false,
    roles: ["Contents"],
    variants: ["numbered-list", "two-column"],
    slots: [
      { dataRole: "title", maxChars: 40 },
      { dataRole: "item", maxChars: 36, repeat: 6, optionalFrom: 5 },
    ],
    photoSlots: [],
  },
  {
    id: "split-copy",
    file: "split-copy.html",
    cover: false,
    roles: ["About", "Problem", "Solution"],
    variants: ["photo-left", "photo-right", "title-bottom-left", "photo-wide", "copy-over-band"],
    slots: [
      { dataRole: "title", maxChars: 48 },
      { dataRole: "body", maxChars: 160 },
      { dataRole: "bullet", maxChars: 80, repeat: 3 },
    ],
    photoSlots: [{ dataRole: "photo", fit: "cover" }],
  },
  {
    id: "statement",
    file: "statement.html",
    cover: false,
    roles: ["About", "Problem", "Solution", "Proof", "Market", "Model", "People", "Next", "Contents"],
    variants: ["left", "centered", "with-kicker"],
    slots: [
      { dataRole: "statement", maxChars: 90 },
      { dataRole: "kicker", maxChars: 24, optional: true },
    ],
    photoSlots: [],
  },
  {
    id: "big-number",
    file: "big-number.html",
    cover: false,
    roles: ["Proof", "Market"],
    variants: ["left", "centered", "with-photo"],
    slots: [
      { dataRole: "number", maxChars: 8 },
      { dataRole: "label", maxChars: 40 },
      { dataRole: "body", maxChars: 100 },
    ],
    photoSlots: [{ dataRole: "photo", fit: "cover", optional: true, variants: ["with-photo"] }],
  },
  {
    id: "quote",
    file: "quote.html",
    cover: false,
    roles: ["Proof", "About"],
    variants: ["plain", "portrait"],
    slots: [
      { dataRole: "quote", maxChars: 140 },
      { dataRole: "attribution", maxChars: 40 },
    ],
    photoSlots: [{ dataRole: "photo", fit: "cover", optional: true, variants: ["portrait"], clip: "ellipse" }],
  },
  {
    id: "process",
    file: "process.html",
    cover: false,
    roles: ["Model", "Next"],
    variants: ["three-step", "four-step"],
    slots: [
      { dataRole: "title", maxChars: 40 },
      { dataRole: "step-title", maxChars: 24, repeat: 4 },
      { dataRole: "step-body", maxChars: 60, repeat: 4 },
    ],
    photoSlots: [],
  },
  {
    id: "team-grid",
    file: "team-grid.html",
    cover: false,
    roles: ["People"],
    variants: ["three", "four"],
    slots: [
      { dataRole: "title", maxChars: 40 },
      { dataRole: "name", maxChars: 24, repeat: 4 },
      { dataRole: "role", maxChars: 28, repeat: 4 },
    ],
    photoSlots: [
      { dataRole: "photo-1", fit: "cover", optional: true, clip: "ellipse" },
      { dataRole: "photo-2", fit: "cover", optional: true, clip: "ellipse" },
      { dataRole: "photo-3", fit: "cover", optional: true, clip: "ellipse" },
      { dataRole: "photo-4", fit: "cover", optional: true, clip: "ellipse" },
    ],
  },
  {
    id: "stat-row",
    file: "stat-row.html",
    cover: false,
    roles: ["Proof", "Market"],
    variants: ["three-up", "two-up"],
    slots: [
      { dataRole: "title", maxChars: 48 },
      { dataRole: "stat", maxChars: 6, repeat: 3 },
      { dataRole: "label", maxChars: 28, repeat: 3 },
      { dataRole: "body", maxChars: 120 },
    ],
    photoSlots: [],
  },
  {
    id: "divider",
    file: "divider.html",
    cover: false,
    roles: ["About", "Problem", "Solution", "Proof", "Market", "Model", "People", "Next", "Contents"],
    variants: ["number", "accent-block"],
    slots: [
      { dataRole: "title", maxChars: 40 },
      { dataRole: "kicker", maxChars: 24 },
    ],
    photoSlots: [],
  },
  {
    id: "close",
    file: "close.html",
    cover: false,
    roles: ["Close"],
    variants: ["plain", "photo"],
    slots: [
      { dataRole: "title", maxChars: 40 },
      { dataRole: "body", maxChars: 80 },
      { dataRole: "kicker", maxChars: 24, optional: true },
    ],
    photoSlots: [{ dataRole: "photo", fit: "cover", optional: true, variants: ["photo"] }],
  },
];

function writeManifest(fontPairIds, typeScale) {
  const scale = Array.isArray(typeScale) ? typeScale.slice().sort((a, b) => a - b) : [];
  const unique = [];
  scale.forEach((n) => {
    if (unique.indexOf(n) < 0) unique.push(n);
  });
  const manifest = {
    version: 1,
    components: COMPONENT_SPECS.map((spec) => ({
      id: spec.id,
      cover: spec.cover,
      roles: spec.roles.slice(),
      variants: spec.variants.slice(),
      slots: spec.slots.slice(),
      photoSlots: (spec.photoSlots || []).slice(),
    })),
    roles: ["Cover", "Contents", "About", "Problem", "Solution", "Proof", "Market", "Model", "People", "Next", "Close"],
    fontPairs: fontPairIds,
    paletteBuckets: ["light-neutral", "light-warm", "dark-neutral"],
    densities: ["airy", "dense", "balanced"],
    coverPatterns: ["oversized", "fullBleed", "split"],
    signatures: ["frame", "rail"],
    typeScale: unique,
  };
  fs.writeFileSync(path.join(DESIGN, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  return manifest;
}

async function compileAll(options) {
  const only = options && options.only;
  const puppeteerPath = require.resolve("puppeteer/package.json");
  const puppeteerPkg = JSON.parse(fs.readFileSync(puppeteerPath, "utf8"));
  console.log("puppeteer version " + puppeteerPkg.version);
  console.log("slacks", JSON.stringify({ HEIGHT_SLACK, WIDTH_SLACK }));

  const puppeteer = require("puppeteer");
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(BUILD_DIR, { recursive: true });

  const fontPairIds = Object.keys(FONT_PAIRS);
  const specs = COMPONENT_SPECS.filter((spec) => !only || spec.id === only || only === "all");

  console.log("launching Chromium…");
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--font-render-hinting=none"],
    });
  } catch (error) {
    console.error("Chromium launch/download failed: " + (error && error.message ? error.message : error));
    process.exit(2);
  }

  const evidence = [];
  const typeSizes = [];
  let wrote = 0;
  try {
    for (let s = 0; s < specs.length; s += 1) {
      const spec = specs[s];
      const htmlPath = path.join(DESIGN, "components", spec.file);
      for (let v = 0; v < spec.variants.length; v += 1) {
        const variant = spec.variants[v];
        for (let f = 0; f < fontPairIds.length; f += 1) {
          const fontPairId = fontPairIds[f];
          console.log("measure " + spec.id + "/" + variant + "/" + fontPairId);
          const { measured, stacks: rawStacks, pair } = await measureVariant(browser, htmlPath, variant, fontPairId, spec.id, spec);
          const elements = toElements(measured, fontPairId, variant, spec.id, ANCHORS["light-neutral"], spec);
          const stacks = toStacks(rawStacks, spec.id);
          elements.forEach((el) => {
            if (el.type === "text" && el.textStyle && Number.isFinite(el.textStyle.fontSize)) {
              typeSizes.push(round(el.textStyle.fontSize));
            }
          });
          const json = {
            id: spec.id + "-" + variant + "-" + fontPairId,
            name: spec.id + " " + variant + " (" + fontPairId + ")",
            role: spec.roles[0],
            tokens: {
              color: Object.assign({}, ANCHORS["light-neutral"]),
              font: { display: pair.display, text: pair.text },
              type: { h1: 120, body: 28 },
            },
            layout: {
              version: 2,
              id: spec.id + "-" + variant + "-" + fontPairId,
              canvas: { width: 1600, height: 900, aspectRatio: "16:9" },
              elements,
              stacks,
            },
          };
          const outFile = path.join(OUT_DIR, spec.id + "-" + variant + "-" + fontPairId + ".json");
          fs.writeFileSync(outFile, JSON.stringify(json, null, 2) + "\n");
          wrote += 1;
          console.log("wrote " + path.relative(ROOT, outFile));

          if (spec.id === "cover" && variant === "word") {
            const title = elements.find((el) => el.id === "composer-cover-title");
            const body = elements.find((el) => el.id === "composer-cover-body");
            evidence.push({
              fontPair: fontPairId,
              titleWidth: title && title.textMeasure && title.textMeasure.width,
              titleCanvasWidth: title && title.textMeasure && title.textMeasure.canvasWidth,
              titleFontCheck: title && title.textMeasure && title.textMeasure.fontCheck,
              titleComputed: title && title.textMeasure && title.textMeasure.computedFamily,
              titleZ: title && title.zIndex,
              bodyWidth: body && body.textMeasure && body.textMeasure.width,
              bodyCanvasWidth: body && body.textMeasure && body.textMeasure.canvasWidth,
              bodyComputed: body && body.textMeasure && body.textMeasure.computedFamily,
              photoZ: (elements.find((el) => el.id === "composer-cover-photo") || {}).zIndex,
            });
          }
        }
      }
    }
  } finally {
    await browser.close();
  }

  const manifest = writeManifest(fontPairIds, typeSizes);
  fs.writeFileSync(path.join(BUILD_DIR, "cover-word-font-evidence.json"), JSON.stringify(evidence, null, 2) + "\n");
  console.log("compileKit done files=" + wrote + " typeScale=" + JSON.stringify(manifest.typeScale));
  return { wrote, evidence, manifest };
}

async function main() {
  const onlyArg = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : "all";
  const result = await compileAll({ only: onlyArg });
  console.log(JSON.stringify({ wrote: result.wrote, evidence: result.evidence }, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  });
}

module.exports = {
  FONT_PAIRS,
  VARIANTS,
  ANCHORS,
  COMPONENT_SPECS,
  setSlacks,
  getSlacks: () => ({ HEIGHT_SLACK, WIDTH_SLACK }),
  capacityText,
  slotMaxMap,
  measureVariant,
  toElements,
  writeManifest,
  compileAll,
  OUT_DIR,
  DESIGN,
  BUILD_DIR,
  ROOT,
};
