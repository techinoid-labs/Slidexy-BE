const generator = require('./index');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

(async () => {
  console.log('🎨 Testing All Templates...\n');
  
  const testCases = [
    {
      name: 'Cards Template',
      prompt: 'Programming Language Features 💻',
      viewMode: 'portrait',
      outputFile: 'test-cards-template.html'
    },
    {
      name: 'Timeline Template',
      prompt: 'History of Internet Development 📡',
      viewMode: 'landscape',
      outputFile: 'test-timeline-template.html'
    },
    {
      name: 'Comparison Template',
      prompt: 'iPhone vs Android Comparison 📱',
      viewMode: 'landscape',
      outputFile: 'test-comparison-template.html'
    },
    {
      name: 'Process Flow Template',
      prompt: 'Steps to Build a Website 🌐',
      viewMode: 'landscape',
      outputFile: 'test-process-flow-template.html'
    },
    {
      name: 'Chart Template',
      prompt: 'Market Share Statistics 📊',
      viewMode: 'landscape',
      outputFile: 'test-chart-template.html'
    },
    {
      name: 'List Template',
      prompt: 'Top 10 Programming Languages 🚀',
      viewMode: 'portrait',
      outputFile: 'test-list-template.html'
    }
  ];

  let successCount = 0;
  let failureCount = 0;

  for (const testCase of testCases) {
    try {
      console.log(`═══ Testing: ${testCase.name} ═══\n`);
      
      const result = await generator.generateInfographic(
        testCase.prompt,
        testCase.viewMode
      );
      
      const outputPath = path.join(__dirname, 'generated-infographics', testCase.outputFile);
      fs.writeFileSync(outputPath, result.html);
      
      console.log(`✅ ${testCase.name} Generated!`);
      console.log(`📊 Title: ${result.data.title}`);
      console.log(`🎨 Style: ${result.data.style}`);
      console.log(`📐 Layout: ${result.data.layout}`);
      console.log(`📱 View Mode: ${testCase.viewMode}`);
      console.log(`💾 Saved to: ${outputPath}`);
      console.log(`⏱️  Time: ${result.meta?.duration || 'N/A'}s\n`);
      
      successCount++;
    } catch (error) {
      console.error(`❌ ${testCase.name} Failed:`);
      console.error(`   Error: ${error.message}\n`);
      failureCount++;
    }
  }

  console.log('═══ Test Summary ═══');
  console.log(`✅ Passed: ${successCount}/${testCases.length}`);
  console.log(`❌ Failed: ${failureCount}/${testCases.length}`);
  
  if (failureCount === 0) {
    console.log('\n🎉 All templates tested successfully!');
    console.log('🌐 Opening first test in browser...');
    const firstOutput = path.join(__dirname, 'generated-infographics', testCases[0].outputFile);
    exec(`open "${firstOutput}"`);
  } else {
    console.log('\n⚠️  Some templates failed. Check errors above.');
    process.exit(1);
  }
})();
