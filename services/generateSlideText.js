const { textGenModel } = require("../utils/geminiModels");
const { SLIDE_TEMPLATES, selectTemplate } = require("../utils/slideTemplate");
const { v4: uuidv4 } = require("uuid");

async function generateSlideText(rawText, meta = {}, slideCount = 3) {
  let safeRawText = typeof rawText === "string"
    ? rawText
    : JSON.stringify(rawText, null, 2);

  const { goal, tone, audience, length } = meta || {};

  // Build AI prompt based on templates
  const templatesInfo = buildTemplatePrompt(slideCount);

  const prompt = `
You are a professional presentation designer. Create ${slideCount} slides with SPECIFIC content following these templates.

CONTENT SOURCE:
\`\`\`
${safeRawText}
\`\`\`

PREFERENCES:
${goal ? `- Goal: ${goal}` : ""}
${tone ? `- Tone: ${tone}` : ""}
${audience ? `- Audience: ${audience}` : ""}
${length ? `- Length: ${length}` : ""}

TEMPLATE STRUCTURE:
${templatesInfo}

CRITICAL RULES:
1. Slide 1 MUST be a cover slide (title + subtitle ONLY, no bullets)
2. Content slides should have the specified number of bullets per slide
3. ${slideCount === 5 ? "Last slide MUST be a CTA slide" : "Last slide is a conclusion"}
4. Each bullet must be 8-12 words
5. Titles must be 6-8 words max
6. Use professional language, avoid jargon

OUTPUT FORMAT - Return ONLY valid JSON array:
[
  {
    "slide_number": 1,
    "template_type": "cover-hero",
    "title": "Your Compelling Title",
    "subtitle": "A brief subtitle that explains the presentation",
    "content": []
  },
  {
    "slide_number": 2,
    "template_type": "content-right-image",
    "title": "First Key Point",
    "content": [
      "First important bullet point here",
      "Second supporting detail",
      "Third compelling fact",
      "Fourth insight if needed"
    ]
  }
]

Generate exactly ${slideCount} slides now:`;

  try {
    const result = await textGenModel.generateContent(prompt);
    const raw = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Clean and parse JSON
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");
    
    if (firstBracket === -1 || lastBracket === -1) {
      throw new Error("No JSON array found in response");
    }
    
    const jsonString = cleaned.slice(firstBracket, lastBracket + 1);
    const aiSlides = JSON.parse(jsonString);

    // Transform AI output into Konva-ready format
    const slides = aiSlides.map((aiSlide, index) => {
      return transformToKonvaSlide(aiSlide, index, slideCount);
    });

    return slides;

  } catch (err) {
    console.error("Error generating slides:", err);
    // Return fallback slides
    return generateFallbackSlides(slideCount, safeRawText);
  }
}

function buildTemplatePrompt(slideCount) {
  let info = "Slide 1: Cover (cover-hero) - Title + Subtitle only\n";
  
  for (let i = 2; i < slideCount; i++) {
    const template = selectTemplate(i - 1, slideCount);
    const bulletCount = template.name === "Split Content" ? "6" : "4";
    info += `Slide ${i}: Content (${template.name}) - Title + ${bulletCount} bullets\n`;
  }
  
  if (slideCount === 5) {
    info += `Slide ${slideCount}: CTA (call-to-action) - Title + Description + CTA text\n`;
  } else {
    info += `Slide ${slideCount}: Conclusion - Title + 2-3 key takeaways\n`;
  }
  
  return info;
}

