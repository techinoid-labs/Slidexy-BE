/**
 * Layout Analyzer Service
 * Analyzes content/prompt and determines best template layout type
 */

const { textGenModel } = require('../../../../utils/geminiModels');
const JSON5 = require('json5');

const LAYOUT_TYPES = {
  cards: {
    description: 'Grid of concept cards',
    best_for: ['concepts', 'features', 'benefits', 'steps', 'categories'],
    examples: 'Quantum Computing, Biology Concepts, Features',
  },
  timeline: {
    description: 'Chronological sequence',
    best_for: ['historical', 'chronological', 'timeline', 'evolution', 'process'],
    examples: 'History of Tech, Project Timeline, Life Cycle',
  },
  comparison: {
    description: 'Side-by-side comparison',
    best_for: ['comparison', 'vs', 'difference', 'pros-cons', 'alternatives'],
    examples: 'Feature Comparison, Pros vs Cons, Options',
  },
  // 'process-flow': {
  //   description: 'Sequential process steps',
  //   best_for: ['process', 'workflow', 'steps', 'procedure', 'flow', 'stage'],
  //   examples: 'Development Process, Manufacturing Steps, User Journey',
  // },
  chart: {
    description: 'Pie chart with data comparison list',
    best_for: ['chart', 'data', 'statistics', 'comparison', 'pie', 'visualization', 'percentage'],
    examples: 'Market Share Analysis, Budget Distribution, Survey Results, Sales Data',
  },
  list: {
    description: 'Numbered/bullet list with descriptions',
    best_for: ['list', 'steps', 'instructions', 'guide', 'procedure'],
    examples: 'How to Guide, Instructions, Recipe',
  },
};

class LayoutAnalyzer {
  constructor() {
    this.retries = 2;
  }

