/**
 * Reads a .pptx into the audit slide model: every visible element of every
 * slide, in paint order, in 1600x900 canvas pixels.
 *
 * Canva exports draw most shapes as custom paths, so geometry is classified
 * from the path itself rather than from the element type.
 */

const fs = require("fs");
const pathLib = require("path");
const { readZip } = require("./zip");
const { parseXml, child, children, path: at, descendants, textOf } = require("./xml");
const { describePng } = require("./png");

const W = 1600;
const H = 900;
const SHAPE_TAGS = new Set(["p:sp", "p:pic", "p:grpSp", "p:cxnSp", "p:graphicFrame", "mc:AlternateContent"]);
const FILL_TAGS = ["a:noFill", "a:solidFill", "a:gradFill", "a:blipFill", "a:pattFill", "a:grpFill"];
const VERTICAL = new Set(["vert", "vert270", "eaVert", "wordArtVert", "wordArtVertRtl", "mongolianVert"]);

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function resolveTarget(base, target) {
  if (!target) return null;
  if (target.startsWith("/")) return target.slice(1);
  const parts = base.split("/").slice(0, -1);
  for (const part of target.split("/")) {
    if (part === "..") parts.pop();
    else if (part && part !== ".") parts.push(part);
  }
  return parts.join("/");
}

function relsFor(zip, part) {
  const pieces = part.split("/");
  const file = pieces.pop();
  const xml = zip.text([...pieces, "_rels", file + ".rels"].join("/"));
  const rels = {};
  if (!xml) return rels;
  for (const rel of descendants(parseXml(xml), "Relationship")) {
    rels[rel.attrs.Id] = {
      type: (rel.attrs.Type || "").split("/").pop(),
      target: rel.attrs.TargetMode === "External" ? null : resolveTarget(part, rel.attrs.Target),
    };
  }
  return rels;
}

function relOfType(rels, type) {
  const found = Object.values(rels).find((rel) => rel.type === type);
  return found ? found.target : null;
}

function colorOf(node) {
  if (!node) return null;
  const c = node.children.find((n) => /^a:(srgbClr|schemeClr|prstClr|sysClr|scrgbClr|hslClr)$/.test(n.name));
  if (!c) return null;
  const raw = c.attrs.val || c.attrs.lastClr || "";
  const alpha = child(c, "a:alpha");
  return {
    value: c.name === "a:schemeClr" ? "scheme:" + raw : String(raw).toUpperCase(),
    alpha: alpha ? num(alpha.attrs.val, 100000) / 100000 : 1,
  };
}

function fillOf(spPr, style) {
  const node = spPr && spPr.children.find((n) => FILL_TAGS.includes(n.name));
  if (!node) {
    const ref = style && child(style, "a:fillRef");
    if (ref && num(ref.attrs.idx) > 0) return { type: "solid", color: colorOf(ref), alpha: 1, fromStyle: true };
    return null;
  }
  if (node.name === "a:noFill" || node.name === "a:grpFill") return null;
  if (node.name === "a:solidFill") {
    const color = colorOf(node);
    return { type: "solid", color, alpha: color ? color.alpha : 1 };
  }
  if (node.name === "a:gradFill") {
    const stops = descendants(node, "a:gs").map((gs) => colorOf(gs)).filter(Boolean);
    return { type: "gradient", stops, alpha: stops.length ? Math.max(...stops.map((s) => s.alpha)) : 1 };
  }
  if (node.name === "a:pattFill") return { type: "pattern", preset: node.attrs.prst || "" };
  return { type: "image", node };
}

