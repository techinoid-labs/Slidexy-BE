const express = require("express");
const router = express.Router();
const { exportPresentationHandler } = require("../controllers/presentationController");
const auth = require("../middlewares/auth");

// Protected export route
router.get("/:presentation_id/export", auth, exportPresentationHandler);

module.exports = router;
