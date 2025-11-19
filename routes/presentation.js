const express = require("express");
const router = express.Router();
const { exportPresentationHandler, getPresentationHandler, updatePresentationHandler, } = require("../controllers/presentationController");
const auth = require("../middlewares/auth");

// Protected export route
router.get("/:presentation_id/export", auth, exportPresentationHandler);

router.get("/:presentation_id", getPresentationHandler);
router.put("/:presentation_id", updatePresentationHandler);

module.exports = router;
