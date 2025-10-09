const PricingPlan = require("../models/PricingPlan");

async function getPlans(req, res) {
  const { test } = req.query;
  try {
    let plans;
    if (test) {
      plans = await PricingPlan.find({ isTest: true }).sort({
        price: 1,
      });
    } else {
      plans = await PricingPlan.find({ isActive: true }).sort({
        price: 1,
      });
    }
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getPlans };
