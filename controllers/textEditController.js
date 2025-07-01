const { generateTextEdits } = require("../services/editTextService");

async function editTextHandler(req, res) {
  const { text, action, customPrompt } = req.body;

  if (!text || !action) {
    return res.status(400).json({ error: "Text and action are required." });
  }

  // Custom prompt must be provided for 'custom' action
  if (action === "custom" && (!customPrompt || !customPrompt.trim())) {
    return res
      .status(400)
      .json({ error: "Custom prompt is required for custom action." });
  }

  try {
    const suggestions = await generateTextEdits(text, action, customPrompt);
    res.json({ suggestions });
  } catch (err) {
    console.error("Error editing text:", err);
    res.status(500).json({ error: "Failed to generate suggestions." });
  }
}

module.exports = {
  editTextHandler,
};
