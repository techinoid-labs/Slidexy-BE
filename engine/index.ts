/** Public Engine v1 entry. */
const { generateKitV1, inventDeckSpec, fallbackSpec } = require("./generateKitV1");
const { validateDeckSpec } = require("./validate");
const { selectAll, selectVariant } = require("./selectVariant");
const { runGates } = require("./gates");
const { fitText } = require("./fit");
const { renderDeckFromSpec } = require("./render");

module.exports = {
  generateKitV1,
  inventDeckSpec,
  fallbackSpec,
  validateDeckSpec,
  selectAll,
  selectVariant,
  runGates,
  fitText,
  renderDeckFromSpec,
};
