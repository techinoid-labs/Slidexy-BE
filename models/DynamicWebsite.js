// models/DynamicWebsite.js
const mongoose = require('mongoose');

// models/DynamicWebsite.js → allow missing fields
const FileSchema = new mongoose.Schema({
  type: { type: String, enum: ['html', 'css', 'js', 'readme'], default: 'html' },
  content: { type: String, default: "" }
});
const DynamicWebsiteSchema = new mongoose.Schema({
  presentationId: { type: String, required: true, unique: true },
  topic: { type: String, required: true },
  sourceUrl: { type: String, required: true },
  folderName: { type: String, required: true, unique: true },
  files: [FileSchema], // ← Same as static
  presentation: {
    slide_count: Number,
    art_style: String,
    art_palette: [String],
    total_images: Number,
    total_headings: Number
  },
  zipUrl: { type: String },
  previewUrl: { type: String },
  sizeKB: { type: Number },
  generatedAt: { type: Date, default: Date.now },
  downloadedAt: { type: Date },
  downloadCount: { type: Number, default: 0 }
}, {
  timestamps: false // we control generatedAt manually
});

module.exports = mongoose.model('DynamicWebsite', DynamicWebsiteSchema);