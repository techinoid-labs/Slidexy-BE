const DESIGN_TEMPLATES = {
  Title: [
    // Template 1: Horizontal Flow with Arrows
    {
  name: 'horizontalFlow',
  template: (scheme, data) => `
<div style="width: 1200px; height: 600px; max-width: 100%; background: ${scheme.primary}; padding: 50px; border-radius: 25px; font-family: 'Segoe UI', sans-serif; position: relative; overflow: hidden; box-sizing: border-box; margin: 0 auto;">
  <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%); pointer-events: none;"></div>
  <div style="height: 100%; display: flex; flex-direction: column; justify-content: center; position: relative; z-index: 1;">
    <h2 style="color: ${scheme.text}; font-size: 42px; font-weight: 900; text-align: center; margin: 0 0 20px 0; text-shadow: 0 4px 8px rgba(0,0,0,0.3); letter-spacing: -2px; background: linear-gradient(45deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${data.title}</h2>
    <p style="color: rgba(255,255,255,0.9); font-size: 20px; text-align: center; margin: 0 0 50px 0; font-weight: 300; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${data.subtitle}</p>
    <div style="display: flex; align-items: center; justify-content: center; gap: 30px; flex: 1; flex-wrap: wrap;">
      ${data.steps.map(step => `
        <div style="background: ${scheme.secondary}; border-radius: 20px; padding: 20px 30px; text-align: center; min-width: 150px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          <div style="font-size: 28px; font-weight: 700; color: ${scheme.text}; margin-bottom: 10px;">${step.number}</div>
          <div style="font-size: 18px; font-weight: 500; color: ${scheme.text};">${step.label}</div>
        </div>
      `).join('')}
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

module.exports = DESIGN_TEMPLATES;