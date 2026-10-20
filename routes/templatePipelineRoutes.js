const express = require("express");
const { listTemplates, readTemplate, reviewTemplate } = require("../services/templatePipeline/store");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ templates: listTemplates(req.query.status) });
});

router.post("/:id/review", (req, res) => {
  try {
    const deck = reviewTemplate(req.params.id, req.body && req.body.status);
    if (!deck) return res.status(404).json({ error: "Template not found" });
    return res.json({ id: deck.id, status: deck.status });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
});

router.get("/:id", (req, res) => {
  const deck = readTemplate(req.params.id);
  if (!deck) return res.status(404).json({ error: "Template not found" });
  return res.json(deck);
});

module.exports = router;
