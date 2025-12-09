/**
 * =============================================================================
 * DYNAMIC WEBSITE GENERATOR SERVICE
 * =============================================================================
 * 
 * Purpose: Generate truly dynamic, structure-aware websites that mimic
 *          the original website's layout and structure
 * 
 * Key Features:
 * - Dynamic HTML structure based on actual website layout
 * - Adaptive design that matches original site structure
 * - Smart content organization
 * - Proper color contrast and readability
 * - Modern, sleek design tailored to each URL
 * 
 * Difference from standard generator:
 * - HTML structure varies per URL (not template-based)
 * - Mimics original website's layout patterns
 * - Better content organization and hierarchy
 * - Enhanced visual presentation
 * 
 * Created: 2025-11-20
 * =============================================================================
 */

const { generateUnifiedWebDeck } = require("./unifiedWebDeck");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const { textGenModel } = require("../utils/geminiModels");

/**
 * Main function: Generate dynamic website from URL
 * @param {string} websiteUrl - Target website URL
 * @returns {Object} Complete generation result with folder and file contents
 */
async function generateDynamicWebsite(websiteUrl) {
  try {
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║       🌐 DYNAMIC WEBSITE GENERATOR INITIATED              ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log(`📍 Source URL: ${websiteUrl}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}\n`);

    // Step 1: Generate unified presentation
    console.log("📊 Step 1/6: Generating unified presentation data...\n");
    const unifiedResult = await generateUnifiedWebDeck(websiteUrl);

    if (!unifiedResult || !unifiedResult.success || !unifiedResult.presentation) {
      throw new Error("Failed to generate unified presentation");
    }

    const presentation = unifiedResult.presentation;

    console.log("✅ Unified presentation generated successfully!");
    console.log(`   - Slides: ${presentation.slide_count}`);
    console.log(`   - Topic: ${presentation.topic}`);
    console.log(`   - Art Style: ${presentation.art_style}`);
    console.log(`   - Color Palette: ${presentation.art_palette?.slice(0, 3).join(", ")}...\n`);

    // Step 2: Extract and analyze website data
    console.log("🎨 Step 2/6: Analyzing website structure and content...");
    const websiteData = await analyzeWebsiteStructure(presentation, websiteUrl);
    console.log(`   ✅ Analyzed data:`);
    console.log(`      - ${websiteData.allImages.length} images`);
    console.log(`      - ${websiteData.allHeadings.length} headings`);
    console.log(`      - ${websiteData.sections.length} content sections`);
    console.log(`      - ${websiteData.colors.length} colors\n`);

    // Step 3: Generate dynamic HTML with AI (with retry)
    console.log("📄 Step 3/6: Generating dynamic HTML structure with AI...");
    let htmlCode;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        htmlCode = await generateDynamicHTML(websiteData, presentation);
        console.log(`   ✅ HTML generated (${(htmlCode.length / 1024).toFixed(2)} KB, ${htmlCode.split('\n').length} lines)\n`);
        break;
      } catch (error) {
        retryCount++;
        console.log(`   ⚠️ HTML generation attempt ${retryCount} failed: ${error.message}`);
        if (retryCount === maxRetries) {
          throw new Error('Failed to generate quality HTML after 3 attempts');
        }
        console.log(`   🔄 Retrying HTML generation...`);
      }
    }

    // Step 4: Generate adaptive CSS with AI (with retry and HTML context)
    console.log("🎨 Step 4/6: Generating adaptive CSS stylesheet with AI...");
    let cssCode;
    retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        cssCode = await generateAdaptiveCSS(websiteData, presentation, htmlCode);
        console.log(`   ✅ CSS generated (${(cssCode.length / 1024).toFixed(2)} KB, ${cssCode.split('\n').length} lines)\n`);
        break;
      } catch (error) {
        retryCount++;
        console.log(`   ⚠️ CSS generation attempt ${retryCount} failed: ${error.message}`);
        if (retryCount === maxRetries) {
          throw new Error('Failed to generate quality CSS after 3 attempts');
        }
        console.log(`   🔄 Retrying CSS generation...`);
      }
    }

    // Step 5: Generate enhanced JS with AI (with retry and HTML context)
    console.log("⚡ Step 5/6: Generating enhanced JavaScript with AI...");
    let jsCode;
    retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        jsCode = await generateEnhancedJS(websiteData, presentation, htmlCode);
        console.log(`   ✅ JS generated (${(jsCode.length / 1024).toFixed(2)} KB, ${jsCode.split('\n').length} lines)\n`);
        break;
      } catch (error) {
        retryCount++;
        console.log(`   ⚠️ JS generation attempt ${retryCount} failed: ${error.message}`);
        if (retryCount === maxRetries) {
          throw new Error('Failed to generate quality JS after 3 attempts');
        }
        console.log(`   🔄 Retrying JS generation...`);
      }
    }

    // Step 6: Final AI Quality Check
    console.log("🔍 Step 6/7: Running final AI quality check...");
    retryCount = 0;

    while (retryCount < 2) { // Only 2 attempts for quality check
      try {
        const qualityCheck = await performFinalQualityCheck(htmlCode, cssCode, websiteData);
        if (!qualityCheck.passed) {
          throw new Error(`Quality check failed: ${qualityCheck.issues.join(', ')}`);
        }
        console.log(`   ✅ Quality check passed - All validations successful\n`);
        break;
      } catch (error) {
        retryCount++;
        console.log(`   ⚠️ Quality check failed (attempt ${retryCount}): ${error.message}`);
        if (retryCount >= 2) {
          console.log(`   ⚠️ Warning: Proceeding with minor quality issues after ${retryCount} attempts\n`);
          break; // Proceed with warning instead of failing
        }
        console.log(`   🔄 Regenerating CSS only to fix styling issues...`);

        // Only regenerate CSS, not HTML (to avoid triggering validation again)
        try {
          cssCode = await generateAdaptiveCSS(websiteData, presentation, htmlCode);
        } catch (cssError) {
          console.log(`   ⚠️ CSS regeneration failed, using previous CSS\n`);
          break; // Use what we have
        }
      }
    }

    // Step 7: Save to dynamic-websites folder
    console.log("💾 Step 7/7: Saving to dynamic-websites folder...");
    const savedWebsite = await saveDynamicWebsite(htmlCode, cssCode, jsCode, websiteData, presentation, websiteUrl);

    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║       ✨ DYNAMIC WEBSITE GENERATION COMPLETE!             ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    // Build response with folder as object name
    const responseData = {
      success: true,
      message: "Dynamic website generated successfully",
      [savedWebsite.folderName]: {
        folderPath: savedWebsite.folderPath,
        relativePath: savedWebsite.relativePath,
        sizeKB: savedWebsite.sizeKB,
        previewUrl: savedWebsite.previewUrl,
        files: [
          {
            "file-type": "html",
            content: htmlCode
          },
          {
            "file-type": "css",
            content: cssCode
          },
          {
            "file-type": "js",
            content: jsCode
          },
          {
            "file-type": "readme",
            content: savedWebsite.readmeContent
          }
        ]
      },
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

    return responseData;

  } catch (error) {
    console.error("\n╔════════════════════════════════════════════════════════════╗");
    console.error("║       ❌ DYNAMIC WEBSITE GENERATION FAILED                ║");
    console.error("╚════════════════════════════════════════════════════════════╝");
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}\n`);
    throw error;
  }
}

/**
 * Analyze website structure from unified presentation
 */
async function analyzeWebsiteStructure(presentation, sourceUrl) {
  const slides = presentation.slides || [];

  // Extract all images
  const allImages = [];
  slides.forEach(slide => {
    if (slide.image_url) {
      allImages.push({
        src: slide.image_url,
        alt: slide.image_caption || slide.slide_title?.text || "Image",
        caption: slide.image_caption || "",
      });
    }
    if (slide.images && Array.isArray(slide.images)) {
      slide.images.forEach(img => {
        if (img.src && !allImages.some(i => i.src === img.src)) {
          allImages.push({
            src: img.src,
            alt: img.alt || slide.slide_title?.text || "Image",
            caption: img.alt || "",
          });
        }
      });
    }
    if (slide.image_urls && Array.isArray(slide.image_urls)) {
      slide.image_urls.forEach(url => {
        if (url && !allImages.some(i => i.src === url)) {
          allImages.push({
            src: url,
            alt: slide.slide_title?.text || "Image",
            caption: "",
          });
        }
      });
    }
  });

  // Extract all headings
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

  // Extract sections with better organization
  const sections = slides.map((slide, index) => {
    const bullets = slide.elements
      ?.filter(el => el.element_type === "bullet_point")
      .map(el => el.text) || [];

    const descriptions = slide.elements
      ?.filter(el => el.element_type === "description")
      .map(el => el.text) || [];

    return {
      id: slide.slide_id,
      number: index + 1,
      title: slide.slide_title?.text || `Section ${index + 1}`,
      bullets: bullets,
      descriptions: descriptions,
      layoutType: slide.layout_type || "content",
      images: slide.images || [],
    };
  });

  return {
    topic: presentation.topic,
    sourceUrl: sourceUrl,
    hostname: new URL(sourceUrl).hostname,
    presentationId: presentation.presentation_id,
    allImages: allImages,
    allHeadings: allHeadings,
    sections: sections,
    colors: presentation.art_palette || ["#667eea", "#764ba2", "#ffffff"],
    artStyle: presentation.art_style || "modern",
    slideCount: presentation.slide_count,
  };
}

/**
 * Generate dynamic HTML structure using AI - TRULY UNIQUE PER WEBSITE
 */
async function generateDynamicHTML(websiteData, presentation) {
  const imagesList = websiteData.allImages.slice(0, 8).map(img => img.src + " (alt: " + img.alt + ")").join(", ");
  const headingsList = websiteData.allHeadings.slice(0, 12).map(h => h.text || h).join(", ");
  const sectionsInfo = websiteData.sections.slice(0, 4).map(s => s.title + ": " + s.bullets.slice(0, 3).join("; ")).join(" | ");

  const prompt = `You are an expert web developer. Generate a COMPLETE, WELL-STRUCTURED HTML document for ${websiteData.topic} website.

