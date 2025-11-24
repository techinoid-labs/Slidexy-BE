/**
 * =============================================================================
 * WEBSITE GENERATOR SERVICE
 * =============================================================================
 * 
 * Purpose: Generate modern, sleek HTML websites from unified web deck presentations
 * 
 * CEO Requirement: 
 * - Use unified route response to generate complete HTML pages
 * - Utilize Gemini AI to create modern, responsive designs
 * - Save each generated website as a unique HTML file in website-codes folder
 * - Leverage all presentation data (slides, images, colors, typography)
 * 
 * Flow:
 * 1. Receive URL
 * 2. Call unified web deck service to get presentation data
 * 3. Send presentation data to Gemini with HTML generation prompt
 * 4. Parse and save the generated HTML code
 * 5. Return file path and preview URL
 * 
 * Created: 2025-11-17
 * =============================================================================
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const { generateUnifiedWebDeck } = require("./unifiedWebDeck");

// Initialize API Key Pool (same as geminiModels.js)
const apiKeys = [
  process.env.API_KEY1, process.env.API_KEY2, process.env.API_KEY3,
  process.env.API_KEY4, process.env.API_KEY5, process.env.API_KEY6,
  process.env.API_KEY7, process.env.API_KEY8, process.env.API_KEY9,
  process.env.API_KEY10, process.env.API_KEY11, process.env.API_KEY12,
].filter(Boolean);

if (apiKeys.length === 0) {
  console.error("⚠️  No Gemini API keys configured!");
}

// Key Pool class (same logic as geminiModels.js)
class KeyPool {
  constructor(keys) {
    this.keys = keys.map(key => ({ key, inUse: false, lastUsed: 0, fails: 0 }));
  }

  async acquire() {
    this.keys.sort((a, b) => a.lastUsed - b.lastUsed || a.fails - b.fails);
    let candidate = this.keys.find(k => !k.inUse);
    if (!candidate) await new Promise(r => setTimeout(r, 100));
    candidate = this.keys.find(k => !k.inUse) || this.keys[0];
    candidate.inUse = true;
    candidate.lastUsed = Date.now();
    return candidate.key;
  }

  release(key, success = true) {
    const k = this.keys.find(k => k.key === key);
    if (k) { k.inUse = false; if (!success) k.fails++; }
  }
}

const pool = new KeyPool(apiKeys);

/**
 * Generate a complete HTML website from a URL using unified presentation data
 * @param {string} websiteUrl - The URL to analyze and generate website from
 * @returns {Promise<Object>} Generated website details including file path
 */
async function generateWebsiteFromUrl(websiteUrl) {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║       🌐 WEBSITE GENERATOR SERVICE INITIATED              ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`📍 Source URL: ${websiteUrl}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);

  try {
    // Step 1: Generate unified presentation data
    console.log("📊 Step 1/4: Generating unified presentation data...");
    const unifiedResult = await generateUnifiedWebDeck(websiteUrl);
    
    if (!unifiedResult.success || !unifiedResult.presentation) {
      throw new Error("Failed to generate unified presentation data");
    }

    const presentation = unifiedResult.presentation;
    console.log(`✅ Unified presentation generated successfully!`);
    console.log(`   - Slides: ${presentation.slide_count}`);
    console.log(`   - Topic: ${presentation.topic}`);
    console.log(`   - Art Style: ${presentation.art_style}`);
    console.log(`   - Color Palette: ${presentation.art_palette?.slice(0, 3).join(", ")}...\n`);

    // Step 2: Prepare comprehensive data from unified response
    console.log("🎨 Step 2/5: Extracting ALL data from unified response...");
    const websiteData = extractCompleteWebsiteData(presentation, websiteUrl);
    console.log(`   ✅ Extracted data:`);
    console.log(`      - ${websiteData.allImages.length} images`);
    console.log(`      - ${websiteData.allHeadings.length} headings`);
    console.log(`      - ${websiteData.sections.length} content sections`);
    console.log(`      - ${websiteData.colors.length} colors\n`);

    // Step 3: Generate HTML structure
    console.log("📄 Step 3/5: Generating HTML structure...");
    const htmlCode = generateModernHTML(websiteData, presentation);
    console.log(`   ✅ HTML generated (${(htmlCode.length / 1024).toFixed(2)} KB)\n`);

    // Step 4: Generate CSS stylesheet
    console.log("🎨 Step 4/5: Generating CSS stylesheet...");
    const cssCode = generateModernCSS(websiteData, presentation);
    console.log(`   ✅ CSS generated (${(cssCode.length / 1024).toFixed(2)} KB)\n`);

    // Step 5: Generate JavaScript interactions
    console.log("⚡ Step 5/6: Generating JavaScript interactions...");
    const jsCode = generateModernJS(websiteData, presentation);
    console.log(`   ✅ JS generated (${(jsCode.length / 1024).toFixed(2)} KB)\n`);

    // Step 6: Save all files to folder
    console.log("💾 Step 6/6: Saving website files to dedicated folder...");
    const savedWebsite = await saveWebsiteFiles(
      htmlCode, 
      cssCode, 
      jsCode, 
      presentation.topic, 
      websiteUrl,
      presentation
    );

    console.log(`✅ Website folder created successfully!`);
    console.log(`   - Folder: ${savedWebsite.folderName}`);
    console.log(`   - Files: ${Object.values(savedWebsite.files).join(", ")}`);
    console.log(`   - Total Size: ${savedWebsite.sizeKB} KB\n`);

    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║       ✨ WEBSITE GENERATION COMPLETE!                     ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

   // services/websiteGenerator.js → at the very end of generateWebsiteFromUrl()
    // === RETURN CLEAN, PREDICTABLE STRUCTURE ===
    return {
      success: true,
      message: "Website generated successfully",
      folderName: savedWebsite.folderName,
      files: savedWebsite.files,           // ← correct: { type: "html", content: "..." }
      sizeKB: savedWebsite.sizeKB,
      previewUrl: savedWebsite.previewUrl,
      presentation: {
        presentation_id: presentation.presentation_id,
        topic: presentation.topic,
        slide_count: presentation.slide_count,
        art_style: presentation.art_style,
        art_palette: presentation.art_palette,
        total_images: websiteData.allImages.length,
        total_headings: websiteData.allHeadings.length,
      },
      sourceUrl: websiteUrl,
      generatedAt: new Date().toISOString(),
    };
   

  } catch (error) {
    console.error("\n╔════════════════════════════════════════════════════════════╗");
    console.error("║       ❌ WEBSITE GENERATION FAILED                        ║");
    console.error("╚════════════════════════════════════════════════════════════╝");
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}\n`);
    throw error;
  }
}

