const { textGenModel } = require("../utils/geminiModels");
const { v4: uuidv4 } = require("uuid");

// Slide type definitions with content requirements
const SLIDE_TYPE_DEFINITIONS = {
  3: {
    slides: [
      { type: "cover-hero", description: "Compelling title and subtitle that grabs attention" },
      { type: "content-right-image", description: "Most important key points and insights" },
      { type: "conclusion", description: "Powerful summary and call to action" }
    ],
    contentFocus: "Concise and impactful - perfect for quick presentations"
  },
  5: {
    slides: [
      { type: "cover-hero", description: "Engaging title and compelling subtitle" },
      { type: "content-right-image", description: "Primary problem or opportunity" },
      { type: "content-left-image", description: "Solution approach and methodology" },
      { type: "content-split", description: "Key benefits and differentiators" },
      { type: "call-to-action", description: "Clear next steps and action items" }
    ],
    contentFocus: "Problem-solution narrative with clear progression"
  },
  7: {
    slides: [
      { type: "cover-hero", description: "Professional title and descriptive subtitle" },
      { type: "content-right-image", description: "Executive summary and context" },
      { type: "content-left-image", description: "Detailed analysis and findings" },
      { type: "content-split", description: "Comparative advantages and data" },
      { type: "quote-slide", description: "Expert testimony or customer feedback" },
      { type: "infographic-bullets", description: "Key metrics and performance indicators" },
      { type: "conclusion", description: "Comprehensive summary and recommendations" }
    ],
    contentFocus: "Comprehensive analysis with supporting evidence"
  },
  10: {
    slides: [
      { type: "cover-hero", description: "Strategic title and overview subtitle" },
      { type: "content-right-image", description: "Market overview and opportunity" },
      { type: "content-left-image", description: "Competitive landscape analysis" },
      { type: "content-split", description: "Core capabilities and strengths - MUST include 4-6 bullets for left/right split" },
      { type: "quote-slide", description: "Leadership vision or customer success" },
      { type: "infographic-bullets", description: "Performance metrics and growth trends - MUST include 3-4 bullets in 'Value - explanation' format" },
      { type: "content-right-image", description: "Implementation roadmap" },
      { type: "content-left-image", description: "Risk assessment and mitigation" },
      { type: "content-split", description: "Expected outcomes and ROI - MUST include 4-6 bullets for left/right split" },
      { type: "call-to-action", description: "Strategic next steps and timeline" }
    ],
    contentFocus: "Strategic deep dive with comprehensive coverage"
  }
};

