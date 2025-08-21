// /services/layoutMapperService.js
const layouts = require("../utils/layoutLibrary");
const crypto = require("crypto");

/**
 * Maps AI-generated content into a predefined layout blueprint.
 * @param {string} layoutType - One of the keys from layoutLibrary (e.g. "title_slide").
 * @param {object} aiContent - AI generated content keyed by role.
 * @param {object} theme - Theme object (fonts, colors).
 */
function mapContentToLayout(layoutType, aiContent = {}, theme = {}) {
  const baseLayout = layouts[layoutType];
  if (!baseLayout) throw new Error(`Unknown layout type: ${layoutType}`);

  return {
    slide_id: crypto.randomUUID(),
    slide_type: layoutType,
    elements: baseLayout.elements.map(el => {
      const roleContent = aiContent[el.role] || "";

      const element = {
        element_id: crypto.randomUUID(),
        element_type: el.element_type,
        role: el.role,
        properties: { ...el.properties }
      };

      // Map content by type
      if (["title", "text", "bullet_point"].includes(el.element_type)) {
        element.text = roleContent;
        element.properties.fontFamily = theme.fonts?.body?.family || "Arial";
        element.properties.fill = theme.colors?.primary || "#000000";
      }

      if (el.element_type === "image") {
        element.properties.imageSrc = roleContent; // AI should generate URL/base64
        element.properties.cornerRadius = theme.shapes?.cornerRadius || 0;
      }

      if (el.element_type === "shape") {
        element.properties.fill = theme.colors?.accent || "#E5E7EB";
      }

      return element;
    })
  };
}

module.exports = { mapContentToLayout };
