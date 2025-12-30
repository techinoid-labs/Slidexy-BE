// layouts/quoteSlide.ts
import { v4 as uuidv4 } from "uuid";

const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.startsWith('#') ? hex : `#${hex}`;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const createQuoteSlide = {
  variant1: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => {
    const quoteText = slide.quote || slide.content_metadata?.quote || slide.elements?.find((e: any) => e.element_type === "quote")?.text || slide.slide_title?.text || "Inspirational Quote";
    const authorText = slide.author || slide.content_metadata?.author || slide.elements?.find((e: any) => e.element_type === "author")?.text || "Expert Source";

    return {
      ...slide,
      slide_title: {
        text: `"${quoteText}"`,
        konva_component: "Text",
        properties: {
          x: 100, y: SLIDE_HEIGHT / 2 - 80, width: SLIDE_WIDTH - 200, height: 160,
          fontSize: 32, fontFamily: "Raleway", fontWeight: "300", fontStyle: "italic",
          fill: textColor, align: "center", lineHeight: 1.4
        }
      },
      elements: [
        {
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
        },
        // Author
        {
          element_type: "text", text: `- ${authorText}`,
          konva_component: "Text", properties: {
            x: 100, y: SLIDE_HEIGHT / 2 + 100, width: SLIDE_WIDTH - 200, height: 40,
            fontSize: 20, fontFamily: "Raleway", fontWeight: "500",
            fill: hexToRgba(textColor, 0.8), align: "center"
          }
        },
        // Quote marks
        {
          element_type: "text", text: "''",
          konva_component: "Text", properties: {
            x: 120, y: SLIDE_HEIGHT / 2 - 60, width: 60, height: 60,
            fontSize: 80, fontFamily: "Georgia", fontWeight: "bold",
            fill: hexToRgba(colors.accent, 0.3)
          }
        }
      ]
    };
  },

  variant2: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => {
    const quoteText = slide.quote || slide.content_metadata?.quote || slide.elements?.find((e: any) => e.element_type === "quote")?.text || slide.slide_title?.text || "Powerful Statement";
    const authorText = slide.author || slide.content_metadata?.author || slide.elements?.find((e: any) => e.element_type === "author")?.text || "Expert Source";

    return {
      ...slide,
      slide_title: {
        text: `"${quoteText}"`,
        konva_component: "Text",
        properties: {
          x: SLIDE_WIDTH / 2 - 300, y: SLIDE_HEIGHT / 2 - 60, width: 600, height: 120,
          fontSize: 32, fontFamily: "Raleway", fontWeight: "600", fontStyle: "italic",
          fill: textColor, align: "center", lineHeight: 1.3
        }
      },
      elements: [
        {
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
        },
        // Author
        {
          element_type: "text", text: `- ${authorText}`,
          konva_component: "Text", properties: {
            x: SLIDE_WIDTH / 2 - 300, y: SLIDE_HEIGHT / 2 + 60, width: 600, height: 40,
            fontSize: 18, fontFamily: "Raleway", fontWeight: "500",
            fill: hexToRgba(textColor, 0.75), align: "center"
          }
        },
        // Accent bar
        {
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: {
            x: SLIDE_WIDTH / 2 - 150, y: SLIDE_HEIGHT / 2 + 110, width: 300, height: 4,
            fill: colors.accent
          }
        }
      ]
    };
  },

  variant3: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => {
    const quoteText = slide.quote || slide.content_metadata?.quote || slide.elements?.find((e: any) => e.element_type === "quote")?.text || slide.slide_title?.text || "Memorable Quote";
    const authorText = slide.author || slide.content_metadata?.author || slide.elements?.find((e: any) => e.element_type === "author")?.text || "Expert Name";

    return {
      ...slide,
      slide_title: {
        text: `"${quoteText}"`,
        konva_component: "Text",
        properties: {
          x: 150, y: 180, width: SLIDE_WIDTH - 300, height: 120,
          fontSize: 28, fontFamily: "Raleway", fontWeight: "400", fontStyle: "italic",
          fill: textColor, align: "center", lineHeight: 1.4
        }
      },
      elements: [
        {
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
        },
        // Author attribution
        {
          element_type: "text", text: `- ${authorText}`,
          konva_component: "Text", properties: {
            x: SLIDE_WIDTH - 450, y: 320, width: 300, height: 30,
            fontSize: 18, fontFamily: "Raleway", fontWeight: "500",
            fill: hexToRgba(textColor, 0.7), align: "right"
          }
        }
      ]
    };
  },

  variant4: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => {
    const quoteText = slide.quote || slide.content_metadata?.quote || slide.elements?.find((e: any) => e.element_type === "quote")?.text || slide.slide_title?.text || "Inspirational Thought";
    const authorText = slide.author || slide.content_metadata?.author || slide.elements?.find((e: any) => e.element_type === "author")?.text || "Expert Source";

    return {
      ...slide,
      slide_title: {
        text: `"${quoteText}"`,
        konva_component: "Text",
        properties: {
          x: 100, y: 180, width: SLIDE_WIDTH - 200, height: 120,
          fontSize: 32, fontFamily: "Raleway", fontWeight: "500", fontStyle: "italic",
          fill: textColor, align: "center", lineHeight: 1.3
        }
      },
      elements: [
        {
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
        },
        // Author
        {
          element_type: "text", text: `- ${authorText}`,
          konva_component: "Text", properties: {
            x: 100, y: 320, width: SLIDE_WIDTH - 200, height: 40,
            fontSize: 18, fontFamily: "Raleway", fontWeight: "500",
            fill: hexToRgba(textColor, 0.7), align: "center"
          }
        },
        // Decorative background
        {
          element_type: "shape", konva_component: "Circle", shape_id: uuidv4(),
          properties: {
            x: SLIDE_WIDTH / 2, y: SLIDE_HEIGHT / 2, radius: 180,
            fill: hexToRgba(colors.primary, 0.1)
          }
        }
      ]
    };
  },

  variant5: (slide: any, colors: any, textColor: string, SLIDE_WIDTH: number = 960, SLIDE_HEIGHT: number = 540) => {
    const quoteText = slide.quote || slide.content_metadata?.quote || slide.elements?.find((e: any) => e.element_type === "quote")?.text || slide.slide_title?.text || "Featured Quote";
    const authorText = slide.author || slide.content_metadata?.author || slide.elements?.find((e: any) => e.element_type === "author")?.text || "Expert Source";

    return {
      ...slide,
      slide_title: {
        text: `"${quoteText}"`,
        konva_component: "Text",
        properties: {
          x: 120, y: 150, width: SLIDE_WIDTH - 240, height: 140,
          fontSize: 28, fontFamily: "Raleway", fontWeight: "300", fontStyle: "italic",
          fill: textColor, align: "center", lineHeight: 1.4
        }
      },
      elements: [
        {
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fill: colors.background }
        },
        // Author
        {
          element_type: "text", text: `- ${authorText}`,
          konva_component: "Text", properties: {
            x: 120, y: 310, width: SLIDE_WIDTH - 240, height: 40,
            fontSize: 18, fontFamily: "Raleway", fontWeight: "500",
            fill: hexToRgba(textColor, 0.7), align: "center"
          }
        },
        // Border design
        {
          element_type: "shape", konva_component: "Rect", shape_id: uuidv4(),
          properties: {
            x: 100, y: 140, width: SLIDE_WIDTH - 200, height: 210,
            fill: "transparent", cornerRadius: 8,
            stroke: hexToRgba(colors.accent, 0.3), strokeWidth: 2
          }
        }
      ]
    };
  }
};