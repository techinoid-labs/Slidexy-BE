/**
 * =============================================================================
 * WEBSITE EDITOR SERVICE
 * =============================================================================
 * 
 * Purpose: Allow users to edit generated websites using natural language prompts.
 *          Modify HTML, CSS, and JS based on user instructions.
 * 
 * =============================================================================
 */

const fs = require("fs").promises;
const path = require("path");
const { textGenModel } = require("../utils/geminiModels");

/**
 * Auto-detect file structure in a website folder
 * Supports multiple naming conventions from different generators
 */
async function detectFiles(folderPath) {
    try {
        const files = await fs.readdir(folderPath);

        // Find all HTML files
        const htmlFiles = files.filter(f => f.endsWith('.html'));

        // Find CSS file (styles.css, style.css, or first .css)
        const cssFile = files.find(f => f === 'styles.css')
            || files.find(f => f === 'style.css')
            || files.find(f => f.endsWith('.css'));

        // Find JS file (app.js, script.js, main.js, or first .js)
        const jsFile = files.find(f => f === 'app.js')
            || files.find(f => f === 'script.js')
            || files.find(f => f === 'main.js')
            || files.find(f => f.endsWith('.js') && !f.includes('.min.'));

        return {
            htmlFiles,
            cssFile: cssFile || 'styles.css', // Fallback to default
            jsFile: jsFile || null // Can be null for sites without JS
        };
    } catch (error) {
        console.error('Error detecting files:', error);
        // Return defaults on error
        return {
            htmlFiles: ['index.html'],
            cssFile: 'styles.css',
            jsFile: 'app.js'
        };
    }
}

/**
 * Edit a website based on user prompt
 * @param {string} folderName - Name of the website folder in website-codes
 * @param {string} prompt - User's instruction
 * @param {string} [imagePath] - Optional path to uploaded image
 * @returns {Object} Result with updated files
 */
