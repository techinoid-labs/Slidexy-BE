// utils/checkPaidLimits.js
const planConfig = require("./plansConfig");

async function checkPaidLimits(user, subscription) {
  if (!user) {
    return {
      allowed: false,
      code: "USER_NOT_FOUND",
      message: "User not found",
    };
  }
  if (!subscription) {
    return {
      allowed: false,
      code: "NO_SUBSCRIPTION",
      message: "No active subscription",
    };
  }

  const now = new Date();

  // 🔑 Check validity period
  // if (subscription.startDate && subscription.startDate > now) {
  //   return {
  //     allowed: false,
  //     code: "SUBSCRIPTION_NOT_ACTIVE",
  //     message: "Your subscription is not yet active.",
  //   };
  // }
  if (subscription.currentPeriodEnd && subscription.currentPeriodEnd < now) {
    return {
      allowed: false,
      code: "SUBSCRIPTION_ENDED",
      message: "Your subscription period ended.",
    };
  }

  // Get plan config
  const plan = subscription.planSnapshot || subscription.plan;
  const config = planConfig[plan.billingPeriod] || {};

  // Reset daily counters if new day
  const today = new Date().toDateString();
  const lastDate = user.lastPresentationDate
    ? user.lastPresentationDate.toDateString()
    : null;

  if (today !== lastDate) {
    user.imageDecksUsedToday = 0;
    user.predefinedDecksUsedToday = 0;
    user.lastPresentationDate = new Date();
  }

  // 1️⃣ Image decks first
  if (user.imageDecksUsedToday < (config.imageDecks || 0)) {
    user.imageDecksUsedToday += 1;
    await user.save();
    return { allowed: true, type: "image" };
  }

  // 2️⃣ Then predefined decks
  if (user.predefinedDecksUsedToday < (config.predefinedDecks || 0)) {
    user.predefinedDecksUsedToday += 1;
    await user.save();
    return { allowed: true, type: "predefined" };
  }

  // 3️⃣ Both exhausted
  return {
    allowed: false,
    code: "SUBSCRIPTION_LIMIT_REACHED",
    message: "Daily deck limit reached for your subscription plan.",
  };
}

module.exports = { checkPaidLimits };
