/**
 * Content Generator Service
 * Generates JSON content data for templates using Gemini
 * Modified to generate content-only (not HTML)
 */

const { textGenModel } = require('../../../../utils/geminiModels');
const JSON5 = require('json5');
const infographicCards = require('../../../../constants/card');
const infographicPatterns = require('../../../../constants/background');

// Topic-aware color schemes - light and pastel only
const COLOR_SCHEMES = {
  // Technology & Innovation - Cool blues and cyans
  techBlue: {
    primary: ['#caf0f8', '#90e0ef'],
    secondary: ['#ade8f4', '#00b4d8'],
    accent: '#0077b6',
    text: '#03045e',
    topics: ['technology', 'innovation', 'digital', 'software', 'ai', 'computer', 'data', 'tech', 'coding', 'programming']
  },
  // Nature & Environment - Greens and earth tones
  forestGreen: {
    primary: ['#d8f3dc', '#b7e4c7'],
    secondary: ['#95d5b2', '#74c69d'],
    accent: '#2d6a4f',
    text: '#1b4332',
    topics: ['nature', 'environment', 'green', 'eco', 'plant', 'forest', 'organic', 'sustainability', 'earth', 'garden']
  },
  // Health & Medical - Clean whites with medical blues
  medicalBlue: {
    primary: ['#e0f4ff', '#c6e7ff'],
    secondary: ['#a8daff', '#7cc8ff'],
    accent: '#0096c7',
    text: '#023047',
    topics: ['health', 'medical', 'healthcare', 'hospital', 'medicine', 'doctor', 'wellness', 'fitness', 'care', 'therapy']
  },
  // Business & Finance - Professional blues and golds
  corporateGold: {
    primary: ['#fff4e6', '#ffe8cc'],
    secondary: ['#ffd8a8', '#ffc078'],
    accent: '#e67700',
    text: '#5f3c00',
    topics: ['business', 'finance', 'corporate', 'money', 'investment', 'banking', 'economy', 'marketing', 'sales', 'management']
  },
  // Education & Learning - Warm yellows and oranges
  academicYellow: {
    primary: ['#fff9e6', '#fff3cc'],
    secondary: ['#ffe6a8', '#ffd966'],
    accent: '#f4a259',
    text: '#6b4423',
    topics: ['education', 'learning', 'school', 'university', 'teaching', 'student', 'academic', 'study', 'course', 'training']
  },
  // Creative & Arts - Vibrant purples and pinks
  creativeViolet: {
    primary: ['#f3e5f5', '#e1bee7'],
    secondary: ['#ce93d8', '#ba68c8'],
    accent: '#8e24aa',
    text: '#4a148c',
    topics: ['art', 'creative', 'design', 'music', 'artist', 'painting', 'photography', 'culture', 'aesthetic', 'visual']
  },
  // Food & Culinary - Warm reds and oranges
  culinaryRed: {
    primary: ['#ffe5e5', '#ffcccc'],
    secondary: ['#ffb3b3', '#ff9999'],
    accent: '#e63946',
    text: '#800f19',
    topics: ['food', 'cooking', 'restaurant', 'recipe', 'cuisine', 'chef', 'culinary', 'meal', 'dish', 'kitchen']
  },
  // Travel & Adventure - Tropical teals and corals
  travelTeal: {
    primary: ['#e0f7fa', '#b2ebf2'],
    secondary: ['#80deea', '#4dd0e1'],
    accent: '#00acc1',
    text: '#006064',
    topics: ['travel', 'adventure', 'tourism', 'vacation', 'journey', 'explore', 'destination', 'trip', 'holiday', 'world']
  },
  // Science & Research - Clean lab whites with scientific blues
  scienceBlue: {
    primary: ['#e8eaf6', '#c5cae9'],
    secondary: ['#9fa8da', '#7986cb'],
    accent: '#3f51b5',
    text: '#1a237e',
    topics: ['science', 'research', 'laboratory', 'experiment', 'chemistry', 'physics', 'biology', 'scientific', 'study', 'analysis']
  },
  // Sports & Fitness - Energetic oranges and reds
  sportsOrange: {
    primary: ['#fff3e0', '#ffe0b2'],
    secondary: ['#ffcc80', '#ffb74d'],
    accent: '#f57c00',
    text: '#e65100',
    topics: ['sports', 'fitness', 'exercise', 'training', 'athlete', 'workout', 'gym', 'competition', 'game', 'physical']
  },
  // Entertainment & Media - Rich purples and magentas
  entertainmentPurple: {
    primary: ['#f3e5f5', '#e1bee7'],
    secondary: ['#ce93d8', '#ba68c8'],
    accent: '#ab47bc',
    text: '#6a1b9a',
    topics: ['entertainment', 'media', 'movie', 'film', 'show', 'video', 'television', 'streaming', 'content', 'celebrity']
  },
  // Social & Community - Warm pinks and corals
  socialPink: {
    primary: ['#fce4ec', '#f8bbd0'],
    secondary: ['#f48fb1', '#f06292'],
    accent: '#ec407a',
    text: '#880e4f',
    topics: ['social', 'community', 'people', 'network', 'society', 'group', 'relationship', 'communication', 'human', 'connection']
  },
  // Default fallback schemes (light pastels for general use)
  cottonCandy: {
    primary: ['#ffecd2', '#fcb69f'],
    secondary: ['#fbc2eb', '#a6c1ee'],
    accent: '#f472b6',
    text: '#4a5568',
    topics: []
  },
  lavenderFields: {
    primary: ['#e0aaff', '#c77dff'],
    secondary: ['#f8f9fa', '#e9ecef'],
    accent: '#9c88ff',
    text: '#495057',
    topics: []
  },
  sakuraBloom: {
    primary: ['#ffb7d5', '#c9ffbf'],
    secondary: ['#b4f8c8', '#ffd3b6'],
    accent: '#ff6b9d',
    text: '#2d3748',
    topics: []
  },
  mintFresh: {
    primary: ['#d4f1f4', '#a8dadc'],
    secondary: ['#e8f5e9', '#c8e6c9'],
    accent: '#06b6d4',
    text: '#457b9d',
    topics: []
  }
};

