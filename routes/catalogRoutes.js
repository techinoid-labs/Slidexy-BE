const express = require("express");
const { listCatalog, readCatalog, slideFile, buildPptx } = require("../services/templatePipeline/catalog");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ decks: listCatalog() });
});

router.get("/:id/slides/:name", (req, res) => {
  try {
    res.type("png").sendFile(slideFile(req.params.id, req.params.name));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.get("/:id", (req, res) => {
  try {
    res.json(readCatalog(req.params.id));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.post("/:id/download", async (req, res) => {
  try {
    const file = await buildPptx(req.params.id);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    res.setHeader("Content-Disposition", "attachment; filename=\"" + file.filename + "\"");
    res.send(file.buffer);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

module.exports = router;
