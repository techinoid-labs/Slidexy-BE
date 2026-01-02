/**
 * Generate Infographic V2 Service
 * 
 * Enhanced V2 service with built-in file processing support.
 * 
 * Features:
 * - Template-based rendering (7 templates)
 * - Intelligent layout analysis
 * - File upload support (PDF, DOCX, TXT)
 * - Smart summarization of uploaded documents
 * - Multi-view mode support
 * - Robust error handling
 */

const templateSystemService = require('./infographic-template-system');
const PDFParse = require('pdf-parse');
const mammoth = require('mammoth');

// Assuming you have access to your Gemini or text generation model here
// Replace with your actual model import
const { textGenModel } = require('../../utils/geminiModels'); // Adjust path as needed

class GenerateInfographicV2Service {
  constructor() {
    this.templateService = templateSystemService;
  }

  /**
   * Extract text from uploaded file buffer
   * @private
   */
  async _extractTextFromFile(fileBuffer, mimeType) {
    if (!fileBuffer) return "";

    try {
      if (mimeType.startsWith("text/")) {
        return fileBuffer.toString("utf-8");
      }

      if (mimeType === "application/pdf") {
        const { PDFParse } = require("pdf-parse");
        const parser = new PDFParse({ data: fileBuffer });
        const result = await parser.getText();
        return result.text || "";
      }

      if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        return result.value;
      }

      console.warn("Unsupported file type in extraction:", mimeType);
      return "";
    } catch (err) {
      console.error("File extraction failed:", err.message);
      return "";
    }
  }

  /**
   * Summarize long document content intelligently for infographic use
   * @private
   */
  async _summarizeContent(rawContent) {
    if (!rawContent || rawContent.trim().length < 100) {
      return rawContent.substring(0, 2000);
    }

    try {
      const summaryPrompt = `
You are an expert infographic content curator.

Summarize the following document in a structured, visual-friendly way for creating a beautiful infographic.

Focus on:
- Main topic/title suggestion
- Key facts, stats, steps, benefits, or comparisons
- Core message or takeaway
- Short, punchy phrases ideal for visuals

Output in clean markdown:
# Suggested Title

- Bullet point 1
- Bullet point 2
- ...

Document:
"""${rawContent}"""

Respond ONLY with text no styling or anything. No explanations.
`;

      const result = await textGenModel.generateContent(summaryPrompt);
      let summary = "";

      if (typeof result.response.text === "function") {
        summary = result.response.text();
      } else {
        summary = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }

      return summary.trim();
    } catch (err) {
      console.error("Summarization failed, using raw excerpt:", err.message);
      return rawContent.substring(0, 3000);
    }
  }

  /**
   * Main method: Generate infographic with optional file
   * @param {string} userPrompt - Optional user text prompt (title/focus)
   * @param {string} viewMode - 'landscape' or 'portrait'
   * @param {object} file - Optional file object { buffer, mimetype, originalname }
   * @returns {Promise<object>} { data, html, meta }
   */
  async generateInfographic(userPrompt = "", viewMode = 'landscape', file = null) {
    let finalTopic = userPrompt?.trim() || "Create a beautiful infographic";

    try {
      // === FILE PROCESSING ===
      if (file && file.buffer) {
        console.log(`Processing uploaded file: ${file.originalname} (${file.mimetype})`);

        const rawText = await this._extractTextFromFile(file.buffer, file.mimetype);

        if (rawText.trim()) {
          const summarized = await this._summarizeContent(rawText);

          finalTopic = `Create an infographic based on this summarized content:

${summarized}

${userPrompt ? `\nUser's additional hint/title: "${userPrompt}"` : ""}
`.trim();

          console.log("Final topic built from file + prompt");
        } else {
          console.warn("No text extracted from file");
        }
      }

      // Validation
      if (typeof finalTopic !== 'string' || !finalTopic.trim()) {
        throw new Error('No valid content to generate infographic from');
      }

      console.log(`\n[GenerateInfographicV2Service] Starting generation`);
      console.log(`Topic: "${finalTopic.substring(0, 100)}..."`);
      console.log(`View Mode: ${viewMode}`);

      // === TEMPLATE SYSTEM GENERATION ===
      const result = await this.templateService.generateInfographic(finalTopic, viewMode);

      console.log(`[GenerateInfographicV2Service] Infographic generated successfully`);

      return result;

    } catch (error) {
      console.error(`[GenerateInfographicV2Service] Generation failed:`, error.message);
      throw error;
    }
  }

  // === Other existing methods remain unchanged ===

  async generateWithParams(topic, customParams = {}) {
    const { viewMode = 'landscape', ...otherParams } = customParams;
    return this.generateInfographic(topic, viewMode, null); // file not supported here yet
  }

  async generateMultiView(topic, viewModes = ['landscape', 'portrait']) {
    console.log(`\nGenerating multiple views for: "${topic.substring(0, 40)}..."`);

    const results = {};
    for (const viewMode of viewModes) {
      try {
        const result = await this.generateInfographic(topic, viewMode);
        results[viewMode] = result;
        console.log(`Generated ${viewMode} view`);
      } catch (error) {
        console.error(`Failed ${viewMode}:`, error.message);
        results[viewMode] = { error: error.message, success: false };
      }
    }
    return results;
  }

  getAvailableLayouts() {
    return this.templateService.getAvailableLayouts();
  }

  getAvailableTemplates() {
    return this.templateService.getAvailableTemplates();
  }

  getServiceInfo() {
    return {
      name: 'GenerateInfographicV2Service',
      version: '2.1.0',
      description: 'Template-based infographic generation with file upload support',
      type: 'infographic-generator',
      features: [
        'template-based-rendering',
        'layout-analysis',
        'content-generation',
        'multi-view-support',
        'file-upload-processing',
        'intelligent-summarization',
        'error-handling-retry',
      ],
      templates: this.getAvailableTemplates(),
      layouts: this.getAvailableLayouts(),
      supportedFileTypes: ['PDF', 'DOCX', 'TXT'],
    };
  }
}

module.exports = new GenerateInfographicV2Service();