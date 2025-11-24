// utils/slideTemplate.js - Comprehensive slide template system with 5 variants per type
const { v4: uuidv4 } = require("uuid");

// ============= SLIDE TEMPLATES WITH 5 VARIANTS EACH =============

const SLIDE_TEMPLATES = {
  // ========== COVER SLIDES (5 variants) ==========
  "cover-hero": {
    name: "Hero Cover",
    description: "Full-bleed cover with large title and gradient background",
    variants: {
      "hero-gradient": {
        name: "Gradient Hero",
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
      "hero-minimal": {
        name: "Minimal Hero",
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
      "hero-geometric": {
        name: "Geometric Hero",
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
      "hero-layered": {
        name: "Layered Hero",
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
      "hero-modern": {
        name: "Modern Hero",
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
      }
    }
  },

  // ========== CONTENT SLIDES (5 variants each) ==========
  "content-right-image": {
    name: "Content with Right Image",
    description: "Text bullets on left, image on right",
    variants: {
      "content-classic": {
        name: "Classic Layout",
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
      "content-modern": {
        name: "Modern Layout",
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
      "content-card": {
        name: "Card Layout",
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
      "content-gradient": {
        name: "Gradient Layout",
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
      "content-minimal": {
        name: "Minimal Layout",
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
      }
    }
  },

  "content-left-image": {
    name: "Content with Left Image",
    description: "Image on left, text bullets on right",
    variants: {
      "content-left-classic": {
        name: "Classic Left",
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
      "content-left-modern": {
        name: "Modern Left",
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
      "content-left-card": {
        name: "Card Left",
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
      "content-left-gradient": {
        name: "Gradient Left",
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
      "content-left-minimal": {
        name: "Minimal Left",
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
      }
    }
  },

  "content-split": {
    name: "Split Content",
    description: "Two columns with title",
    variants: {
      "split-classic": {
        name: "Classic Split",
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
      "split-modern": {
        name: "Modern Split",
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
      "split-card": {
        name: "Card Split",
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
      "split-gradient": {
        name: "Gradient Split",
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
      "split-minimal": {
        name: "Minimal Split",
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
      }
    }
  },

  // ========== SPECIAL SLIDES ==========
  "quote-slide": {
    name: "Quote Slide",
    description: "Large quote with attribution",
    variants: {
      "quote-classic": {
        name: "Classic Quote",
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
      "quote-modern": {
        name: "Modern Quote",
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
      "quote-card": {
        name: "Card Quote",
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
      "quote-gradient": {
        name: "Gradient Quote",
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
      "quote-minimal": {
        name: "Minimal Quote",
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
      }
    }
  },

  "data-visual": {
    name: "Data Visualization",
    description: "Stats with supporting text",
    variants: {
      "data-classic": {
        name: "Classic Data",
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
      "data-modern": {
        name: "Modern Data",
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
      "data-card": {
        name: "Card Data",
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
      "data-gradient": {
        name: "Gradient Data",
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
      "data-minimal": {
        name: "Minimal Data",
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
      }
    }
  },

  "call-to-action": {
    name: "Call to Action",
    description: "Bold CTA with button-like design",
    variants: {
      "cta-classic": {
        name: "Classic CTA",
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
      },
      "cta-modern": {
        name: "Modern CTA",
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
      },
      "cta-card": {
        name: "Card CTA",
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
      },
      "cta-gradient": {
        name: "Gradient CTA",
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
      },
      "cta-minimal": {
        name: "Minimal CTA",
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
    }
  },

  "conclusion": {
    name: "Conclusion Slide",
    description: "Key takeaways and thank you",
    variants: {
      "conclusion-classic": {
        name: "Classic Conclusion",
        canvas: { width: 960, height: 540 },
        structure: {
          title: {
            required: true,
            maxWords: 6,
            konva: {
              x: 60,
              y: 60,
              width: 840,
              fontSize: 38,
              fontWeight: "bold",
              fill: "#2c3e50",
              align: "center"
            }
          },
          bullets: {
            required: true,
            count: { min: 2, max: 4 },
            maxWordsPerBullet: 12,
            konva: {
              startX: 60,
              startY: 170,
              width: 840,
              fontSize: 18,
              fill: "#34495e",
              lineHeight: 1.6,
              spacing: 35
            }
          },
          thankYou: {
            required: true,
            konva: {
              x: 0,
              y: 460,
              width: 960,
              fontSize: 28,
              fontWeight: "500",
              fill: "#ffffff",
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
      "conclusion-modern": {
        name: "Modern Conclusion",
        canvas: { width: 960, height: 540 },
        structure: {
          title: {
            required: true,
            maxWords: 6,
            konva: {
              x: 60,
              y: 60,
              width: 840,
              fontSize: 38,
              fontWeight: "bold",
              fill: "#2c3e50",
              align: "center"
            }
          },
          bullets: {
            required: true,
            count: { min: 2, max: 4 },
            maxWordsPerBullet: 12,
            konva: {
              startX: 60,
              startY: 170,
              width: 840,
              fontSize: 18,
              fill: "#34495e",
              lineHeight: 1.6,
              spacing: 35
            }
          },
          thankYou: {
            required: true,
            konva: {
              x: 0,
              y: 460,
              width: 960,
              fontSize: 28,
              fontWeight: "500",
              fill: "#ffffff",
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
      "conclusion-card": {
        name: "Card Conclusion",
        canvas: { width: 960, height: 540 },
        structure: {
          title: {
            required: true,
            maxWords: 6,
            konva: {
              x: 60,
              y: 60,
              width: 840,
              fontSize: 38,
              fontWeight: "bold",
              fill: "#2c3e50",
              align: "center"
            }
          },
          bullets: {
            required: true,
            count: { min: 2, max: 4 },
            maxWordsPerBullet: 12,
            konva: {
              startX: 60,
              startY: 170,
              width: 840,
              fontSize: 18,
              fill: "#34495e",
              lineHeight: 1.6,
              spacing: 35
            }
          },
          thankYou: {
            required: true,
            konva: {
              x: 0,
              y: 460,
              width: 960,
              fontSize: 28,
              fontWeight: "500",
              fill: "#ffffff",
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
      "conclusion-gradient": {
        name: "Gradient Conclusion",
        canvas: { width: 960, height: 540 },
        structure: {
          title: {
            required: true,
            maxWords: 6,
            konva: {
              x: 60,
              y: 60,
              width: 840,
              fontSize: 38,
              fontWeight: "bold",
              fill: "#2c3e50",
              align: "center"
            }
          },
          bullets: {
            required: true,
            count: { min: 2, max: 4 },
            maxWordsPerBullet: 12,
            konva: {
              startX: 60,
              startY: 170,
              width: 840,
              fontSize: 18,
              fill: "#34495e",
              lineHeight: 1.6,
              spacing: 35
            }
          },
          thankYou: {
            required: true,
            konva: {
              x: 0,
              y: 460,
              width: 960,
              fontSize: 28,
              fontWeight: "500",
              fill: "#ffffff",
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
      "conclusion-minimal": {
        name: "Minimal Conclusion",
        canvas: { width: 960, height: 540 },
        structure: {
          title: {
            required: true,
            maxWords: 6,
            konva: {
              x: 60,
              y: 60,
              width: 840,
              fontSize: 38,
              fontWeight: "bold",
              fill: "#2c3e50",
              align: "center"
            }
          },
          bullets: {
            required: true,
            count: { min: 2, max: 4 },
            maxWordsPerBullet: 12,
            konva: {
              startX: 60,
              startY: 170,
              width: 840,
              fontSize: 18,
              fill: "#34495e",
              lineHeight: 1.6,
              spacing: 35
            }
          },
          thankYou: {
            required: true,
            konva: {
              x: 0,
              y: 460,
              width: 960,
              fontSize: 28,
              fontWeight: "500",
              fill: "#ffffff",
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
      }
    }
  }
};

// ============= TEMPLATE SELECTION LOGIC =============

function selectTemplate(slideIndex, totalSlides, slideType = null, variant = null) {
  if (slideType && variant) {
    return SLIDE_TEMPLATES[slideType]?.variants[variant] || SLIDE_TEMPLATES["content-right-image"].variants["content-classic"];
  }

  if (slideType) {
    const template = SLIDE_TEMPLATES[slideType];
    if (template) {
      // Return first variant as default
      const firstVariant = Object.keys(template.variants)[0];
      return template.variants[firstVariant];
    }
    return SLIDE_TEMPLATES["content-right-image"].variants["content-classic"];
  }

  // First slide is always a cover
  if (slideIndex === 0) {
    return SLIDE_TEMPLATES["cover-hero"].variants["hero-gradient"];
  }

  // Last slide logic
  if (slideIndex === totalSlides - 1) {
    if (totalSlides === 5) {
      return SLIDE_TEMPLATES["call-to-action"].variants["cta-classic"];
    } else {
      return SLIDE_TEMPLATES["conclusion"].variants["conclusion-classic"];
    }
  }

  // Middle slides rotation
  const contentTemplates = [
    "content-right-image",
    "content-left-image", 
    "content-split"
  ];
  
  const templateIndex = (slideIndex - 1) % contentTemplates.length;
  const templateName = contentTemplates[templateIndex];
  return SLIDE_TEMPLATES[templateName].variants[Object.keys(SLIDE_TEMPLATES[templateName].variants)[0]];
}

// ============= LAYOUT VARIANT GENERATION =============

function generateLayoutVariants(slideType, slideData) {
  const template = SLIDE_TEMPLATES[slideType];
  if (!template) return [];

  const variants = [];
  const variantNames = Object.keys(template.variants);

  variantNames.forEach(variantName => {
    const variant = template.variants[variantName];
    const layout = createLayoutFromTemplate(variant, slideData);
    variants.push({
      name: variantName,
      layout: layout
    });
  });

  return variants;
}

function createLayoutFromTemplate(template, slideData) {
  const layout = {
    elements: []
  };

  // Add title
  if (template.structure.title && slideData.title) {
    layout.elements.push({
      konva_component: "Konva.Text",
      element_id: uuidv4(),
      element_type: "text",
      text: slideData.title,
      properties: {
        ...template.structure.title.konva,
        id: `title-${uuidv4()}`
      }
    });
  }

  // Add subtitle
  if (template.structure.subtitle && slideData.subtitle) {
    layout.elements.push({
      konva_component: "Konva.Text",
      element_id: uuidv4(),
      element_type: "text",
      text: slideData.subtitle,
      properties: {
        ...template.structure.subtitle.konva,
        id: `subtitle-${uuidv4()}`
      }
    });
  }

  // Add bullets
  if (template.structure.bullets && slideData.content?.length > 0) {
    const bulletConfig = template.structure.bullets.konva;
    slideData.content.forEach((bullet, i) => {
      layout.elements.push({
        konva_component: "Konva.Text",
        element_id: uuidv4(),
        element_type: "bullet_point",
        text: `• ${bullet}`,
        properties: {
          x: bulletConfig.startX,
          y: bulletConfig.startY + (i * bulletConfig.spacing),
          width: bulletConfig.width,
          fontSize: bulletConfig.fontSize,
          fill: bulletConfig.fill,
          lineHeight: bulletConfig.lineHeight,
          id: `bullet-${i}-${uuidv4()}`
        }
      });
    });
  }

  // Add split bullets
  if (template.structure.leftBullets && template.structure.rightBullets) {
    const leftBullets = slideData.content?.slice(0, Math.ceil(slideData.content.length / 2)) || [];
    const rightBullets = slideData.content?.slice(Math.ceil(slideData.content.length / 2)) || [];

    const leftConfig = template.structure.leftBullets.konva;
    leftBullets.forEach((bullet, i) => {
      layout.elements.push({
        konva_component: "Konva.Text",
        element_id: uuidv4(),
        element_type: "bullet_point",
        text: `• ${bullet}`,
        properties: {
          x: leftConfig.startX,
          y: leftConfig.startY + (i * leftConfig.spacing),
          width: leftConfig.width,
          fontSize: leftConfig.fontSize,
          fill: leftConfig.fill,
          lineHeight: leftConfig.lineHeight,
          id: `left-bullet-${i}-${uuidv4()}`
        }
      });
    });

    const rightConfig = template.structure.rightBullets.konva;
    rightBullets.forEach((bullet, i) => {
      layout.elements.push({
        konva_component: "Konva.Text",
        element_id: uuidv4(),
        element_type: "bullet_point",
        text: `• ${bullet}`,
        properties: {
          x: rightConfig.startX,
          y: rightConfig.startY + (i * rightConfig.spacing),
          width: rightConfig.width,
          fontSize: rightConfig.fontSize,
          fill: rightConfig.fill,
          lineHeight: rightConfig.lineHeight,
          id: `right-bullet-${i}-${uuidv4()}`
        }
      });
    });
  }

  // Add CTA button
  if (template.structure.cta && slideData.cta) {
    layout.elements.push({
      konva_component: "Konva.Label",
      element_id: uuidv4(),
      element_type: "cta_button",
      text: slideData.cta,
      properties: {
        ...template.structure.cta.konva,
        id: `cta-${uuidv4()}`
      }
    });
  }

  // Add description
  if (template.structure.description && slideData.description) {
    layout.elements.push({
      konva_component: "Konva.Text",
      element_id: uuidv4(),
      element_type: "text",
      text: slideData.description,
      properties: {
        ...template.structure.description.konva,
        id: `description-${uuidv4()}`
      }
    });
  }

  return layout;
}

module.exports = { 
  SLIDE_TEMPLATES, 
  selectTemplate, 
  generateLayoutVariants,
  createLayoutFromTemplate
};