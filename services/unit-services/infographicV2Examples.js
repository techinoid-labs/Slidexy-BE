/**
 * Quick Test Examples for Infographic V2 Service
 * 
 * Run this to test the new infographic generation service
 * 
 * Usage:
 * node services/unit-services/infographicV2Examples.js
 */

const infographicV2 = require('./generateInfographicV2Service');
const router = require('./infographicServiceRouter');

/**
 * Example 1: Simple infographic generation
 */
async function exampleSimpleGeneration() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║ Example 1: Simple Infographic Generation                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    const result = await infographicV2.generateInfographic(
      'The Water Cycle: How water moves through Earth\'s atmosphere and surface',
      'landscape'
    );

    console.log('\n✅ Success! Generated infographic with:');
    console.log(`   - Layout Type: ${result.meta.layoutType}`);
    console.log(`   - Processing Time: ${result.meta.processingTime}`);
    console.log(`   - HTML Length: ${result.html.length} characters`);
    console.log(`   - Title: ${result.data.title}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Example 2: Multi-view generation
 */
async function exampleMultiView() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║ Example 2: Multi-View Generation                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    const results = await infographicV2.generateMultiView(
      'Solar System and Planets',
      ['landscape', 'portrait']
    );

    console.log('\n✅ Generated multiple views:');
    for (const [viewMode, result] of Object.entries(results)) {
      if (result.error) {
        console.log(`   - ${viewMode}: ❌ Error - ${result.error}`);
      } else {
        console.log(`   - ${viewMode}: ✅ Generated (${result.meta.layoutType})`);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Example 3: Using the Service Router
 */
async function exampleServiceRouter() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║ Example 3: Using Service Router                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Check which service is active
    console.log(`Active Service: ${router.getActiveService()}`);

    // Get service comparison
    const comparison = router.getServicesComparison();
    console.log('\nAvailable Services:');
    console.log(JSON.stringify(comparison, null, 2));

    // Generate with V2 (default)
    console.log('\n\nGenerating with V2...');
    const resultV2 = await router.generateInfographic(
      'Introduction to Artificial Intelligence'
    );
    console.log(`✅ V2 Result: ${resultV2.meta.layoutType}`);

    // Switch to V1 and generate
    console.log('\nSwitching to V1...');
    router.useV1();
    const resultV1 = await router.generateInfographic(
      'Introduction to Artificial Intelligence'
    );
    console.log(`✅ V1 Result: ${resultV1.meta ? resultV1.meta.layoutType : 'Generated'}`);

    // Switch back to V2
    router.useV2();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Example 4: Getting Service Information
 */
async function exampleServiceInfo() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║ Example 4: Service Information                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const info = infographicV2.getServiceInfo();
  console.log('Service Info:');
  console.log(JSON.stringify(info, null, 2));

  console.log('\n\nAvailable Layouts:');
  const layouts = infographicV2.getAvailableLayouts();
  console.log(JSON.stringify(layouts, null, 2));

  console.log('\n\nAvailable Templates:');
  const templates = infographicV2.getAvailableTemplates();
  console.log(JSON.stringify(templates, null, 2));
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('\n');
  console.log('████████████████████████████████████████████████████████████');
  console.log('█                                                            █');
  console.log('█  Infographic V2 Service - Examples & Tests               █');
  console.log('█                                                            █');
  console.log('████████████████████████████████████████████████████████████');

  // Example 4 first (doesn't need API)
  await exampleServiceInfo();

  // Then examples that need API (comment out if no API key)
  try {
    // await exampleSimpleGeneration();
    // await exampleMultiView();
    // await exampleServiceRouter();

    console.log('\n\n💡 Note: API examples are commented out.');
    console.log('   Uncomment to test with actual generation.');
  } catch (error) {
    console.error('Error running examples:', error);
  }

  console.log('\n\n✨ Examples complete!\n');
}

// Export for use in other files
module.exports = {
  exampleSimpleGeneration,
  exampleMultiView,
  exampleServiceRouter,
  exampleServiceInfo,
  runAllExamples,
};

// Run examples if called directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
