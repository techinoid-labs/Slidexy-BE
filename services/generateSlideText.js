const { textGenModel, qualityGenModel } = require("../utils/geminiModels");
const { v4: uuidv4 } = require("uuid");

// ─── Shared domain taxonomy, palettes, visual templates, and fallback data ───

const DOMAIN_KEYWORD_MAP = [
  { domain: "fintech",        keywords: ["finance","financial","fintech","banking","bank","revenue","payment","payments","invest","investment","funding","roi","profit","margin","capital","money","currency","crypto","stock","trading"] },
  { domain: "healthcare",     keywords: ["health","medical","clinical","patient","drug","pharma","pharmaceutical","wellness","therapy","hospital","doctor","medicine","treatment","diagnosis","biotech"] },
  { domain: "technology",     keywords: ["saas","software","api","platform","cloud","tech","technology","ai","ml","machine learning","engineering","developer","coding","data","automation","devops","cybersecurity"] },
  { domain: "marketing",      keywords: ["marketing","brand","campaign","audience","content","seo","social","engagement","funnel","advertising","conversion","influencer","pr","media"] },
  { domain: "education",      keywords: ["education","learning","training","curriculum","course","student","university","school","teaching","academia","e-learning","edtech","skill","knowledge","certification"] },
  { domain: "realestate",     keywords: ["real estate","property","housing","mortgage","construction","architecture","urban","rental","commercial","residential","zoning","lease"] },
  { domain: "sustainability", keywords: ["sustainability","climate","esg","carbon","renewable","green","environment","net-zero","energy","solar","wind","emission","ecological","circular","recycling"] },
  { domain: "logistics",      keywords: ["logistics","supply chain","shipping","warehouse","freight","delivery","inventory","fleet","transportation","distribution","cargo"] },
  { domain: "retail",         keywords: ["retail","e-commerce","ecommerce","consumer","shopping","product","store","customer","d2c","marketplace","merchandising","omnichannel"] },
  { domain: "hr",             keywords: ["hr","recruitment","talent","workforce","employee","culture","organization","people","hiring","onboarding","engagement","performance","payroll","benefits","diversity"] }
];

const DOMAIN_PALETTES = {
  fintech:        ["#0F172A", "#0EA5E9", "#38BDF8", "#F0F9FF", "#0369A1"],
  healthcare:     ["#064E3B", "#10B981", "#6EE7B7", "#F0FDF4", "#059669"],
  technology:     ["#1E1B4B", "#7C3AED", "#A78BFA", "#EDE9FE", "#5B21B6"],
  marketing:      ["#4A1942", "#E11D48", "#FB7185", "#FFF1F2", "#BE123C"],
  education:      ["#0C4A6E", "#0284C7", "#7DD3FC", "#F0F9FF", "#0369A1"],
  realestate:     ["#1C1917", "#D97706", "#FCD34D", "#FFFBEB", "#B45309"],
  sustainability: ["#14532D", "#16A34A", "#86EFAC", "#F0FDF4", "#15803D"],
  logistics:      ["#1E3A5F", "#F97316", "#FDBA74", "#FFF7ED", "#EA580C"],
  retail:         ["#3B0764", "#A855F7", "#D8B4FE", "#FAF5FF", "#7E22CE"],
  hr:             ["#18181B", "#8B5CF6", "#C4B5FD", "#F5F3FF", "#6D28D9"],
  default:        ["#6c5ce7", "#00b894", "#fdcb6e", "#e17055", "#74b9ff"]
};

