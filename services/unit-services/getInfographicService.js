const { textGenModel } = require("../../utils/geminiModels");
const JSON5 = require("json5");

// Color schemes - fun and versatile combinations
const COLOR_SCHEMES = {
    // Vibrant & Energetic
    neonNights: {
        primary: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
        secondary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        accent: '#ff6b6b',
        text: '#ffffff',
        glass: 'rgba(255,255,255,0.15)',
        shadow: 'rgba(255, 8, 68, 0.3)',
        theme: 'vibrant'
    },
    oceanBreeze: {
        primary: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        secondary: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        accent: '#00d4ff',
        text: '#ffffff',
        glass: 'rgba(255,255,255,0.2)',
        shadow: 'rgba(79, 172, 254, 0.4)',
        theme: 'cool'
    },
    sunsetVibes: {
        primary: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        accent: '#ff6b9d',
        text: '#ffffff',
        glass: 'rgba(255,255,255,0.18)',
        shadow: 'rgba(250, 112, 154, 0.35)',
        theme: 'warm'
    },
    purpleMagic: {
        primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        secondary: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        accent: '#8b5cf6',
        text: '#ffffff',
        glass: 'rgba(255,255,255,0.16)',
        shadow: 'rgba(139, 92, 246, 0.4)',
        theme: 'mystical'
    },
    
    // Nature & Earth Tones
    forestMist: {
        primary: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
        secondary: 'linear-gradient(135deg, #2c5364 0%, #203a43 0%, #0c2628 100%)',
        accent: '#4ade80',
        text: '#ffffff',
        glass: 'rgba(255,255,255,0.12)',
        shadow: 'rgba(19, 78, 94, 0.3)',
        theme: 'nature'
    },
    autumnGlow: {
        primary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        secondary: 'linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%)',
        accent: '#ff8c42',
        text: '#ffffff',
        glass: 'rgba(255,255,255,0.15)',
        shadow: 'rgba(255, 140, 66, 0.35)',
        theme: 'warm'
    },
    
    // Cosmic & Space
    cosmicDream: {
        primary: 'linear-gradient(135deg, #667db6 0%, #0082c8 100%)',
        secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        accent: '#f59e0b',
        text: '#ffffff',
        glass: 'rgba(255,255,255,0.14)',
        shadow: 'rgba(102, 125, 182, 0.4)',
        theme: 'cosmic'
    },
    galaxyExplorer: {
        primary: 'linear-gradient(135deg, #2d1b69 0%, #11998e 100%)',
        secondary: 'linear-gradient(135deg, #8360c3 0%, #2ebf91 100%)',
        accent: '#f093fb',
        text: '#ffffff',
        glass: 'rgba(255,255,255,0.13)',
        shadow: 'rgba(45, 27, 105, 0.45)',
        theme: 'cosmic'
    },
    
    // Monochrome & Minimal
    mintChocolate: {
        primary: 'linear-gradient(135deg, #2bc0e4 0%, #eaecc6 100%)',
        secondary: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
        accent: '#06b6d4',
        text: '#ffffff',
        glass: 'rgba(255,255,255,0.17)',
        shadow: 'rgba(43, 192, 228, 0.3)',
        theme: 'minimal'
    },
    darkElegance: {
        primary: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
        secondary: 'linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)',
        accent: '#64ffda',
        text: '#ffffff',
        glass: 'rgba(255,255,255,0.1)',
        shadow: 'rgba(100, 255, 218, 0.25)',
        theme: 'dark'
    },
    
    // Luxury & Premium
    lavaFlow: {
        primary: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        secondary: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
        accent: '#ef4444',
        text: '#ffffff',
        glass: 'rgba(255,255,255,0.19)',
        shadow: 'rgba(239, 68, 68, 0.4)',
        theme: 'luxury'
    },
    goldRush: {
        primary: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
        secondary: 'linear-gradient(135deg, #c79081 0%, #dfa579 100%)',
        accent: '#fbbf24',
        text: '#1a1a1a',
        glass: 'rgba(0,0,0,0.08)',
        shadow: 'rgba(247, 151, 30, 0.4)',
        theme: 'luxury'
    },
    
    // Pastel & Soft
    cottonCandy: {
        primary: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        secondary: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
        accent: '#f472b6',
        text: '#4a5568',
        glass: 'rgba(255,255,255,0.25)',
        shadow: 'rgba(244, 114, 182, 0.2)',
        theme: 'pastel'
    },
    lavenderFields: {
        primary: 'linear-gradient(135deg, #e0aaff 0%, #c77dff 100%)',
        secondary: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        accent: '#9c88ff',
        text: '#495057',
        glass: 'rgba(255,255,255,0.2)',
        shadow: 'rgba(156, 136, 255, 0.25)',
        theme: 'pastel'
    },
    
    // High Contrast & Bold
    electricBlue: {
        primary: 'linear-gradient(135deg, #0f0c29 0%, #24243e 100%)',
        secondary: 'linear-gradient(135deg, #302b63 0%, #0f0c29 100%)',
        accent: '#00d4ff',
        text: '#ffffff',
        glass: 'rgba(255,255,255,0.12)',
        shadow: 'rgba(0, 212, 255, 0.5)',
        theme: 'electric'
    },
    fireAndIce: {
        primary: 'linear-gradient(135deg, #ff4757 0%, #3742fa 100%)',
        secondary: 'linear-gradient(135deg, #70a1ff 0%, #7bed9f 100%)',
        accent: '#fffa65',
        text: '#ffffff',
        glass: 'rgba(255,255,255,0.16)',
        shadow: 'rgba(255, 71, 87, 0.4)',
        theme: 'bold'
    },
    
    // New Unique Schemes
    cyberpunk: {
        primary: 'linear-gradient(135deg, #0a0a0a 0%, #1a0033 100%)',
        secondary: 'linear-gradient(135deg, #ff0080 0%, #7928ca 100%)',
        accent: '#00ff88',
        text: '#ffffff',
        glass: 'rgba(0,255,136,0.1)',
        shadow: 'rgba(0, 255, 136, 0.3)',
        theme: 'cyberpunk'
    },
    sakuraBloom: {
        primary: 'linear-gradient(135deg, #ffb7d5 0%, #c9ffbf 100%)',
        secondary: 'linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%)',
        accent: '#ff6b9d',
        text: '#2d3748',
        glass: 'rgba(255,255,255,0.3)',
        shadow: 'rgba(255, 107, 157, 0.25)',
        theme: 'zen'
    },
    arcticAurora: {
        primary: 'linear-gradient(135deg, #667db6 0%, #0082c8 100%)',
        secondary: 'linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)',
        accent: '#64ffda',
        text: '#ffffff',
        glass: 'rgba(255,255,255,0.15)',
        shadow: 'rgba(100, 255, 218, 0.35)',
        theme: 'arctic'
    },
    velvetNight: {
        primary: 'linear-gradient(135deg, #2c1810 0%, #8b4513 100%)',
        secondary: 'linear-gradient(135deg, #d4af37 0%, #ffd700 100%)',
        accent: '#ff8c00',
        text: '#ffffff',
        glass: 'rgba(255,255,255,0.18)',
        shadow: 'rgba(255, 140, 0, 0.4)',
        theme: 'vintage'
    }
};

