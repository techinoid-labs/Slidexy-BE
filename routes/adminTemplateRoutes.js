const express = require("express");
const {
  listLayouts,
  setLayoutDisabled,
  ingestPptx,
  scoreLayout,
  generateTemplate,
  previewPath,
  pptxPath,
  ensurePptx,
  readReplacements,
  publishTemplate,
  discardTemplate,
  reviewConsole,
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

router.get("/download/:id", send(async (req, res) => {
  const file = await ensurePptx(req.params.id);
  res.download(file);
}));

router.get("/replacements/:id", send(async (req, res) => {
  res.json(readReplacements(req.params.id));
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

router.post("/score-seed", send(async (req, res) => {
  const body = req.body || {};
  res.json(await scoreLayout(body.id));
}));

router.post("/disable-seed", send(async (req, res) => {
  const body = req.body || {};
  res.json(setLayoutDisabled(body.id, body.disabled !== false));
}));

router.post("/publish-template", send(async (req, res) => {
  res.json(await publishTemplate(req.body && req.body.id));
}));

router.post("/discard-template", send(async (req, res) => {
  res.json(discardTemplate(req.body && req.body.id));
}));

router.get("/review/:id", send(async (req, res) => {
  res.json(reviewConsole.getReviewPayload(req.params.id));
}));

router.post("/review/:id", send(async (req, res) => {
  res.json(reviewConsole.submitReview(req.params.id, req.body || {}));
}));

router.get("/reviews", send(async (req, res) => {
  res.json({ reviews: reviewConsole.listReviews(), jobs: reviewConsole.listJobsForReview() });
}));

router.post("/replay/:id", send(async (req, res) => {
  res.json(await reviewConsole.replayReview(req.params.id));
}));

router.get("/gallery", send(async (req, res) => {
  res.json(await reviewConsole.getGallery());
}));

router.post("/gallery/flag", send(async (req, res) => {
  res.json(reviewConsole.setGalleryFlag(req.body || {}));
}));

router.get("/gallery/png/:name", (req, res) => {
  try {
    res.type("png").sendFile(reviewConsole.galleryPngPath(req.params.name));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.get("/panel", send(async (req, res) => {
  res.json(reviewConsole.getPanel());
}));

router.post("/panel/run", send(async (req, res) => {
  res.json(await reviewConsole.runPanel());
}));

router.post("/ppt-check", send(async (req, res) => {
  res.json(reviewConsole.setPptCheck(req.body || {}));
}));

router.get("/git-status", send(async (req, res) => {
  res.json(reviewConsole.gitDirtyCount());
}));

module.exports = router;