/**
 * Extract COMPLETE website data from unified presentation
 * Utilizes ALL images, headings, colors, typography, and content
 * @param {Object} presentation - The unified presentation object
 * @param {string} sourceUrl - Original website URL
 * @returns {Object} Complete website data
 */
function extractCompleteWebsiteData(presentation, sourceUrl) {
  const slides = presentation.slides || [];
  
  // Extract ALL images from ALL slides
  const allImages = [];
  slides.forEach(slide => {
    // Primary image
    if (slide.image_url) {
      allImages.push({
        src: slide.image_url,
        alt: slide.image_caption || slide.slide_title?.text || "Image",
        caption: slide.image_caption || "",
      });
    }
    // All images array
    if (slide.images && Array.isArray(slide.images)) {
      slide.images.forEach(img => {
        if (img.src) {
          allImages.push({
            src: img.src,
            alt: img.alt || slide.slide_title?.text || "Image",
            caption: img.alt || "",
          });
        }
      });
    }
    // Image URLs array
    if (slide.image_urls && Array.isArray(slide.image_urls)) {
      slide.image_urls.forEach(url => {
        if (url && !allImages.some(img => img.src === url)) {
          allImages.push({
            src: url,
            alt: slide.slide_title?.text || "Image",
            caption: slide.image_caption || "",
          });
        }
      });
    }
  });

  // Deduplicate images by URL
  const uniqueImages = allImages.filter((img, index, self) => 
    index === self.findIndex(t => t.src === img.src)
  );

  // Extract ALL headings from presentation and slides
  const allHeadings = [];
  if (presentation.headings && Array.isArray(presentation.headings)) {
    presentation.headings.forEach(h => {
      if (typeof h === 'string') {
        allHeadings.push({ level: 2, text: h });
      } else if (h.text) {
        allHeadings.push({ level: h.level || 2, text: h.text });
      }
    });
  }
  slides.forEach(slide => {
    if (slide.headings && Array.isArray(slide.headings)) {
      slide.headings.forEach(h => {
        if (!allHeadings.some(existing => existing.text === h.text)) {
          allHeadings.push({ level: h.level || 2, text: h.text });
        }
      });
    }
  });

  // Extract ALL content sections from slides
  const sections = slides.map((slide, index) => ({
    id: slide.slide_id,
    number: index + 1,
    title: slide.slide_title?.text || `Section ${index + 1}`,
    bullets: slide.elements
      ?.filter(el => el.element_type === "bullet_point")
      .map(el => el.text) || [],
    description: slide.elements
      ?.filter(el => el.element_type === "description")
      .map(el => el.text)
      .join(" ") || "",
    layoutType: slide.layout_type || "content",
    visualSuggestion: slide.visual_suggestion || "",
  }));

  // Extract typography details
  const typographyInfo = {};
  slides.forEach(slide => {
    slide.elements?.forEach(el => {
      if (el.element_type === "description") {
        if (el.text.includes("Primary Font:")) {
          typographyInfo.primaryFont = el.text.replace("Primary Font:", "").trim();
        }
        if (el.text.includes("Font Style:")) {
          typographyInfo.fontStyle = el.text.replace("Font Style:", "").trim();
        }
        if (el.text.includes("Font Sizes:")) {
          typographyInfo.fontSizes = el.text.replace("Font Sizes:", "").trim();
        }
      }
    });
  });

  return {
    topic: presentation.topic,
    sourceUrl: sourceUrl,
    presentationId: presentation.presentation_id,
    allImages: uniqueImages,
    allHeadings: allHeadings,
    sections: sections,
    colors: presentation.art_palette || [],
    artStyle: presentation.art_style || "modern",
    typography: {
      primaryFont: typographyInfo.primaryFont || presentation.art_style || "Inter, sans-serif",
      fontStyle: typographyInfo.fontStyle || "Modern sans-serif",
      fontSizes: typographyInfo.fontSizes || "16px base",
    },
    slideCount: presentation.slide_count,
  };
}

/**
 * Prepare design brief from presentation data
 * @param {Object} presentation - The unified presentation object
 * @param {string} sourceUrl - Original website URL
 * @returns {Object} Design brief for Gemini
 */
function prepareDesignBrief(presentation, sourceUrl) {
  // Extract key design elements
  const slides = presentation.slides || [];
  const colorPalette = presentation.art_palette || [];
  const artStyle = presentation.art_style || "modern";
  const headings = presentation.headings || [];

  // Collect all text content
  const textContent = slides.map(slide => ({
    title: slide.slide_title?.text || "Untitled",
    bullets: slide.elements
      ?.filter(el => el.element_type === "bullet_point")
      .map(el => el.text) || [],
    description: slide.elements
      ?.filter(el => el.element_type === "description")
      .map(el => el.text)
      .join(" ") || "",
  }));

  // Collect all images
  const images = slides
    .filter(slide => slide.image_url)
    .map(slide => ({
      url: slide.image_url,
      caption: slide.image_caption || "",
      alt: slide.slide_title?.text || "Image",
    }));

  // Extract typography info
  const typographyElements = slides
    .flatMap(slide => slide.elements || [])
    .filter(el => el.element_type === "description" && el.text.includes("Font"));

  const primaryFont = typographyElements.find(el => el.text.includes("Primary Font:"))
    ?.text.replace("Primary Font:", "").trim() || "Inter, sans-serif";

  return {
    topic: presentation.topic,
    sourceUrl: sourceUrl,
    artStyle: artStyle,
    colorPalette: colorPalette,
    primaryFont: primaryFont,
    headings: headings.slice(0, 10), // Top 10 headings
    sections: textContent,
    images: images,
    slideCount: presentation.slide_count,
  };
}

/**
 * Generate HTML code using Gemini AI
 * @param {Object} designBrief - Design brief with all presentation data
 * @param {Object} presentation - Full presentation object for reference
 * @returns {Promise<string>} Generated HTML code
 */
