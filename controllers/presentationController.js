const { EJSON } = require("bson");
const Presentation = require("../models/Presentation");
const User = require("../models/User");
const mongoose = require("mongoose");

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

    return res.json({
      _id: presentation._id,
      presentation_id: presentation.presentation_id,
      topic: presentation.topic,
      slides: presentation.slides,
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
const updatePresentationHandler = async (req, res) => {
  try {
    const { presentation_id } = req.params;
    const { slides } = req.body;

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

    // Update slides with metadata
    presentation.slides = slides.map((slide, index) => ({
      ...slide,
      slide_number: index + 1,
      total_slides: slides.length,
      updated_at: new Date(),
    }));
    presentation.slide_count = slides.length;
    presentation.updated_at = new Date();

    await presentation.save();

    console.log(`✅ Successfully updated presentation ${presentation_id}`);

    return res.json({
      success: true,
      presentation_id: presentation.presentation_id,
      slides: presentation.slides,
      updated_at: presentation.updated_at,
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

module.exports = {
  getPresentationHandler,
  exportPresentationHandler,
  createPresentationHandler,
  updatePresentationHandler,
};