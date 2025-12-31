const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const cheerio = require('cheerio');
const { textGenModel } = require('../utils/geminiModels');
const { detectGenre } = require('./templates/templateManager');

const MAX_PAGES = 20; // Increased limit for comprehensive site cloning

const GENRE_FILES = {
    'saas': 'Saas.html',
    'medical': 'Medical.html',
    'corporate': 'corporate.html',
    'agency': 'corporate.html',
    'software_product': 'corporate.html'
};

async function generateClone(url) {
    console.log(`🏗️ Clone Architect for: ${url}`);

    const websiteId = crypto.randomUUID().substring(0, 8);
    const domain = new URL(url).hostname.replace('www.', '').replace(/\./g, '_');
    const folderName = `clone_${domain}_${websiteId}`;
    const outputDir = path.join(__dirname, '..', 'website-codes', folderName);
    await fs.mkdir(outputDir, { recursive: true });

    // Step 1: Fetch homepage
    console.log('📡 Fetching homepage...');
    const homepageHtml = await fetchPage(url);
    const $ = cheerio.load(homepageHtml);

    const mockData = {
        topic: $('title').text() || 'Website',
        description: $('meta[name="description"]').attr('content') || '',
        valueProposition: '',
        sections: []
    };
    const genre = detectGenre(mockData);
    const templateFile = GENRE_FILES[genre] || 'corporate.html';

    // Step 2: Load template for quality reference
    const templatePath = path.join(__dirname, '..', templateFile);
    const templateHtml = await fs.readFile(templatePath, 'utf-8');
    console.log(`✅ Genre: ${genre} | Template: ${templateFile}`);

    // Step 3: Analyze if site is single-page (SPA) vs hybrid
    const siteAnalysis = await analyzeSiteType(homepageHtml, url);
    console.log(`🗺️ Site Type: ${siteAnalysis.type} | ${siteAnalysis.separatePages.length} separate pages | ${siteAnalysis.spaSections.length} SPA sections`);

    // Step 4: Generate shared CSS from template
    console.log('🎨 Generating shared stylesheet...');
    const sharedCss = extractCssFromTemplate(templateHtml);
    await fs.writeFile(path.join(outputDir, 'style.css'), sharedCss);

    // Step 5: Generate pages based on site type
    if (siteAnalysis.type === 'single-page') {
        // Single-page: Generate ONE index.html with all sections
        console.log('🎨 Generating: Single-Page Website...');
        const html = await generateSinglePageWebsite({
            allSections: siteAnalysis.spaSections,
            templateHtml,
            siteTitle: mockData.topic,
            siteDescription: mockData.description,
            images: siteAnalysis.allImages
        });
        await fs.writeFile(path.join(outputDir, 'index.html'), html);

    } else {
        // Hybrid: Generate index.html + ONLY real separate pages
        const allPages = [
            { name: 'Home', isHomepage: true },
            ...siteAnalysis.separatePages
        ];

        // Generate homepage with SPA sections overview
        console.log('🎨 Generating: Home (with SPA sections)...');
        const homeHtml = await generateHomepage({
            spaSections: siteAnalysis.spaSections,
            separatePages: siteAnalysis.separatePages,
            templateHtml,
            siteTitle: mockData.topic,
            siteDescription: mockData.description,
            images: siteAnalysis.allImages
        });
        await fs.writeFile(path.join(outputDir, 'index.html'), homeHtml);

        // CRITICAL: Extract design choices from homepage to enforce consistency
        console.log('🔍 Extracting brand design from homepage...');
        const brandDesign = extractBrandDesign(homeHtml);
        console.log(`   📐 Fonts: ${brandDesign.fonts.join(', ')}`);
        console.log(`   🎨 Colors: Primary=${brandDesign.colors.primary}`);

        // Generate ONLY the real separate pages WITH ENFORCED BRAND CONSISTENCY
        // 🚀 PARALLELIZED: Generate all pages concurrently for massive speed improvement
        const pLimit = require('p-limit');
        const limit = pLimit(4); // Max 4 concurrent AI requests to avoid rate limits

        console.log(`🚀 Generating ${siteAnalysis.separatePages.length} pages in parallel (max 4 concurrent)...`);
        const startTime = Date.now();

        const pageGenerationPromises = siteAnalysis.separatePages.map(page =>
            limit(async () => {
                const pageStartTime = Date.now();
                console.log(`🎨 [START] Generating: ${page.name}...`);
                try {
                    const html = await generateFocusedPage({
                        pageData: page,
                        allPages,
                        templateHtml,
                        isHomepage: false,
                        siteTitle: mockData.topic,
                        siteDescription: mockData.description,
                        brandDesign // CRITICAL: Brand consistency enforced
                    });
                    const pageTime = ((Date.now() - pageStartTime) / 1000).toFixed(1);
                    console.log(`✅ [DONE] ${page.name} generated in ${pageTime}s`);
                    return { success: true, filename: page.filename, html, pageName: page.name };
                } catch (error) {
                    console.error(`❌ [FAILED] ${page.name}:`, error.message);
                    return { success: false, filename: page.filename, error, pageName: page.name };
                }
            })
        );

        // Wait for all pages to complete (or fail)
        const results = await Promise.allSettled(pageGenerationPromises);
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`⏱️  Total parallel generation time: ${totalTime}s`);

        // Write successful pages in parallel
        const successfulPages = results
            .filter(r => r.status === 'fulfilled' && r.value.success)
            .map(r => r.value);

        console.log(`💾 Writing ${successfulPages.length} pages to disk in parallel...`);
        await Promise.all(
            successfulPages.map(({ filename, html }) =>
                fs.writeFile(path.join(outputDir, filename), html)
            )
        );

        // Log any failures
        const failures = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));
        if (failures.length > 0) {
            console.warn(`⚠️  ${failures.length} page(s) failed to generate`);
            failures.forEach((f, i) => {
                const pageName = f.status === 'fulfilled' ? f.value.pageName : 'Unknown';
                const error = f.status === 'fulfilled' ? f.value.error : f.reason;
                console.warn(`   ${i + 1}. ${pageName}: ${error?.message || error}`);
            });
        } else {
            console.log(`✅ All ${successfulPages.length} pages generated successfully!`);
        }
    }

    // === SAVE TO MONGODB ===
    console.log('💾 Saving clone to MongoDB...');
    const GeneratedWebsite = require('../models/generateWebsite');

    // Read generated files to store in DB
    const filesForDb = [];
    const generatedFiles = await fs.readdir(outputDir);

    for (const file of generatedFiles) {
        if (['index.html', 'style.css', 'script.js'].includes(file.toLowerCase()) || file.endsWith('.html')) {
            const content = await fs.readFile(path.join(outputDir, file), 'utf-8');
            let type = 'html';
            if (file.endsWith('.css')) type = 'css';
            if (file.endsWith('.js')) type = 'js';

            filesForDb.push({
                type: type,
                content: content,
                name: file // CRITICAL: Preserve original filename
            });
        }
    }

    // Generate a presentation ID for this clone
    const presentationId = `clone_${websiteId}_${Date.now()}`;

    const savedWebsite = await GeneratedWebsite.create({
        presentationId: presentationId,
        topic: domain.replace(/_/g, '.'),
        sourceUrl: url,
        folderName: folderName,
        files: filesForDb,
        presentation: {
            slide_count: 0,
            art_style: 'clone',
            art_palette: 'original'
        },
        zipUrl: null, // ZIP can be created later if needed
        sizeKB: 0,
        generatedAt: new Date()
    });

    console.log(`✅ Saved to MongoDB with ID: ${savedWebsite._id}`);
    console.log(`🎉 Complete: ${outputDir}`);

    return {
        success: true,
        path: outputDir,
        _id: savedWebsite._id,
        id: savedWebsite._id.toString(),
        folderName: folderName,
        files: filesForDb
    };
}