function transformToKonvaSlide(aiSlide, index, totalSlides) {
  const template = selectTemplate(index, totalSlides, aiSlide.template_type);
  const slideId = `slide-${uuidv4()}`;

  // Base slide structure
  const slide = {
    slide_id: slideId,
    layout_type: aiSlide.template_type || template.name,
    visual_suggestion: generateVisualSuggestion(aiSlide),
    knowledge: {
      theme: aiSlide.title || "General",
      slideNumber: index + 1,
      totalSlides: totalSlides
    },
    art_style: "modern illustration with characters",
    art_palette: ["#6c5ce7", "#00b894", "#fdcb6e", "#e17055", "#74b9ff"],
    elements: []
  };

  // Add title (REQUIRED for all slides)
  const titleConfig = template.structure.title;
  slide.slide_title = {
    konva_component: "Konva.Text",
    element_id: uuidv4(),
    element_type: "text",
    text: aiSlide.title || "Untitled",
    properties: {
      ...titleConfig.konva,
      id: `title-${slideId}`
    }
  };

  // Add subtitle (for cover slides)
  if (template.structure.subtitle && aiSlide.subtitle) {
    slide.subtitle = {
      konva_component: "Konva.Text",
      element_id: uuidv4(),
      element_type: "text",
      text: aiSlide.subtitle,
      properties: {
        ...template.structure.subtitle.konva,
        id: `subtitle-${slideId}`
      }
    };
  }

  // Add content bullets
  if (template.structure.bullets && aiSlide.content?.length > 0) {
    const bulletConfig = template.structure.bullets.konva;
    
    aiSlide.content.forEach((bullet, i) => {
      slide.elements.push({
        konva_component: "Konva.Text",
        element_id: uuidv4(),
        element_type: "bullet_point",
        text: `• ${bullet}`,
        properties: {
          x: bulletConfig.startX,
          y: bulletConfig.startY + (i * bulletConfig.spacing),
          width: bulletConfig.width,
          fontSize: bulletConfig.fontSize,
          fill: bulletConfig.fill,
          lineHeight: bulletConfig.lineHeight,
          id: `bullet-${i}-${slideId}`
        }
      });
    });
  }

  // Add split bullets (for split content layout)
  if (template.structure.leftBullets && template.structure.rightBullets) {
    const leftBullets = aiSlide.content?.slice(0, Math.ceil(aiSlide.content.length / 2)) || [];
    const rightBullets = aiSlide.content?.slice(Math.ceil(aiSlide.content.length / 2)) || [];

    const leftConfig = template.structure.leftBullets.konva;
    leftBullets.forEach((bullet, i) => {
      slide.elements.push({
        konva_component: "Konva.Text",
        element_id: uuidv4(),
        element_type: "bullet_point",
        text: `• ${bullet}`,
        properties: {
          x: leftConfig.startX,
          y: leftConfig.startY + (i * leftConfig.spacing),
          width: leftConfig.width,
          fontSize: leftConfig.fontSize,
          fill: leftConfig.fill,
          lineHeight: leftConfig.lineHeight,
          id: `left-bullet-${i}-${slideId}`
        }
      });
    });

    const rightConfig = template.structure.rightBullets.konva;
    rightBullets.forEach((bullet, i) => {
      slide.elements.push({
        konva_component: "Konva.Text",
        element_id: uuidv4(),
        element_type: "bullet_point",
        text: `• ${bullet}`,
        properties: {
          x: rightConfig.startX,
          y: rightConfig.startY + (i * rightConfig.spacing),
          width: rightConfig.width,
          fontSize: rightConfig.fontSize,
          fill: rightConfig.fill,
          lineHeight: rightConfig.lineHeight,
          id: `right-bullet-${i}-${slideId}`
        }
      });
    });
  }

  // Add CTA button (for CTA slides)
  if (template.structure.cta && aiSlide.cta) {
    slide.elements.push({
      konva_component: "Konva.Label",
      element_id: uuidv4(),
      element_type: "cta_button",
      text: aiSlide.cta,
      properties: {
        ...template.structure.cta.konva,
        id: `cta-${slideId}`
      }
    });
  }

  // Add description (for CTA and quote slides)
  if (template.structure.description && aiSlide.description) {
    slide.elements.push({
      konva_component: "Konva.Text",
      element_id: uuidv4(),
      element_type: "text",
      text: aiSlide.description,
      properties: {
        ...template.structure.description.konva,
        id: `description-${slideId}`
      }
    });
  }

  // Placeholder for image (will be added by generateImage)
  slide.image_placeholder = {
    position: template.structure.image?.position || "right",
    konva: template.structure.image?.konva || {
      x: 520,
      y: 40,
      width: 400,
      height: 460
    }
  };

  return slide;
}

function generateVisualSuggestion(aiSlide) {
  const title = aiSlide.title?.toLowerCase() || "";
  
  if (title.includes("team") || title.includes("collaboration")) {
    return "team collaboration scene with diverse professionals";
  } else if (title.includes("data") || title.includes("analytics")) {
    return "data analyst with charts and dashboards";
  } else if (title.includes("growth") || title.includes("success")) {
    return "upward trending graph with business people celebrating";
  } else if (title.includes("strategy") || title.includes("planning")) {
    return "strategic planning session with whiteboard";
  } else {
    return "professional business scene with modern setting";
  }
}

function generateFallbackSlides(slideCount, rawText) {
  const fallbackSlides = [];
  
  // Slide 1: Cover
  fallbackSlides.push({
    slide_id: `slide-${uuidv4()}`,
    layout_type: "cover-hero",
    slide_title: {
      konva_component: "Konva.Text",
      element_id: uuidv4(),
      element_type: "text",
      text: "Presentation Title",
      properties: { x: 60, y: 180, width: 840, fontSize: 64, fontWeight: "bold", fill: "#ffffff" }
    },
    subtitle: {
      konva_component: "Konva.Text",
      element_id: uuidv4(),
      element_type: "text",
      text: "Professional presentation created for you",
      properties: { x: 60, y: 280, width: 600, fontSize: 24, fill: "#ffffff" }
    },
    elements: [],
    visual_suggestion: "professional business scene"
  });

  // Middle slides: Content
  for (let i = 1; i < slideCount - 1; i++) {
    fallbackSlides.push({
      slide_id: `slide-${uuidv4()}`,
      layout_type: "content-right-image",
      slide_title: {
        konva_component: "Konva.Text",
        element_id: uuidv4(),
        element_type: "text",
        text: `Key Point ${i}`,
        properties: { x: 40, y: 40, width: 440, fontSize: 36, fontWeight: "bold", fill: "#2c3e50" }
      },
      elements: [
        {
          konva_component: "Konva.Text",
          element_id: uuidv4(),
          element_type: "bullet_point",
          text: "• First important detail",
          properties: { x: 40, y: 120, width: 420, fontSize: 18, fill: "#34495e" }
        },
        {
          konva_component: "Konva.Text",
          element_id: uuidv4(),
          element_type: "bullet_point",
          text: "• Second supporting point",
          properties: { x: 40, y: 160, width: 420, fontSize: 18, fill: "#34495e" }
        }
      ],
      visual_suggestion: "professional team working together"
    });
  }

  // Last slide
  fallbackSlides.push({
    slide_id: `slide-${uuidv4()}`,
    layout_type: slideCount === 5 ? "call-to-action" : "content-right-image",
    slide_title: {
      konva_component: "Konva.Text",
      element_id: uuidv4(),
      element_type: "text",
      text: slideCount === 5 ? "Take Action Today" : "Conclusion",
      properties: { x: 60, y: 160, width: 840, fontSize: 48, fontWeight: "bold", fill: "#2c3e50" }
    },
    elements: [],
    visual_suggestion: "call to action scene"
  });

  return fallbackSlides;
}

module.exports = { generateSlideText };