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
  planSnapshot: {
    name: String,
    price: Number,
    currency: String,
    billingPeriod: String,
    description: String,
    features: [String],
  },

  stripeSubscriptionId: { type: String, required: true, unique: true },
  stripeCustomerId: { type: String },
  stripePriceId: { type: String },

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

  startDate: { type: Date, default: Date.now },
  currentPeriodStart: { type: Date },
  currentPeriodEnd: { type: Date },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  endDate: { type: Date },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
