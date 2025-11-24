// layouts/conclusionSlide.ts
import { v4 as uuidv4 } from "uuid";

const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.startsWith('#') ? hex : `#${hex}`;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const createConclusionSlide = {
  variant1: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Thank You",
      konva_component: "Text",
      properties: {
        x: SLIDE_WIDTH/2 - 200, y: SLIDE_HEIGHT/2 - 60, width: 400, height: 120,
        fontSize: 48, fontFamily: "Raleway", fontWeight: "700",
        fill: textColor, align: "center", lineHeight: 1.2
      }
    },
    elements: [
      { element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
      },
      // Gradient overlay
      {
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT,
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: SLIDE_WIDTH, y: SLIDE_HEIGHT },
          fillLinearGradientColorStops: [0, hexToRgba(colors.primary, 0.1), 1, hexToRgba(colors.accent, 0.1)]
        }
      }
    ]
  }),

  variant2: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Key Takeaways",
      konva_component: "Text",
      properties: {
        x: 80, y: 80, width: SLIDE_WIDTH - 160, height: 60,
        fontSize: 40, fontFamily: "Raleway", fontWeight: "600", fill: textColor, align: "center"
      }
    },
    elements: [
      { element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
      },
      // Summary cards
      ...slide.elements?.filter((el: any) => el.element_type === "bullet_point").slice(0, 3).map((bullet: any, index: number) => ({
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: 120 + (index * 240), y: 200, width: 200, height: 120,
          fill: colors.surface, cornerRadius: 12,
          shadowColor: hexToRgba(colors.primary, 0.1), shadowBlur: 15, shadowOffsetY: 5
        }
      }))
    ]
  }),

  variant3: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Questions?",
      konva_component: "Text",
      properties: {
        x: SLIDE_WIDTH/2 - 150, y: SLIDE_HEIGHT/2 - 80, width: 300, height: 160,
        fontSize: 52, fontFamily: "Raleway", fontWeight: "800",
        fill: textColor, align: "center", lineHeight: 1.1
      }
    },
    elements: [
      { element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
      },
      // Contact info
      {
        element_type: "text", text: "contact@example.com",
        konva_component: "Text", properties: {
          x: SLIDE_WIDTH/2 - 100, y: SLIDE_HEIGHT/2 + 60, width: 200, height: 30,
          fontSize: 18, fontFamily: "Raleway", fontWeight: "400",
          fill: hexToRgba(textColor, 0.7), align: "center"
        }
      }
    ]
  }),

  variant4: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Next Steps",
      konva_component: "Text",
      properties: {
        x: 100, y: 100, width: SLIDE_WIDTH - 200, height: 50,
        fontSize: 36, fontFamily: "Raleway", fontWeight: "600", fill: textColor
      }
    },
    elements: [
      { element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
      },
      // Timeline style
      {
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: 120, y: 180, width: 4, height: 200,
          fill: colors.accent
        }
      }
    ]
  }),

  variant5: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Thank You",
      konva_component: "Text",
      properties: {
        x: 0, y: SLIDE_HEIGHT/2 - 30, width: SLIDE_WIDTH, height: 60,
        fontSize: 42, fontFamily: "Raleway", fontWeight: "700",
        fill: textColor, align: "center"
      }
    },
    elements: [
      // Full gradient background
      {
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT,
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: SLIDE_WIDTH, y: SLIDE_HEIGHT },
          fillLinearGradientColorStops: [0, colors.primary, 1, colors.secondary]
        }
      }
    ]
  })
};