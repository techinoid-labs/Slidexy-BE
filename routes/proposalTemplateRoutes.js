const express = require("express");
const router = express.Router();
const {
  getAllTemplates,
  getTemplateByName,
} = require("../controllers/proposalTemplateController");

router.get("/", getAllTemplates);
router.get("/:name", getTemplateByName);

module.exports = router;