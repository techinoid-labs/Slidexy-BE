const Presentation = require("../models/Presentation");

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

module.exports = { getPresentationHandler };