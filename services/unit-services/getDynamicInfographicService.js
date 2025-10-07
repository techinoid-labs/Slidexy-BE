const { textGenModel } = require("../../utils/geminiModels");
const JSON5 = require("json5");
const fs = require("fs").promises;
const path = require("path");

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

async function validateAndProcessImage(imagePath) {
  try {
    // Check if file exists
    await fs.access(imagePath);
    
    // Get file stats
    const stats = await fs.stat(imagePath);
    const maxSize = 20 * 1024 * 1024; // 20MB limit for Gemini
    
    if (stats.size > maxSize) {
      console.warn(`Image ${imagePath} is too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
      return null;
    }
    
    // Check file extension
    const ext = path.extname(imagePath).toLowerCase();
    const supportedFormats = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    
    if (!supportedFormats.includes(ext)) {
      console.warn(`Unsupported image format: ${ext}`);
      return null;
    }
    
    // Read and encode the image
    const imageBuffer = await fs.readFile(imagePath);
    const mimeType = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif'
    }[ext] || 'image/jpeg';
    
    console.log(`Processed image: ${path.basename(imagePath)} (${(stats.size / 1024).toFixed(1)}KB, ${mimeType})`);
    
    return {
      inlineData: {
        mimeType,
        data: imageBuffer.toString('base64')
      }
    };
    
  } catch (error) {
    console.error(`Failed to process image ${imagePath}:`, error.message);
    return null;
  }
}

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

const createSystemPrompt = (userPrompt,imageParts,imageCount = 0) => {

  const colorScheme = getRandomColorScheme();
  const schemeData = JSON.stringify(colorScheme, null, 2);
  const randomTemplate = getRandomTemplate("");
  const randomProcessTemplate = getRandomProcessTemplate();
  const randomTimelineTemplate = getRandomeTimelineTemplate();
  const randomChartTemplate = getRandomTemplate("chart");
  const randomComparisonTemplate = getRandomTemplate("comparison");
  const randomRadialTemplate = getRandomTemplate("radial");
  const randomFlowTemplate = getRandomTemplate("process");
   let imageInstruction = "";
  if (imageCount > 0) {
    imageInstruction = `
IMPORTANT: You have been provided with ${imageCount} reference image(s). You MUST analyze and incorporate:
- Layout patterns and visual hierarchy
- Typography styles and text placement
- Color combinations and gradients (adapt to the provided color scheme)
- Design elements like icons, shapes, and decorative elements
- Overall composition and spacing principles
- Visual flow and user attention patterns

Blend these design elements seamlessly with the provided color scheme. Your infographic should feel inspired by the reference images while maintaining design consistency.
`;
  }

  return `You are an expert infographic generator and web designer specializing in STUNNING, UNIQUE and responsive designs, now including interactive charts. Use ${imageInstruction} for references of HTML.

TASK: Analyze this user request and generate TWO outputs:
FIRSTLY MAKE SURE THERE IS NO OVERLAPPING OF TEXTS, IMAGES AND EMOJIS. EVERYTHING MUST BE CLEARLY VISIBLE.
ALSO ENSURE THE LAYOUT IS RESPONSIVE — elements must reflow, resize, or scroll gracefully on mobile devices without overflowing horizontally or overlapping vertically.
1. Structured JSON (for data storage and reuse).
2. HTML snippet (to render the infographic with beautiful CSS styling in style="..." format).
3- Use relative units like %, rem, vw, and clamp() instead of fixed px where possible.
   - Ensure it looks great on mobile, tablet, and desktop (320px to 1440px width).
4- Also use @keyframes and CSS transitions for animations.
5- Use relevant emojis and svgs to enhance the design inside the infographics.
6- Make sure there are not empty spaces in the generated infographics HTML.
7- Please ensure that you follow the color scheme provided in ${randomTemplate.template(colorScheme, {})}.
8- Please do not use infographic HTML with oklch colors that can cause potesntial errors.

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
- The infographic container MUST use width:100%; height:auto; and must adapt dynamically to its content (no fixed pixel dimensions).
- **All internal content wrappers, sections, and flex/grid containers must use height:auto and should rely on min-height in relative units (e.g., min-height:40vh) only for layout balance, NOT to enforce a fixed size.**
- **Layout Density Constraint:** On small screens (when content wraps), ensure sufficient vertical spacing. **Do not use negative margins or position: absolute for content-bearing elements.** Utilize gap margin, and padding with rem or clamp() to maintain clear separation between stacked elements.
- The "json" key must contain structured data as per the JSON SCHEMA below.
- The "html" key must contain a string of valid HTML using ONLY inline style="..." attributes and SVG for charts.
- HTML must NOT include <html>, <head>, <body>, or external CSS/JS references.
- The root <div> must include style="width:100%; height:auto; max-width:100%; overflow:hidden; box-sizing:border-box;".
- All internal sections must use flexbox or grid layouts with flex-wrap:wrap to allow vertical stacking on small screens.
- Use responsive units only: %, vw, vh, rem, and clamp(). Avoid px for widths, heights, paddings, and font sizes.
- Use font-size:clamp(min, preferred, max) for titles and body text to scale smoothly.
- Avoid position:absolute except for decorative elements with % or vw positioning.
- All images and SVGs must have max-width:100% and height:auto.
- For Flutter WebView or flutter_html compatibility, ensure the HTML can scroll vertically without being clipped.
- The HTML must be fully fluid and mobile-first responsive:
  * Use flex-wrap:wrap or grid-template-columns with fractional units (1fr, 2fr, etc.)
  * No fixed widths or heights in pixels. All containers, cards, and blocks must size naturally with their content.
  * Titles, subtitles, and text must scale using clamp() and relative units.
  * On screens smaller than 768px, ensure everything stacks vertically without overlap.
- For Timeline type, use flexbox/grid for layout. Add arrows, dots, or icons to indicate time progression and it should look like a timeline graph.
- For charts, use SVG elements (<rect>, <polyline>, <path>, <circle>) to render data visually. Scale values proportionally (e.g., max height=300 for bars). Add tooltips via title attributes and hover effects with CSS :hover.
- Create STUNNING, PROFESSIONAL designs with:
  * Modern gradients, glassmorphism (backdrop-filter: blur()), shadows, and depth.
  * CSS animations (@keyframes) and transitions for smooth effects (e.g., bars growing on load).
  * Interactive hovers (scale/transform) using inline onmouseover/onmouseout or CSS :hover.
  * Responsive: max-width: 100%; viewBox for SVG.
  * UNIQUE elements: Add legends, axis labels, grid lines, data labels, and subtle patterns.
- Use CSS Grid or Flexbox with minmax() or clamp() to enable multi-column layouts on larger screens (no media queries needed).
- Example: grid-template-columns: repeat(auto-fit, minmax(clamp(250px, 40%, 400px), 1fr));
- Ensure all content stacks vertically on small screens but expands horizontally when space allows.


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
- Use the color scheme consistently (e.g., bars in primary/secondary gradients).
- Include animations (e.g., @keyframes barGrow { from { height: 0; } to { height: 100%; } })
- For charts: Normalize data (find max value, scale to SVG height). Add legends as colored squares with text.
- Choose 'chart' type if request involves data, trends, stats, or visualizations.
- On screens smaller than 768px, all boxes, charts, and text blocks must stack vertically (1 column layout) using flex-wrap or grid-template-columns: 1fr.

FLUTTER DISPLAY COMPATIBILITY NOTES:
- The generated HTML will often be rendered using flutter_html or WebView.
- Therefore:
  * Inline styles must be self-contained (no <style> or <script> tags).
  * Root container must use height:auto so content isn’t clipped.
* Mobile-First Layout: Default to single-column stacking when viewport width is too narrow for side-by-side (e.g., via minmax() or clamp()).
* Responsiveness must rely on flexible grid/flex properties (repeat(auto-fit, minmax(...))) instead of media queries.
  * Animations must be defined via inline @keyframes within style="" blocks.
  * The HTML should scroll naturally when content exceeds viewport height.


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


async function getDynamicInfographicService(prompt, options = {}) {
  const {
    referenceImagePaths = [],
    retries = 3
  } = options;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${retries} - Generating infographic for: "${prompt.substring(0, 50)}..."`);
      
      // Process reference images
      const imageParts = [];
      if (referenceImagePaths.length > 0) {
        console.log(`Processing ${referenceImagePaths.length} reference images...`);
        
        for (const imagePath of referenceImagePaths) {
          const imagePart = await validateAndProcessImage(imagePath);
          if (imagePart) {
            imageParts.push(imagePart);
          }
        }
        
        console.log(`Successfully processed ${imageParts.length}/${referenceImagePaths.length} images`);
      }

      // Create the system prompt
      const systemPrompt = createSystemPrompt(prompt, imageParts, imageParts.length);
      
      // Prepare content for Gemini - array format with text first, then images
      const contentParts = [
        { text: systemPrompt },
        ...imageParts
      ];
      
      console.log(` Sending to Gemini: ${contentParts.length} content parts (1 text + ${imageParts.length} images)`);
      
      // Generate content using your custom wrapper
      const result = await textGenModel.generateContent(contentParts);
      
      // Extract the response text
      const response = result.response;
      let responseText = response.text().trim();
      
      // Clean up the response (remove any markdown code blocks)
      responseText = responseText.replace(/```(json)?/g, "").trim();
      responseText = responseText.replace(/^```|```$/g, "").trim();
      
      console.log(`Response received (${responseText.length} characters)`);
      
      // Parse the JSON response
      let parsed;
      try {
        parsed = JSON5.parse(responseText);
        
        // Handle case where response might be double-encoded
        if (typeof parsed === 'string') {
          parsed = JSON5.parse(parsed);
        }
      } catch (parseError) {
        console.error("JSON parsing failed:", parseError.message);
        console.error("Raw response preview:", responseText.substring(0, 200) + "...");
        throw new Error(`Invalid JSON response from Gemini: ${parseError.message}`);
      }

      // Validate response structure
      if (!parsed || typeof parsed !== 'object') {
        throw new Error("Response is not a valid object");
      }
      
      if (!parsed.json || !parsed.html) {
        throw new Error("Response missing required 'json' or 'html' keys");
      }
      
      // Validate JSON structure
      if (!parsed.json.title || !parsed.json.subtitle || !parsed.json.type) {
        throw new Error("Invalid JSON structure - missing required fields");
      }
      
      // Validate HTML content
      const html = parsed.html;
      if (!html.includes('1200px') || !html.includes('600px')) {
        console.warn("HTML may not have correct dimensions");
      }
      
      console.log("Infographic generated successfully!");
      console.log(`Type: ${parsed.json.type}, Title: "${parsed.json.title}"`);
      
      return {
        data: parsed.json,
        html: parsed.html,
        meta: {
          generatedAt: new Date().toISOString(),
          attempt: attempt,
          referenceImagesProcessed: imageParts.length,
          referenceImagePaths: referenceImagePaths.length > 0 ? referenceImagePaths : null,
          prompt: prompt
        }
      };

    } catch (error) {
      console.error(`Attempt ${attempt}/${retries} failed:`, error.message);
      
      if (attempt === retries) {
        console.error("All attempts exhausted");
        throw new Error(`Failed to generate infographic after ${retries} attempts: ${error.message}`);
      }
      
      // Progressive delay between retries
      const delay = attempt * 1500 + Math.random() * 1000; // 1.5s, 3s, 4.5s + random
      console.log(`⏳ Waiting ${(delay/1000).toFixed(1)}s before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}


module.exports = { getDynamicInfographicService };