// layouts/fullImageTextOverlaySlide.ts
import { v4 as uuidv4 } from "uuid";

const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.startsWith('#') ? hex : `#${hex}`;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const createFullImageTextOverlaySlide = {
  variant1: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Image Overlay Title",
      konva_component: "Text",
      properties: {
        x: 60, y: 60, width: SLIDE_WIDTH - 120, height: 80,
        fontSize: 44, fontFamily: "Raleway", fontWeight: "700",
        fill: "#ffffff", align: "left", lineHeight: 1.1
      }
    },
    elements: [
      // Dark overlay for text readability
      {
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT,
          fill: hexToRgba("#000000", 0.4)
        }
      }
    ]
  }),

  variant2: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Bottom Overlay",
      konva_component: "Text",
      properties: {
        x: 60, y: SLIDE_HEIGHT - 180, width: SLIDE_WIDTH - 120, height: 60,
        fontSize: 38, fontFamily: "Raleway", fontWeight: "600",
        fill: "#ffffff", align: "left"
      }
    },
    elements: [
      // Bottom gradient overlay
      {
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: 0, y: SLIDE_HEIGHT - 200, width: SLIDE_WIDTH, height: 200,
          fillLinearGradientStartPoint: { x: 0, y: SLIDE_HEIGHT - 200 },
          fillLinearGradientEndPoint: { x: 0, y: SLIDE_HEIGHT },
          fillLinearGradientColorStops: [0, "transparent", 1, hexToRgba("#000000", 0.7)]
        }
      }
    ]
  }),

  variant3: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Centered Overlay",
      konva_component: "Text",
      properties: {
        x: SLIDE_WIDTH/2 - 250, y: SLIDE_HEIGHT/2 - 40, width: 500, height: 80,
        fontSize: 40, fontFamily: "Raleway", fontWeight: "700",
        fill: "#ffffff", align: "center"
      }
    },
    elements: [
      // Circular overlay
      {
        element_type: "shape", konva_component: "Circle", shape_id: uuidv4(),
        properties: {
          x: SLIDE_WIDTH/2, y: SLIDE_HEIGHT/2, radius: 200,
          fill: hexToRgba("#000000", 0.5)
        }
      }
    ]
  }),

  variant4: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Side Overlay",
      konva_component: "Text",
      properties: {
        x: 60, y: 100, width: SLIDE_WIDTH/2 - 80, height: 120,
        fontSize: 36, fontFamily: "Raleway", fontWeight: "600",
        fill: "#ffffff", align: "left", lineHeight: 1.2
      }
    },
    elements: [
      // Side overlay
      {
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: 0, y: 0, width: SLIDE_WIDTH/2, height: SLIDE_HEIGHT,
          fillLinearGradientStartPoint: { x: SLIDE_WIDTH/2, y: 0 },
          fillLinearGradientEndPoint: { x: 0, y: 0 },
          fillLinearGradientColorStops: [0, hexToRgba("#000000", 0.6), 1, "transparent"]
        }
      }
    ]
  }),

  variant5: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Modern Overlay",
      konva_component: "Text",
      properties: {
        x: 80, y: 80, width: SLIDE_WIDTH - 160, height: 100,
        fontSize: 46, fontFamily: "Raleway", fontWeight: "800",
        fill: "#ffffff", align: "center"
      }
    },
    elements: [
      // Diagonal overlay
      {
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: -100, y: -100, width: 800, height: 800,
          fill: hexToRgba("#000000", 0.3), rotation: 15
        }
      }
    ]
  })
};