async function generateSlideText(rawText, meta = {}, slideCount = 5, progressCallback = null) {
  let safeRawText = typeof rawText === "string" 
    ? rawText 
    : JSON.stringify(rawText, null, 2);

  const { goal, tone, audience, length } = meta || {};
  
  // Get slide structure based on count
  const slideStructure = SLIDE_TYPE_DEFINITIONS[slideCount] || SLIDE_TYPE_DEFINITIONS[5];
  
  // Notify progress: starting generation
  if (progressCallback) {
    progressCallback(0, slideCount);
  }
  
  const prompt = `
You are a world-class presentation content strategist. Create EXACTLY ${slideCount} slides with precise textual data for frontend layout mapping.

SLIDE STRUCTURE FOR ${slideCount}-SLIDE PRESENTATION:
${slideStructure.slides.map((slide, index) => 
  `Slide ${index + 1}: ${slide.type.toUpperCase()} - ${slide.description}`
).join('\n')}

CONTENT SOURCE:
"""
${safeRawText.slice(0, 4000)}"
"""

PRESENTATION CONTEXT:
${goal ? `• Primary Goal: ${goal}` : '• Goal: Inform and persuade'}
${tone ? `• Tone: ${tone}` : '• Tone: Professional and engaging'}
${audience ? `• Audience: ${audience}` : '• Audience: Business professionals'}
${length ? `• Length: ${length}` : '• Length: Standard presentation'}

STRICT CONTENT RULES (for frontend mapping):
1. TITLES: 3-6 words, compelling and action-oriented
2. COVER-HERO: title + subtitle (1 sentence, no bullets)
3. BULLET SLIDES (content-right-image, content-left-image, content-split, infographic-bullets): EXACTLY 3-4 bullets (6-12 words each, complete thoughts). For content-split: ALWAYS include EXACTLY 4-6 bullets (to be split evenly in layout). For infographic-bullets: ALWAYS include EXACTLY 3-4 bullets in format "Value - 1-sentence explanation" (e.g., "25% - Growth in key metric over last year").
4. QUOTE-SLIDE: title, quote (20-50 words full sentence), author, context (1 sentence)
5. CALL-TO-ACTION/CONCLUSION: title, 1-2 action bullets, description (1 sentence)
6. Maintain consistent terminology and narrative flow. CRITICAL: Ensure EVERY bullet slide (including content-split and infographic-bullets) has the required bullets - no empty lists.

OUTPUT FORMAT - Return ONLY valid JSON array with exactly ${slideCount} objects. Use these exact structures:

For cover-hero:
{
  "slide_number": 1,
  "layout_type": "cover-hero",
  "title": "Strategic Title Here",
  "subtitle": "Compelling subtitle that sets context"
}

For content-right-image/content-left-image:
{
  "slide_number": 2,
  "layout_type": "content-right-image",
  "title": "Key Insight Heading",
  "bullets": [
    "First impactful bullet point with specific detail",
    "Second supporting point with clear value",
    "Third compelling insight or finding",
    "Fourth actionable observation when needed"
  ]
}

For content-split:
{
  "slide_number": 4,
  "layout_type": "content-split",
  "title": "Core Capabilities",
  "bullets": [
    "Strength 1 detail (6-12 words)",
    "Strength 2 detail (6-12 words)",
    "Strength 3 detail (6-12 words)",
    "Strength 4 detail (6-12 words)",
    "Strength 5 detail (if using 5)"
  ]
}

For quote-slide:
{
  "slide_number": 5,
  "layout_type": "quote-slide",
  "title": "Expert Perspective",
  "quote": "The compelling quote text goes here in full sentences (20-50 words)",
  "author": "Source or attribution",
  "context": "Relevance to the presentation topic (1 sentence)"
}

For infographic-bullets:
{
  "slide_number": 6,
  "layout_type": "infographic-bullets",
  "title": "Key Metrics",
  "bullets": [
    "25% - Explanation of this metric (1 sentence)",
    "150K - Context for the number (1 sentence)",
    "95% - Supporting detail (1 sentence)"
  ]
}

For call-to-action:
{
  "slide_number": 10,
  "layout_type": "call-to-action",
  "title": "Next Steps",
  "bullets": [
    "Action item 1 (concise)",
    "Action item 2 (concise)"
  ],
  "description": "Brief overview of implementation (1 sentence)"
}

Generate exactly ${slideCount} slides that tell a compelling story:`;

  try {
    // Notify progress: AI generation started
    if (progressCallback) {
      progressCallback(1, slideCount);
    }
    
    const result = await textGenModel.generateContent(prompt);
    const raw = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Notify progress: parsing response
    if (progressCallback) {
      progressCallback(Math.floor(slideCount * 0.3), slideCount);
    }
    
    // Clean and parse JSON
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");
    
    if (firstBracket === -1 || lastBracket === -1) {
      throw new Error("No JSON array found in AI response");
    }
    
    const jsonString = cleaned.slice(firstBracket, lastBracket + 1);
    let aiSlides = JSON.parse(jsonString);

    // Notify progress: processing slides
    if (progressCallback) {
      progressCallback(Math.floor(slideCount * 0.5), slideCount);
    }

    // Validate and fix counts - enhanced for content-split and infographic-bullets
    aiSlides = aiSlides.map((slide, index) => {
      // Notify progress for each slide being processed
      if (progressCallback) {
        progressCallback(index + 1, slideCount);
      }
      
      if (slide.layout_type === "cover-hero" && !slide.subtitle) {
        slide.subtitle = "Professional presentation overview based on your content.";
      }
      if (["content-right-image", "content-left-image", "content-split", "infographic-bullets"].includes(slide.layout_type)) {
        const minBullets = slide.layout_type === "content-split" ? 4 : 3;
        const maxBullets = slide.layout_type === "content-split" ? 6 : 4;
        if (!slide.bullets || slide.bullets.length < minBullets) {
          // Generate fallback bullets based on title/theme
          const fallbackBullets = generateFallbackBullets(slide.title, minBullets, slide.layout_type);
          slide.bullets = [...(slide.bullets || []), ...fallbackBullets].slice(0, maxBullets);
        } else {
          slide.bullets = slide.bullets.slice(0, maxBullets);
        }
      }
      if (slide.layout_type === "quote-slide" && !slide.quote) {
        slide.quote = "A powerful insight from industry experts.";
        slide.author = "Expert Name";
        slide.context = "This reinforces the key theme of the presentation.";
      }
      if (["call-to-action", "conclusion"].includes(slide.layout_type) && slide.bullets) {
        slide.bullets = slide.bullets.slice(0, 2);
        if (!slide.description) slide.description = "Summary of expected outcomes and next actions.";
      }
      return slide;
    });

    // Notify progress: transforming slides
    if (progressCallback) {
      progressCallback(Math.floor(slideCount * 0.8), slideCount);
    }

    // Transform AI output into text-only format with layout variants prep
    const slides = aiSlides.map((aiSlide, index) => {
      // Notify progress for each slide being transformed
      if (progressCallback) {
        progressCallback(index + 1, slideCount);
      }
      return transformToTextOnlySlide(aiSlide, index, slideCount);
    });

    // Notify progress: complete
    if (progressCallback) {
      progressCallback(slideCount, slideCount);
    }

    return slides;

  } catch (err) {
    console.error("Error generating slides:", err);
    // Return intelligent fallback slides
    return generateIntelligentFallbackSlides(slideCount, safeRawText);
  }
}

