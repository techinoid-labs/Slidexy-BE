// utils/checkTrialLimits.js
const User = require("../models/User");
const FR_URL = process.env.FRONTEND_URL;
async function checkTrialLimits(user) {
  // If user has a paid plan, skip limits
  if (user.pricingPlan) {
    return { allowed: true };
  }

  // Initialize trialStart if missing
  if (!user.trialStart) {
    user.trialStart = new Date();
  }

  // Set trialEnd if not set yet
  if (!user.trialEnd) {
    user.trialEnd = new Date(
      user.trialStart.getTime() + 7 * 24 * 60 * 60 * 1000
    );
  }

  // Expired trial?
  if (Date.now() > user.trialEnd.getTime()) {
    return {
      allowed: false,
      message: `Your trial has expired, You can join our waiting list for upcomming news and feature, pricing updates:`,
    };
  }

  // Reset daily counter if it's a new day
  const today = new Date().toDateString();
  const lastDate = user.lastPresentationDate
    ? user.lastPresentationDate.toDateString()
    : null;

  if (today !== lastDate) {
    user.presentationsCreatedToday = 0;
    user.lastPresentationDate = new Date();
  }

  // Check daily limit
  if (user.presentationsCreatedToday >= 10) {
    return {
      allowed: false,
      message: `Daily trial limit reached. Try again tomorrow, You can also join our waiting list for upcomming news and feature: `,
    };
  }

  // Increment counter
  user.presentationsCreatedToday += 1;
  await user.save();

  return { allowed: true };
}

module.exports = { checkTrialLimits };