async function generateHtmlWithGemini(designBrief, presentation) {
  const model = "gemini-2.0-flash-exp"; // Using fast model for code generation

  // Construct comprehensive prompt
  const prompt = `You are an expert web designer and developer. Create a COMPLETE, modern, sleek, and responsive HTML website based on the following design brief.

═══════════════════════════════════════════════════════════════
📋 DESIGN BRIEF
═══════════════════════════════════════════════════════════════

Website Topic: ${designBrief.topic}
Source URL: ${designBrief.sourceUrl}
Art Style: ${designBrief.artStyle}

🎨 COLOR PALETTE (Use these exact colors):
${designBrief.colorPalette.map((color, i) => `  Color ${i + 1}: ${color}`).join("\n")}

✍️  TYPOGRAPHY:
  Primary Font: ${designBrief.primaryFont}

📑 CONTENT SECTIONS (${designBrief.sections.length} sections):
${designBrief.sections.map((section, i) => `
Section ${i + 1}: "${section.title}"
${section.bullets.length > 0 ? "  Key Points:\n" + section.bullets.map(b => `    • ${b}`).join("\n") : ""}
${section.description ? `  Description: ${section.description}` : ""}
`).join("\n")}

🖼️  IMAGES (${designBrief.images.length} images to use):
${designBrief.images.map((img, i) => `  ${i + 1}. ${img.url}
     Caption: ${img.caption}
     Alt: ${img.alt}`).join("\n")}

📰 KEY HEADINGS FROM SOURCE:
${designBrief.headings.slice(0, 5).map((h, i) => `  ${i + 1}. ${h}`).join("\n")}

═══════════════════════════════════════════════════════════════
🎯 REQUIREMENTS
═══════════════════════════════════════════════════════════════

DESIGN STYLE:
✓ Modern, sleek, professional design
✓ Clean and minimalist aesthetic
✓ Smooth animations and transitions
✓ Glass-morphism or gradient effects where appropriate
✓ Mobile-first responsive design (works on all devices)
✓ Professional typography hierarchy

COLOR USAGE:
✓ MUST use the provided color palette throughout
✓ Primary color: ${designBrief.colorPalette[0] || "#6c5ce7"} (hero, CTAs, accents)
✓ Secondary color: ${designBrief.colorPalette[1] || "#00b894"} (sections, highlights)
✓ Accent colors: ${designBrief.colorPalette.slice(2).join(", ")} (cards, borders, gradients)
✓ Create harmonious gradients using palette colors

LAYOUT STRUCTURE:
1. Hero Section:
   - Eye-catching hero with gradient background using color palette
   - Main heading from topic: "${designBrief.topic}"
   - Subtitle or tagline
   - CTA button with primary color
   - Hero image if available from images array

2. Content Sections (one for each section in design brief):
   - Use section titles as <h2> headings
   - Display bullet points as feature cards or lists
   - Alternate left/right layouts for visual interest
   - Include relevant images from the images array
   - Add smooth scroll animations

3. Image Gallery/Showcase:
   - Display all ${designBrief.images.length} images beautifully
   - Use cards, grids, or masonry layout
   - Add hover effects and zoom
   - Include captions from image data

4. Features/Highlights Section:
   - Icon cards or feature boxes
   - Use bullet points as features
   - Color-coded with palette colors

5. Footer:
   - Simple, elegant footer
   - Credits and source reference
   - Styled with palette colors

TECHNICAL REQUIREMENTS:
✓ Complete, self-contained HTML file (HTML + CSS in <style> tag)
✓ NO external dependencies (no Bootstrap, no Tailwind, pure CSS)
✓ Responsive breakpoints: mobile (< 768px), tablet (768-1024px), desktop (> 1024px)
✓ Smooth CSS animations (fade-in, slide-up, hover effects)
✓ Proper semantic HTML5 (header, main, section, article, footer)
✓ Accessible (proper alt texts, ARIA labels, semantic structure)
✓ Fast loading (optimized CSS, no bloat)
✓ Modern CSS features (flexbox, grid, custom properties, clamp())

CSS STYLING MUST INCLUDE:
✓ CSS custom properties (--primary-color, --secondary-color, etc.)
✓ Smooth transitions and animations
✓ Gradient backgrounds using palette colors
✓ Card designs with shadows and hover effects
✓ Typography scale (h1: 3rem, h2: 2.5rem, h3: 2rem, etc.)
✓ Spacing system (consistent margins/padding)
✓ Glass-morphism or modern effects where appropriate

IMAGE HANDLING:
✓ Use ALL ${designBrief.images.length} images provided in the images array
✓ Add proper alt texts from image captions
✓ Lazy loading attributes (loading="lazy")
✓ Responsive images (max-width: 100%, height: auto)
✓ Object-fit: cover for hero images
✓ Add subtle hover effects (scale, shadow)

CONTENT USAGE:
✓ Use section titles as main headings
✓ Convert bullet points into features, benefits, or list items
✓ Create compelling copy from provided content
✓ Add relevant emojis or icons (Unicode) for visual interest
✓ Maintain professional tone matching "${designBrief.artStyle}" style

═══════════════════════════════════════════════════════════════
📝 OUTPUT FORMAT
═══════════════════════════════════════════════════════════════

Return ONLY the complete HTML code. No markdown code blocks, no explanations, just pure HTML.

Start with <!DOCTYPE html> and end with </html>

Include ALL CSS in a <style> tag in the <head>.

The HTML must be production-ready and work when saved as a .html file.

Make it look STUNNING and PROFESSIONAL. This will be evaluated by the CEO!

═══════════════════════════════════════════════════════════════

Generate the complete HTML code now:`;

  let fullHtmlCode = "";
  let maxAttempts = Math.min(apiKeys.length, 5); // Try up to 5 keys or all available

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const apiKey = await pool.acquire();
    
    try {
      console.log(`   🔑 Attempt ${attempt}/${maxAttempts}: Using API key from pool`);
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash", // Same model as other services use successfully
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192, // Large enough for complete HTML
        }
      });

      const result = await model.generateContentStream(prompt);

      // Collect streaming response
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          fullHtmlCode += chunkText;
        }
      }

      // Clean the response
      fullHtmlCode = cleanHtmlCode(fullHtmlCode);

      // Validate HTML
      if (!fullHtmlCode.includes("<!DOCTYPE html>") && !fullHtmlCode.includes("<html")) {
        throw new Error("Generated code does not appear to be valid HTML");
      }

      console.log("   ✅ Gemini successfully generated HTML!");
      pool.release(apiKey, true);
      return fullHtmlCode;

    } catch (error) {
      pool.release(apiKey, false);
      
      if (error.message.includes("quota") || error.message.includes("429") || error.statusCode === 429) {
        console.warn(`   ⚠️  Quota exceeded, rotating to next key... (${maxAttempts - attempt} attempts left)`);
        if (attempt < maxAttempts) {
          continue; // Try next API key
        }
      } else {
        // Non-quota error, log and fall back immediately
        console.error("   ❌ Gemini API Error:", error.message);
        break;
      }
    }
  }

  // Fallback: generate a modern HTML template
  console.log("⚠️  All API keys exhausted or error occurred. Using enhanced fallback template...");
  return generateFallbackHtml(designBrief, presentation);
}

