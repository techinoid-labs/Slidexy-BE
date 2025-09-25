// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  admin: Boolean,
  // stripeCustomerId: String,
  // stripeSubscriptionId: String,
  presentations: [{ type: String }],
  currentPresentationId: { type: String, default: null },
  pricingPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PricingPlan",
    default: null,
  },
  trialStart: { type: Date, default: Date.now },
  trialEnd: { type: Date },
  presentationsCreatedToday: { type: Number, default: 0 },
  imageDecksUsedToday: { type: Number, default: 0 },
  predefinedDecksUsedToday: { type: Number, default: 0 },
  lastPresentationDate: { type: Date },

  fingerprint: { type: String, index: true },
  ipAddress: String,

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
