/**
 * Test script to debug chart generation
 * Run this with: node test-chart-generation.js
 */

require('dotenv').config();
const { generateChartForSlide } = require('./services/chartGenerator');

async function testChartGeneration() {
  console.log('🧪 Testing Chart Generation\n');

  // Test slide with data
  const testSlide = {
    slide_id: 'test-slide-123',
    layout_type: 'data-visual-chart',
    slide_title: { text: 'Quarterly Revenue Growth' },
    elements: [
      { element_type: 'bullet_point', text: 'Q1: Revenue increased by 45%' },
      { element_type: 'bullet_point', text: 'Q2: Revenue increased by 67%' },
      { element_type: 'bullet_point', text: 'Q3: Revenue increased by 89%' }
    ],
    chart: {
      enabled: true,
      chartType: 'bar'
    },
    visual_type: 'chart'
  };

  const rawText = 'Our company experienced explosive growth in Q1, Q2, and Q3 with revenue increasing 45%, 67%, and 89% respectively.';

  console.log('📊 Test Slide:', JSON.stringify(testSlide, null, 2));
  console.log('\n🔄 Generating chart...\n');

  try {
    const result = await generateChartForSlide(testSlide, rawText);
    
    console.log('\n✅ Chart Generation Result:');
    console.log('─────────────────────────────────────');
    console.log('Needs Chart:', result.needsChart);
    console.log('Chart Type:', result.chartType);
    console.log('Chart Title:', result.chartTitle);
    console.log('Labels:', result.chartData?.labels);
    console.log('Data:', result.chartData?.data);
    console.log('Image URL:', result.image_url);
    console.log('Reasoning:', result.reasoning);
    console.log('─────────────────────────────────────');
    
    if (result.image_url) {
      console.log('\n🎉 SUCCESS! Chart generated and uploaded to S3');
      console.log('🔗 Chart URL:', result.image_url);
      
      // Test if URL is accessible
      const axios = require('axios');
      try {
        const response = await axios.head(result.image_url, { timeout: 5000 });
        console.log('✅ Chart URL is accessible (Status:', response.status, ')');
      } catch (urlErr) {
        console.log('⚠️ Chart URL not immediately accessible:', urlErr.message);
      }
    } else {
      console.log('\n❌ FAILED: No chart URL generated');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Test S3 connection
async function testS3Upload() {
  console.log('\n📦 Testing S3 Upload Connection...\n');
  
  const { uploadBufferToSpaces } = require('./utils/s3Uploader');
  
  try {
    const testBuffer = Buffer.from('test chart data');
    const testUrl = await uploadBufferToSpaces(testBuffer, 'test-chart.png', 'image/png');
    console.log('✅ S3 Upload works! Test URL:', testUrl);
  } catch (err) {
    console.error('❌ S3 Upload failed:', err.message);
    console.error('Check your .env file:');
    console.error('  - DO_SPACES_ENDPOINT');
    console.error('  - DO_SPACES_KEY');
    console.error('  - DO_SPACES_SECRET');
    console.error('  - DO_SPACES_BUCKET');
    console.error('  - DO_SPACES_URL');
  }
}

// Run tests
(async () => {
  await testS3Upload();
  await testChartGeneration();
  process.exit(0);
})();