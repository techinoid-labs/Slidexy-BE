const axios = require('axios');
const { textGenModel } = require('../utils/geminiModels');
const { uploadBufferToSpaces } = require('../utils/s3Uploader');

/**
 * Generates chart configuration and image URL based on slide content
 * Uploads chart to your S3/DigitalOcean Spaces
 */
async function generateChartForSlide(slide, rawText = '') {
  try {
    const slideTitle = slide.slide_title?.text || 'Data Visualization';
    const slideContent = slide.elements?.map(e => e.text).join(' ') || '';
    
    console.log(`🔍 Analyzing slide for chart: "${slideTitle}"`);
    
    // Use AI to determine if slide needs a chart and what type
    const chartAnalysisPrompt = `
Analyze this slide content and determine if it would benefit from a data visualization chart.

SLIDE TITLE: "${slideTitle}"
SLIDE CONTENT: "${slideContent}"
CONTEXT: ${rawText.slice(0, 500)}

Determine:
1. Should this slide have a chart? (yes/no)
2. If yes, what type: bar, line, pie, doughnut, radar, or polarArea
3. Generate realistic sample data (3-6 data points)
4. Provide chart title and labels

Return ONLY valid JSON:
{
  "needsChart": true/false,
  "chartType": "bar|line|pie|doughnut|radar|polarArea",
  "chartTitle": "Chart title",
  "labels": ["Label 1", "Label 2", "Label 3"],
  "data": [45, 67, 23],
  "dataLabel": "Dataset name",
  "reasoning": "Why this visualization fits"
}`;

    const aiResult = await textGenModel.generateContent(chartAnalysisPrompt);
    const aiResponse = aiResult.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse AI response
    const cleaned = aiResponse.replace(/```json|```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('❌ No chart needed for this slide');
      return { needsChart: false };
    }
    
    const chartConfig = JSON.parse(jsonMatch[0]);
    
    if (!chartConfig.needsChart) {
      console.log('❌ AI decided no chart needed');
      return { needsChart: false };
    }

    console.log(`📊 Generating ${chartConfig.chartType} chart: "${chartConfig.chartTitle}"`);

    // Generate chart image and upload to S3
    const s3Url = await generateAndUploadChart(chartConfig);
    
    console.log(`✅ Chart uploaded to S3: ${s3Url}`);
    
    return {
      needsChart: true,
      chartType: chartConfig.chartType,
      chartTitle: chartConfig.chartTitle,
      image_url: s3Url, // S3 URL for the chart
      chartData: {
        labels: chartConfig.labels,
        data: chartConfig.data,
        dataLabel: chartConfig.dataLabel
      },
      reasoning: chartConfig.reasoning
    };

  } catch (error) {
    console.error('❌ Chart generation failed:', error.message);
    return { needsChart: false, error: error.message };
  }
}

/**
 * Generates chart using QuickChart and uploads to S3
 */
async function generateAndUploadChart(config) {
  const { chartType, chartTitle, labels, data, dataLabel } = config;
  
  // Color schemes for different chart types
  const colorPalettes = {
    bar: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'],
    line: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'],
    pie: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#38f9d7'],
    doughnut: ['#6c5ce7', '#00b894', '#fdcb6e', '#e17055', '#74b9ff'],
    radar: ['rgba(102, 126, 234, 0.6)'],
    polarArea: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b']
  };

  const backgroundColor = colorPalettes[chartType] || colorPalettes.bar;
  const borderColor = backgroundColor.map(color => 
    color.replace('0.6', '1').replace('rgba', 'rgb').replace(/, 0\.\d+\)/, ')')
  );

  // Build Chart.js configuration
  const chartJsConfig = {
    type: chartType,
    data: {
      labels: labels,
      datasets: [{
        label: dataLabel || 'Data',
        data: data,
        backgroundColor: backgroundColor,
        borderColor: borderColor[0] || '#667eea',
        borderWidth: 2,
        fill: chartType === 'line' ? false : true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        title: {
          display: true,
          text: chartTitle,
          font: { size: 28, weight: 'bold', family: 'Inter, Arial, sans-serif' },
          color: '#2c3e50',
          padding: { top: 20, bottom: 30 }
        },
        legend: {
          display: chartType !== 'pie' && chartType !== 'doughnut',
          position: 'bottom',
          labels: { 
            font: { size: 16, family: 'Inter, Arial, sans-serif' }, 
            color: '#2c3e50',
            padding: 20
          }
        }
      },
      scales: (chartType === 'pie' || chartType === 'doughnut' || chartType === 'radar' || chartType === 'polarArea') ? undefined : {
        y: {
          beginAtZero: true,
          ticks: { 
            color: '#2c3e50', 
            font: { size: 14 } 
          },
          grid: { color: 'rgba(0, 0, 0, 0.1)' }
        },
        x: {
          ticks: { 
            color: '#2c3e50', 
            font: { size: 14 } 
          },
          grid: { color: 'rgba(0, 0, 0, 0.1)' }
        }
      }
    }
  };

  // Step 1: Generate chart using QuickChart API
  const quickChartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartJsConfig))}&width=1920&height=1080&backgroundColor=white&devicePixelRatio=2&format=png`;
  
  console.log(`📡 Fetching chart from QuickChart...`);
  
  try {
    // Step 2: Download the chart image as buffer
    const response = await axios.get(quickChartUrl, {
      responseType: 'arraybuffer',
      timeout: 15000
    });
    
    if (response.status !== 200) {
      throw new Error(`QuickChart returned status ${response.status}`);
    }
    
    console.log(`✅ Chart downloaded (${response.data.length} bytes)`);
    
    // Step 3: Upload to your S3/DigitalOcean Spaces
    const filename = `chart_${chartType}_${Date.now()}.png`;
    const s3Url = await uploadBufferToSpaces(
      Buffer.from(response.data),
      filename,
      'image/png'
    );
    
    console.log(`✅ Chart uploaded to S3: ${s3Url}`);
    
    return s3Url;
    
  } catch (error) {
    console.error('❌ Chart generation/upload failed:', error.message);
    
    // Fallback: return QuickChart URL directly (not uploaded to S3)
    console.log('⚠️ Using QuickChart direct URL as fallback');
    return quickChartUrl;
  }
}

/**
 * Alternative: Simple QuickChart URL (no S3 upload)
 * Use this if you want faster generation without S3 storage
 */
function generateQuickChartUrl(config) {
  const { chartType, chartTitle, labels, data, dataLabel } = config;
  
  const simpleConfig = {
    type: chartType,
    data: {
      labels: labels,
      datasets: [{
        label: dataLabel,
        data: data,
        backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b']
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: chartTitle }
      }
    }
  };
  
  return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(simpleConfig))}&width=1920&height=1080`;
}

module.exports = {
  generateChartForSlide,
  generateAndUploadChart,
  generateQuickChartUrl
};