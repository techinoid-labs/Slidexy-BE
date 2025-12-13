const { editWebsite } = require("../services/websiteEditorService");

/**
 * Handle website edit request
 */
async function editWebsiteController(req, res) {
    try {
        const { id } = req.params; // This is the ID of the DynamicWebsite document
        let { prompt, folderName, history, clickedElementId } = req.body;

        // Parse history if it's a string (common with FormData)
        if (typeof history === 'string') {
            try {
                history = JSON.parse(history);
            } catch (e) {
                console.warn("Failed to parse history JSON:", e.message);
                history = [];
            }
        }

        // We need either the ID to look up the DB or the folderName directly.
        // Since the service logic uses folderName, it's safer to allow the client to pass it 
        // OR look it up if we have a DB model import.
        // For simplicity given the plan, let's assume the client passes the folder name 
        // OR we could fetch it. Let's start with folderName from body for direct access 
        // (since file system operations rely on it).

        // If we want to be robust, we should look up the folderName from the ID if not provided.
        // But for this MVP step, let's accept folderName from the body if the ID isn't enough context.
        // Wait, the user prompt said "edit website code", usually we refer to it by ID.
        // Let's import the model to get the folderName from ID.

        const DynamicWebsite = require('../models/DynamicWebsite');
        const GeneratedWebsite = require('../models/generateWebsite');
        let targetFolderName = folderName;
        let ModelToUse = DynamicWebsite; // Default to Dynamic
        let initialFiles = null; // New: Pass files to service for reconstruction

        if (!targetFolderName && id) {
            console.log("Looking up website with ID:", id);

            try {
                let website = await DynamicWebsite.findById(id);
                console.log("DynamicWebsite lookup result:", website ? "Found" : "Not Found");

                if (website) {
                    targetFolderName = website.folderName;
                    initialFiles = website.files; // Capture files
                } else {
                    // Try GeneratedWebsite
                    website = await GeneratedWebsite.findById(id);
                    console.log("GeneratedWebsite lookup result:", website ? "Found" : "Not Found");

                    if (website) {
                        targetFolderName = website.folderName;
                        ModelToUse = GeneratedWebsite;
                        initialFiles = website.files; // Capture files
                    }
                }
            } catch (err) {
                console.error("Error looking up website by ID:", err.message);
            }
        }

        if (!targetFolderName) {
            return res.status(404).json({ success: false, error: "Website not found or folder name missing" });
        }

        if (!prompt) {
            return res.status(400).json({ success: false, error: "Prompt is required" });
        }

        console.log("📝 Controller received edit request. ID:", id);
        console.log("📂 Files received:", req.file ? `YES - ${req.file.filename}` : "NO");

        let imagePath = null;
        if (req.file) {
            // The file is uploaded to 'uploads/' or wherever multer is configured
            // We need to serve this statically or move it to the website folder?
            // For now, let's provide the web-accessible path if possible, 
            // OR a relative path that the web server can serve.
            // Assuming 'uploads' is served statically as /uploads
            imagePath = `/uploads/${req.file.filename}`;
        }

        console.log(`Editing website: ${targetFolderName} with prompt: "${prompt}"`);

        // Pass initialFiles to allow reconstruction if folder is missing
        const result = await editWebsite(targetFolderName, prompt, imagePath, history, clickedElementId, initialFiles);

        // === DB SYNC: Update MongoDB with new file contents ===
        if (id && result.success) {
            const fs = require('fs').promises;
            const path = require('path');

            // Re-read the updated files to sync with DB
            // We need this because the frontend fetches from DB, not file system
            const websiteCodesDir = path.join(__dirname, "..", "website-codes");
            const folderPath = path.join(websiteCodesDir, targetFolderName);

            // Construct the files array for DB
            // We know the main 3 files are index.html, styles.css, app.js
            // Plus any new files created.
            // Simplest approach: Read the result.files (which has content) OR read from disk

            // Let's use the updates returned by editWebsite, but they might be partial?
            // editWebsite returns `files` array with full content for modified files.
            // But to be safe and complete, let's just re-read the directory or specific known files.

            try {
                const filesForDb = [];
                const filesOnDisk = await fs.readdir(folderPath);

                for (const file of filesOnDisk) {
                    if (['index.html', 'styles.css', 'app.js', 'readme.md'].includes(file.toLowerCase()) || file.endsWith('.html')) {
                        const content = await fs.readFile(path.join(folderPath, file), 'utf-8');
                        // Determine type
                        let type = 'html';
                        if (file.endsWith('.css')) type = 'css';
                        if (file.endsWith('.js')) type = 'js';
                        if (file.toLowerCase().endsWith('.md')) type = 'readme';

                        filesForDb.push({
                            type: type,
                            content: content
                        });
                    }
                }

                // Update the document (Dynamic or Generated)
                await ModelToUse.findByIdAndUpdate(id, {
                    files: filesForDb,
                    generatedAt: new Date() // Optional: Update timestamp
                });
                console.log(`✅ Synced ${filesForDb.length} files to MongoDB for ID: ${id}`);
            } catch (dbErr) {
                console.error("Failed to sync updates to DB:", dbErr);
                // Don't fail the request, just log it. 
                // (Or should we fail? Ideally yes, but file system is the source of truth for serving)
            }
        }

        res.json(result);

    } catch (error) {
        console.error("Edit API Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = { editWebsiteController };
