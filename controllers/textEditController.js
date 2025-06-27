const { generateTextEdits } = require("../services/editTextService");

async function editTextHandler(req, res) {
  const { text, action } = req.body;

  if (!text || !action) {
    return res.status(400).json({ error: "Text and action are required." });
  }

  try {
    const suggestions = await generateTextEdits(text, action);
    res.json({ suggestions });
  } catch (err) {
    console.error("Error editing text:", err);
    res.status(500).json({ error: "Failed to generate suggestions." });
  }
}

module.exports = {
  editTextHandler,
};
