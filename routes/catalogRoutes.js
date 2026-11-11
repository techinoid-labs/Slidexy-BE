const express = require("express");
const path = require("path");
const { listCatalog, readCatalog, slideFile, photoFile, buildPptx } = require("../services/templatePipeline/catalog");
const { readManifest } = require("../services/templatePipeline/catalogManifest");

const router = express.Router();

router.get("/", (req, res) => {
  const decks = listCatalog();
  res.json({ decks, manifest: readManifest() });
});

router.get("/manifest", (req, res) => {
  res.json(readManifest());
});

router.get("/:id/slides/:name", (req, res) => {
  try {
    res.type("png").sendFile(slideFile(req.params.id, req.params.name));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.get("/:id/photos/:name", (req, res) => {
  try {
    const file = photoFile(req.params.id, req.params.name);
    res.type(path.extname(file).slice(1) || "png").sendFile(file);
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
