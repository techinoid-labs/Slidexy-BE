// utils/checkUsageLimits.js
const Subscription = require("../models/Subscription");
const { checkTrialLimits } = require("./checkTrialLimits");

/**
 * Unified usage check:
 * - If active subscription → enforce paid plan limits
 * - Else → fallback to trial limits
 */
async function checkUsageLimits(user) {
  // 🔎 Look for an active subscription
  const subscription = await Subscription.findOne({
    user: user._id,
    status: "active",
  }).populate("plan");

  if (subscription) {
    // ✅ Paid user — enforce plan limits
    const plan = subscription.planSnapshot || subscription.plan;

    // If your plan schema includes dailyLimit, use it
    const dailyLimit = plan.dailyLimit || 9999;

    const today = new Date().toDateString();
    const lastDate = user.lastPresentationDate
      ? user.lastPresentationDate.toDateString()
      : null;

    if (today !== lastDate) {
      user.presentationsCreatedToday = 0;
      user.lastPresentationDate = new Date();
    }

    if (user.presentationsCreatedToday >= dailyLimit) {
      return {
        allowed: false,
        message: `Daily limit of ${dailyLimit} presentations reached for your plan.`,
      };
    }

    user.presentationsCreatedToday += 1;
    await user.save();

    return { allowed: true };
  }

  // ⬇️ No active subscription → fallback to trial enforcement
  return checkTrialLimits(user);
}

module.exports = { checkUsageLimits };