async function editWebsite(folderName, prompt, imagePath = null, history = [], clickedElementId = null, initialFiles = null, targetPage = 'index.html', computedStyles = null) {
    try {
        const websiteCodesDir = path.join(__dirname, "..", "website-codes");
        const folderPath = path.join(websiteCodesDir, folderName);

        // 1. Verify folder exists, OR create it if we have initial files (Lazy Loading)
        try {
            await fs.access(folderPath);
        } catch {
            if (initialFiles && Array.isArray(initialFiles) && initialFiles.length > 0) {
                console.log(`📂 Folder not found, reconstructing from DB: ${folderName}`);
                await fs.mkdir(folderPath, { recursive: true });

                for (const file of initialFiles) {
                    let fileName = "";
                    if (file.type === "html") fileName = "index.html";
                    else if (file.type === "css") fileName = "styles.css";
                    else if (file.type === "js") fileName = "app.js";
                    else if (file.type === "readme") fileName = "README.md";

                    if (fileName && file.content) {
                        await fs.writeFile(path.join(folderPath, fileName), file.content, "utf-8");
                    }
                }
                console.log("✅ Website files reconstructed on disk.");
            } else {
                throw new Error(`Website folder not found: ${folderName}`);
            }
        }

        // 2. Auto-detect file structure
        console.log('🔍 Detecting file structure...');
        const fileStructure = await detectFiles(folderPath);
        console.log(`   📄 HTML files: ${fileStructure.htmlFiles.join(', ')}`);
        console.log(`   🎨 CSS file: ${fileStructure.cssFile}`);
        console.log(`   ⚡ JS file: ${fileStructure.jsFile || 'none'}`);

        // Use detected files or defaults
        const htmlPath = path.join(folderPath, targetPage || 'index.html');
        const cssPath = path.join(folderPath, fileStructure.cssFile);
        const jsPath = fileStructure.jsFile ? path.join(folderPath, fileStructure.jsFile) : null;

        // Read files (gracefully handle missing JS)
        const [htmlCode, cssCode, jsCode] = await Promise.all([
            fs.readFile(htmlPath, "utf-8").catch(() => ""),
            fs.readFile(cssPath, "utf-8").catch(() => ""),
            jsPath ? fs.readFile(jsPath, "utf-8").catch(() => "") : Promise.resolve("")
        ]);

        // --- ENHANCEMENT: Ensure Unique IDs for Block Replacement ---
        const cheerio = require("cheerio");
        const $ = cheerio.load(htmlCode);
        let idCounter = 1;
        let protectionModified = false;

        // Target common structural and content elements
        // Target common structural and content elements - Expanded for Granular Click-to-Edit
        $('section, div, header, footer, nav, main, article, aside, h1, h2, h3, h4, h5, h6, p, ul, ol, li, form, table, img, span, a, button, i, strong, em, svg, path').each((i, el) => {
            const currentId = $(el).attr('id');
            if (!currentId) {
                // Generate a semantic-ish ID if possible, or generic
                const tagName = el.tagName.toLowerCase();
                const newId = `neuro-${tagName}-${idCounter++}`;
                $(el).attr('id', newId);
                protectionModified = true;
            }
        });

        // Use this enhanced HTML for both Prompt and Final apply
        let currentHtml = protectionModified ? $.html() : htmlCode;
        if (protectionModified) console.log("✨ Auto-injected IDs into HTML to improve AI targeting.");

        if (imagePath) {
            console.log(`📸 Image uploaded for edit: ${imagePath}`);
        }

        // 3. Construct AI Prompt with Block Strategy
        const systemPrompt = `You are an expert full-stack developer (HTML/CSS/JS). 
Your task is to MODIFY an existing website based on the user's request.

CURRENT STATE:
The website consists of 3 files: index.html, styles.css, app.js.
I will provide their current contents below.

USER REQUEST:
"${prompt}"

${imagePath ? `
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
CRITICAL INSTRUCTION: IMAGE ATTACHED
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
The user has uploaded an image file. It is saved at: "${imagePath}"

You MUST use this exact path: "${imagePath}" in your code update.
- If replacing an <img>, set src="${imagePath}"
- If changing a background, set background-image: url('${imagePath}')
- Do NOT use a placeholder.
- Do NOT make up a URL.
- USE "${imagePath}" EXACTLY.
- PRESERVE existing alt text, titles, and captions unless the user explicitly asks to change them.
- Do NOT hallucinate new content for the image.
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
` : ""}

${clickedElementId ? `IMPORTANT: The user has CLICKED on the element with ID "${clickedElementId}" while making this request. 
Your edit MUST focus on this specific element ("#${clickedElementId}") or its immediate children. 
If the user's prompt is vague (e.g., "fix typo", "make it blue"), apply it to THIS element.

⚠️ CRITICAL STRUCTURE PRESERVATION RULES:
1. **Preserve Tag Structure**: When modifying text content, you MUST keep the original HTML tag, 
   ALL CSS classes, the ID attribute, and ALL other attributes (href, src, alt, class, style, data-*, etc.).

2. **Content-Only Text Edits**: 
   - If user requests text change ("change button text to X", "update heading to Y"), modify ONLY the innerHTML.
   - Return the COMPLETE element with ALL original attributes intact.
   - Example: <button class="btn btn-primary shadow-lg" id="cta-1" onclick="submit()">Old Text</button>
   - User says: "change button text to 'New Text'"
   - You MUST return: <button class="btn btn-primary shadow-lg" id="cta-1" onclick="submit()">New Text</button>
   - ❌ NEVER return just: "New Text" (loses tag)
   - ❌ NEVER return: <button>New Text</button> (loses classes and attributes)

3. **CSS Class Preservation**: This is CRITICAL for CloneArchitect sites.
   - Some elements have 10-15+ utility classes (Tailwind-style: flex, items-center, px-4, py-2, etc.)
   - You MUST preserve EVERY SINGLE CLASS, even if there are many.
   - If original has class="a b c d e f g h i j k l m n o", your response must include ALL of them.

4. **Attribute Preservation**: 
   - Links must keep: href, target, rel, class, style, etc.
   - Images must keep: src, alt, width, height, class, loading, etc.
   - Buttons must keep: type, onclick, disabled, class, etc.

5. **Nested Structure**: For complex elements (cards, panels with icon + text):
   - Preserve the child element hierarchy
   - Only modify the specific text/content node requested
   - Don't flatten nested structures

6. **Only Replace What's Requested**:
   - Text edit → innerHTML change only, preserve outer tag
   - Color change → Add/modify CSS rule in cssAppend, don't touch HTML structure
   - Add new element → Use insert_before/insert_after, don't replace existing

${computedStyles ? `
🎨 CURRENT VISUAL CONTEXT of #${clickedElementId}:
The user clicked on an element with these computed styles:
- Color: ${computedStyles.color || 'N/A'}
- Background: ${computedStyles.backgroundColor || 'N/A'}
- Font: ${computedStyles.fontSize} ${computedStyles.fontFamily}
- Font Weight: ${computedStyles.fontWeight}
- Text Align: ${computedStyles.textAlign}
- Padding: ${computedStyles.padding}
- Margin: ${computedStyles.margin}
- Border Radius: ${computedStyles.borderRadius}
- Box Shadow: ${computedStyles.boxShadow || 'none'}
- Dimensions: ${computedStyles.width} × ${computedStyles.height}

USE THIS CONTEXT to make intelligent edits:
- If user says "make it lighter", lighten the CURRENT background color
- If user says "change the font", you know the CURRENT font to replace
- If user says "make it bigger", increase the CURRENT font size
- If user says "add more spacing", adjust the CURRENT padding/margin
- PRESERVE the visual style unless explicitly asked to change it
` : ''}
` : ""}

${history && history.length > 0 ? `PREVIOUS CONVERSATION HISTORY:
The user is continuing a conversation. Use this context to understand references like "it", "that section", or "make it blue".
${history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: "${h.content}"`).join('\n')}
` : ""}

1. **HTML Block Replacement/Insertion**:
   - If the change is localized to a specific section (e.g., "change hero title"), identify the parent element ID.
   - You can also ADD new sections relative to existing ones using "insert_after" or "insert_before".
   - You can REMOVE sections by using "remove".
   - **Auto-Positioning**: If the user doesn't specify WHERE to add a section, INFER the best semantic location (e.g., "Testimonials" usually go after "Features").
   - Return ONLY the new HTML for that specific section (not needed for remove).

2. **CSS Appending**:
   - If adding/changing styles, return ONLY the new/updated CSS rules.
   - I will APPEND them to the end of styles.css (cascade will override old rules).

3. **New Page Creation**:
   - If the user asks for a new page (e.g., "Create an About page"), provide the full HTML content in the "newFiles" array.
   - Don't forget to update the "index.html" navbar to link to this new page (using Block Replacement).

4. **Full Rewrite (Fallback)**:
   - Only use this if the change is global or complex (e.g., "change entire layout", "rewrite JS logic").

OUTPUT FORMAT:
Return a strictly valid JSON object. No markdown.
{
  "strategy": "block" | "full",
  
  // IF STRATEGY IS "block":
  "htmlUpdates": [
    { 
      "targetId": "section-0", 
      "selector": ".hero-content", // OPTIONAL: Use CSS selector if ID is missing or unknown
      "action": "replace" | "insert_after" | "insert_before" | "remove", 
      "content": "<section id='new-section'>...</section>" 
    }
  ],
  "forceFullRewrite": false, // Set to true if you cannot confidently identify IDs for block replacement
  "cssAppend": ".hero-title { color: red; }", // New rules to append
  "jsUpdate": "full new js code OR null",     // JS is always full update for safety
  "newFiles": [
    { "filename": "about.html", "content": "<!DOCTYPE html>..." }
  ],

  // IF STRATEGY IS "full" (Fallback):
  "html": "full new index.html",
  "css": "full new styles.css",
  "js": "full new app.js",
  "newFiles": [], // Can also optionally support new files here
  
  "summary": "Brief 1-sentence summary of what changed"
}`;

        // 4. Call AI with safeguards
        const result = await textGenModel.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [{
                        text: `
CODE CONTEXT:

--- index.html ---
${currentHtml}

--- styles.css ---
${cssCode}

--- app.js ---
${jsCode}

${systemPrompt}
` }]
                }
            ]
        });

        const responseText = result.response.text();


        let parsedParams;
        try {
            // Sanitize JSON (sometimes AI wraps in ```json ... ```)
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON found in response");
            parsedParams = JSON.parse(jsonMatch[0]);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            throw new Error("AI produced invalid JSON response");
        }

        // 5. Apply Updates based on Strategy
        const updates = [];
        let finalHtml = currentHtml;
        let finalCss = cssCode;
        let finalJs = jsCode;

        if (parsedParams.strategy === "block") {
            console.log("⚡ Executing Block Replacement Strategy");

            // HTML Patching
            if (parsedParams.htmlUpdates && Array.isArray(parsedParams.htmlUpdates)) {
                // Use Cheerio for robust DOM manipulation
                const cheerio = require("cheerio");
                const $ = cheerio.load(finalHtml);
                let htmlChanged = false;

                for (const update of parsedParams.htmlUpdates) {
                    let $target = null;

                    // 1. Try finding by ID first
                    if (update.targetId) {
                        $target = $(`#${update.targetId}`);
                    }

                    // 2. Fallback to Selector if ID not found or not provided
                    if ((!$target || !$target.length) && update.selector) {
                        $target = $(update.selector).first(); // Target only the first match to avoid duplicates
                    }

                    if ($target && $target.length) {
                        const action = update.action || "replace";

                        if (action === "replace") {
                            // Smart detection: Full element or just content?
                            const content = update.content.trim();
                            const isFullElement = content.match(/^<[a-zA-Z][\s\S]*>$/);

                            if (isFullElement) {
                                // AI returned complete element, safe to replace outer HTML
                                $target.replaceWith(content);
                                console.log(`   ✅ Replaced element #${update.targetId} (full HTML)`);
                            } else {
                                // AI returned partial content, update inner HTML only (preserves tag + attributes)
                                $target.html(content);
                                console.log(`   ✅ Updated content of #${update.targetId} (innerHTML only, preserved structure)`);
                            }
                            htmlChanged = true;
                        } else if (action === "insert_after") {
                            $target.after("\n" + update.content);
                            htmlChanged = true;
                        } else if (action === "insert_before") {
                            $target.before(update.content + "\n");
                            htmlChanged = true;
                        } else if (action === "remove") {
                            $target.remove();
                            htmlChanged = true;
                        }
                    } else {
                        console.warn(`Block Strategy Miss: Could not find target ID #${update.targetId} or selector '${update.selector}'.`);
                        // Consider triggering full rewrite fallback here if crucial?
                    }
                }

                if (htmlChanged) {
                    finalHtml = $.html();
                    // Cheerio wraps in <html><body>...</body></html> automatically if it detects full doc.
                    // But usually it respects the input. If it adds extra tags we might need to handle,
                    // but since we loaded full HTML, it returns full HTML.
                }
            }

            // CSS Appending
            if (parsedParams.cssAppend) {
                finalCss = finalCss.trim() + "\n\n/* AI Update */\n" + parsedParams.cssAppend;
            }

            // JS (Full update for block strategy usually means null, unless specific request)
            if (parsedParams.jsUpdate && parsedParams.jsUpdate !== "null") {
                finalJs = parsedParams.jsUpdate;
            }

        } else {
            console.log("🔄 Executing Full Rewrite Strategy");
            // Fallback to Full Rewrite
            if (parsedParams.html && parsedParams.html !== "null") finalHtml = parsedParams.html;
            if (parsedParams.css && parsedParams.css !== "null") finalCss = parsedParams.css;
            if (parsedParams.js && parsedParams.js !== "null") finalJs = parsedParams.js;
        }

        // Handle New Files (Both strategies)
        if (parsedParams.newFiles && Array.isArray(parsedParams.newFiles)) {
            for (const newFile of parsedParams.newFiles) {
                if (newFile.filename && newFile.content) {
                    const newFilePath = path.join(folderPath, newFile.filename);
                    await fs.writeFile(newFilePath, newFile.content, "utf-8");
                    updates.push({ type: "new_file", name: newFile.filename, content: newFile.content });
                    console.log(`✨ Created new file: ${newFile.filename}`);
                }
            }
        }

        // 6. Safeguards (Length Check)
        const validate = (newC, oldC, name) => {
            const isDeletion = /delete|remove/i.test(prompt);
            if (!isDeletion && oldC.length > 500 && newC.length < oldC.length * 0.5) {
                console.warn(`Safety: New ${name} is surprisingly short. Keeping old.`);
                return oldC;
            }
            return newC;
        };

        finalHtml = validate(finalHtml, currentHtml, "HTML");
        finalCss = validate(finalCss, cssCode, "CSS");
        finalJs = validate(finalJs, jsCode, "JS");

        // 7. Write to disk
        if (finalHtml !== currentHtml) {
            await fs.writeFile(htmlPath, finalHtml, "utf-8");
            updates.push({ type: "html", content: finalHtml });
        } else {
            updates.push({ type: "html", content: currentHtml });
        }

        if (finalCss !== cssCode) {
            await fs.writeFile(cssPath, finalCss, "utf-8");
            updates.push({ type: "css", content: finalCss });
        } else {
            updates.push({ type: "css", content: cssCode });
        }

        // Only write JS if the file exists or content changed
        if (jsPath && finalJs !== jsCode) {
            await fs.writeFile(jsPath, finalJs, "utf-8");
            updates.push({ type: "js", content: finalJs });
        } else if (jsPath) {
            updates.push({ type: "js", content: jsCode });
        }
        // If no jsPath, skip JS file entirely (Clone Architect sites without JS)

        return {
            success: true,
            message: parsedParams.summary || "Website updated successfully",
            files: updates,
            previewUrl: `/website-codes/${folderName}/index.html`
        };

    } catch (error) {
        console.error("Editor Service Error:", error);
        throw error;
    }
}

module.exports = { editWebsite };
