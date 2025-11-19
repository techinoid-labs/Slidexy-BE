/**
 * Stylesheet Deck Service
 * 
 * This service takes stylesheet and aesthetics data extracted from a website (via fetchWebsiteText)
 * and uses Gemini API to generate a Konva object structure with:
 * - title (text element)
 * - colorPalette (array of color codes)
 * - typography (font information and styles)
 * 
 * CEO Requirement: Separate service for stylesheet/aesthetics processing
 * Created: November 12, 2025
 */

const { textGenModel } = require("../utils/geminiModels");
const { fetchWebsiteText } = require("./fetchWebsiteText");

/**
 * Generate Konva deck object from website stylesheets and aesthetics
 * @param {string} websiteUrl - The URL to fetch and process stylesheets from
 * @returns {Promise<Object>} Konva object with title, colorPalette, and typography attributes
 */
async function generateStylesheetDeck(websiteUrl) {
  try {
    console.log("========================================");
    console.log("🎨 STYLESHEET DECK SERVICE INITIATED");
    console.log("========================================");
    console.log(`📌 Target URL: ${websiteUrl}`);
    console.log("⏳ Step 1/4: Fetching website content...\n");

    // Step 1: Fetch website content using existing service
    const websiteData = await fetchWebsiteText(websiteUrl);
    
    // Extract stylesheets and aesthetics from the response
    const stylesheets = websiteData.stylesheets || { external: [], inline: [] };
    const aesthetics = websiteData.aesthetics || {};
    
    console.log("✅ Website content fetched successfully!");
    console.log(`📊 Stylesheet & Aesthetics Stats:`);
    console.log(`   - External Stylesheets: ${stylesheets.external?.length || 0}`);
    console.log(`   - Inline Style Blocks: ${stylesheets.inline?.length || 0}`);
    console.log(`   - Colors Detected: ${aesthetics.colors?.length || 0}`);
    console.log(`   - Fonts Detected: ${aesthetics.fonts?.length || 0}`);
    console.log(`   - Border Radii: ${aesthetics.borderRadii?.length || 0}`);
    console.log(`   - Shadows: ${aesthetics.shadows?.length || 0}\n`);

    // Check if we have sufficient data
    if ((!stylesheets.external || stylesheets.external.length === 0) && 
        (!aesthetics.colors || aesthetics.colors.length === 0)) {
      throw new Error("No stylesheet or aesthetic data found on the website");
    }

    // Log detailed stylesheet info
    console.log("📄 Stylesheet Details:");
    if (stylesheets.external && stylesheets.external.length > 0) {
      console.log(`   External Stylesheets (${stylesheets.external.length}):`);
      stylesheets.external.slice(0, 5).forEach((sheet, idx) => {
        console.log(`   ${idx + 1}. ${sheet.href.substring(0, 80)}...`);
        console.log(`      Media: ${sheet.media}`);
      });
    }
    console.log("");

    // Log color palette
    console.log("🎨 Color Palette:");
    if (aesthetics.colors && aesthetics.colors.length > 0) {
      const topColors = aesthetics.colors.slice(0, 10);
      console.log(`   ${topColors.join(", ")}`);
    } else {
      console.log("   (No colors detected)");
    }
    console.log("");

    // Log typography
    console.log("✍️  Typography:");
    if (aesthetics.typography) {
      console.log(`   Base Font: ${aesthetics.typography.baseFontFamily || "N/A"}`);
      console.log(`   Font Size: ${aesthetics.typography.baseFontSize || "N/A"}`);
      console.log(`   Line Height: ${aesthetics.typography.baseLineHeight || "N/A"}`);
    }
    if (aesthetics.fonts && aesthetics.fonts.length > 0) {
      console.log(`   Fonts Used: ${aesthetics.fonts.slice(0, 5).join(", ")}`);
    }
    console.log("");

    console.log("⏳ Step 2/4: Generating Konva deck structure with Gemini AI...\n");

    // Step 2: Create Gemini prompt to analyze stylesheets/aesthetics and generate Konva object
    const stylesheetAnalysisData = {
      externalStylesheets: stylesheets.external?.slice(0, 5).map(sheet => ({
        href: sheet.href,
        media: sheet.media
      })) || [],
      inlineStylesCount: stylesheets.inline?.length || 0,
      colors: aesthetics.colors?.slice(0, 15) || [],
      rootColors: aesthetics.rootColors || {},
      fonts: aesthetics.fonts?.slice(0, 10) || [],
      typography: aesthetics.typography || {},
      borderRadii: aesthetics.borderRadii?.slice(0, 5) || [],
      shadows: aesthetics.shadows?.slice(0, 3) || []
    };

    const prompt = `You are a professional web design analyst. I will provide you with stylesheet and aesthetic data from a website, and you need to create a Konva.js deck object structure for design presentation.

IMPORTANT: Return ONLY a valid JSON object (no markdown, no code blocks, no explanations).

WEBSITE URL: ${websiteUrl}

STYLESHEET & AESTHETICS DATA:
${JSON.stringify(stylesheetAnalysisData, null, 2)}

TASK: Create a Konva deck object with these EXACT attributes:
1. "title": A compelling title describing the website's design style (max 10 words) based on the color scheme and typography
2. "colorPalette": An array of 5-8 PRIMARY color codes from the detected colors (choose the most prominent/brand colors, in hex format)
3. "typography": An object with:
   - "primaryFont": The main font family used
   - "fontStyle": Description of the typography style (e.g., "Modern Sans-serif", "Classic Serif", "Playful Display")
   - "fontSizes": Description of the size hierarchy (e.g., "Large headings with compact body text")

REQUIREMENTS:
- Select the most visually important colors (avoid pure black/white unless they're brand colors)
- Identify the primary brand/design colors
- Describe the overall design aesthetic (modern, classic, minimalist, bold, etc.)
- Make the typography description professional and specific
- The output must be valid JSON

OUTPUT FORMAT (return ONLY this JSON structure):
{
  "title": "Modern Minimalist Design System",
  "colorPalette": [
    "#6c5ce7",
    "#00b894",
    "#fdcb6e",
    "#e17055",
    "#74b9ff"
  ],
  "typography": {
    "primaryFont": "Inter, sans-serif",
    "fontStyle": "Clean modern sans-serif with geometric proportions",
    "fontSizes": "Large prominent headings with readable body text hierarchy"
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
    if (!konvaObject.title || !konvaObject.colorPalette || !konvaObject.typography) {
      throw new Error("Generated Konva object missing required fields (title, colorPalette, or typography)");
    }

    // Validate colorPalette is an array
    if (!Array.isArray(konvaObject.colorPalette)) {
      throw new Error("colorPalette must be an array");
    }

    console.log("⏳ Step 4/4: Finalizing response...\n");

    // Add metadata
    const finalResponse = {
      success: true,
      konvaObject: konvaObject,
      metadata: {
        sourceUrl: websiteUrl,
        generatedAt: new Date().toISOString(),
        service: "stylesheetDeck",
        stylesheetsAnalyzed: {
          external: stylesheets.external?.length || 0,
          inline: stylesheets.inline?.length || 0
        },
        aestheticsData: {
          totalColors: aesthetics.colors?.length || 0,
          totalFonts: aesthetics.fonts?.length || 0,
          borderRadii: aesthetics.borderRadii?.length || 0,
          shadows: aesthetics.shadows?.length || 0
        },
        websiteStats: websiteData.stats || {}
      },
      rawData: {
        allColors: aesthetics.colors || [],
        allFonts: aesthetics.fonts || [],
        rootColors: aesthetics.rootColors || {},
        typography: aesthetics.typography || {},
        externalStylesheets: stylesheets.external || [],
        inlineStylesCount: stylesheets.inline?.length || 0
      }
    };

    console.log("========================================");
    console.log("✅ STYLESHEET DECK GENERATION COMPLETE!");
    console.log("========================================");
    console.log(`📋 Title: "${konvaObject.title}"`);
    console.log(`🎨 Color Palette: ${konvaObject.colorPalette.length} colors`);
    console.log(`   ${konvaObject.colorPalette.join(", ")}`);
    console.log(`✍️  Primary Font: ${konvaObject.typography.primaryFont}`);
    console.log(`📊 Total Colors Available: ${aesthetics.colors?.length || 0}`);
    console.log(`📊 Total Fonts Available: ${aesthetics.fonts?.length || 0}`);
    console.log("========================================\n");

    return finalResponse;

  } catch (error) {
    console.error("========================================");
    console.error("❌ STYLESHEET DECK SERVICE ERROR");
    console.error("========================================");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    console.error("========================================\n");

    throw new Error(`Stylesheet Deck Generation Failed: ${error.message}`);
  }
}

/**
 * Generate Konva deck from direct stylesheet/aesthetics data input (without URL fetching)
 * @param {Object} data - Object with stylesheets and aesthetics data
 * @returns {Promise<Object>} Konva object with title, colorPalette, and typography attributes
 */
async function generateStylesheetDeckFromData(data) {
  try {
    console.log("========================================");
    console.log("🎨 STYLESHEET DECK SERVICE (Direct Data)");
    console.log("========================================");

    const { stylesheets, aesthetics } = data;

    if (!stylesheets && !aesthetics) {
      throw new Error("Either stylesheets or aesthetics data is required");
    }

    console.log(`📊 Input Data:`);
    console.log(`   - External Stylesheets: ${stylesheets?.external?.length || 0}`);
    console.log(`   - Colors: ${aesthetics?.colors?.length || 0}`);
    console.log(`   - Fonts: ${aesthetics?.fonts?.length || 0}\n`);

    console.log("⏳ Generating Konva deck structure with Gemini AI...\n");

    const stylesheetAnalysisData = {
      externalStylesheets: stylesheets?.external?.slice(0, 5).map(sheet => ({
        href: sheet.href || sheet,
        media: sheet.media || "all"
      })) || [],
      inlineStylesCount: stylesheets?.inline?.length || 0,
      colors: aesthetics?.colors?.slice(0, 15) || [],
      rootColors: aesthetics?.rootColors || {},
      fonts: aesthetics?.fonts?.slice(0, 10) || [],
      typography: aesthetics?.typography || {},
      borderRadii: aesthetics?.borderRadii?.slice(0, 5) || [],
      shadows: aesthetics?.shadows?.slice(0, 3) || []
    };

    const prompt = `You are a professional web design analyst. I will provide you with stylesheet and aesthetic data, and you need to create a Konva.js deck object structure.

IMPORTANT: Return ONLY a valid JSON object (no markdown, no code blocks, no explanations).

STYLESHEET & AESTHETICS DATA:
${JSON.stringify(stylesheetAnalysisData, null, 2)}

TASK: Create a Konva deck object with these EXACT attributes:
1. "title": A compelling title describing the design style (max 10 words)
2. "colorPalette": An array of 5-8 PRIMARY color codes (hex format)
3. "typography": An object with:
   - "primaryFont": The main font family
   - "fontStyle": Typography style description
   - "fontSizes": Size hierarchy description

OUTPUT FORMAT (return ONLY this JSON structure):
{
  "title": "Design System Title",
  "colorPalette": ["#color1", "#color2", "#color3"],
  "typography": {
    "primaryFont": "Font Name",
    "fontStyle": "Style description",
    "fontSizes": "Size hierarchy description"
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

    if (!konvaObject.title || !konvaObject.colorPalette || !konvaObject.typography) {
      throw new Error("Generated Konva object missing required fields");
    }

    if (!Array.isArray(konvaObject.colorPalette)) {
      throw new Error("colorPalette must be an array");
    }

    const finalResponse = {
      success: true,
      konvaObject: konvaObject,
      metadata: {
        generatedAt: new Date().toISOString(),
        service: "stylesheetDeck",
        stylesheetsAnalyzed: {
          external: stylesheets?.external?.length || 0,
          inline: stylesheets?.inline?.length || 0
        },
        aestheticsData: {
          totalColors: aesthetics?.colors?.length || 0,
          totalFonts: aesthetics?.fonts?.length || 0
        }
      },
      rawData: {
        allColors: aesthetics?.colors || [],
        allFonts: aesthetics?.fonts || [],
        rootColors: aesthetics?.rootColors || {},
        typography: aesthetics?.typography || {}
      }
    };

    console.log("========================================");
    console.log("✅ STYLESHEET DECK GENERATION COMPLETE!");
    console.log("========================================\n");

    return finalResponse;

  } catch (error) {
    console.error("❌ Error:", error.message);
    throw new Error(`Stylesheet Deck Generation Failed: ${error.message}`);
  }
}

module.exports = {
  generateStylesheetDeck,
  generateStylesheetDeckFromData
};
