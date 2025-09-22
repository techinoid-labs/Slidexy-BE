const {
  createCheckoutSession,
  verifyWebhookSignature,
  getSession,
} = require("../services/stripe/stripeService");
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PricingPlan = require("../models/PricingPlan");
const User = require("../models/User");
const Subscription = require("../models/Subscription");

/**
 * Create Checkout Session
 */
async function createCheckoutSessionHandler(req, res) {
  try {
    const { plan, userId } = req.body;

    const dbPlan = await PricingPlan.findOne({ name: plan, isActive: true });
    if (!dbPlan) {
      return res.status(400).json({ error: "Invalid or inactive plan" });
    }

    // Create checkout session with user + plan metadata
    const session = await createCheckoutSession(dbPlan.stripePriceId, {
      userId,
      priceId: dbPlan.stripePriceId,
      // billingPeriod: dbPlan.billingPeriod,
      // name: dbPlan.name,
      // price: dbPlan.price,
    });

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
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const stripePriceId = session.metadata?.priceId;
        const stripeSubscriptionId = session.subscription;
        const stripeCustomerId = session.customer;

        const user = await User.findById(userId);
        const plan = await PricingPlan.findOne({ stripePriceId });

        if (!user || !plan) break;

        const stripeSub = await stripe.subscriptions.retrieve(
          stripeSubscriptionId
        );

        const startDate = stripeSub.items.data[0].created;
        const currentPeriodStart = stripeSub.items.data[0].current_period_start;
        const currentPeriodEnd = stripeSub.items.data[0].current_period_end;

        const createdSubData = {
          user: user._id,
          plan: plan._id,
          planSnapshot: {
            name: plan.name,
            price: plan.price,
            currency: plan.currency,
            billingPeriod: plan.billingPeriod,
          },
          stripeSubscriptionId,
          stripeCustomerId,
          stripePriceId,
          status: stripeSub.status,
          startDate: startDate ? new Date(startDate * 1000) : undefined,
          currentPeriodStart: currentPeriodStart
            ? new Date(currentPeriodStart * 1000)
            : undefined,
          currentPeriodEnd: currentPeriodEnd
            ? new Date(currentPeriodEnd * 1000)
            : undefined,
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          endDate: stripeSub.cancel_at
            ? new Date(stripeSub.cancel_at * 1000)
            : undefined,
        };

        const subscription = await Subscription.create(createdSubData);

        user.pricingPlan = plan._id;
        await user.save();

        console.log("✅ Subscription created with snapshot:", subscription._id);
        break;
      }

      case "customer.subscription.created": {
        const stripeSub = event.data.object;

        await Subscription.create({
          user: user._id, // you’ll need to map customer → user here
          plan: plan._id,
          stripeSubscriptionId: stripeSub.id,
          stripeCustomerId: stripeSub.customer,
          stripePriceId: stripeSub.items.data[0].price.id,
          status: stripeSub.status,
          startDate: startDate ? new Date(startDate * 1000) : undefined,
          currentPeriodStart: currentPeriodStart
            ? new Date(currentPeriodStart * 1000)
            : undefined,
          currentPeriodEnd: currentPeriodEnd
            ? new Date(currentPeriodEnd * 1000)
            : undefined,
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          endDate: stripeSub.cancel_at
            ? new Date(stripeSub.cancel_at * 1000)
            : undefined,
        });

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;

        await Subscription.findOneAndUpdate(
          { stripeSubscriptionId: subscription.id },
          { status: "canceled", endDate: new Date() }
        );

        console.log("❌ Subscription canceled:", subscription.id);
        break;
      }

      default:
        console.log(`⚠️ Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
}

/**
 * Get Checkout Session Info
 */
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
