const { generateTextEdits } = require("../services/editTextService");

async function editTextHandler(req, res) {
  const { title, bullets, action, customPrompt } = req.body;

  // ✅ Validation
  if (!title || !Array.isArray(bullets) || bullets.length === 0 || !action) {
    return res.status(400).json({
      error: "Missing required fields: title, bullets, or action.",
    });
  }

  if (action === "custom" && (!customPrompt || !customPrompt.trim())) {
    return res
      .status(400)
      .json({ error: "Custom prompt is required for custom action." });
  }

  try {
    const suggestions = await generateTextEdits({
      title,
      bullets,
      action,
      customPrompt,
    });

    res.json({ suggestions });
  } catch (err) {
    console.error("Error editing text:", err);
    res.status(500).json({ error: "Failed to generate suggestions." });
  }
}

module.exports = {
  editTextHandler,
};