  /**
   * Analyze prompt/topic and determine best layout type
   * @param {string} prompt - User prompt or topic
   * @param {string} viewMode - landscape or portrait
   * @returns {Promise<object>} Layout analysis with layoutType and recommendations
   */
  async analyzeContent(prompt, viewMode = 'landscape') {
    console.log(`🔍 Analyzing content for layout type...`);

    // Try keyword detection first (fast, no API call)
    const keywordLayout = this.getLayoutByKeywords(prompt);
    console.log(`   ✓ Keyword analysis: ${keywordLayout}`);

    // If confidence is high enough with keywords, return immediately
    if (this._getKeywordConfidence(prompt, keywordLayout) >= 0.85) {
      return {
        layoutType: keywordLayout,
        confidence: 0.85,
        reason: 'High-confidence keyword match',
        method: 'keyword-detection'
      };
    }

    // Fall back to Gemini for detailed analysis if keyword confidence is medium
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const systemPrompt = this._buildAnalysisPrompt(prompt, viewMode);
        const result = await textGenModel.generateContent(systemPrompt);

        const responseText = this._extractResponseText(result);
        const analysis = this._parseAnalysis(responseText);

        // Validate layout type
        if (!LAYOUT_TYPES[analysis.layoutType]) {
          console.warn(`⚠️ Invalid layout type: ${analysis.layoutType}, using keyword result`);
          analysis.layoutType = keywordLayout;
        }

        console.log(`✅ Layout analysis complete: ${analysis.layoutType}`);
        analysis.method = 'gemini-analysis';
        return analysis;
      } catch (error) {
        console.error(`Attempt ${attempt}/${this.retries} failed: ${error.message}`);

        if (attempt === this.retries) {
          console.warn('❌ All analysis attempts failed, using keyword result');
          return {
            layoutType: keywordLayout,
            confidence: 0.7,
            reason: `Keyword-based fallback: ${keywordLayout}`,
            method: 'fallback-keyword'
          };
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Calculate confidence score for keyword-based detection
   * @private
   */
  _getKeywordConfidence(prompt, layout) {
    const lower = prompt.toLowerCase();
    let matches = 0;
    let keywordCount = 0;

    const layoutKeywords = {
      timeline: ['timeline', 'chronological', 'history', 'evolution', 'era', 'decade', 'century', 'year', 'period', 'phase', 'stage', 'sequence', 'journey'],
      comparison: ['compare', 'versus', 'vs', 'pro', 'con', 'difference', 'alternative', 'advantage', 'disadvantage'],
      chart: ['data', 'chart', 'graph', 'number', 'percentage', 'statistic', 'trend', 'metric', 'distribution', 'share', 'sales', 'revenue'],
      list: ['step', 'instruction', 'guide', 'procedure', 'how to', 'recipe', 'tutorial', 'direction', 'method'],
      'process-flow': ['process', 'workflow', 'flow', 'pipeline', 'cycle', 'development', 'production', 'manufacturing'],
      cards: ['feature', 'benefit', 'concept', 'idea', 'element', 'component', 'aspect', 'type', 'category', 'skill']
    };

    const keywords = layoutKeywords[layout] || [];
    for (const keyword of keywords) {
      keywordCount++;
      if (lower.includes(keyword)) {
        matches++;
      }
    }

    return keywordCount > 0 ? matches / keywordCount : 0.5;
  }

  /**
   * Build analysis prompt for Gemini
   * @private
   */
  _buildAnalysisPrompt(prompt, viewMode) {
    const layoutDescriptions = Object.entries(LAYOUT_TYPES)
      .map(([key, val]) => `- ${key}: ${val.description}`)
      .join('\n');

    return `You are an expert at choosing the best visual layout for infographic content.

Given this user request:
"${prompt}"

And these available layout options:
${layoutDescriptions}

ANALYZE the request and determine which layout type would be MOST EFFECTIVE.

Consider:
1. Type of information (concepts, timeline, comparison, etc.)
2. Amount of content
3. View mode: ${viewMode}
4. Visual impact and clarity

Return ONLY valid JSON (no explanations):
{
  "layoutType": "<one of: cards, timeline, comparison, process-flow, chart, list>",
  "confidence": <0.0 to 1.0>,
  "reason": "Brief explanation of why this layout fits"
}

Requirements:
- layoutType must be exactly one of the valid options
- confidence should reflect how well the layout fits (0.5 = moderate, 0.9 = perfect)
- Keep reason concise (max 50 chars)

NOW ANALYZE AND RETURN JSON:`;
  }

  /**
   * Extract response text from Gemini result
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

    // Clean markdown
    text = text.replace(/```(json)?/g, '').trim();
    return text;
  }

  /**
   * Parse and validate analysis JSON
   * @private
   */
  _parseAnalysis(responseText) {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON5.parse(jsonMatch[0]);

      // Validate structure
      if (!parsed.layoutType) {
        throw new Error('Missing layoutType in response');
      }

      return {
        layoutType: parsed.layoutType.toLowerCase(),
        confidence: Math.min(Math.max(parsed.confidence || 0.7, 0), 1),
        reason: parsed.reason || 'Content analysis',
      };
    } catch (error) {
      console.error(`❌ Parse error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get layout recommendations based on keywords
   * (Fallback method without LLM call)
   * @param {string} prompt
   * @returns {string} layoutType
   */
  getLayoutByKeywords(prompt) {
    const lower = prompt.toLowerCase();
    
    // Score based on keyword matches
    const scores = {
      timeline: 0,
      comparison: 0,
      chart: 0,
      list: 0,
      'process-flow': 0,
      cards: 0
    };

    // Timeline detection (strongest)
    if (/timeline|chronological|history|evolution|era|decade|century|year|period|phase|stage|sequence|journey/.test(lower)) {
      scores.timeline += 5;
    }
    if (/when|date|time|before|after|then|began|started|ended/.test(lower)) {
      scores.timeline += 2;
    }

    // Comparison detection (strong)
    if (/compar(e|ison)?|versus|vs|pro|con|difference|alternative|better|worse|advantage|disadvantage|contrast/.test(lower)) {
      scores.comparison += 5;
    }
    if (/difference between|similar|alike|same/.test(lower)) {
      scores.comparison += 3;
    }

    // Chart/Data detection (strong)
    if (/data|chart|graph|number|percentage|statistic|trend|analysis|metric|distribution|share|sales|revenue|growth|pie|bar/.test(lower)) {
      scores.chart += 5;
    }
    if (/\d+%|billion|million|thousand|rank|rating|score/.test(lower)) {
      scores.chart += 3;
    }

    // List/Steps detection (strong)
    if (/step|instruction|guide|procedure|how to|list|recipe|tutorial|direction|method|process|technique/.test(lower)) {
      scores.list += 5;
    }
    if (/first|second|third|next|then|finally|start|end/.test(lower)) {
      scores.list += 2;
    }

    // Process Flow detection (strong)
    if (/process|workflow|flow|pipeline|cycle|development|production|manufacturing|journey|funnel|stage|phase|sequential/.test(lower)) {
      scores['process-flow'] += 5;
    }
    if (/input|output|result|outcome/.test(lower)) {
      scores['process-flow'] += 2;
    }

    // Cards/Concepts detection (default for features, benefits, concepts)
    if (/feature|benefit|advantage|concept|idea|element|component|aspect|type|kind|category|skill|ability|property/.test(lower)) {
      scores.cards += 4;
    }

    // Find highest score
    const maxScore = Math.max(...Object.values(scores));
    
    if (maxScore > 0) {
      for (const [layout, score] of Object.entries(scores)) {
        if (score === maxScore) {
          return layout;
        }
      }
    }

    // Default: cards
    return 'cards';
  }

  /**
   * Get all available layout types
   * @returns {object} Layout configurations
   */
  getAvailableLayouts() {
    return LAYOUT_TYPES;
  }
}

module.exports = new LayoutAnalyzer();