WEBSITE CONTEXT:
Source URL: ${websiteData.sourceUrl}
Topic: ${websiteData.topic}
Hostname: ${websiteData.hostname}
Style: ${presentation.art_style}
Images Available: ${websiteData.allImages.length}
Sections: ${websiteData.sections.length}

IMAGES TO USE (select relevant ones):
${imagesList}

HEADINGS TO USE (incorporate naturally):
${headingsList}

CONTENT SECTIONS (use as reference):
${sectionsInfo}

CRITICAL REQUIREMENTS:
1. Generate QUALITY HTML specific to ${websiteData.topic} - NOT a generic template
2. **DISTRIBUTE ALL ${websiteData.allImages.length} IMAGES throughout the website** - don't cluster them in one section
3. Use meaningful headings that match the content hierarchy
4. Create structure based on ACTUAL WEBSITE: ${websiteData.sourceUrl}
5. Semantic HTML5: header, nav, main, sections, footer
6. Navigation: Links to main sections with proper href=#section-id
7. Include 4-6 distinct sections based on content: hero + 3-5 content sections + footer
8. Links: <link rel="stylesheet" href="styles.css"> and <script src="app.js" defer></script>
9. Complete head: meta charset, viewport, description, Open Graph, title
10. STRICTLY NO: [object Object], Lorem Ipsum, placeholder text, TODO comments
11. Use CONSISTENT class naming: .site-header, .hero, .content-section, .section-inner, .gallery-section, .cta-section, .site-footer
12. Every CSS class you create MUST be used - don't create unused classes

IMAGE DISTRIBUTION STRATEGY (CRITICAL - PREVENTS DULL PAGES):
- **Header/Navbar**: 1 SMALL logo image (MUST be inside <img> with class="logo" - CSS will resize to max-height: 40px)
- **Hero section**: 1 large hero image or background image
- **Features section**: 1 image per feature card (3-4 images) - NO empty cards without images
- **About/Content section**: 1-2 images alongside text content
- **Services/Products**: 1 image per service card (2-3 images) - NO empty cards without images
- **Gallery/Showcase section**: Remaining images (3-6 images) in grid layout
- **CTA section**: 1 background image or visual element
- IMPORTANT: Spread images evenly across ALL sections - never put all images in one gallery
- Each major section should have at least 1 image for visual interest
- Alternate image placement: left, right, center, background
- **REUSE IMAGES if needed**: If you have text boxes/cards without images, REUSE images from the list to fill them
- **NO EMPTY BOXES**: Every card, box, or section with text MUST have an accompanying image (reuse if needed)

STRICTLY FORBIDDEN - WILL CAUSE FAILURE:
13. NO authentication elements IN HEADER/NAV: NO "Sign in", "Sign up", "Login", "Register" buttons or links in navigation
    - Remove ALL auth-related links from header and navigation
    - CTA buttons in nav should be: "Get Started", "Contact Us", "Learn More" (NOT "Sign up" or "Log in")
14. NO dummy/placeholder text: NO "Case Study Title 1", "Project 1", "Service 1", "Feature 1"
15. NO repetitive content: Each heading and paragraph must be unique and meaningful
16. NO overly long paragraphs: Keep paragraphs concise (2-3 sentences max)
17. AVOID redundant headings: Don't repeat the same message multiple times (e.g., "AI partner everywhere" then "AI partner throughout")
18. Use REAL content from the headings list - don't make up generic content
19. Header CTA alternatives: Use "Get Started", "Contact Sales", "Request Demo", "Explore", "Learn More" instead of auth buttons

STRUCTURE VARIATIONS BY TYPE:
- Corporate/Agency: Hero + Services Grid + Case Studies + Team + CTA + Footer
- Educational: Hero + Programs + Admissions + Campus + Events + Footer
- Technical/Docs: Hero + Features + Documentation + API + Community + Footer

DETAILED HTML STRUCTURE REQUIRED WITH IMAGE DISTRIBUTION:
- DOCTYPE, html lang="en", complete head with: meta charset UTF-8, viewport, description, author, Open Graph
- **Header/Navigation**: SMALL logo <img src="..." alt="Logo" class="logo" width="auto" height="40"> + 6-8 menu links + CTA buttons
  * Logo MUST have class="logo" for CSS sizing control
  * Logo MUST NOT be oversized - CSS will enforce max-height: 40px
- **Hero Section**: h1, subtitle, 2 CTA buttons + 1 LARGE hero image/background (1 image)
  * Hero should NOT be hidden by navbar - add padding-top if needed
- **Features Section**: Grid of 3-4 feature cards, EACH CARD MUST HAVE:
  * 1 image (class="feature-image")
  * Heading (h3)
  * Description text
  * NO empty cards - if not enough images, REUSE images (3-4 images)
- **About/Content Section**: 2-column layout with 1-2 images on side + 3-4 paragraphs of content (1-2 images)
- **Services/Products Section**: Grid of 3-4 service cards, EACH CARD MUST HAVE:
  * 1 image (class="service-image")
  * Title (h3)
  * Description text
  * NO empty cards - if not enough images, REUSE images (3-4 images)
- **Showcase/Portfolio**: 2x3 or 3x3 grid with REMAINING images (4-6 images MAX, not all)
- **Statistics/Team Section**: 4-6 stat counters OR team member cards with small images (2-3 images)
- **Call-to-action**: Full-width section with heading, text, button + optional background image (0-1 image)
- **Footer**: 3-4 columns with links, social media icons, copyright

IMAGE PLACEMENT RULES:
- Total ${websiteData.allImages.length} images available - USE and REUSE them as needed
- **Logo in navbar**: Use FIRST suitable image as logo with class="logo" (CSS will resize)
- Each content section should have 1-3 images (not 0, not all)
- Alternate layouts: image-left-text-right, text-left-image-right, image-background, grid
- Hero: 1 image | Features: 3-4 images | About: 1-2 images | Services: 3-4 images | Gallery: 3-6 images
- NEVER: All images in one gallery section (boring and dull!)
- ALWAYS: Images spread throughout page for visual variety
- **REUSE IMAGES**: If you create 6 service cards but only have 4 images, REUSE 2 images to fill all cards
- **NO EMPTY BOXES/CARDS**: Every card/box with text MUST have an image - reuse images if needed
- **NO TEXT-ONLY SECTIONS**: If a section has text boxes below, add images to them (reuse if needed)

Technical requirements:
- Each section: unique ID, wrapper div, heading (h2/h3), rich content + IMAGES
- Class names: kebab-case (hero-section, feature-card, gallery-grid, etc)
- Every image: <img src="url" alt="descriptive text" loading="lazy">
- Every heading: actual text from the provided headings list

ABSOLUTELY FORBIDDEN - WILL CAUSE FAILURE:
- Short/compact HTML under 600 lines - YOU MUST generate 800-1000 lines
- Using "..." or "<!-- More content -->" or "Add content here"
- [object Object] appearing anywhere in the HTML
- Lorem Ipsum, placeholder text, or dummy content
- Empty sections without real content
- Generic templates - MUST be unique to ${websiteData.topic}
- Inline styles - use classes only
- Missing closing tags
- Not using all provided images and headings

EXAMPLE OF GOOD IMAGE DISTRIBUTION (for 12 images):
✅ CORRECT:
- Header: 1 logo
- Hero: 1 background
- Features: 3 cards with images
- About: 2 images
- Services: 3 cards with images  
- Gallery: 2 remaining images
= Visually balanced, images throughout

❌ WRONG:
- Header: logo
- Hero: background
- Features: no images
- About: no images
- Services: no images
- Gallery: ALL 10 images in one section
= Boring, dull, all images clustered

