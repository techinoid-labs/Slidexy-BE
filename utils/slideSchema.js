// utils/slideSchema.js
module.exports = {
  type: "array",
  items: {
    type: "object",
    required: ["slide_id", "slide_title", "image_url", "elements"],
    properties: {
      slide_id: { type: "string" },
      slide_title: {
        type: "object", // Changed from "string" to "object"
        required: ["konva_component", "element_type", "properties"],
        properties: {
          konva_component: { type: "string" },
          element_type: { type: "string" },
          text: { type: "string" },
          properties: { type: "object" },
          id: { type: "string" },
          useThemeColor: { type: "boolean" },
        },
      },
      image_url: { type: "string" },
      elements: {
        type: "array",
        items: {
          type: "object",
          required: ["element_type", "konva_component", "properties"],
          properties: {
            element_type: { type: "string" },
            konva_component: { type: "string" },
            text: { type: "string" },
            properties: { type: "object" },
            id: { type: "string" },
            useThemeColor: { type: "boolean" },
          },
        },
      },
      titleBlock: { type: "object" },
      textBlock: { type: "object" },
      imageBlock: { type: "object" },
      _initialState: { type: "object" },
    },
  },
};