const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Presentation = require("../models/Presentation");
const planConfig = require("../utils/plansConfig");
const Subscription = require("../models/Subscription");
const Invoice = require("../models/Invoice"); // 🧾 Add this

// Register
exports.register = async (req, res) => {
  try {
    const { email, password, presentationId, fingerprint } = req.body;
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    if (!fingerprint) {
      return res.status(400).json({ message: "Missing device fingerprint" });
    }

    // Block if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Block if fingerprint already used for trial
    const existingFingerprint = await User.findOne({
      fingerprint,
      pricingPlan: null,
    });
    if (existingFingerprint) {
      return res.status(403).json({
        message: `A free trial has already been used on this device. Please sign in using the registered email.`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword,
      admin: false,
      fingerprint,
      ipAddress: ip,
      presentations: presentationId ? [presentationId] : [],
      currentPresentationId: presentationId || null,
      trialStart: new Date(),
      trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    await user.save();

    // If presentationId is provided, link it
    if (presentationId) {
      await User.findByIdAndUpdate(
        user._id,
        {
          $addToSet: { presentations: presentationId },
          $set: { currentPresentationId: presentationId },
        },
        { new: true }
      );
      await Presentation.findOneAndUpdate(
        { presentation_id: presentationId },
        { user: user._id }
      );
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1y",
    });

    res.json({ token, userId: user._id, presentationId });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password, presentationId } = req.body; // Add presentationId to request body

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ error: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ error: "Invalid email or password" });

    // If presentationId is provided, add it to user's presentations
    if (presentationId) {
      await User.findByIdAndUpdate(
        user._id,
        {
          $addToSet: { presentations: presentationId },
          $set: { currentPresentationId: presentationId },
        },
        { new: true }
      );
      await Presentation.findOneAndUpdate(
        { presentation_id: presentationId },
        { user: user._id }
      );
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1y",
    });

    res.json({ token, userId: user._id, presentationId });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Get Profile