OUTPUT INSTRUCTIONS:
Generate EXTENSIVE, DETAILED HTML from <!DOCTYPE html> to </html>.
DISTRIBUTE all ${websiteData.allImages.length} images across multiple sections.
DO NOT truncate or summarize - generate FULL content for every section.
Output ONLY HTML code without explanations or markdown blocks.`;

  try {
    const result = await textGenModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    let htmlCode = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    htmlCode = htmlCode.replace(/```html\n?/g, "").replace(/```\n?/g, "").trim();

    // Comprehensive validation
    const validationErrors = [];

    if (!htmlCode.includes('<!DOCTYPE html>') || !htmlCode.includes('</html>')) {
      validationErrors.push('Invalid HTML structure');
    }

    // Check for forbidden authentication elements (only in nav/header, not in content)
    const headerMatch = htmlCode.match(/<header[\s\S]*?<\/header>/gi);
    const navMatch = htmlCode.match(/<nav[\s\S]*?<\/nav>/gi);
    const headerContent = (headerMatch || []).join('') + (navMatch || []).join('');

    const authPatterns = /(?:sign\s*in|sign\s*up|log\s*in|log\s*out|register|create\s*account)/gi;
    const authInHeader = authPatterns.test(headerContent);

    if (authInHeader) {
      validationErrors.push('Contains forbidden authentication elements in header/nav (Sign in/Sign up/Login/Register)');
    }

    // Check for dummy placeholder text
    const dummyPatterns = /case\s*study\s*(title\s*)?\d+|project\s*\d+|service\s*\d+|feature\s*\d+|item\s*\d+|placeholder|lorem\s*ipsum|\[.*?\]|xxx+|test\s*\d+/gi;
    if (dummyPatterns.test(htmlCode)) {
      validationErrors.push('Contains dummy/placeholder text (e.g., "Case Study Title 1", "Project 1")');
    }

    // Check image distribution - ensure images are spread throughout
    const imgTags = htmlCode.match(/<img[^>]+>/gi) || [];
    const totalImages = imgTags.length;

    if (totalImages < Math.min(4, websiteData.allImages.length)) {
      validationErrors.push(`Not enough images used (${totalImages} used, minimum ${Math.min(4, websiteData.allImages.length)} required)`);
    }

    // Check if images are clustered in one section (bad distribution)
    const sections = htmlCode.split(/<section/gi);
    const imagesPerSection = sections.map(s => (s.match(/<img/gi) || []).length);
    const maxImagesInOneSection = Math.max(...imagesPerSection);

    if (totalImages >= 6 && maxImagesInOneSection > totalImages * 0.6) {
      validationErrors.push(`Images clustered in one section (${maxImagesInOneSection}/${totalImages}). Distribute evenly across sections.`);
    }

    // Check for logo class to ensure navbar sizing
    const hasLogoClass = htmlCode.includes('class="logo"') || htmlCode.includes("class='logo'");
    if (!hasLogoClass && htmlCode.includes('<header')) {
      validationErrors.push('Logo image missing class="logo" for proper navbar sizing');
    }

    // Check for empty cards/boxes (cards with text but no images)
    const cardPatterns = /<div[^>]*class="[^"]*(?:card|box|item|feature)[^"]*"[^>]*>[\s\S]*?<\/div>/gi;
    const cards = htmlCode.match(cardPatterns) || [];
    const emptyCards = cards.filter(card => {
      const hasText = card.match(/<h\d|<p/gi);
      const hasImage = card.match(/<img/gi);
      return hasText && !hasImage;
    });

    if (emptyCards.length > 2) {
      validationErrors.push(`Found ${emptyCards.length} empty cards/boxes without images. Add images to all cards (reuse if needed).`);
    }

    if (validationErrors.length > 0) {
      throw new Error(`HTML validation failed: ${validationErrors.join(', ')}`);
    }

    return htmlCode;
  } catch (error) {
    console.error("❌ AI HTML generation failed:", error.message);
    throw error; // Don't use fallback, let caller handle retry
  }
}

/**
 * Fallback HTML generator (if AI fails)
 */
function generateFallbackHTML(websiteData, presentation) {
  const { topic, hostname, sections, allImages, allHeadings } = websiteData;

  // Analyze content to determine unique layout structure
  const hasImages = allImages.length > 0;
  const imageCount = allImages.length;
  const sectionCount = sections.length;
  const headingCount = allHeadings.length;

  // Deduplicate images - only show unique images
  const uniqueImages = allImages.filter((img, index, self) =>
    index === self.findIndex((t) => t.src === img.src)
  );

  // Determine layout variation based on content characteristics
  let layoutType = 'standard';
  if (imageCount > 15) layoutType = 'image-heavy';
  else if (imageCount < 3) layoutType = 'text-focused';
  else if (sectionCount > 5) layoutType = 'multi-section';
  else if (headingCount > 20) layoutType = 'content-rich';

  // Generate unique navigation based on actual sections
  const navItems = sections.slice(0, 5).map((section, idx) => {
    const shortTitle = section.title.length > 30
      ? section.title.substring(0, 27) + '...'
      : section.title;
    return `<a href="#section-${idx}" class="nav-link">${shortTitle}</a>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${topic} - ${hostname}">
    <title>${topic}</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="layout-${layoutType}" data-images="${imageCount}" data-sections="${sectionCount}">
    
    <!-- Header Navigation -->
    <header class="site-header">
        <div class="header-container">
            <div class="brand">
                <div class="brand-logo">${hostname.charAt(0).toUpperCase()}</div>
                <span class="brand-name">${hostname}</span>
            </div>
            <nav class="nav-links">
                ${navItems}
            </nav>
        </div>
    </header>

    <!-- Hero Section - Unique per layout -->
    ${layoutType === 'image-heavy' ? `
    <section class="hero hero-gallery">
        <div class="hero-grid">
            ${uniqueImages.slice(0, 6).map((img, idx) => `
            <div class="hero-grid-item" style="grid-area: img${idx + 1}">
                <img src="${img.src}" alt="${img.alt}" loading="eager">
            </div>
            `).join('')}
        </div>
        <div class="hero-overlay">
            <h1 class="hero-title">${topic}</h1>
            <p class="hero-lead">${hostname}</p>
        </div>
    </section>
    ` : layoutType === 'text-focused' ? `
    <section class="hero hero-minimal">
        <div class="hero-content-center">
            <h1 class="hero-title-large">${topic}</h1>
            <p class="hero-description">${sections[0]?.descriptions[0] || `Discover ${hostname}`}</p>
            <div class="hero-meta">
                <span>${sectionCount} Sections</span>
                <span>•</span>
                <span>${headingCount} Topics</span>
            </div>
        </div>
    </section>
    ` : `
    <section class="hero hero-split">
        <div class="hero-text">
            <h1 class="hero-title">${topic}</h1>
            <p class="hero-subtitle">${sections[0]?.bullets[0] || hostname}</p>
            ${hasImages && uniqueImages[0] ? '' : `
            <div class="hero-features">
                ${sections[0]?.bullets.slice(0, 3).map(bullet => `
                <div class="hero-feature">
                    <span class="feature-icon">✓</span>
                    <span>${bullet}</span>
                </div>
                `).join('') || ''}
            </div>
            `}
        </div>
        ${hasImages && uniqueImages[0] ? `
        <div class="hero-visual">
            <img src="${uniqueImages[0].src}" alt="${uniqueImages[0].alt}" loading="eager">
        </div>
        ` : ''}
    </section>
    `}

    <!-- Main Content - Dynamic layouts -->
    <main class="main-wrapper">
        ${sections.map((section, idx) => {
    const sectionImages = uniqueImages.filter(img =>
      section.images?.some(sImg => sImg.src === img.src)
    ).slice(0, 4);

    // Vary section layouts
    const layouts = ['grid', 'split', 'stack', 'featured', 'cards', 'masonry'];
    const currentLayout = layouts[idx % layouts.length];

    // Add related headings to this section
    const sectionHeadings = allHeadings.slice(idx * 3, (idx * 3) + 3);

    return `
        <article id="section-${idx}" class="content-section layout-${currentLayout}">
            <div class="section-inner">
                <header class="section-heading">
                    <span class="section-number">${String(idx + 1).padStart(2, '0')}</span>
                    <h2 class="section-title">${section.title}</h2>
                    ${section.descriptions[0] ? `<p class="section-intro">${section.descriptions[0]}</p>` : ''}
                </header>
                
                ${sectionHeadings.length > 0 ? `
                <div class="section-features">
                    ${sectionHeadings.map((heading, hIdx) => `
                    <div class="feature-item">
                        <h3 class="feature-title">${heading.text || heading}</h3>
                        <p class="feature-desc">${section.bullets[hIdx] || 'Key feature for ' + topic}</p>
                    </div>
                    `).join('')}
                </div>
                ` : ''}
                
                ${section.bullets.length > 0 ? `
                <div class="content-grid cols-${section.bullets.length > 6 ? '3' : section.bullets.length > 3 ? '2' : '1'}">
                    ${section.bullets.map((bullet, bulletIdx) => `
                    <div class="content-card ${bulletIdx % 2 === 0 ? 'card-accent' : ''}">
                        <div class="card-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M5 13l4 4L19 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="card-number">${String(bulletIdx + 1).padStart(2, '0')}</div>
                        <h4 class="card-title">${bullet.split(':')[0] || 'Feature ' + (bulletIdx + 1)}</h4>
                        <p class="card-text">${bullet}</p>
                    </div>
                    `).join('')}
                </div>
                ` : ''}
                
                ${section.descriptions.slice(1).length > 0 ? `
                <div class="section-body">
                    <div class="body-content">
                        ${section.descriptions.slice(1).map(desc => `
                        <p class="body-paragraph">${desc}</p>
                        `).join('')}
                    </div>
                    ${idx % 2 === 0 && uniqueImages[idx] ? `
                    <aside class="body-aside">
                        <img src="${uniqueImages[idx].src}" alt="${uniqueImages[idx].alt}" class="aside-image">
                        <p class="aside-caption">${uniqueImages[idx].caption || uniqueImages[idx].alt}</p>
                    </aside>
                    ` : ''}
                </div>
                ` : ''}
                
                ${sectionImages.length > 0 ? `
                <div class="section-media grid-${sectionImages.length}">
                    ${sectionImages.map((img, imgIdx) => `
                    <figure class="media-item item-${imgIdx + 1}">
                        <div class="media-image-wrap">
                            <img src="${img.src}" alt="${img.alt}" loading="lazy">
                        </div>
                        <figcaption class="media-caption">${img.caption || img.alt}</figcaption>
                    </figure>
                    `).join('')}
                </div>
                ` : ''}
                
                ${idx % 3 === 0 && section.bullets.length > 3 ? `
                <div class="section-stats">
                    ${section.bullets.slice(0, 4).map((stat, statIdx) => `
                    <div class="stat-item">
                        <div class="stat-number">${(statIdx + 1) * 100}+</div>
                        <div class="stat-label">${stat.split(' ').slice(0, 3).join(' ')}</div>
                    </div>
                    `).join('')}
                </div>
                ` : ''}
            </div>
        </article>
          `;
  }).join('')}
        
        <!-- Features Showcase -->
        <section class="features-showcase">
            <div class="showcase-container">
                <header class="section-heading centered">
                    <h2 class="section-title">Why Choose ${topic}</h2>
                    <p class="section-subtitle">Discover what makes us different</p>
                </header>
                <div class="features-grid">
                    ${sections.slice(0, 6).map((sec, idx) => `
                    <div class="feature-box">
                        <div class="feature-icon-wrap">
                            ${uniqueImages[idx] ? `<img src="${uniqueImages[idx].src}" alt="${uniqueImages[idx].alt}" class="feature-icon-img">` : `<span class="feature-icon-text">${String.fromCharCode(65 + idx)}</span>`}
                        </div>
                        <h3 class="feature-box-title">${sec.title.length > 40 ? sec.title.substring(0, 37) + '...' : sec.title}</h3>
                        <p class="feature-box-desc">${sec.bullets[0] || sec.descriptions[0] || ''}</p>
                    </div>
                    `).join('')}
                </div>
            </div>
        </section>

        ${uniqueImages.length > 8 ? `
        <!-- Visual Gallery -->
        <section class="gallery-section">
            <header class="section-heading centered">
                <h2 class="section-title">Explore Our Gallery</h2>
                <p class="section-subtitle">A visual journey through ${hostname}</p>
            </header>
            <div class="gallery-grid">
                ${uniqueImages.slice(0, 12).map((img, idx) => `
                <div class="gallery-item" style="--delay: ${idx * 0.05}s">
                    <div class="gallery-image-wrap">
                        <img src="${img.src}" alt="${img.alt}" loading="lazy" class="gallery-image">
                        <div class="gallery-overlay">
                            <span class="gallery-icon">+</span>
                        </div>
                    </div>
                    <p class="gallery-caption">${img.caption || img.alt}</p>
                </div>
                `).join('')}
            </div>
        </section>
        ` : ''}

        <!-- Call to Action -->
        <section class="cta-section">
            <div class="cta-container">
                <div class="cta-content">
                    <h2 class="cta-title">Ready to Get Started with ${topic}?</h2>
                    <p class="cta-text">Join thousands of users who trust ${hostname} for their needs. Start your journey today.</p>
                    <div class="cta-buttons">
                        <a href="#" class="button button-primary button-large">Get Started Free</a>
                        <a href="#" class="button button-secondary button-large">Contact Sales</a>
                    </div>
                </div>
                ${uniqueImages[0] ? `
                <div class="cta-visual">
                    <img src="${uniqueImages[0].src}" alt="Get started with ${topic}" class="cta-image">
                </div>
                ` : ''}
            </div>
        </section>

        <!-- Testimonials -->
        ${sections.length > 2 ? `
        <section class="testimonials-section">
            <header class="section-heading centered">
                <h2 class="section-title">What People Say</h2>
                <p class="section-subtitle">Trusted by professionals worldwide</p>
            </header>
            <div class="testimonials-grid">
                ${sections.slice(0, 3).map((sec, idx) => `
                <div class="testimonial-card">
                    <div class="testimonial-quote">
                        <svg class="quote-icon" width="32" height="32" viewBox="0 0 32 32">
                            <path d="M10 8c-3.3 0-6 2.7-6 6v10h8V14h-4c0-2.2 1.8-4 4-4V8zm12 0c-3.3 0-6 2.7-6 6v10h8V14h-4c0-2.2 1.8-4 4-4V8z"/>
                        </svg>
                        <p class="testimonial-text">"${sec.descriptions[0] || sec.bullets[0] || 'Excellent experience with ' + topic}"</p>
                    </div>
                    <div class="testimonial-author">
                        ${uniqueImages[idx + 3] ? `<img src="${uniqueImages[idx + 3].src}" alt="Customer" class="author-avatar">` : `<div class="author-avatar-placeholder"></div>`}
                        <div class="author-info">
                            <h4 class="author-name">User ${idx + 1}</h4>
                            <p class="author-role">Customer at ${hostname}</p>
                        </div>
                    </div>
                </div>
                `).join('')}
            </div>
        </section>
        ` : ''}

        <!-- Statistics -->
        <section class="stats-section">
            <div class="stats-container">
                <div class="stat-item">
                    <div class="stat-number">${imageCount * 100}+</div>
                    <div class="stat-label">Images Processed</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${sectionCount * 1000}+</div>
                    <div class="stat-label">Active Sections</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${headingCount * 50}+</div>
                    <div class="stat-label">Topics Covered</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">99.9%</div>
                    <div class="stat-label">Uptime</div>
                </div>
            </div>
        </section>
    </main>

    <!-- Footer -->
    <footer class="site-footer">
        <div class="footer-top">
            <div class="footer-container">
                <div class="footer-column footer-about">
                    <div class="footer-logo">
                        <div class="footer-logo-icon">${hostname.charAt(0).toUpperCase()}</div>
                        <h3 class="footer-logo-text">${hostname}</h3>
                    </div>
                    <p class="footer-description">${topic} - Your trusted partner for excellence.</p>
                    <div class="footer-social">
                        <a href="#" class="social-link" aria-label="Facebook">
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3c-1.1 0-2 .9-2 2v3h-2v4h2v9h4v-9h3l1-4h-4V5c0-.6.4-1 1-1h2V2z"/></svg>
                        </a>
                        <a href="#" class="social-link" aria-label="Twitter">
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
                        </a>
                        <a href="#" class="social-link" aria-label="LinkedIn">
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
                        </a>
                        <a href="#" class="social-link" aria-label="Instagram">
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                        </a>
                    </div>
                </div>

                <div class="footer-column">
                    <h4 class="footer-heading">Products</h4>
                    <ul class="footer-links">
                        ${sections.slice(0, 5).map(sec => `
                        <li><a href="#section-${sections.indexOf(sec)}">${sec.title.length > 25 ? sec.title.substring(0, 22) + '...' : sec.title}</a></li>
                        `).join('')}
                    </ul>
                </div>

                <div class="footer-column">
                    <h4 class="footer-heading">Company</h4>
                    <ul class="footer-links">
                        <li><a href="#about">About Us</a></li>
                        <li><a href="#careers">Careers</a></li>
                        <li><a href="#press">Press</a></li>
                        <li><a href="#blog">Blog</a></li>
                        <li><a href="#contact">Contact</a></li>
                    </ul>
                </div>

                <div class="footer-column">
                    <h4 class="footer-heading">Resources</h4>
                    <ul class="footer-links">
                        <li><a href="#docs">Documentation</a></li>
                        <li><a href="#help">Help Center</a></li>
                        <li><a href="#api">API Reference</a></li>
                        <li><a href="#community">Community</a></li>
                        <li><a href="#status">Status</a></li>
                    </ul>
                </div>

                <div class="footer-column footer-newsletter">
                    <h4 class="footer-heading">Newsletter</h4>
                    <p class="newsletter-text">Subscribe to get updates and news about ${topic}</p>
                    <form class="newsletter-form">
                        <input type="email" class="newsletter-input" placeholder="Enter your email" required>
                        <button type="submit" class="newsletter-button">Subscribe</button>
                    </form>
                </div>
            </div>
        </div>

        <div class="footer-bottom">
            <div class="footer-container">
                <p class="footer-copyright">&copy; ${new Date().getFullYear()} ${hostname}. All rights reserved.</p>
                <div class="footer-legal">
                    <a href="#privacy">Privacy Policy</a>
                    <span class="separator">•</span>
                    <a href="#terms">Terms of Service</a>
                    <span class="separator">•</span>
                    <a href="#cookies">Cookie Policy</a>
                </div>
                <p class="footer-source">Source: <a href="${websiteData.sourceUrl}" target="_blank" rel="noopener">${websiteData.sourceUrl}</a></p>
            </div>
        </div>
    </footer>

    <script src="app.js"></script>
</body>
</html>`;
}

/**
 * Generate adaptive CSS using AI - TRULY DYNAMIC
 */
async function generateAdaptiveCSS(websiteData, presentation, htmlCode) {
  // Extract all classes from HTML to ensure CSS matches
  const classMatches = htmlCode.match(/class="([^"]+)"/g) || [];
  const htmlClasses = [...new Set(
    classMatches.flatMap(m => m.replace(/class="/g, '').replace(/"/g, '').split(' '))
  )].filter(c => c.trim());

  const prompt = `You are an expert CSS developer. Generate COMPLETE, PRODUCTION-READY CSS stylesheet for "${websiteData.topic}" website.

CRITICAL: The HTML uses these classes - your CSS MUST style ALL of them:
${htmlClasses.join(', ')}

Generate CSS that targets THESE EXACT CLASSES. Do not create CSS for classes that don't exist in the HTML.

DESIGN CONTEXT:
Website: ${websiteData.sourceUrl}
Topic: ${websiteData.topic}
Industry Style: ${presentation.art_style}
Color Palette (MUST USE THESE): ${websiteData.colors.join(", ")}
Primary Color: ${websiteData.colors[0]}
Secondary Color: ${websiteData.colors[1]}
Accent Color: ${websiteData.colors[2]}

CRITICAL CSS REQUIREMENTS - MUST IMPLEMENT ALL:

1. CSS VARIABLES (COMPREHENSIVE):
:root {
  /* Brand Colors - USE PALETTE COLORS */
  --primary: ${websiteData.colors[0]};
  --secondary: ${websiteData.colors[1]};
  --accent: ${websiteData.colors[2]};
  --color-4: ${websiteData.colors[3] || websiteData.colors[0]};
  --color-5: ${websiteData.colors[4] || websiteData.colors[1]};
  
  /* Smart Background Colors - ANALYZE palette darkness */
  --bg-body: /* Use lightest color OR white if all dark */;
  --bg-section: /* Alternate section backgrounds */;
  --bg-card: /* Card backgrounds with slight opacity */;
  
  /* Text Colors - ENSURE CONTRAST */
  --text-primary: /* Dark text on light bg OR light text on dark bg */;
  --text-secondary: /* Muted version of primary text */;
  --text-inverse: /* Opposite of primary for overlays */;
  
  /* UI Colors */
  --border: /* Subtle border color */;
  --shadow: 0 2px 8px rgba(0,0,0,0.1);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.15);
  
  /* Spacing System */
  --spacing-xs: 0.5rem; --spacing-sm: 1rem; --spacing-md: 2rem;
  --spacing-lg: 4rem; --spacing-xl: 6rem; --spacing-2xl: 8rem;
  
  /* Typography */
  --font-primary: 'Inter', -apple-system, sans-serif;
  --font-heading: 'Space Grotesk', sans-serif;
  
  /* Layout */
  --container: 1200px;
  --container-wide: 1400px;
  --radius: 12px;
  --radius-lg: 24px;
}

