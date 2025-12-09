/**
 * =============================================================================
 * IMPROVED DYNAMIC WEBSITE GENERATOR SERVICE
 * =============================================================================
 * 
 * Purpose: Generate enhanced dynamic websites with superior structure and 
 *          full device responsiveness
 * 
 * Key Improvements:
 * - Better semantic HTML structure with proper ARIA labels
 * - Mobile-first responsive design approach
 * - Enhanced CSS Grid and Flexbox layouts
 * - Improved container queries and fluid typography
 * - Better image optimization and lazy loading
 * - Enhanced accessibility features
 * - Smoother animations and transitions
 * - Better component organization
 * 
 * Difference from standard dynamic generator:
 * - More robust responsive breakpoint system
 * - Better fluid spacing and typography scales
 * - Improved mobile navigation patterns
 * - Enhanced card layouts and grid systems
 * - Better image aspect ratio handling
 * - More semantic HTML5 elements
 * 
 * Created: 2025-12-09
 * =============================================================================
 */

const { generateUnifiedWebDeck } = require("./unifiedWebDeck");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const { textGenModel } = require("../utils/geminiModels");

/**
 * Main function: Generate improved dynamic website from URL
 * @param {string} websiteUrl - Target website URL
 * @returns {Object} Complete generation result with folder and file contents
 */
