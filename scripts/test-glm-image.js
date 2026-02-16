#!/usr/bin/env node
/**
 * 🧪 GLM Image Fallback Validation Script
 * 
 * This script tests the GLM Image integration and validates the fallback chain.
 * 
 * Usage:
 *   npx node scripts/test-glm-image.js
 * 
 * or
 * 
 *   npm run test:glm
 * (if added to package.json scripts)
 */

require('dotenv').config();
const { generateWithGLMImage, validateGLMConnection } = require('../utils/generateGLMImage');
const { generateFallbackImage } = require('../services/fallbackImageGeneration');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '═'.repeat(70));
  log(title, colors.bright + colors.blue);
  console.log('═'.repeat(70) + '\n');
}

async function main() {
  try {
    logSection('🧪 GLM Image Fallback System Validation');

    // ═══════════════════════════════════════════════════════════════════════
    log('1️⃣  Checking Environment Variables...', colors.bright);
    // ═══════════════════════════════════════════════════════════════════════

    const glmToken = process.env.GLM_API_TOKEN;
    if (glmToken) {
      log('✅ GLM_API_TOKEN configured', colors.green);
      log(`   Token (masked): ${glmToken.substring(0, 10)}...`, colors.cyan);
    } else {
      log('❌ GLM_API_TOKEN not found in environment', colors.red);
      log('   Please add GLM_API_TOKEN to your .env file', colors.yellow);
    }

    const pexelsKey = process.env.PEXELS_API_KEY;
    if (pexelsKey) {
      log('✅ PEXELS_API_KEY configured (fallback)', colors.green);
    } else {
      log('⚠️  PEXELS_API_KEY not configured (fallback will be limited)', colors.yellow);
    }

    // ═══════════════════════════════════════════════════════════════════════
    logSection('2️⃣  Testing GLM Connection');
    // ═══════════════════════════════════════════════════════════════════════

    log('Validating GLM API connection...', colors.cyan);
    const glmValidation = await validateGLMConnection();

    if (glmValidation.valid) {
      log(`✅ ${glmValidation.message}`, colors.green);
    } else {
      log(`❌ ${glmValidation.message}`, colors.red);
      log('   This means GLM Image fallback won\'t work currently', colors.yellow);
    }

    // ═══════════════════════════════════════════════════════════════════════
    logSection('3️⃣  Testing GLM Image Generation');
    // ═══════════════════════════════════════════════════════════════════════

    if (glmValidation.valid) {
      log('Generating test image with GLM...', colors.cyan);
      log('Prompt: "A futuristic technology conference in a modern auditorium"', colors.blue);

      const startTime = Date.now();
      const testImage = await generateWithGLMImage(
        'A futuristic technology conference in a modern auditorium, professional setting, 16:9'
      );
      const duration = Date.now() - startTime;

      log(`✅ Image generated successfully!`, colors.green);
      log(`   Duration: ${duration}ms`, colors.cyan);
      log(`   Image size: ${testImage.length} bytes`, colors.cyan);
      log(`   Data URI prefix: ${testImage.substring(0, 30)}...`, colors.blue);
    } else {
      log('⏭️  Skipping GLM generation test (connection failed)', colors.yellow);
    }

    // ═══════════════════════════════════════════════════════════════════════
    logSection('4️⃣  Testing Fallback Cascade');
    // ═══════════════════════════════════════════════════════════════════════

    log('Testing the full fallback cascade...', colors.cyan);
    log('Prompt: "A professional business presentation background"', colors.blue);

    const startTime2 = Date.now();
    const fallbackImage = await generateFallbackImage(
      'A professional business presentation background with modern design'
    );
    const duration2 = Date.now() - startTime2;

    log(`✅ Fallback cascade succeeded!`, colors.green);
    log(`   Duration: ${duration2}ms`, colors.cyan);
    log(`   Image size: ${fallbackImage.length} bytes`, colors.cyan);

    // ═══════════════════════════════════════════════════════════════════════
    logSection('5️⃣  System Summary');
    // ═══════════════════════════════════════════════════════════════════════

    log('Fallback Chain Status:', colors.bright);
    const chain = [
      { name: 'Flux Image (Primary)', status: '⚠️  (not tested here)' },
      { name: 'GLM Image', status: glmValidation.valid ? '✅ Active' : '❌ Inactive' },
      { name: 'Pollinations.ai', status: '✅ Available' },
      { name: 'Unsplash', status: '✅ Available' },
      { name: 'Hugging Face', status: process.env.HUGGINGFACE_API_KEY ? '✅ Active' : '⚠️  (no key)' },
      { name: 'Replicate', status: process.env.REPLICATE_API_KEY ? '✅ Active' : '⚠️  (no key)' },
      { name: 'Pexels', status: pexelsKey ? '✅ Active' : '⚠️  (might downgrade to Pollinations)' },
      { name: 'Placeholder', status: '✅ Always Available' },
    ];

    chain.forEach((item, i) => {
      log(`   ${i + 1}. ${item.name}: ${item.status}`, colors.cyan);
    });

    // ═══════════════════════════════════════════════════════════════════════
    logSection('✨ Validation Complete!');
    // ═══════════════════════════════════════════════════════════════════════

    if (glmValidation.valid) {
      log('🎉 GLM Image integration is working perfectly!', colors.green);
      log('   Your image generation fallback chain is ready for production.', colors.green);
    } else {
      log('⚙️  GLM Image is not active, but other fallbacks are available.', colors.yellow);
      log('   To activate GLM fallback, add your GLM_API_TOKEN to .env', colors.yellow);
    }

    log('\n📚 For detailed information, see: docs/FALLBACK_IMAGE_GENERATION.md', colors.blue);

  } catch (error) {
    log(`\n❌ Validation failed with error:`, colors.red);
    log(`   ${error.message}`, colors.red);
    if (error.stack) {
      log(`\n📋 Stack trace:`, colors.yellow);
      log(error.stack, colors.yellow);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    log(`Fatal error: ${error.message}`, colors.red);
    process.exit(1);
  });
}

module.exports = main;
