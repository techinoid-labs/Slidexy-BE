/**
 * =============================================================================
 * WEBSITE GENERATOR ROUTES (FIXED)
 * =============================================================================
 */

const express = require("express");
const router = express.Router();

const {
  healthCheck,
  generateWebsite,
  listGeneratedWebsites,
  getWebsiteById,
} = require("../controllers/websiteGeneratorController");

router.get("/health", healthCheck);
router.post("/generate", generateWebsite);
router.get("/list", listGeneratedWebsites);

// FIXED: Removed extra "/website" — now matches dynamic and frontend
router.get("/:id", getWebsiteById);

module.exports = router;