async function generateImprovedDynamicWebsite(websiteUrl) {
  try {
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║   🚀 IMPROVED DYNAMIC WEBSITE GENERATOR INITIATED         ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log(`📍 Source URL: ${websiteUrl}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}\n`);

    // Step 1: Generate unified presentation
    console.log("📊 Step 1/7: Generating unified presentation data...\n");
    const unifiedResult = await generateUnifiedWebDeck(websiteUrl);

    if (!unifiedResult || !unifiedResult.success || !unifiedResult.presentation) {
      throw new Error("Failed to generate unified presentation");
    }

    const presentation = unifiedResult.presentation;
    console.log(`   ✅ Generated ${presentation.slide_count} slides\n`);

    // Step 2: Analyze website structure
    console.log("📊 Step 2/7: Analyzing website structure...\n");
    const websiteData = await analyzeWebsiteStructure(presentation, websiteUrl);
    console.log(`   ✅ Analyzed ${websiteData.sections.length} sections\n`);

    // Step 3: Generate enhanced HTML with retry
    console.log("📊 Step 3/7: Generating improved HTML structure...\n");
    let htmlCode = null;
    let htmlAttempt = 0;
    const maxHtmlAttempts = 3;

    while (!htmlCode && htmlAttempt < maxHtmlAttempts) {
      htmlAttempt++;
      console.log(`   🔄 HTML Generation Attempt ${htmlAttempt}/${maxHtmlAttempts}`);
      
      try {
        htmlCode = await generateEnhancedHTML(websiteData, presentation);
        
        if (!htmlCode || htmlCode.length < 500) {
          throw new Error("Generated HTML is too short or empty");
        }
        
        console.log(`   ✅ HTML generated successfully (${htmlCode.length} characters)\n`);
      } catch (htmlError) {
        console.error(`   ❌ HTML attempt ${htmlAttempt} failed: ${htmlError.message}`);
        if (htmlAttempt >= maxHtmlAttempts) {
          throw new Error(`Failed to generate HTML after ${maxHtmlAttempts} attempts`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Step 4: Generate enhanced CSS with retry
    console.log("📊 Step 4/7: Generating improved responsive CSS...\n");
    let cssCode = null;
    let cssAttempt = 0;
    const maxCssAttempts = 3;

    while (!cssCode && cssAttempt < maxCssAttempts) {
      cssAttempt++;
      console.log(`   🔄 CSS Generation Attempt ${cssAttempt}/${maxCssAttempts}`);
      
      try {
        cssCode = await generateResponsiveCSS(htmlCode, websiteData, presentation);
        
        if (!cssCode || cssCode.length < 500) {
          throw new Error("Generated CSS is too short or empty");
        }
        
        console.log(`   ✅ CSS generated successfully (${cssCode.length} characters)\n`);
      } catch (cssError) {
        console.error(`   ❌ CSS attempt ${cssAttempt} failed: ${cssError.message}`);
        if (cssAttempt >= maxCssAttempts) {
          throw new Error(`Failed to generate CSS after ${maxCssAttempts} attempts`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Step 5: Generate enhanced JS with retry
    console.log("📊 Step 5/7: Generating improved interactive JavaScript...\n");
    let jsCode = null;
    let jsAttempt = 0;
    const maxJsAttempts = 3;

    while (!jsCode && jsAttempt < maxJsAttempts) {
      jsAttempt++;
      console.log(`   🔄 JS Generation Attempt ${jsAttempt}/${maxJsAttempts}`);
      
      try {
        jsCode = await generateEnhancedJS(htmlCode, websiteData);
        
        if (!jsCode || jsCode.length < 200) {
          throw new Error("Generated JS is too short or empty");
        }
        
        console.log(`   ✅ JS generated successfully (${jsCode.length} characters)\n`);
      } catch (jsError) {
        console.error(`   ❌ JS attempt ${jsAttempt} failed: ${jsError.message}`);
        if (jsAttempt >= maxJsAttempts) {
          throw new Error(`Failed to generate JS after ${maxJsAttempts} attempts`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Step 6: Perform final quality check
    console.log("📊 Step 6/7: Performing final quality inspection...\n");
    let qualityCheckPassed = false;
    let qualityAttempt = 0;
    const maxQualityAttempts = 2;

    while (!qualityCheckPassed && qualityAttempt < maxQualityAttempts) {
      qualityAttempt++;
      console.log(`   🔍 Quality Check Attempt ${qualityAttempt}/${maxQualityAttempts}`);
      
      const qualityResult = await performQualityCheck(htmlCode, cssCode, websiteData);
      
      if (qualityResult.passed) {
        qualityCheckPassed = true;
        console.log(`   ✅ Quality check passed!\n`);
      } else {
        console.log(`   ⚠️  Quality issues detected: ${qualityResult.issues.join(", ")}`);
        if (qualityAttempt < maxQualityAttempts) {
          console.log(`   🔄 Regenerating CSS to fix issues...\n`);
          cssCode = await generateResponsiveCSS(htmlCode, websiteData, presentation);
        }
      }
    }

    // Step 7: Save files
    console.log("📊 Step 7/7: Saving improved dynamic website files...\n");
    const savedResult = await saveImprovedDynamicWebsite(
      htmlCode,
      cssCode,
      jsCode,
      websiteData,
      presentation,
      websiteUrl
    );

    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║   ✅ IMPROVED DYNAMIC WEBSITE GENERATED SUCCESSFULLY      ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log(`📁 Folder: ${savedResult.folderName}`);
    console.log(`📄 Files: index.html, styles.css, app.js`);
    console.log(`⏰ Completed at: ${new Date().toISOString()}\n`);

    const responseData = {
      success: true,
      folderName: savedResult.folderName,
      folderPath: savedResult.relativePath,
      previewUrl: `/website-codes/${savedResult.folderName}/index.html`,
      files: {
        html: "index.html",
        css: "styles.css",
        js: "app.js",
      },
      metadata: {
        topic: presentation.topic,
        slide_count: presentation.slide_count,
        art_style: presentation.art_style,
        art_palette: presentation.art_palette,
        total_images: websiteData.allImages.length,
        total_headings: websiteData.allHeadings.length,
      },
      sourceUrl: websiteUrl,
      generatedAt: new Date().toISOString(),
      improved: true,
      qualityChecked: qualityCheckPassed,
    };

    return responseData;

  } catch (error) {
    console.error("\n╔════════════════════════════════════════════════════════════╗");
    console.error("║   ❌ IMPROVED DYNAMIC GENERATION FAILED                   ║");
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
    artStyle: presentation.art_style,
    artPalette: presentation.art_palette,
    sections: sections,
    allImages: allImages,
    allHeadings: allHeadings,
  };
}

/**
 * Generate enhanced HTML with improved semantic structure
 */
async function generateEnhancedHTML(websiteData, presentation) {
  const { topic, hostname, sections, allImages, allHeadings } = websiteData;
  const colors = presentation.art_palette || ["#0066cc", "#1a1a1a", "#ffffff"];
  
  const prompt = `You are an expert web developer specializing in semantic HTML5, accessibility, and modern web standards.

Generate a complete, production-ready HTML5 document for: "${topic}" (from ${hostname})

CRITICAL REQUIREMENTS:

1. SEMANTIC HTML STRUCTURE:
   - Use semantic HTML5 elements: <header>, <nav>, <main>, <article>, <section>, <aside>, <footer>
   - Proper heading hierarchy (h1 → h2 → h3, no skipping levels)
   - Use <figure> and <figcaption> for images with captions
   - Use <address> for contact information
   - Use proper list structures (<ul>, <ol>, <dl>)

2. ACCESSIBILITY:
   - Add ARIA labels where needed (aria-label, aria-labelledby, aria-describedby)
   - Include proper alt text for all images
   - Add skip-to-content link
   - Ensure keyboard navigation support with proper tab order
   - Add role attributes where appropriate

3. LAYOUT STRUCTURE:
   - Fixed header with logo and navigation (position: fixed)
   - Hero section with margin-top to clear fixed header
   - Multiple content sections with alternating layouts
   - Features/services grid section
   - Call-to-action section
   - Footer with multiple columns

4. RESPONSIVE DESIGN:
   - Use responsive image attributes (loading="lazy", srcset if beneficial)
   - Mobile-first approach with proper viewport meta tag
   - Use CSS classes that work with flexbox and grid
   - Container classes: .container, .section, .grid, .flex

5. IMAGE DISTRIBUTION:
   - Distribute images across ALL sections (hero, about, features, gallery, CTA)
   - Use images in: hero banner, feature cards, content sections, testimonials, footer
   - Ensure NO section clustering (spread images evenly)

6. METADATA:
   - Complete <head> with proper meta tags
   - Open Graph tags for social sharing
   - SEO-optimized title and description
   - Link to styles.css and app.js

7. CONTENT QUALITY:
   - Use actual content from sections provided
   - NO placeholder text like "Title 1", "Project 1", "Lorem Ipsum"
   - Real, meaningful descriptions
   - Professional, polished copy

8. NO AUTH ELEMENTS:
   - NO "Sign in", "Sign up", "Login" buttons in navigation
   - Use alternatives: "Get Started", "Contact Us", "Learn More"
   - Auth can only appear in header CTAs, not in main navigation

SECTIONS TO INCLUDE:
${sections.map((s, i) => `- ${i + 1}. ${s.title} (${s.descriptions.length} descriptions, ${s.bullets.length} bullets)`).join('\n')}

IMAGES AVAILABLE (${allImages.length} total):
${allImages.slice(0, 10).map((img, i) => `- ${i + 1}. ${img.src} (${img.alt})`).join('\n')}

COLOR PALETTE: ${colors.join(', ')}

Generate ONLY the complete HTML code. No explanations, no markdown formatting, just pure HTML.

Example structure (expand and customize):
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="...">
    <title>${topic} - Professional Digital Solutions</title>
    <link rel="stylesheet" href="styles.css">
    <script src="app.js" defer></script>
</head>
<body>
    <a href="#main-content" class="skip-link">Skip to main content</a>
    
    <header class="site-header" role="banner">
        <div class="container header-inner">
            <a href="/" class="logo-link" aria-label="${topic} Home">
                <img src="${allImages[0]?.src || ''}" alt="${topic} Logo" class="logo">
            </a>
            <nav class="main-nav" role="navigation" aria-label="Main navigation">
                <button class="mobile-menu-toggle" aria-label="Toggle menu" aria-expanded="false">
                    <span class="hamburger"></span>
                </button>
                <ul class="nav-list">
                    <li><a href="#about">About</a></li>
                    <li><a href="#features">Features</a></li>
                    <li><a href="#services">Services</a></li>
                    <li><a href="#contact">Contact</a></li>
                </ul>
            </nav>
            <div class="header-cta">
                <a href="#contact" class="btn btn-primary">Get Started</a>
            </div>
        </div>
    </header>

    <main id="main-content" role="main">
        <!-- Hero Section -->
        <section class="hero-section" role="banner">
            <div class="container hero-inner">
                <div class="hero-content">
                    <h1 class="hero-title">${sections[0]?.title || topic}</h1>
                    <p class="hero-subtitle">${sections[0]?.descriptions[0] || ''}</p>
                    <div class="hero-actions">
                        <a href="#features" class="btn btn-primary btn-lg">Explore Features</a>
                        <a href="#contact" class="btn btn-secondary btn-lg">Contact Us</a>
                    </div>
                </div>
                <div class="hero-image">
                    <img src="${allImages[0]?.src || ''}" alt="${allImages[0]?.alt || ''}" loading="eager">
                </div>
            </div>
        </section>

        <!-- Continue with more sections... -->
        
    </main>

    <footer class="site-footer" role="contentinfo">
        <!-- Footer content -->
    </footer>
</body>
</html>`;

  const result = await textGenModel.generateContent(prompt);
  const response = await result.response;
  let htmlCode = response.text();

  // Clean the response
  htmlCode = htmlCode.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

  return htmlCode;
}

/**
 * Generate enhanced responsive CSS with mobile-first approach
 */
async function generateResponsiveCSS(htmlCode, websiteData, presentation) {
  const { topic, hostname } = websiteData;
  const colors = presentation.art_palette || ["#0066cc", "#1a1a1a", "#ffffff"];
  
  // Extract classes from HTML
  const classMatches = htmlCode.match(/class="([^"]+)"/g) || [];
  const allClasses = new Set();
  classMatches.forEach(match => {
    const classes = match.match(/class="([^"]+)"/)[1].split(' ');
    classes.forEach(cls => allClasses.add(cls.trim()));
  });
  
  const classList = Array.from(allClasses).filter(cls => cls.length > 0);

  const prompt = `You are an expert CSS developer specializing in responsive design, mobile-first development, and modern CSS techniques.

Generate production-ready, mobile-first CSS for: "${topic}"

HTML CLASSES TO STYLE (${classList.length} classes):
${classList.join(', ')}

COLOR PALETTE: ${colors.join(', ')}

CRITICAL REQUIREMENTS:

1. MOBILE-FIRST APPROACH:
   - Start with mobile styles (320px+)
   - Use min-width media queries to enhance for larger screens
   - Progressive enhancement, not graceful degradation

2. CSS CUSTOM PROPERTIES (Variables):
   :root {
     /* Colors */
     --color-primary: ${colors[0] || '#0066cc'};
     --color-secondary: ${colors[1] || '#1a1a1a'};
     --color-accent: ${colors[2] || '#ffffff'};
     --color-text: #1a1a1a;
     --color-text-light: #666666;
     --color-bg: #ffffff;
     --color-bg-alt: #f8f9fa;
     
     /* Spacing (fluid scale) */
     --space-xs: clamp(0.5rem, 2vw, 0.75rem);
     --space-sm: clamp(0.75rem, 3vw, 1rem);
     --space-md: clamp(1rem, 4vw, 1.5rem);
     --space-lg: clamp(1.5rem, 5vw, 2.5rem);
     --space-xl: clamp(2rem, 6vw, 4rem);
     --space-2xl: clamp(3rem, 8vw, 6rem);
     
     /* Typography (fluid scale) */
     --font-size-xs: clamp(0.75rem, 2vw, 0.875rem);
     --font-size-sm: clamp(0.875rem, 2.5vw, 1rem);
     --font-size-base: clamp(1rem, 3vw, 1.125rem);
     --font-size-lg: clamp(1.125rem, 3.5vw, 1.375rem);
     --font-size-xl: clamp(1.25rem, 4vw, 1.75rem);
     --font-size-2xl: clamp(1.5rem, 5vw, 2.25rem);
     --font-size-3xl: clamp(2rem, 6vw, 3rem);
     --font-size-4xl: clamp(2.5rem, 8vw, 4rem);
     
     /* Layout */
     --container-width: 1200px;
     --container-padding: var(--space-md);
     --header-height: 70px;
     --border-radius: 8px;
     --border-radius-lg: 16px;
     
     /* Shadows */
     --shadow-sm: 0 1px 3px rgba(0,0,0,0.12);
     --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
     --shadow-lg: 0 10px 25px rgba(0,0,0,0.15);
     
     /* Transitions */
     --transition-fast: 150ms ease;
     --transition-base: 250ms ease;
     --transition-slow: 350ms ease;
   }

3. MODERN CSS RESET:
   *, *::before, *::after {
     box-sizing: border-box;
     margin: 0;
     padding: 0;
   }
   
   html { scroll-behavior: smooth; }
   
   body {
     font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
     line-height: 1.6;
     color: var(--color-text);
     background: var(--color-bg);
   }
   
   img, picture, video, canvas, svg {
     display: block;
     max-width: 100%;
     height: auto;
   }

4. RESPONSIVE BREAKPOINTS (mobile-first):
   /* Base: 320px - 768px (mobile) */
   /* Already styled above */
   
   @media (min-width: 768px) {
     /* Tablet: 768px+ */
     /* Enhance layouts, increase font sizes */
   }
   
   @media (min-width: 1024px) {
     /* Desktop: 1024px+ */
     /* Multi-column layouts, larger spacing */
   }
   
   @media (min-width: 1440px) {
     /* Large desktop: 1440px+ */
     /* Max widths, optimal reading length */
   }

5. HEADER & NAVIGATION:
   .site-header {
     position: fixed;
     top: 0;
     left: 0;
     right: 0;
     height: var(--header-height);
     background: var(--color-bg);
     box-shadow: var(--shadow-sm);
     z-index: 1000;
   }
   
   .main-nav ul {
     display: none; /* Hidden on mobile */
     list-style: none;
   }
   
   .mobile-menu-toggle {
     display: block; /* Visible on mobile */
   }
   
   @media (min-width: 768px) {
     .main-nav ul { display: flex; gap: var(--space-md); }
     .mobile-menu-toggle { display: none; }
   }

6. HERO SECTION:
   .hero-section {
     margin-top: var(--header-height); /* Clear fixed header */
     min-height: calc(100vh - var(--header-height));
     display: flex;
     align-items: center;
     padding: var(--space-xl) 0;
   }
   
   .hero-inner {
     display: flex;
     flex-direction: column; /* Stack on mobile */
     gap: var(--space-lg);
   }
   
   @media (min-width: 768px) {
     .hero-inner {
       flex-direction: row; /* Side-by-side on tablet+ */
       align-items: center;
     }
   }

7. GRID SYSTEMS:
   .grid {
     display: grid;
     gap: var(--space-md);
     grid-template-columns: 1fr; /* Single column mobile */
   }
   
   @media (min-width: 768px) {
     .grid-2 { grid-template-columns: repeat(2, 1fr); }
     .grid-3 { grid-template-columns: repeat(2, 1fr); }
     .grid-4 { grid-template-columns: repeat(2, 1fr); }
   }
   
   @media (min-width: 1024px) {
     .grid-3 { grid-template-columns: repeat(3, 1fr); }
     .grid-4 { grid-template-columns: repeat(4, 1fr); }
   }

8. IMAGE HANDLING:
   img {
     max-width: 100%;
     height: auto;
     display: block;
   }
   
   .logo {
     max-height: 40px;
     width: auto;
   }
   
   figure {
     margin: 0;
   }
   
   figcaption {
     font-size: var(--font-size-sm);
     color: var(--color-text-light);
     margin-top: var(--space-xs);
   }

9. BUTTONS:
   .btn {
     display: inline-flex;
     align-items: center;
     justify-content: center;
     padding: 0.75rem 1.5rem;
     border-radius: var(--border-radius);
     font-weight: 600;
     text-decoration: none;
     transition: all var(--transition-base);
     cursor: pointer;
     border: 2px solid transparent;
   }
   
   .btn-primary {
     background: var(--color-primary);
     color: white;
   }
   
   .btn-primary:hover {
     background: color-mix(in srgb, var(--color-primary) 85%, black);
     transform: translateY(-2px);
     box-shadow: var(--shadow-md);
   }

10. CONTAINER:
    .container {
      width: 100%;
      max-width: var(--container-width);
      margin: 0 auto;
      padding: 0 var(--container-padding);
    }

11. FOOTER:
    .site-footer {
      background: var(--color-secondary);
      color: var(--color-accent);
      padding: var(--space-2xl) 0 var(--space-lg);
    }
    
    .footer-inner {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-lg);
    }
    
    @media (min-width: 768px) {
      .footer-inner {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (min-width: 1024px) {
      .footer-inner {
        grid-template-columns: repeat(4, 1fr);
      }
    }

12. ACCESSIBILITY:
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: var(--color-primary);
      color: white;
      padding: 0.5rem 1rem;
      z-index: 100;
    }
    
    .skip-link:focus {
      top: 0;
    }
    
    :focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

Generate ONLY the complete CSS code. Style ALL classes found in the HTML. No explanations, no markdown, just pure CSS.`;

  const result = await textGenModel.generateContent(prompt);
  const response = await result.response;
  let cssCode = response.text();

  // Clean the response
  cssCode = cssCode.replace(/```css\n?/g, '').replace(/```\n?/g, '').trim();

  return cssCode;
}

/**
 * Generate enhanced JavaScript with improved interactions
 */
async function generateEnhancedJS(htmlCode, websiteData) {
  const { topic } = websiteData;
  
  const prompt = `You are an expert JavaScript developer specializing in vanilla JavaScript, performance optimization, and accessibility.

Generate production-ready JavaScript for: "${topic}"

REQUIREMENTS:

1. MOBILE MENU TOGGLE:
   - Toggle mobile menu on hamburger click
   - Close menu when clicking outside
   - Close menu when pressing Escape
   - Update aria-expanded attribute
   - Smooth animations

2. SMOOTH SCROLL:
   - Smooth scrolling for anchor links
   - Offset for fixed header
   - Update URL hash

3. SCROLL EFFECTS:
   - Show/hide header on scroll
   - Add shadow to header when scrolled
   - Animate elements on scroll (intersection observer)
   - Lazy load images

4. ACCESSIBILITY:
   - Keyboard navigation support
   - Focus management
   - ARIA attributes updates
   - Skip link functionality

5. PERFORMANCE:
   - Debounce scroll events
   - Use requestAnimationFrame
   - Passive event listeners
   - No jQuery or external dependencies

Example structure:
document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu toggle
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const nav = document.querySelector('.main-nav');
  
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', !isExpanded);
      nav.classList.toggle('is-open');
    });
  }
  
  // Smooth scroll with header offset
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        const headerHeight = document.querySelector('.site-header').offsetHeight;
        const targetPosition = target.offsetTop - headerHeight;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
    });
  });
  
  // Scroll header effects
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const header = document.querySelector('.site-header');
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  }, { passive: true });
  
  // Intersection observer for animations
  const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
});

Generate ONLY complete JavaScript code. No explanations, no markdown, just pure JS.`;

  const result = await textGenModel.generateContent(prompt);
  const response = await result.response;
  let jsCode = response.text();

  // Clean the response
  jsCode = jsCode.replace(/```javascript\n?/g, '').replace(/```js\n?/g, '').replace(/```\n?/g, '').trim();

  return jsCode;
}

/**
 * Perform quality check on generated code
 */
async function performQualityCheck(htmlCode, cssCode, websiteData) {
  const issues = [];
  
  // Check for responsive breakpoints
  const hasMediaQueries = cssCode.includes('@media');
  if (!hasMediaQueries) {
    issues.push("Missing media queries");
  }
  
  // Check for mobile-first approach
  const hasMinWidth = cssCode.includes('min-width');
  if (!hasMinWidth) {
    issues.push("Not using mobile-first approach");
  }
  
  // Check for CSS custom properties
  const hasCustomProps = cssCode.includes(':root') && cssCode.includes('--');
  if (!hasCustomProps) {
    issues.push("Missing CSS custom properties");
  }
  
  // Check for semantic HTML
  const hasSemanticTags = htmlCode.includes('<main') && htmlCode.includes('<nav') && htmlCode.includes('<header');
  if (!hasSemanticTags) {
    issues.push("Missing semantic HTML5 elements");
  }
  
  // Check for ARIA labels
  const hasAria = htmlCode.includes('aria-');
  if (!hasAria) {
    issues.push("Missing ARIA attributes");
  }
  
  return {
    passed: issues.length === 0,
    issues: issues,
  };
}

/**
 * Save improved dynamic website files
 */
async function saveImprovedDynamicWebsite(htmlCode, cssCode, jsCode, websiteData, presentation, sourceUrl) {
  try {
    // Create improved-dynamic-websites folder inside website-codes
    const websiteCodesDir = path.join(__dirname, "..", "website-codes");
    
    try {
      await fs.access(websiteCodesDir);
    } catch {
      await fs.mkdir(websiteCodesDir, { recursive: true });
    }

    // Generate unique folder name with "improved-dynamic" prefix
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(4).toString("hex");
    const safeTopic = websiteData.topic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 30);
    
    const folderName = `improved-dynamic-${safeTopic}-${timestamp}-${randomId}`;
    const websiteFolderPath = path.join(websiteCodesDir, folderName);
    const relativeFolderPath = path.relative(path.join(__dirname, ".."), websiteFolderPath);

    // Create the website folder
    await fs.mkdir(websiteFolderPath, { recursive: true });
    console.log(`   📁 Created folder: ${folderName}`);

    // Write index.html
    const indexPath = path.join(websiteFolderPath, "index.html");
    await fs.writeFile(indexPath, htmlCode, "utf-8");
    console.log(`   ✅ Created index.html`);

    // Write styles.css
    const cssPath = path.join(websiteFolderPath, "styles.css");
    await fs.writeFile(cssPath, cssCode, "utf-8");
    console.log(`   ✅ Created styles.css`);

    // Write app.js
    const jsPath = path.join(websiteFolderPath, "app.js");
    await fs.writeFile(jsPath, jsCode, "utf-8");
    console.log(`   ✅ Created app.js`);

    // Write README.md
    const readmeContent = `# ${websiteData.topic}

## Improved Dynamic Website Generated

**Source URL:** ${sourceUrl}  
**Generated:** ${new Date().toISOString()}  
**Presentation ID:** ${presentation.presentation_id}

### Improvements

This improved dynamic website features:
- ✅ Mobile-first responsive design
- ✅ Enhanced semantic HTML5 structure
- ✅ Improved accessibility (ARIA labels)
- ✅ Better CSS Grid and Flexbox layouts
- ✅ Fluid typography and spacing
- ✅ Modern CSS custom properties
- ✅ Smooth animations and transitions
- ✅ Better image optimization
- ✅ Enhanced mobile navigation
- ✅ Quality-checked code

### Structure
- \`index.html\` - Enhanced semantic HTML with accessibility
- \`styles.css\` - Mobile-first responsive stylesheet
- \`app.js\` - Enhanced interactive features

### Features
- Mobile-optimized navigation
- Smooth scrolling with header offset
- Scroll-based animations
- Intersection observer for lazy loading
- Responsive breakpoints (320px, 768px, 1024px, 1440px)
- Fluid typography scale
- Modern design system

### Design System
- Color palette from original site
- Consistent spacing scale
- Typography scale with fluid sizing
- Responsive grid system
- Modern button styles
- Professional footer layout

---
*Generated by Improved Dynamic Website Generator v2.0*
`;

    const readmePath = path.join(websiteFolderPath, "README.md");
    await fs.writeFile(readmePath, readmeContent, "utf-8");
    console.log(`   ✅ Created README.md`);

    return {
      folderName: folderName,
      relativePath: relativeFolderPath,
      absolutePath: websiteFolderPath,
    };

  } catch (error) {
    console.error(`Error saving improved dynamic website: ${error.message}`);
    throw error;
  }
}

module.exports = {
  generateImprovedDynamicWebsite,
};
