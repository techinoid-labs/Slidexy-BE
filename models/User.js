const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  presentations: [{ type: String }],
  currentPresentationId: { type: String, default: null },
  pricingPlan: { type: mongoose.Schema.Types.ObjectId, ref: "PricingPlan", default: null }, 
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
