// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  admin: Boolean,
  presentations: [{ type: String }],
  currentPresentationId: { type: String, default: null },

  trialStart: { type: Date, default: Date.now },
  trialEnd: { type: Date },
  imageDecksUsedToday: { type: Number, default: 0 },
  predefinedDecksUsedToday: { type: Number, default: 0 },
  lastPresentationDate: { type: Date },

  fingerprint: { type: String, index: true },
  ipAddress: String,

  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },

  // LinkedIn Integration
  linkedinConnected: { type: Boolean, default: false },
  linkedinAccessToken: { type: String },
  linkedinRefreshToken: { type: String },
  linkedinTokenExpiry: { type: Date },
  linkedinProfile: {
    id: String,
    name: String,
    email: String,
    picture: String,
  },
  linkedinOAuthState: { type: String },
  linkedinOAuthStateExpiry: { type: Date },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
