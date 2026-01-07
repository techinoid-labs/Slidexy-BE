/**
 * =============================================================================
 * WEBSITE GENERATOR ROUTES (FIXED)
 * =============================================================================
 */

const express = require("express");
const router = express.Router();

const websiteGeneratorController = require("../controllers/websiteGeneratorController");

const {
  healthCheck,
  generateWebsite,
  listGeneratedWebsites,
  getWebsiteById,
  generateTemplateWebsite
} = websiteGeneratorController;

router.get("/health", healthCheck);
router.post("/generate", generateWebsite);
router.post('/template-generate', websiteGeneratorController.generateTemplateWebsite);
router.post('/smart-generate', websiteGeneratorController.generateSmartWebsite);
router.post('/clone-generate', websiteGeneratorController.generateClone);

// FIXED: Removed extra "/website" — now matches dynamic and frontend
router.get("/:id", getWebsiteById);

module.exports = router;