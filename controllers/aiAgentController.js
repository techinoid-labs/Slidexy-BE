const { textGenModel } = require("../utils/geminiModels");
const fs = require("fs");
const path = require("path");

class AIAgentController {
  async getIntent(req, res) {
    try {
      const { message, currentPath } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Read the current schema definitions to ground the LLM
      const schemaPath = path.join(__dirname, "../data/slidexy_ai.json");
      let schemaString = "";
      try {
        const rawSchema = fs.readFileSync(schemaPath, "utf-8");
        const schema = JSON.parse(rawSchema);

        if (currentPath && schema.pages && schema.pages[currentPath]) {
          schema.pages = { [currentPath]: schema.pages[currentPath] };
        } else if (currentPath) {
          schema.pages = { [currentPath]: { description: "Current user context" } };
        }

        schemaString = JSON.stringify(schema, null, 2);
      } catch (err) {
        console.error("Could not load slidexy_ai.json for context", err);
      }

      const prompt = `
You are an intelligent routing agent for the "Slidexy" app.
The user is currently on the path: ${currentPath || "unknown"}.
Your job is to read the user's message, determine what they want to do within the app, and respond ONLY with a valid JSON object matching the workflows defined.

Available workflows and URLs from the app definition:
${schemaString}

Output format EXACTLY:
{
  "action": "create_presentation" | "navigate" | "open_editor" | "manage_account" | "general_chat" | "edit_slide" | "edit_outline",
  "url": "the target param (if applicable)",
  "message": "A short, friendly message to the user confirming what you are doing. If they ask about their current location, inform them they are on ${currentPath || "their current page"}.",
  "payload": {
     "prompt": "extracted detailed prompt",
     "goal": "Pitch Deck, Project Proposal, etc.",
     "tone": "Professional, Creative, etc.",
     "slideCount": 10,
     "slideIndex": 0,
     "newTitle": "Agentic Marketing",
     "newBullets": ["Bullet point 1", "Bullet point 2"]
  }
}

Do not include any raw markdown or text outside the JSON block. Do not wrap in \`\`\`json. Valid JSON only.

User Message: "${message}"
`;

      const response = await textGenModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const resultText = response.response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      
      // Strip markdown framing if the LLM adds it despite the strict prompt
      const jsonString = resultText.replace(/^```json/i, "").replace(/```$/i, "").trim();

      const parsedJSON = JSON.parse(jsonString);

      const logEntry = {
        timestamp: new Date().toISOString(),
        userMessage: message,
        currentPath: currentPath || "unknown",
        parsedIntent: parsedJSON
      };
      const logsDir = path.join(__dirname, "../logs");
      if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
      fs.appendFileSync(path.join(logsDir, "agent.log"), JSON.stringify(logEntry) + "\n");

      return res.json(parsedJSON);

    } catch (error) {
      console.error("AI Agent Intent Error:", error);
      return res.status(500).json({ error: "Agent failed to determine intent" });
    }
  }
}

module.exports = new AIAgentController();