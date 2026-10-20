/**
 * Converts one .pptx into a schemaVersion 2 deck.
 * Pictures are written under generated-templates/photos/<deck-id>/.
 * Anything the deck schema cannot carry is appended to conversion_warnings.log.
 *
 *   node services/templatePipeline/convert/pptxToDeck.js <input.pptx> <deck-id>
 */

const fs = require("fs");
const path = require("path");
const { readZip } = require("../audit/zip");
const { parseXml, child, children, path: at, descendants, textOf } = require("../audit/xml");
const { CANVAS, illustration, maskedImage, rotated, image } = require("../deckSchema");

const ROOT = path.join(__dirname, "..", "..", "..");
const W = CANVAS.width;
const H = CANVAS.height;

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function warn(log, category, message) {
  log.push("[" + category + "] " + message);
}

function decodeHex(value) {
  const raw = String(value || "").replace("#", "");
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return "#" + raw.toUpperCase();
  return null;
}

function rgb(hex) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function hexOf(channels) {
  return "#" + channels.map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0")).join("").toUpperCase();
}

function mix(hex, toward, amount) {
  const a = rgb(hex);
  const b = rgb(toward);
  return hexOf(a.map((c, i) => c + (b[i] - c) * amount));
}

function lum(hex) {
  const channels = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a, b) {
  const hi = Math.max(lum(a), lum(b));
  const lo = Math.min(lum(a), lum(b));
  return (hi + 0.05) / (lo + 0.05);
}

function applyColorMods(hex, node) {
  let out = hex;
  const shade = child(node, "a:shade");
  const tint = child(node, "a:tint");
  const lumMod = child(node, "a:lumMod");
  const lumOff = child(node, "a:lumOff");
  if (shade) out = mix(out, "#000000", 1 - num(shade.attrs.val, 100000) / 100000);
  if (tint) out = mix(out, "#FFFFFF", num(tint.attrs.val, 0) / 100000);
  if (lumMod || lumOff) {
    const factor = (lumMod ? num(lumMod.attrs.val, 100000) / 100000 : 1);
    const offset = lumOff ? num(lumOff.attrs.val, 0) / 100000 : 0;
    out = hexOf(rgb(out).map((c) => (c / 255 * factor + offset) * 255));
  }
  return out;
}

function colorNode(node) {
  return node && node.children.find((item) => /^a:(srgbClr|schemeClr|sysClr|prstClr)$/.test(item.name));
}

function alphaOf(node) {
  const alpha = node && child(node, "a:alpha");
  if (!alpha) return 1;
  return num(alpha.attrs.val, 100000) / 100000;
}

function resolveColor(node, scheme, log, where) {
  if (!node) return null;
  const c = node.children.find((item) => /^a:(srgbClr|schemeClr|sysClr|prstClr)$/.test(item.name));
  if (!c) return null;
  let hex = null;
  if (c.name === "a:srgbClr") hex = decodeHex(c.attrs.val);
  else if (c.name === "a:sysClr") hex = decodeHex(c.attrs.lastClr);
  else if (c.name === "a:schemeClr") {
    const key = c.attrs.val;
    hex = scheme[key] ? decodeHex(scheme[key]) : null;
    if (!hex) warn(log, "unresolved-color", where + " scheme color " + key);
  } else if (c.name === "a:prstClr") {
    warn(log, "unresolved-color", where + " preset color " + c.attrs.val);
  }
  if (!hex) return null;
  return applyColorMods(hex, c);
}

function solidFill(container, scheme, log, where) {
  const fill = container && container.children.find((item) => item.name === "a:solidFill" || item.name === "a:gradFill" || item.name === "a:noFill" || item.name === "a:blipFill" || item.name === "a:pattFill");
  if (!fill || fill.name === "a:noFill") return { type: "none" };
  if (fill.name === "a:blipFill") return { type: "image", node: fill };
  if (fill.name === "a:pattFill") {
    warn(log, "pattern", where + " pattern fill skipped");
    return { type: "none" };
  }
  if (fill.name === "a:gradFill") {
    const stops = descendants(fill, "a:gs").map((gs) => {
      const hex = resolveColor(gs, scheme, log, where);
      if (!hex) return null;
      return { pos: round(num(gs.attrs.pos, 0) / 100000), hex, alpha: round(alphaOf(colorNode(gs))) };
    }).filter(Boolean);
    const lin = child(fill, "a:lin");
    const angle = lin ? round(num(lin.attrs.ang, 0) / 60000) : 90;
    const mid = stops.length ? stops[Math.floor((stops.length - 1) / 2)].hex : "#888888";
    warn(log, stops.length > 2 ? "gradFill" : "gradient", where + " gradient (" + stops.length + " stops) flattened to " + mid);
    return { type: "solid", hex: mid, alpha: 1, gradient: stops.length ? { angle, stops } : null };
  }
  const hex = resolveColor(fill, scheme, log, where);
  return { type: "solid", hex, alpha: hex ? round(alphaOf(colorNode(fill))) : 1 };
}

