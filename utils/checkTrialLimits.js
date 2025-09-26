// utils/checkTrialLimits.js
const trialConfig = {
  imageDecks: 1,
  predefinedDecks: 2,
};

async function checkTrialLimits(user) {
  // Paid plan? no limits
  if (user.pricingPlan) {
    return { allowed: true };
  }

  // Init trial dates if missing
  if (!user.trialStart) {
    user.trialStart = new Date();
  }
  if (!user.trialEnd) {
    user.trialEnd = new Date(
      user.trialStart.getTime() + 7 * 24 * 60 * 60 * 1000
    );
  }

  // Trial expired?
  if (Date.now() > user.trialEnd.getTime()) {
    return {
      allowed: false,
      message: "Your trial has expired. Please upgrade to continue.",
    };
  }

  // Reset daily counters if it’s a new day
  const today = new Date().toDateString();
  const lastDate = user.lastPresentationDate
    ? user.lastPresentationDate.toDateString()
    : null;

  if (today !== lastDate) {
    user.imageDecksUsedToday = 0;
    user.predefinedDecksUsedToday = 0;
    user.lastPresentationDate = new Date();
  }

  // Check image deck quota first
  if (user.imageDecksUsedToday < trialConfig.imageDecks) {
    user.imageDecksUsedToday += 1;
    await user.save();
    return { allowed: true, type: "image" };
  }

  // If image quota used, check predefined deck quota
  if (user.predefinedDecksUsedToday < trialConfig.predefinedDecks) {
    user.predefinedDecksUsedToday += 1;
    await user.save();
    return { allowed: true, type: "predefined" };
  }

  // Both quotas exhausted
  return {
    allowed: false,
    message: "Trial daily limit reached for all deck types.",
  };
}

module.exports = { checkTrialLimits };
