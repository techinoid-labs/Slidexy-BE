// layouts/contentRightImageSlide.ts
import { v4 as uuidv4 } from "uuid";

const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.startsWith('#') ? hex : `#${hex}`;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const createContentRightImageSlide = {
  variant1: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => {
    const bullets = slide.elements?.filter((el: any) => el.element_type === "bullet_point") || [];
    
    return {
      ...slide,
      slide_title: {
        text: slide.slide_title?.text || "Content Title",
        konva_component: "Text",
        properties: {
          x: 60, y: 40, width: 440, height: 60,
          fontSize: 36, fontFamily: "Raleway", fontWeight: "700", 
          fill: textColor, align: "left",
          shadowColor: hexToRgba(textColor, 0.2), shadowBlur: 10, shadowOffsetY: 5
        }
      },
      elements: [
        { 
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
        },
        {
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: {
            x: 40, y: 120, width: 440, height: SLIDE_HEIGHT - 160,
            fill: hexToRgba(colors.surface, 0.98), cornerRadius: 20,
            shadowColor: "rgba(0,0,0,0.15)", shadowBlur: 25, shadowOffsetY: 8, shadowOffsetX: 2
          }
        },
        {
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: {
            x: 60, y: 140, width: 4, height: 80,
            fill: colors.accent, cornerRadius: 2
          }
        },
        {
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: {
            x: 520, y: 80, width: 400, height: 380,
            fill: hexToRgba(colors.primary, 0.08), cornerRadius: 16,
            stroke: hexToRgba(colors.accent, 0.3), strokeWidth: 3,
            shadowColor: hexToRgba(colors.accent, 0.1), shadowBlur: 10
          }
        },
        ...bullets.slice(0, 4).map((bullet: any, index: number) => ({
          element_type: "bullet_point", text: `${index + 1}. ${bullet.text}`,
          konva_component: "Text", properties: {
            x: 80, y: 150 + (index * 70), width: 380, height: 60,
            fontSize: 18, fontFamily: "Raleway", fontWeight: "500", 
            fill: textColor, lineHeight: 1.4, align: "left",
            shadowColor: hexToRgba(textColor, 0.1), shadowBlur: 5
          }
        }))
      ],
      background: { type: "solid", color: colors.background }
    };
  },

  variant2: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => {
    const bullets = slide.elements?.filter((el: any) => el.element_type === "bullet_point") || [];
    
    return {
      ...slide,
      slide_title: {
        text: slide.slide_title?.text || "Dynamic Content",
        konva_component: "Text",
        properties: {
          x: 60, y: 30, width: 500, height: 70,
          fontSize: 40, fontFamily: "Raleway", fontWeight: "800", 
          fill: textColor, align: "left",
          shadowColor: hexToRgba(textColor, 0.25), shadowBlur: 12, shadowOffsetY: 6
        }
      },
      elements: [
        { 
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
        },
        {
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: {
            x: 480, y: 0, width: 20, height: SLIDE_HEIGHT,
            fill: hexToRgba(colors.accent, 0.2), cornerRadius: 10
          }
        },
        {
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: {
            x: 40, y: 110, width: 460, height: SLIDE_HEIGHT - 150,
            fill: hexToRgba(colors.surface, 0.95), cornerRadius: 12,
            shadowColor: "rgba(0,0,0,0.1)", shadowBlur: 15, shadowOffsetY: 5
          }
        },
        {
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: {
            x: 460, y: 60, width: 460, height: 420,
            fill: hexToRgba(colors.primary, 0.05), cornerRadius: 12,
            stroke: colors.accent, strokeWidth: 2,
            shadowColor: hexToRgba(colors.primary, 0.15), shadowBlur: 12
          }
        },
        ...bullets.slice(0, 4).map((bullet: any, index: number) => ({
          element_type: "bullet_point", text: `• ${bullet.text}`,
          konva_component: "Text", properties: {
            x: 70, y: 140 + (index * 65), width: 400, height: 55,
            fontSize: 17, fontFamily: "Raleway", fontWeight: "400", 
            fill: textColor, lineHeight: 1.5, align: "left",
            shadowColor: hexToRgba(textColor, 0.08), shadowBlur: 4
          }
        }))
      ],
      background: { type: "solid", color: colors.background }
    };
  },

  variant3: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => {
    const bullets = slide.elements?.filter((el: any) => el.element_type === "bullet_point") || [];
    
    return {
      ...slide,
      slide_title: {
        text: slide.slide_title?.text || "Grid Content",
        konva_component: "Text",
        properties: {
          x: 60, y: 40, width: 440, height: 60,
          fontSize: 36, fontFamily: "Raleway", fontWeight: "700", 
          fill: textColor, align: "left",
          shadowColor: hexToRgba(textColor, 0.2), shadowBlur: 10
        }
      },
      elements: [
        { 
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: { 
            x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, 
            fillLinearGradientStartPoint: { x: 0, y: 0 },
            fillLinearGradientEndPoint: { x: SLIDE_WIDTH, y: SLIDE_HEIGHT },
            fillLinearGradientColorStops: [0, hexToRgba(colors.primary, 0.05), 1, hexToRgba(colors.secondary, 0.05)]
          }
        },
        // Left grid for bullets 0-1
        {
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: {
            x: 40, y: 120, width: 220, height: 200,
            fill: hexToRgba(colors.surface, 0.95), cornerRadius: 12,
            shadowColor: "rgba(0,0,0,0.1)", shadowBlur: 15
          }
        },
        // Right grid for bullets 2-3
        {
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: {
            x: 260, y: 120, width: 220, height: 200,
            fill: hexToRgba(colors.surface, 0.95), cornerRadius: 12,
            shadowColor: "rgba(0,0,0,0.1)", shadowBlur: 15
          }
        },
        // Full-width image frame
        {
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: {
            x: 40, y: 340, width: 880, height: 180,
            fill: hexToRgba(colors.primary, 0.03), cornerRadius: 16,
            stroke: hexToRgba(colors.accent, 0.2), strokeWidth: 2,
            shadowColor: hexToRgba(colors.accent, 0.05), shadowBlur: 8
          }
        },
        // Bullets in grid
        ...bullets.slice(0, 2).map((bullet: any, index: number) => ({
          element_type: "bullet_point", text: bullet.text,
          konva_component: "Text", properties: {
            x: 60, y: 150 + (index * 90), width: 180, height: 80,
            fontSize: 16, fontFamily: "Raleway", fontWeight: "400", 
            fill: textColor, lineHeight: 1.3, align: "left"
          }
        })),
        ...bullets.slice(2, 4).map((bullet: any, index: number) => ({
          element_type: "bullet_point", text: bullet.text,
          konva_component: "Text", properties: {
            x: 280, y: 150 + ((index - 2) * 90), width: 180, height: 80,
            fontSize: 16, fontFamily: "Raleway", fontWeight: "400", 
            fill: textColor, lineHeight: 1.3, align: "left"
          }
        }))
      ],
      background: { 
        type: "linear", 
        gradient: { 
          start: colors.primary, 
          end: colors.secondary, 
          stops: [0, hexToRgba(colors.primary, 0.05), 1, hexToRgba(colors.secondary, 0.05)] 
        } 
      }
    };
  },

  variant4: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => {
    const bullets = slide.elements?.filter((el: any) => el.element_type === "bullet_point") || [];
    
    return {
      ...slide,
      slide_title: {
        text: slide.slide_title?.text || "Corporate Layout",
        konva_component: "Text",
        properties: {
          x: 60, y: 50, width: 440, height: 60,
          fontSize: 34, fontFamily: "Raleway", fontWeight: "600", 
          fill: textColor, align: "left"
        }
      },
      elements: [
        { 
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
        },
        // Sidebar accent
        {
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: {
            x: 0, y: 120, width: 40, height: SLIDE_HEIGHT - 140,
            fill: colors.primary
          }
        },
        // Content card
        {
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: {
            x: 60, y: 130, width: 420, height: SLIDE_HEIGHT - 170,
            fill: colors.surface, cornerRadius: 8,
            shadowColor: "rgba(0,0,0,0.05)", shadowBlur: 10
          }
        },
        // Image frame
        {
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: {
            x: 520, y: 100, width: 380, height: 340,
            fill: hexToRgba(colors.accent, 0.02), stroke: colors.primary, strokeWidth: 1
          }
        },
        ...bullets.slice(0, 4).map((bullet: any, index: number) => ({
          element_type: "bullet_point", text: bullet.text,
          konva_component: "Text", properties: {
            x: 80, y: 160 + (index * 60), width: 380, height: 50,
            fontSize: 16, fontFamily: "Raleway", fontWeight: "400", 
            fill: textColor, align: "left"
          }
        }))
      ],
      background: { type: "solid", color: colors.background }
    };
  },

  variant5: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => {
    const bullets = slide.elements?.filter((el: any) => el.element_type === "bullet_point") || [];
    
    return {
      ...slide,
      slide_title: {
        text: slide.slide_title?.text || "Modern Overlay",
        konva_component: "Text",
        properties: {
          x: 60, y: 30, width: 500, height: 70,
          fontSize: 38, fontFamily: "Raleway", fontWeight: "700", 
          fill: "#ffffff", align: "left"
        }
      },
      elements: [
        { 
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: { 
            x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, 
            fillLinearGradientStartPoint: { x: 0, y: SLIDE_HEIGHT },
            fillLinearGradientEndPoint: { x: SLIDE_WIDTH, y: 0 },
            fillLinearGradientColorStops: [0, colors.secondary, 1, colors.accent]
          }
        },
        // Overlay content
        {
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: {
            x: 40, y: 110, width: 440, height: SLIDE_HEIGHT - 150,
            fill: hexToRgba("#ffffff", 0.95), cornerRadius: 16,
            shadowColor: "rgba(0,0,0,0.2)", shadowBlur: 20, shadowOffsetY: 10
          }
        },
        // Image overlay frame
        {
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: {
            x: 500, y: 80, width: 420, height: 380,
            fill: "transparent", stroke: "#ffffff", strokeWidth: 2,
            cornerRadius: 12,
            shadowColor: "rgba(255,255,255,0.3)", shadowBlur: 15
          }
        },
        ...bullets.slice(0, 4).map((bullet: any, index: number) => ({
          element_type: "bullet_point", text: bullet.text,
          konva_component: "Text", properties: {
            x: 70, y: 140 + (index * 65), width: 400, height: 55,
            fontSize: 17, fontFamily: "Raleway", fontWeight: "400", 
            fill: hexToRgba(textColor, 0.9), lineHeight: 1.5, align: "left"
          }
        }))
      ],
      background: { 
        type: "linear", 
        gradient: { 
          start: colors.secondary, 
          end: colors.accent, 
          stops: [0, colors.secondary, 1, colors.accent] 
        } 
      }
    };
  }
};