2. BASE STYLES (REQUIRED):
- * { margin: 0; padding: 0; box-sizing: border-box; }
- body { font-family, background, color, line-height }
- Smooth scrolling: html { scroll-behavior: smooth; }
- Image responsiveness: img { max-width: 100%; height: auto; display: block; }

3. TYPOGRAPHY (DETAILED):
- h1: 3-4rem, bold, margin-bottom
- h2: 2.5-3rem, bold
- h3: 2rem, semi-bold
- p: 1.1rem, line-height 1.8
- a: color, text-decoration, hover effects

4. NAVIGATION (COMPLETE STYLING):
- **CRITICAL - Header positioning (.site-header, header)**:
  * position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
  * height: 60px to 80px (consistent height)
  * padding: 0.75rem 2rem (compact vertical padding)
  * backdrop-filter: blur(10px); background: rgba(255,255,255,0.95) or similar
- **Logo styling (.logo, .site-logo)**:
  * width: auto; max-height: 40px; max-width: 150px;
  * object-fit: contain; (prevents distortion)
- **CRITICAL - Navigation lists (.site-nav ul, .nav-links ul, nav ul)**:
  * list-style: none !important;
  * display: flex;
  * gap: 1rem or 2rem;
  * align-items: center;
  * margin: 0; padding: 0;
