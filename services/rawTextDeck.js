/**
 * Raw Text to Deck Service
 * 
 * This service takes raw text extracted from a website (via fetchWebsiteText)
 * and uses Gemini API to generate a Konva object structure with:
 * - title (text element)
 * - bullet (text element with bullet points)
 * - image (image element with URL)
 * 
 * CEO Requirement: Separate service for raw text processing
 * Created: November 12, 2025
 */

const { textGenModel } = require("../utils/geminiModels");
const { fetchWebsiteText } = require("./fetchWebsiteTextNoCode");
const { uploadToSpaces } = require("../utils/s3Uploader");
const crypto = require("crypto");

/**
 * Generate Konva deck object from raw text
 * @param {string} websiteUrl - The URL to fetch and process
 * @returns {Promise<Object>} Konva object with title, bullet, and image attributes
 */
async function generateRawTextDeck(websiteUrl) {
  try {
    console.log("========================================");
    console.log("🚀 RAW TEXT DECK SERVICE INITIATED");
    console.log("========================================");
    console.log(`📌 Target URL: ${websiteUrl}`);
    console.log("⏳ Step 1/4: Fetching website content...\n");

    // Step 1: Fetch website content using existing service
    const websiteData = await fetchWebsiteText(websiteUrl);
    
    // Extract raw text from the formatted response
    const rawText = websiteData.formatted || "";
    
    console.log("✅ Website content fetched successfully!");
    console.log(`📊 Content Stats:`);
    console.log(`   - Total Characters: ${rawText.length}`);
    console.log(`   - Headings Found: ${websiteData.stats?.headings || 0}`);
    console.log(`   - Images Found: ${websiteData.stats?.images || 0}`);
    console.log(`   - Paragraphs: ${websiteData.stats?.paragraphs || 0}\n`);

    // Limit raw text to avoid token limits (keep first 5000 chars)
    const limitedRawText = rawText.slice(0, 5000);

    console.log("⏳ Step 2/4: Generating Konva deck structure with Gemini AI...\n");

    // Step 2: Create Gemini prompt to generate Konva object
    const prompt = `You are a professional presentation designer. I will provide you with raw text content from a website, and you need to create a Konva.js deck object structure.

IMPORTANT: Return ONLY a valid JSON object (no markdown, no code blocks, no explanations).

INPUT RAW TEXT:
"""
${limitedRawText}
"""

TASK: Create a Konva deck object with these EXACT attributes:
1. "title": A compelling main title (max 10 words) that summarizes the content
2. "bullet": An array of 3-5 key bullet points extracted from the content (each max 15 words)
3. "image": An object with:
   - "description": A detailed description of an image that would visually represent this content (50-100 words)
   - "url": Leave as null (will be generated separately)

REQUIREMENTS:
- Extract the most important information from the raw text
- Make bullet points concise and impactful
- Ensure the image description is detailed enough for AI image generation
- The output must be valid JSON

OUTPUT FORMAT (return ONLY this JSON structure):
{
  "title": "Your compelling title here",
  "bullet": [
    "First key point from the content",
    "Second key point from the content",
    "Third key point from the content"
  ],
  "image": {
    "description": "Detailed description of an image that represents the content visually, including composition, style, and key elements to include",
    "url": null
  }
}

RETURN ONLY THE JSON OBJECT:`;

    // Step 3: Call Gemini API
    const result = await textGenModel.generateContent(prompt);
    const responseText = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    console.log("✅ Gemini AI response received!");
    console.log("📝 Raw Gemini Response:");
    console.log("─────────────────────────────────────");
    console.log(responseText);
    console.log("─────────────────────────────────────\n");

    // Step 4: Parse the JSON response
    const cleanedResponse = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // Find JSON object in response
    const jsonStart = cleanedResponse.indexOf("{");
    const jsonEnd = cleanedResponse.lastIndexOf("}") + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error("No valid JSON object found in Gemini response");
    }

    const jsonString = cleanedResponse.slice(jsonStart, jsonEnd);
    const konvaObject = JSON.parse(jsonString);

    console.log("⏳ Step 3/4: Parsing Konva object structure...\n");
    console.log("✅ Konva object parsed successfully!");
    console.log("📦 Generated Konva Deck Object:");
    console.log("─────────────────────────────────────");
    console.log(JSON.stringify(konvaObject, null, 2));
    console.log("─────────────────────────────────────\n");

    // Validate required fields
    if (!konvaObject.title || !konvaObject.bullet || !konvaObject.image) {
      throw new Error("Generated Konva object missing required fields (title, bullet, or image)");
    }

    console.log("⏳ Step 4/4: Finalizing response...\n");

    // Add metadata
    const finalResponse = {
      success: true,
      konvaObject: konvaObject,
      metadata: {
        sourceUrl: websiteUrl,
        generatedAt: new Date().toISOString(),
        service: "rawTextDeck",
        rawTextLength: limitedRawText.length,
        websiteStats: websiteData.stats || {}
      }
    };

    console.log("========================================");
    console.log("✅ RAW TEXT DECK GENERATION COMPLETE!");
    console.log("========================================");
    console.log(`📋 Title: "${konvaObject.title}"`);
    console.log(`🔢 Bullet Points: ${konvaObject.bullet.length}`);
    console.log(`🖼️  Image Description: ${konvaObject.image.description ? 'Generated' : 'Missing'}`);
    console.log("========================================\n");

    return finalResponse;

  } catch (error) {
    console.error("========================================");
    console.error("❌ RAW TEXT DECK SERVICE ERROR");
    console.error("========================================");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    console.error("========================================\n");

    throw new Error(`Raw Text Deck Generation Failed: ${error.message}`);
  }
}

