const Presentation = require("../models/Presentation");
const User = require("../models/User");
const getPresentationHandler = async (req, res) => {
  try {
    const { presentation_id } = req.params;
    const presentation = await Presentation.findOne({ presentation_id });
    if (!presentation) {
      return res.status(404).json({ error: "Presentation not found" });
    }
    return res.json(presentation);
  } catch (err) {
    console.error("Error retrieving presentation:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
};

const exportPresentationHandler = async (req, res) => {
  try {
    const { presentation_id } = req.params;
    const user = await User.findById(req.userId);

    const presentation = await Presentation.findOne({ presentation_id });
    if (!presentation) {
      return res.status(404).json({ error: "Presentation not found" });
    }

    // Your export logic here (e.g., generate PDF, return file, etc.)
    return res.json({ message: "Export successful (implement your logic here)" });
  } catch (err) {
    console.error("Error exporting presentation:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
};
const createPresentationHandler = async (req, res) => {
  try {
    const { topic, slides } = req.body;
    const userId = req.userId; // May be undefined for anonymous users

    const newPresentation = new Presentation({
      topic,
      slides,
      user: userId || null, // Set user to null if not authenticated
    });

    await newPresentation.save();

    // If user is authenticated, add presentation_id to User's presentations array
    if (userId) {
      await User.findByIdAndUpdate(
        userId,
        {
          $addToSet: { presentations: newPresentation.presentation_id }, // Add presentation_id to array
          $set: { currentPresentationId: newPresentation.presentation_id }, // Update current presentation
        },
        { new: true }
      );
    }

    res.status(201).json(newPresentation);
  } catch (err) {
    console.error("Error creating presentation:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};


module.exports = { getPresentationHandler, exportPresentationHandler, createPresentationHandler };