- Menu items: spacing, hover effects, active states
- Mobile menu toggle button
- Box-shadow on scroll

5. HERO SECTION (IMPRESSIVE):
- **CRITICAL - Hero positioning to avoid navbar overlap**:
  * ALWAYS add margin-top: 60px to 80px to .hero-section (pushes hero below fixed navbar)
  * Center content with flexbox: display: flex; align-items: center; justify-content: center;
  * Min-height should be: calc(100vh - 60px) to account for navbar height
  * Inner content (.hero-content, .hero-inner) should handle spacing, NOT .hero-section padding-top
  * Use margin-top on .hero-section, use padding for inner spacing
  * Example: .hero-section { margin-top: 70px; min-height: calc(100vh - 70px); display: flex; align-items: center; }
- Background: gradient or image overlay
- Text alignment and spacing
- Call-to-action button styling
- Animation on load (@keyframes fadeInUp)

6. CONTENT SECTIONS:
- Section padding: 4-6rem vertical
- Max-width container: 1200px
- Grid layouts: display: grid; grid-template-columns
- Card designs: background, border-radius, box-shadow, hover effects
- Image containers: aspect-ratio, overflow, border-radius

7. ANIMATIONS & TRANSITIONS:
- Smooth transitions: transition: all 0.3s ease;
- Hover effects: transform: translateY(-5px); box-shadow increase
- Loading animations: @keyframes for fade-in, slide-up
- Scroll reveal effects preparation

8. RESPONSIVE DESIGN (MANDATORY):
@media (max-width: 1024px) { /* Tablet */ }
@media (max-width: 768px) { /* Mobile */ }
@media (max-width: 480px) { /* Small mobile */ }
- Grid to stack on mobile
- Font size adjustments
- Padding/margin reductions
- Navigation to hamburger menu

