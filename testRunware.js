// testRunware.js - Run this to test your Runware connection
require('dotenv').config();
const { generateImageWithRetry, testConnection } = require('./utils/runwareImageGen');

async function runTests() {
  console.log('='.repeat(60));
  console.log('🧪 RUNWARE API CONNECTION TEST');
  console.log('='.repeat(60));

  console.log('\n📋 Configuration:');
  console.log('API Key:', process.env.RUNWARE_API_KEY ? '✓ Found' : '❌ Missing');
  console.log('Key preview:', process.env.RUNWARE_API_KEY?.substring(0, 10) + '...');

  // Test 1: Simple connection test
  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: Basic Connection Test');
  console.log('='.repeat(60));
  await testConnection();

  // Test 2: Generate a simple image
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Simple Image Generation');
  console.log('='.repeat(60));

  try {
    const simplePrompt = "A beautiful sunset over mountains, vibrant colors, professional photography";
    console.log('Prompt:', simplePrompt);

    const imageUrl = await generateImageWithRetry(simplePrompt, {
      width: 1344,
      height: 768,
      steps: 20,
      model: "runware:100@1"
    }, 1);

    console.log('\n✅ SUCCESS! Image generated:');
    console.log('URL:', imageUrl);
    console.log('\nYou can open this URL in your browser to see the image.');
  } catch (error) {
    console.error('\n❌ FAILED:', error.message);
    console.error('Full error:', error);
  }

  // Test 3: Generate with presentation-style prompt
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: Presentation-Style Image');
  console.log('='.repeat(60));

  try {
    const presentationPrompt = `Professional business presentation visual in 16:9 aspect ratio.
    
Modern corporate office environment with:
- Clean, minimalist design
- Professional lighting
- Blue and white color palette
- NO text, letters, or words
- High quality, sharp focus

Style: Modern illustration
Mood: Professional and trustworthy`;

    console.log('Generating presentation-style image...');

    const presentationUrl = await generateImageWithRetry(presentationPrompt, {
      width: 1344,
      height: 768,
      steps: 25,
      CFGScale: 7,
      negativePrompt: "text, watermark, signature, letters, words, blurry, low quality",
      model: "runware:100@1"
    }, 1);

    console.log('\n✅ SUCCESS! Presentation image generated:');
    console.log('URL:', presentationUrl);
  } catch (error) {
    console.error('\n❌ FAILED:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 TESTS COMPLETED');
  console.log('='.repeat(60));
}

// Run tests
runTests().then(() => {
  console.log('\n✓ All tests finished. Exiting...');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});