/**
 * Generate Konva deck from direct raw text input (without URL fetching)
 * @param {string} rawText - Direct text input
 * @returns {Promise<Object>} Konva object with title, bullet, and image attributes
 */
async function generateRawTextDeckFromText(rawText) {
  try {
    console.log("========================================");
    console.log("🚀 RAW TEXT DECK SERVICE (Direct Text)");
    console.log("========================================");
    console.log(`📊 Input Text Length: ${rawText.length} characters\n`);

    // Limit raw text to avoid token limits
    const limitedRawText = rawText.slice(0, 5000);

    console.log("⏳ Generating Konva deck structure with Gemini AI...\n");

    const prompt = `You are a professional presentation designer. I will provide you with raw text content, and you need to create a Konva.js deck object structure.

IMPORTANT: Return ONLY a valid JSON object (no markdown, no code blocks, no explanations).

INPUT RAW TEXT:
"""
${limitedRawText}
"""

TASK: Create a Konva deck object with these EXACT attributes:
1. "title": A compelling main title (max 10 words) that summarizes the content
2. "bullet": An array of 3-5 key bullet points extracted from the content (each max 15 words)
3. "image": An object with:
   - "description": A detailed description of an image that would visually represent this content (50-100 words)
   - "url": Leave as null (will be generated separately)

REQUIREMENTS:
- Extract the most important information from the raw text
- Make bullet points concise and impactful
- Ensure the image description is detailed enough for AI image generation
- The output must be valid JSON

OUTPUT FORMAT (return ONLY this JSON structure):
{
  "title": "Your compelling title here",
  "bullet": [
    "First key point from the content",
    "Second key point from the content",
    "Third key point from the content"
  ],
  "image": {
    "description": "Detailed description of an image that represents the content visually, including composition, style, and key elements to include",
    "url": null
  }
}

RETURN ONLY THE JSON OBJECT:`;

    const result = await textGenModel.generateContent(prompt);
    const responseText = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    console.log("✅ Gemini AI response received!");
    console.log("📝 Raw Gemini Response:");
    console.log("─────────────────────────────────────");
    console.log(responseText);
    console.log("─────────────────────────────────────\n");

    const cleanedResponse = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const jsonStart = cleanedResponse.indexOf("{");
    const jsonEnd = cleanedResponse.lastIndexOf("}") + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error("No valid JSON object found in Gemini response");
    }

    const jsonString = cleanedResponse.slice(jsonStart, jsonEnd);
    const konvaObject = JSON.parse(jsonString);

    console.log("✅ Konva object parsed successfully!");
    console.log("📦 Generated Konva Deck Object:");
    console.log("─────────────────────────────────────");
    console.log(JSON.stringify(konvaObject, null, 2));
    console.log("─────────────────────────────────────\n");

    if (!konvaObject.title || !konvaObject.bullet || !konvaObject.image) {
      throw new Error("Generated Konva object missing required fields");
    }

    const finalResponse = {
      success: true,
      konvaObject: konvaObject,
      metadata: {
        generatedAt: new Date().toISOString(),
        service: "rawTextDeck",
        rawTextLength: limitedRawText.length
      }
    };

    console.log("========================================");
    console.log("✅ RAW TEXT DECK GENERATION COMPLETE!");
    console.log("========================================\n");

    return finalResponse;

  } catch (error) {
    console.error("❌ Error:", error.message);
    throw new Error(`Raw Text Deck Generation Failed: ${error.message}`);
  }
}

module.exports = {
  generateRawTextDeck,
  generateRawTextDeckFromText
};