function shapePaint(fill, stroke) {
  const hasStroke = !!(stroke && stroke.color);
  let paint = (fill && fill.hex) || "none";
  let gradient = null;
  if (fill && fill.gradient && fill.gradient.stops.length) {
    const alphas = fill.gradient.stops.map((stop) => stop.alpha);
    const maxA = Math.max.apply(null, alphas);
    const minA = Math.min.apply(null, alphas);
    if (maxA < 0.25) paint = "none";
    else if (minA < 0.2 && maxA > 0.5) {
      gradient = fill.gradient;
      paint = fill.gradient.stops[fill.gradient.stops.length - 1].hex || paint;
    }
  } else if (fill && fill.hex && fill.alpha < 0.25 && hasStroke) {
    paint = "none";
  }
  return {
    fill: paint,
    gradient,
    strokeOpacity: stroke && stroke.alpha < 0.999 ? round(stroke.alpha) : null,
  };
}

function strokeOf(spPr, scheme, log, where, pxPerEmu) {
  const ln = spPr && child(spPr, "a:ln");
  if (!ln || child(ln, "a:noFill")) return null;
  const fill = ln.children.find((item) => item.name === "a:solidFill" || item.name === "a:gradFill");
  if (!fill) return null;
  const painted = solidFill(ln, scheme, log, where + " stroke");
  if (!painted.hex) return null;
  return { color: painted.hex, width: round(num(ln.attrs.w, 9525) * pxPerEmu) || 1, alpha: painted.alpha == null ? 1 : painted.alpha };
}

function relsFor(zip, part) {
  const pieces = part.split("/");
  const file = pieces.pop();
  const xml = zip.text([...pieces, "_rels", file + ".rels"].join("/"));
  const rels = {};
  if (!xml) return rels;
  for (const rel of descendants(parseXml(xml), "Relationship")) {
    const target = rel.attrs.Target || "";
    if (rel.attrs.TargetMode === "External") {
      rels[rel.attrs.Id] = { type: (rel.attrs.Type || "").split("/").pop(), target: null, external: target };
      continue;
    }
    const base = part.split("/").slice(0, -1);
    for (const bit of target.split("/")) {
      if (bit === "..") base.pop();
      else if (bit && bit !== ".") base.push(bit);
    }
    rels[rel.attrs.Id] = { type: (rel.attrs.Type || "").split("/").pop(), target: base.join("/") };
  }
  return rels;
}

function relOfType(rels, type) {
  const found = Object.values(rels).find((rel) => rel.type === type);
  return found ? found.target : null;
}

function rootTag(tree) {
  return tree.children.find((node) => node.name && node.name.startsWith("p:"));
}

function loadPart(zip, part, cache) {
  if (!part) return null;
  if (cache.has(part)) return cache.get(part);
  const xml = zip.text(part);
  const value = xml ? { part, tree: parseXml(xml), rels: relsFor(zip, part) } : null;
  cache.set(part, value);
  return value;
}

function schemeOf(zip, master, cache) {
  const scheme = {};
  const fonts = { major: "Fraunces", minor: "Source Sans 3" };
  if (!master) return { scheme, fonts };
  const themePart = relOfType(master.rels, "theme");
  const theme = loadPart(zip, themePart, cache);
  const clr = theme && descendants(theme.tree, "a:clrScheme")[0];
  if (clr) {
    for (const node of clr.children) {
      if (!node.name) continue;
      const hex = resolveColor(node, {}, [], "");
      if (hex) scheme[node.name.replace(/^a:/, "")] = hex;
    }
  }
  const map = descendants(master.tree, "p:clrMap")[0];
  const aliases = map ? map.attrs : { bg1: "lt1", tx1: "dk1", bg2: "lt2", tx2: "dk2" };
  for (const [alias, target] of Object.entries(aliases)) {
    if (scheme[target]) scheme[alias] = scheme[target];
  }
  const major = theme && at(descendants(theme.tree, "a:majorFont")[0], "a:latin");
  const minor = theme && at(descendants(theme.tree, "a:minorFont")[0], "a:latin");
  if (major && major.attrs.typeface) fonts.major = major.attrs.typeface;
  if (minor && minor.attrs.typeface) fonts.minor = minor.attrs.typeface;
  return { scheme, fonts };
}

function fontName(typeface, fonts) {
  if (!typeface) return fonts.minor;
  if (typeface === "+mj-lt") return fonts.major;
  if (typeface === "+mn-lt") return fonts.minor;
  return typeface;
}

function compose(parent, xfrm) {
  const off = child(xfrm, "a:off");
  const ext = child(xfrm, "a:ext");
  const chOff = child(xfrm, "a:chOff");
  const chExt = child(xfrm, "a:chExt");
  const ox = num(off && off.attrs.x);
  const oy = num(off && off.attrs.y);
  const ex = num(ext && ext.attrs.cx, 1);
  const ey = num(ext && ext.attrs.cy, 1);
  const cox = num(chOff && chOff.attrs.x);
  const coy = num(chOff && chOff.attrs.y);
  const cex = num(chExt && chExt.attrs.cx, ex) || ex;
  const cey = num(chExt && chExt.attrs.cy, ey) || ey;
  const sx = cex ? ex / cex : 1;
  const sy = cey ? ey / cey : 1;
  return {
    ax: parent.ax * sx,
    bx: parent.ax * (ox - cox * sx) + parent.bx,
    ay: parent.ay * sy,
    by: parent.ay * (oy - coy * sy) + parent.by,
    rot: parent.rot + num(xfrm.attrs.rot) / 60000,
  };
}

