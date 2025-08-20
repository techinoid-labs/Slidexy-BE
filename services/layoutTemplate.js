const MARGIN = 20;
const SLIDE_WIDTH = 960;
const SLIDE_HEIGHT = 540;

const layouts = {
  intro: (slide) => {
    // Centered title, large background image, minimal elements
    const title = slide.elements.find(e => e.element_type === 'title');
    if (title) {
      title.properties = {
        ...title.properties,
        x: SLIDE_WIDTH / 2 - title.properties.width / 2,
        y: SLIDE_HEIGHT / 2 - title.properties.height / 2,
        fontSize: 48, // Larger for impact
        align: 'center',
      };
    }
    slide.image_url = slide.image_url || 'professional-gradient-background'; // Prompt hint
    return slide;
  },
  textImageSplit: (slide) => {
    // Left: text/bullets (50%), Right: image (50%)
    const textEls = slide.elements.filter(e => ['text', 'bullet_point'].includes(e.element_type));
    const imageEls = slide.elements.filter(e => e.element_type === 'image');
    textEls.forEach((el, idx) => {
      el.properties = {
        ...el.properties,
        x: MARGIN,
        y: MARGIN + 80 + idx * 100,
        width: SLIDE_WIDTH / 2 - MARGIN * 2,
      };
    });
    imageEls.forEach(el => {
      el.properties = {
        ...el.properties,
        x: SLIDE_WIDTH / 2 + MARGIN,
        y: MARGIN + 80,
        width: SLIDE_WIDTH / 2 - MARGIN * 2,
        height: SLIDE_HEIGHT - 160,
        cornerRadius: 20, // Rounded for modern look
      };
    });
    return slide;
  },
  bulletGrid: (slide) => {
    // Grid for bullets, with optional shape backgrounds
    const bullets = slide.elements.filter(e => e.element_type === 'bullet_point');
    const cols = Math.min(2, bullets.length); // Up to 2 columns
    bullets.forEach((el, idx) => {
      const col = idx % cols;
      el.properties = {
        ...el.properties,
        x: MARGIN + col * (SLIDE_WIDTH / cols),
        y: MARGIN + 80 + Math.floor(idx / cols) * 100,
        width: (SLIDE_WIDTH / cols) - MARGIN * 2,
      };
      // Add subtle shape behind each bullet for professionalism
      slide.elements.push({
        element_type: 'shape',
        konva_component: 'Konva.Rect',
        properties: {
          x: el.properties.x - 10,
          y: el.properties.y - 10,
          width: el.properties.width + 20,
          height: el.properties.height + 20,
          fill: '#F5F5F5',
          cornerRadius: 10,
          zIndex: el.properties.zIndex - 1,
        },
      });
    });
    return slide;
  },
  // Add more: timeline, chart-placeholder, full-image-overlay, etc.
};

// Function to select layout based on content
function selectLayout(slide) {
  if (slide.elements.length <= 2) return 'intro';
  if (slide.elements.some(e => e.element_type === 'image') && slide.elements.some(e => ['text', 'bullet_point'].includes(e.element_type))) return 'textImageSplit';
  if (slide.elements.filter(e => e.element_type === 'bullet_point').length > 2) return 'bulletGrid';
  return 'textImageSplit'; // Default
}

module.exports = { layouts, selectLayout };