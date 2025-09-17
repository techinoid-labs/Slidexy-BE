const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // optional link
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Contact", contactSchema);