/**
 * Clean HTML code from Gemini response
 * @param {string} rawHtml - Raw HTML from Gemini
 * @returns {string} Cleaned HTML
 */
function cleanHtmlCode(rawHtml) {
  let cleaned = rawHtml.trim();

  // Remove markdown code blocks if present
  cleaned = cleaned.replace(/```html\n?/g, "");
  cleaned = cleaned.replace(/```\n?/g, "");

  // Ensure proper DOCTYPE
  if (!cleaned.startsWith("<!DOCTYPE html>")) {
    if (cleaned.startsWith("<html")) {
      cleaned = "<!DOCTYPE html>\n" + cleaned;
    }
  }

  return cleaned;
}

/**
 * Save website files to a dedicated folder (HTML + CSS + JS)
 * @param {string} htmlCode - Complete HTML code
 * @param {string} cssCode - Complete CSS code
 * @param {string} jsCode - Complete JavaScript code
 * @param {string} topic - Website topic for folder name
 * @param {string} sourceUrl - Source URL for reference
 * @param {Object} presentation - Full presentation data for metadata
 * @returns {Promise<Object>} Folder and file details
 */
// services/websiteGenerator.js → replace saveWebsiteFiles()
async function saveWebsiteFiles(htmlCode, cssCode, jsCode, topic, sourceUrl, presentation) {
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(4).toString("hex");
  const safeTopic = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").substring(0, 30);
  const folderName = `${safeTopic}-${timestamp}-${randomId}`;

  const readmeContent = `# ${topic}
## AI-Generated Website
**Source URL:** ${sourceUrl}
**Generated:** ${new Date().toISOString()}
**Presentation ID:** ${presentation.presentation_id}

Files included: index.html, styles.css, app.js, README.md
`;

  const files = [
    { type: "html", content: htmlCode },
    { type: "css", content: cssCode },
    { type: "js", content: jsCode },
    { type: "readme", content: readmeContent }
  ];

  const totalSize = files.reduce((sum, f) => sum + Buffer.byteLength(f.content), 0);
  const sizeKB = (totalSize / 1024).toFixed(2);

  return {
    folderName,
    files,           // ← array of {type, content}
    sizeKB: parseFloat(sizeKB),
    previewUrl: `/website-preview/${folderName}/index.html` // optional if you serve later
  };
}

/**
 * Generate STUNNING fallback HTML when Gemini fails
 * Ultra-modern design with glass-morphism, 3D effects, and impressive animations
 * @param {Object} designBrief - Design brief
 * @param {Object} presentation - Presentation data
 * @returns {string} Modern, sleek HTML template
 */