const ALLOWED_STYLES = [
  'glassmorphism',
  'neumorphism',
  'gradient-layering',
  'aurora-gradient',
  'mesh-gradient',
  'glassy-layers-shadows',
  'subtle-pattern-overlay',
];

const ALLOWED_CARD_TYPES = [
  'pill',
  'diamond',
  'parallelogram',
  'glass-card',
  'chat-bubble',
  'ribbon',
  'trapezoid',
  'pentagon',
  'double-layered-card',
  'semi-ellipse',
  'circle',
  'rectangle',
];

const ALLOWED_BACKGROUNDS = [
  'dotted',
  'checkerboard',
  'gradient',
  'mesh-gradient',
  'radial-gradient',
  'subtle-pattern1',
  'soft-gradient',
  'subtle-pattern2',
];

const VIEW_MODES = {
  landscape: {
    aspectRatio: '16:9',
    maxWidth: '1280px',
    layoutGuidelines: [
      'Use grid or flex layouts that emphasize horizontal reading flow',
      'Perfect for dashboards, wide timelines, and comparative visuals',
      'Use horizontal charts, legends on sides, and equal card proportions',
    ],
  },
  portrait: {
    aspectRatio: '9:16',
    maxWidth: '480px',
    layoutGuidelines: [
      'Use vertical stacking for better mobile readability',
      'Center content and use larger fonts for mobile viewing',
      'Limit content to prevent scrolling in mobile aspect ratio',
    ],
  },
};

class ContentGenerator {
  constructor() {
    this.retries = 3;
  }

