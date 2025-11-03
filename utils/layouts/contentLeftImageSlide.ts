// layouts/contentLeftImageSlide.ts
import { v4 as uuidv4 } from "uuid";

const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.startsWith('#') ? hex : `#${hex}`;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const createContentLeftImageSlide = {
  variant1: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => {
    const bullets = slide.elements?.filter((el: any) => el.element_type === "bullet_point") || [];
    
    return {
      ...slide,
      slide_title: {
        text: slide.slide_title?.text || "Left Image Layout",
        konva_component: "Text",
        properties: {
          x: SLIDE_WIDTH/2 + 60, y: 40, width: SLIDE_WIDTH/2 - 120, height: 60,
          fontSize: 32, fontFamily: "Raleway", fontWeight: "600", fill: textColor
        }
      },
      elements: [
        { element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
        },
        // Image area
        {
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: {
            x: 60, y: 100, width: SLIDE_WIDTH/2 - 100, height: SLIDE_HEIGHT - 200,
            fill: hexToRgba(colors.primary, 0.05), cornerRadius: 16
          }
        },
        // Content bullets
        ...bullets.slice(0, 4).map((bullet: any, index: number) => ({
          element_type: "bullet_point", text: bullet.text,
          konva_component: "Text", properties: {
            x: SLIDE_WIDTH/2 + 80, y: 120 + (index * 70), width: SLIDE_WIDTH/2 - 160, height: 50,
            fontSize: 16, fontFamily: "Raleway", fontWeight: "400", fill: textColor, lineHeight: 1.3
          }
        }))
      ]
    };
  },

  variant2: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Visual First",
      konva_component: "Text",
      properties: {
        x: SLIDE_WIDTH/2 + 40, y: 60, width: SLIDE_WIDTH/2 - 80, height: 50,
        fontSize: 28, fontFamily: "Raleway", fontWeight: "600", fill: textColor
      }
    },
    elements: [
      { element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
      },
      // Prominent image frame
      {
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: 40, y: 80, width: SLIDE_WIDTH/2 - 40, height: SLIDE_HEIGHT - 160,
          fill: "transparent", cornerRadius: 12,
          stroke: colors.primary, strokeWidth: 4
        }
      }
    ]
  }),

  variant3: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Balanced Layout",
      konva_component: "Text",
      properties: {
        x: SLIDE_WIDTH/2 + 60, y: 80, width: SLIDE_WIDTH/2 - 120, height: 40,
        fontSize: 26, fontFamily: "Raleway", fontWeight: "500", fill: textColor
      }
    },
    elements: [
      { element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
      },
      // Subtle separator
      {
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: SLIDE_WIDTH/2 - 1, y: 100, width: 2, height: SLIDE_HEIGHT - 200,
          fill: hexToRgba(colors.accent, 0.3)
        }
      }
    ]
  }),

  variant4: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Content Focus",
      konva_component: "Text",
      properties: {
        x: SLIDE_WIDTH/2 + 50, y: 70, width: SLIDE_WIDTH/2 - 100, height: 60,
        fontSize: 30, fontFamily: "Raleway", fontWeight: "700", fill: textColor
      }
    },
    elements: [
      { element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
      },
      // Image placeholder with accent
      {
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: 80, y: 120, width: SLIDE_WIDTH/2 - 140, height: 200,
          fill: hexToRgba(colors.secondary, 0.1), cornerRadius: 8
        }
      }
    ]
  }),

  variant5: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Modern Design",
      konva_component: "Text",
      properties: {
        x: SLIDE_WIDTH/2 + 40, y: 90, width: SLIDE_WIDTH/2 - 80, height: 50,
        fontSize: 24, fontFamily: "Raleway", fontWeight: "600", fill: textColor
      }
    },
    elements: [
      { element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
      },
      // Decorative element
      {
        element_type: "shape", konva_component: "Circle", shape_id: uuidv4(),
        properties: {
          x: 200, y: SLIDE_HEIGHT/2, radius: 80,
          fill: hexToRgba(colors.accent, 0.2)
        }
      }
    ]
  })
};