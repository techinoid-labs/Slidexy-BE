const mongoose = require("mongoose");

const pricingPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  price: { type: Number, required: true }, 
  currency: { type: String, default: "USD" },
  billingPeriod: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
  description: { type: String },
  features: [{ type: String }], 
  limits: {
    presentations: { type: Number, default: null }, 
    slidesPerPresentation: { type: Number, default: null },
    storageGB: { type: Number, default: null }
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("PricingPlan", pricingPlanSchema);
