#!/usr/bin/env node

/**
 * Quick Start Guide - Infographic Template System V2
 * 
 * This file demonstrates how to use the new template-based system
 * and shows the differences from the old system
 */

// ============================================
// USAGE EXAMPLES
// ============================================

/**
 * Example 1: Generate a single infographic
 */
async function example1_SingleInfographic() {
  const infographicService = require('./index');

  const result = await infographicService.generateInfographic(
    'Quantum Computing: Understanding Superposition and Entanglement',
    'landscape'
  );

  console.log('Data:', result.data);
  console.log('HTML:', result.html);
  console.log('Meta:', result.meta);

  // Save to file if needed
  const fs = require('fs');
  fs.writeFileSync('output.html', result.html);
}

/**
 * Example 2: Generate multiple view modes
 */
async function example2_MultiView() {
  const infographicService = require('./index');

  const results = await infographicService.generateMultiView(
    'How Machine Learning Works',
    ['landscape', 'portrait']
  );

  // Save landscape
  const fs = require('fs');
  fs.writeFileSync('output-landscape.html', results.landscape.html);
  fs.writeFileSync('output-portrait.html', results.portrait.html);

  console.log('Generated both landscape and portrait versions');
}

/**
 * Example 3: Generate multiple topics with different layouts
 */
async function example3_MultiTopics() {
  const infographicService = require('./index');

  const topics = [
    'Quantum Computing Fundamentals',
    'History of the Internet 1960-2024',
    'React vs Vue vs Angular',
    'DNA Structure and Function',
    'Top 5 Programming Languages',
    'Product Development Timeline',
  ];

  for (const topic of topics) {
    try {
      const result = await infographicService.generateInfographic(topic);
      console.log(`✅ ${topic}`);
      console.log(`   Layout: ${result.meta.layoutType}`);
      console.log(`   Time: ${result.meta.processingTime}`);
      console.log(`   HTML: ${result.html.length} chars\n`);
    } catch (error) {
      console.error(`❌ ${topic}: ${error.message}\n`);
    }
  }
}

/**
 * Example 4: Use in Express route
 */
