import { v4 as uuidv4 } from "uuid";

const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.startsWith('#') ? hex : `#${hex}`;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const createGradientBlob = (
  x: number, 
  y: number, 
  radiusX: number, 
  radiusY: number, 
  color1: string, 
  color2: string, 
  opacity: number
) => ({
  element_type: "shape",
  konva_component: "Ellipse",
  shape_id: uuidv4(),
  properties: {
    x, y, radiusX, radiusY,
    fillRadialGradientStartPoint: { x: 0, y: 0 },
    fillRadialGradientEndPoint: { x: 0, y: 0 },
    fillRadialGradientStartRadius: 0,
    fillRadialGradientEndRadius: Math.max(radiusX, radiusY),
    fillRadialGradientColorStops: [0, hexToRgba(color1, opacity), 1, hexToRgba(color2, 0)],
    shadowColor: hexToRgba(color1, 0.12),
    shadowBlur: 25,
    shadowOffsetY: 12,
    opacity: 0.9
  }
});

export const createCoverSlide = {
  // Variant 1: Floating Orbs with Glassmorphism
  variant1: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Executive Presentation",
      konva_component: "Text",
      properties: {
        x: 60,
        y: 160,
        width: SLIDE_WIDTH - 120,
        height: 140,
        fontSize: 64,
        fontFamily: "Raleway, sans-serif",
        fontWeight: "900",
        fill: textColor,
        align: "center",
        lineHeight: 1.15,
        shadowColor: hexToRgba(textColor, 0.3),
        shadowBlur: 20,
        shadowOffsetY: 10,
        letterSpacing: 2
      }
    },
    subtitle: slide.subtitle ? {
      text: slide.subtitle.text,
      konva_component: "Text",
      properties: {
        x: 80,
        y: 320,
        width: SLIDE_WIDTH - 160,
        height: 80,
        fontSize: 26,
        fontFamily: "Raleway, sans-serif",
        fontWeight: "400",
        fill: hexToRgba(textColor, 0.88),
        align: "center",
        lineHeight: 1.5
      }
    } : undefined,
    elements: [
      // Base background with gradient
      {
        element_type: "shape",
        konva_component: "Rect",
        shape_id: uuidv4(),
        properties: {
          x: 0,
          y: 0,
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: SLIDE_WIDTH, y: SLIDE_HEIGHT },
          fillLinearGradientColorStops: [
            0, colors.background,
            0.5, hexToRgba(colors.primary, 0.05),
            1, colors.background
          ],
          cornerRadius: 0
        }
      },
      // Large floating orb - top left
      createGradientBlob(180, 120, 280, 240, colors.primary, colors.accent, 0.22),
      // Medium orb - bottom right
      createGradientBlob(SLIDE_WIDTH - 200, SLIDE_HEIGHT - 100, 320, 260, colors.secondary, colors.accent, 0.18),
      // Small accent orb - top right
      createGradientBlob(SLIDE_WIDTH - 120, 80, 160, 140, colors.accent, colors.primary, 0.25),
      // Glassmorphic overlay panel
      {
        element_type: "shape",
        konva_component: "Rect",
        shape_id: uuidv4(),
        properties: {
          x: SLIDE_WIDTH / 2 - 400,
          y: 140,
          width: 800,
          height: 280,
          fill: hexToRgba("#ffffff", 0.08),
          cornerRadius: 32,
          stroke: hexToRgba("#ffffff", 0.2),
          strokeWidth: 2,
          shadowColor: "rgba(0,0,0,0.08)",
          shadowBlur: 40,
          shadowOffsetY: 20
        }
      }
    ],
    background: { type: "solid", color: colors.background }
  }),

  // Variant 2: Diagonal Split with Wave
  variant2: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Modern Vision",
      konva_component: "Text",
      properties: {
        x: 80,
        y: 180,
        width: 520,
        height: 120,
        fontSize: 56,
        fontFamily: "Raleway, sans-serif",
        fontWeight: "800",
        fill: "#ffffff",
        align: "left",
        lineHeight: 1.2,
        shadowColor: "rgba(0,0,0,0.4)",
        shadowBlur: 25,
        shadowOffsetY: 12,
        letterSpacing: 1
      }
    },
    subtitle: slide.subtitle ? {
      text: slide.subtitle.text,
      konva_component: "Text",
      properties: {
        x: 80,
        y: 320,
        width: 480,
        height: 70,
        fontSize: 22,
        fontFamily: "Raleway, sans-serif",
        fontWeight: "400",
        fill: hexToRgba("#ffffff", 0.95),
        align: "left",
        lineHeight: 1.45
      }
    } : undefined,
    elements: [
      // Base background
      {
        element_type: "shape",
        konva_component: "Rect",
        shape_id: uuidv4(),
        properties: {
          x: 0,
          y: 0,
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          fill: colors.background
        }
      },
      // Diagonal gradient section
      {
        element_type: "shape",
        konva_component: "Rect",
        shape_id: uuidv4(),
        properties: {
          x: -100,
          y: -50,
          width: 700,
          height: SLIDE_HEIGHT + 100,
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: 700, y: SLIDE_HEIGHT },
          fillLinearGradientColorStops: [
            0, colors.primary,
            0.6, colors.secondary,
            1, colors.accent
          ],
          rotation: 8,
          shadowColor: hexToRgba(colors.primary, 0.35),
          shadowBlur: 50,
          shadowOffsetX: 20
        }
      },
      // Curved wave overlay
      {
        element_type: "shape",
        konva_component: "Line",
        shape_id: uuidv4(),
        properties: {
          points: [
            550, 0,
            580, 120,
            560, 240,
            590, 360,
            570, 480,
            600, SLIDE_HEIGHT
          ],
          stroke: hexToRgba("#ffffff", 0.25),
          strokeWidth: 80,
          tension: 0.5,
          lineCap: "round",
          shadowColor: hexToRgba("#ffffff", 0.15),
          shadowBlur: 30
        }
      },
      // Decorative circles on right
      {
        element_type: "shape",
        konva_component: "Circle",
        shape_id: uuidv4(),
        properties: {
          x: SLIDE_WIDTH - 120,
          y: 160,
          radius: 60,
          fill: hexToRgba(colors.accent, 0.85),
          shadowColor: hexToRgba(colors.accent, 0.4),
          shadowBlur: 20,
          shadowOffsetY: 10
        }
      },
      {
        element_type: "shape",
        konva_component: "Circle",
        shape_id: uuidv4(),
        properties: {
          x: SLIDE_WIDTH - 180,
          y: 320,
          radius: 40,
          stroke: hexToRgba(colors.primary, 0.7),
          strokeWidth: 4
        }
      }
    ],
    background: { type: "solid", color: colors.background }
  }),

  // Variant 3: Geometric Layers with Depth
  variant3: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Strategic Excellence",
      konva_component: "Text",
      properties: {
        x: 100,
        y: 200,
        width: SLIDE_WIDTH - 200,
        height: 100,
        fontSize: 52,
        fontFamily: "Raleway, sans-serif",
        fontWeight: "800",
        fill: textColor,
        align: "center",
        lineHeight: 1.15,
        shadowColor: hexToRgba(textColor, 0.25),
        shadowBlur: 18,
        shadowOffsetY: 8,
        letterSpacing: 1.5
      }
    },
    subtitle: slide.subtitle ? {
      text: slide.subtitle.text,
      konva_component: "Text",
      properties: {
        x: 120,
        y: 320,
        width: SLIDE_WIDTH - 240,
        height: 60,
        fontSize: 24,
        fontFamily: "Raleway, sans-serif",
        fontWeight: "400",
        fill: hexToRgba(textColor, 0.85),
        align: "center",
        lineHeight: 1.4
      }
    } : undefined,
    elements: [
      // Background
      {
        element_type: "shape",
        konva_component: "Rect",
        shape_id: uuidv4(),
        properties: {
          x: 0,
          y: 0,
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          fill: colors.background
        }
      },
      // Layer 1: Large rotated rectangle (back)
      {
        element_type: "shape",
        konva_component: "Rect",
        shape_id: uuidv4(),
        properties: {
          x: SLIDE_WIDTH / 2,
          y: SLIDE_HEIGHT / 2,
          width: 600,
          height: 400,
          offsetX: 300,
          offsetY: 200,
          rotation: -12,
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: 600, y: 400 },
          fillLinearGradientColorStops: [
            0, hexToRgba(colors.primary, 0.15),
            1, hexToRgba(colors.secondary, 0.08)
          ],
          cornerRadius: 28,
          shadowColor: hexToRgba(colors.primary, 0.12),
          shadowBlur: 35,
          shadowOffsetY: 15
        }
      },
      // Layer 2: Medium rectangle
      {
        element_type: "shape",
        konva_component: "Rect",
        shape_id: uuidv4(),
        properties: {
          x: SLIDE_WIDTH / 2,
          y: SLIDE_HEIGHT / 2,
          width: 500,
          height: 340,
          offsetX: 250,
          offsetY: 170,
          rotation: 6,
          fill: hexToRgba(colors.accent, 0.18),
          cornerRadius: 24,
          shadowColor: hexToRgba(colors.accent, 0.15),
          shadowBlur: 30,
          shadowOffsetY: 12
        }
      },
      // Layer 3: Top card with content
      {
        element_type: "shape",
        konva_component: "Rect",
        shape_id: uuidv4(),
        properties: {
          x: SLIDE_WIDTH / 2 - 320,
          y: SLIDE_HEIGHT / 2 - 140,
          width: 640,
          height: 280,
          fill: hexToRgba(colors.surface || "#ffffff", 0.95),
          cornerRadius: 32,
          stroke: hexToRgba(colors.primary, 0.2),
          strokeWidth: 2,
          shadowColor: "rgba(0,0,0,0.15)",
          shadowBlur: 40,
          shadowOffsetY: 20
        }
      },
      // Accent line decoration
      {
        element_type: "shape",
        konva_component: "Rect",
        shape_id: uuidv4(),
        properties: {
          x: SLIDE_WIDTH / 2 - 80,
          y: 180,
          width: 160,
          height: 6,
          fill: colors.accent,
          cornerRadius: 3,
          shadowColor: hexToRgba(colors.accent, 0.4),
          shadowBlur: 12
        }
      }
    ],
    background: { type: "solid", color: colors.background }
  }),

  // Variant 4: Circular Radial Design
  variant4: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Innovation Hub",
      konva_component: "Text",
      properties: {
        x: 80,
        y: 210,
        width: SLIDE_WIDTH - 160,
        height: 100,
        fontSize: 58,
        fontFamily: "Raleway, sans-serif",
        fontWeight: "900",
        fill: textColor,
        align: "center",
        lineHeight: 1.1,
        shadowColor: hexToRgba(textColor, 0.28),
        shadowBlur: 22,
        shadowOffsetY: 10,
        letterSpacing: 1.8
      }
    },
    subtitle: slide.subtitle ? {
      text: slide.subtitle.text,
      konva_component: "Text",
      properties: {
        x: 100,
        y: 330,
        width: SLIDE_WIDTH - 200,
        height: 60,
        fontSize: 23,
        fontFamily: "Raleway, sans-serif",
        fontWeight: "400",
        fill: hexToRgba(textColor, 0.87),
        align: "center",
        lineHeight: 1.4
      }
    } : undefined,
    elements: [
      // Background gradient
      {
        element_type: "shape",
        konva_component: "Rect",
        shape_id: uuidv4(),
        properties: {
          x: 0,
          y: 0,
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          fillRadialGradientStartPoint: { x: SLIDE_WIDTH / 2, y: SLIDE_HEIGHT / 2 },
          fillRadialGradientEndPoint: { x: SLIDE_WIDTH / 2, y: SLIDE_HEIGHT / 2 },
          fillRadialGradientStartRadius: 0,
          fillRadialGradientEndRadius: Math.max(SLIDE_WIDTH, SLIDE_HEIGHT) / 1.5,
          fillRadialGradientColorStops: [
            0, hexToRgba(colors.primary, 0.12),
            0.6, hexToRgba(colors.background, 1),
            1, colors.background
          ]
        }
      },
      // Central large circle with gradient
      {
        element_type: "shape",
        konva_component: "Circle",
        shape_id: uuidv4(),
        properties: {
          x: SLIDE_WIDTH / 2,
          y: SLIDE_HEIGHT / 2,
          radius: 220,
          fillRadialGradientStartPoint: { x: 0, y: 0 },
          fillRadialGradientEndPoint: { x: 0, y: 0 },
          fillRadialGradientStartRadius: 0,
          fillRadialGradientEndRadius: 220,
          fillRadialGradientColorStops: [
            0, hexToRgba(colors.accent, 0.25),
            0.7, hexToRgba(colors.secondary, 0.12),
            1, "transparent"
          ],
          shadowColor: hexToRgba(colors.accent, 0.18),
          shadowBlur: 45
        }
      },
      // Ring 1
      {
        element_type: "shape",
        konva_component: "Circle",
        shape_id: uuidv4(),
        properties: {
          x: SLIDE_WIDTH / 2,
          y: SLIDE_HEIGHT / 2,
          radius: 180,
          stroke: hexToRgba(colors.primary, 0.3),
          strokeWidth: 3,
          dash: [12, 8]
        }
      },
      // Ring 2
      {
        element_type: "shape",
        konva_component: "Circle",
        shape_id: uuidv4(),
        properties: {
          x: SLIDE_WIDTH / 2,
          y: SLIDE_HEIGHT / 2,
          radius: 140,
          stroke: hexToRgba(colors.accent, 0.4),
          strokeWidth: 2
        }
      },
      // Decorative dots around
      {
        element_type: "shape",
        konva_component: "Circle",
        shape_id: uuidv4(),
        properties: {
          x: SLIDE_WIDTH / 2 + 200,
          y: SLIDE_HEIGHT / 2 - 80,
          radius: 12,
          fill: colors.accent,
          shadowColor: hexToRgba(colors.accent, 0.5),
          shadowBlur: 15
        }
      },
      {
        element_type: "shape",
        konva_component: "Circle",
        shape_id: uuidv4(),
        properties: {
          x: SLIDE_WIDTH / 2 - 180,
          y: SLIDE_HEIGHT / 2 + 100,
          radius: 16,
          fill: colors.primary,
          shadowColor: hexToRgba(colors.primary, 0.5),
          shadowBlur: 18
        }
      }
    ],
    background: { type: "solid", color: colors.background }
  }),

  // Variant 5: Bold Gradient Immersion
  variant5: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Transform Tomorrow",
      konva_component: "Text",
      properties: {
        x: 70,
        y: 190,
        width: SLIDE_WIDTH - 140,
        height: 120,
        fontSize: 62,
        fontFamily: "Raleway, sans-serif",
        fontWeight: "900",
        fill: "#ffffff",
        align: "center",
        lineHeight: 1.15,
        shadowColor: "rgba(0,0,0,0.5)",
        shadowBlur: 30,
        shadowOffsetY: 15,
        letterSpacing: 2.5
      }
    },
    subtitle: slide.subtitle ? {
      text: slide.subtitle.text,
      konva_component: "Text",
      properties: {
        x: 90,
        y: 330,
        width: SLIDE_WIDTH - 180,
        height: 70,
        fontSize: 25,
        fontFamily: "Raleway, sans-serif",
        fontWeight: "300",
        fill: hexToRgba("#ffffff", 0.95),
        align: "center",
        lineHeight: 1.45,
        shadowColor: "rgba(0,0,0,0.3)",
        shadowBlur: 15
      }
    } : undefined,
    elements: [
      // Vibrant multi-stop gradient background
      {
        element_type: "shape",
        konva_component: "Rect",
        shape_id: uuidv4(),
        properties: {
          x: 0,
          y: 0,
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: SLIDE_WIDTH, y: SLIDE_HEIGHT },
          fillLinearGradientColorStops: [
            0, colors.primary,
            0.3, colors.secondary,
            0.6, colors.accent,
            1, hexToRgba(colors.primary, 0.9)
          ],
          shadowColor: "rgba(0,0,0,0.2)",
          shadowBlur: 60,
          shadowOffsetY: 30
        }
      },
      // Floating mesh overlay
      {
        element_type: "shape",
        konva_component: "Rect",
        shape_id: uuidv4(),
        properties: {
          x: 0,
          y: 0,
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          fillRadialGradientStartPoint: { x: SLIDE_WIDTH * 0.3, y: SLIDE_HEIGHT * 0.3 },
          fillRadialGradientEndPoint: { x: SLIDE_WIDTH * 0.3, y: SLIDE_HEIGHT * 0.3 },
          fillRadialGradientStartRadius: 0,
          fillRadialGradientEndRadius: SLIDE_WIDTH * 0.7,
          fillRadialGradientColorStops: [
            0, hexToRgba("#ffffff", 0.15),
            0.5, hexToRgba("#ffffff", 0.05),
            1, "transparent"
          ],
          opacity: 0.8
        }
      },
      // Organic blob shapes
      {
        element_type: "shape",
        konva_component: "Ellipse",
        shape_id: uuidv4(),
        properties: {
          x: SLIDE_WIDTH - 150,
          y: 120,
          radiusX: 180,
          radiusY: 140,
          fill: hexToRgba("#ffffff", 0.12),
          rotation: -25,
          shadowColor: hexToRgba("#ffffff", 0.25),
          shadowBlur: 40
        }
      },
      {
        element_type: "shape",
        konva_component: "Ellipse",
        shape_id: uuidv4(),
        properties: {
          x: 120,
          y: SLIDE_HEIGHT - 100,
          radiusX: 200,
          radiusY: 160,
          fill: hexToRgba("#000000", 0.08),
          rotation: 15,
          shadowColor: hexToRgba("#000000", 0.15),
          shadowBlur: 35
        }
      },
      // Accent line with glow
      {
        element_type: "shape",
        konva_component: "Rect",
        shape_id: uuidv4(),
        properties: {
          x: SLIDE_WIDTH / 2 - 100,
          y: 165,
          width: 200,
          height: 8,
          fill: "#ffffff",
          cornerRadius: 4,
          opacity: 0.9,
          shadowColor: "#ffffff",
          shadowBlur: 25
        }
      }
    ],
    background: {
      type: "linear",
      gradient: {
        start: colors.primary,
        end: colors.accent,
        stops: [0, colors.primary, 0.5, colors.secondary, 1, colors.accent]
      }
    }
  })
};