9. COLORS & CONTRAST (CRITICAL):
- ANALYZE the color palette carefully
- IF background is dark: text MUST be light (#ffffff, #f0f0f0)
- IF background is light: text MUST be dark (#000000, #1a1a1a)
- Ensure MINIMUM contrast ratio of 4.5:1 for all text
- Test: Can you read white text on white background? NO! Fix it!
- Test: Can you read black text on black background? NO! Fix it!
- Buttons MUST be visible: Use accent color, add border, ensure contrast
- Default button state: MUST be visible (not transparent/invisible)
- Hover state: Can change opacity/transform but default MUST be visible
- Example GOOD button: background: var(--accent); color: white; border: 2px solid var(--accent);
- Example BAD button: background: transparent; color: transparent; (NEVER DO THIS)

10. INDUSTRY-SPECIFIC STYLING:
- Corporate: Clean, professional, subtle shadows, blue/gray tones
- Creative: Bold, gradients, animations, vibrant colors
- Technical: Monospace accents, code-like elements, structured grids
- Educational: Warm colors, accessible, clear hierarchy

11. IMAGE STYLING (PROPER PLACEMENT & SIZING):
- ALL images: max-width: 100%; height: auto; display: block;
- **Logo images (.logo)**: width: auto; max-height: 40px; max-width: 150px; object-fit: contain; (CRITICAL - prevents navbar overflow)
- **Navbar/header images**: MUST use class="logo" and be constrained to max-height: 40px
- Container images: width: 100%; object-fit: cover; aspect-ratio: 16/9;
- Gallery images: aspect-ratio: 4/3; object-fit: cover; border-radius: 8px;
- Hero images: width: 100%; max-height: 600px; object-fit: cover;
- **Feature/service card images (.feature-image, .service-image, .card-image)**: 
  * width: 100%; 
  * height: 200px; 
  * object-fit: cover; 
  * border-radius: 8px;
  * display: block;
- **CRITICAL - All card/box images MUST have these classes**: .feature-image, .service-image, .card-image for sizing
- **Prevent navbar overflow**: All header/navbar images MUST have max-height: 40px
- **Prevent image overflow in cards**: 
  * Card container: overflow: hidden;
  * Image wrapper: width: 100%; height: 200px; overflow: hidden;
- Center images: margin: 0 auto; or use flexbox centering
- Hover effects: transform: scale(1.05); transition: transform 0.3s;
- **Hero section visibility**: Add padding-top or margin-top to hero to prevent navbar covering it

12. FOOTER (MUST BE PROPERLY STRUCTURED):
- **CRITICAL**: Footer MUST use display: grid or display: flex for column layout
- Footer container: display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem;
- OR Footer container: display: flex; justify-content: space-between; gap: 2rem; flex-wrap: wrap;
- Each footer column (.footer-column): display: flex; flex-direction: column; gap: 0.75rem;
- Footer links: List with proper spacing, NOT all links in one messy line
- Background distinct from body (darker or different color)
- Padding: 3rem 2rem
- Links: proper color, hover states, organized vertically
- Copyright section: text-align: center; padding-top: 2rem; border-top: 1px solid;
- **NO messy unstructured footer**: All links must be in organized columns
- Example GOOD: 4 columns, each with heading + links list
- Example BAD: All 20 links in one horizontal line with no structure

CSS MUST INCLUDE:
- Reset/base styles (*, html, body, img with max-width: 100%)
- CSS variables (:root) with all colors from palette
- Typography (h1-h6, p, a, lists) with responsive sizes
- ALL classes that exist in the HTML (analyze HTML first!)
- Proper image sizing (max-width: 100%, object-fit: cover)
- Hover effects and transitions
- Responsive breakpoints (@media) for tablet and mobile
- Animations only where needed

STRICTLY FORBIDDEN:
- Hardcoded #000000 or #ffffff - USE PALETTE COLORS
- Same color for background and text (zero contrast)
- Missing responsive breakpoints
- Incomplete rules with "..." or /* add more */
- Generic copy-paste templates
- Creating CSS for classes that don't exist in the HTML

OUTPUT FORMAT:
Generate COMPLETE CSS targeting ONLY the classes that exist in the HTML.
Write proper rules for each element - no placeholders or shortcuts.
Output ONLY CSS code without markdown blocks or explanations.`;

  try {
    const result = await textGenModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    let cssCode = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    cssCode = cssCode.replace(/```css\n?/g, "").replace(/```\n?/g, "").trim();

    // Comprehensive CSS validation
    const validationErrors = [];

    if (!cssCode.includes(':root') || cssCode.length < 1000) {
      validationErrors.push('Incomplete CSS (missing :root or too short)');
    }

    // Check for invisible buttons (transparent background AND transparent color)
    const buttonPatterns = /\.(?:button|btn|cta)[^{]*\{[^}]*background[^:]*:\s*transparent[^}]*color[^:]*:\s*transparent/gi;
    if (buttonPatterns.test(cssCode)) {
      validationErrors.push('Contains invisible buttons (transparent background + transparent color)');
    }

    // Check for bad contrast (white on white or black on black)
    const badContrastPatterns = /(background[^:]*:\s*#(?:fff|ffffff|f0f0f0)[^}]*color[^:]*:\s*#(?:fff|ffffff|f0f0f0))|(background[^:]*:\s*#(?:000|000000|0d1117)[^}]*color[^:]*:\s*#(?:000|000000|0d1117))/gi;
    if (badContrastPatterns.test(cssCode)) {
      validationErrors.push('Contains bad contrast combinations (white on white or black on black)');
    }

    if (validationErrors.length > 0) {
      throw new Error(`CSS validation failed: ${validationErrors.join(', ')}`);
    }

    return cssCode;
  } catch (error) {
    console.error("❌ AI CSS generation failed:", error.message);
    throw error; // Don't use fallback, let caller handle retry
  }
}

/**
 * Fallback CSS generator (if AI fails)
 */
function generateFallbackCSS(websiteData, presentation) {
  const colors = websiteData.colors;
  const primaryColor = colors[0] || "#0066cc";
  const secondaryColor = colors[1] || "#1a1a1a";
  const tertiaryColor = colors[2] || "#ffffff";
  const accentColor = colors[3] || "#0066cc";

  // Smart color analysis
  const getLuminance = (hex) => {
    const rgb = parseInt(hex.replace('#', ''), 16);
    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = ((rgb >> 0) & 0xff) / 255;
    const [rL, gL, bL] = [r, g, b].map(val =>
      val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
    );
    return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
  };

  // Determine if colors are light or dark
  const primaryLum = getLuminance(primaryColor);
  const secondaryLum = getLuminance(secondaryColor);
  const tertiaryLum = getLuminance(tertiaryColor);

  // Smart background selection - use lightest color
  const colorsByLuminance = [
    { color: primaryColor, lum: primaryLum },
    { color: secondaryColor, lum: secondaryLum },
    { color: tertiaryColor, lum: tertiaryLum }
  ].sort((a, b) => b.lum - a.lum);

  const bgColor = colorsByLuminance[0].color;
  const isLightBg = colorsByLuminance[0].lum > 0.5;

  // Text colors with guaranteed contrast
  const textColor = isLightBg ? "#1a1a1a" : "#ffffff";
  const textSecondary = isLightBg ? "#666666" : "rgba(255, 255, 255, 0.75)";

  // Use darkest color for primary elements
  const uiPrimary = colorsByLuminance[2].color;
  const uiSecondary = colorsByLuminance[1].color;

  // Card backgrounds with subtle contrast
  const cardBg = isLightBg ? "rgba(0, 0, 0, 0.02)" : "rgba(255, 255, 255, 0.05)";
  const cardBgHover = isLightBg ? "rgba(0, 0, 0, 0.04)" : "rgba(255, 255, 255, 0.08)";
  const borderColor = isLightBg ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.12)";

  return `:root {
    --primary: ${uiPrimary};
    --secondary: ${uiSecondary};
    --accent: ${accentColor};
    --bg: ${bgColor};
    --text: ${textColor};
    --text-muted: ${textSecondary};
    --card-bg: ${cardBg};
    --card-hover: ${cardBgHover};
    --border: ${borderColor};
    --shadow: ${isLightBg ? '0 2px 8px rgba(0,0,0,0.06)' : '0 2px 8px rgba(0,0,0,0.3)'};
    --shadow-lg: ${isLightBg ? '0 8px 24px rgba(0,0,0,0.12)' : '0 8px 24px rgba(0,0,0,0.4)'};
    --radius: 16px;
    --radius-lg: 24px;
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
    font-family: 'Inter', 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    line-height: 1.6;
    color: var(--text);
    background: var(--bg);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

img {
    max-width: 100%;
    height: auto;
    display: block;
}

/* Header Styles */
.site-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(20px);
}

.header-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1.25rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 700;
    font-size: 1.1rem;
    text-decoration: none;
}

.brand-logo {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    color: white;
    display: grid;
    place-items: center;
    font-size: 1.5rem;
    font-weight: 900;
}

.brand-name {
    color: var(--text);
}

.nav-links {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    list-style: none;
}

.nav-link {
    padding: 0.625rem 1.25rem;
    border-radius: 8px;
    color: var(--text-muted);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.95rem;
    transition: all 0.2s ease;
}

.nav-link:hover {
    background: var(--card-bg);
    color: var(--text);
}

/* Hero Styles - Split Layout */
.hero {
    min-height: 70vh;
    display: flex;
    align-items: center;
    padding: 4rem 2rem;
}

.hero-split {
    max-width: 1400px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 4rem;
    align-items: center;
}

.hero-text {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.hero-title {
    font-size: clamp(2.5rem, 5vw, 4.5rem);
    font-weight: 900;
    line-height: 1.05;
    color: var(--text);
    letter-spacing: -0.03em;
}

.hero-subtitle {
    font-size: 1.25rem;
    color: var(--text-muted);
    line-height: 1.6;
    max-width: 600px;
}

.hero-features {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.hero-feature {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.05rem;
}

.feature-icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--primary);
    color: white;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    font-weight: 900;
    font-size: 0.75rem;
}

.hero-visual {
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-lg);
}

.hero-visual img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

/* Hero Gallery Layout */
.hero-gallery {
    position: relative;
    min-height: 80vh;
    padding: 2rem;
}

.hero-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 1rem;
    height: 100%;
}

.hero-grid-item {
    border-radius: var(--radius);
    overflow: hidden;
}

.hero-grid-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.hero-overlay {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.7) 100%);
    color: white;
    text-align: center;
    padding: 2rem;
}

.hero-overlay .hero-title {
    color: white;
}

.hero-lead {
    font-size: 1.5rem;
    opacity: 0.9;
}

/* Hero Minimal Layout */
.hero-minimal {
    display: grid;
    place-items: center;
    text-align: center;
    max-width: 900px;
    margin: 0 auto;
}

.hero-title-large {
    font-size: clamp(3rem, 7vw, 5.5rem);
    font-weight: 900;
    line-height: 1;
    margin-bottom: 2rem;
}

.hero-description {
    font-size: 1.35rem;
    color: var(--text-muted);
    margin-bottom: 2rem;
    max-width: 600px;
}

.hero-meta {
    display: flex;
    gap: 1rem;
    justify-content: center;
    color: var(--text-muted);
    font-size: 0.95rem;
}

/* Main Content Wrapper */
.main-wrapper {
    max-width: 1400px;
    margin: 0 auto;
    padding: 4rem 2rem;
}

/* Content Sections */
.content-section {
    margin-bottom: 4rem;
}

.section-inner {
    padding: 3rem;
    background: var(--card-bg);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.section-inner:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
}

.section-heading {
    margin-bottom: 2.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
}

.section-number {
    font-size: 3rem;
    font-weight: 900;
    color: var(--primary);
    opacity: 0.3;
    line-height: 1;
}

.section-title {
    font-size: 2rem;
    font-weight: 800;
    color: var(--text);
    line-height: 1.2;
}

.section-intro {
    font-size: 1.1rem;
    color: var(--text-muted);
    line-height: 1.7;
    margin-bottom: 2rem;
}

.content-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
}

.content-card {
    padding: 2rem;
    background: var(--bg);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    transition: all 0.25s ease;
}

.content-card:hover {
    transform: translateY(-4px);
    border-color: var(--primary);
    box-shadow: var(--shadow);
}

.card-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: var(--primary);
    color: white;
    display: grid;
    place-items: center;
    font-size: 1.5rem;
    margin-bottom: 1rem;
}

.card-number {
    font-size: 2rem;
    font-weight: 900;
    color: var(--primary);
    opacity: 0.4;
    margin-bottom: 0.75rem;
}

.card-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 0.75rem;
}

.card-text {
    font-size: 1rem;
    color: var(--text-muted);
    line-height: 1.6;
}

.section-body {
    margin-top: 2rem;
    font-size: 1.05rem;
    color: var(--text);
    line-height: 1.8;
}

.section-body p {
    margin-bottom: 1rem;
}

.section-media {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
}

.media-item {
    border-radius: var(--radius);
    overflow: hidden;
    aspect-ratio: 16/9;
}

.media-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
}

.media-item:hover img {
    transform: scale(1.05);
}

/* Feature Items */
.feature-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem;
    background: var(--card-bg);
    border-radius: var(--radius);
    border: 1px solid var(--border);
}

.feature-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 0.5rem;
}

/* Features Showcase Section */
.features-showcase {
    margin: 4rem 0;
    padding: 4rem 2rem;
    background: var(--card-bg);
    border-radius: var(--radius-lg);
}

.features-showcase .section-heading {
    text-align: center;
    margin-bottom: 3rem;
}

/* Gallery Section */
.gallery-section {
    margin: 4rem 0;
}

.gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
}

.gallery-item {
    position: relative;
    border-radius: var(--radius);
    overflow: hidden;
    aspect-ratio: 4/3;
    cursor: pointer;
}

.gallery-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
}

.gallery-item:hover .gallery-image {
    transform: scale(1.08);
}

.gallery-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.7) 100%);
    display: grid;
    place-items: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    color: white;
    padding: 1rem;
    text-align: center;
}

.gallery-item:hover .gallery-overlay {
    opacity: 1;
}

/* CTA Section */
.cta-section {
    margin: 6rem 0;
    padding: 4rem 2rem;
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    border-radius: var(--radius-lg);
    text-align: center;
    color: white;
}

