const express = require("express");
const aiAgentController = require("../controllers/aiAgentController");

const router = express.Router();

router.post("/intent", aiAgentController.getIntent);

module.exports = router;