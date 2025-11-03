// layouts/comparisonSlide.ts
import { v4 as uuidv4 } from "uuid";

const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.startsWith('#') ? hex : `#${hex}`;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const createComparisonSlide = {
  variant1: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Comparison",
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
      // Two column layout
      {
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: 80, y: 120, width: SLIDE_WIDTH/2 - 120, height: SLIDE_HEIGHT - 200,
          fill: hexToRgba(colors.primary, 0.1), cornerRadius: 12
        }
      },
      {
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: SLIDE_WIDTH/2 + 40, y: 120, width: SLIDE_WIDTH/2 - 120, height: SLIDE_HEIGHT - 200,
          fill: hexToRgba(colors.secondary, 0.1), cornerRadius: 12
        }
      },
      // Column labels
      {
        element_type: "text", text: "Option A",
        konva_component: "Text", properties: {
          x: 80, y: 90, width: SLIDE_WIDTH/2 - 120, height: 30,
          fontSize: 20, fontFamily: "Raleway", fontWeight: "600",
          fill: colors.primary, align: "center"
        }
      },
      {
        element_type: "text", text: "Option B",
        konva_component: "Text", properties: {
          x: SLIDE_WIDTH/2 + 40, y: 90, width: SLIDE_WIDTH/2 - 120, height: 30,
          fontSize: 20, fontFamily: "Raleway", fontWeight: "600",
          fill: colors.secondary, align: "center"
        }
      }
    ]
  }),

  variant2: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Pros vs Cons",
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
      // Visual divider
      {
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: SLIDE_WIDTH/2 - 2, y: 100, width: 4, height: SLIDE_HEIGHT - 180,
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: 0, y: SLIDE_HEIGHT - 180 },
          fillLinearGradientColorStops: [0, colors.primary, 1, colors.accent]
        }
      }
    ]
  }),

  variant3: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Feature Comparison",
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
      // Comparison table style
      {
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: 100, y: 140, width: SLIDE_WIDTH - 200, height: 2,
          fill: hexToRgba(textColor, 0.2)
        }
      }
    ]
  }),

  variant4: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Before vs After",
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
      // Visual comparison areas
      {
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: 120, y: 150, width: 300, height: 200,
          fill: "transparent", cornerRadius: 8,
          stroke: colors.primary, strokeWidth: 3
        }
      },
      {
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: SLIDE_WIDTH - 420, y: 150, width: 300, height: 200,
          fill: "transparent", cornerRadius: 8,
          stroke: colors.accent, strokeWidth: 3
        }
      }
    ]
  }),

  variant5: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Side by Side",
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
      // Balanced layout with icons
      {
        element_type: "shape", konva_component: "Circle", shape_id: uuidv4(),
        properties: { x: 200, y: 200, radius: 40, fill: hexToRgba(colors.primary, 0.2) }
      },
      {
        element_type: "shape", konva_component: "Circle", shape_id: uuidv4(),
        properties: { x: SLIDE_WIDTH - 200, y: 200, radius: 40, fill: hexToRgba(colors.accent, 0.2) }
      }
    ]
  })
};