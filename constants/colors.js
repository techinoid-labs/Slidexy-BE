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