const VISUAL_TEMPLATES = {
  fintech: {
    "cover-hero":          (s) => `financial growth visualization with upward trending graphs, modern banking UI on screens, confident professional in sharp business attire — subject: ${s}`,
    "content-right-image": (s) => `clean fintech dashboard with real-time analytics, digital payment flows, and currency symbols — representing: ${s}`,
    "content-left-image":  (s) => `financial analyst reviewing structured data reports and growth charts in modern office — context: ${s}`,
    "content-split":       (s) => `split-screen comparing two financial states or products side by side — context: ${s}`,
    "quote-slide":         ()  => `executive boardroom with city skyline backdrop, understated luxury — conveying financial authority`,
    "infographic-bullets": (s) => `data visualization panel with bar charts, line graphs, and KPI cards — metrics: ${s}`,
    "call-to-action":      ()  => `handshake over signed agreement with city skyline — forward momentum in financial partnership`,
    "conclusion":          (s) => `confident executive presenting results to boardroom — conclusion: ${s}`
  },
  healthcare: {
    "cover-hero":          (s) => `modern healthcare facility with advanced medical equipment and compassionate professionals — subject: ${s}`,
    "content-right-image": (s) => `clinical research environment with scientists analyzing medical data and lab results — representing: ${s}`,
    "content-left-image":  (s) => `doctor consulting patient in clean modern clinic with empathetic expression — context: ${s}`,
    "content-split":       (s) => `traditional care approach vs innovative treatment method side by side — context: ${s}`,
    "quote-slide":         ()  => `medical professional at podium addressing colleagues at healthcare conference`,
    "infographic-bullets": (s) => `medical data dashboard with patient outcome charts and clinical metrics — ${s}`,
    "call-to-action":      ()  => `healthcare team collaborating around patient care plan with digital tools`,
    "conclusion":          (s) => `positive patient outcome visualization with health indicators trending upward — ${s}`
  },
  technology: {
    "cover-hero":          (s) => `futuristic digital environment with glowing code streams, holographic UI elements, and developer workspace — subject: ${s}`,
    "content-right-image": (s) => `developer workspace with multiple monitors showing architecture diagrams and live code — representing: ${s}`,
    "content-left-image":  (s) => `clean product interface on device mockups in minimalist studio — context: ${s}`,
    "content-split":       (s) => `comparison split-screen: legacy system vs modern platform architecture — context: ${s}`,
    "quote-slide":         ()  => `tech conference stage with speaker and engaged audience in modern auditorium with large LED displays`,
    "infographic-bullets": (s) => `technical metrics dashboard with performance graphs, uptime indicators, and system health charts — ${s}`,
    "call-to-action":      ()  => `developer and business leader collaborating at whiteboard with product roadmap`,
    "conclusion":          (s) => `product launch moment — team celebrating milestone with dashboard showing key achievements — ${s}`
  },
  marketing: {
    "cover-hero":          (s) => `vibrant marketing campaign concept with bold typography, engaged audience, and brand elements — subject: ${s}`,
    "content-right-image": (s) => `marketing analytics dashboard showing campaign performance, funnel conversion, and audience insights — representing: ${s}`,
    "content-left-image":  (s) => `creative team brainstorming campaign strategy with mood boards and brand guidelines — context: ${s}`,
    "content-split":       (s) => `A/B split showing two campaign approaches side by side with performance metrics — context: ${s}`,
    "quote-slide":         ()  => `marketing executive presenting brand vision to creative agency team in modern office`,
    "infographic-bullets": (s) => `marketing metrics display with engagement rates, reach graphs, and conversion funnels — ${s}`,
    "call-to-action":      ()  => `team launching campaign with energy and momentum, hands on screens and keyboards`,
    "conclusion":          (s) => `campaign success visualization showing ROI metrics and audience growth — ${s}`
  },
  education: {
    "cover-hero":          (s) => `inspired learning environment with engaged students, digital tools, and collaborative atmosphere — subject: ${s}`,
    "content-right-image": (s) => `educator facilitating interactive session with students engaged around digital learning platform — representing: ${s}`,
    "content-left-image":  (s) => `student deep in study with research materials, annotations, and learning resources — context: ${s}`,
    "content-split":       (s) => `traditional vs modern pedagogy comparison showing student engagement levels — context: ${s}`,
    "quote-slide":         ()  => `renowned educator speaking at academic conference with engaged audience`,
    "infographic-bullets": (s) => `educational outcome metrics with learning improvement charts and student progress — ${s}`,
    "call-to-action":      ()  => `students and educators collaborating on next phase of learning journey`,
    "conclusion":          (s) => `graduation milestone achievement — celebration of educational outcomes — ${s}`
  },
  realestate: {
    "cover-hero":          (s) => `stunning architectural photography of flagship property with city skyline backdrop — subject: ${s}`,
    "content-right-image": (s) => `modern interior design of property showcasing key features and lifestyle — representing: ${s}`,
    "content-left-image":  (s) => `real estate professional reviewing market data and documents in modern office — context: ${s}`,
    "content-split":       (s) => `before/after property transformation or market comparison by district — context: ${s}`,
    "quote-slide":         ()  => `real estate developer at project site with completed building behind them`,
    "infographic-bullets": (s) => `property market data with price trends, occupancy rates, and ROI charts — ${s}`,
    "call-to-action":      ()  => `client and agent shaking hands at property with keys exchanging`,
    "conclusion":          (s) => `skyline view of completed development with key metrics overlaid — ${s}`
  },
  sustainability: {
    "cover-hero":          (s) => `sweeping natural landscape contrasted with innovative green technology installations — subject: ${s}`,
    "content-right-image": (s) => `renewable energy infrastructure with wind turbines or solar arrays in operation — representing: ${s}`,
    "content-left-image":  (s) => `sustainability team analyzing environmental impact data and carbon reduction strategies — context: ${s}`,
    "content-split":       (s) => `high-carbon past vs net-zero future comparison with measurable milestones — context: ${s}`,
    "quote-slide":         ()  => `environmental leader addressing global sustainability summit with audience of policy makers`,
    "infographic-bullets": (s) => `ESG metrics dashboard with carbon footprint reduction charts and sustainability KPIs — ${s}`,
    "call-to-action":      ()  => `diverse team planting trees or installing solar panels — community sustainability action`,
    "conclusion":          (s) => `thriving green city of the future with clean energy and healthy ecosystem — ${s}`
  },
  logistics: {
    "cover-hero":          (s) => `global logistics network visualization with shipping routes, warehouses, and delivery vehicles — subject: ${s}`,
    "content-right-image": (s) => `modern warehouse with automated systems and real-time inventory tracking screens — representing: ${s}`,
    "content-left-image":  (s) => `logistics manager overseeing operations with live dashboard of fleet and shipment status — context: ${s}`,
    "content-split":       (s) => `manual vs automated logistics process side by side with efficiency metrics — context: ${s}`,
    "quote-slide":         ()  => `supply chain executive presenting to logistics industry conference with global reach`,
    "infographic-bullets": (s) => `logistics performance metrics with delivery times, cost per unit, and fleet efficiency — ${s}`,
    "call-to-action":      ()  => `logistics team coordinating shipment with digital tools and satisfied customer receiving delivery`,
    "conclusion":          (s) => `seamless global supply chain with optimized routes and happy end customer — ${s}`
  },
  retail: {
    "cover-hero":          (s) => `vibrant retail environment or e-commerce interface with engaged shoppers and premium product display — subject: ${s}`,
    "content-right-image": (s) => `modern retail store or digital storefront with curated product experience and customer journey — representing: ${s}`,
    "content-left-image":  (s) => `retail analytics dashboard with sales trends, basket size, and customer behavior insights — context: ${s}`,
    "content-split":       (s) => `in-store experience vs digital channel comparison with conversion and satisfaction metrics — context: ${s}`,
    "quote-slide":         ()  => `retail CEO at industry summit presenting innovation strategy to brand leaders`,
    "infographic-bullets": (s) => `retail performance metrics with GMV growth, conversion rates, and customer lifetime value — ${s}`,
    "call-to-action":      ()  => `customer completing seamless purchase journey with smile, mobile device or in-store`,
    "conclusion":          (s) => `brand milestone celebration with sales achievements and loyal customer base — ${s}`
  },
  hr: {
    "cover-hero":          (s) => `diverse and engaged workforce collaborating in modern inclusive workplace — subject: ${s}`,
    "content-right-image": (s) => `HR team facilitating onboarding or development session with new talent — representing: ${s}`,
    "content-left-image":  (s) => `people analytics dashboard showing workforce metrics, engagement scores, and retention trends — context: ${s}`,
    "content-split":       (s) => `current workforce culture vs target culture transformation roadmap comparison — context: ${s}`,
    "quote-slide":         ()  => `CHRO speaking at talent summit about the future of work and employee experience`,
    "infographic-bullets": (s) => `HR metrics display with employee NPS, retention rates, and hiring funnel performance — ${s}`,
    "call-to-action":      ()  => `HR leader and candidate shaking hands — successful talent acquisition moment`,
    "conclusion":          (s) => `thriving team celebrating company achievement — strong culture and high performance — ${s}`
  }
};

