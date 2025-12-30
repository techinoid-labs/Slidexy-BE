/**
 * Template Based Website Service
 * 
 * Orchestrates the generation of static websites using pre-defined templates.
 * 1. Fetches website content using fetchWebsiteTextNoCode
 * 2. structured content extraction
 * 3. Detects niche/genre
 * 4. Selects appropriate template
 * 5. Populates template
 */

const { fetchWebsiteText } = require("./fetchWebsiteTextNoCode");
const templateManager = require("./templates/templateManager");
const crypto = require("crypto");
const fs = require("fs").promises; // For async file operations

const path = require("path");
const { textGenModel } = require("../utils/geminiModels");



/**
 * Generate a website using a niche-specific template
 * @param {string} url - Source URL
 * @returns {Promise<Object>} Generated website details
 */
async function generateTemplateWebsite(url) {
    console.log(`\n🎨 Starting Template-Based Generation for: ${url}`);

    // 1. Fetch Content
    const websiteData = await fetchWebsiteText(url);

    // 2. Extract & Normalize Content
    const content = extractContent(websiteData, url);

    // 3. Detect Genre & Select Template
    const genre = templateManager.detectGenre(content);
    console.log(`   👉 Detected Genre: ${genre}`);

    const template = templateManager.getTemplate(genre);

    // 4. Generate Code
    const html = template.generateHTML(content);
    const css = template.generateCSS(content);
    const js = template.generateJS(content);

    // 5. Save Files
    // 5. Save Files
    console.log("🔮 Calling saveTemplateFiles with url:", url);
    const saved = await saveTemplateFiles(html, css, js, content.topic, url);
    console.log("🔮 saveTemplateFiles returned:", JSON.stringify(saved, null, 2));

    return {
        success: true,
        genre,
        ...saved,
        previewUrl: saved.previewUrl
    };
}

/**
 * Normalize extracted data for templates
 */
function extractContent(data, url) {
    // Handle both direct and nested structures (resiliency)
    const meta = data.metadata || data.raw?.metadata || {};
    const topic = data.topic || meta.title || new URL(url).hostname;
    const colors = data.aesthetics?.colors || [];
    const images = data.raw?.images || data.images || [];

    return {
        topic: topic,
        url: url,
        valueProposition: data.valueProposition || meta.description || "Building Digital Experiences",
        heroDescription: data.heroDescription || meta.description || "",
        cta: "Get Started",

        // Structured Sections
        sections: (data.raw?.paragraphs || []).slice(0, 6).map((p, i) => ({
            title: `Feature ${i + 1}`,
            description: p
        })),

        // Template Compatibility Fields
        validSections: (data.raw?.paragraphs || []).slice(0, 8).map((p, i) => ({
            title: `Feature ${i + 1}`,
            description: p
        })),
        navigation: [
            { label: "Home", link: "#" },
            { label: "Features", link: "#features" },
            { label: "Pricing", link: "#pricing" },
            { label: "Contact", link: "#contact" }
        ],
        primaryCTA: "Get Started",
        secondaryCTA: "Learn More",

        // Visuals
        colors: colors.length > 0 ? colors : ['#2563eb', '#1e40af'],
        allImages: images.map(img => ({
            src: img.src || img,
            alt: img.alt || topic
        })),

        // Contact info (placeholder extraction)
        email: "contact@" + new URL(url).hostname,
        socials: []
    };
}

/**
 * Save keys to disk
 */
async function saveTemplateFiles(html, css, js, topic, url) {
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(4).toString("hex");
    const safeTopic = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").substring(0, 30);
    const folderName = `template-${safeTopic}-${timestamp}-${randomId}`;

    const websiteCodesDir = path.join(__dirname, "..", "website-codes");
    const folderPath = path.join(websiteCodesDir, folderName);

    await fs.mkdir(folderPath, { recursive: true });

    // 🚀 Parallel file writes for faster I/O
    const readme = `# ${topic} (Template Based)\nGenerated from ${folderName}`;

    await Promise.all([
        fs.writeFile(path.join(folderPath, "index.html"), html),
        fs.writeFile(path.join(folderPath, "styles.css"), css),
        fs.writeFile(path.join(folderPath, "app.js"), js),
        fs.writeFile(path.join(folderPath, "README.md"), readme)
    ]);

    // Save to Database
    const Website = require("../models/generateWebsite");
    const newWebsite = new Website({
        presentationId: randomId,
        topic: topic,
        sourceUrl: url, // Assuming 'url' is relevant or passed in
        folderName: folderName,
        type: 'static',
        files: [
            { type: 'html', content: html },
            { type: 'css', content: css },
            { type: 'js', content: js }
        ]
    });

    try {
        const savedDoc = await newWebsite.save();
        console.log("🔮 Database Saved Doc ID:", savedDoc._id);

        return {
            id: savedDoc._id,
            presentationId: savedDoc._id,
            folderName,
            folderPath,
            previewUrl: `/website-codes/${folderName}/index.html`
        };
    } catch (err) {
        console.error("🔮 Database Save Error:", err);
        throw err;
    }
}