// exports.getProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.userId).select("-password");
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const subscription = await Subscription.findOne({
//       user: user._id,
//       // status: "active",
//     })
//       .populate("plan")
//       .sort({ createdAt: -1 });

//     const now = new Date();

//     // Defaults
//     let trialActive = false;
//     let trialDaysLeft = 0;
//     let trialImageDecksLeftToday = 0;
//     let trialPredefinedDecksLeftToday = 0;
//     let trialPlanConfig = null;

//     let subscriptionActive = false;
//     let subDaysLeft = 0;
//     let subImageDecksLeftToday = 0;
//     let subPredefinedDecksLeftToday = 0;
//     let activePlanConfig = null;

//     // -------------------------
//     // Subscription logic
//     // -------------------------
//     if (subscription) {
//       subscriptionActive = true;

//       const plan = subscription.planSnapshot || subscription.plan;
//       activePlanConfig = planConfig[plan.billingPeriod] || {};

//       const today = new Date().toDateString();
//       const lastDate = user.lastPresentationDate
//         ? user.lastPresentationDate.toDateString()
//         : null;

//       // reset counters if new day
//       let imageDecksUsed = user.imageDecksUsedToday || 0;
//       let predefinedDecksUsed = user.predefinedDecksUsedToday || 0;
//       if (today !== lastDate) {
//         imageDecksUsed = 0;
//         predefinedDecksUsed = 0;
//       }

//       // Remaining limits
//       subImageDecksLeftToday = Math.max(
//         (activePlanConfig.imageDecks || 0) - imageDecksUsed,
//         0
//       );

//       subPredefinedDecksLeftToday = Math.max(
//         (activePlanConfig.predefinedDecks || 0) - predefinedDecksUsed,
//         0
//       );

//       if (subscription.currentPeriodEnd) {
//         const diffTime =
//           new Date(subscription.currentPeriodEnd).getTime() - now.getTime();
//         subDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//       }
//     }

//     // -------------------------
//     // Trial logic (free plan)
//     // -------------------------
//     if (!subscriptionActive && user.trialEnd && now <= user.trialEnd) {
//       trialActive = true;
//       trialPlanConfig = planConfig["free"];

//       const diffTime = user.trialEnd.getTime() - now.getTime();
//       trialDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

//       const today = new Date().toDateString();
//       const lastDate = user.lastPresentationDate
//         ? user.lastPresentationDate.toDateString()
//         : null;

//       // reset counters if new day
//       let imageDecksUsed = user.imageDecksUsedToday || 0;
//       let predefinedDecksUsed = user.predefinedDecksUsedToday || 0;
//       if (today !== lastDate) {
//         imageDecksUsed = 0;
//         predefinedDecksUsed = 0;
//       }

//       // Remaining trial limits
//       trialImageDecksLeftToday = Math.max(
//         (trialPlanConfig.imageDecks || 0) - imageDecksUsed,
//         0
//       );

//       trialPredefinedDecksLeftToday = Math.max(
//         (trialPlanConfig.predefinedDecks || 0) - predefinedDecksUsed,
//         0
//       );
//     }

//     // -------------------------
//     // Response
//     // -------------------------
//     res.json({
//       _id: user._id,
//       email: user.email,
//       name: user.name,
//       admin: user.admin,
//       presentations: user.presentations,
//       currentPresentationId: user.currentPresentationId,

//       subscription: subscription
//         ? {
//             _id: subscription._id,
//             stripeId: subscription.stripeSubscriptionId,
//             status: subscription.status,
//             plan: subscription.plan,
//             // planSnapshot: subscription.planSnapshot,
//             startDate: subscription.startDate,
//             currentPeriodStart: subscription.currentPeriodStart,
//             currentPeriodEnd: subscription.currentPeriodEnd,
//             cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
//             endDate: subscription.endDate,
//           }
//         : null,

//       // Trial data
//       trial: {
//         active: trialActive,
//         start: user.trialStart,
//         end: user.trialEnd,
//         daysLeft: trialDaysLeft,
//         imageDecksLeftToday: trialImageDecksLeftToday,
//         predefinedDecksLeftToday: trialPredefinedDecksLeftToday,
//         config: trialPlanConfig,
//       },

//       // Subscription data
//       subscriptionUsage: {
//         active: subscriptionActive,
//         daysLeft: subDaysLeft,
//         imageDecksLeftToday: subImageDecksLeftToday,
//         predefinedDecksLeftToday: subPredefinedDecksLeftToday,
//         config: activePlanConfig,
//       },
//     });
//   } catch (err) {
//     console.error("Profile error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// };

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    // Find the latest subscription
    const subscription = await Subscription.findOne({ user: user._id })
      .populate("plan")
      .sort({ createdAt: -1 });

    const now = new Date();

    // Default trial + subscription flags
    let trialActive = false;
    let trialDaysLeft = 0;
    let trialImageDecksLeftToday = 0;
    let trialPredefinedDecksLeftToday = 0;
    let trialPlanConfig = null;

    let subscriptionActive = false;
    let subDaysLeft = 0;
    let subImageDecksLeftToday = 0;
    let subPredefinedDecksLeftToday = 0;
    let activePlanConfig = null;

    // --------------- SUBSCRIPTION LOGIC ---------------
    if (subscription) {
      subscriptionActive = true;

      const plan = subscription.planSnapshot || subscription.plan;
      activePlanConfig = planConfig[plan.billingPeriod] || {};

      const today = new Date().toDateString();
      const lastDate = user.lastPresentationDate
        ? user.lastPresentationDate.toDateString()
        : null;

      // Reset usage if new day
      let imageDecksUsed = user.imageDecksUsedToday || 0;
      let predefinedDecksUsed = user.predefinedDecksUsedToday || 0;
      if (today !== lastDate) {
        imageDecksUsed = 0;
        predefinedDecksUsed = 0;
      }

      subImageDecksLeftToday = Math.max(
        (activePlanConfig.imageDecks || 0) - imageDecksUsed,
        0
      );
      subPredefinedDecksLeftToday = Math.max(
        (activePlanConfig.predefinedDecks || 0) - predefinedDecksUsed,
        0
      );

      if (subscription.currentPeriodEnd) {
        const diffTime =
          new Date(subscription.currentPeriodEnd).getTime() - now.getTime();
        subDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }

    // --------------- TRIAL LOGIC ---------------
    if (!subscriptionActive && user.trialEnd && now <= user.trialEnd) {
      trialActive = true;
      trialPlanConfig = planConfig["free"];

      const diffTime = user.trialEnd.getTime() - now.getTime();
      trialDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const today = new Date().toDateString();
      const lastDate = user.lastPresentationDate
        ? user.lastPresentationDate.toDateString()
        : null;

      let imageDecksUsed = user.imageDecksUsedToday || 0;
      let predefinedDecksUsed = user.predefinedDecksUsedToday || 0;
      if (today !== lastDate) {
        imageDecksUsed = 0;
        predefinedDecksUsed = 0;
      }

      trialImageDecksLeftToday = Math.max(
        (trialPlanConfig.imageDecks || 0) - imageDecksUsed,
        0
      );
      trialPredefinedDecksLeftToday = Math.max(
        (trialPlanConfig.predefinedDecks || 0) - predefinedDecksUsed,
        0
      );
    }

    // --------------- INVOICE / PAYMENT DETAILS ---------------
    let latestInvoice = null;
    let discountedPrice = null;

    if (subscription) {
      latestInvoice = await Invoice.findOne({
        stripeSubscriptionId: subscription.stripeSubscriptionId,
      })
        .sort({ createdAt: -1 })
        .lean();

      if (latestInvoice) {
        // Convert Stripe cents → dollars
        const paid = latestInvoice.amountPaid;
        const due = latestInvoice.amountDue;

        // If discount applied
        if (
          latestInvoice.discount?.amountOff ||
          latestInvoice.discount?.percentOff
        ) {
          const planPrice =
            subscription.planSnapshot?.price || subscription.plan?.price || 0;
          if (latestInvoice.discount.percentOff) {
            discountedPrice =
              planPrice - planPrice * latestInvoice.discount.percentOff;
          } else if (latestInvoice.discount.amountOff) {
            discountedPrice = planPrice - latestInvoice.discount.amountOff;
          }
          if (discountedPrice < 0) discountedPrice = 0;
        } else {
          discountedPrice = paid;
        }

        // Round to 2 decimals
        discountedPrice = Number(discountedPrice.toFixed(2));
      }
    }

    // --------------- RESPONSE ---------------
    res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      admin: user.admin,
      presentations: user.presentations,
      currentPresentationId: user.currentPresentationId,

      subscription: subscription
        ? {
            _id: subscription._id,
            stripeId: subscription.stripeSubscriptionId,
            status: subscription.status,
            plan: subscription.plan,
            startDate: subscription.startDate,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            endDate: subscription.endDate,
          }
        : null,

      trial: {
        active: trialActive,
        start: user.trialStart,
        end: user.trialEnd,
        daysLeft: trialDaysLeft,
        imageDecksLeftToday: trialImageDecksLeftToday,
        predefinedDecksLeftToday: trialPredefinedDecksLeftToday,
        config: trialPlanConfig,
      },

      subscriptionUsage: {
        active: subscriptionActive,
        daysLeft: subDaysLeft,
        imageDecksLeftToday: subImageDecksLeftToday,
        predefinedDecksLeftToday: subPredefinedDecksLeftToday,
        config: activePlanConfig,
      },

      billing: latestInvoice
        ? {
            latestInvoice: {
              // id: latestInvoice.stripeInvoiceId,
              amountPaid: latestInvoice.amountPaid,
              currency: latestInvoice.currency.toUpperCase(),
              date: latestInvoice.createdAt,
              // discount: latestInvoice.discount,
              hostedInvoiceUrl: latestInvoice.hostedInvoiceUrl,
            },
            discountedPrice,
          }
        : null,
    });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, password } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (password) updates.password = await bcrypt.hash(password, 10);

    const user = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
    }).select("-password");
    res.json(user);
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.userId);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
