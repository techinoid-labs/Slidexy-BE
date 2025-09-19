// const {
//   createCheckoutSession,
//   verifyWebhookSignature,
//   getSession,
// } = require("../services/stripe/stripeService");
// const User = require("../models/User");
// const Subscription = require("../models/Subscription");
// const PricingPlan = require("../models/PricingPlan");

// async function createCheckoutSessionHandler(req, res) {
//   try {
//     const { plan } = req.body;

//     const dbPlan = await PricingPlan.findOne({ name: plan, isActive: true });
//     if (!dbPlan) {
//       return res.status(400).json({ error: "Invalid or inactive plan" });
//     }

//     const session = await createCheckoutSession(dbPlan.stripePriceId);
//     return res.json({ url: session.url });
//   } catch (err) {
//     console.error("Error creating Checkout Session:", err);
//     res.status(500).json({ error: err.message });
//   }
// }

// /**
//  * Stripe Webhook
//  */
// async function webhookHandler(req, res) {
//   console.log("➡️ Stripe webhook received:", req.headers["stripe-signature"]);

//   try {
//     const event = verifyWebhookSignature(req);

//     switch (event.type) {
//       case "checkout.session.completed":
//         console.log("✅ Payment succeeded:", event.data.object.id);
//         break;
//       case "checkout.session.async_payment_failed":
//         console.log("❌ Payment failed:", event.data.object.id);
//         break;
//       default:
//         console.log(`Unhandled event type ${event.type}`);
//     }

//     res.json({ received: true });
//   } catch (err) {
//     console.error("❌ Webhook signature verification failed:", err.message);
//     res.status(400).send(`Webhook Error: ${err.message}`);
//   }
// }

// async function getSessionHandler(req, res) {
//   try {
//     const { id } = req.params;
//     const session = await getSession(id);

//     res.json({
//       id: session.id,
//       email: session.customer_details?.email,
//       plan:
//         session.subscription?.items?.data[0]?.price?.nickname ??
//         session.metadata?.plan ??
//         "Subscription",
//     });
//   } catch (err) {
//     console.error("Error retrieving session:", err);
//     res.status(500).json({ error: err.message });
//   }
// }

// module.exports = {
//   createCheckoutSessionHandler,
//   webhookHandler,
//   getSessionHandler,
// };

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
      // case "checkout.session.completed": {
      //   const session = event.data.object;
      //   console.log("✅ Payment succeeded:", session.id);

      //   const userId = session.metadata?.userId;
      //   const stripePriceId = session.metadata?.priceId;
      //   const stripeSubscriptionId = session.subscription;

      //   if (!userId || !stripePriceId) {
      //     console.error("⚠️ Missing metadata in checkout.session");
      //     break;
      //   }

      //   const user = await User.findById(userId);
      //   const plan = await PricingPlan.findOne({ stripePriceId });

      //   if (!user || !plan) {
      //     console.error("⚠️ User or plan not found for session:", session.id);
      //     break;
      //   }

      //   // Create subscription record
      //   const subscription = await Subscription.create({
      //     user: user._id,
      //     plan: plan._id,
      //     stripeSubscriptionId,
      //     status: "active",
      //     startDate: new Date(),
      //   });

      //   // Update user’s active plan
      //   user.pricingPlan = plan._id;
      //   await user.save();

      //   console.log("✅ Subscription created:", subscription._id);
      //   break;
      // }

      case "checkout.session.completed": {
        const session = event.data.object;
        console.log("✅ Payment succeeded:", session.id);

        const userId = session.metadata?.userId;
        const stripePriceId = session.metadata?.priceId;
        const stripeSubscriptionId = session.subscription;
        const stripeCustomerId = session.customer;

        if (!userId || !stripePriceId) {
          console.error("⚠️ Missing metadata in checkout.session");
          break;
        }

        const user = await User.findById(userId);
        const plan = await PricingPlan.findOne({ stripePriceId });

        if (!user || !plan) {
          console.error("⚠️ User or plan not found for session:", session.id);
          break;
        }

        // fetch subscription details from Stripe
        const stripeSub = await stripe.subscriptions.retrieve(
          stripeSubscriptionId
        );

        const subscription = await Subscription.create({
          user: user._id,
          plan: plan._id,
          stripeSubscriptionId,
          stripeCustomerId,
          stripePriceId,
          status: stripeSub.status,
          startDate: stripeSub.start_date
            ? new Date(stripeSub.start_date * 1000)
            : undefined,
          currentPeriodStart: stripeSub.current_period_start
            ? new Date(stripeSub.current_period_start * 1000)
            : undefined,
          currentPeriodEnd: stripeSub.current_period_end
            ? new Date(stripeSub.current_period_end * 1000)
            : undefined,
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          endDate: stripeSub.cancel_at
            ? new Date(stripeSub.cancel_at * 1000)
            : undefined,
        });

        // Update user’s active plan
        user.pricingPlan = plan._id;
        await user.save();

        console.log("✅ Subscription created:", subscription._id);
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
          startDate: stripeSub.start_date
            ? new Date(stripeSub.start_date * 1000)
            : undefined,
          currentPeriodStart: stripeSub.current_period_start
            ? new Date(stripeSub.current_period_start * 1000)
            : undefined,
          currentPeriodEnd: stripeSub.current_period_end
            ? new Date(stripeSub.current_period_end * 1000)
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