/**
 * Extract brand design choices from homepage HTML
 * This ensures sub-pages use the SAME fonts and colors
 */
function extractBrandDesign(html) {
    // Extract Google Fonts
    const fontMatches = html.match(/fonts\.googleapis\.com\/css2\?family=([^"]+)/i);
    let fonts = ['Inter', 'Roboto']; // Default fallback

    if (fontMatches) {
        const fontQuery = fontMatches[1];
        // Parse fonts from query (e.g., "Inter:wght@300;400&family=Poppins:wght@600")
        fonts = fontQuery.split('&')
            .map(part => part.split(':')[0].replace('family=', ''))
            .filter(f => f.length > 0);
    }

    // Extract CSS color variables
    const cssVarMatch = html.match(/:root\s*{([^}]+)}/is);
    let colors = {
        primary: '#2563eb',  // Default blue
        background: '#1e293b',
        text: '#f1f5f9'
    };

    if (cssVarMatch) {
        const cssVars = cssVarMatch[1];
        // Try to find primary/brand color
        const primaryMatch = cssVars.match(/--(?:primary|brand)[^:]*:\s*([#\w]+)/i);
        const bgMatch = cssVars.match(/--(?:background|dark)[^:]*:\s*([#\w]+)/i);
        const textMatch = cssVars.match(/--text-light[^:]*:\s*([#\w]+)/i);

        if (primaryMatch) colors.primary = primaryMatch[1];
        if (bgMatch) colors.background = bgMatch[1];
        if (textMatch) colors.text = textMatch[1];
    }

    return { fonts, colors };
}

async function fetchPage(url) {
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: 15000,
            maxRedirects: 5
        });
        return data;
    } catch (e) {
        console.warn(`⚠️ Fetch failed: ${e.message}`);
        return '';
    }
}

/**
 * Analyze site to determine structure
 * Handles both single-page sites (SPA) AND sites with actual separate pages
 */
async function analyzeSiteType(homepageHtml, baseUrl) {
    const $ = cheerio.load(homepageHtml);
    const baseUrlObj = new URL(baseUrl);

    // Step 1: Find ALL links on the page (not just nav)
    const separatePages = [];
    const seenUrls = new Set([baseUrl, baseUrl + '/', baseUrl.replace(/\/$/, '')]);

    // Search ALL anchor tags
    $('a[href]').each((i, elem) => {
        const href = $(elem).attr('href');
        const text = $(elem).text().trim();

        if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        if (!text || text.length > 50 || text.length < 2) return;

        try {
            const absoluteUrl = new URL(href, baseUrl).href;
            const linkUrl = new URL(absoluteUrl);

            // Only same domain
            if (linkUrl.hostname !== baseUrlObj.hostname) return;

            // Normalize URL for comparison
            const normalizedUrl = absoluteUrl.replace(/\/$/, '');
            if (seenUrls.has(normalizedUrl)) return;
            if (normalizedUrl === baseUrl.replace(/\/$/, '')) return;

            // Skip common non-page links
            if (href.includes('/cdn-cgi/') || href.includes('/static/') || href.includes('/assets/')) return;

            seenUrls.add(normalizedUrl);
            separatePages.push({
                name: text,
                url: absoluteUrl,
                isSeparatePage: true
            });
        } catch (e) { }
    });

    console.log(`📄 Found ${separatePages.length} potential separate page links`);

    // Step 2: If no links found, use AI to detect pages
    if (separatePages.length === 0) {
        console.log(`🤖 Using AI to detect separate pages...`);
        const aiPages = await detectPagesWithAI(homepageHtml, baseUrl);
        separatePages.push(...aiPages);
        console.log(`📄 AI detected ${aiPages.length} pages`);
    }

    // Step 3: Extract SPA sections from homepage
    const spaSections = extractSPASections($, baseUrl);
    console.log(`📑 Found ${spaSections.length} SPA sections on homepage`);

    // Step 4: Fetch content from actual separate pages (find up to 5 real pages)
    const realSeparatePages = [];
    for (const page of separatePages) {
        if (realSeparatePages.length >= 5) break; // Stop once we have 5 real pages

        const pageHtml = await fetchPage(page.url);

        // Check if it's actually different from homepage (not a redirect)
        const isSameAsHomepage = pageHtml.length > 0 &&
            Math.abs(pageHtml.length - homepageHtml.length) < 500;

        if (!isSameAsHomepage && pageHtml.length > 500) {
            const $page = cheerio.load(pageHtml);
            const pageContent = extractPageContent($page, page.url);
            realSeparatePages.push({
                ...page,
                ...pageContent,
                filename: `${sanitize(page.name)}.html`
            });
            console.log(`  ✓ "${page.name}" is a real separate page (${realSeparatePages.length}/5)`);
        } else {
            console.log(`  ○ "${page.name}" redirects to homepage (SPA link)`);
        }
    }

    // Return structured data
    return {
        type: realSeparatePages.length > 0 ? 'hybrid' : 'single-page',
        separatePages: realSeparatePages,
        spaSections: spaSections,
        allImages: extractImages($, baseUrl)
    };
}

/**
 * Extract sections from a single-page site
 */
function extractSPASections($, baseUrl) {
    const sections = [];
    const seenNames = new Set();

    $('section, [id], .section, article').each((i, elem) => {
        const $el = $(elem);
        const id = $el.attr('id') || '';
        const className = $el.attr('class') || '';

        let name = '';
        const heading = $el.find('h1, h2, h3').first().text().trim();

        if (id && id.length > 2 && id.length < 30) {
            name = id.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        } else if (heading && heading.length < 50) {
            name = heading;
        } else if (className.includes('service')) {
            name = 'Services';
        } else if (className.includes('about')) {
            name = 'About';
        } else if (className.includes('contact')) {
            name = 'Contact';
        }

        if (!name || seenNames.has(name.toLowerCase())) return;

        const text = $el.text().trim();
        if (text.length < 100) return;

        const images = [];
        $el.find('img').slice(0, 5).each((i, img) => {
            const src = $(img).attr('src') || $(img).attr('data-src');
            if (src && !src.startsWith('data:')) {
                try {
                    images.push({
                        src: new URL(src, baseUrl).href,
                        alt: $(img).attr('alt') || 'Image'
                    });
                } catch (e) { }
            }
        });

        seenNames.add(name.toLowerCase());
        sections.push({
            name,
            heading: heading || name,
            content: text.substring(0, 1500),
            subheadings: $el.find('h3, h4').map((i, h) => $(h).text().trim()).get().slice(0, 8),
            images,
            isSPASection: true
        });
    });

    return sections;
}

/**
 * Use AI to detect separate pages when HTML parsing fails (JS-rendered sites)
 */
async function detectPagesWithAI(homepageHtml, baseUrl) {
    const prompt = `Analyze this website HTML and identify navigation links that point to SEPARATE PAGES (not anchor links on the same page).

HTML (truncated):
${homepageHtml.substring(0, 15000)}

Base URL: ${baseUrl}

Return ONLY a JSON array of pages with:
- name: Display name (e.g., "Design", "Projects", "About")
- url: Full URL (e.g., "${baseUrl}/design")

Example:
[
  {"name": "Design", "url": "${baseUrl}/design"},
  {"name": "Projects", "url": "${baseUrl}/projects"}
]

Rules:
- Only include pages that are likely DIFFERENT from the homepage
- Look for links like "/design", "/projects", "/about", etc.
- Ignore social media links, external links
- Maximum 10 pages
- Return ONLY valid JSON array`;

    try {
        const result = await textGenModel.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const pages = JSON.parse(text);

        return pages.map(p => ({
            ...p,
            isSeparatePage: true
        }));
    } catch (e) {
        console.warn('⚠️ AI page detection failed:', e.message);
        return [];
    }
}

/**
 * Extract content from a separate page
 */
function extractPageContent($, url) {
    return {
        heading: $('h1').first().text().trim() || $('title').text(),
        content: $('main, article, .content, section').first().text().substring(0, 2000),
        subheadings: $('h2, h3').slice(0, 10).map((i, h) => $(h).text().trim()).get(),
        images: extractImages($, url)
    };
}

/**
 * Extract images from page
 */
function extractImages($, baseUrl) {
    const images = [];
    $('img').slice(0, 10).each((i, elem) => {
        const src = $(elem).attr('src') || $(elem).attr('data-src');
        if (src && !src.startsWith('data:')) {
            try {
                images.push({
                    src: new URL(src, baseUrl).href,
                    alt: $(elem).attr('alt') || 'Image'
                });
            } catch (e) { }
        }
    });
    return images;
}

/**
 * AI fallback for complex sites
 */
async function analyzeWithAI(html, baseUrl) {
    const prompt = `Analyze this website HTML and extract the DISTINCT content sections.

HTML (truncated):
${html.substring(0, 20000)}

For each unique section, provide:
- name: Short page name (Services, About, Projects, etc.)
- heading: Main heading text for that section
- content: Key content/description (200 chars max)
- subheadings: List of sub-headings in this section

Return ONLY a JSON array:
[
  {"name": "Home", "heading": "Welcome to...", "content": "Main hero description...", "subheadings": []},
  {"name": "Services", "heading": "Our Services", "content": "We offer...", "subheadings": ["Web Dev", "Mobile"]},
  ...
]

Rules:
- Maximum 8 sections
- Each section should be DISTINCT (don't repeat content)
- Focus on main navigation items
- Return ONLY valid JSON`;

    try {
        const result = await textGenModel.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const pages = JSON.parse(text);

        pages.forEach((p, i) => {
            p.filename = i === 0 ? 'index.html' : `${sanitize(p.name)}.html`;
            p.images = [];
        });

        return { type: 'analyzed', pages };
    } catch (e) {
        console.warn('⚠️ AI analysis failed:', e.message);
        return {
            type: 'fallback',
            pages: [{
                name: 'Home',
                heading: 'Welcome',
                content: html.substring(0, 500),
                subheadings: [],
                images: [],
                filename: 'index.html'
            }]
        };
    }
}

function extractCssFromTemplate(templateHtml) {
    const styleMatches = templateHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    if (!styleMatches) return '/* No styles extracted */';

    return styleMatches.map(match => {
        return match.replace(/<\/?style[^>]*>/gi, '').trim();
    }).join('\n\n');
}

/**
 * Generate a FOCUSED page that only contains content for that specific section
 * NOW WITH ENFORCED BRAND CONSISTENCY
 */
async function generateFocusedPage({ pageData, allPages, templateHtml, isHomepage, siteTitle, siteDescription, brandDesign }) {
    const { name, heading, content, subheadings, images } = pageData;

    // Build navigation
    const navLinks = allPages.map(p => {
        return `<a href="${p.filename || 'index.html'}">${p.name}</a>`;
    }).join('\n                    ');

    // Prepare images
    const imagesList = (images || []).slice(0, 8).map((img, i) =>
        `${i + 1}. ${img.src} (alt: "${img.alt}")`
    ).join('\n');

    // Extract brand parameters (with fallback if not provided)
    const fonts = brandDesign?.fonts || ['Inter', 'Roboto'];
    const primaryColor = brandDesign?.colors?.primary || '#2563eb';
    const backgroundColor = brandDesign?.colors?.background || '#1e293b';
    const textColor = brandDesign?.colors?.text || '#f1f5f9';

    const prompt = `You are an AWARD-WINNING web designer creating a BRAND NEW, ORIGINAL page.

=== CRITICAL BRANDING CONSISTENCY (MANDATORY!) ===
**YOU MUST USE THESE EXACT BRAND PARAMETERS FROM THE HOMEPAGE:**

**FONTS (USE EXACTLY THESE):**
- Headings Font: ${fonts[0]}
- Body Font: ${fonts[1] || fonts[0]}
- Google Fonts Import: https://fonts.googleapis.com/css2?family=${fonts[0].replace(' ', '+')}:wght@300;400;600;700&family=${fonts[1]?.replace(' ', '+') || fonts[0].replace(' ', '+')}:wght@300;400;600;700&display=swap

**COLOR SCHEME (USE EXACTLY THESE):**
- Primary Color: ${primaryColor}
- Background Color: ${backgroundColor}
- Text Color: ${textColor}
- Define these in :root CSS variables and use them throughout

**HEADER/NAVIGATION (MUST BE IDENTICAL TO HOMEPAGE):**
- Use the EXACT same header structure
- Same logo, same nav styling, same colors
- This ensures seamless multi-page navigation

**CRITICAL**: DO NOT change fonts or colors! These are FIXED brand parameters.
Be creative with LAYOUTS, not with branding.

=== PAGE IDENTITY ===
Site Name: ${siteTitle}
Page Name: ${name}
Page Type: SUB-PAGE (focused on ${name} topic only)

=== CONTENT FOR THIS PAGE ===
Main Heading: ${heading}
Main Content: ${content}
Sub-topics: ${subheadings?.join(', ') || 'key aspects of ' + name}

=== IMAGES ===
${imagesList || 'Create beautiful CSS art/gradients as visual elements'}

=== NAVIGATION ===
${navLinks}

=== PAGE STRUCTURE ===
1. Page Header - Hero for "${name}" with the BRAND FONTS
2. Main Content - Detailed info with unique layout
3. Sub-sections for: ${subheadings?.slice(0, 6).join(', ') || name + ' details'}
4. Related Call to Action
5. Footer

=== DESIGN INNOVATION (within branding constraints) ===
Be creative with layouts and visual elements, but maintain brand consistency:
- Creative section layouts (cards, grids, timelines, etc.)
- Interesting visual accents (geometric shapes, gradients using BRAND COLORS)
- Micro-animations for engagement
- REMEMBER: Use the EXACT fonts and colors specified above!

=== QUALITY BENCHMARK (DON'T COPY!) ===
${templateHtml.substring(0, 2000)}
(This shows expected QUALITY only - use YOUR brand's fonts/colors)

=== TECHNICAL REQUIREMENTS ===
- **Fonts**: ${fonts[0]} (headings) + ${fonts[1] || fonts[0]} (body) - MANDATORY
- **Colors**: Primary ${primaryColor}, BG ${backgroundColor} - MANDATORY
- Icons: Font Awesome 6
- Responsive design with mobile-first approach
- Smooth animations and transitions
- CSS custom properties for color theming
- **Header must be identical to homepage** (same structure, colors, nav links)

=== OUTPUT ===
Return COMPLETE HTML with CONSISTENT branding:
1. <!DOCTYPE html>
2. <link rel="stylesheet" href="style.css">
3. Google Fonts (${fonts[0]}, ${fonts[1] || fonts[0]})
4. Font Awesome
5. <style> block with :root variables matching BRAND COLORS
6. Semantic HTML5
7. Working navigation

=== CRITICAL OUTPUT RULE ===
**RETURN ONLY PURE HTML CODE - NO EXPLANATIONS, NO THOUGHTS, NO COMMENTARY**
Do NOT include:
- Any text before <!DOCTYPE html>
- Any explanatory notes or comments
- Any思 思考过程 or reasoning
- Markdown code blocks

Start IMMEDIATELY with <!DOCTYPE html> and end with </html>

Generate HTML (ONLY code, absolutely nothing else):`;

    const result = await textGenModel.generateContent(prompt);
    let html = result.response.text()
        .replace(/```html\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

    // Aggressive cleanup: Remove any explanatory text before DOCTYPE
    const doctypeIndex = html.toLowerCase().indexOf('<!doctype');
    if (doctypeIndex > 0) {
        html = html.substring(doctypeIndex);
    }

    // Remove any text after closing </html> tag
    const htmlEndIndex = html.toLowerCase().lastIndexOf('</html>');
    if (htmlEndIndex > 0) {
        html = html.substring(0, htmlEndIndex + 7); // +7 for </html>
    }

    if (!html.toLowerCase().startsWith('<!doctype')) {
        html = '<!DOCTYPE html>\n' + html;
    }

    return html;
}

function sanitize(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 50) || 'page';
}

/**
 * Generate a complete single-page website with all sections on ONE page
 */
async function generateSinglePageWebsite({ allSections, templateHtml, siteTitle, siteDescription, images }) {
    const sectionsData = allSections.map(s => ({
        name: s.name,
        heading: s.heading,
        content: s.content?.substring(0, 500),
        subheadings: s.subheadings?.slice(0, 5)
    }));

    const imagesList = (images || []).slice(0, 15).map((img, i) =>
        `${i + 1}. ${img.src} (alt: "${img.alt}")`
    ).join('\n');

    const prompt = `You are an AWARD-WINNING web designer creating a BRAND NEW, ORIGINAL single-page website.

=== CRITICAL DESIGN MANDATE ===
DO NOT COPY the reference template's design, colors, or styling!
The template is ONLY shown to demonstrate the QUALITY LEVEL expected.
You must CREATE YOUR OWN:
- Unique color palette (be creative - neon accents, rich gradients, unexpected combinations)
- Original layout patterns (asymmetric grids, creative sections, unique card designs)
- Fresh visual effects (not just glassmorphism - try neumorphism, 3D effects, animated gradients)
- Innovative typography combinations

Your design should be BETTER and MORE MODERN than the template!

=== SITE INFO ===
Site Name: ${siteTitle}
Description: ${siteDescription}

=== ALL SECTIONS FOR THIS PAGE ===
${JSON.stringify(sectionsData, null, 2)}

=== IMAGES TO USE ===
${imagesList || 'USE THESE IMAGE URLS IN YOUR HTML: Use <img> tags with actual src attributes from the URLs provided above. Do NOT use placeholders or CSS art.'}

=== PAGE STRUCTURE ===
1. Navigation - Fixed header with anchor links (#services, #about, etc.)
2. Hero Section - Be creative! Animated backgrounds, 3D elements, bold typography
3. All content sections (each with UNIQUE design treatment)
4. Footer

=== NAVIGATION FORMAT ===
<nav>
${allSections.map(s => `    <a href="#${sanitize(s.name)}">${s.name}</a>`).join('\n')}
</nav>

=== TYPOGRAPHY & FONT MANDATE ===
**CRITICAL**: Use ONLY professional, readable fonts
- **Allowed Fonts**: Inter, Roboto, Open Sans, Lato, Poppins, Montserrat, Work Sans
- **FORBIDDEN**: Comic Sans, cursive, script, decorative, or funky fonts
- Pick ONE font for headings, ONE for body text
- Use font weights (300, 400, 600, 700) for hierarchy

=== COLOR SCHEME CREATION ===
**Create a UNIQUE, COHESIVE color palette inspired by the website's industry and content:**
- Analyze the website topic/description to determine appropriate mood
- Choose colors that reflect the brand's personality:
  - **Tech/SaaS**: Blues, purples, teals, or vibrant neons
  - **Corporate/Finance**: Navy, dark blue, charcoal with gold/orange accents
  - **Creative/Agency**: Bold, unexpected combinations
  - **Medical/Healthcare**: Calming blues, greens, or warm neutrals
  - **E-commerce**: Energetic reds, oranges, or sophisticated blacks
- Pick ONE primary color, ONE background color, and consistent text colors
- Define colors in CSS :root variables (--primary, --background, --text)
- **IMPORTANT**: Be creative and unique - avoid generic choices

=== DESIGN INNOVATION (within branding) ===
Be creative with layouts while maintaining consistency:
- Unique section arrangements (grids, bento, asymmetric)
- Subtle animations and micro-interactions
- Modern visual effects (gradients, shadows, glows)
- **REMEMBER**: Layouts can vary, but colors/fonts MUST be consistent

=== QUALITY BENCHMARK (DON'T COPY, JUST MATCH QUALITY) ===
${templateHtml.substring(0, 3000)}
(Use this only to understand the expected fidelity, NOT to copy design/colors)

=== TECHNICAL REQUIREMENTS ===
- **Fonts**: Use ONLY professional fonts (Inter, Roboto, Open Sans, Lato, Poppins, Montserrat, Work Sans)
  - NO funky, cursive, or decorative fonts allowed
  - Max 2 font families total
- Icons: Font Awesome 6
- Responsive: Mobile-first with breakpoints (@media queries)
- Animations: Subtle hover effects, smooth transitions
- CSS Variables: Define colors in :root for consistency
- **Color Consistency**: Use the SAME color palette throughout

=== OUTPUT FORMAT ===
Return COMPLETE HTML with inline <style> containing your ORIGINAL design:
1. <!DOCTYPE html>
2. <link rel="stylesheet" href="style.css">
3. Google Fonts + Font Awesome
4. YOUR OWN creative <style> block (don't copy template)
5. All sections with matching IDs
6. Anchor-based navigation

=== CRITICAL OUTPUT RULE ===
**RETURN ONLY PURE HTML CODE - NO EXPLANATIONS, NO THOUGHTS, NO COMMENTARY**
Do NOT include:
- Any text before <!DOCTYPE html>
- Any説明 explanatory notes or思考 reasoning
- Markdown blocks or formatting
- ANY text that is not HTML code

Your response must START with <!DOCTYPE html> and END with </html> - NOTHING ELSE.

Generate the HTML (ONLY code, absolutely nothing else):`;

    const result = await textGenModel.generateContent(prompt);
    let html = result.response.text()
        .replace(/```html\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

    // Aggressive cleanup: Remove any explanatory text before DOCTYPE
    const doctypeIndex = html.toLowerCase().indexOf('<!doctype');
    if (doctypeIndex > 0) {
        html = html.substring(doctypeIndex);
    }

    // Remove any text after closing </html> tag
    const htmlEndIndex = html.toLowerCase().lastIndexOf('</html>');
    if (htmlEndIndex > 0) {
        html = html.substring(0, htmlEndIndex + 7);
    }

    if (!html.toLowerCase().startsWith('<!doctype')) {
        html = '<!DOCTYPE html>\n' + html;
    }

    return html;
}

/**
 * Generate homepage for a hybrid site (has both SPA sections AND separate pages)
 */
async function generateHomepage({ spaSections, separatePages, templateHtml, siteTitle, siteDescription, images }) {
    // Build navigation with both anchor links (for SPA sections) and page links
    const navItems = [
        ...spaSections.map(s => ({ name: s.name, href: `#${sanitize(s.name)}`, isAnchor: true })),
        ...separatePages.map(p => ({ name: p.name, href: p.filename, isAnchor: false }))
    ];

    const navHtml = navItems.map(item =>
        `<a href="${item.href}">${item.name}</a>`
    ).join('\n                    ');

    const sectionsData = spaSections.map(s => ({
        name: s.name,
        heading: s.heading,
        content: s.content?.substring(0, 500),
        subheadings: s.subheadings?.slice(0, 5)
    }));

    const imagesList = (images || []).slice(0, 15).map((img, i) =>
        `${i + 1}. ${img.src} (alt: "${img.alt}")`
    ).join('\n');

    const prompt = `You are an AWARD-WINNING web designer creating a BRAND NEW, ORIGINAL homepage.

=== CRITICAL DESIGN MANDATE ===
DO NOT COPY the reference template's design, colors, or styling!
The template is ONLY shown to demonstrate the QUALITY LEVEL expected.
You must CREATE YOUR OWN:
- Unique color palette (be bold - pick unexpected, modern combinations)
- Original layout patterns (break the grid, use creative asymmetry)
- Fresh visual effects (animated gradients, morphing shapes, particle effects)
- Innovative section designs (each section should feel unique)

Your design should be BETTER and MORE CREATIVE than the template!

=== SITE INFO ===
Site Name: ${siteTitle}
Description: ${siteDescription}

=== SECTIONS ON THIS HOMEPAGE ===
${JSON.stringify(sectionsData, null, 2)}

=== SEPARATE PAGES (link to these) ===
${separatePages.map(p => `- ${p.name}: ${p.filename}`).join('\n')}

=== IMAGES ===
${imagesList || 'USE THESE IMAGE URLS: Insert actual <img> tags with src attributes from the image URLs listed above. Do NOT create CSS placeholders.'}

=== NAVIGATION ===
${navHtml}

=== PAGE STRUCTURE ===
1. Navigation - Both anchor links AND page links
2. Hero Section - Make it WOW! Bold typography, animated backgrounds
3. All homepage sections with unique design treatments
4. Preview/links to separate pages
5. Footer

=== TYPOGRAPHY & FONT MANDATE ===
**CRITICAL**: Use ONLY professional, readable fonts
- **Allowed**: Inter, Roboto, Open Sans, Lato, Poppins, Montserrat, Work Sans
- **FORBIDDEN**: Comic Sans, cursive, script, decorative fonts
- ONE font for headings, ONE for body

=== COLOR SCHEME (MUST BE CONSISTENT!) ===
**Create a UNIQUE color palette inspired by this website's content:**
- Analyze "${siteTitle}" and "${siteDescription}" to understand the brand
- Choose colors that reflect the site's industry and personality:
  - **Tech/Dev platforms**: Vibrant blues, purples, or teals (but be creative!)
  - **Corporate/Business**: Navy, charcoal, or sophisticated dark tones with accent colors
  - **Creative/Design**: Bold, unexpected combinations
  - **E-commerce/Retail**: Energetic colors or elegant neutrals
- Pick ONE primary color, complementary backgrounds, and consistent text colors
- Define in CSS :root (--primary, --background, --text-light, --text-muted)
- **This color scheme will be used on ALL pages - make it unique and memorable!**

=== BRANDING CONSISTENCY ===
**CRITICAL**: Ensure the header/navigation is IDENTICAL to other pages:
- Same logo, same nav structure, same colors
- This creates brand cohesion across the multi-page site

=== DESIGN INNOVATION (within brand guidelines) ===
Be creative with section layouts while maintaining color/font consistency:
- Unique arrangements (grids, asymmetric layouts)
- Modern visual effects (gradients, subtle shadows)
- Engaging micro-animations

=== QUALITY BENCHMARK (DON'T COPY DESIGN!) ===
${templateHtml.substring(0, 2500)}
(Study the quality/fidelity only - create your OWN design)

=== TECHNICAL REQUIREMENTS ===
- **Fonts**: Professional only (Inter, Roboto, Open Sans, Lato, Poppins, Montserrat, Work Sans)
  - NO decorative or funky fonts
- Icons: Font Awesome 6
- Responsive: Mobile-first + breakpoints
- Animations: Smooth, subtle transitions
- **CSS Variables**: Define color palette in :root
- **Header Consistency**: Same header on homepage and all sub-pages

=== OUTPUT FORMAT ===
Return COMPLETE HTML with YOUR ORIGINAL CREATIVE DESIGN:
1. <!DOCTYPE html>
2. <link rel="stylesheet" href="style.css">
3. Google Fonts + Font Awesome
4. YOUR OWN creative <style> block
5. Working navigation (anchors + page links)
6. All sections with IDs

=== CRITICAL OUTPUT RULE ===
**RETURN ONLY PURE HTML CODE - NO EXPLANATIONS, NO THOUGHTS, NO COMMENTARY**
Do NOT include:
- Any text before <!DOCTYPE html>
- Any explanatory notes or reasoning
- Markdown code blocks
- ANY non-HTML content

Your ENTIRE response must be valid HTML starting with <!DOCTYPE html>

Generate the HTML (ONLY code, absolutely nothing else):`;

    const result = await textGenModel.generateContent(prompt);
    let html = result.response.text()
        .replace(/```html\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

    // Aggressive cleanup: Remove any explanatory text before DOCTYPE
    const doctypeIndex = html.toLowerCase().indexOf('<!doctype');
    if (doctypeIndex > 0) {
        html = html.substring(doctypeIndex);
    }

    // Remove any text after closing </html> tag
    const htmlEndIndex = html.toLowerCase().lastIndexOf('</html>');
    if (htmlEndIndex > 0) {
        html = html.substring(0, htmlEndIndex + 7);
    }

    if (!html.toLowerCase().startsWith('<!doctype')) {
        html = '<!DOCTYPE html>\n' + html;
    }

    return html;
}

module.exports = { generateClone };
