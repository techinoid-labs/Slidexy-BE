// utils/checkTrialLimits.js
const User = require("../models/User");

async function checkTrialLimits(userId) {
  const user = await User.findById(userId);

  // If user has a pricing plan (paid), skip trial limits
  if (user.pricingPlan) return;

  // Set trialEnd if not set yet
  if (!user.trialEnd) {
    user.trialEnd = new Date(
      user.trialStart.getTime() + 7 * 24 * 60 * 60 * 1000
    );
  }

  // Expired trial?
  if (Date.now() > user.trialEnd.getTime()) {
    throw new Error("Trial expired. Please upgrade to continue.");
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
    throw new Error(
      "Daily trial limit reached. Try again tomorrow or upgrade your plan."
    );
  }

  // Increment counter
  user.presentationsCreatedToday += 1;
  await user.save();
}

module.exports = checkTrialLimits;
