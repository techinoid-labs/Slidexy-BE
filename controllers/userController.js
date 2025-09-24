const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Presentation = require("../models/Presentation");

const Subscription = require("../models/Subscription");

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
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    // .populate("pricingPlan");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const subscription = await Subscription.findOne({ user: user._id })
      .populate("plan")
      .sort({ createdAt: -1 });

    // Defaults
    let trialActive = false;
    let daysLeft = 0;
    let presentationsLeftToday = 0;

    const now = new Date();

    if (subscription && subscription.status === "active") {
      // ✅ User has an active plan, so ignore trial
      const plan = subscription.planSnapshot || subscription.plan;

      // Example: check if your PricingPlan schema defines daily limits
      const dailyLimit = plan.dailyLimit || 9999;

      // reset daily counter if date changed
      const today = new Date().toDateString();
      const lastDate = user.lastPresentationDate
        ? user.lastPresentationDate.toDateString()
        : null;

      let createdToday = user.presentationsCreatedToday;
      if (today !== lastDate) {
        createdToday = 0;
      }

      presentationsLeftToday = Math.max(dailyLimit - createdToday, 0);

      // Remaining days in current billing period
      if (subscription.currentPeriodEnd) {
        const diffTime =
          new Date(subscription.currentPeriodEnd).getTime() - now.getTime();
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    } else {
      // ✅ No active subscription, so fallback to trial
      if (user.trialEnd && now <= user.trialEnd) {
        trialActive = true;

        const diffTime = user.trialEnd.getTime() - now.getTime();
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const today = new Date().toDateString();
        const lastDate = user.lastPresentationDate
          ? user.lastPresentationDate.toDateString()
          : null;

        let createdToday = user.presentationsCreatedToday;
        if (today !== lastDate) {
          createdToday = 0;
        }

        presentationsLeftToday = Math.max(10 - createdToday, 0);
      }
    }

    res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      admin: user.admin,
      presentations: user.presentations,
      currentPresentationId: user.currentPresentationId,

      pricingPlan: subscription.stripePriceId,

      subscription: subscription
        ? {
            _id: subscription._id,
            stripeId: subscription.stripeSubscriptionId,
            status: subscription.status,
            plan: subscription.plan,
            planSnapshot: subscription.planSnapshot,
            startDate: subscription.startDate,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            endDate: subscription.endDate,
          }
        : null,

      trialActive,
      trialStart: user.trialStart,
      trialEnd: user.trialEnd,
      daysLeft,
      presentationsLeftToday,
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
