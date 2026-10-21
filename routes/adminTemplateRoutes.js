const express = require("express");
const {
  listLayouts,
  setLayoutDisabled,
  ingestPptx,
  generateTemplate,
  previewPath,
  publishTemplate,
  discardTemplate,
} = require("../services/templatePipeline/adminCatalog");

const router = express.Router();

function send(handler) {
  return (req, res) => {
    Promise.resolve(handler(req, res)).catch((error) => {
      const status = error && error.status ? error.status : 500;
      res.status(status).json({ error: error && error.message ? error.message : "Request failed" });
    });
  };
}

router.get("/layouts", (req, res) => {
  res.json({ layouts: listLayouts() });
});

router.post("/generate-template", send(async (req, res) => {
  const result = await generateTemplate(req.body || {});
  res.json(result);
}));

router.get("/preview/:id/:name", (req, res) => {
  try {
    res.type("png").sendFile(previewPath(req.params.id, req.params.name));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.post("/upload-seed", express.raw({
  type: [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/octet-stream",
  ],
  limit: "120mb",
}), send(async (req, res) => {
  res.json(ingestPptx(req.body, req.query.name || ""));
}));

router.post("/disable-seed", send(async (req, res) => {
  const body = req.body || {};
  res.json(setLayoutDisabled(body.id, body.disabled !== false));
}));

router.post("/publish-template", send(async (req, res) => {
  res.json(publishTemplate(req.body && req.body.id));
}));

router.post("/discard-template", send(async (req, res) => {
  res.json(discardTemplate(req.body && req.body.id));
}));

module.exports = router;
