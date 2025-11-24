/**
 * Unit Services - Infographic Generation Exports
 * 
 * Central export point for all infographic services.
 * Includes both V1 (legacy) and V2 (new template-based) services.
 * 
 * Usage:
 * const { infographicV2, infographicRouter } = require('./unit-services');
 * 
 * OR
 * 
 * const infographicV2 = require('./unit-services/generateInfographicV2Service');
 * const router = require('./unit-services/infographicServiceRouter');
 */

// V1 - Legacy service (kept for backward compatibility)
const infographicV1 = require('./getInfographicService');

// V2 - New template-based service (recommended)
const infographicV2 = require('./generateInfographicV2Service');

// Service router - easy switching between v1 and v2
const infographicRouter = require('./infographicServiceRouter');

// Other unit services
const getBulletsService = require('./getBulletsService');
const getDynamicInfographicService = require('./getDynamicInfographicService');
const getImagesService = require('./getImagesService');
const getInfographicService = require('./getInfographicService');
const getTitlesService = require('./getTitlesService');
const getVidGenImg = require('./getVidGenImg');

/**
 * Export all services
 */
module.exports = {
  // Infographic services
  infographicV1,           // Legacy (getInfographicService)
  infographicV2,           // New template-based (recommended)
  infographicRouter,       // Service router for easy switching

  // Keep direct exports for backward compatibility
  getInfographicService: infographicV1,
  generateInfographicV2Service: infographicV2,
  infographicServiceRouter: infographicRouter,

  // Other unit services
  getBulletsService,
  getDynamicInfographicService,
  getImagesService,
  getTitlesService,
  getVidGenImg,

  // Service metadata
  SERVICES_INFO: {
    v1: {
      name: 'getInfographicService',
      type: 'Full HTML Generation',
      status: 'Legacy',
      file: 'getInfographicService.js',
    },
    v2: {
      name: 'generateInfographicV2Service',
      type: 'Template-Based',
      status: 'Recommended',
      file: 'generateInfographicV2Service.js',
    },
    router: {
      name: 'infographicServiceRouter',
      type: 'Service Router',
      status: 'Active',
      file: 'infographicServiceRouter.js',
    },
  },
};
