// layouts/splitContentSlide.ts
import { v4 as uuidv4 } from "uuid";

const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.startsWith('#') ? hex : `#${hex}`;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const createSplitContentSlide = {
  variant1: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => {
    const bullets = slide.elements?.filter((el: any) => el.element_type === "bullet_point") || [];
    const leftBullets = bullets.slice(0, Math.ceil(bullets.length / 2));
    const rightBullets = bullets.slice(Math.ceil(bullets.length / 2));
    
    return {
      ...slide,
      slide_title: {
        text: slide.slide_title?.text || "Split Content",
        konva_component: "Text",
        properties: {
          x: 60, y: 40, width: SLIDE_WIDTH - 120, height: 60,
          fontSize: 36, fontFamily: "Raleway", fontWeight: "600", fill: textColor, align: "center"
        }
      },
      elements: [
        { element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
        },
        // Left column bullets
        ...leftBullets.map((bullet: any, index: number) => ({
          element_type: "bullet_point", text: bullet.text,
          konva_component: "Text", properties: {
            x: 80, y: 120 + (index * 70), width: SLIDE_WIDTH/2 - 120, height: 50,
            fontSize: 16, fontFamily: "Raleway", fontWeight: "400", fill: textColor
          }
        })),
        // Right column bullets
        ...rightBullets.map((bullet: any, index: number) => ({
          element_type: "bullet_point", text: bullet.text,
          konva_component: "Text", properties: {
            x: SLIDE_WIDTH/2 + 40, y: 120 + (index * 70), width: SLIDE_WIDTH/2 - 120, height: 50,
            fontSize: 16, fontFamily: "Raleway", fontWeight: "400", fill: textColor
          }
        })),
        // Center divider
        {
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: {
            x: SLIDE_WIDTH/2 - 1, y: 100, width: 2, height: SLIDE_HEIGHT - 200,
            fill: hexToRgba(colors.primary, 0.3)
          }
        }
      ]
    };
  },

  variant2: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Two Column Layout",
      konva_component: "Text",
      properties: {
        x: 60, y: 60, width: SLIDE_WIDTH - 120, height: 50,
        fontSize: 32, fontFamily: "Raleway", fontWeight: "600", fill: textColor, align: "center"
      }
    },
    elements: [
      { element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
      },
      // Column backgrounds
      {
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: 40, y: 120, width: SLIDE_WIDTH/2 - 60, height: SLIDE_HEIGHT - 200,
          fill: hexToRgba(colors.primary, 0.05), cornerRadius: 12
        }
      },
      {
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: SLIDE_WIDTH/2 + 20, y: 120, width: SLIDE_WIDTH/2 - 60, height: SLIDE_HEIGHT - 200,
          fill: hexToRgba(colors.secondary, 0.05), cornerRadius: 12
        }
      }
    ]
  }),

  variant3: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Comparison View",
      konva_component: "Text",
      properties: {
        x: 60, y: 80, width: SLIDE_WIDTH - 120, height: 40,
        fontSize: 28, fontFamily: "Raleway", fontWeight: "500", fill: textColor, align: "center"
      }
    },
    elements: [
      { element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
      },
      // Modern divider
      {
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: SLIDE_WIDTH/2 - 2, y: 100, width: 4, height: SLIDE_HEIGHT - 200,
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: 0, y: SLIDE_HEIGHT - 200 },
          fillLinearGradientColorStops: [0, colors.primary, 0.5, colors.accent, 1, colors.secondary]
        }
      }
    ]
  }),

  variant4: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Dual Perspective",
      konva_component: "Text",
      properties: {
        x: 60, y: 70, width: SLIDE_WIDTH - 120, height: 60,
        fontSize: 34, fontFamily: "Raleway", fontWeight: "700", fill: textColor, align: "center"
      }
    },
    elements: [
      { element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
      },
      // Header accent
      {
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: SLIDE_WIDTH/2 - 100, y: 130, width: 200, height: 4,
          fill: colors.accent, cornerRadius: 2
        }
      }
    ]
  }),

  variant5: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Balanced Content",
      konva_component: "Text",
      properties: {
        x: 60, y: 90, width: SLIDE_WIDTH - 120, height: 50,
        fontSize: 30, fontFamily: "Raleway", fontWeight: "600", fill: textColor, align: "center"
      }
    },
    elements: [
      { element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
      },
      // Decorative corner elements
      {
        element_type: "shape", konva_component: "Circle", shape_id: uuidv4(),
        properties: { x: 100, y: 100, radius: 30, fill: hexToRgba(colors.primary, 0.2) }
      },
      {
        element_type: "shape", konva_component: "Circle", shape_id: uuidv4(),
        properties: { x: SLIDE_WIDTH - 100, y: SLIDE_HEIGHT - 100, radius: 30, fill: hexToRgba(colors.accent, 0.2) }
      }
    ]
  })
};