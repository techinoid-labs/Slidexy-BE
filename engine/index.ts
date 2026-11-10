/** Public Engine v1 entry. */
const { generateKitV1, inventDeckSpec } = require("./generateKitV1");
const { validateDeckSpec } = require("./validate");
const { selectAll, selectVariant, resolveThemeLock } = require("./selectVariant");
const { runGates } = require("./gates");
const { fitText } = require("./fit");
const { renderDeckFromSpec } = require("./render");
const { loadBrand, applyBrandTokens, injectBrandIntoDeck } = require("./brand");
const { ingestKpis, kpisToStatsSlide, applyKpisToSpec, formatKpiValue } = require("./kpi");
const { expandMotionScenes } = require("./motion");
const { applyAmbientToDeck, selectAmbientForLayout } = require("./ambient");
const {
  normalizeDeckSpec,
  expandOverflowSlides,
  resolveContentDensity,
  typographyFloors,
} = require("./content");
const {
  applyGlobalPrimitives,
  enrichPalette,
  typographyLimits,
  dataVizRules,
  getTheme,
} = require("./primitives");
const { AssetService, getAssetService } = require("./asset-service");

module.exports = {
  generateKitV1,
  inventDeckSpec,
  AssetService,
  getAssetService,
  validateDeckSpec,
  selectAll,
  selectVariant,
  resolveThemeLock,
  runGates,
  fitText,
  renderDeckFromSpec,
  loadBrand,
  applyBrandTokens,
  injectBrandIntoDeck,
  ingestKpis,
  kpisToStatsSlide,
  applyKpisToSpec,
  formatKpiValue,
  expandMotionScenes,
  applyAmbientToDeck,
  selectAmbientForLayout,
  normalizeDeckSpec,
  expandOverflowSlides,
  resolveContentDensity,
  typographyFloors,
  applyGlobalPrimitives,
  enrichPalette,
  typographyLimits,
  dataVizRules,
  getTheme,
};
