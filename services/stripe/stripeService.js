const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Checkout Session
 */
async function createCheckoutSession(priceId) {
  return await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/pricing`,
  });
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(req) {
  const sig = req.headers["stripe-signature"];
  return stripe.webhooks.constructEvent(
    req.body, // raw buffer provided by express.raw
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}

/**
 * ✅ Get session by ID
 */
async function getSession(sessionId) {
  return await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription", "customer", "line_items.data.price.product"],
  });
}

module.exports = {
  createCheckoutSession,
  verifyWebhookSignature,
  getSession,
};