const DESIGN_TEMPLATES = {
    process: [
        // Template 1: Horizontal Flow with Arrows
        {
            name: 'horizontalFlow',
            template: (scheme, data) => `
<div style="width: 1200px; height: 600px; max-width: 100%; background: ${scheme.primary}; padding: 50px; border-radius: 25px; font-family: 'Segoe UI', sans-serif; position: relative; overflow: hidden; box-sizing: border-box; margin: 0 auto;">
  <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%); pointer-events: none;"></div>
  <div style="height: 100%; display: flex; flex-direction: column; justify-content: center; position: relative; z-index: 1;">
    <h2 style="color: ${scheme.text}; font-size: 42px; font-weight: 900; text-align: center; margin: 0 0 20px 0; text-shadow: 0 4px 8px rgba(0,0,0,0.3); letter-spacing: -2px; background: linear-gradient(45deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">{title}</h2>
    <p style="color: rgba(255,255,255,0.9); font-size: 20px; text-align: center; margin: 0 0 50px 0; font-weight: 300; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">{subtitle}</p>
    <div style="display: flex; align-items: center; justify-content: center; gap: 0; flex: 1; flex-wrap: wrap;">
      <!-- Steps will be dynamically inserted here -->
    </div>
  </div>
</div>`
        },
        // Template 2: Vertical Timeline
        {
            name: 'verticalTimeline',
            template: (scheme, data) => `
<div style="width: 1200px; height: 600px; max-width: 100%; background: ${scheme.secondary}; padding: 50px; border-radius: 30px; font-family: 'Inter', sans-serif; position: relative; box-sizing: border-box; margin: 0 auto;">
  <div style="position: absolute; top: -100px; right: -100px; width: 300px; height: 300px; background: radial-gradient(circle, ${scheme.accent}20 0%, transparent 70%); border-radius: 50%;"></div>
  <div style="height: 100%; display: flex; flex-direction: column;">
    <h2 style="color: ${scheme.text}; font-size: 38px; font-weight: 800; text-align: center; margin: 0 0 40px 0; text-shadow: 0 3px 6px rgba(0,0,0,0.3); position: relative; z-index: 2;">{title}</h2>
    <div style="display: flex; align-items: stretch; justify-content: space-between; flex: 1; gap: 20px; position: relative;">
      <div style="position: absolute; top: 50%; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, transparent 0%, ${scheme.accent} 20%, ${scheme.accent} 80%, transparent 100%); z-index: 1;"></div>
      <!-- Timeline items will be inserted here -->
    </div>
  </div>
</div>`
        },
        // Template 3: Circular Progress
        {
            name: 'circularProgress',
            template: (scheme, data) => `
<div style="width: 1200px; height: 600px; max-width: 100%; background: ${scheme.primary}; padding: 50px; border-radius: 20px; font-family: 'Poppins', sans-serif; position: relative; overflow: hidden; box-sizing: border-box; margin: 0 auto;">
  <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: conic-gradient(from 180deg at 50% 50%, rgba(255,255,255,0.05) 0deg, transparent 90deg, rgba(255,255,255,0.03) 180deg, transparent 270deg); pointer-events: none;"></div>
  <div style="height: 100%; display: flex; flex-direction: column; position: relative; z-index: 1;">
    <h2 style="color: ${scheme.text}; font-size: 40px; font-weight: 800; text-align: center; margin: 0 0 50px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">{title}</h2>
    <div style="position: relative; width: 100%; height: 400px; display: flex; align-items: center; justify-content: center;">
      <!-- Circular layout items will be inserted here -->
    </div>
  </div>
</div>`
        }
    ],

    comparison: [
        // Template 1: Glass Cards
        {
            name: 'glassCards',
            template: (scheme, data) => `
<div style="width: 1200px; height: 600px; max-width: 100%; background: ${scheme.primary}; padding: 50px; border-radius: 25px; font-family: 'Segoe UI', sans-serif; box-sizing: border-box; margin: 0 auto; position: relative; overflow: hidden;">
  <div style="position: absolute; top: -50px; left: -50px; width: 200px; height: 200px; background: radial-gradient(circle, ${scheme.accent}30 0%, transparent 70%); border-radius: 50%; filter: blur(40px);"></div>
  <div style="height: 100%; display: flex; flex-direction: column;">
    <h2 style="color: ${scheme.text}; font-size: 40px; font-weight: 900; text-align: center; margin: 0 0 50px 0; text-shadow: 0 3px 6px rgba(0,0,0,0.3); letter-spacing: -1px;">{title}</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; flex: 1; align-content: center;">
      <!-- Cards will be inserted here -->
    </div>
  </div>
</div>`
        },
        // Template 2: Split Screen Comparison
        {
            name: 'splitScreen',
            template: (scheme, data) => `
<div style="width: 1200px; height: 600px; max-width: 100%; background: ${scheme.secondary}; border-radius: 20px; font-family: 'Inter', sans-serif; box-sizing: border-box; margin: 0 auto; overflow: hidden; position: relative;">
  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 4px; height: 80%; background: linear-gradient(180deg, transparent 0%, ${scheme.accent} 20%, ${scheme.accent} 80%, transparent 100%); z-index: 2;"></div>
  <h2 style="color: ${scheme.text}; font-size: 36px; font-weight: 800; text-align: center; padding: 40px 0 20px 0; margin: 0; background: ${scheme.glass}; backdrop-filter: blur(10px); text-shadow: 0 2px 4px rgba(0,0,0,0.3);">{title}</h2>
  <div style="display: flex; height: calc(100% - 100px);">
    <!-- Split sections will be inserted here -->
  </div>
</div>`
        },
        // Template 3: Feature Grid
        {
            name: 'featureGrid',
            template: (scheme, data) => `
<div style="width: 1200px; height: 600px; max-width: 100%; background: ${scheme.primary}; padding: 40px; border-radius: 30px; font-family: 'Roboto', sans-serif; box-sizing: border-box; margin: 0 auto; position: relative;">
  <div style="position: absolute; top: 0; right: 0; width: 300px; height: 300px; background: ${scheme.secondary}; border-radius: 50%; filter: blur(80px); opacity: 0.3;"></div>
  <div style="height: 100%; display: flex; flex-direction: column; position: relative; z-index: 1;">
    <h2 style="color: ${scheme.text}; font-size: 38px; font-weight: 800; text-align: center; margin: 0 0 40px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">{title}</h2>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; flex: 1;">
      <!-- Grid items will be inserted here -->
    </div>
  </div>
</div>`
        }
    ],

    radial: [
        // Template 1: Central Hub
        {
            name: 'centralHub',
            template: (scheme, data) => `
<div style="width: 1200px; height: 600px; max-width: 100%; background: ${scheme.primary}; padding: 50px; border-radius: 25px; font-family: 'Segoe UI', sans-serif; position: relative; box-sizing: border-box; margin: 0 auto; overflow: hidden;">
  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 600px; height: 600px; background: radial-gradient(circle, ${scheme.accent}10 0%, transparent 70%); border-radius: 50%; pointer-events: none;"></div>
  <div style="height: 100%; display: flex; flex-direction: column; position: relative; z-index: 1;">
    <h2 style="color: ${scheme.text}; font-size: 40px; font-weight: 900; text-align: center; margin: 0 0 30px 0; text-shadow: 0 3px 6px rgba(0,0,0,0.3); letter-spacing: -1px;">{title}</h2>
    <div style="position: relative; width: 100%; height: 450px; flex: 1;">
      <!-- Central hub and branches will be inserted here -->
    </div>
  </div>
</div>`
        },
        // Template 2: Orbital Design
        {
            name: 'orbital',
            template: (scheme, data) => `
<div style="width: 1200px; height: 600px; max-width: 100%; background: ${scheme.secondary}; padding: 50px; border-radius: 35px; font-family: 'Space Grotesk', sans-serif; position: relative; box-sizing: border-box; margin: 0 auto;">
  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 400px; height: 400px; border: 2px dashed ${scheme.glass}; border-radius: 50%; opacity: 0.3;"></div>
  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 300px; height: 300px; border: 2px dashed ${scheme.glass}; border-radius: 50%; opacity: 0.5;"></div>
  <h2 style="color: ${scheme.text}; font-size: 42px; font-weight: 800; text-align: center; margin: 0 0 30px 0; text-shadow: 0 4px 8px rgba(0,0,0,0.3);">{title}</h2>
  <div style="position: relative; width: 100%; height: 450px;">
    <!-- Orbital elements will be inserted here -->
  </div>
</div>`
        },
        // Template 3: Mind Map
        {
            name: 'mindMap',
            template: (scheme, data) => `
<div style="width: 1200px; height: 600px; max-width: 100%; background: ${scheme.primary}; padding: 50px; border-radius: 20px; font-family: 'Nunito', sans-serif; position: relative; box-sizing: border-box; margin: 0 auto; overflow: hidden;">
  <div style="position: absolute; inset: 0; background: repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.02) 20px, rgba(255,255,255,0.02) 22px); pointer-events: none;"></div>
  <div style="height: 100%; display: flex; flex-direction: column; position: relative; z-index: 1;">
    <h2 style="color: ${scheme.text}; font-size: 38px; font-weight: 800; text-align: center; margin: 0 0 40px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">{title}</h2>
    <div style="position: relative; width: 100%; height: 420px; flex: 1;">
      <!-- Mind map nodes will be inserted here -->
    </div>
  </div>
</div>`
        }
    ],
    chart: [
        // Template 1: Bar Chart (vertical bars using SVG rects)
        {
            name: 'barChart',
            template: (scheme, data) => `
<div style="width: 1200px; height: 600px; max-width: 100%; background: ${scheme.primary}; padding: 50px; border-radius: 25px; font-family: 'Segoe UI', sans-serif; position: relative; overflow: hidden; box-sizing: border-box; margin: 0 auto;">
  <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%); pointer-events: none;"></div>
  <h2 style="color: ${scheme.text}; font-size: 42px; font-weight: 900; text-align: center; margin: 0 0 40px 0; text-shadow: 0 4px 8px rgba(0,0,0,0.3);">{title}</h2>
  <p style="color: rgba(255,255,255,0.9); font-size: 20px; text-align: center; margin: 0 0 30px 0;">{subtitle}</p>
  <svg viewBox="0 0 1100 400" style="width: 100%; height: 400px;">
    <!-- Axes and grid lines -->
    <line x1="50" y1="350" x2="1050" y2="350" stroke="${scheme.accent}" stroke-width="2"/>
    <line x1="50" y1="350" x2="50" y2="50" stroke="${scheme.accent}" stroke-width="2"/>
    <!-- Bars will be dynamically inserted here (use rect elements with height scaled to max value) -->
  </svg>
</div>`
        },
        // Template 2: Line Chart (using SVG polyline with smooth curves)
        {
            name: 'lineChart',
            template: (scheme, data) => `
<div style="width: 1200px; height: 600px; max-width: 100%; background: ${scheme.secondary}; padding: 50px; border-radius: 30px; font-family: 'Inter', sans-serif; position: relative; box-sizing: border-box; margin: 0 auto;">
  <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: radial-gradient(circle, ${scheme.accent}30 0%, transparent 70%); filter: blur(40px);"></div>
  <h2 style="color: ${scheme.text}; font-size: 38px; font-weight: 800; text-align: center; margin: 0 0 40px 0;">{title}</h2>
  <svg viewBox="0 0 1100 400" style="width: 100%; height: 400px;">
    <!-- Axes -->
    <line x1="50" y1="350" x2="1050" y2="350" stroke="${scheme.accent}" stroke-width="2"/>
    <line x1="50" y1="350" x2="50" y2="50" stroke="${scheme.accent}" stroke-width="2"/>
    <!-- Lines will be dynamically inserted here (use polyline or path for curves) -->
  </svg>
</div>`
        },
        // Template 3: Pie Chart (using SVG paths or conic-gradient divs)
        {
            name: 'pieChart',
            template: (scheme, data) => `
<div style="width: 1200px; height: 600px; max-width: 100%; background: ${scheme.primary}; padding: 50px; border-radius: 20px; font-family: 'Poppins', sans-serif; position: relative; overflow: hidden; box-sizing: border-box; margin: 0 auto;">
  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 400px; height: 400px; background: conic-gradient(from 0deg, rgba(255,255,255,0.05) 0%, transparent 50%); border-radius: 50%;"></div>
  <h2 style="color: ${scheme.text}; font-size: 40px; font-weight: 800; text-align: center; margin: 0 0 50px 0;">{title}</h2>
  <div style="display: flex; justify-content: center; align-items: center; height: 400px;">
    <!-- Pie will be inserted here (use div with conic-gradient or SVG circle with stroke-dasharray) -->
  </div>
</div>`
        }
    ],
    timeline: [
        // Template 1: Horizontal Timeline
        {
            name: 'horizontal',
            template: (scheme, data) => `
<div style="width: 1200px; height: 600px; max-width: 100%; background: ${scheme.primary}; padding: 50px; border-radius: 25px; font-family: 'Inter', sans-serif; box-sizing: border-box; margin: 0 auto; position: relative; overflow: hidden;">
  <div style="position: absolute; bottom: 0; right: 0; width: 250px; height: 250px; background: ${scheme.secondary}; border-radius: 50%; filter: blur(60px); opacity: 0.4;"></div>
  <h2 style="color: ${scheme.text}; font-size: 44px; font-weight: 900; text-align: center; margin: 0 0 50px 0; text-shadow: 0 4px 8px rgba(0,0,0,0.3); position: relative; z-index: 2;">{title}</h2>
  <div style="position: relative; height: 400px; overflow-x: auto;">
    <div style="position: absolute; top: 50%; left: 50px; right: 50px; height: 4px; background: linear-gradient(90deg, ${scheme.accent}, ${scheme.accent}AA, ${scheme.accent}); border-radius: 2px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);"></div>
    <!-- Timeline events will be inserted here -->
  </div>
</div>`
        },
        // Template 2: Zigzag Timeline
        {
            name: 'zigzag',
            template: (scheme, data) => `
<div style="width: 1200px; height: 600px; max-width: 100%; background: ${scheme.secondary}; padding: 50px; border-radius: 20px; font-family: 'Poppins', sans-serif; box-sizing: border-box; margin: 0 auto; position: relative;">
  <div style="position: absolute; top: -100px; left: -100px; width: 300px; height: 300px; background: conic-gradient(from 0deg, ${scheme.accent}30, transparent, ${scheme.accent}20); border-radius: 50%; filter: blur(50px);"></div>
  <h2 style="color: ${scheme.text}; font-size: 40px; font-weight: 800; text-align: center; margin: 0 0 40px 0; text-shadow: 0 3px 6px rgba(0,0,0,0.3); position: relative; z-index: 2;">{title}</h2>
  <div style="position: relative; height: 420px; overflow: hidden;">
    <!-- Zigzag timeline will be inserted here -->
  </div>
</div>`
        },
        // Template 3: Circular Timeline
        {
            name: 'circular',
            template: (scheme, data) => `
<div style="width: 1200px; height: 600px; max-width: 100%; background: ${scheme.primary}; padding: 50px; border-radius: 30px; font-family: 'Rubik', sans-serif; box-sizing: border-box; margin: 0 auto; position: relative; overflow: hidden;">
  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 500px; height: 500px; border: 3px solid ${scheme.glass}; border-radius: 50%; opacity: 0.3;"></div>
  <h2 style="color: ${scheme.text}; font-size: 42px; font-weight: 800; text-align: center; margin: 0 0 30px 0; text-shadow: 0 4px 8px rgba(0,0,0,0.3);">{title}</h2>
  <div style="position: relative; width: 100%; height: 450px; display: flex; align-items: center; justify-content: center;">
    <!-- Circular timeline elements will be inserted here -->
  </div>
</div>`
        }
    ]
};

