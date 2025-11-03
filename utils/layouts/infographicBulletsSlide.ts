// layouts/infographicBulletsSlide.ts
import { v4 as uuidv4 } from "uuid";

const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.startsWith('#') ? hex : `#${hex}`;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const createInfographicBulletsSlide = {
  variant1: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => {
    const bullets = slide.elements?.filter((el: any) => el.element_type === "bullet_point") || [];
    
    return {
      ...slide,
      slide_title: {
        text: slide.slide_title?.text || "Infographic",
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
        // Icon bullets
        ...bullets.slice(0, 4).map((bullet: any, index: number) => [
          // Icon circle
          {
            element_type: "shape", konva_component: "Circle", shape_id: uuidv4(),
            properties: {
              x: 120, y: 150 + (index * 100), radius: 20,
              fill: [colors.primary, colors.secondary, colors.accent, colors.primary][index]
            }
          },
          // Bullet text
          {
            element_type: "bullet_point", text: bullet.text,
            konva_component: "Text", properties: {
              x: 160, y: 140 + (index * 100), width: SLIDE_WIDTH - 200, height: 40,
              fontSize: 18, fontFamily: "Raleway", fontWeight: "500", fill: textColor
            }
          }
        ]).flat()
      ]
    };
  },

  variant2: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Key Points",
      konva_component: "Text",
      properties: {
        x: 60, y: 60, width: SLIDE_WIDTH - 120, height: 50,
        fontSize: 32, fontFamily: "Raleway", fontWeight: "600", fill: textColor
      }
    },
    elements: [
      { element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
      },
      // Numbered list
      ...slide.elements?.filter((el: any) => el.element_type === "bullet_point").slice(0, 5).map((bullet: any, index: number) => ({
        element_type: "text", text: `${index + 1}`,
        konva_component: "Text", properties: {
          x: 100, y: 130 + (index * 70), width: 30, height: 30,
          fontSize: 20, fontFamily: "Raleway", fontWeight: "700",
          fill: colors.accent, align: "center"
        }
      }))
    ]
  }),

  variant3: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Visual List",
      konva_component: "Text",
      properties: {
        x: 80, y: 80, width: SLIDE_WIDTH - 160, height: 40,
        fontSize: 28, fontFamily: "Raleway", fontWeight: "500", fill: textColor, align: "center"
      }
    },
    elements: [
      { element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
      },
      // Checkmark style
      ...slide.elements?.filter((el: any) => el.element_type === "bullet_point").slice(0, 4).map((bullet: any, index: number) => ({
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: 120, y: 150 + (index * 80), width: 20, height: 20,
          fill: colors.secondary, cornerRadius: 4
        }
      }))
    ]
  }),

  variant4: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Feature List",
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
      // Card style bullets
      ...slide.elements?.filter((el: any) => el.element_type === "bullet_point").slice(0, 3).map((bullet: any, index: number) => ({
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: 120 + (index * 240), y: 180, width: 200, height: 100,
          fill: hexToRgba(colors.primary, 0.1), cornerRadius: 12
        }
      }))
    ]
  }),

  variant5: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Modern List",
      konva_component: "Text",
      properties: {
        x: 80, y: 90, width: SLIDE_WIDTH - 160, height: 50,
        fontSize: 30, fontFamily: "Raleway", fontWeight: "600", fill: textColor, align: "center"
      }
    },
    elements: [
      { element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
      },
      // Line connectors
      {
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: 140, y: 160, width: 2, height: 200,
          fill: hexToRgba(colors.accent, 0.5)
        }
      }
    ]
  })
};