function generateFallbackBullets(title, count, layoutType) {
  const basePhrases = [
    "Key advantage in competitive market positioning.",
    "Proven methodology for sustainable growth.",
    "Data-driven insights supporting decisions.",
    "Strategic partnerships enhancing capabilities.",
    "Innovative solutions addressing challenges.",
    "Measurable outcomes from implementation."
  ];
  const fallback = [];
  for (let i = 0; i < count; i++) {
    let bullet = basePhrases[i % basePhrases.length];
    if (layoutType === "infographic-bullets") {
      bullet = `${Math.floor(Math.random() * 100 + 10)}% - ${bullet.toLowerCase().replace('.', '')}`;
    }
    fallback.push(bullet);
  }
  return fallback;
}

function transformToTextOnlySlide(aiSlide, index, totalSlides) {
  const slideStructure = SLIDE_TYPE_DEFINITIONS[totalSlides];
  const slideType = slideStructure?.slides[index]?.type || aiSlide.layout_type || "content-right-image";
  
  const slideId = `slide-${uuidv4()}`;
  
  // Base slide structure
  const slide = {
    slide_id: slideId,
    layout_type: slideType,
    visual_suggestion: generateVisualSuggestion(aiSlide, slideType),
    knowledge: {
      theme: aiSlide.title || "Presentation",
      slideNumber: index + 1,
      totalSlides: totalSlides,
      contentType: getContentType(slideType)
    },
    art_style: "modern illustration with characters",
    art_palette: generateColorPalette(aiSlide.title),
    elements: [],
    image_url: null,
    image_caption: "",
    image_placeholder: { x: 520, y: 40, width: 400, height: 460 },
    content_metadata: {
      title: aiSlide.title || "",
      subtitle: aiSlide.subtitle || "",
      bullet_count: 0, // Will be updated later
      has_quote: !!aiSlide.quote,
      has_data: slideType === "infographic-bullets"
    },
    slide_number: index + 1,
    total_slides: totalSlides,
    created_at: { $date: { $numberLong: Date.now().toString() } },
    updated_at: { $date: { $numberLong: Date.now().toString() } }
  };

  // Add title (required for all slides)
  slide.slide_title = { 
    text: aiSlide.title || getDefaultTitle(index, slideType),
    _id: { $oid: uuidv4().replace(/-/g, '').slice(0, 24) }
  };

  // Handle subtitle for cover-hero (ensure fallback if missing)
  if (slideType === "cover-hero") {
    const coverSubtitle = aiSlide.subtitle || "Professional presentation overview based on your content.";
    slide.subtitle = { 
      text: coverSubtitle,
      _id: { $oid: uuidv4().replace(/-/g, '').slice(0, 24) }
    };
    slide.content_metadata.subtitle = coverSubtitle;
  }

  // Handle different slide types for elements
  switch(slideType) {
    case "cover-hero":
      // No elements for cover
      break;

    case "quote-slide":
      // Ensure fallback quote data when AI omits it
      if (!aiSlide.quote) {
        aiSlide.quote = "A powerful insight from industry experts that reinforces the key theme of the presentation.";
      }
      if (!aiSlide.author) {
        aiSlide.author = "Expert Source";
      }
      if (!aiSlide.context) {
        aiSlide.context = "This quote highlights a core message relevant to the audience.";
      }
      if (aiSlide.quote) {
        slide.elements.push({
          element_type: "quote",
          text: aiSlide.quote,
          element_id: `element-${uuidv4()}`,
          id: uuidv4()
        });
      }
      if (aiSlide.author) {
        slide.elements.push({
          element_type: "author",
          text: aiSlide.author,
          element_id: `element-${uuidv4()}`,
          id: uuidv4()
        });
      }
      if (aiSlide.context) {
        slide.elements.push({
          element_type: "context",
          text: aiSlide.context,
          element_id: `element-${uuidv4()}`,
          id: uuidv4()
        });
      }
      break;

    case "call-to-action":
      if (aiSlide.bullets) {
        aiSlide.bullets.forEach((bullet) => {
          slide.elements.push({
            element_type: "bullet_point",
            text: bullet,
            id: uuidv4()
          });
        });
      }
      if (aiSlide.description) {
        slide.elements.push({
          element_type: "description",
          text: aiSlide.description,
          id: uuidv4()
        });
      }
      break;

    case "infographic-bullets":
      if (aiSlide.bullets) {
        aiSlide.bullets.forEach((bullet) => {
          slide.elements.push({
            element_type: "bullet_point",
            text: bullet,
            id: uuidv4()
          });
        });
      }
      break;

    default: // Content slides including content-split
      if (aiSlide.bullets && aiSlide.bullets.length > 0) {
        aiSlide.bullets.forEach((bullet) => {
          slide.elements.push({
            element_type: "bullet_point",
            text: bullet,
            id: uuidv4()
          });
        });
      }
  }

  // Update content_metadata bullet_count after adding elements
  slide.content_metadata.bullet_count = slide.elements.filter(el => el.element_type === "bullet_point").length;

  return slide;
}