const INFOGRAPHIC_FALLBACKS = [
  "68% — Organizations that prioritize this area outperform industry peers on key performance metrics",
  "3.5× — Average return on investment reported by companies implementing structured best practices",
  "42 days — Typical time-to-value when adopting a phased, disciplined implementation approach",
  "89% — Stakeholder satisfaction rate achieved through consistent delivery and clear communication",
  "2.1× — Productivity improvement observed in teams with dedicated process and workflow optimization"
];

// Variant counts per layout type — must stay in sync with frontend LAYOUT_VARIANT_COUNTS
const LAYOUT_VARIANT_COUNTS = {
  "cover-hero":               10,
  "content-right-image":      10,
  "content-left-image":        5,
  "content-split":             5,
  "comparison-slide":          3,
  "infographic-bullets":       5,
  "timeline-slide":            5,
  "quote-slide":               5,
  "conclusion":                5,
  "call-to-action":            5,
  "full-image-text-overlay":   5,
};

// ─── Domain detection helper (shared by visual suggestions and palette) ──────

function detectDomain(corpus) {
  const lower = (corpus || "").toLowerCase();
  let bestDomain = "default";
  let bestScore = 0;
  for (const entry of DOMAIN_KEYWORD_MAP) {
    const score = entry.keywords.filter(kw => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestDomain = entry.domain;
    }
  }
  return bestDomain;
}

