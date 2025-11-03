// services/layoutMapperService.js - Layout mapping and variant selection service
const { SLIDE_TEMPLATES } = require("../utils/slideTemplate");

/**
 * Get all available slide types
 */
function getAvailableSlideTypes() {
  return Object.keys(SLIDE_TEMPLATES);
}

/**
 * Get all variants for a specific slide type
 */
function getVariantsForSlideType(slideType) {
  const template = SLIDE_TEMPLATES[slideType];
  if (!template) return [];
  
  return Object.keys(template.variants).map(variantName => ({
    name: variantName,
    displayName: template.variants[variantName].name,
    description: template.variants[variantName].description || template.description
  }));
}

/**
 * Get a specific variant for a slide type
 */
function getVariantForSlideType(slideType, variantName) {
  const template = SLIDE_TEMPLATES[slideType];
  if (!template || !template.variants[variantName]) {
    return null;
  }
  
  return template.variants[variantName];
}

/**
 * Get recommended slide types for a given slide count
 */
function getRecommendedSlideTypes(slideCount) {
  const recommendations = {
    3: ["cover-hero", "content-right-image", "conclusion"],
    5: ["cover-hero", "content-right-image", "content-left-image", "content-split", "call-to-action"],
    7: ["cover-hero", "content-right-image", "content-left-image", "content-split", "quote-slide", "data-visual", "conclusion"],
    10: ["cover-hero", "content-right-image", "content-left-image", "content-split", "quote-slide", "data-visual", "content-right-image", "content-left-image", "content-split", "conclusion"]
  };
  
  return recommendations[slideCount] || recommendations[3];
}

/**
 * Get slide type for a specific position in a presentation
 */
function getSlideTypeForPosition(position, totalSlides) {
  const recommendations = getRecommendedSlideTypes(totalSlides);
  return recommendations[position] || "content-right-image";
}

/**
 * Get default variant for a slide type
 */
function getDefaultVariantForSlideType(slideType) {
  const template = SLIDE_TEMPLATES[slideType];
  if (!template) return null;
  
  const variantNames = Object.keys(template.variants);
  return variantNames[0] || null;
}

/**
 * Get all slide types with their variants for API response
 */
function getAllSlideTypesWithVariants() {
  const result = {};
  
  Object.keys(SLIDE_TEMPLATES).forEach(slideType => {
    const template = SLIDE_TEMPLATES[slideType];
    result[slideType] = {
      name: template.name,
      description: template.description,
      variants: getVariantsForSlideType(slideType)
    };
  });
  
  return result;
}

/**
 * Validate slide type and variant combination
 */
function validateSlideTypeAndVariant(slideType, variantName) {
  const template = SLIDE_TEMPLATES[slideType];
  if (!template) {
    return { valid: false, error: `Slide type '${slideType}' not found` };
  }
  
  if (!template.variants[variantName]) {
    return { valid: false, error: `Variant '${variantName}' not found for slide type '${slideType}'` };
  }
  
  return { valid: true };
}

/**
 * Get slide configuration for a specific type and variant
 */
function getSlideConfiguration(slideType, variantName) {
  const validation = validateSlideTypeAndVariant(slideType, variantName);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  const variant = getVariantForSlideType(slideType, variantName);
  return {
    slideType,
    variantName,
    configuration: variant,
    canvas: variant.canvas,
    structure: variant.structure
  };
}

/**
 * Generate layout variants for a slide
 */
function generateLayoutVariantsForSlide(slideType, slideData) {
  const template = SLIDE_TEMPLATES[slideType];
  if (!template) return [];
  
  const variants = [];
  Object.keys(template.variants).forEach(variantName => {
    const variant = template.variants[variantName];
    const layout = createLayoutFromVariant(variant, slideData);
    
    variants.push({
      name: variantName,
      displayName: variant.name,
      layout: layout,
      canvas: variant.canvas
    });
  });
  
  return variants;
}

/**
 * Create layout from variant template
 */
