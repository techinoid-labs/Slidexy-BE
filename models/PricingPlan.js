const mongoose = require("mongoose");

const pricingPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Basic, Exclusive, Platinum
  stripePriceId: { type: String, required: true }, // Stripe price_xxx
  price: { type: Number, required: true }, // 5, 9.99, 60
  currency: { type: String, default: "USD" },
  billingPeriod: {
    type: String,
    enum: ["weekly", "monthly", "yearly"],
    required: true,
  },
  description: { type: String },
  features: [{ type: String }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("PricingPlan", pricingPlanSchema);
