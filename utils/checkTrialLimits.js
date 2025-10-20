// utils/checkTrialLimits.js
const trialConfig = {
  imageDecks: 1,
  predefinedDecks: 2,
};

async function checkTrialLimits(user) {
  // Paid plan? no limits (just in case)

  // Initialize trial dates if missing
  if (!user.trialStart) {
    user.trialStart = new Date();
  }
  if (!user.trialEnd) {
    user.trialEnd = new Date(
      user.trialStart.getTime() + 3 * 24 * 60 * 60 * 1000
    );
  }

  // Trial expired
  if (Date.now() > user.trialEnd.getTime()) {
    return {
      allowed: false,
      message: "Your trial has expired. Please upgrade to continue.",
      code: "TRIAL_EXPIRED",
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

  //  Image deck quota
  if (user.imageDecksUsedToday < trialConfig.imageDecks) {
    user.imageDecksUsedToday += 1;
    await user.save();
    return { allowed: true, type: "image", code: "TRIAL_IMAGE_OK" };
  }

  //  Predefined deck quota
  if (user.predefinedDecksUsedToday < trialConfig.predefinedDecks) {
    user.predefinedDecksUsedToday += 1;
    await user.save();
    return { allowed: true, type: "predefined", code: "TRIAL_PREDEFINED_OK" };
  }

  // Both quotas exhausted
  return {
    allowed: false,
    message: "Trial daily limit reached for all deck types.",
    code: "TRIAL_LIMIT_REACHED",
  };
}

module.exports = { checkTrialLimits };