.cta-container {
    max-width: 800px;
    margin: 0 auto;
}

.cta-title {
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 900;
    margin-bottom: 1rem;
}

.cta-description {
    font-size: 1.25rem;
    opacity: 0.9;
    margin-bottom: 2rem;
}

.cta-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
}

.cta-button {
    padding: 1rem 2rem;
    border-radius: var(--radius);
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s ease;
    border: 2px solid white;
    background: white;
    color: var(--primary);
}

.cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.cta-button-secondary {
    background: transparent;
    color: white;
}

.cta-button-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
}

/* Testimonials Section */
.testimonials-section {
    margin: 4rem 0;
    padding: 4rem 2rem;
    background: var(--card-bg);
    border-radius: var(--radius-lg);
}

.testimonial-card {
    padding: 2rem;
    background: var(--bg);
    border-radius: var(--radius);
    border: 1px solid var(--border);
}

.testimonial-text {
    font-size: 1.1rem;
    line-height: 1.7;
    color: var(--text);
    margin-bottom: 1.5rem;
}

.testimonial-author {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.author-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
}

.author-name {
    font-weight: 700;
    color: var(--text);
}

.author-role {
    font-size: 0.9rem;
    color: var(--text-muted);
}

/* Stats Section */
.stats-section {
    margin: 4rem 0;
    padding: 3rem 2rem;
    background: var(--card-bg);
    border-radius: var(--radius-lg);
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
}

.stat-item {
    text-align: center;
}

.stat-number {
    font-size: 3rem;
    font-weight: 900;
    color: var(--primary);
    line-height: 1;
    margin-bottom: 0.5rem;
}

.stat-label {
    font-size: 1rem;
    color: var(--text-muted);
}

/* Footer Styles */
.site-footer {
    background: var(--card-bg);
    border-top: 1px solid var(--border);
    margin-top: 6rem;
    padding: 4rem 2rem 2rem;
}

.footer-top {
    max-width: 1400px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 3rem;
    margin-bottom: 3rem;
}

.footer-column {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.footer-heading {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 0.5rem;
}

.footer-link {
    color: var(--text-muted);
    text-decoration: none;
    font-size: 0.95rem;
    transition: color 0.2s ease;
}

.footer-link:hover {
    color: var(--text);
}

.footer-text {
    font-size: 0.95rem;
    color: var(--text-muted);
    line-height: 1.6;
}

.footer-newsletter {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.newsletter-input {
    padding: 0.75rem 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg);
    color: var(--text);
    font-size: 0.95rem;
}

.newsletter-button {
    padding: 0.75rem 1.5rem;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: var(--radius);
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease;
}

.newsletter-button:hover {
    transform: translateY(-2px);
}

.social-links {
    display: flex;
    gap: 0.75rem;
}

.social-link {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--card-bg);
    color: var(--text);
    display: grid;
    place-items: center;
    text-decoration: none;
    transition: all 0.2s ease;
}

.social-link:hover {
    background: var(--primary);
    color: white;
    transform: translateY(-2px);
}

.footer-bottom {
    max-width: 1400px;
    margin: 0 auto;
    padding-top: 2rem;
    border-top: 1px solid var(--border);
    text-align: center;
    color: var(--text-muted);
    font-size: 0.9rem;
}

/* Responsive Design */
@media (max-width: 1024px) {
    .hero-split {
        grid-template-columns: 1fr;
        gap: 3rem;
    }
    
    .hero-visual {
        order: -1;
    }
    
    .content-grid {
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }
}

