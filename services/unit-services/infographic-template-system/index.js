/**
 * Dynamic Infographic Service V2 (Template-Based)
 * 
 * Pipeline:
 * 1. Analyze layout type
 * 2. Gather parameters (style, colors)
 * 3. Generate content (JSON)
 * 4. Render template with content
 * 5. Return HTML
 */

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const layoutAnalyzer = require('./services/layoutAnalyzer');
const contentGenerator = require('./services/contentGenerator');
const templateRenderer = require('./services/templateRenderer');

class DynamicInfographicServiceV2 {
  constructor() {
    this.retries = 3;
  }

  async generateInfographic(prompt, viewMode = 'landscape',slideType, options = {}) {
      const {
    colorScheme,
    title,
    textOverlay,
    narration,
    keyPoints
  } = options;
    // Validate inputs
// Validate inputs
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('Prompt must be a non-empty string');
  }

  if (!['landscape', 'portrait'].includes(viewMode)) {
    throw new Error('viewMode must be either "landscape" or "portrait"');
  }

  // if (!slideType || typeof slideType !== 'string') {
  //   throw new Error('slideType must be a non-empty string');
  // }

  const startTime = Date.now();

  console.log(`\n🚀 Starting Template-Based Infographic Generation`);
  console.log(`📌 Prompt: "${prompt.substring(0, 60)}..."`);
  console.log(`📱 View Mode: ${viewMode}`);
  console.log(`🧩 Slide Type: ${slideType}`);

  if (colorScheme) {
    console.log(`🎨 Color Scheme: ${colorScheme}`);
  }

  if (title) {
    console.log(`📝 Title: ${title}`);
  }

  if (keyPoints?.length) {
    console.log(`📍 Key Points: ${keyPoints.length}`);
  }

  console.log('');

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        console.log(`\n═══ Attempt ${attempt}/${this.retries} ═══`);

        // Step 1: Analyze layout
        console.log('\n1️⃣ Analyzing content for best layout type...');
        const layoutAnalysis = await layoutAnalyzer.analyzeContent({
          topic: prompt,
          viewMode,
          textOverlay,
          narration,
          keyPoints,
        });
        console.log(`Slide Type got from Python Code ${slideType}`);
        const layoutType = layoutAnalysis.layoutType;
        console.log(`   ✓ Selected layout: ${layoutType} (confidence: ${(layoutAnalysis.confidence * 100).toFixed(0)}%)`);

        // Step 2: Gather parameters (style, colors)
        console.log('\n2️⃣ Gathering visual parameters...');
        const parameters = await contentGenerator.gatherParameters(prompt, options.colorScheme);
        console.log(`   ✓ Style: ${parameters.style}`);
        console.log(`   ✓ Colors: ${parameters.colors.join(', ')}`);

        // Step 3: Generate content
        console.log('\n3️⃣ Generating content for template...');
        const content = await contentGenerator.generateContent({
          topic: prompt,
          layoutType,
          parameters,
          viewMode,
          textOverlay,
          narration,
          keyPoints,
        });
        console.log(`   ✓ Content generated`);
        if (layoutType === 'cards') {
          console.log(`   ✓ Cards: ${content.cards?.length || 0}`);
        }

        // Step 4: Render template
        console.log('\n4️⃣ Rendering template...');
        const renderResult = templateRenderer.renderSafe(
          layoutType,
          content,
          parameters.colors, // Pass colors array directly
          viewMode,
          {
            style: parameters.style,
            card: parameters.card,
            background: parameters.background
          }
        );

        if (!renderResult.success) {
          throw new Error(`Rendering failed: ${renderResult.error}`);
        }

        console.log(`   ✓ Template rendered successfully`);
        if (renderResult.fallback) {
          console.warn(`   ⚠️ Fallback to ${renderResult.layoutType} used`);
        }

        // Prepare final output
        const processingTime = Date.now() - startTime;
        const output = {
          data: {
            title: content.title,
            subtitle: content.subtitle,
            description: content.description,
            type: layoutType,
            style: parameters.style,
            colors: parameters.colors,
            card: parameters.card,
            background: parameters.background,
            viewMode,
            // Include actual content based on layout type
            ...(content.items && { items: content.items }),
            ...(content.cards && { cards: content.cards }),
            ...(content.timeline && { timeline: content.timeline }),
            ...(content.sections && { sections: content.sections }),
            ...(content.data && { chartData: content.data }),
            ...(content.root && { root: content.root }),
          },
          html: renderResult.html,
          meta: {
            generatedAt: new Date().toISOString(),
            processingTime: `${(processingTime / 1000).toFixed(2)}s`,
            attempt,
            prompt,
            layoutType,
            layoutAnalysis,
            cardType: parameters.card,
            backgroundType: parameters.background,
            parameters,
            rendered: true,
            colorScheme: options.colorScheme || 'auto-detected',
          },
        };

        console.log(`\n✅ Infographic generated successfully!`);
        console.log(`⏱️  Total time: ${output.meta.processingTime}`);
        console.log(`📐 Layout: ${layoutType} | View: ${viewMode}\n`);

        return output;
      } catch (error) {
        console.error(
          `\n❌ Attempt ${attempt}/${this.retries} failed: ${error.message}`
        );

        if (attempt === this.retries) {
          console.error(`\n❌ All attempts exhausted`);
          throw new Error(
            `Failed to generate infographic after ${this.retries} attempts: ${error.message}`
          );
        }

        // Progressive delay between retries
        const delay = attempt * 2000 + Math.random() * 1000;
        console.log(`⏳ Retrying in ${(delay / 1000).toFixed(1)}s...\n`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Generate multiple infographics (e.g., different view modes)
   * @param {string} prompt
   * @param {string[]} viewModes
   * @returns {Promise<object>} { landscape, portrait, ... }
   */
  async generateMultiView(prompt, viewModes = ['landscape', 'portrait']) {
    console.log(`\n📊 Generating multi-view infographics for: "${prompt.substring(0, 40)}..."\n`);

    const results = {};

    for (const viewMode of viewModes) {
      try {
        const result = await this.generateInfographic(prompt, viewMode);
        results[viewMode] = result;
      } catch (error) {
        console.error(`Failed to generate ${viewMode} view:`, error.message);
        results[viewMode] = {
          error: error.message,
          success: false,
        };
      }
    }

    return results;
  }

  /**
   * Get available layouts and their details
   */
  getAvailableLayouts() {
    return layoutAnalyzer.getAvailableLayouts();
  }

  /**
   * Get available templates
   */
  getAvailableTemplates() {
    return templateRenderer.getAvailableTemplates();
  }
}

module.exports = new DynamicInfographicServiceV2();
