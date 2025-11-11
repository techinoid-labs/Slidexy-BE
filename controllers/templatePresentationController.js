const TemplatePresentation = require("../models/TemplatePresentation");

// GET /template-presentation/:template_id
const getTemplatePresentationHandler = async (req, res) => {
  try {
    const { template_id } = req.params;
    const cleanId = template_id.trim();

    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cleanId)) {
      return res.status(400).json({ error: "Invalid template ID format" });
    }

    const presentation = await TemplatePresentation.findOne({ template_id: cleanId });

    if (!presentation) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Return full object — frontend expects this shape
    res.json(presentation);
  } catch (err) {
    console.error("Error fetching template:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const exportTemplateHandler = async (req, res) => {
  try {
    const { template_id } = req.params;
    const presentation = await TemplatePresentation.findOne({ template_id });
    if (! publicized) {
      return res.status(404).json({ error: "Template not found" });
    }
    res.json({ message: "Export ready", presentation });
  } catch (err) {
    res.status(500).json({ error: "Export failed" });
  }
};

module.exports = {
  getTemplatePresentationHandler,
  exportTemplateHandler,
};