function placed(xfrm, parent, ctx) {
  const off = child(xfrm, "a:off");
  const ext = child(xfrm, "a:ext");
  if (!off || !ext) return null;
  const ex = num(ext.attrs.cx);
  const ey = num(ext.attrs.cy);
  return {
    x: (parent.ax * num(off.attrs.x) + parent.bx) * ctx.sx,
    y: (parent.ay * num(off.attrs.y) + parent.by) * ctx.sy,
    w: Math.abs(parent.ax * ex * ctx.sx),
    h: Math.abs(parent.ay * ey * ctx.sy),
    rot: num(xfrm.attrs.rot) / 60000 + parent.rot,
    flipH: xfrm.attrs.flipH === "1",
    flipV: xfrm.attrs.flipV === "1",
  };
}

function fitBox(box, mayHang) {
  const x = box.x;
  const y = box.y;
  const w = box.w;
  const h = box.h;
  if (!(w > 0) || !(h > 0)) return null;
  const overflowX = Math.max(0, -x, x + w - W);
  const overflowY = Math.max(0, -y, y + h - H);
  const visibleW = Math.min(x + w, W) - Math.max(x, 0);
  const visibleH = Math.min(y + h, H) - Math.max(y, 0);
  const onCanvas = x >= -0.5 && y >= -0.5 && x + w <= W + 1 && y + h <= H + 1;
  if (onCanvas) return { x: round(Math.max(0, x)), y: round(Math.max(0, y)), w: round(w), h: round(h), clamped: false };
  if (mayHang && overflowX <= W * 0.2 + 1 && overflowY <= H * 0.2 + 1 && visibleW > 1 && visibleH > 1) {
    return { x: round(x), y: round(y), w: round(w), h: round(h), clamped: false };
  }
  if (visibleW < 1 || visibleH < 1) return null;
  return {
    x: round(Math.max(0, x)),
    y: round(Math.max(0, y)),
    w: round(visibleW),
    h: round(visibleH),
    clamped: true,
  };
}

function pathFromGeom(cust) {
  const parts = [];
  let vw = 0;
  let vh = 0;
  let x = 0;
  let y = 0;
  for (const pathNode of descendants(cust, "a:path")) {
    vw = num(pathNode.attrs.w) || vw;
    vh = num(pathNode.attrs.h) || vh;
    for (const cmd of pathNode.children) {
      const pts = children(cmd, "a:pt").map((pt) => [num(pt.attrs.x), num(pt.attrs.y)]);
      if (cmd.name === "a:moveTo" && pts[0]) {
        x = pts[0][0];
        y = pts[0][1];
        parts.push("M " + x + " " + y);
      } else if (cmd.name === "a:lnTo" && pts[0]) {
        x = pts[0][0];
        y = pts[0][1];
        parts.push("L " + x + " " + y);
      } else if (cmd.name === "a:cubicBezTo" && pts.length >= 3) {
        parts.push("C " + pts.map((pt) => pt[0] + " " + pt[1]).join(" "));
        x = pts[2][0];
        y = pts[2][1];
      } else if (cmd.name === "a:quadBezTo" && pts.length >= 2) {
        parts.push("Q " + pts[0][0] + " " + pts[0][1] + " " + pts[1][0] + " " + pts[1][1]);
        x = pts[1][0];
        y = pts[1][1];
      } else if (cmd.name === "a:arcTo") {
        const wR = num(cmd.attrs.wR);
        const hR = num(cmd.attrs.hR);
        const st = num(cmd.attrs.stAng) / 60000 * Math.PI / 180;
        const sw = num(cmd.attrs.swAng) / 60000 * Math.PI / 180;
        const cx = x - Math.cos(st) * wR;
        const cy = y - Math.sin(st) * hR;
        const end = st + sw;
        const ex = cx + Math.cos(end) * wR;
        const ey = cy + Math.sin(end) * hR;
        const large = Math.abs(sw) > Math.PI ? 1 : 0;
        const sweep = sw >= 0 ? 1 : 0;
        parts.push("A " + wR + " " + hR + " 0 " + large + " " + sweep + " " + round(ex) + " " + round(ey));
        x = ex;
        y = ey;
      } else if (cmd.name === "a:close") {
        parts.push("Z");
      }
    }
  }
  return { d: parts.join(" "), viewBox: "0 0 " + (vw || 100) + " " + (vh || 100) };
}

function archPath() {
  return "M 0 100 L 0 38 Q 50 0 100 38 L 100 100 Z";
}

function ellipsePath() {
  return "M 50 0 A 50 50 0 1 1 49.9 0 Z";
}

function noteEffects(spPr, log, where) {
  const effects = spPr && child(spPr, "a:effectLst");
  if (effects && (child(effects, "a:outerShdw") || child(effects, "a:innerShdw") || child(effects, "a:glow") || child(effects, "a:softEdge") || child(effects, "a:reflection"))) {
    warn(log, "effect", where + " shadow, glow, or soft edge skipped");
  }
  if (spPr && (child(spPr, "a:scene3d") || child(spPr, "a:sp3d"))) {
    warn(log, "effect", where + " 3D skipped");
  }
}

