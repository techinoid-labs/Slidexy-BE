module.exports = {
  type: "array",
  items: {
    type: "object",
    required: ["slide_id", "slide_title", "image_url", "elements"],
    properties: {
      slide_id: { type: "string" },
      slide_title: { type: "string" },
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
            properties: { type: "object" }
          }
        }
      }
    }
  }
};
