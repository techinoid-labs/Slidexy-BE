/**
 * Build a deck whose slides are structural mixes of two seeds.
 *
 *   node services/templatePipeline/mutate_layout.js health-medical cinema-neon "A sustainable fashion brand"
 *
 * Each slide uses one strategy: background swap, block mix, or mirror and shift.
 * A mix is kept only when text boxes do not overlap and analyzeDeck.js accepts
 * the geometry. A failed mix is discarded and rolled again.
 */

const fs = require("fs");
const path = require("path");
const { injectTheme } = require("./thematic");
const { renderSlidePng } = require("../../scripts/slideSvg");
const { analyzeDeck, checkGeometry, contrastRatio } = require("./scoring/analyzeDeck");

const ROOT = path.join(__dirname, "..", "..");
const LIBRARY = path.join(ROOT, "app-library");
const PHOTO_ROOT = path.join(ROOT, "generated-templates");
const CANVAS_W = 1600;
const CANVAS_H = 900;
const MID = CANVAS_H / 2;
const STRATEGIES = ["background-swap", "block-mix", "mirror-shift"];
const GEOMETRY_TRIES = 12;
const THEMED_TRIES = 2;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadSeed(id) {
  const file = path.join(LIBRARY, id + ".json");
  if (!fs.existsSync(file)) throw new Error("Layout not found: " + id);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function slideElements(deck, slideId) {
  const layout = deck.layouts && deck.layouts[slideId];
  return (layout && layout.elements) || [];
}

function isText(element) {
  if (!element) return false;
  if (element.type === "text" || element.type === "textMaskedImage") return true;
  return element.type === "rotated" && element.element && (element.element.type === "text" || element.element.type === "textMaskedImage");
}

function isImage(element) {
  return element && (element.type === "image" || element.type === "maskedImage" || element.type === "collage");
}

function area(element) {
  return Math.max(0, Number(element.width) || 0) * Math.max(0, Number(element.height) || 0);
}

function isBackgroundShape(element) {
  if (!element || (element.type !== "shape" && element.type !== "illustration")) return false;
  const height = Number(element.height) || 0;
  return area(element) >= CANVAS_W * CANVAS_H * 0.22 || height >= 700;
}

function box(element) {
  const x = Number(element.x) || 0;
  const y = Number(element.y) || 0;
  const width = Number(element.width) || 0;
  const height = Number(element.height) || 0;
  return { x, y, right: x + width, bottom: y + height, width, height };
}

function centerY(element) {
  const item = box(element);
  return item.y + item.height / 2;
}

function spansCut(element) {
  const item = box(element);
  return item.y < MID - 80 && item.bottom > MID + 80;
}

function textBody(element) {
  const node = element.type === "rotated" && element.element ? element.element : element;
  const spans = node.textContent && node.textContent.spans;
  if (!Array.isArray(spans)) return "";
  return spans.map((span) => String(span && span.text != null ? span.text : "")).join("");
}

function tag(element, prefix) {
  const copy = clone(element);
  copy.id = prefix + "-" + (copy.id || "el");
  return copy;
}

function stack(elements) {
  const scrims = elements.filter((element) => String(element.id || "").startsWith("scrim-"));
  const back = elements.filter((element) => !isText(element) && !String(element.id || "").startsWith("scrim-"));
  back.sort((left, right) => area(right) - area(left));
  const ordered = back.slice();
  elements.filter((element) => isText(element)).forEach((element) => {
    const scrim = scrims.find((item) => item.id === "scrim-" + element.id);
    if (scrim) ordered.push(scrim);
    ordered.push(element);
  });
  return ordered.map((element, index) => {
    element.zIndex = index + 1;
    if (element.element) element.element.zIndex = index + 1;
    return element;
  });
}

function fontName(size, fonts) {
  const display = fonts.display || fonts.text || "Calibri";
  const text = fonts.text || fonts.display || "Calibri";
  return size >= 40 ? display : text;
}

function paintFont(style, fonts) {
  if (!style) return;
  const size = Number(style.fontSize) || 0;
  if (style.fontFamily) style.fontFamily = fontName(size, fonts);
}

function swapFonts(element, fonts) {
  const node = element.type === "rotated" && element.element ? element.element : element;
  if (node.textStyle) paintFont(node.textStyle, fonts);
  const spans = node.textContent && node.textContent.spans;
  if (Array.isArray(spans)) spans.forEach((span) => paintFont(span, fonts));
  return element;
}

function mirrorX(element) {
  const copy = clone(element);
  const width = Number(copy.width) || 0;
  copy.x = CANVAS_W - (Number(copy.x) || 0) - width;
  if (copy.element) {
    const innerWidth = Number(copy.element.width) || 0;
    copy.element.x = CANVAS_W - (Number(copy.element.x) || 0) - innerWidth;
  }
  return copy;
}

function backgroundSwap(primary, secondary) {
  const kept = primary.filter((element) => isImage(element) || isBackgroundShape(element));
  const text = secondary.filter((element) => isText(element) && textBody(element).trim());
  return stack(kept.map((element) => tag(element, "a")).concat(text.map((element) => tag(element, "b"))));
}

function blockMix(primary, secondary) {
  const top = primary.filter((element) => centerY(element) < MID || (spansCut(element) && (isBackgroundShape(element) || element.type === "shape" || isImage(element))));
  const bottom = secondary.filter((element) => centerY(element) >= MID && !spansCut(element));
  return stack(top.map((element) => tag(element, "a")).concat(bottom.map((element) => tag(element, "b"))));
}

function mirrorShift(primary, fonts) {
  return stack(primary.map((element) => swapFonts(mirrorX(tag(element, "a")), fonts)));
}

function mixSlide(primary, secondary, strategy, fonts) {
  if (strategy === "background-swap") return backgroundSwap(primary, secondary);
  if (strategy === "block-mix") return blockMix(primary, secondary);
  return mirrorShift(primary, fonts);
}

function assignStrategies(count) {
  const plan = [];
  STRATEGIES.forEach((strategy) => {
    if (plan.length < count) plan.push(strategy);
  });
  while (plan.length < count) plan.push(STRATEGIES[Math.floor(Math.random() * STRATEGIES.length)]);
  for (let index = plan.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = plan[index];
    plan[index] = plan[swap];
    plan[swap] = current;
  }
  return plan;
}

function photoFiles(seedId) {
  const dir = path.join(PHOTO_ROOT, "photos", seedId);
  if (!seedId || !fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => /\.(png|jpe?g|webp)$/i.test(name))
    .sort()
    .map((name) => "photos/" + seedId + "/" + name);
}

function resolveEditorial(elements, pools, keepPhotoSlots) {
  const files = (pools || []).filter((file) => fs.existsSync(path.join(PHOTO_ROOT, file)));
  let cursor = 0;
  function replaceUrl(url) {
    if (!String(url || "").startsWith("editorial://")) return url || "";
    const name = String(url).slice("editorial://".length).replace(/[^a-z0-9-]+/gi, "-");
    const named = files.find((file) => path.basename(file, path.extname(file)) === name);
    if (named) return named;
    const candidates = [];
    ["jpg", "jpeg", "png", "webp"].forEach((ext) => {
      candidates.push("photos/editorial-3/" + name + "." + ext);
      candidates.push("photos/editorial-3/slide-1-img-1." + ext);
    });
    const specific = candidates.find((file) => fs.existsSync(path.join(PHOTO_ROOT, file)));
    if (specific) return specific;
    const thematic = files.filter((file) => file.indexOf("/thematic/") >= 0);
    if (!thematic.length) return "";
    const next = thematic[cursor % thematic.length];
    cursor += 1;
    return next;
  }
  return elements.filter((element) => {
    if (!element) return false;
    if (element.type === "collage" && element.collageContent && Array.isArray(element.collageContent.cells)) {
      element.collageContent.cells = element.collageContent.cells.filter((cell) => {
        if (!String(cell.url || "").startsWith("editorial://")) return true;
        const next = replaceUrl(cell.url);
        if (next) {
          cell.url = next;
          return true;
        }
        return keepPhotoSlots;
      });
      return element.collageContent.cells.length > 0;
    }
    const content = element.imageContent || element.maskedImageContent;
    if (content && String(content.url || "").startsWith("editorial://")) {
      const next = replaceUrl(content.url);
      if (next) content.url = next;
      else if (!keepPhotoSlots) return false;
    }
    if (element.element) {
      const nested = resolveEditorial([element.element], files, keepPhotoSlots);
      if (!nested.length) return false;
      element.element = nested[0];
    }
    return true;
  });
}

function resolveHex(value, deck) {
  const text = String(value || "").trim();
  const token = text.match(/^\{color\.([a-z0-9]+)\}$/i);
  if (token) {
    const next = deck.tokens && deck.tokens.color && deck.tokens.color[token[1]];
    return /^#[0-9a-f]{6}$/i.test(next || "") ? next : "";
  }
  return /^#[0-9a-f]{6}$/i.test(text) ? text : "";
}

function solidHex(element, deck) {
  if (!element) return "";
  if (element.type === "shape") return resolveHex(element.shapeContent && element.shapeContent.fill, deck);
  if (element.type === "illustration") return resolveHex(element.illustrationContent && element.illustrationContent.fill, deck);
  return "";
}

function flatten(elements, list) {
  const out = list || [];
  (elements || []).forEach((element) => {
    if (!element) return;
    out.push(element);
    if (element.type === "rotated" && element.element) flatten([element.element], out);
    if (Array.isArray(element.children)) flatten(element.children, out);
  });
  return out;
}

function repairContrast(elements, deck) {
  const flat = flatten(elements);
  const fallback = resolveHex((deck.tokens && deck.tokens.color && deck.tokens.color.bg) || (deck.theme && deck.theme.backgroundColor), deck) || "#F4F0E8";
  flat.forEach((element) => {
    if (element.type !== "text") return;
    const spans = (element.textContent && element.textContent.spans) || [];
    const body = spans.map((span) => String(span && span.text != null ? span.text : "")).join("");
    if (!body.trim()) return;
    const cx = (Number(element.x) || 0) + (Number(element.width) || 0) / 2;
    const cy = (Number(element.y) || 0) + (Number(element.height) || 0) / 2;
    let background = fallback;
    let depth = -1;
    flat.forEach((other) => {
      if (other === element) return;
      const fill = solidHex(other, deck);
      if (!fill) return;
      const left = Number(other.x) || 0;
      const top = Number(other.y) || 0;
      const right = left + (Number(other.width) || 0);
      const bottom = top + (Number(other.height) || 0);
      if (cx < left || cx > right || cy < top || cy > bottom) return;
      const z = Number(other.zIndex) || 0;
      if (z <= (Number(element.zIndex) || 0) && z >= depth) {
        depth = z;
        background = fill;
      }
    });
    const current = resolveHex((spans[0] && spans[0].color) || (element.textStyle && element.textStyle.color), deck);
    if (current && contrastRatio(current, background) >= 4.5) return;
    const next = contrastRatio("#000000", background) >= contrastRatio("#FFFFFF", background) ? "#000000" : "#FFFFFF";
    if (element.textStyle) element.textStyle.color = next;
    spans.forEach((span) => { span.color = next; });
  });
  return elements;
}

function dropOverlappingText(elements) {
  const kept = [];
  elements.forEach((element) => {
    if (!isText(element) || !textBody(element).trim()) {
      kept.push(element);
      return;
    }
    const candidate = box(element);
    const hits = kept.some((other) => {
      if (!isText(other) || !textBody(other).trim()) return false;
      const otherBox = box(other);
      const shared = overlapArea(candidate, otherBox);
      const smaller = Math.min(candidate.width * candidate.height, otherBox.width * otherBox.height);
      return smaller > 0 && shared / smaller > 0.2;
    });
    if (!hits) kept.push(element);
  });
  return kept;
}

function overlapArea(left, right) {
  const x = Math.max(left.x, right.x);
  const y = Math.max(left.y, right.y);
  const edge = Math.min(left.right, right.right);
  const bottom = Math.min(left.bottom, right.bottom);
  if (edge <= x || bottom <= y) return 0;
  return (edge - x) * (bottom - y);
}

function photoCollision(textBox, imageBox) {
  const shared = overlapArea(textBox, imageBox);
  const imageArea = imageBox.width * imageBox.height;
  const textArea = textBox.width * textBox.height;
  if (!shared || imageArea <= 0) return false;
  if (shared / imageArea > 0.4) return true;
  if (textArea > 0 && shared / textArea > 0.4) return true;
  const insetX = imageBox.width * 0.2;
  const insetY = imageBox.height * 0.2;
  const subject = {
    x: imageBox.x + insetX,
    y: imageBox.y + insetY,
    right: imageBox.right - insetX,
    bottom: imageBox.bottom - insetY,
    width: imageBox.width - insetX * 2,
    height: imageBox.height - insetY * 2,
  };
  return overlapArea(textBox, subject) > 0;
}

function hitsPhoto(candidate, images) {
  return images.some((image) => photoCollision(candidate, box(image)));
}

function hitsText(candidate, texts) {
  return texts.some((other) => {
    const otherBox = box(other);
    const shared = overlapArea(candidate, otherBox);
    const smaller = Math.min(candidate.width * candidate.height, otherBox.width * otherBox.height);
    return smaller > 0 && shared / smaller > 0.2;
  });
}

function marginRegions(images) {
  const pad = 28;
  if (!images.length) {
    return [{ x: pad, y: pad, width: CANVAS_W - pad * 2, height: CANVAS_H - pad * 2 }];
  }
  const boxes = images.map(box);
  const left = Math.min.apply(null, boxes.map((item) => item.x));
  const right = Math.max.apply(null, boxes.map((item) => item.right));
  const top = Math.min.apply(null, boxes.map((item) => item.y));
  const bottom = Math.max.apply(null, boxes.map((item) => item.bottom));
  const regions = [];
  if (left - pad > 120) regions.push({ x: pad, y: pad, width: left - pad * 2, height: CANVAS_H - pad * 2 });
  if (CANVAS_W - right - pad > 120) regions.push({ x: right + pad, y: pad, width: CANVAS_W - right - pad * 2, height: CANVAS_H - pad * 2 });
  if (top - pad > 80) regions.push({ x: pad, y: pad, width: CANVAS_W - pad * 2, height: top - pad * 2 });
  if (CANVAS_H - bottom - pad > 80) regions.push({ x: pad, y: bottom + pad, width: CANVAS_W - pad * 2, height: CANVAS_H - bottom - pad * 2 });
  regions.forEach((region) => {
    region.right = region.x + region.width;
    region.bottom = region.y + region.height;
  });
  regions.sort((a, b) => (b.width * b.height) - (a.width * a.height));
  return regions;
}

function placeInMargin(element, images, texts) {
  const width = Number(element.width) || 0;
  const height = Number(element.height) || 0;
  if (width <= 0 || height <= 0 || width > CANVAS_W - 48 || height > CANVAS_H - 48) return null;
  const regions = marginRegions(images);
  for (let region = 0; region < regions.length; region += 1) {
    const areaBox = regions[region];
    if (areaBox.width < width || areaBox.height < height) continue;
    const x = areaBox.x;
    let y = Math.max(areaBox.y, Math.min(Number(element.y) || areaBox.y, areaBox.y + areaBox.height - height));
    for (let step = 0; step < 8; step += 1) {
      const candidate = { x, y, right: x + width, bottom: y + height, width, height };
      const inside = candidate.x >= 0 && candidate.y >= 0 && candidate.right <= CANVAS_W && candidate.bottom <= CANVAS_H;
      if (inside && !hitsPhoto(candidate, images) && !hitsText(candidate, texts)) return { x, y };
      y += height + 16;
      if (y + height > areaBox.y + areaBox.height) break;
    }
  }
  return null;
}

function moveElement(element, x, y) {
  const dx = x - (Number(element.x) || 0);
  const dy = y - (Number(element.y) || 0);
  element.x = x;
  element.y = y;
  if (element.element) {
    element.element.x = (Number(element.element.x) || 0) + dx;
    element.element.y = (Number(element.element.y) || 0) + dy;
  }
}

function otherSeedImages(element, images) {
  const side = String(element.id || "").slice(0, 2);
  return images.filter((image) => {
    const other = String(image.id || "").slice(0, 2);
    return side !== other && (other === "a-" || other === "b-");
  });
}

function clearCoveringShapes(elements) {
  const images = elements.filter((element) => isImage(element));
  return elements.filter((element) => {
    if (!element || isText(element) || isImage(element) || isBackgroundShape(element)) return true;
    if (element.type !== "shape" && element.type !== "illustration") return true;
    const foreign = otherSeedImages(element, images);
    return !foreign.some((image) => {
      const imageBox = box(image);
      const imageArea = imageBox.width * imageBox.height;
      const shared = overlapArea(box(element), imageBox);
      const shapeArea = area(element);
      if (shapeArea > 0 && shared / shapeArea > 0.4) return true;
      return imageArea > 0 && shared / imageArea > 0.4;
    });
  });
}

function clearPhotoText(elements) {
  const images = elements.filter((element) => isImage(element));
  if (!images.length) return elements;
  const kept = [];
  const parked = [];
  elements.forEach((element) => {
    if (!isText(element) || !textBody(element).trim()) {
      kept.push(element);
      return;
    }
    const blocking = otherSeedImages(element, images);
    if (!blocking.length || !hitsPhoto(box(element), blocking)) {
      kept.push(element);
      parked.push(element);
      return;
    }
    const spot = placeInMargin(element, images, parked);
    if (!spot) return;
    moveElement(element, spot.x, spot.y);
    kept.push(element);
    parked.push(element);
  });
  return kept;
}

function textNode(element) {
  return element.type === "rotated" && element.element ? element.element : element;
}

function textIsLight(element) {
  const node = textNode(element);
  const spans = (node.textContent && node.textContent.spans) || [];
  const color = (spans[0] && spans[0].color) || (node.textStyle && node.textStyle.color) || "#000000";
  const hex = /^#[0-9a-f]{6}$/i.test(String(color)) ? color : "#000000";
  return contrastRatio(hex, "#000000") >= contrastRatio(hex, "#FFFFFF");
}

function paintInk(element, color) {
  const node = textNode(element);
  if (node.textStyle) node.textStyle.color = color;
  const spans = node.textContent && node.textContent.spans;
  if (Array.isArray(spans)) spans.forEach((span) => { span.color = color; });
}

function addScrims(elements) {
  const images = elements.filter((element) => isImage(element));
  const next = elements.filter((element) => !String(element.id || "").startsWith("scrim-"));
  const withScrims = [];
  next.forEach((element) => {
    const foreign = otherSeedImages(element, images);
    const item = isText(element) ? box(element) : null;
    const onPhoto = item && foreign.some((image) => {
      const shared = overlapArea(item, box(image));
      return item.width * item.height > 0 && shared / (item.width * item.height) > 0.4;
    });
    if (isText(element) && textBody(element).trim() && onPhoto) {
      const light = textIsLight(element);
      const ink = light ? "#FFFFFF" : "#000000";
      const item = box(element);
      paintInk(element, ink);
      withScrims.push({
        id: "scrim-" + (element.id || "text"),
        type: "shape",
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        opacity: 0.4,
        shapeContent: { kind: "rectangle", fill: light ? "#000000" : "#FFFFFF" },
      });
    }
    withScrims.push(element);
  });
  return withScrims;
}

function retintScrims(elements) {
  elements.forEach((scrim) => {
    if (!String(scrim.id || "").startsWith("scrim-")) return;
    const text = elements.find((element) => element.id === scrim.id.slice("scrim-".length));
    const light = text ? textIsLight(text) : true;
    scrim.opacity = 0.4;
    scrim.shapeContent = scrim.shapeContent || {};
    scrim.shapeContent.kind = "rectangle";
    scrim.shapeContent.fill = light ? "#000000" : "#FFFFFF";
    if (text) paintInk(text, light ? "#FFFFFF" : "#000000");
  });
  return elements;
}

function textOverlap(elements) {
  const boxes = elements.filter((element) => isText(element) && textBody(element).trim()).map(box);
  for (let left = 0; left < boxes.length; left += 1) {
    for (let right = left + 1; right < boxes.length; right += 1) {
      const shared = overlapArea(boxes[left], boxes[right]);
      const smaller = Math.min(boxes[left].width * boxes[left].height, boxes[right].width * boxes[right].height);
      if (smaller > 0 && shared / smaller > 0.2) return true;
    }
  }
  return false;
}

function geometryOk(deck) {
  const reasons = [];
  (deck.layoutSequence || []).forEach((id, index) => {
    const layout = deck.layouts[id];
    const elements = (layout && layout.elements) || [];
    if (textOverlap(elements)) reasons.push("text overlap on slide " + (index + 1));
    const geometry = checkGeometry(deck, id);
    if (!geometry.pass) geometry.reasons.filter((reason) => reason !== "split word").forEach((reason) => reasons.push(reason + " on slide " + (index + 1)));
  });
  return { pass: reasons.length === 0, reasons };
}

function finishSlide(elements, deck, pools) {
  const resolved = resolveEditorial(elements, pools, true);
  const cleared = dropOverlappingText(clearPhotoText(clearCoveringShapes(resolved)));
  return repairContrast(stack(addScrims(cleared)), deck);
}

function buildRemix(seedA, seedB) {
  const primary = clone(seedA);
  const fonts = (seedB.tokens && seedB.tokens.font) || { display: "Calibri", text: "Calibri" };
  const sequenceA = seedA.layoutSequence || Object.keys(seedA.layouts || {});
  const sequenceB = seedB.layoutSequence || Object.keys(seedB.layouts || {});
  const pools = photoFiles(seedA.id).concat(photoFiles(seedB.id));
  const plan = assignStrategies(sequenceA.length);
  const strategies = [];
  const layouts = {};
  const sequence = sequenceA.map((sourceId, index) => {
    const strategy = plan[index];
    const otherId = sequenceB[index % sequenceB.length];
    const slideId = "slide-" + (index + 1);
    strategies.push({ slide: index + 1, strategy, fromA: sourceId, fromB: otherId });
    const source = seedA.layouts[sourceId] || {};
    layouts[slideId] = {
      version: 2,
      id: slideId,
      canvas: source.canvas || { width: CANVAS_W, height: CANVAS_H, aspectRatio: "16:9" },
      elements: finishSlide(mixSlide(slideElements(seedA, sourceId), slideElements(seedB, otherId), strategy, fonts), primary, pools),
    };
    return slideId;
  });
  primary.layoutSequence = sequence;
  primary.layouts = layouts;
  primary.tokens = primary.tokens || {};
  primary.tokens.font = {
    display: fonts.display || "Calibri",
    text: fonts.text || fonts.display || "Calibri",
  };
  if (primary.theme) primary.theme.fontFamily = primary.tokens.font.text;
  primary.remix = {
    seedA: seedA.id,
    seedB: seedB.id,
    strategies,
  };
  primary.id = String(seedA.id + "-" + seedB.id + "-remix").replace(/[^a-z0-9-]+/g, "-");
  primary.source = "remix:" + seedA.id + "+" + seedB.id;
  return primary;
}

function rollRemix(seedA, seedB) {
  let last = null;
  for (let attempt = 1; attempt <= GEOMETRY_TRIES; attempt += 1) {
    const deck = buildRemix(seedA, seedB);
    const check = geometryOk(deck);
    last = { deck, check, attempt };
    if (check.pass) {
      console.log("remix geometry passed on attempt " + attempt);
      return last;
    }
    console.log("remix discard attempt " + attempt + ": " + check.reasons.slice(0, 4).join("; "));
  }
  return last;
}

async function remixSeeds(seedAId, seedBId, options) {
  const seedA = loadSeed(seedAId);
  const seedB = loadSeed(seedBId);
  const prompt = String((options && options.prompt) || "").trim();
  const out = options && options.out;
  let themed = null;
  let rolled = null;
  let analysis = null;
  for (let round = 1; round <= THEMED_TRIES; round += 1) {
    rolled = rollRemix(seedA, seedB);
    if (!rolled.check.pass) {
      if (!themed) break;
      console.log("remix retry had no valid geometry; keeping the previous deck");
      break;
    }
    console.log("remix " + seedA.id + " + " + seedB.id + " round " + round);
    rolled.deck.remix.strategies.forEach((item) => console.log("slide " + item.slide + " " + item.strategy));
    themed = await injectTheme({
      prompt,
      layout: seedA.id + "+" + seedB.id,
      deck: rolled.deck,
      out,
    });
    const painted = JSON.parse(fs.readFileSync(path.join(themed.outDir, "deck.json"), "utf8"));
    const pools = photoFiles(seedA.id).concat(photoFiles(seedB.id));
    const photoSlug = path.basename(themed.outDir).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "theme";
    const thematicDir = path.join(PHOTO_ROOT, "photos", "thematic", photoSlug);
    const thematic = fs.existsSync(thematicDir)
      ? fs.readdirSync(thematicDir).filter((name) => /\.(png|jpe?g|webp)$/i.test(name)).sort().map((name) => "photos/thematic/" + photoSlug + "/" + name)
      : [];
    (painted.layoutSequence || []).forEach((id) => {
      const layout = painted.layouts && painted.layouts[id];
      if (!layout) return;
      layout.elements = resolveEditorial(layout.elements || [], pools.concat(thematic), false);
      repairContrast(layout.elements, painted);
      retintScrims(layout.elements);
      stack(layout.elements);
    });
    fs.writeFileSync(path.join(themed.outDir, "deck.json"), JSON.stringify(painted, null, 2) + "\n");
    (painted.layoutSequence || []).forEach((id, index) => {
      if (themed.slides[index]) renderSlidePng(painted, id, themed.slides[index]);
    });
    analysis = await analyzeDeck(painted, themed.slides);
    console.log("remix score " + analysis.score + " (" + analysis.passed + "/" + analysis.total + ")");
    const geometryFailed = analysis.slides.some((slide) => slide.reasons.some((reason) => reason === "bounds" || reason === "contrast" || reason === "text overlap" || reason === "text overflow" || reason === "split word"));
    if (analysis.passed > 0 && !geometryFailed) break;
    console.log("remix check failed, discarding round " + round);
  }
  if (!themed || !analysis) {
    const error = new Error("Remix failed the layout check. " + ((rolled && rolled.check.reasons) || []).slice(0, 6).join("; "));
    error.status = 422;
    throw error;
  }
  const deck = JSON.parse(fs.readFileSync(path.join(themed.outDir, "deck.json"), "utf8"));
  deck.remix = deck.remix || rolled.deck.remix;
  deck.remix.analysis = {
    score: analysis.score,
    passed: analysis.passed,
    total: analysis.total,
    failures: analysis.failures,
  };
  fs.writeFileSync(path.join(themed.outDir, "deck.json"), JSON.stringify(deck, null, 2) + "\n");
  return {
    outDir: themed.outDir,
    slides: themed.slides,
    report: themed.report,
    layout: seedA.id + "+" + seedB.id,
    name: themed.name,
    deckId: themed.deckId,
    remix: deck.remix,
    analysis: deck.remix.analysis,
  };
}

if (require.main === module) {
  const seedA = process.argv[2];
  const seedB = process.argv[3];
  const prompt = process.argv.slice(4).join(" ").trim() || "A sustainable fashion brand";
  if (!seedA || !seedB) {
    console.error("Usage: node services/templatePipeline/mutate_layout.js <seed-a> <seed-b> [prompt]");
    process.exit(1);
  }
  const out = path.join("docs", "template-pipeline", "layout-remixes", seedA + "--" + seedB);
  remixSeeds(seedA, seedB, { prompt, out }).then((result) => {
    console.log(JSON.stringify({
      name: result.name,
      out: result.outDir,
      strategies: result.remix.strategies,
      score: result.analysis.score,
      passed: result.analysis.passed,
      total: result.analysis.total,
      failures: result.analysis.failures,
    }, null, 2));
  }).catch((error) => {
    console.error(error && error.message ? error.message : error);
    process.exit(1);
  });
}

module.exports = { remixSeeds, buildRemix, geometryOk };
