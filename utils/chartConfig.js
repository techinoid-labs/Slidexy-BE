/**
 * Chart generation configuration
 * Modify these settings to customize chart appearance and behavior
 */

module.exports = {
  // QuickChart API settings
  quickChart: {
    baseUrl: 'https://quickchart.io/chart',
    width: 1920, // Match your slide dimensions
    height: 1080,
    backgroundColor: 'white',
    devicePixelRatio: 2, // High DPI for crisp charts
  },

  // Chart.js default options
  defaultOptions: {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      title: {
        display: true,
        font: { size: 24, weight: 'bold', family: 'Arial, sans-serif' },
        color: '#2c3e50',
        padding: { top: 10, bottom: 20 }
      },
      legend: {
        display: true,
        position: 'bottom',
        labels: { 
          font: { size: 16, family: 'Arial, sans-serif' },
          color: '#2c3e50',
          padding: 15
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 14 },
        bodyFont: { size: 12 }
      }
    }
  },

  // Color palettes for different themes
  colorPalettes: {
    professional: {
      primary: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'],
      gradient: ['rgba(102, 126, 234, 0.8)', 'rgba(118, 75, 162, 0.8)']
    },
    modern: {
      primary: ['#6c5ce7', '#00b894', '#fdcb6e', '#e17055', '#74b9ff'],
      gradient: ['rgba(108, 92, 231, 0.8)', 'rgba(0, 184, 148, 0.8)']
    },
    vibrant: {
      primary: ['#ff006e', '#8338ec', '#3a86ff', '#fb5607', '#ffbe0b'],
      gradient: ['rgba(255, 0, 110, 0.8)', 'rgba(131, 56, 236, 0.8)']
    },
    corporate: {
      primary: ['#264653', '#2a9d8f', '#e76f51', '#f4a261', '#e9c46a'],
      gradient: ['rgba(38, 70, 83, 0.8)', 'rgba(42, 157, 143, 0.8)']
    },
    tech: {
      primary: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#38f9d7'],
      gradient: ['rgba(102, 126, 234, 0.8)', 'rgba(118, 75, 162, 0.8)']
    }
  },

  // Chart type specific configurations
  chartTypes: {
    bar: {
      borderWidth: 2,
      borderRadius: 8,
      maxBarThickness: 80
    },
    line: {
      borderWidth: 3,
      tension: 0.4, // Smooth curves
      fill: false,
      pointRadius: 5,
      pointHoverRadius: 7
    },
    pie: {
      borderWidth: 2,
      hoverOffset: 10
    },
    doughnut: {
      borderWidth: 2,
      cutout: '60%', // Hole size
      hoverOffset: 10
    },
    radar: {
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6
    },
    polarArea: {
      borderWidth: 2
    }
  },

  // Chart detection keywords
  chartDetectionKeywords: {
    bar: ['compare', 'comparison', 'versus', 'vs', 'categories', 'breakdown'],
    line: ['trend', 'growth', 'over time', 'timeline', 'progression', 'forecast'],
    pie: ['distribution', 'percentage', 'share', 'proportion', 'split'],
    doughnut: ['composition', 'makeup', 'breakdown', 'allocation'],
    radar: ['performance', 'metrics', 'scorecard', 'evaluation', 'dimensions'],
    polarArea: ['radial', 'circular', 'relative', 'magnitude']
  },

  // Fallback settings
  fallback: {
    enabled: true,
    useUnsplash: false, // Set to true if you have Unsplash API
    placeholderColor: '#6c5ce7'
  },

  // Chart generation limits
  limits: {
    maxDataPoints: 12, // Maximum data points per chart
    minDataPoints: 2,  // Minimum data points per chart
    maxRetries: 2,     // Retry attempts for failed generations
    timeout: 10000     // Timeout for chart generation (ms)
  }
};