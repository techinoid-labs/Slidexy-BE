const express = require("express");
const router = express.Router();
const glmImageController = require("../controllers/glmImageController");

router.post("/generate", glmImageController.generateGlmImage);

module.exports = router;