function lineOf(spPr, style, scale) {
  const ln = spPr && child(spPr, "a:ln");
  const ref = style && child(style, "a:lnRef");
  const styled = Boolean(ref && num(ref.attrs.idx) > 0);
  if (ln) {
    if (child(ln, "a:noFill")) return null;
    const fill = ln.children.find((n) => FILL_TAGS.includes(n.name));
    if (!fill && !styled) return null;
    const ends = [child(ln, "a:headEnd"), child(ln, "a:tailEnd")];
    const dash = child(ln, "a:prstDash");
    return {
      width: num(ln.attrs.w, 9525) * scale,
      color: fill ? colorOf(fill) : colorOf(ref),
      dash: dash ? dash.attrs.val : "solid",
      arrow: ends.some((end) => end && end.attrs.type && end.attrs.type !== "none"),
    };
  }
  if (styled) return { width: 9525 * scale, color: colorOf(ref), dash: "solid", arrow: false, fromStyle: true };
  return null;
}

function shadowOf(spPr) {
  const effects = spPr && child(spPr, "a:effectLst");
  if (!effects) return null;
  const outer = child(effects, "a:outerShdw") || child(effects, "a:prstShdw");
  if (!outer) return child(effects, "a:innerShdw") ? "inner" : null;
  const blur = num(outer.attrs.blurRad);
  const dist = num(outer.attrs.dist);
  if (dist > 0 && blur <= dist * 0.25) return "hard_offset";
  return "soft_ambient";
}

function near(a, b, span) {
  return Math.abs(a - b) <= Math.max(1, span * 0.03);
}

function classifyPath(cust, extCx, extCy) {
  const paths = descendants(cust, "a:path");
  let subpaths = 0;
  let lines = 0;
  let curves = 0;
  const ends = [];
  let pw = 0;
  let ph = 0;
  for (const p of paths) {
    pw = num(p.attrs.w) || pw;
    ph = num(p.attrs.h) || ph;
    for (const cmd of p.children) {
      const pts = children(cmd, "a:pt").map((pt) => [num(pt.attrs.x), num(pt.attrs.y)]);
      if (cmd.name === "a:moveTo") subpaths += 1;
      else if (cmd.name === "a:lnTo") lines += 1;
      else if (cmd.name === "a:cubicBezTo" || cmd.name === "a:quadBezTo" || cmd.name === "a:arcTo") curves += 1;
      if (pts.length) ends.push(pts[pts.length - 1]);
    }
  }
  if (!subpaths) return { geom: "rect", radius: null };
  if (subpaths >= 3) return { geom: "compound", radius: null };
  const xs = ends.map((p) => p[0]);
  const ys = ends.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  if (!curves) {
    if (subpaths === 1 && lines === 1) return { geom: "line", radius: null };
    const corners = ends.every(([x, y]) => (near(x, minX, spanX) || near(x, maxX, spanX)) && (near(y, minY, spanY) || near(y, maxY, spanY)));
    if (subpaths === 1 && corners) return { geom: "rect", radius: null };
    const unique = new Set(ends.map(([x, y]) => Math.round(x / (spanX * 0.02 || 1)) + ":" + Math.round(y / (spanY * 0.02 || 1))));
    if (subpaths === 1 && unique.size === 3) return { geom: "triangle", radius: null };
    return { geom: subpaths === 1 ? "polygon" : "compound", radius: null };
  }
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  const onMidpoints = ends.every(([x, y]) => (near(x, midX, spanX) && (near(y, minY, spanY) || near(y, maxY, spanY)))
    || (near(y, midY, spanY) && (near(x, minX, spanX) || near(x, maxX, spanX))));
  if (subpaths === 1 && lines <= 1 && curves >= 4 && curves <= 8 && onMidpoints) return { geom: "ellipse", radius: null };
  if (subpaths === 1 && lines >= 3 && lines <= 5 && curves === 4) {
    const top = ends.filter(([, y]) => near(y, minY, spanY)).map(([x]) => x - minX).filter((d) => d > spanX * 0.01);
    const r = top.length ? Math.min(...top) : spanX * 0.1;
    const scale = pw ? extCx / pw : 1;
    return { geom: "roundRect", radius: r * scale };
  }
  if (subpaths === 2 && !lines) return { geom: "ring", radius: null };
  if (subpaths === 2) return { geom: "compound", radius: null };
  return { geom: curves >= lines ? "organic" : "curved", radius: null };
}

