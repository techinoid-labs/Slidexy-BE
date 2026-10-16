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

module.exports = { CANVAS, LAYOUT_SEQUENCE, BINDINGS };
