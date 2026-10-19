const { EJSON } = require("bson");
const Presentation = require("../models/Presentation");
const User = require("../models/User");
const mongoose = require("mongoose");
const crypto = require("crypto");

// Helper function to ensure quote slides have elements populated
function ensureQuoteSlideElements(slides) {
  return slides.map((slide) => {
    if (slide.layout_type === 'quote-slide' && (!slide.elements || slide.elements.length === 0)) {
      const qText = slide.quote || (slide.content_metadata && slide.content_metadata.quote);
      const aText = slide.author || (slide.content_metadata && slide.content_metadata.author);
      const cText = slide.context || (slide.content_metadata && slide.content_metadata.context);

      const elements = [];

      if (qText) {
        elements.push({
          id: crypto.randomUUID(),
          element_id: `element-${crypto.randomUUID()}`,
          element_type: 'quote',
          text: String(qText).trim(),
          konva_component: 'Konva.Text'
        });
      }

      if (aText) {
        elements.push({
          id: crypto.randomUUID(),
          element_id: `element-${crypto.randomUUID()}`,
          element_type: 'author',
          text: String(aText).trim(),
          konva_component: 'Konva.Text'
        });
      }

      if (cText) {
        elements.push({
          id: crypto.randomUUID(),
          element_id: `element-${crypto.randomUUID()}`,
          element_type: 'context',
          text: String(cText).trim(),
          konva_component: 'Konva.Text'
        });
      }

      if (elements.length > 0) {
        return {
          ...slide,
          elements
        };
      }
    }
    return slide;
  });
}

