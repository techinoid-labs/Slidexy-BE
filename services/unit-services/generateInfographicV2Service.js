/**
 * Generate Infographic V2 Service
 * 
 * New integrated infographic generation service using the template-based system.
 * This replaces the old getInfographicService.js but keeps it intact.
 * 
 * Features:
 * - Template-based rendering (7 templates: cards, timeline, comparison, hierarchy, chart, list, rich-layout)
 * - Intelligent layout analysis based on content
 * - Consistent visual quality and design
 * - Support for multiple view modes (landscape, portrait)
 * - Robust error handling with retry logic
 * 
 * Architecture:
 * User Input → Layout Analysis → Content Generation → Template Rendering → HTML Output
 */

const templateSystemService = require('./infographic-template-system');

class GenerateInfographicV2Service {
  constructor() {
    this.templateService = templateSystemService;
  }

  /**
   * Main method to generate infographic
   * @param {string} topic - The topic/prompt for the infographic
   * @param {string} viewMode - 'landscape' or 'portrait' (default: 'landscape')
   * @param {object} options - Additional options
   * @returns {Promise<object>} { data, html, meta }
   */
  async generateInfographic(topic, viewMode = 'landscape', options = {}) {
    try {
      if (!topic || typeof topic !== 'string') {
        throw new Error('Topic must be a non-empty string');
      }

      console.log(`\n🎨 [GenerateInfographicV2Service] Starting infographic generation`);
      console.log(`📌 Topic: "${topic.substring(0, 60)}..."`);
      console.log(`📱 View Mode: ${viewMode}`);

      // Use the new template-based system
      const result = await this.templateService.generateInfographic(topic, viewMode);

      console.log(`✅ [GenerateInfographicV2Service] Infographic generated successfully`);

      return result;
    } catch (error) {
      console.error(`❌ [GenerateInfographicV2Service] Error:`, error.message);
      throw error;
    }
  }

  /**
   * Generate infographic with custom parameters
   * @param {string} topic - The topic
   * @param {object} customParams - Custom parameters { viewMode, style, colors, etc }
   * @returns {Promise<object>} { data, html, meta }
   */
  async generateWithParams(topic, customParams = {}) {
    const {
      viewMode = 'landscape',
      ...otherParams
    } = customParams;

    // For now, we'll use the standard flow, but this can be extended
    // to pass custom parameters to the template system in the future
    return this.generateInfographic(topic, viewMode, otherParams);
  }

  /**
   * Generate multiple view modes for the same topic
   * @param {string} topic - The topic
   * @param {string[]} viewModes - Array of view modes
   * @returns {Promise<object>} { landscape, portrait, ... }
   */
  async generateMultiView(topic, viewModes = ['landscape', 'portrait']) {
    console.log(`\n📊 [GenerateInfographicV2Service] Generating multiple views for: "${topic.substring(0, 40)}..."`);

    const results = {};

    for (const viewMode of viewModes) {
      try {
        const result = await this.generateInfographic(topic, viewMode);
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
   * Get service information
   * @returns {object} Service metadata
   */
  getServiceInfo() {
    return {
      name: 'GenerateInfographicV2Service',
      version: '2.0.0',
      description: 'Template-based infographic generation service',
      type: 'infographic-generator',
      features: [
        'template-based-rendering',
        'layout-analysis',
        'content-generation',
        'multi-view-support',
        'error-handling-retry',
      ],
      templates: this.getAvailableTemplates(),
      layouts: this.getAvailableLayouts(),
    };
  }
}

module.exports = new GenerateInfographicV2Service();
