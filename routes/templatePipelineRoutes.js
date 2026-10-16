const express = require("express");
const { listTemplates, readTemplate, createTemplate, reviewTemplate } = require("../services/templatePipeline/store");
const { runBatch } = require("../services/templatePipeline/pipeline");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ templates: listTemplates(req.query.status) });
});

router.post("/generate", async (req, res) => {
  try {
    const deck = await createTemplate(req.body && req.body.seed);
    return res.status(201).json(deck);
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
});

router.post("/batch", async (req, res) => {
  try {
    const count = req.body && req.body.count;
    return res.status(201).json(await runBatch(count));
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
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
