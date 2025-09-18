const express = require("express");
const router = express.Router();
const { getPlans } = require("../controllers/plansController");

router.get("/", getPlans);

module.exports = router;
