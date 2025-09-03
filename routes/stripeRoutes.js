const express = require("express");
const router = express.Router();
const {
  createCheckoutSessionHandler,
  webhookHandler,
  getSessionHandler,
} = require("../controllers/stripeController");

// Create checkout session
router.post("/create-checkout-session", createCheckoutSessionHandler);

//Route for fetching session details
router.get("/session/:id", getSessionHandler);

// Webhook (must use raw body parser for Stripe)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  webhookHandler
);

module.exports = router;
