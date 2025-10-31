const express = require("express");
const {
  initiatePayment,
  handleResponse,
  handleIPN,
} = require("../controllers/jazzcash/jazzcashController");

const router = express.Router();

router.post("/initiate", initiatePayment);
router.post("/response", handleResponse);
router.post("/ipn", handleIPN);

module.exports = router;
