// utils/extract.js

const { textGenModel } = require("../utils/geminiModels");

async function extractTopicAndParagraphs(rawPrompt) {
  const prompt = `
From the following user prompt, extract:
- A concise title (1 line max)
- Up to 5 short brief information based on the details provided.

Only return a valid JSON in this format:

{
  "topic": "string",
  "paragraphs": ["string", "string", "string", "string", "string"]
}

User prompt:
"""${rawPrompt}"""
`;

  const result = await textGenModel.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  

  const rawText = result.response.text().trim();
  const cleanText = rawText.replace(/```json|```/g, "").trim();

  // Find the first and last curly braces
  const jsonStart = cleanText.indexOf("{");
  const jsonEnd = cleanText.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("No valid JSON found in Gemini response: " + cleanText);
  }

  const jsonString = cleanText.slice(jsonStart, jsonEnd + 1);

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    throw new Error("Failed to parse JSON: " + jsonString);
  }

  // Ensure paragraphs is always an array
  if (!Array.isArray(parsed.paragraphs)) {
    parsed.paragraphs = [];
  }

  return parsed;
 
}

module.exports = { extractTopicAndParagraphs };
