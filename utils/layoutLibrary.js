const layouts = {
  title_slide: {
    slide_type: "title_slide",
    background: {
      type: "gradient",
      gradient: {
        direction: "to bottom right",
        colors: ["#007ACC", "#00C6FF"]
      }
    },
    container: { layout: "vertical", align: "center", gap: 20 },
    elements: [
      {
        element_type: "title",
        role: "title",
        properties: { align: "center", width: "80%" },
        style: { fontSize: 48, fontWeight: "bold", color: "#fff" }
      },
      {
        element_type: "text",
        role: "subtitle",
        properties: { align: "center", width: "70%" },
        style: { fontSize: 24, color: "#e0e0e0" }
      }
    ]
  },

  section_divider: {
    slide_type: "section_divider",
    background: {
      type: "color",
      color: "#f9f9f9"
    },
    container: { layout: "vertical", align: "center", justify: "center" },
    elements: [
      {
        element_type: "title",
        role: "section_title",
        properties: { align: "center", width: "70%" },
        style: { fontSize: 40, fontWeight: "bold", color: "#111" }
      }
    ]
  },

  content_image: {
    slide_type: "content_image",
    background: {
      type: "image",
      url: "https://example.com/clean-background.png",
      fit: "cover"
    },
    container: { layout: "vertical", gap: 20 },
    elements: [
      {
        element_type: "title",
        role: "title",
        properties: { align: "center" },
        style: { fontSize: 36, fontWeight: "bold", color: "#111" }
      },
      {
        element_type: "row",
        role: "content_row",
        properties: { layout: "horizontal", gap: 20 },
        children: [
          {
            element_type: "bullet_point",
            role: "content",
            properties: { flex: 1 },
            style: { fontSize: 20, color: "#333" }
          },
          {
            element_type: "image",
            role: "illustration",
            properties: { flex: 1, aspectRatio: "16:9" }
          }
        ]
      }
    ]
  },

  comparison: {
    slide_type: "comparison",
    background: {
      type: "gradient",
      gradient: {
        direction: "to right",
        colors: ["#FF6A00", "#FFCC00"]
      }
    },
    container: { layout: "vertical", gap: 20 },
    elements: [
      {
        element_type: "title",
        role: "title",
        properties: { align: "center" },
        style: { fontSize: 36, fontWeight: "bold", color: "#fff" }
      },
      {
        element_type: "row",
        role: "columns",
        properties: { layout: "horizontal", gap: 40 },
        children: [
          {
            element_type: "bullet_point",
            role: "left_column",
            properties: { flex: 1 },
            style: { fontSize: 18, color: "#fff" }
          },
          {
            element_type: "bullet_point",
            role: "right_column",
            properties: { flex: 1 },
            style: { fontSize: 18, color: "#fff" }
          }
        ]
      }
    ]
  },

  quote: {
    slide_type: "quote",
    background: {
      type: "color",
      color: "#fafafa"
    },
    container: { layout: "vertical", align: "center", gap: 20 },
    elements: [
      {
        element_type: "text",
        role: "quote",
        properties: { width: "80%", align: "center" },
        style: { fontSize: 28, fontStyle: "italic", color: "#222" }
      },
      {
        element_type: "text",
        role: "author",
        properties: { align: "right", width: "60%" },
        style: { fontSize: 20, color: "#666" }
      }
    ]
  },

  timeline: {
    slide_type: "timeline",
    background: {
      type: "color",
      color: "#fff"
    },
    container: { layout: "vertical", gap: 40 },
    elements: [
      {
        element_type: "title",
        role: "title",
        properties: { align: "center" },
        style: { fontSize: 36, fontWeight: "bold", color: "#111" }
      },
      {
        element_type: "row",
        role: "timeline_row",
        properties: { layout: "horizontal", justify: "space-between" },
        children: [
          { element_type: "text", role: "milestone1", style: { fontSize: 18, color: "#333" } },
          { element_type: "text", role: "milestone2", style: { fontSize: 18, color: "#333" } },
          { element_type: "text", role: "milestone3", style: { fontSize: 18, color: "#333" } }
        ]
      }
    ]
  },

  team_intro: {
    slide_type: "team_intro",
    background: {
      type: "gradient",
      gradient: {
        direction: "to bottom",
        colors: ["#F0F4FF", "#FFFFFF"]
      }
    },
    container: { layout: "vertical", gap: 20 },
    elements: [
      {
        element_type: "title",
        role: "title",
        properties: { align: "center" },
        style: { fontSize: 36, fontWeight: "bold", color: "#222" }
      },
      {
        element_type: "row",
        role: "team_row",
        properties: { layout: "horizontal", justify: "space-evenly", gap: 20 },
        children: [
          {
            element_type: "column",
            children: [
              { element_type: "image", role: "member_photo1", properties: { aspectRatio: "1:1" } },
              { element_type: "text", role: "member_name1", style: { align: "center", fontSize: 18 } }
            ]
          },
          {
            element_type: "column",
            children: [
              { element_type: "image", role: "member_photo2", properties: { aspectRatio: "1:1" } },
              { element_type: "text", role: "member_name2", style: { align: "center", fontSize: 18 } }
            ]
          },
          {
            element_type: "column",
            children: [
              { element_type: "image", role: "member_photo3", properties: { aspectRatio: "1:1" } },
              { element_type: "text", role: "member_name3", style: { align: "center", fontSize: 18 } }
            ]
          }
        ]
      }
    ]
  },

  image_gallery: {
    slide_type: "image_gallery",
    background: {
      type: "color",
      color: "#fdfdfd"
    },
    container: { layout: "vertical", gap: 20 },
    elements: [
      {
        element_type: "title",
        role: "title",
        properties: { align: "center" },
        style: { fontSize: 36, fontWeight: "bold", color: "#111" }
      },
      {
        element_type: "row",
        role: "gallery_row",
        properties: { layout: "horizontal", gap: 20 },
        children: [
          { element_type: "image", role: "gallery_image1", properties: { flex: 1 } },
          { element_type: "image", role: "gallery_image2", properties: { flex: 1 } },
          { element_type: "image", role: "gallery_image3", properties: { flex: 1 } }
        ]
      }
    ]
  },

  kpi: {
    slide_type: "kpi",
    background: {
      type: "gradient",
      gradient: {
        direction: "to top",
        colors: ["#007ACC", "#00C6FF"]
      }
    },
    container: { layout: "vertical", align: "center", gap: 10 },
    elements: [
      {
        element_type: "title",
        role: "kpi_title",
        properties: { align: "center" },
        style: { fontSize: 32, fontWeight: "bold", color: "#fff" }
      },
      {
        element_type: "text",
        role: "kpi_value",
        properties: { align: "center" },
        style: { fontSize: 64, fontWeight: "bold", color: "#fff" }
      },
      {
        element_type: "text",
        role: "kpi_label",
        properties: { align: "center" },
        style: { fontSize: 20, color: "#f0f0f0" }
      }
    ]
  },

  ending: {
    slide_type: "ending",
    background: {
      type: "color",
      color: "#fefefe"
    },
    container: { layout: "vertical", align: "center", gap: 20 },
    elements: [
      {
        element_type: "title",
        role: "thank_you",
        properties: { align: "center" },
        style: { fontSize: 40, fontWeight: "bold", color: "#111" }
      },
      {
        element_type: "text",
        role: "contact_info",
        properties: { align: "center" },
        style: { fontSize: 20, color: "#555" }
      }
    ]
  }
};

module.exports = layouts;
