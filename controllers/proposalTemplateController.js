// controllers/templateController.js
const fs = require("fs");
const path = require("path");

exports.getAllTemplates = (req, res) => {
  try {
    const pagesDir = path.join(__dirname, "../templates/pages");
    const files = fs.readdirSync(pagesDir)
      .filter(f => f.endsWith(".html"))
      .map(f => f.replace(".html", ""));
    res.json({ templates: files });
  } catch (err) {
    console.error("Error listing templates:", err);
    res.status(500).json({ error: "Failed to list templates" });
  }
};

// ✅ GET /api/templates/:name
// Get HTML of a specific template
exports.getTemplateByName = (req, res) => {
  try {
    const { name } = req.params;
    const filePath = path.join(__dirname, "../templates/pages", `${name}.html`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Template not found" });
    }

    const html = fs.readFileSync(filePath, "utf8");
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (err) {
    console.error("Error reading template:", err);
    res.status(500).json({ error: "Failed to read template" });
  }
};