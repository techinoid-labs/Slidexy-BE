const { templateJSONService } = require("../services/templateJSONService");

const generatePptTemplateHandler = async (req, res) => {
  try {
    const { topic, slideCount, meta = {} } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    // Call the new Gemini-based service
    const slidesArray = await templateJSONService(topic, meta, slideCount);

    // Validate that we received an array of slides
    if (!Array.isArray(slidesArray)) {
      return res.status(500).json({ error: "Invalid template format from AI" });
    }

    return res.json({ slides: slidesArray });
  } catch (err) {
    console.error("Error generating PPT template:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { generatePptTemplateHandler };
