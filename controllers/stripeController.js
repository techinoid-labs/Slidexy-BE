const {
  createCheckoutSession,
  verifyWebhookSignature,
  getSession,
} = require("../services/stripe/stripeService");

const PricingPlan = require("../models/PricingPlan");

async function createCheckoutSessionHandler(req, res) {
  try {
    const { plan } = req.body;

    const dbPlan = await PricingPlan.findOne({ name: plan, isActive: true });
    if (!dbPlan) {
      return res.status(400).json({ error: "Invalid or inactive plan" });
    }

    const session = await createCheckoutSession(dbPlan.stripePriceId);
    return res.json({ url: session.url });
  } catch (err) {
    console.error("Error creating Checkout Session:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Stripe Webhook
 */
async function webhookHandler(req, res) {
  console.log("➡️ Stripe webhook received:", req.headers["stripe-signature"]);

  try {
    const event = verifyWebhookSignature(req);

    switch (event.type) {
      case "checkout.session.completed":
        console.log("✅ Payment succeeded:", event.data.object.id);
        break;
      case "checkout.session.async_payment_failed":
        console.log("❌ Payment failed:", event.data.object.id);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
}

async function getSessionHandler(req, res) {
  try {
    const { id } = req.params;
    const session = await getSession(id);

    res.json({
      id: session.id,
      email: session.customer_details?.email,
      plan:
        session.subscription?.items?.data[0]?.price?.nickname ??
        session.metadata?.plan ??
        "Subscription",
    });
  } catch (err) {
    console.error("Error retrieving session:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createCheckoutSessionHandler,
  webhookHandler,
  getSessionHandler,
};