  /**
   * Intelligently select color scheme based on topic keywords with enhanced matching
   * @param {string} prompt - User prompt/topic
   * @returns {string} Best matching color scheme name
   * @private
   */
  _selectColorSchemeByTopic(prompt) {
    const lowerPrompt = prompt.toLowerCase().trim();
    
    // Define semantic groups and related keywords
    const semanticGroups = {
      techBlue: ['tech', 'tech', 'computer', 'programming', 'software', 'app', 'algorithm', 'database', 'server', 'api', 'network', 'system', 'development', 'code', 'it', 'web', 'internet', 'digital', 'cyber'],
      forestGreen: ['nature', 'environment', 'ecology', 'green', 'sustainable', 'renewable', 'wildlife', 'plant', 'forest', 'garden', 'outdoor', 'organic', 'natural', 'eco', 'conservation', 'climate', 'planet'],
      medicalBlue: ['health', 'medical', 'medicine', 'hospital', 'doctor', 'patient', 'disease', 'treatment', 'healthcare', 'wellness', 'fitness', 'exercise', 'therapy', 'cure', 'care', 'clinic', 'pharmacy'],
      corporateGold: ['business', 'corporate', 'company', 'finance', 'money', 'bank', 'investment', 'profit', 'market', 'trade', 'commercial', 'enterprise', 'economy', 'sales', 'marketing', 'management', 'executive'],
      academicYellow: ['education', 'learning', 'school', 'university', 'student', 'teacher', 'academic', 'course', 'training', 'knowledge', 'study', 'research', 'science', 'book', 'lecture', 'degree', 'college'],
      creativeViolet: ['art', 'design', 'creative', 'music', 'artist', 'creative', 'illustration', 'painting', 'photography', 'aesthetic', 'visual', 'craft', 'culture', 'beauty', 'style', 'imagination'],
      culinaryRed: ['food', 'cooking', 'recipe', 'restaurant', 'cuisine', 'chef', 'meal', 'drink', 'kitchen', 'dish', 'culinary', 'ingredient', 'flavor', 'taste', 'restaurant', 'cafe'],
      travelTeal: ['travel', 'adventure', 'tourism', 'vacation', 'journey', 'trip', 'explore', 'destination', 'world', 'country', 'tour', 'visit', 'holiday', 'expedition', 'map', 'geography'],
      scienceBlue: ['science', 'research', 'physics', 'chemistry', 'biology', 'laboratory', 'experiment', 'data', 'analysis', 'scientific', 'discovery', 'atom', 'molecule', 'theory', 'hypothesis', 'study'],
      sportsOrange: ['sports', 'fitness', 'exercise', 'training', 'athlete', 'workout', 'gym', 'competition', 'game', 'physical', 'sport', 'team', 'match', 'championship', 'victory', 'performance'],
      entertainmentPurple: ['entertainment', 'movie', 'film', 'show', 'television', 'tv', 'video', 'streaming', 'media', 'celebrity', 'actor', 'music', 'concert', 'performance', 'drama', 'comedy'],
      socialPink: ['social', 'community', 'people', 'network', 'society', 'communication', 'relationship', 'human', 'connection', 'friend', 'family', 'group', 'culture', 'tradition', 'gathering'],
    };

    // Scoring system
    const scores = {};
    
    // Initialize all schemes
    for (const scheme of Object.keys(COLOR_SCHEMES)) {
      scores[scheme] = 0;
    }

    // Score based on semantic groups
    for (const [schemeName, keywords] of Object.entries(semanticGroups)) {
      let schemeScore = 0;
      
      for (const keyword of keywords) {
        // Exact word match (highest score)
        if (lowerPrompt.includes(` ${keyword} `) || lowerPrompt.startsWith(keyword) || lowerPrompt.endsWith(keyword)) {
          schemeScore += 10;
        }
        // Contains keyword (medium score)
        else if (lowerPrompt.includes(keyword)) {
          schemeScore += 6;
        }
        // Partial word match with word boundary (lower score)
        else {
          const regex = new RegExp(`\\b${keyword}`, 'i');
          if (regex.test(lowerPrompt)) {
            schemeScore += 4;
          }
        }
      }
      
      scores[schemeName] = schemeScore;
    }

    // Find the highest scoring scheme
    let bestScheme = 'cottonCandy';
    let bestScore = 0;
    
    for (const [schemeName, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestScheme = schemeName;
      }
    }

    // Enhanced fallback: if no good match, pick from top 3 topic-specific schemes with bonus
    if (bestScore < 5) {
      const sortedSchemes = Object.entries(scores)
        .filter(([name]) => COLOR_SCHEMES[name].topics && COLOR_SCHEMES[name].topics.length > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      
      if (sortedSchemes.length > 0) {
        // Weighted random selection favoring higher scores
        const totalScore = sortedSchemes.reduce((sum, [_, score]) => sum + (score + 10), 0);
        let random = Math.random() * totalScore;
        
        for (const [name, score] of sortedSchemes) {
          random -= (score + 10);
          if (random <= 0) {
            bestScheme = name;
            bestScore = score;
            break;
          }
        }
      }
    }
    
    console.log(`🎨 Selected color scheme: ${bestScheme} (score: ${bestScore})`);
    return bestScheme;
  }

  /**
   * Select optimal colors from scheme with contrast and variation
   * @private
   */
  _selectSchemeColors(schemeObj) {
    // Randomize which primary/secondary colors are used for variation
    const primaryIndex = Math.floor(Math.random() * schemeObj.primary.length);
    const secondaryIndex = Math.floor(Math.random() * schemeObj.secondary.length);
    
    return {
      containerBackground: schemeObj.primary[primaryIndex],
      cardBackground: schemeObj.secondary[secondaryIndex],
      headingColor: schemeObj.accent,
      textColor: schemeObj.text,
    };
  }

  /**
   * Generate parameters (style, colors, card type, background)
   * @param {string} prompt - User prompt
   * @returns {Promise<object>} Parameters {style, colors, card, background}
   */
  async gatherParameters(prompt) {
    // First, intelligently select color scheme based on topic
    const preSelectedScheme = this._selectColorSchemeByTopic(prompt);
    const selectedSchemeObj = COLOR_SCHEMES[preSelectedScheme];
    
    const schemeNames = Object.keys(COLOR_SCHEMES);
    const schemeExamples = schemeNames.slice(0, 5).map(name => {
      const scheme = COLOR_SCHEMES[name];
      return `${name}: primary[${scheme.primary.join(', ')}], accent: ${scheme.accent}`;
    }).join('\n');

    const systemPrompt = `You are an expert infographic style analyzer.

User Prompt: "${prompt}"

IMPORTANT: The color scheme has been pre-selected as "${preSelectedScheme}" based on the topic.
Use this scheme's colors:
- Primary colors: ${selectedSchemeObj.primary.join(', ')}
- Secondary colors: ${selectedSchemeObj.secondary.join(', ')}
- Accent color: ${selectedSchemeObj.accent}
- Text color: ${selectedSchemeObj.text}

Choose the most visually fitting style from:
${ALLOWED_STYLES.join(', ')}

Card Types:
${ALLOWED_CARD_TYPES.join(', ')}

Background Options:
${ALLOWED_BACKGROUNDS.join(', ')}

Your task:
1. Use the pre-selected "${preSelectedScheme}" color scheme
2. Select specific colors from THIS scheme for different elements:
   - containerBackground: One color from primary array [${selectedSchemeObj.primary.join(', ')}]
   - cardBackground: One color from secondary array [${selectedSchemeObj.secondary.join(', ')}]
   - headingColor: Use accent color ${selectedSchemeObj.accent}
   - textColor: Use text color ${selectedSchemeObj.text}
3. Choose card type most fitting for the topic
4. Choose background pattern that complements the colors

Output strictly in JSON (no other text):
{
  "style": "<one of the allowed styles>",
  "colorScheme": "${preSelectedScheme}",
  "containerBackground": "#hex from primary array",
  "cardBackground": "#hex from secondary array",
  "headingColor": "${selectedSchemeObj.accent}",
  "textColor": "${selectedSchemeObj.text}",
  "card": "<one of the allowed card types>",
  "background": "<one of the allowed backgrounds>"
}`;

    try {
      const result = await textGenModel.generateContent(systemPrompt);
      const responseText = this._extractResponseText(result);
      const parsed = this._parseJSON(responseText);

      // Use the pre-selected color scheme with improved color selection
      const selectedScheme = COLOR_SCHEMES[preSelectedScheme];
      const schemeColors = this._selectSchemeColors(selectedScheme);

      return {
        style: parsed.style || 'glassmorphism',
        colors: [
          parsed.containerBackground || schemeColors.containerBackground,
          parsed.cardBackground || schemeColors.cardBackground,
          parsed.headingColor || schemeColors.headingColor,
          parsed.textColor || schemeColors.textColor,
        ],
        card: parsed.card || 'glass-card',
        background: parsed.background || 'gradient',
      };
    } catch (error) {
      console.warn(`⚠️ Parameter gathering failed, using topic-based defaults:`, error.message);
      // Still use topic-based color scheme even on error with improved selection
      const defaultScheme = COLOR_SCHEMES[preSelectedScheme] || COLOR_SCHEMES.cottonCandy;
      const schemeColors = this._selectSchemeColors(defaultScheme);
      return {
        style: 'glassmorphism',
        colors: [schemeColors.containerBackground, schemeColors.cardBackground, schemeColors.headingColor, schemeColors.textColor],
        card: 'glass-card',
        background: 'gradient',
      };
    }
  }

  /**
   * Generate content for a specific layout type
   * @param {string} prompt - User prompt/topic
   * @param {string} layoutType - Template type (cards, timeline, etc.)
   * @param {object} parameters - Style parameters
   * @param {string} viewMode - landscape or portrait
   * @returns {Promise<object>} Content data for template
   */
  async generateContent(prompt, layoutType, parameters, viewMode = 'landscape') {
    console.log(`📝 Generating content for ${layoutType} layout...`);

    // Hardcode card count based on layout and viewMode
    const cardCount = layoutType === 'cards' 
      ? (viewMode === 'portrait' ? 8 : 12)
      : null;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const systemPrompt = this._buildContentPrompt(
          prompt,
          layoutType,
          parameters,
          viewMode,
          cardCount
        );

        const result = await textGenModel.generateContent(systemPrompt);
        const responseText = this._extractResponseText(result);
        const content = this._parseJSON(responseText);

        // Validate content structure
        this._validateContent(content, layoutType, viewMode);

        console.log(`✅ Content generated successfully`);
        
        // Add viewMode to content
        content.viewMode = viewMode;
        
        return content;
      } catch (error) {
        console.error(
          `Attempt ${attempt}/${this.retries} failed: ${error.message}`
        );

        if (attempt === this.retries) {
          console.error('❌ All generation attempts failed');
          throw new Error(
            `Content generation failed after ${this.retries} attempts: ${error.message}`
          );
        }

        // Progressive delay
        const delay = attempt * 1000 + Math.random() * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Build content generation prompt for specific layout
   * @private
   */
  _buildContentPrompt(prompt, layoutType, parameters, viewMode, cardCount = null) {
    // Get card and background style examples
    const cardStyle = infographicCards[parameters.card] || '';
    const backgroundStyle = infographicPatterns[parameters.background] || '';
    
    let contentSchema = '';

    switch (layoutType) {
      case 'cards':
        contentSchema = `{
  "title": "Main headline",
  "subtitle": "Supporting description",
  "cards": [
    {
      "icon": "emoji",
      "heading": "Card title (2-3 words)",
      "description": "Clear explanation (1-2 sentences, max 100 chars)"
    }
    // 8 cards for portrait (2 columns), 12 cards for landscape (4 columns x 3 rows)
  ]
}`;
        break;

      case 'timeline':
        contentSchema = `{
  "title": "Main headline",
  "subtitle": "Supporting description",
  "timeline": [
    {
      "year": "2020",
      "title": "Event title",
      "description": "Event description"
    }
    // EXACTLY 6 timeline items for landscape, 5 for portrait
  ]
}`;
        break;

      case 'comparison':
        const comparisonItemCount = viewMode === 'portrait' ? 6 : 4;
        const comparisonPointCount = viewMode === 'portrait' ? 6 : 4;
        contentSchema = `{
  "title": "Main headline",
  "subtitle": "Supporting description (optional)",
  "leftSide": {
    "title": "Company/Option A name",
    "items": [
      {
        "label": "TOPIC 01",
        "description": "Description of topic 1 for option A (NO EMOJIS - icons shown in VS column)"
      }
      // Exactly ${comparisonItemCount} items for ${viewMode} mode
    ]
  },
  "rightSide": {
    "title": "Company/Option B name",
    "items": [
      {
        "label": "TOPIC 01",
        "description": "Description of topic 1 for option B (NO EMOJIS - icons shown in VS column)"
      }
      // Exactly ${comparisonItemCount} items for ${viewMode} mode
    ]
  },
  "comparisonPoints": [
    {
      "icon": "emoji or symbol",
      "label": "IDEA"
    }
    // Exactly ${comparisonPointCount} comparison points for ${viewMode} mode
  ]
}`;
        break;

      case 'hierarchy':
        contentSchema = `{
  "title": "Main headline",
  "subtitle": "Supporting description",
  "root": {
    "name": "Root node",
    "children": ["Child 1", "Child 2", "Child 3", "Child 4"]
  }
}`;
        break;

      case 'chart':
        contentSchema = `{
  "title": "Chart title",
  "subtitle": "Chart description or context",
  "centerLabel": "Central text (e.g., 'Total')",
  "data": [
    {
      "icon": "emoji or Font Awesome class (e.g., 'fas fa-chart-pie')",
      "label": "Data point name",
      "value": "45",
      "description": "Description or insight (1-2 sentences)"
    }
    // 4-8 items for balanced pie chart and list display
  ]
}`;
        break;

      case 'list':
        contentSchema = `{
  "title": "Main headline (3-6 words, engaging)",
  "description": "Optional subtitle or context",
  "items": [
    {
      "icon": "emoji (optional)",
      "title": "Item title (3-5 words, clear and catchy)",
      "description": "Detailed explanation (1-2 sentences, 80-120 chars)"
    }
    // IMPORTANT: Max ${viewMode === 'portrait' ? '6' : '4'} items for ${viewMode} (portrait=taller=6, landscape=wider=4)
  ]
}`;
        break;

      case 'process-flow':
        const processItemCount = viewMode === 'portrait' ? 5 : 6;
        contentSchema = `{
  "title": "Main headline",
  "subtitle": "Process description or context",
  "data": [
    {
      "icon": "emoji or symbol",
      "label": "Step Title",
      "description": "Step description (1-2 sentences)"
    }
    // Exactly ${processItemCount} steps for ${viewMode} mode
  ]
}`;
        break;

      case 'rich-layout':
        contentSchema = `{
  "title": "Main headline",
  "subtitle": "Supporting description",
  "sections": [
    {
      "heading": "Section title",
      "content": "Section content or paragraph",
      "bullets": ["Point 1", "Point 2"]
    }
    // 3-5 sections
  ]
}`;
        break;
    }

    return `You are an expert at creating compelling, concise content for ${layoutType} infographics.

USER REQUEST:
"${prompt}"

VIEW MODE: ${viewMode} (${VIEW_MODES[viewMode].aspectRatio})
STYLE: ${parameters.style}
COLORS: ${parameters.colors.join(', ')}
CARD TYPE: ${parameters.card}
BACKGROUND: ${parameters.background}

DESIGN CONTEXT:
${cardStyle ? `Card Style Example:\n${cardStyle}\n` : ''}
${backgroundStyle ? `Background Style Example:\n${backgroundStyle}\n` : ''}

Layout Guidelines for ${viewMode}:
${VIEW_MODES[viewMode].layoutGuidelines.map(g => `• ${g}`).join('\n')}

YOUR TASK:
Create structured content that will be rendered in a ${layoutType} layout.
- Make content accurate, educational, and engaging
- Keep text concise and readable at small sizes
- Use emojis to enhance visual interest (icons instead of text)
- Ensure all content fits within the ${viewMode} aspect ratio
- Consider the card style and background when planning content amount

CONTENT SCHEMA (JSON structure):
${contentSchema}

CRITICAL REQUIREMENTS:
1. Title should be short and catchy (max 50 characters)
2. Subtitle should explain the topic (max 100 characters)
3. Use emojis/Unicode symbols for visual icons
4. All descriptions max 100 characters (consider ${viewMode} view)
5. ${cardCount ? `Generate EXACTLY ${cardCount} cards - no more, no less (${viewMode === 'portrait' ? '8 cards in 2 columns x 4 rows' : '12 cards in 4 columns x 3 rows'})` : 'Generate 4-6 main items (not more, or content will overflow)'}
6. Content should be at reading level for general audience
7. Return ONLY valid JSON with no markdown or explanations

NOW GENERATE THE CONTENT (JSON only):`;
  }

  /**
   * Extract response text safely
   * @private
   */
  _extractResponseText(result) {
    let text = '';

    if (typeof result?.response?.text === 'function') {
      text = result.response.text().trim();
    } else if (result?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      text = result.response.candidates[0].content.parts[0].text.trim();
    } else {
      throw new Error('Could not extract text from Gemini response');
    }

    // Clean markdown wrappers
    text = text.replace(/```(json)?/g, '').trim();
    return text;
  }

  /**
   * Parse JSON safely with JSON5
   * @private
   */
  _parseJSON(responseText) {
    try {
      // Extract JSON block
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON block found. Response preview:', responseText.substring(0, 200));
        throw new Error('No JSON object found in response');
      }

      const parsed = JSON5.parse(jsonMatch[0]);

      // Handle double-encoded responses
      if (typeof parsed === 'string') {
        return JSON5.parse(parsed);
      }

      // Clean up any escape sequences in text fields
      if (parsed.title) parsed.title = parsed.title.replace(/\\n/g, ' ').trim();
      if (parsed.description) parsed.description = parsed.description.replace(/\\n/g, ' ').trim();
      if (parsed.subtitle) parsed.subtitle = parsed.subtitle.replace(/\\n/g, ' ').trim();

      return parsed;
    } catch (error) {
      console.error('❌ JSON parse error:', error.message);
      throw error;
    }
  }

  /**
   * Validate generated content structure
   * @private
   */
  _validateContent(content, layoutType, viewMode = 'landscape') {
    if (!content.title) {
      throw new Error('Missing required field: title');
    }

    // Clean up newlines in all text fields
    if (content.title) content.title = content.title.replace(/\\n/g, ' ').replace(/\n/g, ' ').trim();
    if (content.description) content.description = content.description.replace(/\\n/g, ' ').replace(/\n/g, ' ').trim();
    if (content.subtitle) content.subtitle = content.subtitle.replace(/\\n/g, ' ').replace(/\n/g, ' ').trim();

    // subtitle/description is optional - some layouts don't need it
    // but normalize to ensure consistency
    if (!content.description && content.subtitle) {
      content.description = content.subtitle;
    }
    if (!content.subtitle && content.description) {
      content.subtitle = content.description;
    }

    // Clean cards array if it exists
    if (content.cards && Array.isArray(content.cards)) {
      content.cards.forEach(card => {
        if (card.heading) card.heading = card.heading.replace(/\\n/g, ' ').replace(/\n/g, ' ').trim();
        if (card.description) card.description = card.description.replace(/\\n/g, ' ').replace(/\n/g, ' ').trim();
        if (card.title) card.title = card.title.replace(/\\n/g, ' ').replace(/\n/g, ' ').trim();
      });
    }

    // Validate based on layout type
    switch (layoutType) {
      case 'cards':
        if (!Array.isArray(content.cards) || content.cards.length === 0) {
          throw new Error('Cards layout requires non-empty cards array');
        }
        const maxCards = viewMode === 'portrait' ? 8 : 12;
        if (content.cards.length > maxCards) {
          console.warn(`⚠️ Too many cards, will be truncated to ${maxCards}`);
          content.cards = content.cards.slice(0, maxCards);
        }
        break;

      case 'timeline':
        if (!Array.isArray(content.timeline) || content.timeline.length === 0) {
          throw new Error('Timeline layout requires non-empty timeline array');
        }
        const maxTimelineItems = viewMode === 'portrait' ? 5 : 6;
        if (content.timeline.length > maxTimelineItems) {
          console.warn(`⚠️ Timeline has ${content.timeline.length} items, truncating to ${maxTimelineItems} for ${viewMode} mode`);
          content.timeline = content.timeline.slice(0, maxTimelineItems);
        }
        break;

      case 'comparison':
        if (!content.leftSide || !content.rightSide || !content.comparisonPoints) {
          throw new Error('Comparison layout requires leftSide, rightSide, and comparisonPoints');
        }
        if (!Array.isArray(content.leftSide.items) || content.leftSide.items.length === 0) {
          throw new Error('Comparison leftSide requires non-empty items array');
        }
        if (!Array.isArray(content.rightSide.items) || content.rightSide.items.length === 0) {
          throw new Error('Comparison rightSide requires non-empty items array');
        }
        if (!Array.isArray(content.comparisonPoints) || content.comparisonPoints.length === 0) {
          throw new Error('Comparison requires non-empty comparisonPoints array');
        }
        // Ensure correct item count based on viewMode: 6 for portrait, 4 for landscape
        const maxComparisonItems = viewMode === 'portrait' ? 6 : 4;
        content.leftSide.items = content.leftSide.items.slice(0, maxComparisonItems);
        content.rightSide.items = content.rightSide.items.slice(0, maxComparisonItems);
        content.comparisonPoints = content.comparisonPoints.slice(0, maxComparisonItems);
        break;

      case 'hierarchy':
        if (!content.root || !content.root.name) {
          throw new Error('Hierarchy layout requires root node with name');
        }
        break;

      case 'chart':
        if (!Array.isArray(content.data) || content.data.length === 0) {
          throw new Error('Chart layout requires non-empty data array');
        }
        // Enforce max items: 4-8 items for balanced pie chart and list display
        const maxChartItems = 8;
        const minChartItems = 4;
        if (content.data.length > maxChartItems) {
          console.warn(`⚠️  Chart has ${content.data.length} items, truncating to ${maxChartItems} for optimal display`);
          content.data = content.data.slice(0, maxChartItems);
        } else if (content.data.length < minChartItems) {
          console.warn(`⚠️  Chart has only ${content.data.length} items, recommend ${minChartItems}-${maxChartItems} for balanced visualization`);
        }
        break;

      case 'list':
        if (!Array.isArray(content.items) || content.items.length === 0) {
          throw new Error('List layout requires non-empty items array');
        }
        // Enforce max item limits based on view mode to fit in 16/9 ratio without scrolling
        // Portrait (9:16) has MORE vertical space = 6 items max
        // Landscape (16:9) has LESS vertical space = 4 items max
        const maxItems = viewMode === 'portrait' ? 6 : 4;
        if (content.items.length > maxItems) {
          console.warn(`⚠️  List has ${content.items.length} items, truncating to ${maxItems} for ${viewMode} mode`);
          content.items = content.items.slice(0, maxItems);
        }
        break;

      case 'process-flow':
        if (!Array.isArray(content.data) || content.data.length === 0) {
          throw new Error('Process flow layout requires non-empty data array');
        }
        // Enforce max items: 5 for portrait, 6 for landscape
        const maxProcessItems = viewMode === 'portrait' ? 5 : 6;
        if (content.data.length > maxProcessItems) {
          console.warn(`⚠️  Process flow has ${content.data.length} items, truncating to ${maxProcessItems} for ${viewMode} mode`);
          content.data = content.data.slice(0, maxProcessItems);
        }
        break;

      case 'rich-layout':
        if (!Array.isArray(content.sections) || content.sections.length === 0) {
          throw new Error('Rich layout requires non-empty sections array');
        }
        break;
    }
  }

  /**
   * Validate hex colors
   * @private
   */
  _validateColors(colors) {
    if (!Array.isArray(colors)) return null;

    return colors.filter(color => {
      // Check if valid hex color
      return /^#[0-9A-F]{6}$/i.test(color);
    });
  }
}

module.exports = new ContentGenerator();
