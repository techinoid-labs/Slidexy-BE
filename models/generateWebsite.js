// models/GeneratedWebsite.js
const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  type: { type: String, enum: ['html', 'css', 'js', 'readme'], required: true },
  content: { type: String, required: true }
});

const GeneratedWebsiteSchema = new mongoose.Schema({
  presentationId: { type: String, required: true, unique: true },
  topic: { type: String, required: true },
  sourceUrl: { type: String, required: true },
  folderName: { type: String, required: true }, // e.g., download-1763656443987-b90314ca
  files: [FileSchema],
  presentation: {
    slide_count: Number,
    art_style: String,
    art_palette: [String],
    total_images: Number,
    total_headings: Number
  },
  zipUrl: { type: String }, // S3/DO Spaces ZIP URL
  previewUrl: { type: String }, // /website-codes/.../index.html (optional if served)
  sizeKB: { type: Number },
  generatedAt: { type: Date, default: Date.now },
  downloadedAt: { type: Date },
  downloadCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('GeneratedWebsite', GeneratedWebsiteSchema);