function paragraphs(txBody, scheme, fonts, log, where, pxPerPt) {
  const bodyPr = child(txBody, "a:bodyPr");
  if (bodyPr && bodyPr.attrs.vert && bodyPr.attrs.vert !== "horz") {
    warn(log, "vertical-text", where + " vertical text kept horizontal");
  }
  const out = [];
  for (const paragraph of children(txBody, "a:p")) {
    const pPr = child(paragraph, "a:pPr");
    const align = (pPr && pPr.attrs.algn) || "l";
    if (align === "just" || align === "dist") warn(log, "alignment", where + " alignment " + align + " stored as left");
    const lnSpc = pPr && child(pPr, "a:lnSpc");
    const pct = lnSpc && child(lnSpc, "a:spcPct");
    const lineHeight = pct ? num(pct.attrs.val, 100000) / 100000 : 1.15;
    const spans = [];
    for (const node of paragraph.children) {
      if (node.name === "a:br") {
        spans.push({ text: "\n" });
        continue;
      }
      if (node.name !== "a:r" && node.name !== "a:fld") continue;
      const value = textOf(child(node, "a:t"));
      if (!value) continue;
      const rPr = child(node, "a:rPr") || (pPr && child(pPr, "a:defRPr"));
      const latin = rPr && child(rPr, "a:latin");
      const fill = rPr && child(rPr, "a:solidFill");
      const bold = rPr && (rPr.attrs.b === "1" || rPr.attrs.b === "true");
      const spacing = rPr && rPr.attrs.spc != null && rPr.attrs.spc !== ""
        ? round((num(rPr.attrs.spc, 0) / 100) * pxPerPt)
        : 0;
      spans.push({
        text: value,
        fontFamily: fontName(latin && latin.attrs.typeface, fonts),
        fontSize: round((num(rPr && rPr.attrs.sz, 1800) / 100) * pxPerPt),
        fontWeight: bold ? 650 : 400,
        color: (fill && resolveColor(fill, scheme, log, where)) || "#1C1916",
        letterSpacing: spacing,
      });
    }
    const visible = spans.filter((span) => span.text && span.text !== "\n");
    if (!visible.length) continue;
    const textAlign = align === "ctr" ? "center" : align === "r" ? "right" : "left";
    out.push({ spans, textAlign, lineHeight: lineHeight || 1.15 });
  }
  return out;
}

function mediaTarget(blipFill, rels) {
  const blip = blipFill && child(blipFill, "a:blip");
  if (!blip) return null;
  const id = blip.attrs["r:embed"] || blip.attrs["r:link"];
  return id && rels[id] ? rels[id] : null;
}

function pictureAlign(blipFill, log, where) {
  if (!blipFill) {
    warn(log, "alignment", where + " picture has no blipFill; alignX and alignY were not set");
    return {};
  }
  const src = child(blipFill, "a:srcRect");
  const fill = child(child(blipFill, "a:stretch"), "a:fillRect");
  const srcUsed = src && ["l", "t", "r", "b"].some((key) => num(src.attrs[key], 0) !== 0);
  const rect = srcUsed ? src : fill;
  if (!rect) {
    warn(log, "alignment", where + " picture has no srcRect or stretch fillRect; alignX and alignY were not set");
    return {};
  }
  const raw = (key) => num(rect.attrs[key], 0);
  let left = raw("l");
  let top = raw("t");
  let right = raw("r");
  let bottom = raw("b");
  if (!srcUsed) {
    left = Math.max(0, -left);
    top = Math.max(0, -top);
    right = Math.max(0, -right);
    bottom = Math.max(0, -bottom);
  }
  const ratio = (start, end) => (start + end) === 0 ? 0.5 : start / (start + end);
  return {
    alignX: Math.round(ratio(left, right) * 10000) / 10000,
    alignY: Math.round(ratio(top, bottom) * 10000) / 10000,
  };
}

