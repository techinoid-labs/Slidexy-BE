const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");

// Public route (no auth required)
router.post("/", contactController.create);

// Protected route (only admins maybe)
router.get("/", contactController.getAll);

module.exports = router;
