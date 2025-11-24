// routes/templateRoutes.js - Template and layout variant management routes
const express = require("express");
const router = express.Router();
const {
  getAvailableSlideTypes,
  getVariantsForSlideType,
  getRecommendedSlideTypes,
  getAllSlideTypesWithVariants,
  getSlideConfiguration,
  generateLayoutVariantsForSlide
} = require("../services/layoutMapperService");

/**
 * GET /api/templates
 * Get all available slide types with their variants
 */
router.get("/", async (req, res) => {
  try {
    const templates = getAllSlideTypesWithVariants();
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch templates"
    });
  }
});

/**
 * GET /api/templates/:slideType/variants
 * Get all variants for a specific slide type
 */
router.get("/:slideType/variants", async (req, res) => {
  try {
    const { slideType } = req.params;
    const variants = getVariantsForSlideType(slideType);
    
    if (variants.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Slide type '${slideType}' not found`
      });
    }
    
    res.json({
      success: true,
      data: {
        slideType,
        variants
      }
    });
  } catch (error) {
    console.error("Error fetching variants:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch variants"
    });
  }
});

/**
 * GET /api/templates/recommended/:slideCount
 * Get recommended slide types for a specific slide count
 */
router.get("/recommended/:slideCount", async (req, res) => {
  try {
    const slideCount = parseInt(req.params.slideCount);
    
    if (![3, 5, 7, 10].includes(slideCount)) {
      return res.status(400).json({
        success: false,
        error: "Slide count must be 3, 5, 7, or 10"
      });
    }
    
    const recommendedTypes = getRecommendedSlideTypes(slideCount);
    
    res.json({
      success: true,
      data: {
        slideCount,
        recommendedTypes
      }
    });
  } catch (error) {
    console.error("Error fetching recommended types:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch recommended types"
    });
  }
});

/**
 * GET /api/templates/:slideType/:variantName
 * Get specific configuration for a slide type and variant
 */
router.get("/:slideType/:variantName", async (req, res) => {
  try {
    const { slideType, variantName } = req.params;
    
    const configuration = getSlideConfiguration(slideType, variantName);
    
    res.json({
      success: true,
      data: configuration
    });
  } catch (error) {
    console.error("Error fetching configuration:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/templates/generate-layouts
 * Generate layout variants for a slide
 */
router.post("/generate-layouts", async (req, res) => {
  try {
    const { slideType, slideData } = req.body;
    
    if (!slideType || !slideData) {
      return res.status(400).json({
        success: false,
        error: "slideType and slideData are required"
      });
    }
    
    const layoutVariants = generateLayoutVariantsForSlide(slideType, slideData);
    
    res.json({
      success: true,
      data: {
        slideType,
        layoutVariants
      }
    });
  } catch (error) {
    console.error("Error generating layout variants:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate layout variants"
    });
  }
});

module.exports = router;

