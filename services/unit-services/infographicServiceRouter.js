/**
 * Infographic Service Router
 * 
 * Routes infographic generation requests to the appropriate service.
 * Can easily switch between v1 (old) and v2 (new template-based) systems.
 * 
 * Usage:
 * const router = require('./infographicServiceRouter');
 * 
 * // Use new system (default)
 * await router.generateInfographic(topic);
 * 
 * // Use old system
 * await router.generateInfographic(topic, { useV1: true });
 * 
 * // Use specific service
 * await router.useV2().generateInfographic(topic);
 * await router.useV1().generateInfographic(topic);
 */

const generateInfographicV2Service = require('./generateInfographicV2Service');
const generateInfographicV1Service = require('./getInfographicService');

class InfographicServiceRouter {
  constructor() {
    // Default to v2 (new template-based system)
    this.activeService = 'v2';
  }

  /**
   * Generate infographic - routes to appropriate service
   * @param {string} topic - The topic for the infographic
   * @param {object} options - Configuration options
   * @param {boolean} options.useV1 - Force use of V1 service
   * @param {boolean} options.useV2 - Force use of V2 service
   * @param {string} options.viewMode - 'landscape' or 'portrait'
   * @returns {Promise<object>} Infographic result
   */
  async generateInfographic(topic, options = {}) {
    const { useV1, useV2, ...otherOptions } = options;

    let service;
    if (useV1) {
      service = generateInfographicV1Service;
    } else if (useV2 || this.activeService === 'v2') {
      service = generateInfographicV2Service;
    } else {
      service = generateInfographicV2Service;
    }

    if (service === generateInfographicV2Service) {
      return service.generateInfographic(topic, otherOptions.viewMode, otherOptions);
    } else {
      // V1 service
      return service.generateInfographic(topic, otherOptions);
    }
  }

  /**
   * Switch to V2 (template-based) service
   * @returns {object} V2 service instance
   */
  useV2() {
    this.activeService = 'v2';
    return generateInfographicV2Service;
  }

  /**
   * Switch to V1 (old) service
   * @returns {object} V1 service instance
   */
  useV1() {
    this.activeService = 'v1';
    return generateInfographicV1Service;
  }

  /**
   * Get current active service
   * @returns {string} 'v1' or 'v2'
   */
  getActiveService() {
    return this.activeService;
  }

  /**
   * Get both services
   * @returns {object} { v1, v2 }
   */
  getBothServices() {
    return {
      v1: generateInfographicV1Service,
      v2: generateInfographicV2Service,
    };
  }

  /**
   * Compare both services' capabilities
   * @returns {object} Service comparison
   */
  getServicesComparison() {
    return {
      v1: {
        name: 'getInfographicService (V1)',
        type: 'Full HTML Generation',
        status: 'Legacy',
        features: ['extensive-color-schemes', 'legacy-support'],
      },
      v2: {
        name: 'generateInfographicV2Service',
        type: 'Template-Based',
        status: 'Active (Recommended)',
        features: [
          'template-based-rendering',
          'layout-analysis',
          'content-generation',
          'multi-view-support',
          'error-handling-retry',
          'design-consistency',
        ],
      },
    };
  }
}

module.exports = new InfographicServiceRouter();