// Function to get random color scheme
const getRandomColorScheme = () => {
    const schemes = Object.keys(COLOR_SCHEMES);
    const randomScheme = schemes[Math.floor(Math.random() * schemes.length)];
    return COLOR_SCHEMES[randomScheme];
};
const getRandomProcessTemplate = () => {
    const templates = DESIGN_TEMPLATES.process;
    return templates[Math.floor(Math.random() * templates.length)];
}

// Function to get random template for a type
const getRandomTemplate = (type) => {
    const templates = DESIGN_TEMPLATES[type] || DESIGN_TEMPLATES.comparison;
    return templates[Math.floor(Math.random() * templates.length)];
};
const getRandomeTimelineTemplate = () => {
    const templates = DESIGN_TEMPLATES.timeline;
    return templates[Math.floor(Math.random() * templates.length)];
}

const createSystemPrompt = (userPrompt) => {
    const colorScheme = getRandomColorScheme();
    const schemeData = JSON.stringify(colorScheme, null, 2);
    const randomTemplate = getRandomTemplate("");
    const randomProcessTemplate = getRandomProcessTemplate();
    const randomTimelineTemplate = getRandomeTimelineTemplate();
    const randomChartTemplate = getRandomTemplate("chart");
    const randomComparisonTemplate = getRandomTemplate("comparison");
    const randomRadialTemplate = getRandomTemplate("radial");
    const randomFlowTemplate = getRandomTemplate("process");

    return `You are an expert infographic generator and web designer specializing in STUNNING, UNIQUE designs, now including interactive charts.

TASK: Analyze this user request and generate TWO outputs:
1. Structured JSON (for data storage and reuse).
2. HTML snippet (to render the infographic with beautiful CSS styling in style="..." format).
3- Make sure the width is 1200px and height is 600px (2:1 ratio).
4- Also use @keyframes and CSS transitions for animations.
5- Use relevant emojis and svgs to enhance the design inside the infographics.
6- Make sure there are not empty spaces in the generated infographics HTML.
7- Please ensure that you follow the color scheme provided in ${randomTemplate.template(colorScheme, {})}.
8- Please do not use infographic HTML with oklch colors that can cause potesntial errors.
9- MAKE SURE THERE IS NO OVERLAPPING OF TEXTS, IMAGES AND EMOJIS. EVERYTHING MUST BE CLEARLY VISIBLE.
USER REQUEST:
"${userPrompt}"

CURRENT COLOR SCHEME TO USE:
${schemeData}

For inspiration, here's an example template structure for charts (adapt and make unique):
${randomTemplate.template(colorScheme, {})}

For inspiration, here's an example template structure for process infographics (adapt and make unique):
${randomProcessTemplate.template(colorScheme, {})}

For inspiration, here's an example template structure for timeline infographics (adapt and make unique):
${randomTimelineTemplate.template(colorScheme, {})}

For inspiration, here's an example template structure for chart infographics (adapt and make unique):
${randomChartTemplate.template(colorScheme, {})}

For inspiration, here's an example template structure for comparison infographics (adapt and make unique):
${randomComparisonTemplate.template(colorScheme, {})}

For inspiration, here's an example template structure for radial infographics (adapt and make unique):
${randomRadialTemplate.template(colorScheme, {})}

For inspiration, here's an example template structure for flow/process infographics (adapt and make unique):
${randomFlowTemplate.template(colorScheme, {})}

RULES:
- Return ONLY a JSON object with exactly two top-level keys: "json" and "html".
- Do NOT include explanations, markdown, or code fences.
- The "json" key must contain structured data as per the JSON SCHEMA below.
- The "html" key must contain a string of valid HTML using ONLY inline style="..." attributes and SVG for charts.
- HTML must NOT include <html>, <head>, <body>, or external CSS/JS references.
- For charts, use SVG elements (<rect>, <polyline>, <path>, <circle>) to render data visually. Scale values proportionally (e.g., max height=300 for bars). Add tooltips via title attributes and hover effects with CSS :hover.
- Create STUNNING, PROFESSIONAL designs with:
  * Modern gradients, glassmorphism (backdrop-filter: blur()), shadows, and depth.
  * CSS animations (@keyframes) and transitions for smooth effects (e.g., bars growing on load).
  * Interactive hovers (scale/transform) using inline onmouseover/onmouseout or CSS :hover.
  * Responsive: max-width: 100%; viewBox for SVG.
  * UNIQUE elements: Add legends, axis labels, grid lines, data labels, and subtle patterns.

JSON SCHEMA:
{
  "title": "Main headline",
  "subtitle": "Supporting description" (Compulsory) , should be detailed and relevant,
  "type": "process | comparison | radial | timeline | chart",
  "subtype": "If type=chart, required: bar | line | pie | scatter | area" ,
  "data": {
    // For chart: { labels: string[], datasets: [{ name: string, values: number[], color?: string }] }
    // For others: existing structure
  },
  "meta": { "generated_at": "2025-09-09T12:00:00Z", "source": "AI Generated", "colorScheme": "schemeName" }
}

IMPORTANT DESIGN REQUIREMENTS:
- ALL INFOGRAPHICS MUST BE: width: 1200px; height: 600px; (2:1 ratio)
- Use the color scheme consistently (e.g., bars in primary/secondary gradients).
- Include animations (e.g., @keyframes barGrow { from { height: 0; } to { height: 100%; } })
- For charts: Normalize data (find max value, scale to SVG height). Add legends as colored squares with text.
- Choose 'chart' type if request involves data, trends, stats, or visualizations.

DESIGN VARIATIONS FOR EACH TYPE:
# ... (your existing variations for process/comparison/radial/timeline)

CHART INFOGRAPHICS:
1. Bar: Vertical/horizontal bars with scaled heights/widths, axis labels, hover tooltips.
2. Line: Smooth polylines/paths, data points as circles, area fill option.
3. Pie: Conic-gradient div or SVG paths for segments, center labels, legend.
4. Scatter: Dots (circles) positioned by x/y, trend lines.
5. Area: Stacked/filled lines for cumulative data.

MAKE EACH DESIGN TRULY UNIQUE by varying layouts, adding decorative SVGs, and custom interactions.

OUTPUT FORMAT:
{
  "json": { ... },
  "html": "<div>STUNNING UNIQUE HTML HERE</div>"
}`;
};

async function getInfographicService(prompt, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const systemPrompt = createSystemPrompt(prompt);
            const result = await textGenModel.generateContent(systemPrompt);

            let response = result.response.text().trim();
            response = response.replace(/```(json)?/g, "").trim();

            let parsed;
            try {
                parsed = JSON5.parse(response);

                // If parsed is a string containing JSON, parse it again
                if (typeof parsed === "string") {
                    parsed = JSON5.parse(parsed);
                }
            } catch (err) {
                throw new Error(`Gemini did not return valid JSON: ${response}`);
            }

            if (!parsed.json || !parsed.html) {
                throw new Error("Gemini response missing 'json' or 'html' keys");
            }

            return {
                data: parsed.json,
                html: parsed.html,
                meta: { generatedAt: new Date().toISOString() }
            };
        } catch (error) {
            if (i === retries - 1) {
                console.error("Infographic generation error:", error);
                throw new Error(`Failed to generate infographic: ${error.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}


module.exports = { getInfographicService };