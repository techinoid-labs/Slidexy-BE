const mongoose = require("mongoose");

const infographicSchema = new mongoose.Schema({
  prompt: { type: String, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String },
  data: { type: Object, required: true },
  html: { type: String },
  meta: { type: Object },
}, { timestamps: true });

module.exports = mongoose.model("Infographic", infographicSchema);