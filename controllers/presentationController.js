const { EJSON } = require("bson");
// controllers/presentationController.js
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

module.exports = {
  getPresentationHandler,
  exportPresentationHandler,
  createPresentationHandler,
};