// Slide type definitions with content requirements
const SLIDE_TYPE_DEFINITIONS = {
  3: {
    slides: [
      { type: "cover-hero", description: "Compelling title, subtitle, and 2-3 key highlights" },
      { type: "content-right-image", description: "Most important key points and insights" },
      { type: "conclusion", description: "Powerful summary and call to action" }
    ],
    contentFocus: "Concise and impactful - perfect for quick presentations"
  },
  5: {
    slides: [
      { type: "cover-hero", description: "Engaging title, subtitle, and 2-3 preview points" },
      { type: "content-right-image", description: "Primary problem or opportunity" },
      { type: "content-left-image", description: "Solution approach and methodology" },
      { type: "content-split", description: "Key benefits and differentiators" },
      { type: "call-to-action", description: "Clear next steps and action items" }
    ],
    contentFocus: "Problem-solution narrative with clear progression"
  },
  7: {
    slides: [
      { type: "cover-hero", description: "Professional title, subtitle, and 2-3 key takeaways" },
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
      { type: "cover-hero", description: "Strategic title, subtitle, and 2-3 overview points" },
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

const MAX_GENERATION_RETRIES = 2;

async function generateSlideText(rawText, meta = {}, slideCount = 5, progressCallback = null, fileData = null, designGuidelines = "") {
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
You are a world-class presentation content strategist. Create EXACTLY ${slideCount} slides with precise textual data for frontend layout mapping. All text must be grammatically flawless and free of spelling mistakes.

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
${designGuidelines ? `\nDESIGN & STYLE GUIDELINES (apply consistently to every slide's tone and content density):\n${designGuidelines}\n` : ''}

CONTENT QUALITY STANDARDS — READ CAREFULLY BEFORE GENERATING:

RULE 1 — TITLE SPECIFICITY
• Titles must reference ACTUAL subject matter from the content source. Never use generic titles like "Key Insights", "Important Analysis", "Core Capabilities", or "Overview of X".
• Good: "Revenue Doubled in 18 Months" | "Three Risks Demanding Immediate Action" | "Why Traditional Banks Are Losing"
• Word count: 4–7 words. A title can be longer only if it is genuinely impactful and specific.

RULE 2 — COVER-HERO SLIDE
• Title: The single most powerful or surprising claim from the entire presentation.
• Subtitle: One sentence (max 20 words) framing WHY this matters to the audience RIGHT NOW.
• Preview bullets (2–3): Each must preview a SPECIFIC, NAMED insight from a later slide — not vague teasers.
  - Good: "Global expansion increased user base by 340% in Q3"
  - Bad: "Strategic overview and key insights"

RULE 3 — CONTENT SLIDES (content-right-image, content-left-image)
• Each bullet must be 15–25 words — a COMPLETE, SPECIFIC thought with supporting detail, number, or outcome.
• At least ONE bullet per slide must contain a concrete figure, date, name, percentage, or measurable result from the source content.
• Bullets must build logically: first bullet = main point, subsequent bullets = evidence/detail/implication.
• Good: "Mobile-first approach reduced customer onboarding time from 14 days to under 48 hours across all markets"
• Bad: "Improved onboarding process with faster turnaround time"

RULE 4 — CONTENT-SPLIT SLIDES (comparative layout)
• Use EXACTLY 4–6 bullets arranged as contrasting pairs (even count for even split).
• Prefix each bullet to indicate its side: "Before: ...", "After: ...", OR "Strength: ...", "Challenge: ...", OR "Option A: ...", "Option B: ..."
• Good: "Before: Manual processing required 3 FTEs and a 5-day turnaround" / "After: Automated pipeline completes the same work in 4 hours with zero manual input"

RULE 5 — QUOTE SLIDES
• Extract an ACTUAL quote or verbatim statement from the source content if one exists. If not, synthesize a realistic quote a credible industry professional would genuinely say.
• Author must be a named role (e.g., "Dr. Priya Mehta, Chief Medical Officer, HealthTech Inc.") — never just "Expert Name".
• Quote length: 25–60 words. Must be a complete, meaningful thought.
• Context (1 sentence): explain exactly what this quote proves about the presentation's central argument.
• NEVER write: "A powerful insight from industry experts." — this fails quality review automatically.

RULE 6 — INFOGRAPHIC-BULLETS (data-visual slide)
• ALL bullets must follow: "METRIC — One specific sentence explaining what this metric means and why it matters"
• Metrics must be REAL numbers from the source content, or realistic industry-standard benchmarks cited as such.
• Good: "47% — Reduction in customer churn achieved after implementing the new onboarding workflow in Year 2"
• Bad: "73% — Growth in key metric over last year"

RULE 7 — CALL-TO-ACTION / CONCLUSION SLIDES
• Bullets (1–2): SPECIFIC next steps with WHO, WHAT, and WHEN. Not vague intentions.
  - Good: "Schedule a discovery call with our solutions team within 72 hours to begin project scoping"
  - Bad: "Take action to implement the solution"
• Description: Summarize the single most important reason to act NOW, with urgency framing.

RULE 8 — NARRATIVE FLOW (cross-slide coherence)
• Slides must tell a STORY. Each slide title should logically follow from the previous.
• Introduce a CENTRAL TENSION in Slide 2 (problem/challenge/opportunity). Every subsequent slide deepens, resolves, or builds on it.
• The final slide must directly answer: "What should the audience DO with everything they just learned?"
• Repeat 1–2 KEY TERMS consistently across all slides to create a conceptual thread.

RULE 9 — TONE ENFORCEMENT
• Persuasive: active verbs, present tense, confident assertions ("This eliminates...", not "This may help...")
• Educational: comparative structures and "why it matters" framing in every bullet
• Inspirational: lead with vision and aspirational present tense ("We are building...", "The future belongs to...")
• Technical: include methodology references, specific tools/frameworks, measurable outcomes

RULE 10 — ZERO TOLERANCE PHRASES (never generate these — rewrite if you catch yourself using them)
• "Key advantage in competitive market positioning"
• "Proven methodology for sustainable growth"
• "Data-driven insights supporting decisions"
• "Strategic partnerships enhancing capabilities"
• "Innovative solutions addressing challenges"
• "Measurable outcomes from implementation"
• "A powerful insight from industry experts"
• Any author named "Expert Name" or "Expert Source"
• Any bullet starting with "Leveraging", "Utilizing", or "Harnessing"

CRITICAL STRUCTURAL RULES:
• EVERY bullet slide MUST have the required number of bullets — no empty arrays.
• Spelling & grammar: double-check every word before finalizing.

OUTPUT FORMAT - Return ONLY valid JSON array with exactly ${slideCount} objects. Use these exact structures:

For cover-hero (HYBRID APPROACH):
{
  "slide_number": 1,
  "layout_type": "cover-hero",
  "title": "Strategic Title Here",
  "subtitle": "Compelling subtitle that sets context",
  "bullets": [
    "First key preview point (5-8 words)",
    "Second essential takeaway (5-8 words)",
    "Third compelling highlight (5-8 words)"
  ]
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

    // Retry loop: transient JSON/parse failures get a re-attempt with a
    // cooled-down temperature and the previous error fed back to the model,
    // instead of immediately dropping to a fully generic fallback deck.
    let aiSlides = null;
    let jsonString = "";
    let lastGenerationError = "";
    let lastRawResponse = "";

    for (let attempt = 0; attempt <= MAX_GENERATION_RETRIES; attempt++) {
      try {
        const attemptPrompt = attempt === 0
          ? prompt
          : `${prompt}\n\nERROR_FROM_PREVIOUS_ATTEMPT: ${lastGenerationError}\nPREVIOUS_RAW_RESPONSE: ${lastRawResponse.slice(0, 1500)}\n\nTASK: Correct the issue above. Return ONLY a valid, complete JSON array of exactly ${slideCount} slide objects, matching the structures shown earlier. Do NOT include any text before or after the JSON array.`;

        let generationInput;
        if (fileData) {
          generationInput = [
            { text: attemptPrompt },
            {
              inlineData: {
                data: fileData.data,
                mimeType: fileData.mimeType
              }
            }
          ];
        } else {
          generationInput = attemptPrompt;
        }

        const currentTemperature = Math.max(0.2, 0.9 - attempt * 0.3);

        // Quality tier: this is the copy the user reads, and the prompt above
        // carries a dozen specific rules. A small model agrees with the rules
        // and then writes generically anyway.
        //
        // Temperature goes through `opts`, not `generationConfig`: the
        // OpenRouter path normalises `contents` and drops everything else, so
        // the cool-down on retries was silently doing nothing.
        const result = await qualityGenModel.generateContent(
          {
            contents: [{ role: "user", parts: Array.isArray(generationInput) ? generationInput : [{ text: generationInput }] }],
            generationConfig: { temperature: currentTemperature },
          },
          { temperature: currentTemperature }
        );
        const raw = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        lastRawResponse = raw;

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

        jsonString = cleaned.slice(firstBracket, lastBracket + 1);
        const parsed = JSON.parse(jsonString);

        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error("Parsed JSON was not a non-empty array of slides");
        }

        aiSlides = parsed;
        break; // success
      } catch (attemptErr) {
        lastGenerationError = attemptErr.message;
        console.warn(`Slide generation attempt ${attempt + 1}/${MAX_GENERATION_RETRIES + 1} failed: ${attemptErr.message}`);
        if (attempt === MAX_GENERATION_RETRIES) {
          throw attemptErr; // exhausted retries, let outer catch use intelligent fallback
        }
      }
    }

    // quick spell/grammar pass through the model to catch any typos
    try {
      const proofPrompt = `Proofread the following JSON array of slides for any spelling or grammar mistakes. Return corrected JSON only:\n${jsonString}`;
      const proofRes = await textGenModel.generateContent(proofPrompt);
      const proofRaw = proofRes.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const start = proofRaw.indexOf("[");
      const end = proofRaw.lastIndexOf("]");
      if (start !== -1 && end !== -1) {
        const cleanedProof = proofRaw.slice(start, end + 1);
        aiSlides = JSON.parse(cleanedProof);
      }
    } catch (proofErr) {
      console.warn("Slide text proofread step failed, using original slides:", proofErr.message);
    }

    // Notify progress: processing slides
    if (progressCallback) {
      progressCallback(Math.floor(slideCount * 0.5), slideCount);
    }

    // Validate and fix counts - enhanced for cover-hero, content-split and infographic-bullets
    aiSlides = aiSlides.map((slide, index) => {
      // Notify progress for each slide being processed
      if (progressCallback) {
        progressCallback(index + 1, slideCount);
      }

      if (slide.layout_type === "cover-hero") {
        if (!slide.subtitle) {
          slide.subtitle = "Professional presentation overview based on your content.";
        }
        // Ensure cover-hero has 2-3 bullets
        if (!slide.bullets || slide.bullets.length < 2) {
          const fallbackBullets = generateFallbackBullets(slide.title, 3, "cover-hero");
          slide.bullets = [...(slide.bullets || []), ...fallbackBullets].slice(0, 3);
        } else {
          slide.bullets = slide.bullets.slice(0, 3);
        }
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
        const extractedFallbackQuote = extractQuoteFromSource(safeRawText);
        slide.quote = extractedFallbackQuote || "The most valuable competitive advantage today is the ability to learn, adapt, and act faster than the market expects — and then act on what you learn.";
        slide.author = "Industry Leader";
        slide.context = `This perspective reinforces the central argument of this presentation on ${slide.title || "the topic"}.`;
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
      return transformToTextOnlySlide(aiSlide, index, slideCount, safeRawText);
    });

    // Notify progress: complete
    if (progressCallback) {
      progressCallback(slideCount, slideCount);
    }

    return slides;

  } catch (err) {
    console.error("❌ SLIDE TEXT GENERATION FAILED:");
    console.error("   Error Message:", err.message || err);
    console.error("   Error Status:", err.status);
    console.error("   Error Details:", err.errorDetails || err);
    console.error("   Stack:", err.stack);
    console.error("\n⚠️  USING FALLBACK SLIDES - This means Gemini 2.0-flash is not responding correctly");
    
    // Return intelligent fallback slides
    return generateIntelligentFallbackSlides(slideCount, safeRawText);
  }
}

function generateFallbackBullets(title, count, layoutType) {
  const basePhrases = [
    `${title} addresses a critical challenge that organizations in this space face today, with measurable impact on outcomes.`,
    "This approach has demonstrated consistent improvements in efficiency, quality, and stakeholder satisfaction across comparable implementations.",
    "The evidence supporting this direction comes from real-world results, not theoretical frameworks — making it immediately actionable.",
    "Key differentiators include speed of execution, lower total cost of ownership, and a clear path to measurable return on investment.",
    "Adoption of this strategy positions the organization ahead of emerging competitive pressures and regulatory shifts.",
    "The implementation roadmap is phased for risk mitigation, with clear milestones and accountability at each stage."
  ];

  const coverPhrases = [
    `Discover how ${title} is transforming outcomes for leading organizations in this field`,
    "Real data, specific case evidence, and actionable next steps included throughout this presentation",
    "Attendees will leave with a clear decision framework and a prioritized implementation path"
  ];

  const splitPhrases = [
    `Before: Traditional approach requires significant manual effort and extended lead times for ${title}`,
    "After: Streamlined methodology delivers the same outcomes in a fraction of the time and cost",
    "Strength: Proven track record with measurable results across diverse organizational contexts",
    "Opportunity: Untapped potential in adjacent areas where this approach applies equally well",
    "Challenge: Legacy systems and change-resistance slow adoption despite a clear business case",
    "Solution: Phased rollout with stakeholder engagement built in from day one reduces resistance"
  ];

  let sourceArray;
  if (layoutType === "cover-hero") {
    sourceArray = coverPhrases;
  } else if (layoutType === "content-split") {
    sourceArray = splitPhrases;
  } else {
    sourceArray = basePhrases;
  }

  const fallback = [];
  for (let i = 0; i < count; i++) {
    if (layoutType === "infographic-bullets") {
      fallback.push(INFOGRAPHIC_FALLBACKS[i % INFOGRAPHIC_FALLBACKS.length]);
    } else {
      fallback.push(sourceArray[i % sourceArray.length]);
    }
  }
  return fallback;
}

function transformToTextOnlySlide(aiSlide, index, totalSlides, rawText = "") {
  const slideStructure = SLIDE_TYPE_DEFINITIONS[totalSlides];
  const slideType = slideStructure?.slides[index]?.type || aiSlide.layout_type || "content-right-image";

  const slideId = `slide-${uuidv4()}`;
  const variantCount = LAYOUT_VARIANT_COUNTS[slideType] || 5;
  const currentVariantIndex = Math.floor(Math.random() * variantCount);

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
    art_palette: generateColorPalette(aiSlide.title, aiSlide.bullets),
    elements: [],
    image_url: null,
    image_caption: "",
    image_placeholder: { x: 520, y: 40, width: 400, height: 460 },
    content_metadata: {
      title: aiSlide.title || "",
      subtitle: aiSlide.subtitle || "",
      bullet_count: 0,
      has_quote: !!aiSlide.quote,
      has_data: slideType === "infographic-bullets"
    },
    slide_number: index + 1,
    total_slides: totalSlides,
    currentVariantIndex,
    created_at: { $date: { $numberLong: Date.now().toString() } },
    updated_at: { $date: { $numberLong: Date.now().toString() } }
  };

  // Add title (required for all slides)
  slide.slide_title = {
    text: aiSlide.title || getDefaultTitle(index, slideType),
    _id: { $oid: uuidv4().replace(/-/g, '').slice(0, 24) }
  };

  // Handle different slide types for elements
  switch (slideType) {
    case "cover-hero":
      // Add subtitle
      const coverSubtitle = aiSlide.subtitle || "Professional presentation overview based on your content.";
      slide.subtitle = {
        text: coverSubtitle,
        _id: { $oid: uuidv4().replace(/-/g, '').slice(0, 24) }
      };
      slide.content_metadata.subtitle = coverSubtitle;

      // HYBRID APPROACH: Add subtle bullets to cover-hero
      if (aiSlide.bullets && aiSlide.bullets.length > 0) {
        // Ensure we have 2-3 bullets for cover slide
        const coverBullets = aiSlide.bullets.slice(0, 3);
        coverBullets.forEach((bullet) => {
          slide.elements.push({
            element_type: "bullet_point",
            text: bullet,
            element_id: `element-${uuidv4()}`,
            id: uuidv4()
          });
        });
        slide.content_metadata.bullet_count = coverBullets.length;
      } else {
        // Generate fallback bullets from the source content
        const fallbackBullets = generateFallbackBullets(aiSlide.title || "Presentation", 3, "cover-hero");
        fallbackBullets.forEach((bullet) => {
          slide.elements.push({
            element_type: "bullet_point",
            text: bullet,
            element_id: `element-${uuidv4()}`,
            id: uuidv4()
          });
        });
        slide.content_metadata.bullet_count = fallbackBullets.length;
      }
      break;

    case "quote-slide":
      // Add subtitle for quote slides
      const quoteSubtitle = aiSlide.subtitle || "";
      slide.subtitle = {
        text: quoteSubtitle,
        _id: { $oid: uuidv4().replace(/-/g, '').slice(0, 24) }
      };
      slide.content_metadata.subtitle = quoteSubtitle;

      // Strict fallback logic — prefer extracted quote from source text over generic placeholder
      const _extractedQuote = extractQuoteFromSource(rawText);
      const quoteText = (aiSlide.quote && typeof aiSlide.quote === 'string' && aiSlide.quote.trim().length > 0)
        ? aiSlide.quote
        : (_extractedQuote || "The most valuable competitive advantage today is the ability to learn, adapt, and act faster than the market expects — and then act on what you learn.");

      const authorText = (aiSlide.author && typeof aiSlide.author === 'string' && aiSlide.author.trim().length > 0)
        ? aiSlide.author
        : "Industry Leader";

      const contextText = (aiSlide.context && typeof aiSlide.context === 'string' && aiSlide.context.trim().length > 0)
        ? aiSlide.context
        : "This highlights a key message relevant to the audience.";

      // Always add quote element
      slide.elements.push({
        id: uuidv4(),
        element_id: `element-${uuidv4()}`,
        element_type: "quote",
        text: String(quoteText)
      });
      slide.quote = String(quoteText);
      slide.content_metadata.quote = String(quoteText);

      // Always add author element
      slide.elements.push({
        id: uuidv4(),
        element_id: `element-${uuidv4()}`,
        element_type: "author",
        text: String(authorText)
      });
      slide.author = String(authorText);
      slide.content_metadata.author = String(authorText);

      // Always add context element
      slide.elements.push({
        id: uuidv4(),
        element_id: `element-${uuidv4()}`,
        element_type: "context",
        text: String(contextText)
      });
      slide.context = String(contextText);
      slide.content_metadata.context = String(contextText);

      // Add to knowledge too
      slide.knowledge.quoteContent = String(quoteText);
      slide.knowledge.quoteAuthor = String(authorText);
      break;

    case "call-to-action":
    case "conclusion":
      // Add subtitle for CTA/conclusion slides
      const ctaSubtitle = aiSlide.subtitle || "";
      slide.subtitle = {
        text: ctaSubtitle,
        _id: { $oid: uuidv4().replace(/-/g, '').slice(0, 24) }
      };
      slide.content_metadata.subtitle = ctaSubtitle;

      if (aiSlide.bullets) {
        aiSlide.bullets.forEach((bullet) => {
          slide.elements.push({
            id: uuidv4(),
            element_id: `element-${uuidv4()}`,
            element_type: "bullet_point",
            text: bullet
          });
        });
      }
      if (aiSlide.description) {
        slide.elements.push({
          id: uuidv4(),
          element_id: `element-${uuidv4()}`,
          element_type: "description",
          text: aiSlide.description
        });
      }
      break;

    case "infographic-bullets":
      // Add subtitle for infographic slides
      const infoSubtitle = aiSlide.subtitle || "";
      slide.subtitle = {
        text: infoSubtitle,
        _id: { $oid: uuidv4().replace(/-/g, '').slice(0, 24) }
      };
      slide.content_metadata.subtitle = infoSubtitle;

      if (aiSlide.bullets) {
        aiSlide.bullets.forEach((bullet) => {
          slide.elements.push({
            id: uuidv4(),
            element_id: `element-${uuidv4()}`,
            element_type: "bullet_point",
            text: bullet
          });
        });
      }
      break;

    default: // Content slides including content-split
      // Add subtitle for content slides
      const contentSubtitle = aiSlide.subtitle || "";
      slide.subtitle = {
        text: contentSubtitle,
        _id: { $oid: uuidv4().replace(/-/g, '').slice(0, 24) }
      };
      slide.content_metadata.subtitle = contentSubtitle;

      if (aiSlide.bullets && aiSlide.bullets.length > 0) {
        aiSlide.bullets.forEach((bullet) => {
          slide.elements.push({
            id: uuidv4(),
            element_id: `element-${uuidv4()}`,
            element_type: "bullet_point",
            text: bullet
          });
        });
      }
  }

  // Update content_metadata bullet_count after adding elements
  slide.content_metadata.bullet_count = slide.elements.filter(el => el.element_type === "bullet_point").length;

  return slide;
}

function generateVisualSuggestion(aiSlide, slideType) {
  const title = aiSlide.title || "";
  const bulletsText = Array.isArray(aiSlide.bullets) ? aiSlide.bullets.join(" ") : "";
  const quoteText = aiSlide.quote || "";
  const contentCorpus = `${title} ${bulletsText} ${quoteText}`;

  const domain = detectDomain(contentCorpus);
  const domainTemplates = VISUAL_TEMPLATES[domain];

  if (domainTemplates) {
    const templateFn = domainTemplates[slideType] || domainTemplates["content-right-image"];
    if (templateFn) {
      return templateFn(title);
    }
  }

  // Generic fallback that still incorporates the slide subject
  const genericFallbacks = {
    "cover-hero":          `professional and compelling hero imagery representing: ${title}`,
    "content-right-image": `clear business context visualization supporting the key message: ${title}`,
    "content-left-image":  `relevant supporting imagery that reinforces: ${title}`,
    "content-split":       `split-view comparison layout with two contrasting perspectives on: ${title}`,
    "quote-slide":         `thoughtful and authoritative setting appropriate for: ${title}`,
    "infographic-bullets": `data visualization and metrics display for: ${title}`,
    "call-to-action":      `forward-momentum imagery motivating action on: ${title}`,
    "conclusion":          `resolution and achievement imagery summarizing: ${title}`
  };

  return genericFallbacks[slideType] || `professional business imagery relevant to: ${title}`;
}

function generateColorPalette(title, bullets = []) {
  const corpus = `${title || ""} ${Array.isArray(bullets) ? bullets.join(" ") : ""}`;
  const domain = detectDomain(corpus);
  return DOMAIN_PALETTES[domain] || DOMAIN_PALETTES.default;
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

function extractQuoteFromSource(text) {
  if (!text || typeof text !== "string") return null;
  const doubleQuoted = text.match(/"([^"]{60,350})"/);
  if (doubleQuoted) return doubleQuoted[1].trim();
  const singleQuoted = text.match(/'([^']{60,350})'/);
  if (singleQuoted) return singleQuoted[1].trim();
  return null;
}

function extractSentences(text, maxSentences = 12) {
  if (!text || typeof text !== "string") return [];
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => {
      const wordCount = s.split(/\s+/).length;
      return wordCount >= 8 && wordCount <= 35;
    })
    .slice(0, maxSentences);
}

