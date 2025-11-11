// models/TemplatePresentation.js
const mongoose = require("mongoose");
const crypto = require("crypto");

// Flexible element schema - supports all your new layout needs
const elementSchema = new mongoose.Schema(
    {
        id: { type: String, default: () => crypto.randomUUID() },
        element_id: { type: String },
        element_type: {
            type: String,
            enum: [
                "title",
                "subtitle",
                "bullet_point",
                "quote",
                "author",
                "context",
                "stat",
                "description",
                "left_bullet",
                "right_bullet",
                "cta",
                "image",
                "shape",
                "background",
                "icon",
                "divider"
            ],
            required: true,
        },
        konva_component: { type: String }, // Konva.Text, Konva.Image, Konva.Rect, etc.
        text: { type: String }, // only required for text-based elements
        properties: { type: mongoose.Schema.Types.Mixed, default: {} },
        image_url: { type: String },
        placeholder: { type: Boolean, default: false },
    },
    { _id: false }
);

// Validate: text is required only for text-based elements
elementSchema.pre("validate", function (next) {
    const textRequired = [
        "title", "subtitle", "bullet_point", "quote", "author",
        "context", "stat", "description", "left_bullet", "right_bullet", "cta"
    ];
    if (textRequired.includes(this.element_type) && !this.text) {
        this.invalidate("text", "Text is required for this element type.");
    }
    next();
});

const slideSchema = new mongoose.Schema(
    {
        slide_id: {
            type: String,
            required: true,
            default: () => `slide-${crypto.randomUUID()}`,
        },
        slide_title: {
            type: new mongoose.Schema({
                text: { type: String, required: true },
                konva_component: { type: String, default: "Konva.Text" },
                element_type: { type: String, default: "title" },  // ← Add default
                properties: { type: mongoose.Schema.Types.Mixed },
            }),
        },
        elements: [elementSchema], // Now supports title, image, shape, etc.
        image_url: { type: String, default: null },
        image_caption: { type: String, default: "" },
        layout_type: { type: String, default: "content-right-image" },
        titleBlock: { type: mongoose.Schema.Types.Mixed },
        textBlock: { type: mongoose.Schema.Types.Mixed },
        imageBlock: { type: mongoose.Schema.Types.Mixed },
        slide_number: { type: Number },
        total_slides: { type: Number },
    },
    { _id: false }
);

const templatePresentationSchema = new mongoose.Schema({
    template_id: {
        type: String,
        required: true,
        default: () => crypto.randomUUID(),
    },
    topic: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    slides: [slideSchema],
    slide_count: { type: Number, required: true },
    template_used: { type: String, default: "flexible-layout-v2" },
    art_style: { type: String, default: "modern illustration with characters" },
    art_palette: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("TemplatePresentation", templatePresentationSchema);