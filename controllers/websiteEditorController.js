const { editWebsite } = require("../services/websiteEditorService");

/**
 * Handle website edit request
 */
async function editWebsiteController(req, res) {
    try {
        const { id } = req.params; // This is the ID of the DynamicWebsite document
        const { prompt, folderName } = req.body;

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
        let targetFolderName = folderName;

        if (!targetFolderName && id) {
            const website = await DynamicWebsite.findById(id);
            if (website) {
                targetFolderName = website.folderName;
            }
        }

        if (!targetFolderName) {
            return res.status(404).json({ success: false, error: "Website not found or folder name missing" });
        }

        if (!prompt) {
            return res.status(400).json({ success: false, error: "Prompt is required" });
        }

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

        const result = await editWebsite(targetFolderName, prompt, imagePath);

        res.json(result);

    } catch (error) {
        console.error("Edit API Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = { editWebsiteController };
