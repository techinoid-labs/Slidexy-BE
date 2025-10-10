const COLOR_SCHEMES = {
  // Warm Peach
  warmPeach: {
    primary: 'linear-gradient(135deg, #FFDAB9 0%, #FFBFA3 100%)',
    secondary: 'linear-gradient(135deg, #FFE5CC 0%, #FFCCAA 100%)',
    background: '#FFDAB9',
    accent: '#FF8C61',
    text: '#3B2E2A',         // default text
    heading: '#3B1F14',      // darker heading
    body: '#4B3629',         // secondary text for paragraphs
    accentText: '#FFFFFF',   // text on accent backgrounds
    glass: 'rgba(255,255,255,0.2)',
    shadow: 'rgba(0,0,0,0.1)',
    theme: 'warm'
  },

  // Soft Coral
  softCoral: {
    primary: 'linear-gradient(135deg, #FFE2D9 0%, #FFC4B3 100%)',
    secondary: 'linear-gradient(135deg, #FFD1C2 0%, #FFA994 100%)',
    background: '#FFE2D9',
    accent: '#FF7F50',
    text: '#4A2C2A',
    heading: '#3A1F1A',
    body: '#5A3A35',
    accentText: '#FFFFFF',
    glass: 'rgba(255,255,255,0.2)',
    shadow: 'rgba(0,0,0,0.12)',
    theme: 'warm'
  },

  // Peachy Pink
  peachPink: {
    primary: 'linear-gradient(135deg, #FFD1DC 0%, #FFB3C6 100%)',
    secondary: 'linear-gradient(135deg, #FFE0E5 0%, #FFC6D1 100%)',
    background: '#FFD1DC',
    accent: '#FF6F91',
    text: '#3C1F28',
    heading: '#2B0F1A',
    body: '#4D2C38',
    accentText: '#FFFFFF',
    glass: 'rgba(255,255,255,0.2)',
    shadow: 'rgba(0,0,0,0.12)',
    theme: 'warm'
  },

  // Light Apricot
  lightApricot: {
    primary: 'linear-gradient(135deg, #FFE5B4 0%, #FFD47A 100%)',
    secondary: 'linear-gradient(135deg, #FFF0C8 0%, #FFD97A 100%)',
    background: '#FFE5B4',
    accent: '#FFB347',
    text: '#4A3A2A',
    heading: '#3A2515',
    body: '#5A432B',
    accentText: '#FFFFFF',
    glass: 'rgba(255,255,255,0.18)',
    shadow: 'rgba(0,0,0,0.1)',
    theme: 'warm'
  }
};

module.exports = COLOR_SCHEMES;

//  COLOR SCHEME GUIDELINES (auto-select from topic):
//   Best for: Data-heavy infographics, technical reports, or storytelling with strong contrast.
//   #FFFFFF – White background  
//   #1A1A1A – Deep charcoal text  
//   #E5E5E5 – Light gray divider lines  
//   #007AFF – Blue accent (Apple-inspired)
//   Bright Flat UI Colors (Google Material Style)
//   #4285F4 – Blue  
//   #EA4335 – Red  
//   #FBBC05 – Yellow  
//   #34A853 – Green  
//   #F5F5F5 – Neutral background
//   Best for: Environmental, social, lifestyle, wellness, or sustainability topics.
//   #A8DADC – Aqua  
//   #457B9D – Steel blue  
//   #F1FAEE – Cream white  
//   #E63946 – Coral red  
//   #1D3557 – Deep navy
//   Best for: Marketing, motivation, emotional storytelling, or “impact” visuals.
//   #FF512F → #DD2476 (Fiery red to pink)  
//   #FDBB2D → #22C1C3 (Gold to cyan)  
//   #654EA3 → #EA6060 (Violet to coral)
//   Best for: Charts, maps, scientific or policy infographics.
//   Sequential palette (for intensity data):
//   #f7fbff → #08306b
//   Diverging palette (for +/- or contrast data):
//   #b2182b → #f7f7f7 → #2166ac
//   Categorical palette (for distinct categories):
//   #1b9e77, #d95f02, #7570b3, #e7298a, #66a61e, #e6ab02
//   Best for: Futuristic, tech, AI, gaming, or night-data dashboards.
//   #0F2027 – Dark navy  
//   #203A43 – Charcoal teal  
//   #2C5364 – Muted steel  
//   #00FFFF – Cyan  
//   #FF0080 – Neon pink  
//   #FFD700 – Gold highlight
//   Best for: History, culture, storytelling, art, or nostalgia-based topics.
//   #E8C547 – Warm gold  
//   #30323D – Charcoal gray  
//   #4D5061 – Slate  
//   #5C80BC – Muted blue  
//   #E84545 – Brick red
//   Best for: Climate, environment, biology, outdoor, wellness topics.
//   #264653 – Deep forest  
//   #2A9D8F – Teal green  
//   #E9C46A – Sand gold  
//   #F4A261 – Clay orange  
//   #E76F51 – Terracotta
//   Best for: Elegant infographics, portfolios, or luxury data visuals.
//   #000000 – Deep black  
//   #F5F5F5 – Light neutral  
//   #C0C0C0 – Silver-gray  
//   #FF5E5B – Coral red accent
//   Best for: Kids, education, or creative storytelling.
//   #FF6F61 – Coral  
//   #6B5B95 – Purple  
//   #88B04B – Fresh green  
//   #F7CAC9 – Baby pink  
//   #92A8D1 – Sky blue
//   NOTE: I want you to decide the color scheme based on the kind of information and infographic you are making and 
//   consider the following rules.
//   - Try to use light background colors
//   - dont use too solid colors bu dont make too gradient as well
//   - Use things like (Important) 
//   1. glassmorphism
//   2. Neumorphism
//   3. Gradient Layering
//   4. Aurora
//   5. Mesh Gradients
//   6. Glassy Layers + Shadows
//   7. Gradients + Glass Hybrid
//   8. Glass Borders with Gradient Text
//   9. Subtle Pattern Overlays (Noise or Grid)
 