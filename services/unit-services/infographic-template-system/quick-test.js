const generator = require('./index');

(async () => {
  console.log('🧪 Testing List Template with Fixes...\n');
  
  try {
    const result = await generator.generateInfographic(
      'Top 5 Benefits of Regular Exercise 💪',
      'landscape'
    );
    
    console.log('✅ SUCCESS! Generated infographic');
    console.log('📊 Title:', result.data.title);
    console.log('📝 Description:', result.data.description || result.data.subtitle || 'N/A');
    console.log('📋 Items:', result.data.items?.length || 0);
    
    if (result.data.items?.length > 0) {
      console.log('\n🔍 First item check:');
      console.log('   - Has title:', !!result.data.items[0].title);
      console.log('   - Title value:', result.data.items[0].title || 'MISSING ❌');
      console.log('   - Has description:', !!result.data.items[0].description);
      console.log('   - Has icon:', !!result.data.items[0].icon);
    }
    
    console.log('\n✨ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
})();
