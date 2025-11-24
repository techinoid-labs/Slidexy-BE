const generator = require('./index');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

(async () => {
  console.log('🎨 Testing Cards Template...\n');
  
  try {
    // Test 1: 4 cards
    console.log('═══ Test 1: 4-Card Layout ═══\n');
    const result1 = await generator.generateInfographic(
      'Programming Language Features and Benefits 💻',
      'portrait'
    );
    
    const outputPath1 = path.join(__dirname, 'generated-infographics', 'test-cards-4.html');
    fs.writeFileSync(outputPath1, result1.html);
    
    console.log('✅ 4-Card Layout Generated!');
    console.log('📊 Title:', result1.data.title);
    console.log('🎨 Style:', result1.data.style);
    console.log('📋 Total Items:', result1.data.items ? result1.data.items.length : 'N/A');
    console.log('💾 Saved to:', outputPath1, '\n');

    // Test 2: Different topic for cards
    console.log('═══ Test 2: 5-Card Layout ═══\n');
    const result2 = await generator.generateInfographic(
      'Social Media Platforms 📱',
      'landscape'
    );
    
    const outputPath2 = path.join(__dirname, 'generated-infographics', 'test-cards-5.html');
    fs.writeFileSync(outputPath2, result2.html);
    
    console.log('✅ 5-Card Layout Generated!');
    console.log('📊 Title:', result2.data.title);
    console.log('🎨 Style:', result2.data.style);
    console.log('📋 Total Items:', result2.data.items ? result2.data.items.length : 'N/A');
    console.log('💾 Saved to:', outputPath2, '\n');

    console.log('✨ All cards tests completed successfully!');
    
    // Open in browser
    console.log('🌐 Opening landscape version in browser...');
    exec(`open "${outputPath2}"`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
