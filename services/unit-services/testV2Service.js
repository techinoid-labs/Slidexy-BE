/**
 * Quick test of V2 Infographic Service
 */

const infographicV2 = require('./generateInfographicV2Service');

async function testV2Service() {
  console.log('\n🧪 Testing V2 Infographic Service...\n');

  try {
    // Test 1: Simple generation
    console.log('✅ Test 1: Simple Infographic Generation');
    console.log('─'.repeat(50));
    
    const result = await infographicV2.generateInfographic(
      'The Carbon Cycle: How carbon moves through Earth',
      'landscape'
    );

    console.log('\n✨ SUCCESS! Generated infographic:');
    console.log(`   Layout Type: ${result.meta.layoutType}`);
    console.log(`   Processing Time: ${result.meta.processingTime}`);
    console.log(`   Title: ${result.data.title}`);
    console.log(`   HTML Length: ${result.html.length} characters`);
    console.log(`   View Mode: ${result.data.viewMode}`);
    
    if (result.data.cards) {
      console.log(`   Cards Count: ${result.data.cards.length}`);
    }
    if (result.data.items) {
      console.log(`   Items Count: ${result.data.items.length}`);
    }
    if (result.data.timeline) {
      console.log(`   Timeline Events: ${result.data.timeline.length}`);
    }

    console.log('\n📝 Sample HTML (first 500 chars):');
    console.log(result.html.substring(0, 500) + '...\n');

    console.log('✅ Test 1: PASSED\n');

  } catch (error) {
    console.error('\n❌ Test FAILED:');
    console.error(`Error: ${error.message}\n`);
    process.exit(1);
  }
}

testV2Service();
