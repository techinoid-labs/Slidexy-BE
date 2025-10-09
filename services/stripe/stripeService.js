const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Checkout Session
 */
// async function createCheckoutSession(priceId, email, metadata = {}) {
//   // console.log({ priceId, metadata, email });

//   return await stripe.checkout.sessions.create({
//     mode: "subscription",
//     payment_method_types: ["card"],
//     line_items: [{ price: priceId, quantity: 1 }],
//     customer_email: email,
//     billing_address_collection: "auto",
//     subscription_data: {
//       metadata,
//     },
//     metadata,
//     success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
//     cancel_url: `${process.env.FRONTEND_URL}/pricing`,
//   });
// }
async function createCheckoutSession(priceId, email, metadata = {}) {
  // Try to find an existing customer by email
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  let customerId;
  if (existingCustomers.data.length > 0) {
    customerId = existingCustomers.data[0].id;
    console.log(`✅ Reusing existing Stripe customer: ${customerId}`);
  } else {
    const newCustomer = await stripe.customers.create({ email });
    customerId = newCustomer.id;
    console.log(`🆕 Created new Stripe customer: ${customerId}`);
  }

  // Create checkout session
  return await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    billing_address_collection: "auto",
    subscription_data: {
      metadata,
    },
    metadata,
    success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/pricing`,
  });
}

/**
 * Cancel a subscription at period end
 */
async function cancelSubscriptionAtPeriodEnd(stripeSubscriptionId) {
  return await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
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
  cancelSubscriptionAtPeriodEnd,
};
