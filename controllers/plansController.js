const PricingPlan = require("../models/PricingPlan");
const mongoose = require("mongoose");

async function getPlans(req, res) {
  const { test } = req.query;
  try {
    let plans;
    if (test) {
      plans = await PricingPlan.find({ isTest: true }).sort({ price: 1 });
    } else {
      plans = await PricingPlan.find({ isActive: true }).sort({ price: 1 });
    }
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// New function: Fetch individual plan by ID

async function getPlanById(req, res) {
  const { id } = req.params;

  try {
    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Plan does not exist" });
    }

    // ✅ Fetch only active plan
    const plan = await PricingPlan.findOne({ _id: id, isActive: true });

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    res.status(200).json(plan);
  } catch (err) {
    console.error("Error fetching plan by ID:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { getPlans, getPlanById };
