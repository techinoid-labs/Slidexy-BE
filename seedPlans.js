require("dotenv").config();
const mongoose = require("mongoose");
const PricingPlan = require("./models/PricingPlan");

const plans = [
  {
    name: "Basic",
    stripePriceId: process.env.STRIPE_PRICE_BASIC, // price_1S8fUSBBWFsRd9chws4Vp2DB
    price: 5,
    billingPeriod: "weekly",
    description: "Great for getting started",
    features: [
      "Unlimited decks",
      "Style library access",
      "Branding customization",
      "Team collaboration",
      "Priority export formats",
    ],
  },
  {
    name: "Exclusive",
    stripePriceId: process.env.STRIPE_PRICE_EXCLUSIVE, // price_1S8fVbBBWFsRd9chwwXNqzmd
    price: 9.99,
    billingPeriod: "monthly",
    description: "Perfect for professionals",
    features: [
      "Unlimited decks",
      "Style library access",
      "Branding customization",
      "Team collaboration",
      "Priority export formats",
    ],
  },
  {
    name: "Platinum",
    stripePriceId: process.env.STRIPE_PRICE_PLATINUM, // price_1S8fWHBBWFsRd9chCnZ1H0l4
    price: 60,
    billingPeriod: "yearly",
    description: "Best value for long-term users",
    features: [
      "Unlimited decks",
      "Style library access",
      "Branding customization",
      "Team collaboration",
      "Priority export formats",
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await PricingPlan.deleteMany({});
    await PricingPlan.insertMany(plans);
    console.log("✅ Plans seeded successfully");
    process.exit();
  } catch (err) {
    console.error("❌ Error seeding plans:", err);
    process.exit(1);
  }
}

seed();
