/**
 * Generate Infographic Explainer Service
 * 
 * Specialized infographic generation service for explainer videos.
 * This is a separate service from generateInfographicV2Service.js that supports
 * explicit color scheme passing for consistent video theming.
 * 
 * Features:
 * - Template-based rendering (7 templates: cards, timeline, comparison, hierarchy, chart, list, rich-layout)
 * - Explicit color scheme control (techBlue, forestGreen, etc.)
 * - Intelligent layout analysis based on content
 * - Consistent visual quality and design
 * - Support for multiple view modes (landscape, portrait)
 * - Robust error handling with retry logic
 * 
 * Architecture:
 * User Input → Layout Analysis → Content Generation (with forced color scheme) → Template Rendering → HTML Output
 */

const templateSystemService = require('./infographic-template-system');

class GenerateInfographicExplainerService {
  constructor() {
    this.templateService = templateSystemService;
  }

  /**
   * Main method to generate infographic with explicit color scheme
   * @param {string} topic - The topic/prompt for the infographic
   * @param {string} viewMode - 'landscape' or 'portrait' (default: 'landscape')
   * @param {object} options - Additional options (colorScheme, etc.)
   * @returns {Promise<object>} { data, html, meta }
   */
  async generateInfographic(topic, viewMode = 'landscape', options = {}) {
    try {
      if (!topic || typeof topic !== 'string') {
        throw new Error('Topic must be a non-empty string');
      }

      console.log(`\n🎨 [GenerateInfographicExplainerService] Starting infographic generation`);
      console.log(`📌 Topic: "${topic.substring(0, 60)}..."`);
      console.log(`📱 View Mode: ${viewMode}`);
      if (options.colorScheme) {
        console.log(`🎨 Color Scheme: ${options.colorScheme}`);
      }

      // Use the new template-based system with color scheme support
      const result = await this.templateService.generateInfographic(topic, viewMode, options);

      console.log(`✅ [GenerateInfographicExplainerService] Infographic generated successfully`);

      return result;
    } catch (error) {
      console.error(`❌ [GenerateInfographicExplainerService] Error:`, error.message);
      throw error;
    }
  }

  /**
   * Generate infographic with custom parameters
   * @param {string} topic - The topic
   * @param {object} customParams - Custom parameters { viewMode, colorScheme, style, colors, etc }
   * @returns {Promise<object>} { data, html, meta }
   */
  async generateWithParams(topic, customParams = {}) {
    const {
      viewMode = 'landscape',
      colorScheme,
      ...otherParams
    } = customParams;

    // Pass colorScheme through options
    const options = { ...otherParams };
    if (colorScheme) {
      options.colorScheme = colorScheme;
    }

    return this.generateInfographic(topic, viewMode, options);
  }

  /**
   * Generate multiple view modes for the same topic with consistent color scheme
   * @param {string} topic - The topic
   * @param {string[]} viewModes - Array of view modes
   * @param {string} colorScheme - Color scheme to use for all views
   * @returns {Promise<object>} { landscape, portrait, ... }
   */
  async generateMultiView(topic, viewModes = ['landscape', 'portrait'], colorScheme = null) {
    console.log(`\n📊 [GenerateInfographicExplainerService] Generating multiple views for: "${topic.substring(0, 40)}..."`);
    if (colorScheme) {
      console.log(`🎨 Using color scheme: ${colorScheme}`);
    }

    const results = {};

    for (const viewMode of viewModes) {
      try {
        const options = colorScheme ? { colorScheme } : {};
        const result = await this.generateInfographic(topic, viewMode, options);
        results[viewMode] = result;
        console.log(`✅ Generated ${viewMode} view`);
      } catch (error) {
        console.error(`❌ Failed to generate ${viewMode} view:`, error.message);
        results[viewMode] = {
          error: error.message,
          success: false,
        };
      }
    }

    return results;
  }

  /**
   * Get available layout types
   * @returns {object} Available layouts with descriptions
   */
  getAvailableLayouts() {
    return this.templateService.getAvailableLayouts();
  }

  /**
   * Get available templates
   * @returns {object} Available templates
   */
  getAvailableTemplates() {
    return this.templateService.getAvailableTemplates();
  }

  /**
   * Get available color schemes
   * @returns {string[]} Available color scheme names
   */
  getAvailableColorSchemes() {
    return [
      'techBlue',
      'forestGreen',
      'culinaryRed',
      'creativeViolet',
      'travelTeal',
      'academicYellow',
      'scienceBlue',
      'corporateGold',
      'medicalBlue'
    ];
  }

  /**
   * Get service information
   * @returns {object} Service metadata
   */
  getServiceInfo() {
    return {
      name: 'GenerateInfographicExplainerService',
      version: '1.0.0',
      description: 'Template-based infographic generation service for explainer videos with color scheme control',
      type: 'infographic-generator-explainer',
      features: [
        'template-based-rendering',
        'explicit-color-scheme-control',
        'layout-analysis',
        'content-generation',
        'multi-view-support',
        'error-handling-retry',
      ],
      templates: this.getAvailableTemplates(),
      layouts: this.getAvailableLayouts(),
      colorSchemes: this.getAvailableColorSchemes(),
    };
  }
}

module.exports = new GenerateInfographicExplainerService();