function generateVisualSuggestion(aiSlide, slideType) {
  const title = aiSlide.title?.toLowerCase() || "";
  const content = aiSlide.bullets?.join(' ') || "";
  
  // Enhanced visual suggestions based on content and slide type
  const suggestions = {
    "cover-hero": {
      "team": "diverse team collaboration in modern workspace",
      "data": "data visualization with analytics dashboard",
      "growth": "upward trending graph with success imagery",
      "strategy": "strategic planning session with whiteboard",
      "innovation": "creative brainstorming with technology elements",
      "default": "professional business setting with modern design"
    },
    "content-right-image": {
      "analysis": "data analysis scene with charts and graphs",
      "process": "workflow visualization with step-by-step elements",
      "technology": "modern tech environment with devices",
      "default": "relevant business context supporting the content"
    },
    "content-left-image": {
      "analysis": "professional analysis workspace with reports",
      "risk": "balanced scale representing risk assessment",
      "default": "professional business imagery relevant to content"
    },
    "content-split": {
      "default": "split-view comparison with balanced elements"
    },
    "quote-slide": {
      "default": "inspiring background that complements the quote tone"
    },
    "infographic-bullets": {
      "default": "data-centric visualization with metrics display"
    },
    "call-to-action": {
      "default": "motivational call to action with forward momentum"
    },
    "default": "professional business imagery relevant to content"
  };

  const slideSuggestions = suggestions[slideType] || suggestions.default;
  
  for (const [keyword, suggestion] of Object.entries(slideSuggestions)) {
    if (keyword !== "default" && (title.includes(keyword) || content.includes(keyword))) {
      return suggestion;
    }
  }
  
  return typeof slideSuggestions === 'string' ? slideSuggestions : (slideSuggestions.default || "professional business imagery relevant to content");
}

