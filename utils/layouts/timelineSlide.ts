// layouts/timelineSlide.ts
import { v4 as uuidv4 } from "uuid";

const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.startsWith('#') ? hex : `#${hex}`;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const createTimelineSlide = {
  variant1: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => {
    const bullets = slide.elements?.filter((el: any) => el.element_type === "bullet_point") || [];
    
    return {
      ...slide,
      slide_title: {
        text: slide.slide_title?.text || "Timeline",
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
        // Timeline line
        {
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: {
            x: SLIDE_WIDTH/2 - 2, y: 120, width: 4, height: SLIDE_HEIGHT - 200,
            fill: colors.primary
          }
        },
        // Timeline points
        ...bullets.slice(0, 4).map((bullet: any, index: number) => ({
          element_type: "shape", konva_component: "Circle", shape_id: uuidv4(),
          properties: {
            x: SLIDE_WIDTH/2, y: 150 + (index * 100), radius: 8,
            fill: colors.accent, stroke: colors.primary, strokeWidth: 2
          }
        }))
      ]
    };
  },

  variant2: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Project Timeline",
      konva_component: "Text",
      properties: {
        x: 80, y: 60, width: SLIDE_WIDTH - 160, height: 50,
        fontSize: 32, fontFamily: "Raleway", fontWeight: "600", fill: textColor
      }
    },
    elements: [
      { element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
      },
      // Horizontal timeline
      {
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: 100, y: SLIDE_HEIGHT/2, width: SLIDE_WIDTH - 200, height: 3,
          fill: colors.secondary
        }
      }
    ]
  }),

  variant3: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Milestones",
      konva_component: "Text",
      properties: {
        x: 100, y: 80, width: SLIDE_WIDTH - 200, height: 40,
        fontSize: 28, fontFamily: "Raleway", fontWeight: "500", fill: textColor, align: "center"
      }
    },
    elements: [
      { element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
      },
      // Dotted timeline
      {
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: 120, y: 200, width: SLIDE_WIDTH - 240, height: 2,
          fill: colors.primary, dash: [5, 5]
        }
      }
    ]
  }),

  variant4: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "History Timeline",
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
      // Curved timeline
      {
        element_type: "shape", konva_component: "Line", shape_id: uuidv4(),
        properties: {
          points: [100, 300, SLIDE_WIDTH/2, 200, SLIDE_WIDTH - 100, 300],
          stroke: colors.accent, strokeWidth: 3, tension: 0.5
        }
      }
    ]
  }),

  variant5: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => ({
    ...slide,
    slide_title: {
      text: slide.slide_title?.text || "Progress Timeline",
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
      // Gradient timeline
      {
        element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
        properties: {
          x: 150, y: 250, width: SLIDE_WIDTH - 300, height: 4,
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: SLIDE_WIDTH - 300, y: 0 },
          fillLinearGradientColorStops: [0, colors.primary, 0.5, colors.accent, 1, colors.secondary]
        }
      }
    ]
  })
};