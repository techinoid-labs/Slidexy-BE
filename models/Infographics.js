const mongoose = require("mongoose");

const infographicSchema = new mongoose.Schema({
  prompt: { type: String, required: true },
  viewMode: { type: String, default: "landscape" },
  type: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  data: { type: Object, required: true },
  html: { type: mongoose.Schema.Types.Mixed, default: {} },
  meta: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model("Infographic", infographicSchema);