/**
 * Generate a website using Smart Template Prompting (AI-filled Static Template)
 * @param {string} url - The source URL
 */
async function generateSmartWebsite(url) {
    try {
        console.log(`\n🤖 Starting Smart AI Website Generation for: ${url}`);

        // 1. Fetch & Extract Content
        const rawData = await fetchWebsiteText(url);
        const content = extractContent(rawData, url);

        // 2. Detect Genre
        const genre = content.genre || templateManager.detectGenre(content);
        console.log(`✅ Detected Genre: ${genre.toUpperCase()}`);

        // 3. Select Static Reference File
        const template = templateManager.getTemplate(genre);
        console.log(`📂 Using Reference Template Generator for: ${genre}`);

        // Generate Reference Code dynamically
        const referenceCode = template.generateHTML(content);

        // 4. Construct AI Prompt (Enhanced V6 - Visual Remix)
        const sectionCount = content.sections?.length || 0;
        console.log(`   📊 Source Content Sections: ${sectionCount}`);

        const prompt = `
        You are an expert web developer and content strategist.

        OBJECTIVE:
        Refactor the provided "REFERENCE CODE" into a production-ready website for the client described in "CONTENT".

        ---
        CRITICAL RULES FOR CONTENT (INTELLIGENT REWRITE):
        1. **NO GARBAGE**: The "CONTENT" JSON contains raw extracted text (nav links, pricing tables, data dumps). You MUST filter this out. ONLY use text that describes the company's value, products, or story.
        2. **SANITY CHECK**: If a piece of text looks like "Home | About | Contact" or "$19.99 $29.99", DO NOT put it in a feature description.
        3. **MARKETING REWRITE**: Do not just copy-paste. Read the extracted text, understand the brand, and write **NEW, COMPELLING COPY** that fits the design space.
        4. **DESCRIPTIVE TITLES**: Avoid "Feature 1". Use "Global Payments", "Team Analytics", etc.

        ---
        DESIGN SYSTEM & FLEXIBILITY (THE "SMART" PART):
        
        **CRITICAL: THINK OF THE REFERENCE CODE AS INSPIRATION, NOT A BLUEPRINT.**
        The reference template shows you what's POSSIBLE, but you should analyze the original website's structure and adapt accordingly.

        1. **STRUCTURAL FREEDOM (PRIMARY DIRECTIVE)**:
           - **Study the Original**: Look at the extracted content structure. Does the original site have a bold hero with overlapping elements? A sidebar navigation? Asymmetric layouts?
           - **Adapt, Don't Copy-Paste**: If the original has 3 columns, don't force it into the reference's 2-column grid. CREATE what makes sense.
           - **Section Ordering**: You can REORDER sections if it improves the narrative flow. Put the most compelling content first.
           - **Add/Remove Sections**: If the content has 7 meaningful sections but the reference only shows 4, ADD more sections. Conversely, don't force filler.

        2. **LAYOUT EXPERIMENTATION (HIGHLY ENCOURAGED)**:
           - **Mix Layouts**: Combine different layout patterns in one page (e.g., Grid → Bento → Carousel → Full-Width).
           - **Asymmetry**: Don't be afraid of uneven layouts. 60/40 splits, offset cards, floating elements.
           - **Whitespace**: If the brand is minimal/luxury, use MASSIVE amounts of whitespace. Don't cram everything.
           - **Overlapping Elements**: Modern sites use layered designs. Cards that overlap backgrounds, text over images with proper contrast.

        3. **ADAPTIVE DESIGN TOKENS**:
           - **Spacing**: Adapt based on content density. Spacious for luxury brands (p-12), tighter for data-heavy sites (p-4).
           - **Radius**: Finance = \`rounded-none\` or \`rounded-sm\`, Creative = \`rounded-2xl\` or \`rounded-full\`.
           - **Typography Scale**: Don't just use the reference's font sizes. If it's a bold brand, make headings HUGE (text-7xl or larger).

        4. **VISUAL UNIQUENESS (MANDATORY)**:
           - **VIBE CHECK**: Analyze the 'Source URL' and 'Content'.
             - *Bank/Law*: Deep blues, serif headings, strict grids, trust signals.
             - *Startup/Tech*: Gradients, glassmorphism, rounded corners, playful micro-animations.
             - *Creative/Art*: BIG aggressive typography, uneven grids, high contrast, bold colors.
             - *Hospitality/Travel*: Full-bleed imagery, warm colors, organic shapes.
           - **Do NOT default** to the generic template look. **MAKE IT FEEL LIKE THE BRAND**.

        5. **COLOR & IMAGERY RE-INVENTION**:
           - **Aggressive Color Grading**: Study the brand colors from the content. Don't be conservative.
           - **CSS Variables**: Update ALL variables in \`:root\` to match the new direction (background, text, accent, gradients).
           - **Backgrounds**: Consider gradients, patterns, or subtle textures instead of solid colors.
           - **Iconography**: Match icons to the industry (\`fa-briefcase\` for business, \`fa-rocket\` for startups).

        ---
        TONE & COPYWRITING:
        - **Professional but Punchy**: Write headers that sell. "Secure your future" instead of "Security Features".
        - **Adapt Tone**: Professional for B2B, Playful for B2C.

        ---
        INPUT DATA:
        
        [CONTENT]:
        ${JSON.stringify(content, null, 2)}
        
        [REFERENCE CODE]:
        ${referenceCode.substring(0, 25000)} 
        
        ---
        OUTPUT INSTRUCTIONS:
        - Return ONLY the full, valid HTML code.
        - Start directly with <!DOCTYPE html>.
        - Ensure CSS is updated with new colors.
        `;

        // 5. Generate with Gemini
        console.log("✨ Sending to Gemini for generation...");
        const result = await textGenModel.generateContent(prompt);
        const response = result.response;
        let finalHtml = response.text();

        // Cleanup markdown
        finalHtml = finalHtml.replace(/```html/g, '').replace(/```/g, '');

        // --- POST-PROCESSING: THEME SWITCHER ---
        const themeSwitcherScript = getThemeSwitcher(genre);

        // --- POST-PROCESSING: SPLIT FILES ---
        let cssContent = '';
        let jsContent = '';

        // Extract CSS
        finalHtml = finalHtml.replace(/<style>([\s\S]*?)<\/style>/i, (match, css) => {
            cssContent = css.trim();
            return ''; // Remove from HTML, will add link tag later
        });

        // Add theme switcher script to jsContent
        jsContent += `\n/* --- Theme Switcher --- */\n${themeSwitcherScript.replace(/<script>|<\/script>/g, '').trim()}\n`;

        // Extract JS (all script tags)
        const scriptRegex = /<script>([\s\S]*?)<\/script>/gi;
        finalHtml = finalHtml.replace(scriptRegex, (match, js) => {
            jsContent += `\n/* --- Extracted Script --- */\n${js.trim()}\n`;
            return ''; // Remove from HTML
        });

        // Inject link to external CSS and script to external JS
        finalHtml = finalHtml.replace('</head>', '<link rel="stylesheet" href="style.css"></head>');
        finalHtml = finalHtml.replace('</body>', '<script src="script.js"></script></body>');


        // 6. Save
        const websiteId = crypto.randomUUID();
        const folderName = `smart_${content.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${websiteId.substring(0, 8)}`;
        const outputDir = path.join(__dirname, '..', 'website-codes', folderName);

        await fs.mkdir(outputDir, { recursive: true });

        // 🚀 Parallel file writes for faster I/O
        const readmeContent = `# Smart Website: ${content.topic}
        
        Generated: ${new Date().toISOString()}
        Source URL: ${url}
        Genre: ${genre}
        Template Used: Dynamic Template Generator
        
        ## Files
        - index.html: Main structure
        - style.css: Extracted styles
        - script.js: Extracted logic + Theme Switcher
        `;

        const writePromises = [
            fs.writeFile(path.join(outputDir, 'index.html'), finalHtml),
            fs.writeFile(path.join(outputDir, 'README.md'), readmeContent)
        ];

        if (cssContent) writePromises.push(fs.writeFile(path.join(outputDir, 'style.css'), cssContent));
        if (jsContent) writePromises.push(fs.writeFile(path.join(outputDir, 'script.js'), jsContent));

        await Promise.all(writePromises);

        // Save to Database
        const Website = require("../models/generateWebsite");
        const newWebsite = new Website({
            presentationId: websiteId,
            topic: content.topic,
            sourceUrl: url,
            folderName: folderName,
            type: 'static',
            files: [
                { type: 'html', content: finalHtml },
                { type: 'css', content: cssContent },
                { type: 'js', content: jsContent }
            ]
        });

        const savedDoc = await newWebsite.save();
        console.log("🔮 Smart Website Saved to DB with ID:", savedDoc._id);

        return {
            success: true,
            path: outputDir,
            url: `/website-codes/${folderName}/index.html`,
            genre: genre,
            id: savedDoc._id, // Critical for frontend
            presentationId: savedDoc._id
        };

    } catch (error) {
        console.error("Error in generateSmartWebsite:", error);
        throw error;
    }
}