function example4_ExpressIntegration() {
  const express = require('express');
  const infographicService = require('./index');

  const router = express.Router();

  router.post('/api/infographics/generate', async (req, res) => {
    try {
      const { prompt, viewMode = 'landscape' } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const result = await infographicService.generateInfographic(
        prompt,
        viewMode
      );

      res.json({
        success: true,
        data: result.data,
        html: result.html,
        meta: result.meta,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  router.get('/api/infographics/layouts', (req, res) => {
    const layouts = infographicService.getAvailableLayouts();
    res.json({ layouts });
  });

  return router;
}

/**
 * Example 5: Custom error handling
 */
async function example5_ErrorHandling() {
  const infographicService = require('./index');

  try {
    const result = await infographicService.generateInfographic(
      'A very complex and difficult topic that might fail'
    );

    console.log('Success:', result.data);
  } catch (error) {
    console.error('Generation failed:', error.message);

    // Fallback: Use a simpler topic
    console.log('Retrying with simpler topic...');
    const fallbackResult = await infographicService.generateInfographic(
      'Basic concept overview'
    );
    console.log('Fallback succeeded:', fallbackResult.data);
  }
}

// ============================================
// COMPARISON: OLD vs NEW SYSTEM
// ============================================

/**
 * OLD SYSTEM (v1) - Full HTML Generation
 * 
 * Issues:
 * ❌ Overflow problems on difficult topics
 * ❌ Poor quality on complex content
 * ❌ Needed to fix HTML post-processing
 * ❌ 100+ template snippets to maintain
 * ❌ Slow (had to generate all CSS + HTML)
 * ❌ Inconsistent visual quality
 * 
 * Flow:
 * Prompt → Select Style/Colors → Generate Full HTML → Try to Fix → Hope it works
 */

/**
 * NEW SYSTEM (v2) - Template-Based Content Injection
 * 
 * Benefits:
 * ✅ No overflow issues (CSS pre-tested)
 * ✅ Consistent quality (beautiful templates)
 * ✅ Works on ALL topics (layout adapts)
 * ✅ Only 7 templates to maintain
 * ✅ Fast (simple content generation)
 * ✅ Professional results guaranteed
 * 
 * Flow:
 * Prompt → Analyze Layout → Generate JSON → Render Template → Perfect HTML
 */

// ============================================
// CONFIGURATION & CUSTOMIZATION
// ============================================

/**
 * Available Layouts
 */
const LAYOUTS = {
  cards: 'Grid of concept cards (4-6 items)',
  timeline: 'Chronological sequence (4-6 items)',
  comparison: 'Side-by-side comparison (2-4 options)',
  hierarchy: 'Tree/organizational structure',
  chart: 'Data visualization (bar/line/pie)',
  list: 'Numbered/bullet list (4-6 items)',
  'rich-layout': 'Mixed content with hero section',
};

/**
 * Color Palette Guidelines
 */
const COLOR_GUIDELINES = {
  primary: 'Main brand color (headings)',
  secondary: 'Supporting color (text)',
  accent: 'Highlight color (icons, buttons)',
  background: 'Canvas background (white)',
  cardBg1: 'Card gradient start',
  cardBg2: 'Card gradient end',
};

/**
 * View Modes
 */
const VIEW_MODES = {
  landscape: '16:9 aspect ratio (max 1280px)',
  portrait: '9:16 aspect ratio (max 480px)',
};

// ============================================
// TESTING TOPICS
// ============================================

const TEST_TOPICS = {
  conceptual: [
    'Quantum Computing Fundamentals',
    'Theory of Relativity Explained',
    'How Photosynthesis Works',
  ],
  historical: [
    'History of the Internet',
    'Evolution of Computing',
    'Timeline of Space Exploration',
  ],
  comparative: [
    'React vs Vue vs Angular',
    'Python vs JavaScript vs Go',
    'iOS vs Android: Comparison',
  ],
  structured: [
    'Company Organization Chart',
    'File System Hierarchy',
    'DNA Structure and Components',
  ],
  data_driven: [
    'Top 10 Programming Languages 2024',
    'Global Technology Trends',
    'Market Share Analysis',
  ],
  instructional: [
    'How to Bake a Cake',
    'Steps to Launch a Startup',
    'Guide to Machine Learning',
  ],
};

// ============================================
// PERFORMANCE NOTES
// ============================================

/**
 * Typical Generation Times:
 * 
 * Layout Analysis:    0.5-1.0s (LLM call)
 * Parameter Gathering: 0.5-1.0s (LLM call)
 * Content Generation:  1.0-2.0s (LLM call)
 * Template Rendering:  <0.1s (local)
 * ─────────────────────────────
 * Total:              2.5-4.5s
 * 
 * Optimizations:
 * - Layout analysis can use keyword matching (instant) instead of LLM
 * - Parameters can be cached per style
 * - Templates are pre-compiled on startup
 * - Content generation is the longest step (depends on Gemini)
 */

// ============================================
// EXPORT FOR TESTING
// ============================================

module.exports = {
  examples: {
    example1_SingleInfographic,
    example2_MultiView,
    example3_MultiTopics,
    example4_ExpressIntegration,
    example5_ErrorHandling,
  },
  testTopics: TEST_TOPICS,
  layouts: LAYOUTS,
  viewModes: VIEW_MODES,
};

// ============================================
// RUN EXAMPLES
// ============================================

if (require.main === module) {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║     Infographic Template System V2 - Quick Start Guide         ║
╚════════════════════════════════════════════════════════════════╝

Available Examples:
  1. example1_SingleInfographic() - Generate one infographic
  2. example2_MultiView()         - Generate landscape + portrait
  3. example3_MultiTopics()       - Test multiple topics
  4. example4_ExpressIntegration()- Use in Express app
  5. example5_ErrorHandling()     - Handle errors gracefully

Available Layouts:
  ${Object.entries(LAYOUTS).map(([k, v]) => `  • ${k}: ${v}`).join('\n  ')}

Quick Usage:
  const service = require('./index');
  const result = await service.generateInfographic('Your topic', 'landscape');
  console.log(result.html);  // Ready to use!

Documentation:
  See README.md for full documentation

  `);
}
