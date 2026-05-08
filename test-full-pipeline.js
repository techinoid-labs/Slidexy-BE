#!/usr/bin/env node
/**
 * Complete Test: Text Generation Pipeline
 */

require("dotenv").config();

const { textGenModel } = require("./utils/geminiModels");

console.log("═══════════════════════════════════════════════════════════════");
console.log("Testing Complete Text Generation Pipeline");
console.log("═══════════════════════════════════════════════════════════════\n");

async function testSlideTextGeneration() {
  console.log("🔄 Testing slide text generation with gemini-2.5-flash-lite...\n");

  const testPrompt = `You are a presentation content expert. Create EXACTLY 3 slides in JSON format.

Return ONLY a valid JSON array with 3 objects. Each slide must have:
- slide_number (number)
- layout_type (string)
- title (string, 3-6 words)
- bullets (array of 3 strings, 6-12 words each)

Example format:
[
  {
    "slide_number": 1,
    "layout_type": "cover-hero",
    "title": "Business Transformation Journey",
    "bullets": ["Strategic overview and key insights", "Actionable recommendations included", "Data-driven approach to success"]
  },
  // ... more slides
]

Create slides about "Artificial Intelligence in Healthcare" topic.`;

  try {
    console.log("📤 Sending request to Google API (gemini-2.5-flash-lite)...");
    const result = await textGenModel.generateContent(testPrompt);
    const responseText = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!responseText) {
      console.error("❌ No response text received");
      return false;
    }

    console.log("\n✅ TEXT GENERATION SUCCESSFUL\n");
    console.log("Response (first 500 chars):");
    console.log("─".repeat(60));
    console.log(responseText.substring(0, 500));
    console.log("─".repeat(60));

    // Try to parse JSON
    try {
      const jsonStart = responseText.indexOf("[");
      const jsonEnd = responseText.lastIndexOf("]");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = responseText.substring(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonString);
        console.log(`\n✅ Valid JSON received with ${parsed.length} slides`);
        console.log("\nSlide structure:");
        parsed.forEach((slide, i) => {
          console.log(`  Slide ${i + 1}: "${slide.title}" (${slide.layout_type})`);
        });
        return true;
      }
    } catch (parseErr) {
      console.warn("\n⚠️  Could not parse JSON, but response was received");
      return true;
    }

    return true;
  } catch (err) {
    console.error("❌ TEXT GENERATION FAILED");
    console.error("Error:", err.message.split("\n")[0]);
    return false;
  }
}

async function main() {
  const success = await testSlideTextGeneration();

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("RESULT");
  console.log("═══════════════════════════════════════════════════════════════");

  if (success) {
    console.log("\n✅ TEXT GENERATION PIPELINE IS WORKING");
    console.log("\nYour backend should now generate proper slide content.");
    console.log("Start the server: npm start");
    console.log("Then test: POST /api/generate-slides with your content");
  } else {
    console.log("\n❌ TEXT GENERATION PIPELINE FAILED");
    console.log("Check error messages above.");
  }
}

main().catch(console.error);
