const express = require("express");
const router = express.Router();
const { getTemplatePresentationHandler, exportTemplateHandler } = require("../controllers/templatePresentationController");

// Public — no auth needed for viewing shared template
router.get("/:template_id", getTemplatePresentationHandler);
router.get("/:template_id/export", exportTemplateHandler); // optional

module.exports = router;