
const SLIDE_TEMPLATES = {
  // ========== COVER SLIDES ==========
  "cover-hero": {
    name: "Hero Cover",
    description: "Full-bleed cover with large title",
    canvas: { width: 960, height: 540 },
    structure: {
      title: {
        required: true,
        maxWords: 6,
        konva: {
          x: 60,
          y: 180,
          width: 840,
          fontSize: 64,
          fontWeight: "bold",
          fill: "#ffffff",
          align: "left",
          lineHeight: 1.2
        }
      },
      subtitle: {
        required: true,
        maxWords: 12,
        konva: {
          x: 60,
          y: 280,
          width: 600,
          fontSize: 24,
          fill: "#ffffff",
          align: "left",
          opacity: 0.9
        }
      },
      image: {
        position: "right",
        konva: {
          x: 480,
          y: 40,
          width: 460,
          height: 460
        }
      }
    }
  },

  "cover-center": {
    name: "Center Cover",
    description: "Centered title with minimal design",
    canvas: { width: 960, height: 540 },
    structure: {
      title: {
        required: true,
        maxWords: 8,
        konva: {
          x: 60,
          y: 200,
          width: 840,
          fontSize: 56,
          fontWeight: "bold",
          fill: "#2c3e50",
          align: "center"
        }
      },
      subtitle: {
        required: true,
        maxWords: 15,
        konva: {
          x: 180,
          y: 300,
          width: 600,
          fontSize: 22,
          fill: "#7f8c8d",
          align: "center"
        }
      },
      image: {
        position: "background",
        konva: {
          x: 0,
          y: 0,
          width: 960,
          height: 540,
          opacity: 0.15
        }
      }
    }
  },

  // ========== CONTENT SLIDES ==========
  "content-left-image": {
    name: "Content with Left Image",
    description: "Image on left, text bullets on right",
    canvas: { width: 960, height: 540 },
    structure: {
      title: {
        required: true,
        maxWords: 8,
        konva: {
          x: 480,
          y: 40,
          width: 440,
          fontSize: 36,
          fontWeight: "bold",
          fill: "#2c3e50",
          align: "left"
        }
      },
      bullets: {
        required: true,
        count: { min: 3, max: 5 },
        maxWordsPerBullet: 12,
        konva: {
          startX: 500,
          startY: 120,
          width: 420,
          fontSize: 18,
          fill: "#34495e",
          lineHeight: 1.6,
          spacing: 35
        }
      },
      image: {
        position: "left",
        konva: {
          x: 40,
          y: 40,
          width: 400,
          height: 460
        }
      }
    }
  },

  "content-right-image": {
    name: "Content with Right Image",
    description: "Text bullets on left, image on right",
    canvas: { width: 960, height: 540 },
    structure: {
      title: {
        required: true,
        maxWords: 8,
        konva: {
          x: 40,
          y: 40,
          width: 440,
          fontSize: 36,
          fontWeight: "bold",
          fill: "#2c3e50",
          align: "left"
        }
      },
      bullets: {
        required: true,
        count: { min: 3, max: 5 },
        maxWordsPerBullet: 12,
        konva: {
          startX: 40,
          startY: 120,
          width: 420,
          fontSize: 18,
          fill: "#34495e",
          lineHeight: 1.6,
          spacing: 35
        }
      },
      image: {
        position: "right",
        konva: {
          x: 520,
          y: 40,
          width: 400,
          height: 460
        }
      }
    }
  },

  "content-split": {
    name: "Split Content",
    description: "Two columns with title",
    canvas: { width: 960, height: 540 },
    structure: {
      title: {
        required: true,
        maxWords: 8,
        konva: {
          x: 40,
          y: 40,
          width: 880,
          fontSize: 36,
          fontWeight: "bold",
          fill: "#2c3e50",
          align: "center"
        }
      },
      leftBullets: {
        required: true,
        count: { min: 2, max: 4 },
        maxWordsPerBullet: 10,
        konva: {
          startX: 60,
          startY: 140,
          width: 380,
          fontSize: 17,
          fill: "#34495e",
          lineHeight: 1.6,
          spacing: 32
        }
      },
      rightBullets: {
        required: true,
        count: { min: 2, max: 4 },
        maxWordsPerBullet: 10,
        konva: {
          startX: 520,
          startY: 140,
          width: 380,
          fontSize: 17,
          fill: "#34495e",
          lineHeight: 1.6,
          spacing: 32
        }
      },
      image: {
        position: "background-bottom",
        konva: {
          x: 330,
          y: 400,
          width: 300,
          height: 120,
          opacity: 0.3
        }
      }
    }
  },

  // ========== SPECIAL SLIDES ==========
  "quote-slide": {
    name: "Quote Slide",
    description: "Large quote with attribution",
    canvas: { width: 960, height: 540 },
    structure: {
      quote: {
        required: true,
        maxWords: 25,
        konva: {
          x: 120,
          y: 150,
          width: 720,
          fontSize: 32,
          fontStyle: "italic",
          fill: "#2c3e50",
          align: "center",
          lineHeight: 1.5
        }
      },
      author: {
        required: false,
        maxWords: 5,
        konva: {
          x: 120,
          y: 350,
          width: 720,
          fontSize: 20,
          fill: "#7f8c8d",
          align: "center"
        }
      },
      image: {
        position: "background",
        konva: {
          x: 0,
          y: 0,
          width: 960,
          height: 540,
          opacity: 0.1
        }
      }
    }
  },

  "data-visual": {
    name: "Data Visualization",
    description: "Stats with supporting text",
    canvas: { width: 960, height: 540 },
    structure: {
      title: {
        required: true,
        maxWords: 8,
        konva: {
          x: 40,
          y: 40,
          width: 880,
          fontSize: 36,
          fontWeight: "bold",
          fill: "#2c3e50",
          align: "left"
        }
      },
      stats: {
        required: true,
        count: { min: 2, max: 3 },
        konva: {
          // This will be arranged horizontally
          startX: 60,
          startY: 180,
          width: 250,
          fontSize: 48,
          fontWeight: "bold",
          fill: "#3498db",
          spacing: 300
        }
      },
      descriptions: {
        required: true,
        count: { min: 2, max: 3 },
        maxWordsPerItem: 8,
        konva: {
          startX: 60,
          startY: 260,
          width: 250,
          fontSize: 16,
          fill: "#7f8c8d",
          spacing: 300
        }
      },
      image: {
        position: "bottom-right",
        konva: {
          x: 600,
          y: 300,
          width: 320,
          height: 220
        }
      }
    }
  },

  "call-to-action": {
    name: "Call to Action",
    description: "Bold CTA with button-like design",
    canvas: { width: 960, height: 540 },
    structure: {
      title: {
        required: true,
        maxWords: 6,
        konva: {
          x: 60,
          y: 160,
          width: 840,
          fontSize: 48,
          fontWeight: "bold",
          fill: "#2c3e50",
          align: "center"
        }
      },
      description: {
        required: true,
        maxWords: 15,
        konva: {
          x: 180,
          y: 260,
          width: 600,
          fontSize: 20,
          fill: "#7f8c8d",
          align: "center",
          lineHeight: 1.5
        }
      },
      cta: {
        required: true,
        maxWords: 4,
        konva: {
          x: 360,
          y: 380,
          width: 240,
          height: 60,
          fontSize: 22,
          fontWeight: "bold",
          fill: "#ffffff",
          align: "center",
          backgroundColor: "#3498db",
          cornerRadius: 8
        }
      },
      image: {
        position: "background",
        konva: {
          x: 0,
          y: 0,
          width: 960,
          height: 540,
          opacity: 0.08
        }
      }
    }
  }
};

// Template selection logic based on slide position and count
function selectTemplate(slideIndex, totalSlides, slideType = null) {
  if (slideType) {
    return SLIDE_TEMPLATES[slideType] || SLIDE_TEMPLATES["content-right-image"];
  }

  // First slide is always a cover
  if (slideIndex === 0) {
    return SLIDE_TEMPLATES["cover-hero"];
  }

  // Last slide (if 5 slides)
  if (slideIndex === totalSlides - 1 && totalSlides === 5) {
    return SLIDE_TEMPLATES["call-to-action"];
  }

  // Middle slides rotation
  const contentTemplates = [
    "content-right-image",
    "content-left-image",
    "content-split"
  ];
  
  const templateIndex = (slideIndex - 1) % contentTemplates.length;
  return SLIDE_TEMPLATES[contentTemplates[templateIndex]];
}

module.exports = { SLIDE_TEMPLATES, selectTemplate };