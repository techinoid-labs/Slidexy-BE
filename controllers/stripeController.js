const {
  createCheckoutSession,
  verifyWebhookSignature,
  getSession,
  cancelSubscriptionAtPeriodEnd,
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
    const { plan, userId, email } = req.body;

    const dbPlan = await PricingPlan.findOne({ name: plan, isActive: true });
    if (!dbPlan) {
      return res.status(400).json({ error: "Invalid or inactive plan" });
    }

    // Create checkout session with user + plan metadata
    const session = await createCheckoutSession(dbPlan.stripePriceId, email, {
      userId,
      priceId: dbPlan.stripePriceId,
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error("Error creating Checkout Session:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Cancel Subscription (soft cancel)
 */
async function cancelSubscriptionHandler(req, res) {
  try {
    const { userId } = req.body;

    // Find the active subscription for this user
    const subscription = await Subscription.findOne({
      user: userId,
      status: "active",
    });

    if (!subscription) {
      return res.status(404).json({ error: "No active subscription found" });
    }

    // Tell Stripe to cancel at period end
    const cancelFeedback = await cancelSubscriptionAtPeriodEnd(
      subscription.stripeSubscriptionId
    );

    return res.json({
      success: true,
      message: "Subscription set to cancel at period end",
    });
  } catch (err) {
    console.error("Error canceling subscription:", err);
    // res.status(500).json({ error: err.message });
    res
      .status(500)
      .json({ error: "Failed to cancel your renewal, please try again" });
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

        // 🔍 1. Cancel any existing active subscriptions for this user
        const existingSubs = await Subscription.find({
          user: user._id,
          status: { $in: ["active", "trialing", "past_due", "incomplete"] },
        });

        for (const sub of existingSubs) {
          try {
            // Cancel on Stripe
            await stripe.subscriptions.update(sub.stripeSubscriptionId, {
              cancel_at_period_end: false,
            });
            await stripe.subscriptions.cancel(sub.stripeSubscriptionId);

            // Update DB
            await Subscription.findByIdAndUpdate(sub._id, {
              status: "canceled",
              endDate: new Date(),
            });

            console.log(
              `❌ Canceled old subscription ${sub.stripeSubscriptionId}`
            );
          } catch (err) {
            console.error(
              `⚠️ Failed to cancel old subscription ${sub.stripeSubscriptionId}:`,
              err.message
            );
          }
        }

        // 🔗 2. Create the new subscription in DB
        const stripeSub = await stripe.subscriptions.retrieve(
          stripeSubscriptionId
        );

        const startDate = stripeSub.items.data[0].created;
        const currentPeriodStart = stripeSub.items.data[0].current_period_start;
        const currentPeriodEnd = stripeSub.items.data[0].current_period_end;

        const createdSubData = {
          user: user._id,
          user_email: user.email,
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

        console.log("✅ New subscription created:", subscription._id);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        console.log("✅ Invoice payment succeeded:", invoice.id);

        await Subscription.findOneAndUpdate(
          { stripeSubscriptionId: invoice.subscription },
          {
            status: "active",
            currentPeriodStart: new Date(
              invoice.lines.data[0].period.start * 1000
            ),
            currentPeriodEnd: new Date(invoice.lines.data[0].period.end * 1000),
            cancelAtPeriodEnd: invoice.cancel_at_period_end,
          }
        );
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.log("❌ Invoice payment failed:", invoice.id);

        const userId = invoice.metadata?.userId;
        const stripePriceId = invoice.metadata?.priceId;

        const user = await User.findById(userId);
        const plan = await PricingPlan.findOne({ stripePriceId });

        if (!user || !plan) break;

        await Subscription.findOneAndUpdate(
          { stripeSubscriptionId: invoice.subscription },
          { status: stripePriceId.status }
        );

        break;
      }

      case "customer.subscription.updated": {
        const stripeSub = event.data.object;
        console.log("ℹ️ Subscription updated:", stripeSub.id);

        const currentPeriodStart = stripeSub.items.data[0].current_period_start;
        const currentPeriodEnd = stripeSub.items.data[0].current_period_end;

        const updated = await Subscription.findOneAndUpdate(
          { stripeSubscriptionId: stripeSub.id },
          {
            status: stripeSub.status,
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
            currentPeriodStart: new Date(currentPeriodStart * 1000),
            currentPeriodEnd: new Date(currentPeriodEnd * 1000),
          }
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        console.log("❌ Subscription canceled:", subscription.id);

        const mongoSub = await Subscription.findOneAndUpdate(
          { stripeSubscriptionId: subscription.id },
          {
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            status: subscription.status,
            endDate: new Date(),
          }
        );
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
  cancelSubscriptionHandler,
};
