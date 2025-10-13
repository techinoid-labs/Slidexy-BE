const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: false,
    },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: "PricingPlan" },
    stripePriceId: { type: String },
    stripeInvoiceId: { type: String, required: true, unique: true },
    stripePaymentIntentId: { type: String },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    amountDue: { type: Number, required: true },
    amountPaid: { type: Number, required: true },
    currency: { type: String, default: "usd" },
    status: { type: String },
    discount: {
      percentOff: { type: Number, default: null },
      amountOff: { type: Number, default: null },
      couponId: { type: String, default: null },
      promotionCode: { type: String, default: null },
    },
    lines: [
      {
        description: String,
        amount: Number,
        currency: String,
        periodStart: Date,
        periodEnd: Date,
      },
    ],
    hostedInvoiceUrl: { type: String },
    invoicePdf: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", InvoiceSchema);
