// models/Subscription.js
const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PricingPlan",
    required: true,
  },
  stripeSubscriptionId: { type: String, required: true, unique: true },
  stripeCustomerId: { type: String }, // store customer for lookup
  stripePriceId: { type: String }, // which price they subscribed to

  status: {
    type: String,
    enum: [
      "active",
      "canceled",
      "past_due",
      "incomplete",
      "incomplete_expired",
      "trialing",
      "unpaid",
    ],
    default: "active",
  },

  // period details (used for frontend restrictions)
  startDate: { type: Date, default: Date.now },
  currentPeriodStart: { type: Date },
  currentPeriodEnd: { type: Date },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  endDate: { type: Date },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