module.exports = {
    generateTemplateWebsite,
    generateSmartWebsite
};

/**
 * Returns the appropriate theme switcher script based on the genre.
 * - SaaS: Dark/Tech themes, no CSS patch, Saas-specific vars.
 * - Corporate: Executive/Light themes, CSS patch.
 */
function getThemeSwitcher(genre) {
    if (genre === 'saas') {
        return `
        <script>
            // SaaS Theme Switcher (Vertex Architecture)
            document.addEventListener('DOMContentLoaded', () => {
                // No CSS Patch for SaaS - it ruins the Bento Grid and Deep Mode

                const themes = {
                    'vercel': {
                        name: 'Vercel Black',
                        colors: {
                            '--bg-deep': '#000000',
                            '--bg-card': '#0a0a0a',
                            '--bg-surface': '#111',
                            '--primary': '#0070f3',
                            '--primary-glow': 'rgba(0, 112, 243, 0.4)',
                            '--accent': '#00e0b7',
                            '--text-main': '#f8fafc',
                            '--text-muted': '#94a3b8',
                            '--border': 'rgba(255, 255, 255, 0.08)'
                        }
                    },
                    'cyberpunk': {
                        name: 'Cyberpunk Neon',
                        colors: {
                            '--bg-deep': '#050510',
                            '--bg-card': '#0f0f20',
                            '--bg-surface': '#1a1a2e',
                            '--primary': '#d946ef', 
                            '--primary-glow': 'rgba(217, 70, 239, 0.4)',
                            '--accent': '#22d3ee',
                            '--text-main': '#fff',
                            '--text-muted': '#a5f3fc',
                            '--border': '#2a2a5a'
                        }
                    },
                    'matrix': {
                        name: 'Matrix Code',
                        colors: {
                            '--bg-deep': '#000000',
                            '--bg-card': '#051005',
                            '--bg-surface': '#0a200a',
                            '--primary': '#00ff41',
                            '--primary-glow': 'rgba(0, 255, 65, 0.4)',
                            '--accent': '#008f11',
                            '--text-main': '#e0ffe0',
                            '--text-muted': '#003b00',
                            '--border': '#003b00'
                        }
                    },
                    'github': {
                        name: 'GitHub Dim',
                        colors: {
                            '--bg-deep': '#0d1117',
                            '--bg-card': '#161b22', 
                            '--bg-surface': '#21262d',
                            '--primary': '#1f6feb',
                            '--primary-glow': 'rgba(31, 111, 235, 0.4)',
                            '--accent': '#238636',
                            '--text-main': '#c9d1d9',
                            '--text-muted': '#8b949e',
                            '--border': '#30363d'
                        }
                    },
                    'dracula': {
                        name: 'Dracula Pro',
                        colors: {
                            '--bg-deep': '#282a36',
                            '--bg-card': '#44475a',
                            '--bg-surface': '#6272a4',
                            '--primary': '#ff79c6',
                            '--primary-glow': 'rgba(255, 121, 198, 0.4)',
                            '--accent': '#8be9fd',
                            '--text-main': '#f8f8f2',
                            '--text-muted': '#bd93f9',
                            '--border': '#6272a4'
                        }
                    },
                    'coffee': {
                        name: 'Coffee Grind',
                        colors: {
                            '--bg-deep': '#12100e',
                            '--bg-card': '#1b1816',
                            '--bg-surface': '#262220',
                            '--primary': '#d4b483', /* Latte */
                            '--primary-glow': 'rgba(212, 180, 131, 0.3)',
                            '--accent': '#c1666b', /* Berry/Roast */
                            '--text-main': '#e4d5b7',
                            '--text-muted': '#8a7f75',
                            '--border': '#423a34'
                        }
                    }
                };
                
                const switcher = document.createElement('div');
                switcher.style.cssText = 'position: fixed; bottom: 30px; right: 30px; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 15px; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 10px 40px rgba(0,0,0,0.5); z-index: 9999; display: flex; flex-direction: column; gap: 10px; min-width: 140px;';
                
                const title = document.createElement('div');
                title.textContent = 'Command Mode';
                title.style.cssText = 'color: var(--text-main); font-size: 10px; font-family: var(--font-code); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; text-align: center; opacity: 0.6;';
                switcher.appendChild(title);

                const btnContainer = document.createElement('div');
                btnContainer.style.cssText = 'display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;';
                switcher.appendChild(btnContainer);

                Object.entries(themes).forEach(([key, theme]) => {
                    const btn = document.createElement('button');
                    // Mini preview of the theme colors
                    btn.style.cssText = \`width: 24px; height: 24px; border-radius: 4px; background: linear-gradient(135deg, \${theme.colors['--bg-deep']} 50%, \${theme.colors['--primary']} 50%); border: 1px solid rgba(255,255,255,0.2); cursor: pointer; transition: all 0.2s ease;\`;
                    btn.title = theme.name;
                    
                    btn.onmouseover = () => {
                        btn.style.transform = 'scale(1.2)';
                        btn.style.borderColor = 'var(--text-main)';
                    };
                    btn.onmouseout = () => {
                        btn.style.transform = 'scale(1)';
                        btn.style.borderColor = 'rgba(255,255,255,0.2)';
                    };
                    
                    btn.onclick = () => {
                        // Apply all variables
                        Object.entries(theme.colors).forEach(([varName, value]) => {
                            document.documentElement.style.setProperty(varName, value);
                        });
                        
                        // Add active state
                        Array.from(btnContainer.children).forEach(b => b.style.boxShadow = 'none');
                        btn.style.boxShadow = '0 0 10px var(--primary)';
                    };
                    
                    btnContainer.appendChild(btn);
                });
                
                document.body.appendChild(switcher);
            });
        </script>`;
    }

    // DEFAULT: Corporate Theme Switcher (Existing Logic)
    return `
        <script>
            // Advanced Corporate Theme Switcher
            document.addEventListener('DOMContentLoaded', () => {
                // 1. CSS Patch: Force elements to use variables for consistency
                const patchStyle = document.createElement('style');
                patchStyle.textContent = \`
                    /* Forced Variable Usage for Theming */
                    header { background: var(--bg-dark) !important; border-bottom: 1px solid var(--border); }
                    .logo-strip { background: var(--bg-card) !important; }
                    .mobile-toggle { color: var(--text-main) !important; }
                    .nav-links { background: var(--bg-dark) !important; }
                    .feature-card, .service-card, .price-card, .review-card, .solution-card { background: var(--bg-card) !important; border-color: var(--border) !important; }
                    .feature-card:hover, .service-card:hover { border-color: var(--primary) !important; }
                    h1, h2, h3, h4, h5 { color: var(--text-main) !important; }
                    p, li { color: var(--text-muted) !important; }
                \`;
                document.head.appendChild(patchStyle);

                const themes = {
                    'executive': {
                        name: 'Executive Blue',
                        colors: {
                            '--bg-dark': '#0a0a0a',
                            '--bg-card': '#1a1a1a',
                            '--primary': '#0070e9',
                            '--primary-glow': 'rgba(0, 112, 233, 0.4)',
                            '--accent': '#635bff',
                            '--text-main': '#ffffff',
                            '--text-muted': '#a0a0a0',
                            '--border': '#333333'
                        }
                    },
                    'white': {
                        name: 'Modern Light',
                        colors: {
                            '--bg-dark': '#ffffff',
                            '--bg-card': '#f8f9fa',
                            '--primary': '#2563eb', /* Brighter Blue for white bg */
                            '--primary-glow': 'rgba(37, 99, 235, 0.1)',
                            '--accent': '#0f172a',
                            '--text-main': '#111827',
                            '--text-muted': '#4b5563',
                            '--border': '#e5e7eb'
                        }
                    },
                    'forest': {
                        name: 'Eco Corporate',
                        colors: {
                            '--bg-dark': '#022c22', 
                            '--bg-card': '#064e3b',
                            '--primary': '#10b981',
                            '--primary-glow': 'rgba(16, 185, 129, 0.4)',
                            '--accent': '#34d399',
                            '--text-main': '#ecfdf5',
                            '--text-muted': '#a7f3d0',
                            '--border': '#065f46'
                        }
                    },
                    'midnight': {
                        name: 'Midnight Pro',
                        colors: {
                            '--bg-dark': '#0f172a',
                            '--bg-card': '#1e293b',
                            '--primary': '#818cf8',
                            '--primary-glow': 'rgba(129, 140, 248, 0.4)',
                            '--accent': '#6366f1',
                            '--text-main': '#f8fafc',
                            '--text-muted': '#94a3b8',
                            '--border': '#334155'
                        }
                    },
                    'sunset': {
                        name: 'Sunset Biz',
                        colors: {
                            '--bg-dark': '#2a1b1b',
                            '--bg-card': '#452b2b',
                            '--primary': '#f97316', /* Orange */
                            '--primary-glow': 'rgba(249, 115, 22, 0.4)',
                            '--accent': '#fb923c',
                            '--text-main': '#fff7ed',
                            '--text-muted': '#fdba74',
                            '--border': '#7c2d12'
                        }
                    },
                    'royal': {
                        name: 'Royal Purple',
                        colors: {
                            '--bg-dark': '#1a0b2e',
                            '--bg-card': '#2d1b4e',
                            '--primary': '#d8b4fe', /* Lavender */
                            '--primary-glow': 'rgba(216, 180, 254, 0.4)',
                            '--accent': '#a855f7',
                            '--text-main': '#faf5ff',
                            '--text-muted': '#e9d5ff',
                            '--border': '#4c1d95'
                        }
                    }
                };

                const switcher = document.createElement('div');
                switcher.style.cssText = 'position: fixed; bottom: 30px; right: 30px; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 15px; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 10px 40px rgba(0,0,0,0.3); z-index: 9999; display: flex; flex-direction: column; gap: 10px; min-width: 140px;';
                
                const title = document.createElement('div');
                title.textContent = 'Theme Mode';
                title.style.cssText = 'color: var(--text-main); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; text-align: center; opacity: 0.8;';
                switcher.appendChild(title);

                const btnContainer = document.createElement('div');
                btnContainer.style.cssText = 'display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;';
                switcher.appendChild(btnContainer);

                Object.entries(themes).forEach(([key, theme]) => {
                    const btn = document.createElement('button');
                    // Mini preview of the theme colors
                    btn.style.cssText = \`width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, \${theme.colors['--bg-dark']} 50%, \${theme.colors['--primary']} 50%); border: 2px solid rgba(255,255,255,0.2); cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 6px rgba(0,0,0,0.1);\`;
                    btn.title = theme.name;
                    
                    btn.onmouseover = () => {
                        btn.style.transform = 'scale(1.15) rotate(10deg)';
                        btn.style.borderColor = 'var(--text-main)';
                    };
                    btn.onmouseout = () => {
                        btn.style.transform = 'scale(1) rotate(0deg)';
                        btn.style.borderColor = 'rgba(255,255,255,0.2)';
                    };
                    
                    btn.onclick = () => {
                        // Apply all variables
                        Object.entries(theme.colors).forEach(([varName, value]) => {
                            document.documentElement.style.setProperty(varName, value);
                        });
                        
                        // Add active state visual
                        Array.from(btnContainer.children).forEach(b => b.style.outline = 'none');
                        btn.style.outline = '2px solid var(--text-main)';
                        btn.style.outlineOffset = '2px';
                    };
                    
                    btnContainer.appendChild(btn);
                });
                
                document.body.appendChild(switcher);
            });
        </script>`;
}