function generateFallbackHtml(designBrief, presentation) {
  const color1 = designBrief.colorPalette[0] || "#667eea";
  const color2 = designBrief.colorPalette[1] || "#764ba2";
  const color3 = designBrief.colorPalette[2] || "#f093fb";
  const color4 = designBrief.colorPalette[3] || "#4facfe";
  const color5 = designBrief.colorPalette[4] || "#00f2fe";

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${designBrief.topic}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&display=swap');
        
        :root {
            --primary: ${color1};
            --secondary: ${color2};
            --accent: ${color3};
            --accent2: ${color4};
            --accent3: ${color5};
            --bg-dark: #0f0f0f;
            --bg-card: rgba(255, 255, 255, 0.03);
            --text-primary: #ffffff;
            --text-secondary: rgba(255, 255, 255, 0.7);
            --border-color: rgba(255, 255, 255, 0.1);
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', ${designBrief.primaryFont}, sans-serif;
            line-height: 1.6;
            color: var(--text-primary);
            background: #000000;
            position: relative;
            overflow-x: hidden;
        }
        
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(circle at 20% 30%, ${color1}15 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, ${color2}15 0%, transparent 50%),
                radial-gradient(circle at 40% 80%, ${color3}10 0%, transparent 50%);
            z-index: -1;
            animation: bgShift 20s ease-in-out infinite;
        }
        
        @keyframes bgShift {
            0%, 100% { transform: scale(1) rotate(0deg); }
            50% { transform: scale(1.1) rotate(5deg); }
        }
        
        html {
            scroll-behavior: smooth;
        }
        
        /* Hero Section - Ultra Modern */
        .hero {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 2rem;
            position: relative;
            overflow: hidden;
        }
        
        .hero::before {
            content: '';
            position: absolute;
            width: 150%;
            height: 150%;
            background: 
                conic-gradient(from 180deg at 50% 50%, 
                    ${color1}00 0deg, 
                    ${color1}40 45deg, 
                    ${color2}40 90deg, 
                    ${color3}40 180deg,
                    ${color1}00 360deg);
            animation: rotate 30s linear infinite;
            filter: blur(80px);
            opacity: 0.3;
        }
        
        @keyframes rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .hero-content {
            position: relative;
            z-index: 2;
            max-width: 1100px;
            animation: fadeInUp 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(60px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .hero h1 {
            font-size: clamp(3rem, 8vw, 7rem);
            font-weight: 900;
            background: linear-gradient(135deg, ${color1} 0%, ${color2} 50%, ${color3} 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 1.5rem;
            letter-spacing: -3px;
            line-height: 1.1;
            text-shadow: 0 0 80px ${color1}40;
        }
        
        .hero p {
            font-size: clamp(1.1rem, 2.5vw, 1.6rem);
            color: var(--text-secondary);
            margin-bottom: 3rem;
            font-weight: 300;
            max-width: 700px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .hero-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: linear-gradient(135deg, ${color1}20, ${color2}20);
            backdrop-filter: blur(20px);
            border: 1px solid var(--border-color);
            padding: 0.8rem 2rem;
            border-radius: 100px;
            color: var(--text-primary);
            font-size: 0.95rem;
            font-weight: 500;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 8px 32px ${color1}20;
        }
        
        .hero-badge:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 48px ${color1}30;
        }
        
        /* Container */
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 4rem 2rem;
        }
        
        /* Section Cards - 3D Glass Effect */
        .section {
            margin: 5rem auto;
            padding: 4rem;
            background: linear-gradient(135deg, var(--bg-card), rgba(255, 255, 255, 0.05));
            backdrop-filter: blur(40px) saturate(180%);
            border-radius: 32px;
            border: 1px solid var(--border-color);
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) backwards;
            position: relative;
            overflow: hidden;
        }
        
        .section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, ${color1}50, ${color2}50, transparent);
        }
        
        .section:nth-child(1) { animation-delay: 0.1s; }
        .section:nth-child(2) { animation-delay: 0.2s; }
        .section:nth-child(3) { animation-delay: 0.3s; }
        .section:nth-child(4) { animation-delay: 0.4s; }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(40px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        .section:hover {
            transform: translateY(-12px);
            box-shadow: 
                0 20px 60px rgba(0, 0, 0, 0.4),
                0 0 80px ${color1}15,
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
            border-color: ${color1}50;
        }
        
        .section h2 {
            font-size: clamp(2rem, 5vw, 3.5rem);
            font-weight: 700;
            background: linear-gradient(135deg, ${color1}, ${color2}, ${color3});
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 2.5rem;
            line-height: 1.2;
            letter-spacing: -1px;
        }
        
        /* Features Grid - Modern Cards */
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-top: 3rem;
        }
        
        .feature {
            padding: 2.5rem;
            background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
            border-radius: 20px;
            border: 1px solid var(--border-color);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(20px);
        }
        
        .feature::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: linear-gradient(90deg, ${color1}, ${color2}, ${color3});
            transform: translateX(-100%);
            transition: transform 0.5s ease;
        }
        
        .feature:hover::before {
            transform: translateX(0);
        }
        
        .feature:hover {
            transform: translateY(-8px);
            box-shadow: 
                0 16px 48px rgba(0, 0, 0, 0.3),
                0 0 40px ${color1}20;
            border-color: ${color1}50;
            background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
        }
        
        .feature-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            display: inline-block;
            background: linear-gradient(135deg, ${color1}, ${color2});
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        /* Images Gallery - Masonry Style */
        .image-gallery {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2.5rem;
            margin: 6rem 0;
        }
        
        .image-card {
            position: relative;
            border-radius: 24px;
            overflow: hidden;
            border: 1px solid var(--border-color);
            box-shadow: 
                0 12px 48px rgba(0, 0, 0, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.05);
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            animation: fadeIn 1s cubic-bezier(0.16, 1, 0.3, 1) backwards;
            aspect-ratio: 16/10;
        }
        
        .image-card:hover {
            transform: translateY(-16px) scale(1.03);
            box-shadow: 
                0 24px 72px rgba(0, 0, 0, 0.4),
                0 0 60px ${color1}25,
                0 0 0 1px ${color1}50;
        }
        
        .image-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            filter: brightness(0.9);
        }
        
        .image-card:hover img {
            transform: scale(1.15);
            filter: brightness(1);
        }
        
        .image-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(to top, 
                rgba(0,0,0,0.95) 0%, 
                rgba(0,0,0,0.7) 40%, 
                transparent 100%);
            padding: 2.5rem;
            color: white;
            transform: translateY(100%);
            transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .image-card:hover .image-overlay {
            transform: translateY(0);
        }
        
        .image-overlay p {
            font-size: 1.1rem;
            font-weight: 500;
            line-height: 1.5;
        }
        
        /* Description Text */
        .description {
            font-size: 1.15rem;
            line-height: 1.9;
            color: var(--text-secondary);
            margin-top: 2rem;
            padding: 2rem;
            background: linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
            border-radius: 16px;
            border: 1px solid var(--border-color);
            border-left: 3px solid ${color1};
            backdrop-filter: blur(20px);
        }
        
        /* Footer */
        footer {
            margin-top: 8rem;
            padding: 4rem 2rem;
            text-align: center;
            background: linear-gradient(135deg, rgba(255,255,255,0.02), transparent);
            backdrop-filter: blur(20px);
            border-top: 1px solid var(--border-color);
        }
        
        footer p {
            color: var(--text-secondary);
            font-size: 1rem;
            font-weight: 400;
        }
        
        footer p:first-child {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, ${color1}, ${color2});
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        /* Responsive */
        @media (max-width: 1024px) {
            .hero h1 {
                font-size: clamp(2.5rem, 7vw, 5rem);
            }
            
            .image-gallery {
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            }
        }
        
        @media (max-width: 768px) {
            .section {
                padding: 2.5rem 1.5rem;
                margin: 3rem 0;
            }
            
            .features-grid {
                grid-template-columns: 1fr;
                gap: 1.5rem;
            }
            
            .image-gallery {
                grid-template-columns: 1fr;
                gap: 2rem;
            }
            
            .container {
                padding: 2rem 1rem;
            }
            
            .hero {
                min-height: 80vh;
            }
        }
        
        /* Utility Classes */
        .gradient-text {
            background: linear-gradient(135deg, ${color1}, ${color2}, ${color3});
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        /* Scroll Indicator */
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(10px); }
        }
    </style>