function geometryOf(spPr, extCx, extCy) {
  const prst = spPr && child(spPr, "a:prstGeom");
  if (prst) {
    const name = prst.attrs.prst || "rect";
    let radius = null;
    if (name.startsWith("round")) {
      const gd = descendants(prst, "a:gd").find((g) => g.attrs.name === "adj" || g.attrs.name === "adj1");
      const adj = gd ? num(String(gd.attrs.fmla || "").replace("val ", ""), 16667) : 16667;
      radius = (adj / 100000) * Math.min(extCx, extCy);
    }
    return { geom: name, radius };
  }
  const cust = spPr && child(spPr, "a:custGeom");
  if (cust) return classifyPath(cust, extCx, extCy);
  return { geom: "rect", radius: null };
}

function normalizeRotation(degrees) {
  let r = degrees % 360;
  if (r > 180) r -= 360;
  if (r <= -180) r += 360;
  return Math.round(r * 100) / 100;
}

function compose(parent, xfrm) {
  const off = child(xfrm, "a:off");
  const ext = child(xfrm, "a:ext");
  const chOff = child(xfrm, "a:chOff");
  const chExt = child(xfrm, "a:chExt");
  const ox = num(off && off.attrs.x);
  const oy = num(off && off.attrs.y);
  const ex = num(ext && ext.attrs.cx);
  const ey = num(ext && ext.attrs.cy);
  const cox = num(chOff && chOff.attrs.x);
  const coy = num(chOff && chOff.attrs.y);
  const cex = num(chExt && chExt.attrs.cx);
  const cey = num(chExt && chExt.attrs.cy);
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

function mediaInfo(zip, target, cache) {
  if (!target) return { ext: "", bytes: 0, present: false, width: 0, height: 0, alpha: null };
  if (cache.has(target)) return cache.get(target);
  const ext = pathLib.extname(target).toLowerCase().replace(".", "");
  const head = zip.head ? zip.head(target, 262144) : null;
  const info = { ext, bytes: zip.size(target), present: Boolean(head), width: 0, height: 0, alpha: null };
  if (head && ext === "png" && head.length > 26 && head.readUInt32BE(12) === 0x49484452) {
    info.width = head.readUInt32BE(16);
    info.height = head.readUInt32BE(20);
    info.alpha = head[25] === 4 || head[25] === 6 || head.includes(Buffer.from("tRNS"));
    if (info.width * info.height >= 40000 && info.bytes <= 40 * 1024 * 1024) {
      try {
        info.raster = describePng(zip.read(target));
      } catch (error) {
        info.raster = null;
      }
    }
  } else if (head && (ext === "jpg" || ext === "jpeg")) {
    info.alpha = false;
    let i = 2;
    while (i + 9 < head.length) {
      if (head[i] !== 0xff) { i += 1; continue; }
      const marker = head[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        info.height = head.readUInt16BE(i + 5);
        info.width = head.readUInt16BE(i + 7);
        break;
      }
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
      i += 2 + head.readUInt16BE(i + 2);
    }
  }
  cache.set(target, info);
  return info;
}

function imageOf(blipFill, rels, ctx) {
  const blip = child(blipFill, "a:blip");
  const embed = blip && (blip.attrs["r:embed"] || blip.attrs["r:link"]);
  const target = embed && rels[embed] ? rels[embed].target : null;
  const svg = blip ? descendants(blip, "asvg:svgBlip")[0] : null;
  const info = mediaInfo(ctx.zip, target, ctx.media);
  const alphaMod = blip && child(blip, "a:alphaModFix");
  const srcRect = child(blipFill, "a:srcRect");
  return {
    target,
    ext: info.ext,
    bytes: info.bytes,
    present: info.present,
    pixelWidth: info.width,
    pixelHeight: info.height,
    alpha: info.alpha,
    raster: info.raster || null,
    vector: Boolean(svg) || ["svg", "emf", "wmf"].includes(info.ext),
    duotone: Boolean(blip && child(blip, "a:duotone")),
    mono: Boolean(blip && (child(blip, "a:grayscl") || child(blip, "a:biLevel"))),
    opacity: alphaMod && alphaMod.attrs.amt !== undefined ? num(alphaMod.attrs.amt, 100000) / 100000 : 1,
    crop: Boolean(srcRect && Object.values(srcRect.attrs).some((v) => num(v) !== 0)),
  };
}

function placeholderKey(ph) {
  return { type: ph.attrs.type || "body", idx: ph.attrs.idx };
}

function indexPlaceholders(tree) {
  const byIdx = {};
  const byType = {};
  for (const sp of descendants(tree, "p:sp")) {
    const ph = at(sp, "p:nvSpPr", "p:nvPr", "p:ph");
    if (!ph) continue;
    const entry = {
      xfrm: at(sp, "p:spPr", "a:xfrm"),
      lstStyle: at(sp, "p:txBody", "a:lstStyle"),
    };
    const key = placeholderKey(ph);
    if (key.idx !== undefined && !byIdx[key.idx]) byIdx[key.idx] = entry;
    if (!byType[key.type]) byType[key.type] = entry;
  }
  return { byIdx, byType };
}

function lookupPlaceholder(index, ph) {
  if (!index) return null;
  const key = placeholderKey(ph);
  return (key.idx !== undefined && index.byIdx[key.idx]) || index.byType[key.type] || null;
}

function masterStyleFor(master, type) {
  if (!master || !master.txStyles) return null;
  if (type === "title" || type === "ctrTitle") return child(master.txStyles, "p:titleStyle");
  if (["body", "subTitle", "obj"].includes(type)) return child(master.txStyles, "p:bodyStyle");
  return child(master.txStyles, "p:otherStyle");
}

function paragraphsOf(txBody, chain, pxPerPt) {
  const bodyPr = child(txBody, "a:bodyPr");
  const autofit = bodyPr && child(bodyPr, "a:normAutofit");
  const fontScale = autofit && autofit.attrs.fontScale ? num(autofit.attrs.fontScale, 100000) / 100000 : 1;
  const lst = child(txBody, "a:lstStyle");
  const paragraphs = [];
  for (const p of children(txBody, "a:p")) {
    const pPr = child(p, "a:pPr");
    const lvl = num(pPr && pPr.attrs.lvl, 0) + 1;
    const lvlName = `a:lvl${lvl}pPr`;
    const defs = [
      pPr && child(pPr, "a:defRPr"),
      lst && child(lst, lvlName) && child(child(lst, lvlName), "a:defRPr"),
      ...chain.map((style) => style && child(style, lvlName) && child(child(style, lvlName), "a:defRPr")),
    ].filter(Boolean);
    const runs = [];
    for (const node of p.children) {
      if (node.name !== "a:r" && node.name !== "a:fld") continue;
      const value = textOf(child(node, "a:t"));
      if (!value) continue;
      const rPr = child(node, "a:rPr");
      const sources = [rPr, ...defs].filter(Boolean);
      const pick = (attr) => {
        for (const source of sources) if (source.attrs[attr] !== undefined) return source.attrs[attr];
        return undefined;
      };
      const pickChild = (tag) => {
        for (const source of sources) {
          const found = child(source, tag);
          if (found) return found;
        }
        return null;
      };
      const ln = rPr && child(rPr, "a:ln");
      const latin = pickChild("a:latin");
      const fill = pickChild("a:solidFill");
      runs.push({
        text: value,
        size: (num(pick("sz"), 1800) / 100) * pxPerPt * fontScale,
        bold: pick("b") === "1" || pick("b") === "true",
        italic: pick("i") === "1" || pick("i") === "true",
        underline: (pick("u") || "none") !== "none",
        caps: pick("cap") || "none",
        spacing: num(pick("spc"), 0) / 100,
        baseline: num(pick("baseline"), 0),
        font: latin ? latin.attrs.typeface : null,
        color: fill ? (colorOf(fill) || {}).value || null : null,
        outline: Boolean(ln && !child(ln, "a:noFill") && (num(ln.attrs.w, 0) > 0 || child(ln, "a:solidFill"))),
        hollow: Boolean(rPr && child(rPr, "a:noFill")),
        highlight: Boolean(rPr && child(rPr, "a:highlight")),
      });
    }
    if (runs.length) paragraphs.push({ runs, align: (pPr && pPr.attrs.algn) || "l" });
  }
  return {
    paragraphs,
    vertical: Boolean(bodyPr && VERTICAL.has(bodyPr.attrs.vert)),
    bodyRotation: bodyPr ? num(bodyPr.attrs.rot) / 60000 : 0,
  };
}

function readElement(node, transform, ctx, group) {
  const nv = node.children.find((n) => n.name.startsWith("p:nv"));
  const cNvPr = nv && child(nv, "p:cNvPr");
  if (cNvPr && (cNvPr.attrs.hidden === "1" || cNvPr.attrs.hidden === "true")) return [];
  const ph = nv && at(nv, "p:nvPr", "p:ph");
  if (ph && ctx.layer !== "slide") return [];
  const spPr = child(node, "p:spPr");
  let xfrm = node.name === "p:graphicFrame" ? child(node, "p:xfrm") : spPr && child(spPr, "a:xfrm");
  let inherited = null;
  if (ph) {
    inherited = lookupPlaceholder(ctx.layoutPlaceholders, ph) || lookupPlaceholder(ctx.masterPlaceholders, ph);
    if ((!xfrm || !child(xfrm, "a:off")) && inherited) xfrm = inherited.xfrm;
  }
  if (!xfrm || !child(xfrm, "a:off")) return [];
  const off = child(xfrm, "a:off");
  const ext = child(xfrm, "a:ext");
  const ex = num(ext && ext.attrs.cx);
  const ey = num(ext && ext.attrs.cy);
  const x = (transform.ax * num(off.attrs.x) + transform.bx) * ctx.sx;
  const y = (transform.ay * num(off.attrs.y) + transform.by) * ctx.sy;
  const w = transform.ax * ex * ctx.sx;
  const h = transform.ay * ey * ctx.sy;
  if (w <= 0.5 && h <= 0.5) return [];
  const base = {
    id: ctx.layer + ":" + (cNvPr ? cNvPr.attrs.id : ctx.z),
    name: cNvPr ? cNvPr.attrs.name || "" : "",
    x, y, w, h,
    rot: normalizeRotation(num(xfrm.attrs.rot) / 60000 + transform.rot),
    layer: ctx.layer,
    group,
  };
  const z = () => (ctx.z += 1);

  if (node.name === "p:graphicFrame") {
    const data = at(node, "a:graphic", "a:graphicData");
    const uri = (data && data.attrs.uri) || "";
    const kind = uri.includes("table") ? "table" : uri.includes("chart") ? "chart" : uri.includes("diagram") ? "diagram" : "object";
    const rows = data ? descendants(data, "a:tr").length : 0;
    return [{ ...base, kind, z: z(), rows }];
  }

  const style = child(node, "p:style");
  const scale = ctx.sx;
  const stroke = lineOf(spPr, style, scale);
  const shadow = shadowOf(spPr);
  const { geom, radius } = geometryOf(spPr, ex, ey);
  const shapeBits = { geom, radius: radius != null ? radius * scale * transform.ax : null, stroke, shadow };

  if (node.name === "p:cxnSp") {
    if (!stroke) return [];
    return [{ ...base, ...shapeBits, kind: "line", geom: "line", z: z() }];
  }

  if (node.name === "p:pic") {
    const blipFill = child(node, "p:blipFill");
    if (!blipFill) return [];
    return [{ ...base, ...shapeBits, kind: "image", image: imageOf(blipFill, ctx.rels, ctx), z: z() }];
  }

  const fill = fillOf(spPr, style);
  const out = [];
  if (fill && fill.type === "image") {
    out.push({ ...base, ...shapeBits, kind: "image", image: imageOf(fill.node, ctx.rels, ctx), z: z() });
  } else if (fill || stroke) {
    const isLine = geom === "line" || /line|Connector/.test(geom);
    out.push({ ...base, ...shapeBits, kind: isLine ? "line" : "shape", fill, z: z() });
  }
  const txBody = child(node, "p:txBody");
  if (txBody) {
    let chain;
    if (ph) {
      const type = ph.attrs.type || "body";
      chain = [
        inherited && inherited.lstStyle,
        lookupPlaceholder(ctx.masterPlaceholders, ph) && lookupPlaceholder(ctx.masterPlaceholders, ph).lstStyle,
        masterStyleFor(ctx.master, type),
        ctx.defaultTextStyle,
      ];
    } else {
      chain = [masterStyleFor(ctx.master, "other"), ctx.defaultTextStyle];
    }
    const text = paragraphsOf(txBody, chain, ctx.pxPerPt);
    const plain = text.paragraphs.map((p) => p.runs.map((r) => r.text).join("")).join("\n").trim();
    if (plain) {
      out.push({
        ...base,
        kind: "text",
        geom: "rect",
        text: { ...text, plain, maxSize: Math.max(...text.paragraphs.flatMap((p) => p.runs.map((r) => r.size))) },
        placeholder: ph ? ph.attrs.type || "body" : null,
        z: z(),
      });
    }
  }
  return out;
}

function walk(container, transform, ctx, out, group) {
  for (const node of container.children) {
    if (!SHAPE_TAGS.has(node.name)) continue;
    if (node.name === "mc:AlternateContent") {
      const branch = child(node, "mc:Choice") || child(node, "mc:Fallback");
      if (branch) walk(branch, transform, ctx, out, group);
      continue;
    }
    if (node.name === "p:grpSp") {
      const nv = child(node, "p:nvGrpSpPr");
      const cNvPr = nv && child(nv, "p:cNvPr");
      if (cNvPr && cNvPr.attrs.hidden === "1") continue;
      const xfrm = at(node, "p:grpSpPr", "a:xfrm");
      const next = xfrm ? compose(transform, xfrm) : transform;
      walk(node, next, ctx, out, group + "/" + ctx.layer + (cNvPr ? cNvPr.attrs.id : ""));
      continue;
    }
    out.push(...readElement(node, transform, ctx, group));
  }
}

function backgroundOf(tree, rels, ctx) {
  const bg = at(tree, child(tree, "p:sld") ? "p:sld" : child(tree, "p:sldLayout") ? "p:sldLayout" : "p:sldMaster", "p:cSld", "p:bg");
  if (!bg) return null;
  const bgPr = child(bg, "p:bgPr");
  if (bgPr) {
    const fill = fillOf(bgPr, null);
    if (!fill) return null;
    if (fill.type === "image") return { type: "image", image: imageOf(fill.node, rels, ctx) };
    return { type: fill.type, color: fill.color || null };
  }
  const ref = child(bg, "p:bgRef");
  if (ref) return { type: num(ref.attrs.idx) >= 1002 ? "theme" : "solid", color: colorOf(ref) };
  return null;
}

function rootTag(tree) {
  return tree.children.find((n) => n.name && n.name.startsWith("p:"));
}

function schemeOf(zip, master, parts) {
  const scheme = {};
  if (!master) return scheme;
  const theme = loadPart(zip, relOfType(master.rels, "theme"), parts);
  const clrScheme = theme && descendants(theme.tree, "a:clrScheme")[0];
  if (clrScheme) {
    for (const node of clrScheme.children) {
      if (!node.name) continue;
      const c = colorOf(node);
      if (c && !c.value.startsWith("scheme:")) scheme[node.name.replace("a:", "")] = c.value;
    }
  }
  const map = descendants(master.tree, "p:clrMap")[0];
  const aliases = map ? map.attrs : { bg1: "lt1", tx1: "dk1", bg2: "lt2", tx2: "dk2" };
  for (const [alias, target] of Object.entries(aliases)) {
    if (scheme[target]) scheme[alias] = scheme[target];
  }
  return scheme;
}

function loadPart(zip, part, cache) {
  if (cache.has(part)) return cache.get(part);
  const xml = zip.text(part);
  const value = xml ? { part, tree: parseXml(xml), rels: relsFor(zip, part) } : null;
  cache.set(part, value);
  return value;
}

function readPptx(file) {
  const zip = readZip(fs.readFileSync(file));
  const presPart = "ppt/presentation.xml";
  const pres = parseXml(zip.text(presPart));
  const presRoot = rootTag(pres);
  const size = child(presRoot, "p:sldSz");
  const cx = num(size && size.attrs.cx, 12192000);
  const cy = num(size && size.attrs.cy, 6858000);
  const presRels = relsFor(zip, presPart);
  const defaultTextStyle = child(presRoot, "p:defaultTextStyle");
  const order = children(child(presRoot, "p:sldIdLst"), "p:sldId")
    .map((node) => presRels[node.attrs["r:id"]])
    .filter(Boolean)
    .map((rel) => rel.target);
  const parts = new Map();
  const media = new Map();
  const slides = [];
  let scheme = null;
  order.forEach((slidePart, index) => {
    const slide = loadPart(zip, slidePart, parts);
    if (!slide) return;
    const layout = loadPart(zip, relOfType(slide.rels, "slideLayout"), parts);
    const master = layout ? loadPart(zip, relOfType(layout.rels, "slideMaster"), parts) : null;
    if (!scheme) scheme = schemeOf(zip, master, parts);
    const slideRoot = rootTag(slide.tree);
    const layoutRoot = layout && rootTag(layout.tree);
    const masterRoot = master && rootTag(master.tree);
    const masterInfo = masterRoot ? { txStyles: child(masterRoot, "p:txStyles") } : null;
    const ctx = {
      zip,
      media,
      sx: W / cx,
      sy: H / cy,
      pxPerPt: W / (cx / 12700),
      z: 0,
      master: masterInfo,
      defaultTextStyle,
      layoutPlaceholders: layout ? indexPlaceholders(layout.tree) : null,
      masterPlaceholders: master ? indexPlaceholders(master.tree) : null,
    };
    const elements = [];
    const identity = { ax: 1, bx: 0, ay: 1, by: 0, rot: 0 };
    const showMaster = slideRoot.attrs.showMasterSp !== "0" && (!layoutRoot || layoutRoot.attrs.showMasterSp !== "0");
    if (master && showMaster) {
      ctx.layer = "master";
      ctx.rels = master.rels;
      walk(at(masterRoot, "p:cSld", "p:spTree"), identity, ctx, elements, "");
    }
    if (layout && slideRoot.attrs.showMasterSp !== "0") {
      ctx.layer = "layout";
      ctx.rels = layout.rels;
      walk(at(layoutRoot, "p:cSld", "p:spTree"), identity, ctx, elements, "");
    }
    ctx.layer = "slide";
    ctx.rels = slide.rels;
    walk(at(slideRoot, "p:cSld", "p:spTree"), identity, ctx, elements, "");
    ctx.rels = slide.rels;
    const background = backgroundOf(slide.tree, slide.rels, ctx)
      || (layout && backgroundOf(layout.tree, layout.rels, { ...ctx, rels: layout.rels }))
      || (master && backgroundOf(master.tree, master.rels, { ...ctx, rels: master.rels }));
    slides.push({
      index,
      part: slidePart,
      background,
      elements,
      text: elements.filter((e) => e.kind === "text").map((e) => e.text.plain).join(" | "),
    });
  });
  return { complete: zip.complete, slideSize: { cx, cy }, scheme: scheme || {}, slides };
}

module.exports = { readPptx, classifyPath, W, H };
