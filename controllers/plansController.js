const PricingPlan = require("../models/PricingPlan");

async function getPlans(req, res) {
  try {
    const plans = await PricingPlan.find({ isActive: true }).sort({ price: 1 });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getPlans };