function convertPptx(inputPath, deckId) {
  const safeId = String(deckId || "deck").replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "") || "deck";
  const buffer = fs.readFileSync(inputPath);
  const zip = readZip(buffer);
  const presPart = "ppt/presentation.xml";
  const presXml = zip.text(presPart);
  if (!presXml) throw new Error("ppt/presentation.xml is missing");
  const presRoot = rootTag(parseXml(presXml));
  const size = child(presRoot, "p:sldSz");
  const cx = num(size && size.attrs.cx, 12192000);
  const cy = num(size && size.attrs.cy, 6858000);
  const ctxScale = { sx: W / cx, sy: H / cy, pxPerPt: W / (cx / 12700), pxPerEmu: W / cx };
  const presRels = relsFor(zip, presPart);
  const order = children(child(presRoot, "p:sldIdLst"), "p:sldId")
    .map((node) => presRels[node.attrs["r:id"]])
    .filter(Boolean)
    .map((rel) => rel.target);
  const cache = new Map();
  const log = [];
  const photoDir = path.join(ROOT, "generated-templates", "photos", safeId);
  fs.mkdirSync(photoDir, { recursive: true });
  let imageCount = 0;
  let imageBytes = 0;
  const mapped = { text: 0, image: 0, shape: 0, maskedImage: 0, illustration: 0, rotated: 0 };
  const perSlide = [];
  let bgHex = "#F6F3EE";
  let notedMaster = false;

  function saveImage(target, slideNumber) {
    const data = target && zip.read(target);
    if (!data) {
      warn(log, "image", "slide " + slideNumber + " missing media " + (target || ""));
      return null;
    }
    const ext = (path.extname(target).replace(".", "") || "bin").toLowerCase();
    if (["mp4", "mov", "wmv", "avi", "mp3", "wav", "m4a"].includes(ext)) {
      warn(log, "video", "slide " + slideNumber + " embedded " + ext + " skipped");
      return null;
    }
    imageCount += 1;
    const name = "slide-" + slideNumber + "-img-" + imageCount + "." + ext;
    fs.writeFileSync(path.join(photoDir, name), data);
    imageBytes += data.length;
    return "photos/" + safeId + "/" + name;
  }

  function pushElement(list, element, degrees, where) {
    const turns = ((degrees % 360) + 360) % 360;
    const delta = turns > 180 ? turns - 360 : turns;
    if (Math.abs(delta) >= 0.5) {
      const wrapped = rotated(element.id + "-rot", element, round(delta));
      list.push(wrapped);
      mapped.rotated += 1;
      mapped[element.type] = (mapped[element.type] || 0) + 1;
      return;
    }
    list.push(element);
    mapped[element.type] = (mapped[element.type] || 0) + 1;
    if (where && element.type === "illustration" && (!element.illustrationContent.d || !element.illustrationContent.d.trim())) {
      warn(log, "illustration", where + " empty path dropped");
      list.pop();
      mapped.illustration -= 1;
    }
  }

  function emitShape(list, id, box, fill, stroke, kind, cornerRadius, degrees, where, gradient) {
    const fitted = fitBox(box, false);
    if (!fitted) {
      warn(log, "clamp", where + " shape is fully outside the slide");
      return;
    }
    if (fitted.clamped) warn(log, "clamp", where + " shape was clipped to the canvas");
    if (box.flipH || box.flipV) warn(log, "flip", where + " flip is not in the schema");
    const element = {
      id,
      type: "shape",
      x: fitted.x,
      y: fitted.y,
      width: fitted.w,
      height: fitted.h,
      zIndex: list.length + 1,
      shapeContent: {
        kind: kind || "rectangle",
        fill: fill || "none",
        cornerRadius: cornerRadius || 0,
      },
    };
    if (gradient) element.shapeContent.gradient = gradient;
    if (stroke) {
      element.shapeContent.stroke = stroke.color;
      element.shapeContent.strokeWidth = stroke.width;
      if (stroke.alpha < 0.999) element.shapeContent.strokeOpacity = round(stroke.alpha);
    }
    pushElement(list, element, degrees, where);
  }

  function emitIllustration(list, id, box, spec, degrees, where) {
    const fitted = fitBox(box, true);
    if (!fitted) {
      warn(log, "clamp", where + " illustration is fully outside the slide");
      return;
    }
    if (fitted.clamped) warn(log, "clamp", where + " illustration was clipped to the canvas");
    const element = illustration(id, fitted.x, fitted.y, fitted.w, fitted.h, {
      d: spec.d,
      viewBox: spec.viewBox,
      fill: spec.fill || "none",
      stroke: spec.stroke || "none",
      strokeWidth: spec.strokeWidth || 0,
      zIndex: list.length + 1,
    });
    if (spec.gradient) element.illustrationContent.gradient = spec.gradient;
    if (spec.strokeOpacity != null) element.illustrationContent.strokeOpacity = spec.strokeOpacity;
    if ((!element.illustrationContent.fill || element.illustrationContent.fill === "none") && (!element.illustrationContent.stroke || element.illustrationContent.stroke === "none")) {
      element.illustrationContent.stroke = "#1C1916";
      element.illustrationContent.strokeWidth = 1;
      warn(log, "illustration", where + " had no paint; a 1px stroke was added so the path stays valid");
    }
    pushElement(list, element, degrees, where);
  }

  function emitPicture(list, id, box, url, geom, cust, cornerRadius, degrees, where, align) {
    if (!url) return;
    const mask = geom === "arch" || geom === "ellipse" || geom === "roundRect" || (geom === "custom" && cust);
    const fitted = fitBox(box, mask);
    if (!fitted) {
      warn(log, "clamp", where + " picture is fully outside the slide");
      return;
    }
    if (fitted.clamped) warn(log, "clamp", where + " picture was clipped to the canvas");
    if (box.flipH || box.flipV) warn(log, "flip", where + " picture flip is not in the schema");
    const crop = align || {};
    if (!mask) {
      pushElement(list, image(id, fitted.x, fitted.y, fitted.w, fitted.h, {
        url,
        fit: "cover",
        alignX: crop.alignX,
        alignY: crop.alignY,
        zIndex: list.length + 1,
      }), degrees, where);
      return;
    }
    let clip = { kind: "rect" };
    if (geom === "arch") clip = { kind: "arch" };
    else if (geom === "ellipse") clip = { kind: "ellipse" };
    else if (geom === "roundRect") {
      clip = { kind: "rect", cornerRadius: cornerRadius || 0 };
      warn(log, "roundRect", where + " rounded image mask is stored; the renderer draws a rectangle");
    } else if (cust) {
      const drawn = pathFromGeom(cust);
      clip = { kind: "path", d: drawn.d, viewBox: drawn.viewBox };
      if (!drawn.d) {
        warn(log, "custGeom", where + " mask path was empty; picture stored as a rectangle");
        clip = { kind: "rect" };
      }
    }
    const element = maskedImage(id, fitted.x, fitted.y, fitted.w, fitted.h, {
      url,
      clip,
      alignX: crop.alignX,
      alignY: crop.alignY,
      zIndex: list.length + 1,
    });
    pushElement(list, element, degrees, where);
  }

  function emitText(list, id, box, blocks, degrees, where) {
    const fitted = fitBox(box, false);
    if (!fitted) {
      warn(log, "clamp", where + " text is fully outside the slide");
      return;
    }
    if (fitted.clamped) warn(log, "clamp", where + " text was clipped to the canvas");
    const slice = fitted.h / blocks.length;
    blocks.forEach((block, index) => {
      const first = block.spans.find((span) => span.text && span.text !== "\n") || block.spans[0];
      const element = {
        id: blocks.length > 1 ? id + "-p" + (index + 1) : id,
        type: "text",
        x: fitted.x,
        y: round(fitted.y + slice * index),
        width: fitted.w,
        height: round(slice),
        zIndex: list.length + 1,
        textStyle: {
          fontFamily: first.fontFamily || "Source Sans 3",
          fontSize: first.fontSize || 18,
          fontWeight: first.fontWeight || 400,
          color: first.color || "#1C1916",
          textAlign: block.textAlign,
          lineHeight: block.lineHeight,
          letterSpacing: first.letterSpacing || 0,
        },
        textContent: { spans: block.spans },
      };
      pushElement(list, element, degrees, where);
    });
  }

  function geometry(spPr) {
    const prst = spPr && child(spPr, "a:prstGeom");
    if (prst) {
      const name = prst.attrs.prst || "rect";
      let radius = 0;
      if (name.indexOf("round") === 0) {
        const gd = descendants(prst, "a:gd").find((item) => item.attrs.name === "adj" || item.attrs.name === "adj1");
        const adj = gd ? num(String(gd.attrs.fmla || "").replace("val ", ""), 16667) : 16667;
        radius = (adj / 100000) * Math.min(num(at(spPr, "a:xfrm", "a:ext") && at(spPr, "a:xfrm", "a:ext").attrs.cx), num(at(spPr, "a:xfrm", "a:ext") && at(spPr, "a:xfrm", "a:ext").attrs.cy));
      }
      return { name, radius, cust: null };
    }
    const cust = spPr && child(spPr, "a:custGeom");
    if (cust) return { name: "custom", radius: 0, cust };
    return { name: "rect", radius: 0, cust: null };
  }

  function placeholderXfrm(ph, layout) {
    if (!ph || !layout) return null;
    const type = ph.attrs.type || "body";
    const idx = ph.attrs.idx;
    for (const sp of descendants(layout.tree, "p:sp")) {
      const marker = at(sp, "p:nvSpPr", "p:nvPr", "p:ph");
      if (!marker) continue;
      const sameIdx = idx !== undefined && marker.attrs.idx === idx;
      const sameType = (marker.attrs.type || "body") === type;
      if (sameIdx || sameType) return at(sp, "p:spPr", "a:xfrm");
    }
    return null;
  }

  function convertNode(node, parent, rels, layout, scheme, fonts, list, slideNumber, source) {
    if (node.name === "mc:AlternateContent") {
      const branch = child(node, "mc:Fallback") || child(node, "mc:Choice");
      if (branch) {
        for (const inner of branch.children) convertNode(inner, parent, rels, layout, scheme, fonts, list, slideNumber, source);
      }
      return;
    }
    if (!["p:sp", "p:pic", "p:grpSp", "p:cxnSp", "p:graphicFrame"].includes(node.name)) return;
    source.count += 1;
    const where = "slide " + slideNumber;
    try {
      if (node.name === "p:grpSp") {
        const xfrm = at(node, "p:grpSpPr", "a:xfrm");
        const next = xfrm ? compose(parent, xfrm) : parent;
        for (const inner of node.children) convertNode(inner, next, rels, layout, scheme, fonts, list, slideNumber, source);
        return;
      }
      if (node.name === "p:graphicFrame") {
        const uri = (at(node, "a:graphic", "a:graphicData") || {}).attrs || {};
        const kind = String(uri.uri || "");
        const category = kind.includes("table") ? "table" : kind.includes("chart") ? "chart" : kind.includes("diagram") ? "smartart" : "graphicFrame";
        warn(log, category, where + " " + category + " skipped");
        return;
      }
      const spPr = child(node, "p:spPr");
      noteEffects(spPr, log, where);
      let xfrm = node.name === "p:graphicFrame" ? child(node, "p:xfrm") : spPr && child(spPr, "a:xfrm");
      const ph = at(node, "p:nvSpPr", "p:nvPr", "p:ph");
      if ((!xfrm || !child(xfrm, "a:off")) && ph) xfrm = placeholderXfrm(ph, layout);
      const box = xfrm && placed(xfrm, parent, ctxScale);
      if (!box) {
        warn(log, "position", where + " " + node.name + " had no position");
        return;
      }
      const id = "s" + slideNumber + "-e" + (list.length + 1);
      const geom = geometry(spPr);
      const stroke = strokeOf(spPr, scheme, log, where, ctxScale.pxPerEmu);
      const degrees = box.rot;
      if (node.name === "p:cxnSp") {
        const simple = !geom.name || geom.name === "line" || geom.name === "straightConnector1";
        if (!simple) {
          warn(log, "connector", where + " connector " + geom.name + " skipped");
          return;
        }
        emitIllustration(list, id, box, {
          d: "M 0 50 L 100 50",
          viewBox: "0 0 100 100",
          fill: "none",
          stroke: (stroke && stroke.color) || "#1C1916",
          strokeWidth: (stroke && stroke.width) || 1,
        }, degrees, where);
        return;
      }
      const blipFill = node.name === "p:pic" ? child(node, "p:blipFill") : spPr && child(spPr, "a:blipFill");
      if (blipFill || node.name === "p:pic") {
        const rel = mediaTarget(blipFill, rels);
        if (rel && rel.external) {
          warn(log, "video", where + " external media skipped");
          return;
        }
        const url = saveImage(rel && rel.target, slideNumber);
        const preset = geom.name === "ellipse" ? "ellipse" : geom.name === "roundRect" ? "roundRect" : geom.name === "arch" ? "arch" : geom.name === "custom" ? "custom" : "rect";
        const radiusPx = geom.radius ? geom.radius * ctxScale.sx : 0;
        const align = pictureAlign(blipFill, log, where);
        emitPicture(list, id, box, url, preset, geom.cust, radiusPx, degrees, where, align);
        const pictureText = child(node, "p:txBody");
        const pictureBlocks = pictureText ? paragraphs(pictureText, scheme, fonts, log, where, ctxScale.pxPerPt) : [];
        if (pictureBlocks.length) emitText(list, id + "-t", box, pictureBlocks, degrees, where);
        return;
      }
      const fill = solidFill(spPr, scheme, log, where);
      const painted = shapePaint(fill, stroke);
      const txBody = child(node, "p:txBody");
      const blocks = txBody ? paragraphs(txBody, scheme, fonts, log, where, ctxScale.pxPerPt) : [];
      const ink = {
        fill: painted.fill,
        stroke: (stroke && stroke.color) || "none",
        strokeWidth: (stroke && stroke.width) || 0,
        gradient: painted.gradient,
        strokeOpacity: painted.strokeOpacity,
      };
      if (geom.name === "custom" && geom.cust) {
        const drawn = pathFromGeom(geom.cust);
        if (drawn.d) {
          emitIllustration(list, id, box, Object.assign({ d: drawn.d, viewBox: drawn.viewBox }, ink), degrees, where);
        } else {
          warn(log, "custGeom", where + " custom geometry had no path");
        }
      } else if (geom.name === "ellipse") {
        emitIllustration(list, id, box, Object.assign({ d: ellipsePath(), viewBox: "0 0 100 100" }, ink), degrees, where);
        warn(log, "ellipse", where + " ellipse stored as an illustration path");
      } else if (geom.name === "arch") {
        emitIllustration(list, id, box, Object.assign({ d: archPath(), viewBox: "0 0 100 100" }, ink), degrees, where);
        warn(log, "arch", where + " arch preset stored as an illustration path");
      } else if (painted.fill !== "none" || stroke || painted.gradient) {
        const radiusPx = geom.radius ? round(geom.radius * ctxScale.sx) : 0;
        emitShape(list, id, box, painted.fill, stroke, "rectangle", radiusPx, degrees, where, painted.gradient);
      }
      if (blocks.length) emitText(list, id + "-t", box, blocks, degrees, where);
    } catch (error) {
      warn(log, "error", where + " " + node.name + " " + (error && error.message ? error.message : error));
    }
  }

  function background(tree, rels, scheme, slideNumber, list) {
    const root = rootTag(tree);
    const bg = root && at(root, "p:cSld", "p:bg");
    if (!bg) return null;
    const bgPr = child(bg, "p:bgPr");
    if (bgPr) {
      const blip = child(bgPr, "a:blipFill");
      if (blip) {
        const rel = mediaTarget(blip, rels);
        const url = saveImage(rel && rel.target, slideNumber);
        if (url) {
          const align = pictureAlign(blip, log, "slide " + slideNumber + " background");
          list.push(image("s" + slideNumber + "-bg", 0, 0, W, H, {
            url,
            fit: "cover",
            zIndex: 0,
            alignX: align.alignX,
            alignY: align.alignY,
          }));
          mapped.image += 1;
          return "image";
        }
        return null;
      }
      const painted = solidFill(bgPr, scheme, log, "slide " + slideNumber + " background");
      if (painted.hex) return painted.hex;
    }
    const ref = child(bg, "p:bgRef");
    if (ref) return resolveColor(ref, scheme, log, "slide " + slideNumber + " background");
    return null;
  }

  const layouts = {};
  const sequence = [];
  const previewSlides = [];
  let fonts = { major: "Fraunces", minor: "Source Sans 3" };
  let scheme = {};

  order.forEach((slidePart, index) => {
    const slideNumber = index + 1;
    const slide = loadPart(zip, slidePart, cache);
    if (!slide) {
      warn(log, "slide", "slide " + slideNumber + " part missing");
      return;
    }
    const layout = loadPart(zip, relOfType(slide.rels, "slideLayout"), cache);
    const master = layout ? loadPart(zip, relOfType(layout.rels, "slideMaster"), cache) : null;
    if (index === 0 && master) {
      const theme = schemeOf(zip, master, cache);
      scheme = theme.scheme;
      fonts = theme.fonts;
    }
    if (!notedMaster) {
      warn(log, "master", "layout and master shapes were not copied; placeholder positions and the background were");
      notedMaster = true;
    }
    const slideRoot = rootTag(slide.tree);
    if (slideRoot && child(slideRoot, "p:transition")) warn(log, "transition", "slide " + slideNumber + " transition skipped");
    if (slideRoot && child(slideRoot, "p:timing")) warn(log, "animation", "slide " + slideNumber + " animation skipped");
    if (Object.values(slide.rels).some((rel) => rel.type === "notesSlide")) warn(log, "notes", "slide " + slideNumber + " notes skipped");
    const elements = [];
    const source = { count: 0 };
    const ownBg = background(slide.tree, slide.rels, scheme, slideNumber, elements);
    const layoutBg = !ownBg && layout ? background(layout.tree, layout.rels, scheme, slideNumber, elements) : null;
    const masterBg = !ownBg && !layoutBg && master ? background(master.tree, master.rels, scheme, slideNumber, elements) : null;
    const solid = [ownBg, layoutBg, masterBg].find((value) => value && value !== "image") || null;
    if (solid && !elements.some((element) => element.id === "s" + slideNumber + "-bg")) {
      elements.unshift({
        id: "s" + slideNumber + "-bg",
        type: "shape",
        x: 0,
        y: 0,
        width: W,
        height: H,
        zIndex: 0,
        shapeContent: { kind: "rectangle", fill: solid },
      });
      mapped.shape += 1;
      if (slideNumber === 1) bgHex = solid;
    }
    const tree = at(slideRoot, "p:cSld", "p:spTree");
    for (const node of (tree && tree.children) || []) {
      convertNode(node, { ax: 1, bx: 0, ay: 1, by: 0, rot: 0 }, slide.rels, layout, scheme, fonts, elements, slideNumber, source);
    }
    const layoutId = "slide-" + slideNumber;
    layouts[layoutId] = {
      version: 2,
      id: layoutId,
      canvas: { width: W, height: H, aspectRatio: "16:9" },
      elements,
    };
    sequence.push(layoutId);
    const sample = elements.find((element) => element.type === "text");
    const title = sample ? (sample.textContent.spans || []).map((span) => span.text || "").join("").replace(/\s+/g, " ").trim().slice(0, 80) : "Slide " + slideNumber;
    previewSlides.push({ id: safeId + "-p" + slideNumber, layout: layoutId, title, bullets: [] });
    perSlide.push({ slide: slideNumber, before: source.count, after: elements.length });
  });

  if (sequence.length < 2) warn(log, "slide", "deck has fewer than 2 slides");
  const ink = contrast("#1C1916", bgHex) >= 4.5 ? "#1C1916" : "#F7F4EF";
  const accentCandidates = ["#1E3A32", "#0E4D6C", "#8C2F2F", "#C4553A", "#E6C35C", "#F4F1EA", "#1C1916"];
  const accent = accentCandidates.find((color) => contrast(color, bgHex) >= 3) || "#1E3A32";
  const deck = {
    schemaVersion: 2,
    id: safeId,
    name: path.basename(inputPath, path.extname(inputPath)).trim(),
    description: "Converted from " + path.basename(inputPath),
    category: "converted",
    visualMode: "hybrid",
    source: path.basename(inputPath),
    taste: { designLanguage: "editorial", cover: "type", density: "balanced", align: "left", groundMode: "flat" },
    tokens: {
      color: {
        bg: bgHex,
        surface: bgHex,
        card: "#FFFFFF",
        ink,
        muted: ink,
        rule: "#D9D0C6",
        accent,
        accent2: accent,
        onAccent: bgHex,
      },
      font: { display: fonts.major, text: fonts.minor },
      type: { h1: 64, body: 22 },
    },
    theme: { backgroundColor: bgHex, fontFamily: fonts.major, titleColor: ink, bodyColor: ink },
    layoutSequence: sequence,
    layouts,
    previewSlides,
  };
  const jsonPath = path.join(ROOT, "app-library", safeId + ".json");
  fs.writeFileSync(jsonPath, JSON.stringify(deck, null, 2) + "\n");
  const logPath = path.join(photoDir, "conversion_warnings.log");
  const header = [
    "deck " + safeId,
    "slides " + sequence.length,
    "images " + imageCount,
    "imageBytes " + imageBytes,
    "mapped " + JSON.stringify(mapped),
    "perSlide " + JSON.stringify(perSlide),
  ];
  fs.writeFileSync(logPath, header.concat(log).join("\n") + "\n");
  const summary = {
    deckId: safeId,
    jsonPath,
    logPath,
    photoDir,
    slides: sequence.length,
    images: imageCount,
    imageBytes,
    mapped,
    perSlide,
    warnings: log.length,
  };
  return summary;
}

if (require.main === module) {
  const input = process.argv[2];
  const deckId = process.argv[3];
  if (!input || !deckId) {
    console.error("Usage: node services/templatePipeline/convert/pptxToDeck.js <input.pptx> <deck-id>");
    process.exit(1);
  }
  const summary = convertPptx(path.resolve(input), deckId);
  console.log(JSON.stringify(summary, null, 2));
}

module.exports = { convertPptx };