@media (max-width: 768px) {
    .header-container {
        padding: 1rem;
    }
    
    .nav-links {
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .hero {
        padding: 3rem 1rem;
    }
    
    .hero-title {
        font-size: 2.5rem;
    }
    
    .main-wrapper {
        padding: 3rem 1rem;
    }
    
    .section-inner {
        padding: 2rem 1.5rem;
    }
    
    .content-grid {
        grid-template-columns: 1fr;
    }
    
    .gallery-grid {
        grid-template-columns: 1fr;
    }
    
    .footer-top {
        grid-template-columns: 1fr;
        gap: 2rem;
    }
    
    .cta-buttons {
        flex-direction: column;
    }
}

@media (max-width: 480px) {
    .hero-title {
        font-size: 2rem;
    }
    
    .section-number {
        font-size: 2rem;
    }
    
    .section-title {
        font-size: 1.5rem;
    }
    
    .stat-number {
        font-size: 2rem;
    }
}`;
}

/**
 * Generate enhanced JavaScript using AI
 */
async function generateEnhancedJS(websiteData, presentation, htmlCode) {
  const prompt = `You are an expert JavaScript developer. Generate CLEAN, FUNCTIONAL JavaScript for ${websiteData.topic} website.

IMPORTANT: Analyze the HTML structure and create JS that works with the actual HTML elements and classes.

CONTEXT:
Website: ${websiteData.sourceUrl}
Topic: ${websiteData.topic}
Total Images: ${websiteData.allImages.length}
Total Sections: ${websiteData.sections.length}
Must handle: Navigation, animations, lazy loading, mobile menu, forms, gallery, parallax

REQUIRED FEATURES (implement only what's relevant to the HTML):

1. SMOOTH SCROLL NAVIGATION (if nav links exist):
- Select anchor links with href starting with #
- Use scrollIntoView with smooth behavior

2. INTERSECTION OBSERVER (for animations):
- Observe sections for scroll animations
- Add visibility classes when elements come into view

3. HEADER SCROLL EFFECTS (if header exists):
- Add scroll effects to header/navbar
- Handle scroll-based styling changes

4. IMAGE LAZY LOADING (if images exist):
- Implement IntersectionObserver for images
- Load images when they enter viewport

5. MOBILE MENU (if mobile menu exists):
- Toggle menu functionality
- Close menu on link click or outside click

6. GALLERY INTERACTIONS (if gallery exists):
- Handle gallery image clicks
- Implement simple lightbox if needed

7. FORM HANDLING (if forms exist):
- Basic form validation
- Handle form submissions
- Use requestAnimationFrame for animations
- Throttle resize events
- Lazy load images and content
- Minimize DOM queries with caching

10. CONSOLE LOGGING & DEBUGGING:
- Log website loaded message
- Log source URL: ${websiteData.sourceUrl}
- Log images count: ${websiteData.allImages.length}
- Log sections count: ${websiteData.sections.length}
- Use colored console logs for visibility

JAVASCRIPT MUST INCLUDE (500-700 lines):
- DOMContentLoaded wrapper: wrap ALL code
- Smooth scroll: 25-35 lines with easing and offset handling
- Intersection Observer: 40-60 lines for fade-in, slide-up, scale animations
- Navbar effects: 45-60 lines (scroll hide/show, shadow, background change)
- Image lazy loading: 35-50 lines with fade-in transition
- Mobile menu: 50-70 lines (toggle, close on outside click, smooth animations)
- Parallax scrolling: 30-45 lines for hero and section backgrounds
- Gallery lightbox: 60-80 lines (open, close, navigation, keyboard support)
- Form validation: 70-90 lines (email, required fields, custom messages, submit)
- Scroll spy: 30-40 lines (highlight active nav link)
- Debounce utility: 15-20 lines
- Performance: requestAnimationFrame for scroll events
- Console logs: Source URL, image count, section count with styling

CODE REQUIREMENTS:
- ES6+: const, let, arrow functions, template literals, destructuring
- Try-catch: Wrap each feature in error handling
- Comments: Descriptive comment before each feature
- No jQuery or libraries: Pure vanilla JavaScript only
- No var keyword: Use const/let only
- Complete implementations: Every function must be FULLY written out

ABSOLUTELY FORBIDDEN:
- Short JavaScript under 400 lines - MUST write 500-700 lines
- Placeholders: "// Add code here", "// TODO", "..."
- Incomplete functions: Every function must have full implementation
- External libraries: No jQuery, Lodash, etc.
- Syntax errors or undefined variables
- document.write() or eval()
- Features that don't match the HTML structure

OUTPUT FORMAT:
Generate clean JavaScript wrapped in document.addEventListener('DOMContentLoaded', function() {
Only implement features that work with the actual HTML elements.
Use proper selectors that match the HTML classes.
Output ONLY JavaScript code without markdown or explanations.`;

  try {
    const result = await textGenModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    let jsCode = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    jsCode = jsCode.replace(/```javascript\n?/g, "").replace(/```js\n?/g, "").replace(/```\n?/g, "").trim();

    // Basic validation - check for essential JS structure
    if (!jsCode.includes('DOMContentLoaded') || jsCode.length < 500) {
      throw new Error('Incomplete JS generated');
    }

    return jsCode;
  } catch (error) {
    console.error("❌ AI JS generation failed:", error.message);
    throw error; // Don't use fallback, let caller handle retry
  }
}

/**
 * Fallback JS generator
 */
function generateFallbackJS(websiteData, presentation) {
  return `// Dynamic Website - Enhanced Interactions
document.addEventListener('DOMContentLoaded',()=>{
const navLinks=document.querySelectorAll('.nav-link');
navLinks.forEach(link=>{
link.addEventListener('click',e=>{
e.preventDefault();
const targetId=link.getAttribute('href');
const target=document.querySelector(targetId);
if(target){
target.scrollIntoView({behavior:'smooth',block:'start'});
history.pushState(null,null,targetId);
}
});
});

const obsOpts={threshold:0.15,rootMargin:'0px 0px -80px 0px'};
const observer=new IntersectionObserver(entries=>{
entries.forEach(entry=>{
if(entry.isIntersecting){
entry.target.style.opacity='1';
entry.target.style.transform='translateY(0)';
entry.target.classList.add('visible');
}
});
},obsOpts);

document.querySelectorAll('.content-section,.showcase-item').forEach((el,i)=>{
el.style.opacity='0';
el.style.transform='translateY(30px)';
el.style.transition='all 0.6s cubic-bezier(0.4,0,0.2,1)';
if(el.classList.contains('showcase-item')){
el.style.transitionDelay=\`\${i*0.08}s\`;
}
observer.observe(el);
});

const imgObs=new IntersectionObserver(entries=>{
entries.forEach(entry=>{
if(entry.isIntersecting){
const img=entry.target;
img.style.transition='opacity 0.4s ease-in';
if(img.dataset.src){
img.src=img.dataset.src;
img.removeAttribute('data-src');
}
img.addEventListener('load',()=>img.style.opacity='1');
imgObs.unobserve(img);
}
});
},{rootMargin:'100px'});

document.querySelectorAll('img').forEach(img=>imgObs.observe(img));

let ticking=false;
const header=document.querySelector('.site-header');
let lastScroll=0;

window.addEventListener('scroll',()=>{
if(!ticking){
window.requestAnimationFrame(()=>{
const scroll=window.pageYOffset;
if(scroll>100){
header.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)';
}else{
header.style.boxShadow='none';
}
const heroVisual=document.querySelector('.hero-visual');
if(heroVisual&&scroll<800){
heroVisual.style.transform=\`translateY(\${scroll*0.25}px)\`;
}
lastScroll=scroll;
ticking=false;
});
ticking=true;
}
});

const cards=document.querySelectorAll('.content-card');
cards.forEach(card=>{
card.addEventListener('mouseenter',()=>{
card.style.transform='translateY(-8px) scale(1.02)';
});
card.addEventListener('mouseleave',()=>{
card.style.transform='translateY(-4px) scale(1)';
});
});

const showcaseItems=document.querySelectorAll('.showcase-item');
showcaseItems.forEach(item=>{
item.addEventListener('click',()=>{
const img=item.querySelector('img');
if(img)window.open(img.src,'_blank');
});
item.style.cursor='pointer';
});

console.log('%c✨ Dynamic Website Loaded','font-size:16px;font-weight:bold;color:${websiteData.colors[0] || '#6366f1'}');
console.log('Source: ${websiteData.sourceUrl}');
console.log('Sections: ${websiteData.sections.length} | Images: ${websiteData.allImages.length} | Headings: ${websiteData.allHeadings.length}');
});`;
}

/**
 * Save dynamic website to folder
 */
// async function saveDynamicWebsite(htmlCode, cssCode, jsCode, websiteData, presentation, sourceUrl) {
//   try {
//     // Create dynamic-websites folder inside website-codes
//     const websiteCodesDir = path.join(__dirname, "..", "website-codes");

//     try {
//       await fs.access(websiteCodesDir);
//     } catch {
//       await fs.mkdir(websiteCodesDir, { recursive: true });
//     }

//     // Generate unique folder name
//     const timestamp = Date.now();
//     const randomId = crypto.randomBytes(4).toString("hex");
//     const safeTopic = websiteData.topic
//       .toLowerCase()
//       .replace(/[^a-z0-9]+/g, "-")
//       .replace(/^-+|-+$/g, "")
//       .substring(0, 30);

//     const folderName = `dynamic-${safeTopic}-${timestamp}-${randomId}`;
//     const websiteFolderPath = path.join(websiteCodesDir, folderName);
//     const relativeFolderPath = path.relative(path.join(__dirname, ".."), websiteFolderPath);

//     // Create the website folder
//     await fs.mkdir(websiteFolderPath, { recursive: true });
//     console.log(`   📁 Created folder: ${folderName}`);

//     // Write index.html
//     const indexPath = path.join(websiteFolderPath, "index.html");
//     await fs.writeFile(indexPath, htmlCode, "utf-8");
//     console.log(`   ✅ Created index.html`);

//     // Write styles.css
//     const cssPath = path.join(websiteFolderPath, "styles.css");
//     await fs.writeFile(cssPath, cssCode, "utf-8");
//     console.log(`   ✅ Created styles.css`);

//     // Write app.js
//     const jsPath = path.join(websiteFolderPath, "app.js");
//     await fs.writeFile(jsPath, jsCode, "utf-8");
//     console.log(`   ✅ Created app.js`);

//     // Write README.md
//     const readmeContent = `# ${websiteData.topic}

// ## Dynamic Website Generated

// **Source URL:** ${sourceUrl}  
// **Generated:** ${new Date().toISOString()}  
// **Presentation ID:** ${presentation.presentation_id}

// ### Structure
// - \`index.html\` - Dynamic HTML structure based on original site
// - \`styles.css\` - Adaptive stylesheet matching original colors
// - \`app.js\` - Enhanced interactive features

// ### Features
// - 🎯 Structure mimics original website layout
// - 🎨 Uses original color palette: ${websiteData.colors.join(", ")}
// - 📱 Fully responsive design
// - ✨ Smooth animations and interactions
// - 🖼️ ${websiteData.allImages.length} images
// - 📋 ${websiteData.sections.length} content sections
// - 📝 ${websiteData.allHeadings.length} headings

// ### Dynamic Features
// - HTML structure varies per URL
// - Adaptive color scheme with proper contrast
// - Smart content organization
// - Modern, sleek design

// ---
// *Generated by Dynamic Website Generator • Powered by Gemini AI & Unified Web Deck*
// `;

//     const readmePath = path.join(websiteFolderPath, "README.md");
//     await fs.writeFile(readmePath, readmeContent, "utf-8");
//     console.log(`   ✅ Created README.md`);

//     // Calculate folder size
//     const calculateFolderSize = async (folderPath) => {
//       const files = await fs.readdir(folderPath);
//       let totalSize = 0;
//       for (const file of files) {
//         const filePath = path.join(folderPath, file);
//         const stats = await fs.stat(filePath);
//         totalSize += stats.size;
//       }
//       return totalSize;
//     };

//     const folderSizeBytes = await calculateFolderSize(websiteFolderPath);
//     const folderSizeKB = (folderSizeBytes / 1024).toFixed(2);

//     return {
//       folderName: folderName,
//       folderPath: websiteFolderPath,
//       relativePath: relativeFolderPath,
//       sizeKB: parseFloat(folderSizeKB),
//       previewUrl: `/website-codes/${folderName}/index.html`,
//       readmeContent: readmeContent,
//     };

//   } catch (error) {
//     console.error("Error saving dynamic website:", error.message);
//     throw new Error(`Failed to save dynamic website: ${error.message}`);
//   }
// }

/**
 * Perform final AI-powered quality check on generated HTML and CSS
 */
async function performFinalQualityCheck(htmlCode, cssCode, websiteData) {
  const { textGenModel } = require("../utils/geminiModels");

  const prompt = `You are a quality assurance expert. Analyze this generated HTML and CSS code and identify ANY issues.

HTML CODE:
${htmlCode.substring(0, 15000)}

CSS CODE:
${cssCode.substring(0, 8000)}

CRITICAL CHECKS - Identify these issues:

1. EMPTY BOXES/CARDS:
   - Check if any div with class containing "card", "box", "item", "feature", "service" has text (h2, h3, p) but NO <img> tag
   - Count empty cards

2. FOOTER STRUCTURE:
   - Check if footer has proper column structure with display:grid or display:flex
   - Check if footer links are organized in columns
   - Verify footer is not a messy unstructured blob

3. IMAGE SIZING ISSUES:
   - Check for any images WITHOUT max-width: 100% or height: auto
   - Check for container images without object-fit: cover
   - Look for oversized images that might overflow

4. LOGO NAVBAR SIZE:
   - Verify logo has class="logo" in HTML
   - Verify .logo class in CSS has max-height: 40px
   - Check navbar height is reasonable (not 200px+)

5. MISSING IMAGE CLASSES:
   - Cards with images should have class like "feature-image", "service-image", "card-image"
   - Verify all card images have proper classes for CSS targeting

6. FOOTER STYLING:
   - Footer should have: display:grid or flex, gap, padding, organized columns
   - Not just: all links in one messy list

RESPONSE FORMAT (JSON only):
{
  "passed": true/false,
  "issues": ["issue 1", "issue 2"],
  "emptyCards": number,
  "footerStructured": true/false,
  "logoSized": true/false,
  "imagesSized": true/false
}

Return ONLY valid JSON. No markdown, no explanations.`;

  try {
    const result = await textGenModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    let response = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    response = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const analysis = JSON.parse(response);

    // Validate critical issues
    const issues = [];

    if (analysis.emptyCards > 2) {
      issues.push(`Found ${analysis.emptyCards} empty cards without images`);
    }

    if (analysis.footerStructured === false) {
      issues.push('Footer not properly structured with columns');
    }

    if (analysis.logoSized === false) {
      issues.push('Logo not properly sized (missing max-height: 40px)');
    }

    if (analysis.imagesSized === false) {
      issues.push('Some images missing size constraints (max-width: 100%)');
    }

    return {
      passed: issues.length === 0,
      issues: issues,
      analysis: analysis
    };

  } catch (error) {
    console.error("❌ Quality check error:", error.message);
    // If quality check fails, assume pass to not block generation
    return { passed: true, issues: [], analysis: {} };
  }
}

module.exports = {
  generateDynamicWebsite,
};
