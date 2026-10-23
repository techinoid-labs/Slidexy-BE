/**
 * Shared template file. The website pipeline writes this shape.
 * The phone app loads the same shape
 * (slidesX-Flutter-POC assets/templates/decks/*.json, schemaVersion 2).
 *
 * A generated file can be dropped into the app catalog or published
 * from the template portal without a second design.
 */

const CANVAS = { width: 1600, height: 900, aspectRatio: "16:9" };

const LAYOUT_SEQUENCE = [
  "layoutTitleFocus",
  "layoutAgendaList",
  "layoutTimeline",
  "layoutStatHighlight",
  "layoutThreeUp",
  "layoutComparison",
  "layoutTeam",
  "layoutImageLeft",
  "layoutTextOnly",
  "layoutQuoteBanner",
  "layoutClosingCta",
];

const BINDINGS = new Set([
  "title",
  "subtitle",
  "bullets",
  "bullet",
  "image",
  "label",
  "labeledLabel",
  "labeledDetail",
  "itemNumber",
  "timelineLabel",
  "timelineMarker",
]);

const ELEMENT_TYPES = ["text", "shape", "image", "table", "illustration", "maskedImage", "rotated", "collage", "textMaskedImage"];
const CLIP_KINDS = ["rect", "ellipse", "arch", "path"];

function illustration(id, x, y, w, h, spec) {
  const body = spec || {};
  return {
    id,
    type: "illustration",
    x, y, width: w, height: h,
    zIndex: body.zIndex == null ? 4 : body.zIndex,
    opacity: body.opacity == null ? 1 : body.opacity,
    illustrationContent: {
      d: body.d,
      viewBox: body.viewBox || "0 0 100 100",
      fill: body.fill || "none",
      stroke: body.stroke || "none",
      strokeWidth: body.strokeWidth == null ? 2 : body.strokeWidth,
    },
  };
}

function maskedImage(id, x, y, w, h, spec) {
  const body = spec || {};
  const clip = body.clip || { kind: "rect" };
  const content = {
    url: body.url || "",
    binding: body.binding || "",
    fit: body.fit || "cover",
    clip: {
      kind: clip.kind || "rect",
      d: clip.d || "",
      viewBox: clip.viewBox || "0 0 100 100",
      cornerRadius: clip.cornerRadius || 0,
    },
  };
  if (typeof body.alignX === "number") content.alignX = body.alignX;
  if (typeof body.alignY === "number") content.alignY = body.alignY;
  return {
    id,
    type: "maskedImage",
    x, y, width: w, height: h,
    zIndex: body.zIndex == null ? 3 : body.zIndex,
    opacity: body.opacity == null ? 1 : body.opacity,
    maskedImageContent: content,
  };
}

function image(id, x, y, w, h, spec) {
  const body = spec || {};
  const content = {
    url: body.url || "",
    fit: body.fit || "cover",
  };
  if (body.binding) content.binding = body.binding;
  if (typeof body.alignX === "number") content.alignX = body.alignX;
  if (typeof body.alignY === "number") content.alignY = body.alignY;
  return {
    id,
    type: "image",
    x, y, width: w, height: h,
    zIndex: body.zIndex == null ? 3 : body.zIndex,
    imageContent: content,
  };
}

function rotated(id, element, degrees) {
  return {
    id,
    type: "rotated",
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    zIndex: element.zIndex == null ? 6 : element.zIndex,
    degrees,
    element,
  };
}

function collage(id, x, y, w, h, cells, zIndex) {
  return {
    id,
    type: "collage",
    x, y, width: w, height: h,
    zIndex: zIndex == null ? 3 : zIndex,
    collageContent: {
      cells: (cells || []).map((cell) => ({
        x: cell.x,
        y: cell.y,
        width: cell.width,
        height: cell.height,
        url: cell.url || "",
        binding: cell.binding || "",
        fit: cell.fit || "cover",
      })),
    },
  };
}

module.exports = {
  CANVAS,
  LAYOUT_SEQUENCE,
  BINDINGS,
  ELEMENT_TYPES,
  CLIP_KINDS,
  illustration,
  maskedImage,
  image,
  rotated,
  collage,
};