function generateColorPalette(title) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('tech') || titleLower.includes('digital')) {
    return ["#667eea", "#764ba2", "#f093fb", "#4facfe"];
  } else if (titleLower.includes('health') || titleLower.includes('wellness')) {
    return ["#06d6a0", "#118ab2", "#073b4c", "#ef476f"];
  } else if (titleLower.includes('finance') || titleLower.includes('money')) {
    return ["#264653", "#2a9d8f", "#e76f51", "#f4a261"];
  } else if (titleLower.includes('creative') || titleLower.includes('design')) {
    return ["#ff006e", "#8338ec", "#3a86ff", "#fb5607"];
  } else if (titleLower.includes('environment') || titleLower.includes('sustainability')) {
    return ["#06d6a0", "#4ecdc4", "#45b7d1", "#ffa07a"];
  } else {
    return ["#6c5ce7", "#00b894", "#fdcb6e", "#e17055", "#74b9ff"];
  }
}

function getContentType(slideType) {
  const types = {
    "cover-hero": "introduction",
    "content-right-image": "key points",
    "content-left-image": "supporting details", 
    "content-split": "comparison",
    "quote-slide": "testimonial",
    "infographic-bullets": "metrics",
    "call-to-action": "summary",
    "conclusion": "summary"
  };
  return types[slideType] || "content";
}

function getDefaultTitle(index, slideType) {
  const defaults = {
    "cover-hero": "Presentation Title",
    "content-right-image": `Key Insight ${index}`,
    "content-left-image": `Important Finding ${index}`,
    "content-split": `Comparative Analysis`,
    "quote-slide": "Expert Perspective",
    "infographic-bullets": "Key Metrics",
    "call-to-action": "Next Steps & Action",
    "conclusion": "Summary & Takeaways"
  };
  return defaults[slideType] || `Slide ${index + 1}`;
}

function generateIntelligentFallbackSlides(slideCount, rawText) {
  const slideStructure = SLIDE_TYPE_DEFINITIONS[slideCount] || SLIDE_TYPE_DEFINITIONS[5];
  const fallbackSlides = [];
  
  // Extract key phrases from raw text for more relevant fallbacks
  const words = rawText.split(/\s+/).slice(0, 50);
  const keyPhrases = [...new Set(words.filter(word => word.length > 4))].slice(0, 10);
  
  for (let i = 0; i < slideCount; i++) {
    const slideType = slideStructure.slides[i]?.type || "content-right-image";
    const fallbackData = {
      title: getDefaultTitle(i, slideType),
      bullets: i === 0 ? [] : generateFallbackBullets(getDefaultTitle(i, slideType), slideType === "content-split" ? 4 : 3, slideType),
      ...(slideType === "quote-slide" && { quote: "Fallback insightful quote.", author: "Expert", context: "Relevant context." }),
      ...(slideType === "call-to-action" && { description: "Fallback action overview." })
    };

    const slide = transformToTextOnlySlide(fallbackData, i, slideCount);

    fallbackSlides.push(slide);
  }

  return fallbackSlides;
}

module.exports = { generateSlideText };