function createLayoutFromVariant(variant, slideData) {
  const layout = {
    elements: []
  };
  
  // Add title
  if (variant.structure.title && slideData.title) {
    layout.elements.push({
      konva_component: "Konva.Text",
      element_id: generateId(),
      element_type: "text",
      text: slideData.title,
      properties: {
        ...variant.structure.title.konva,
        id: `title-${generateId()}`
      }
    });
  }
  
  // Add subtitle
  if (variant.structure.subtitle && slideData.subtitle) {
    layout.elements.push({
      konva_component: "Konva.Text",
      element_id: generateId(),
      element_type: "text",
      text: slideData.subtitle,
      properties: {
        ...variant.structure.subtitle.konva,
        id: `subtitle-${generateId()}`
      }
    });
  }
  
  // Add bullets
  if (variant.structure.bullets && slideData.content?.length > 0) {
    const bulletConfig = variant.structure.bullets.konva;
    slideData.content.forEach((bullet, i) => {
      layout.elements.push({
        konva_component: "Konva.Text",
        element_id: generateId(),
        element_type: "bullet_point",
        text: `• ${bullet}`,
        properties: {
          x: bulletConfig.startX,
          y: bulletConfig.startY + (i * bulletConfig.spacing),
          width: bulletConfig.width,
          fontSize: bulletConfig.fontSize,
          fill: bulletConfig.fill,
          lineHeight: bulletConfig.lineHeight,
          id: `bullet-${i}-${generateId()}`
        }
      });
    });
  }
  
  // Add split bullets
  if (variant.structure.leftBullets && variant.structure.rightBullets) {
    const leftBullets = slideData.content?.slice(0, Math.ceil(slideData.content.length / 2)) || [];
    const rightBullets = slideData.content?.slice(Math.ceil(slideData.content.length / 2)) || [];
    
    const leftConfig = variant.structure.leftBullets.konva;
    leftBullets.forEach((bullet, i) => {
      layout.elements.push({
        konva_component: "Konva.Text",
        element_id: generateId(),
        element_type: "bullet_point",
        text: `• ${bullet}`,
        properties: {
          x: leftConfig.startX,
          y: leftConfig.startY + (i * leftConfig.spacing),
          width: leftConfig.width,
          fontSize: leftConfig.fontSize,
          fill: leftConfig.fill,
          lineHeight: leftConfig.lineHeight,
          id: `left-bullet-${i}-${generateId()}`
        }
      });
    });
    
    const rightConfig = variant.structure.rightBullets.konva;
    rightBullets.forEach((bullet, i) => {
      layout.elements.push({
        konva_component: "Konva.Text",
        element_id: generateId(),
        element_type: "bullet_point",
        text: `• ${bullet}`,
        properties: {
          x: rightConfig.startX,
          y: rightConfig.startY + (i * rightConfig.spacing),
          width: rightConfig.width,
          fontSize: rightConfig.fontSize,
          fill: rightConfig.fill,
          lineHeight: rightConfig.lineHeight,
          id: `right-bullet-${i}-${generateId()}`
        }
      });
    });
  }
  
  // Add CTA button
  if (variant.structure.cta && slideData.cta) {
    layout.elements.push({
      konva_component: "Konva.Label",
      element_id: generateId(),
      element_type: "cta_button",
      text: slideData.cta,
      properties: {
        ...variant.structure.cta.konva,
        id: `cta-${generateId()}`
      }
    });
  }
  
  // Add description
  if (variant.structure.description && slideData.description) {
    layout.elements.push({
      konva_component: "Konva.Text",
      element_id: generateId(),
      element_type: "text",
      text: slideData.description,
      properties: {
        ...variant.structure.description.konva,
        id: `description-${generateId()}`
      }
    });
  }
  
  return layout;
}

/**
 * Generate unique ID
 */
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

module.exports = {
  getAvailableSlideTypes,
  getVariantsForSlideType,
  getVariantForSlideType,
  getRecommendedSlideTypes,
  getSlideTypeForPosition,
  getDefaultVariantForSlideType,
  getAllSlideTypesWithVariants,
  validateSlideTypeAndVariant,
  getSlideConfiguration,
  generateLayoutVariantsForSlide,
  createLayoutFromVariant
};