const mongoose = require("mongoose");
const crypto = require("crypto");

const textElementSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => crypto.randomUUID() },
    element_id: String,
    element_type: { type: String },
    text: { type: String, required: true },
  },
  { _id: false }
);

const imagePlaceholderSchema = new mongoose.Schema(
  {
    x: { type: Number, default: 520 },
    y: { type: Number, default: 40 },
    width: { type: Number, default: 400 },
    height: { type: Number, default: 460 }
  },
  { _id: false }
);

const slideSchema = new mongoose.Schema(
  {
    slide_id: { type: String, required: true, default: () => `slide-${crypto.randomUUID()}` },
    layout_type: { type: String, default: 'content-right-image' },
    content_type: { type: String, default: 'general' }, // e.g., 'bullet-heavy', 'quote'
    visual_suggestion: { type: String, default: '' },
    knowledge: { type: mongoose.Schema.Types.Mixed, default: {} },
    art_style: { type: String, default: 'modern illustration with characters' },
    art_palette: [{ type: String }],
    slide_title: {
      type: new mongoose.Schema({
        text: { type: String, required: true }
      }),
      // Not required: a block slide keeps its heading inside `block_spec`.
      // The controller mirrors that heading here so list views and search
      // keep working, but an empty one must not reject the whole save.
      required: false
    },
    subtitle: {
      type: new mongoose.Schema({
        text: String
      })
    },
    elements: { type: mongoose.Schema.Types.Mixed, default: [] },

    /**
     * Block-template slide document: `{ layout, theme, blocks[] }`.
     *
     * Mixed rather than a spelled-out schema on purpose. The block library
     * gains types regularly, and Mongoose silently DROPS any path it does
     * not know -- which would save a template slide as an empty shell and
     * lose the user's work with no error anywhere.
     */
    block_spec: { type: mongoose.Schema.Types.Mixed, default: null },

    /** Pre-generated legacy variants, kept so old decks still open. */
    layouts: { type: mongoose.Schema.Types.Mixed, default: undefined },
    quote: { type: String, default: null },
    author: { type: String, default: null },
    context: { type: String, default: null },
    image_url: { type: String, default: null },
    image_mobile_url: { type: String, default: null },
    image_caption: { type: String, default: "" },
    image_placeholder: { type: imagePlaceholderSchema, default: {} },
    content_metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: { bullet_count: 0, has_quote: false, has_data: false }
    },
    slide_number: { type: Number, required: true },
    total_slides: { type: Number, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
  },
  // strict:false keeps unknown slide fields instead of dropping them, so a
  // frontend that adds a field does not silently lose data before the
  // schema catches up.
  { _id: false, strict: false }
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
  slide_count: { type: Number, required: true },
  template_used: { type: String, default: "text-only" },
  /** Catalogue id of the block template applied to the deck, if any. */
  block_template_id: { type: String, default: null },
  /** Shown in the top bar and used as the export filename. */
  title: { type: String, default: null },
  art_style: { type: String, default: "modern illustration with characters" },
  art_palette: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Presentation", presentationSchema);