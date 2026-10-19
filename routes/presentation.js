const express = require("express");
const router = express.Router();
const {
  exportPresentationHandler,
  getPresentationHandler,
  updatePresentationHandler,
  createPresentationHandler,
  listMyPresentationsHandler,
} = require("../controllers/presentationController");
const auth = require("../middlewares/auth");

// Protected export route
router.get("/:presentation_id/export", auth, exportPresentationHandler);

// The signed-in user's own decks. Declared before "/:presentation_id" so the
// literal segment is not swallowed by the id parameter.
router.get("/mine/list", auth, listMyPresentationsHandler);

/**
 * Create a deck.
 *
 * The controller existed but was never routed, so a deck started from a
 * template had no server identity and could never be saved -- the editor
 * had nothing to PUT to. This is what gives it one.
 */
router.post("/", auth, createPresentationHandler);

router.get("/:presentation_id", getPresentationHandler);

// Saving requires an account: the handler records ownership on first save and
// refuses a deck that already belongs to someone else.
router.put("/:presentation_id", auth, updatePresentationHandler);

module.exports = router;