</head>
<body>
    <!-- Hero Section -->
    <section class="hero">
        <div class="hero-content">
            <h1>${designBrief.topic}</h1>
            <p>Discover cutting-edge insights and content from ${new URL(designBrief.sourceUrl).hostname}</p>
            <div class="hero-badge">
                <span>✨</span>
                <span>AI-Powered Website Generation</span>
            </div>
        </div>
    </section>
    
    <!-- Main Content -->
    <div class="container">
        ${designBrief.sections.map((section, idx) => `
            <article class="section">
                <h2>${section.title}</h2>
                ${section.bullets && section.bullets.length > 0 ? `
                    <div class="features-grid">
                        ${section.bullets.map((bullet, idx) => `
                            <div class="feature">
                                <div class="feature-icon">${['💎', '⚡', '🚀', '✨', '🎯', '💫', '🔥', '⭐'][idx % 8]}</div>
                                <p>${bullet}</p>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                ${section.description ? `<div class="description">${section.description}</div>` : ''}
            </article>
        `).join('')}
        
        ${designBrief.images && designBrief.images.length > 0 ? `
            <section class="image-gallery">
                ${designBrief.images.map(img => `
                    <div class="image-card">
                        <img src="${img.url}" alt="${img.alt || img.caption || designBrief.topic}" loading="lazy">
                        <div class="image-overlay">
                            <p>${img.caption || img.alt || 'Image from ' + designBrief.topic}</p>
                        </div>
                    </div>
                `).join('')}
            </section>
        ` : ''}
    </div>
    
    <!-- Footer -->
    <footer>
        <p>🚀 Generated by AI Website Generator</p>
        <p style="margin-top: 0.8rem; font-size: 0.95rem;">Powered by Gemini AI • ${new Date().toISOString().split('T')[0]}</p>
        <p style="margin-top: 0.5rem; font-size: 0.85rem; opacity: 0.5;">Ultra-Modern • Responsive • Glass-morphism Design</p>
    </footer>
</body>
</html>`;
}

/**
 * Generate modern HTML structure using ALL website data
 * @param {Object} websiteData - Complete extracted website data
 * @param {Object} presentation - Unified presentation object
 * @returns {string} Complete HTML code
 */
function generateModernHTML(websiteData, presentation) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${websiteData.topic} - AI generated modern website">
    <title>${websiteData.topic}</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&display=swap" rel="stylesheet">
</head>
<body>
    <!-- Hero Section -->
    <section class="hero" id="hero">
        <div class="hero-background"></div>
        <div class="hero-content">
            <h1 class="hero-title">${websiteData.topic}</h1>
            <p class="hero-subtitle">Explore ${websiteData.sections.length} sections with ${websiteData.allImages.length} stunning visuals</p>
            <div class="hero-badge">
                <span class="badge-icon">✨</span>
                <span>AI-Generated Experience</span>
            </div>
            <a href="#content" class="scroll-indicator">
                <span>Scroll to explore</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M19 12l-7 7-7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </a>
        </div>
    </section>

    <!-- Main Content -->
    <main id="content" class="container">
        ${websiteData.sections.map((section, index) => `
        <!-- Section ${section.number} -->
        <article class="content-section" data-section="${index + 1}">
            <header class="section-header">
                <span class="section-number">0${section.number}</span>
                <h2 class="section-title">${section.title}</h2>
            </header>
            
            ${section.bullets && section.bullets.length > 0 ? `
            <div class="features-grid">
                ${section.bullets.map((bullet, idx) => `
                <div class="feature-card" data-animate>
                    <div class="feature-icon">${['💎', '⚡', '🚀', '✨', '🎯', '💫', '🔥', '⭐'][idx % 8]}</div>
                    <p class="feature-text">${bullet}</p>
                </div>
                `).join('')}
            </div>
            ` : ''}
            
            ${section.description ? `
            <div class="section-description">
                <p>${section.description}</p>
            </div>
            ` : ''}
        </article>
        `).join('')}

        <!-- Image Gallery -->
        ${websiteData.allImages.length > 0 ? `
        <section class="gallery-section" id="gallery">
            <header class="section-header">
                <span class="section-number">Gallery</span>
                <h2 class="section-title">Visual Showcase</h2>
                <p class="section-subtitle">${websiteData.allImages.length} images from ${new URL(websiteData.sourceUrl).hostname}</p>
            </header>
            
            <div class="image-gallery">
                ${websiteData.allImages.map((img, index) => `
                <div class="image-card" data-animate style="animation-delay: ${index * 0.1}s">
                    <div class="image-wrapper">
                        <img 
                            src="${img.src}" 
                            alt="${img.alt}" 
                            loading="lazy"
                            class="gallery-image"
                        >
                        <div class="image-overlay">
                            <p class="image-caption">${img.caption || img.alt}</p>
                        </div>
                    </div>
                </div>
                `).join('')}
            </div>
        </section>
        ` : ''}

        <!-- Headings Overview -->
        ${websiteData.allHeadings.length > 0 ? `
        <section class="headings-section" id="headings">
            <header class="section-header">
                <span class="section-number">Content</span>
                <h2 class="section-title">All Topics Covered</h2>
                <p class="section-subtitle">${websiteData.allHeadings.length} headings extracted</p>
            </header>
            
            <div class="headings-grid">
                ${websiteData.allHeadings.slice(0, 20).map((heading, index) => `
                <div class="heading-card" data-animate>
                    <span class="heading-level">H${heading.level}</span>
                    <p class="heading-text">${heading.text}</p>
                </div>
                `).join('')}
            </div>
        </section>
        ` : ''}
    </main>

    <!-- Footer -->
    <footer class="footer">
        <div class="footer-content">
            <div class="footer-info">
                <h3>🚀 AI Website Generator</h3>
                <p>Generated from <strong>${new URL(websiteData.sourceUrl).hostname}</strong></p>
                <p class="footer-meta">
                    ${websiteData.slideCount} sections • 
                    ${websiteData.allImages.length} images • 
                    ${websiteData.allHeadings.length} headings
                </p>
            </div>
            <div class="footer-tech">
                <p><strong>Powered by:</strong></p>
                <p>Gemini AI • Unified Web Deck Service</p>
                <p class="footer-date">${new Date().toISOString().split('T')[0]}</p>
            </div>
            <div class="footer-colors">
                <p><strong>Color Palette:</strong></p>
                <div class="color-swatches">
                    ${websiteData.colors.slice(0, 5).map(color => `
                    <div class="color-swatch" style="background-color: ${color}" title="${color}"></div>
                    `).join('')}
                </div>
            </div>
        </div>
    </footer>

    <script src="app.js"></script>
</body>
</html>`;
}

/**
 * Generate modern CSS stylesheet using ALL design data
 * @param {Object} websiteData - Complete extracted website data
 * @param {Object} presentation - Unified presentation object
 * @returns {string} Complete CSS code
 */
function generateModernCSS(websiteData, presentation) {
  const colors = websiteData.colors;
  const color1 = colors[0] || "#667eea";
  const color2 = colors[1] || "#764ba2";
  const color3 = colors[2] || "#f093fb";
  const color4 = colors[3] || "#4facfe";
  const color5 = colors[4] || "#00f2fe";

  // Intelligently determine background color based on palette
  // Check if palette has dark colors (prefer dark backgrounds from palette)
  const isDarkColor = (hex) => {
    const rgb = parseInt(hex.replace('#', ''), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma < 128;
  };

  const isLightColor = (hex) => !isDarkColor(hex);

  // Find background color from palette (prefer 2nd or last colors as they're often backgrounds)
  let bgColor = colors[1] || "#ffffff";
  let textColor = isDarkColor(bgColor) ? "#ffffff" : "#000000";
  let textSecondary = isDarkColor(bgColor) ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)";
  let cardBg = isDarkColor(bgColor) ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)";
  let borderColor = isDarkColor(bgColor) ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";

  // If white is in palette, check if we should use it as background
  if (colors.includes("#ffffff") || colors.includes("#fff")) {
    // Use white background if primary color is vibrant
    if (isDarkColor(color1) || color1.match(/^#[0-9a-f]{6}$/i)) {
      bgColor = "#ffffff";
      textColor = "#000000";
      textSecondary = "rgba(0, 0, 0, 0.7)";
      cardBg = "rgba(0, 0, 0, 0.03)";
      borderColor = "rgba(0, 0, 0, 0.1)";
    }
  }

  // Override with actual background if it's one of the extracted colors
  const darkColors = colors.filter(c => isDarkColor(c));
  const lightColors = colors.filter(c => isLightColor(c));
  
  if (darkColors.length > lightColors.length) {
    // Site is likely dark themed, use darkest color as background
    bgColor = darkColors[darkColors.length - 1] || colors[1] || "#0d121c";
    textColor = "#ffffff";
    textSecondary = "rgba(255, 255, 255, 0.7)";
    cardBg = "rgba(255, 255, 255, 0.05)";
    borderColor = "rgba(255, 255, 255, 0.1)";
  } else {
    // Site is likely light themed
    bgColor = lightColors[lightColors.length - 1] || colors[colors.length - 1] || "#ffffff";
    textColor = "#000000";
    textSecondary = "rgba(0, 0, 0, 0.7)";
    cardBg = "rgba(0, 0, 0, 0.03)";
    borderColor = "rgba(0, 0, 0, 0.1)";
  }

  return `:root {
    --color-primary: ${color1};
    --color-secondary: ${color2};
    --color-accent: ${color3};
    --color-accent2: ${color4};
    --color-accent3: ${color5};
    --color-bg-main: ${bgColor};
    --color-bg-card: ${cardBg};
    --color-text-primary: ${textColor};
    --color-text-secondary: ${textSecondary};
    --color-border: ${borderColor};
    --font-primary: 'Inter', ${websiteData.typography.primaryFont}, sans-serif;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html {
    scroll-behavior: smooth;
}

body {
    font-family: var(--font-primary);
    line-height: 1.6;
    color: var(--color-text-primary);
    background: var(--color-bg-main);
    position: relative;
    overflow-x: hidden;
}

body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: 
        radial-gradient(circle at 20% 30%, ${color1}08 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, ${color2}08 0%, transparent 50%),
        radial-gradient(circle at 40% 80%, ${color3}05 0%, transparent 50%);
    z-index: -1;
    animation: bgShift 20s ease-in-out infinite;
}

@keyframes bgShift {
    0%, 100% { transform: scale(1) rotate(0deg); }
    50% { transform: scale(1.1) rotate(5deg); }
}

/* Hero Section */
.hero {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem;
    position: relative;
    overflow: hidden;
}

.hero-background {
    position: absolute;
    width: 150%;
    height: 150%;
    background: 
        conic-gradient(from 180deg at 50% 50%, 
            ${color1}00 0deg, 
            ${color1}25 45deg, 
            ${color2}25 90deg, 
            ${color3}25 180deg,
            ${color1}00 360deg);
    animation: rotate 30s linear infinite;
    filter: blur(80px);
    opacity: 0.2;
}

@keyframes rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.hero-content {
    position: relative;
    z-index: 2;
    max-width: 1100px;
    animation: fadeInUp 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(60px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.hero-title {
    font-size: clamp(3rem, 8vw, 7rem);
    font-weight: 900;
    background: linear-gradient(135deg, ${color1} 0%, ${color2} 50%, ${color3} 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 1.5rem;
    letter-spacing: -3px;
    line-height: 1.1;
}

.hero-subtitle {
    font-size: clamp(1.1rem, 2.5vw, 1.6rem);
    color: var(--color-text-secondary);
    margin-bottom: 3rem;
    font-weight: 300;
    max-width: 700px;
    margin-left: auto;
    margin-right: auto;
}

.hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: linear-gradient(135deg, ${color1}15, ${color2}15);
    backdrop-filter: blur(20px);
    border: 1px solid var(--color-border);
    padding: 0.8rem 2rem;
    border-radius: 100px;
    font-size: 0.95rem;
    font-weight: 500;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 8px 32px ${color1}15;
    margin-bottom: 3rem;
}

.hero-badge:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 48px ${color1}30;
}

.scroll-indicator {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-text-secondary);
    text-decoration: none;
    font-size: 0.9rem;
    transition: all 0.3s ease;
    animation: bounce 2s ease-in-out infinite;
}

.scroll-indicator:hover {
    color: var(--color-text-primary);
}

@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(10px); }
}

/* Container */
.container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 4rem 2rem;
}

/* Section Header */
.section-header {
    margin-bottom: 3rem;
    text-align: center;
}

.section-number {
    display: inline-block;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-primary);
    background: linear-gradient(135deg, ${color1}15, ${color2}15);
    padding: 0.5rem 1.5rem;
    border-radius: 50px;
    margin-bottom: 1rem;
}

.section-title {
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 700;
    background: linear-gradient(135deg, ${color1}, ${color2}, ${color3});
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 1rem;
    letter-spacing: -1px;
}

.section-subtitle {
    font-size: 1.1rem;
    color: var(--color-text-secondary);
}

/* Content Section */
.content-section {
    margin: 6rem auto;
    padding: 4rem;
    background: var(--color-bg-card);
    backdrop-filter: blur(40px) saturate(180%);
    border-radius: 32px;
    border: 1px solid var(--color-border);
    box-shadow: 
        0 8px 32px ${color1}10,
        inset 0 1px 0 var(--color-border);
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) backwards;
    position: relative;
    overflow: hidden;
}

.content-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, ${color1}, ${color2}, transparent);
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(40px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.content-section:hover {
    transform: translateY(-12px);
    box-shadow: 
        0 20px 60px ${color1}20,
        0 0 80px ${color1}15,
        inset 0 1px 0 var(--color-border);
    border-color: ${color1};
}

/* Features Grid */
.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
}

.feature-card {
    padding: 2.5rem;
    background: var(--color-bg-card);
    border-radius: 20px;
    border: 1px solid var(--color-border);
    box-shadow: 0 8px 32px ${color1}08;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(20px);
}

.feature-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: linear-gradient(90deg, ${color1}, ${color2}, ${color3});
    transform: translateX(-100%);
    transition: transform 0.5s ease;
}

.feature-card:hover::before {
    transform: translateX(0);
}

.feature-card:hover {
    transform: translateY(-8px);
    box-shadow: 
        0 16px 48px ${color1}15,
        0 0 40px ${color1}20;
    border-color: ${color1};
    background: var(--color-bg-card);
}

.feature-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    display: inline-block;
}

.feature-text {
    font-size: 1.05rem;
    line-height: 1.7;
    color: var(--color-text-secondary);
}

/* Section Description */
.section-description {
    margin-top: 2rem;
    padding: 2rem;
    background: var(--color-bg-card);
    border-radius: 16px;
    border: 1px solid var(--color-border);
    border-left: 4px solid ${color1};
    backdrop-filter: blur(20px);
}

.section-description p {
    font-size: 1.15rem;
    line-height: 1.9;
    color: var(--color-text-secondary);
}

/* Image Gallery */
.gallery-section {
    margin: 8rem auto;
}

.image-gallery {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2.5rem;
    margin-top: 4rem;
}

.image-card {
    position: relative;
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid var(--color-border);
    box-shadow: 
        0 12px 48px ${color1}10,
        0 0 0 1px var(--color-border);
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    aspect-ratio: 16/10;
}

[data-animate] {
    opacity: 0;
    animation: fadeIn 0.8s ease-out forwards;
}

@keyframes fadeIn {
    to {
        opacity: 1;
    }
}

.image-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
}

.gallery-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    filter: brightness(0.9);
}

.image-card:hover {
    transform: translateY(-16px) scale(1.03);
    box-shadow: 
        0 24px 72px ${color1}20,
        0 0 60px ${color1}30,
        0 0 0 2px ${color1};
}

.image-card:hover .gallery-image {
    transform: scale(1.15);
    filter: brightness(1);
}

.image-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top, 
        ${color1}f0 0%, 
        ${color1}b0 40%, 
        transparent 100%);
    padding: 2.5rem;
    color: white;
    transform: translateY(100%);
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.image-card:hover .image-overlay {
    transform: translateY(0);
}

.image-caption {
    font-size: 1.1rem;
    font-weight: 500;
    line-height: 1.5;
}

/* Headings Grid */
.headings-section {
    margin: 8rem auto;
}

.headings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-top: 3rem;
}

.heading-card {
    padding: 1.5rem;
    background: var(--color-bg-card);
    border-radius: 16px;
    border: 1px solid var(--color-border);
    transition: all 0.3s ease;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
}

.heading-card:hover {
    transform: translateX(8px);
    border-color: ${color1};
    background: var(--color-bg-card);
}

.heading-level {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-primary);
    background: ${color1}20;
    padding: 0.25rem 0.75rem;
    border-radius: 8px;
    flex-shrink: 0;
}

.heading-text {
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--color-text-secondary);
}

/* Footer */
.footer {
    margin-top: 8rem;
    padding: 4rem 2rem;
    background: var(--color-bg-card);
    backdrop-filter: blur(20px);
    border-top: 2px solid ${color1};
}

.footer-content {
    max-width: 1400px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 3rem;
}

.footer-info h3,
.footer-tech p:first-child,
.footer-colors p:first-child {
    background: linear-gradient(135deg, ${color1}, ${color2});
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.footer-info p,
.footer-tech p,
.footer-colors p {
    color: var(--color-text-secondary);
    font-size: 0.95rem;
    margin-top: 0.5rem;
}

.footer-meta {
    margin-top: 1rem !important;
    font-size: 0.9rem !important;
    opacity: 0.7;
}

.color-swatches {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
}

.color-swatch {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: 2px solid var(--color-border);
    transition: all 0.3s ease;
    cursor: pointer;
}

.color-swatch:hover {
    transform: scale(1.2);
    border-color: white;
}

/* Responsive */
@media (max-width: 1024px) {
    .hero-title {
        font-size: clamp(2.5rem, 7vw, 5rem);
    }
    
    .image-gallery {
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }
}

@media (max-width: 768px) {
    .content-section {
        padding: 2.5rem 1.5rem;
        margin: 3rem 0;
    }
    
    .features-grid,
    .image-gallery {
        grid-template-columns: 1fr;
    }
    
    .container {
        padding: 2rem 1rem;
    }
    
    .hero {
        min-height: 80vh;
    }
    
    .footer-content {
        grid-template-columns: 1fr;
        gap: 2rem;
    }
}`;
}

/**
 * Generate modern JavaScript for interactions
 * @param {Object} websiteData - Complete extracted website data
 * @param {Object} presentation - Unified presentation object
 * @returns {string} Complete JavaScript code
 */
function generateModernJS(websiteData, presentation) {
  return `// =============================================================================
// Interactive JavaScript - Website Generator
// =============================================================================

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Intersection Observer for scroll animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all animated elements
document.querySelectorAll('[data-animate]').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    observer.observe(el);
});

// Parallax effect for hero background
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroBackground = document.querySelector('.hero-background');
    if (heroBackground) {
        heroBackground.style.transform = \`translateY(\${scrolled * 0.5}px)\`;
    }
});

// Image lazy loading enhancement
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.classList.add('loaded');
            imageObserver.unobserve(img);
        }
    });
});

document.querySelectorAll('.gallery-image').forEach(img => {
    imageObserver.observe(img);
});

// Add loading state to images
document.querySelectorAll('.gallery-image').forEach(img => {
    img.addEventListener('load', () => {
        img.parentElement.classList.add('image-loaded');
    });
});

// Keyboard navigation for accessibility
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Close any open modals or overlays
        document.querySelectorAll('.modal, .overlay').forEach(el => {
            el.classList.remove('active');
        });
    }
});

// Dynamic section numbering animation
const sections = document.querySelectorAll('.content-section');
sections.forEach((section, index) => {
    section.style.setProperty('--section-delay', \`\${index * 0.1}s\`);
});

// Color swatch interaction
document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
        const color = swatch.style.backgroundColor;
        navigator.clipboard.writeText(color).then(() => {
            const tooltip = document.createElement('span');
            tooltip.textContent = 'Copied!';
            tooltip.style.cssText = \`
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: white;
                color: black;
                padding: 0.5rem 1rem;
                border-radius: 8px;
                font-size: 0.85rem;
                font-weight: 600;
                pointer-events: none;
                animation: fadeOut 2s forwards;
            \`;
            swatch.parentElement.style.position = 'relative';
            swatch.parentElement.appendChild(tooltip);
            setTimeout(() => tooltip.remove(), 2000);
        });
    });
});

// Scroll progress indicator
const createScrollIndicator = () => {
    const indicator = document.createElement('div');
    indicator.style.cssText = \`
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, ${websiteData.colors[0] || '#667eea'}, ${websiteData.colors[1] || '#764ba2'});
        width: 0%;
        z-index: 9999;
        transition: width 0.1s ease;
    \`;
    document.body.appendChild(indicator);
    
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        indicator.style.width = scrolled + '%';
    });
};

createScrollIndicator();

// Log generation info
console.log('%c🚀 Website Generated Successfully!', 'font-size: 20px; font-weight: bold; color: ${websiteData.colors[0] || '#667eea'}');
console.log('%cPresentation ID:', 'font-weight: bold', '${websiteData.presentationId}');
console.log('%cTotal Sections:', 'font-weight: bold', ${websiteData.sections.length});
console.log('%cTotal Images:', 'font-weight: bold', ${websiteData.allImages.length});
console.log('%cTotal Headings:', 'font-weight: bold', ${websiteData.allHeadings.length});
console.log('%cColor Palette:', 'font-weight: bold', ${JSON.stringify(websiteData.colors)});

// Ready state
document.addEventListener('DOMContentLoaded', () => {
    console.log('%c✨ All interactions loaded!', 'color: ${websiteData.colors[2] || '#f093fb'}; font-weight: bold');
});`;
}

module.exports = {
  generateWebsiteFromUrl,
};
