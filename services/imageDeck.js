/**
 * Image Deck Service
 * 
 * This service takes image data extracted from a website (via fetchWebsiteText)
 * and uses Gemini API to generate a Konva object structure with:
 * - title (text element)
 * - imageUrl (primary image URL from website)
 * - imageCaption (AI-generated caption for the image)
 * 
 * CEO Requirement: Separate service for image processing
 * Created: November 12, 2025
 */

const { textGenModel } = require("../utils/geminiModels");
const { fetchWebsiteText } = require("./fetchWebsiteText");

/**
 * Generate Konva deck object from website images
 * @param {string} websiteUrl - The URL to fetch and process images from
 * @returns {Promise<Object>} Konva object with title, imageUrl, and imageCaption attributes
 */
async function generateImageDeck(websiteUrl) {
  try {
    console.log("========================================");
    console.log("🖼️  IMAGE DECK SERVICE INITIATED");
    console.log("========================================");
    console.log(`📌 Target URL: ${websiteUrl}`);
    console.log("⏳ Step 1/4: Fetching website content...\n");

    // Step 1: Fetch website content using existing service
    const websiteData = await fetchWebsiteText(websiteUrl);
    
    // Extract images from the response
    const images = websiteData.raw?.images || [];
    
    console.log("✅ Website content fetched successfully!");
    console.log(`📊 Image Stats:`);
    console.log(`   - Total Images Found: ${images.length}`);
    console.log(`   - Available in Stats: ${websiteData.stats?.images || 0}`);
    
    if (images.length === 0) {
      throw new Error("No images found on the website");
    }

    // Get top 5 images for analysis
    const topImages = images.slice(0, 5);
    console.log(`   - Top Images for Analysis: ${topImages.length}\n`);

    // Log image details
    console.log("📸 Image Details:");
    topImages.forEach((img, idx) => {
      console.log(`   ${idx + 1}. ${img.src.substring(0, 80)}...`);
      console.log(`      Alt: ${img.alt || "(no alt text)"}`);
      console.log(`      Size: ${img.width}x${img.height}`);
    });
    console.log("");

    console.log("⏳ Step 2/4: Generating Konva deck structure with Gemini AI...\n");

    // Step 2: Create Gemini prompt to analyze images and generate Konva object
    const imageAnalysisData = topImages.map((img, idx) => ({
      index: idx + 1,
      url: img.src,
      alt: img.alt || "No description",
      title: img.title || "",
      dimensions: `${img.width}x${img.height}`
    }));

    const prompt = `You are a professional visual content analyst. I will provide you with image data from a website, and you need to create a Konva.js deck object structure for image presentation.

IMPORTANT: Return ONLY a valid JSON object (no markdown, no code blocks, no explanations).

WEBSITE URL: ${websiteUrl}

IMAGES FOUND ON WEBSITE:
${JSON.stringify(imageAnalysisData, null, 2)}

TASK: Create a Konva deck object with these EXACT attributes:
1. "title": A compelling title for this image collection (max 10 words) based on the website context and image descriptions
2. "imageUrl": Select the BEST primary image URL from the list above (choose the most relevant, largest, or most descriptive one)
3. "imageCaption": Write a detailed, professional caption (30-60 words) for the selected primary image that describes what it represents in the context of the website

REQUIREMENTS:
- Choose the most visually appealing or contextually relevant image
- Prefer images with descriptive alt text
- Prefer larger images (better quality)
- Make the caption informative and engaging
- The caption should provide context about what the image shows
- The output must be valid JSON

OUTPUT FORMAT (return ONLY this JSON structure):
{
  "title": "Compelling title for the image collection",
  "imageUrl": "https://full-url-of-selected-primary-image.jpg",
  "imageCaption": "Professional caption describing the image in detail, providing context about what it shows and its relevance to the website content"
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
    if (!konvaObject.title || !konvaObject.imageUrl || !konvaObject.imageCaption) {
      throw new Error("Generated Konva object missing required fields (title, imageUrl, or imageCaption)");
    }

    console.log("⏳ Step 4/4: Finalizing response...\n");

    // Add metadata
    const finalResponse = {
      success: true,
      konvaObject: konvaObject,
      metadata: {
        sourceUrl: websiteUrl,
        generatedAt: new Date().toISOString(),
        service: "imageDeck",
        totalImagesFound: images.length,
        imagesAnalyzed: topImages.length,
        websiteStats: websiteData.stats || {}
      },
      allImages: images.map(img => ({
        url: img.src,
        alt: img.alt,
        width: img.width,
        height: img.height
      }))
    };

    console.log("========================================");
    console.log("✅ IMAGE DECK GENERATION COMPLETE!");
    console.log("========================================");
    console.log(`📋 Title: "${konvaObject.title}"`);
    console.log(`🖼️  Primary Image: ${konvaObject.imageUrl.substring(0, 60)}...`);
    console.log(`📝 Caption: ${konvaObject.imageCaption.substring(0, 50)}...`);
    console.log(`📊 Total Images Available: ${images.length}`);
    console.log("========================================\n");

    return finalResponse;

  } catch (error) {
    console.error("========================================");
    console.error("❌ IMAGE DECK SERVICE ERROR");
    console.error("========================================");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    console.error("========================================\n");

    throw new Error(`Image Deck Generation Failed: ${error.message}`);
  }
}

/**
 * Generate Konva deck from direct image data input (without URL fetching)
 * @param {Array} images - Array of image objects with src, alt, width, height
 * @returns {Promise<Object>} Konva object with title, imageUrl, and imageCaption attributes
 */
async function generateImageDeckFromData(images) {
  try {
    console.log("========================================");
    console.log("🖼️  IMAGE DECK SERVICE (Direct Data)");
    console.log("========================================");
    console.log(`📊 Input Images: ${images.length}\n`);

    if (!Array.isArray(images) || images.length === 0) {
      throw new Error("Images array is required and must not be empty");
    }

    // Validate image structure
    const validImages = images.filter(img => img.src && typeof img.src === 'string');
    
    if (validImages.length === 0) {
      throw new Error("No valid images found in input data (each image must have 'src' field)");
    }

    console.log(`✅ Valid images found: ${validImages.length}`);
    console.log("⏳ Generating Konva deck structure with Gemini AI...\n");

    const topImages = validImages.slice(0, 5);
    const imageAnalysisData = topImages.map((img, idx) => ({
      index: idx + 1,
      url: img.src,
      alt: img.alt || "No description",
      title: img.title || "",
      dimensions: img.width && img.height ? `${img.width}x${img.height}` : "Unknown"
    }));

    const prompt = `You are a professional visual content analyst. I will provide you with image data, and you need to create a Konva.js deck object structure.

IMPORTANT: Return ONLY a valid JSON object (no markdown, no code blocks, no explanations).

IMAGES PROVIDED:
${JSON.stringify(imageAnalysisData, null, 2)}

TASK: Create a Konva deck object with these EXACT attributes:
1. "title": A compelling title for this image collection (max 10 words)
2. "imageUrl": Select the BEST primary image URL from the list above
3. "imageCaption": Write a detailed caption (30-60 words) for the selected primary image

OUTPUT FORMAT (return ONLY this JSON structure):
{
  "title": "Compelling title for the image collection",
  "imageUrl": "https://full-url-of-selected-primary-image.jpg",
  "imageCaption": "Professional caption describing the image in detail and its context"
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

    if (!konvaObject.title || !konvaObject.imageUrl || !konvaObject.imageCaption) {
      throw new Error("Generated Konva object missing required fields");
    }

    const finalResponse = {
      success: true,
      konvaObject: konvaObject,
      metadata: {
        generatedAt: new Date().toISOString(),
        service: "imageDeck",
        totalImagesProvided: images.length,
        imagesAnalyzed: topImages.length
      },
      allImages: validImages.map(img => ({
        url: img.src,
        alt: img.alt || "",
        width: img.width || null,
        height: img.height || null
      }))
    };

    console.log("========================================");
    console.log("✅ IMAGE DECK GENERATION COMPLETE!");
    console.log("========================================\n");

    return finalResponse;

  } catch (error) {
    console.error("❌ Error:", error.message);
    throw new Error(`Image Deck Generation Failed: ${error.message}`);
  }
}

module.exports = {
  generateImageDeck,
  generateImageDeckFromData
};
