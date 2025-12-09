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
 * Edit a website based on user prompt
 * @param {string} folderName - Name of the website folder in website-codes
 * @param {string} prompt - User's instruction
 * @param {string} [imagePath] - Optional path to uploaded image
 * @returns {Object} Result with updated files
 */
async function editWebsite(folderName, prompt, imagePath = null) {
    try {
        const websiteCodesDir = path.join(__dirname, "..", "website-codes");
        const folderPath = path.join(websiteCodesDir, folderName);

        // 1. Verify folder exists
        try {
            await fs.access(folderPath);
        } catch {
            throw new Error(`Website folder not found: ${folderName}`);
        }

        // 2. Read current files
        const htmlPath = path.join(folderPath, "index.html");
        const cssPath = path.join(folderPath, "styles.css");
        const jsPath = path.join(folderPath, "app.js");

        const [htmlCode, cssCode, jsCode] = await Promise.all([
            fs.readFile(htmlPath, "utf-8").catch(() => ""),
            fs.readFile(cssPath, "utf-8").catch(() => ""),
            fs.readFile(jsPath, "utf-8").catch(() => "")
        ]);

        // 3. Construct AI Prompt with Block Strategy
        const systemPrompt = `You are an expert full-stack developer (HTML/CSS/JS). 
Your task is to MODIFY an existing website based on the user's request.

CURRENT STATE:
The website consists of 3 files: index.html, styles.css, app.js.
I will provide their current contents below.

USER REQUEST:
"${prompt}"

${imagePath ? `CONTEXT: The user has uploaded an image. It is available at this local path: "${imagePath}". 
If the user asks to use this image (e.g., "replace logo", "change hero"), update the relevant <img> src attribute or CSS background-image to use this EXACT path: "${imagePath}".` : ""}

STRATEGY (COST OPTIMIZATION):
Prefer "Block Replacement" over "Full File Rewrite" whenever possible.

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
      "action": "replace" | "insert_after" | "insert_before" | "remove", 
      "content": "<section id='new-section'>...</section>" // Optional for remove
    }
  ],
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
${htmlCode}

--- styles.css ---
${cssCode}

--- app.js ---
${jsCode}

${systemPrompt}
` }]
                }
            ]
        });

        let r = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

        // Clean JSON (remove markdown blocks if any)
        r = r.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

        let parsedParams;
        try {
            parsedParams = JSON.parse(r);
        } catch (e) {
            console.error("Failed to parse AI response:", r);
            throw new Error("AI produced invalid JSON response");
        }

        // 5. Apply Updates based on Strategy
        const updates = [];
        let finalHtml = htmlCode;
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
                    if (update.targetId) { // Content is optional for remove
                        const $target = $(`#${update.targetId}`);
                        if ($target.length) {
                            const action = update.action || "replace"; // Default to replace

                            if (action === "replace") {
                                // Replace the element with new content
                                $target.replaceWith(update.content);
                                htmlChanged = true;
                            } else if (action === "insert_after") {
                                // Insert new content AFTER the target element
                                $target.after("\n" + update.content);
                                htmlChanged = true;
                            } else if (action === "insert_before") {
                                // Insert new content BEFORE the target element
                                $target.before(update.content + "\n");
                                htmlChanged = true;
                            } else if (action === "remove") {
                                // Remove the element completely
                                $target.remove();
                                htmlChanged = true;
                            }
                        } else {
                            console.warn(`Could not find target ID #${update.targetId} for action ${update.action || 'replace'}.`);
                        }
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

        finalHtml = validate(finalHtml, htmlCode, "HTML");
        finalCss = validate(finalCss, cssCode, "CSS");
        finalJs = validate(finalJs, jsCode, "JS");

        // 7. Write to disk
        if (finalHtml !== htmlCode) {
            await fs.writeFile(htmlPath, finalHtml, "utf-8");
            updates.push({ type: "html", content: finalHtml });
        } else {
            updates.push({ type: "html", content: htmlCode });
        }

        if (finalCss !== cssCode) {
            await fs.writeFile(cssPath, finalCss, "utf-8");
            updates.push({ type: "css", content: finalCss });
        } else {
            updates.push({ type: "css", content: cssCode });
        }

        if (finalJs !== jsCode) {
            await fs.writeFile(jsPath, finalJs, "utf-8");
            updates.push({ type: "js", content: finalJs });
        } else {
            updates.push({ type: "js", content: jsCode });
        }

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
