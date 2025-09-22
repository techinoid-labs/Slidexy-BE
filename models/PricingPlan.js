const mongoose = require("mongoose");

const pricingPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  stripePriceId: { type: String, required: true },
  price: { type: Number, required: true },
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