// Get a presentation by presentation_id (UUID)
const getPresentationHandler = async (req, res) => {
  try {
    const { presentation_id } = req.params;
    const cleanId = presentation_id.trim();

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cleanId)) {
      return res.status(400).json({ error: "Invalid presentation ID format" });
    }

    const presentation = await Presentation.findOne({ presentation_id: cleanId });
    if (!presentation) {
      return res.status(404).json({ error: "Presentation not found" });
    }

    // Ensure quote slides have elements populated
    const sanitizedSlides = ensureQuoteSlideElements(presentation.slides);

    return res.json({
      _id: presentation._id,
      presentation_id: presentation.presentation_id,
      topic: presentation.topic,
      title: presentation.title,
      block_template_id: presentation.block_template_id,
      slides: sanitizedSlides,
      meta: presentation.meta,
      user: presentation.user,
      createdAt: presentation.createdAt,
    });
  } catch (err) {
    console.error("Error retrieving presentation:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
};

// Export presentation (by MongoDB _id)
const exportPresentationHandler = async (req, res) => {
  try {
    const { presentation_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(presentation_id)) {
      return res.status(400).json({ error: "Invalid presentation ID format" });
    }

    const presentation = await Presentation.findById(presentation_id);
    if (!presentation) {
      return res.status(404).json({ error: "Presentation not found" });
    }

    return res.json({ message: "Export successful", presentation });
  } catch (err) {
    console.error("Error exporting presentation:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
};

// Create presentation (manual, non-AI)
const createPresentationHandler = async (req, res) => {
  try {
    let { topic, slides, meta } = req.body;

    // Convert any MongoDB Extended JSON ($oid, $date, etc.) into real JS values
    try {
      const parsed = EJSON.parse(JSON.stringify({ topic, slides, meta }));
      topic = parsed.topic;
      slides = parsed.slides;
      meta = parsed.meta;
    } catch (err) {
      console.error("EJSON parse error:", err.message);
    }

    const userId = req.userId || null;

    const newPresentation = new Presentation({
      topic,
      slides,
      meta,
      user: userId,
    });

    await newPresentation.save();

    if (userId) {
      await User.findByIdAndUpdate(
        userId,
        {
          $addToSet: { presentations: newPresentation._id },
          $set: { currentPresentationId: newPresentation._id },
        },
        { new: true }
      );
    }

    res.status(201).json({
      _id: newPresentation._id,
      presentation_id: newPresentation.presentation_id,
      topic: newPresentation.topic,
      slides: newPresentation.slides,
      meta: newPresentation.meta,
      user: newPresentation.user,
      createdAt: newPresentation.createdAt,
    });
  } catch (err) {
    console.error("Error creating presentation:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

//UPDATED: Update presentation with better validation and error handling
/** First heading text inside a block spec, if it has one. */
function headingOf(spec) {
  if (!spec || !Array.isArray(spec.blocks)) return null;
  const h = spec.blocks.find((b) => b && b.type === "heading");
  const text = h && h.title && h.title.text;
  return typeof text === "string" && text.trim() ? text.trim() : null;
}

const updatePresentationHandler = async (req, res) => {
  try {
    const { presentation_id } = req.params;
    const { slides, title, block_template_id } = req.body;

    console.log(`Updating presentation ${presentation_id} with ${slides?.length || 0} slides`);

    if (!presentation_id || !slides || !Array.isArray(slides)) {
      return res.status(400).json({ error: "Invalid request: presentation_id and slides array required" });
    }

    // Check for base64 images (which shouldn't be in the payload)
    const hasBase64Images = slides.some(slide => {
      if (slide.image_url && typeof slide.image_url === 'string') {
        return slide.image_url.startsWith('data:image');
      }
      return false;
    });

    if (hasBase64Images) {
      console.error("❌ Base64 images detected in payload - images should be uploaded to S3 first");
      return res.status(413).json({ 
        error: "Payload too large. Images must be uploaded to S3 first and only URLs should be sent." 
      });
    }

    const presentation = await Presentation.findOne({ presentation_id });
    if (!presentation) {
      return res.status(404).json({ error: "Presentation not found" });
    }

    // Ownership. A deck created before accounts existed has no owner, so the
    // first signed-in user to save it claims it; after that only they can.
    if (presentation.user && String(presentation.user) !== String(req.userId)) {
      return res.status(403).json({ error: "This presentation belongs to another account" });
    }
    if (!presentation.user) {
      presentation.user = req.userId;
    }

    // Ensure quote slides have elements populated before updating
    const sanitizedSlides = ensureQuoteSlideElements(slides);

    // Update slides with metadata
    presentation.slides = sanitizedSlides.map((slide, index) => {
      const next = {
        ...slide,
        slide_number: index + 1,
        total_slides: sanitizedSlides.length,
        updated_at: new Date(),
      };

      // A block slide keeps its heading inside block_spec. Mirror it into
      // slide_title so deck lists, search and the old export path still have
      // something to show.
      const heading = headingOf(next.block_spec);
      if (heading) {
        next.slide_title = { text: heading };
      }
      return next;
    });
    presentation.slide_count = sanitizedSlides.length;
    if (typeof title === "string") presentation.title = title;
    if (typeof block_template_id === "string" || block_template_id === null) {
      presentation.block_template_id = block_template_id;
    }
    presentation.updatedAt = new Date();
    presentation.updated_at = new Date();
    presentation.markModified("slides");

    await presentation.save();

    console.log(`✅ Successfully updated presentation ${presentation_id}`);

    return res.json({
      success: true,
      presentation_id: presentation.presentation_id,
      slides: presentation.slides,
      title: presentation.title,
      block_template_id: presentation.block_template_id,
      updated_at: presentation.updatedAt,
    });
  } catch (err) {
    console.error("Update error:", err);
    
    // Handle payload too large error
    if (err.name === 'PayloadTooLargeError' || err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        error: "Payload too large. Please ensure images are uploaded to S3 first." 
      });
    }
    
    return res.status(500).json({ error: "Server error: " + err.message });
  }
};

/**
 * The signed-in user's decks, newest first.
 *
 * Returns a summary per deck rather than the slides: a deck list that ships
 * every slide of every deck gets slow the moment someone has twenty of them.
 */
const listMyPresentationsHandler = async (req, res) => {
  try {
    const decks = await Presentation.find({ user: req.userId })
      .select("presentation_id topic title slide_count block_template_id createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean();

    return res.json({
      presentations: decks.map((d) => ({
        presentation_id: d.presentation_id,
        title: d.title || d.topic || "Untitled presentation",
        slide_count: d.slide_count || 0,
        block_template_id: d.block_template_id || null,
        created_at: d.createdAt,
        updated_at: d.updatedAt,
      })),
    });
  } catch (err) {
    console.error("List presentations error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getPresentationHandler,
  listMyPresentationsHandler,
  exportPresentationHandler,
  createPresentationHandler,
  updatePresentationHandler,
};