function generateIntelligentFallbackSlides(slideCount, rawText) {
  const slideStructure = SLIDE_TYPE_DEFINITIONS[slideCount] || SLIDE_TYPE_DEFINITIONS[5];
  const fallbackSlides = [];

  // Extract real sentences from source text to populate fallback slide content
  const realSentences = extractSentences(rawText);
  const extractedQuote = extractQuoteFromSource(rawText);
  let sentenceIndex = 0;

  for (let i = 0; i < slideCount; i++) {
    const slideType = slideStructure.slides[i]?.type || "content-right-image";
    const defaultTitle = getDefaultTitle(i, slideType);

    // Build bullets from real extracted sentences when available
    const bulletCount = slideType === "content-split" ? 4 : 3;
    const extractedBullets = [];
    for (let b = 0; b < bulletCount; b++) {
      if (sentenceIndex < realSentences.length) {
        extractedBullets.push(realSentences[sentenceIndex++]);
      }
    }
    const bullets = extractedBullets.length >= bulletCount
      ? extractedBullets
      : generateFallbackBullets(defaultTitle, bulletCount, slideType);

    const fallbackData = {
      title: defaultTitle,
      subtitle: slideType === "cover-hero" ? "A structured overview of the key insights from your content." : undefined,
      bullets,
      ...(slideType === "quote-slide" && {
        quote: extractedQuote || "The most valuable competitive advantage today is the ability to learn, adapt, and act faster than the market expects \u2014 and then act on what you learn.",
        author: "Industry Leader",
        context: "This perspective reinforces the core theme of this presentation."
      }),
      ...(slideType === "call-to-action" && {
        description: "Take the first concrete step today — the longer you wait, the more ground competitors will gain."
      })
    };

    const slide = transformToTextOnlySlide(fallbackData, i, slideCount, rawText);
    fallbackSlides.push(slide);
  }

  return fallbackSlides;
}

module.exports = { generateSlideText };