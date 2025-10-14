const mongoose = require("mongoose");
const crypto = require("crypto");

const konvaComponentSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => crypto.randomUUID() },
    konva_component: { type: String, required: true },
    element_id: String,
    element_type: String,
    type: String,
    shape_id: String,
    properties: { type: mongoose.Schema.Types.Mixed, required: true },
    text: String,
    useThemeColor: Boolean,
  },
  { _id: false }
);

const blockSchema = new mongoose.Schema(
  {
    elements: [konvaComponentSchema],
    width: Number,
    height: Number,
  },
  { _id: false }
);
const slideSchema = new mongoose.Schema(
  {
    slide_id: { type: String, required: true, default: () => `slide-${crypto.randomUUID()}` },
    layout_type: { type: String, default: 'title-bullets' },
    visual_suggestion: { type: String, default: '' },
    knowledge: { type: mongoose.Schema.Types.Mixed, default: {} },
    art_style: { type: String, default: 'abstract surrealism' }, 
    art_palette: [{ type: String }], 
    slide_title: { type: konvaComponentSchema, required: true },
    elements: [konvaComponentSchema],
    image_url: { type: String, default: null },
    image_caption: { type: String, default: "" },
    titleBlock: blockSchema,
    textBlock: blockSchema,
    imageBlock: blockSchema,
    _initialState: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const presentationSchema = new mongoose.Schema({
  presentation_id: {
    type: String,
    required: true,
    default: () => crypto.randomUUID(),
  },
  topic: { type: String, required: true },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  slides: [slideSchema],
  createdAt: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Presentation", presentationSchema);
