/**
 * Template Renderer Service
 * Loads Handlebars templates and injects data with color schemes
 */

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

class TemplateRenderer {
  constructor() {
    this.templates = {};
    this.templatesDir = path.join(__dirname, '../templates');
    this.loadAllTemplates();
    
    // Register Handlebars helpers
    this.registerHelpers();
  }

  /**
   * Load all template files into memory
   */
  loadAllTemplates() {
    try {
      if (!fs.existsSync(this.templatesDir)) {
        throw new Error(`Templates directory not found: ${this.templatesDir}`);
      }

      const templateFiles = fs.readdirSync(this.templatesDir);
      
      templateFiles.forEach(file => {
        if (file.endsWith('.html')) {
          const templateName = file.replace('.html', '');
          const filePath = path.join(this.templatesDir, file);
          const templateContent = fs.readFileSync(filePath, 'utf-8');
          this.templates[templateName] = Handlebars.compile(templateContent);
        }
      });
      
      console.log(`✅ Loaded ${Object.keys(this.templates).length} templates`);
    } catch (error) {
      console.error(`❌ Failed to load templates: ${error.message}`);
      throw error;
    }
  }

  /**
   * Register custom Handlebars helpers
   */
  registerHelpers() {
    // Math helpers for charts
    Handlebars.registerHelper('add', (a, b) => a + b);
    Handlebars.registerHelper('subtract', (a, b) => a - b);
    Handlebars.registerHelper('multiply', (a, b) => a * b);
    Handlebars.registerHelper('divide', (a, b) => a / b);
    
    // Comparison helpers
    Handlebars.registerHelper('eq', (a, b) => a === b);
    Handlebars.registerHelper('ne', (a, b) => a !== b);
    Handlebars.registerHelper('gt', (a, b) => a > b);
    Handlebars.registerHelper('lt', (a, b) => a < b);
    
    // String helpers
    Handlebars.registerHelper('capitalize', (str) => {
      return str.charAt(0).toUpperCase() + str.slice(1);
    });
    
    // Array helpers
    Handlebars.registerHelper('length', (array) => {
      return Array.isArray(array) ? array.length : 0;
    });
    
    // Custom helpers for infographics
    Handlebars.registerHelper('normalize', (value, max = 100) => {
      return (value / max) * 100;
    });
    
    // Index and modulo helpers
    Handlebars.registerHelper('isEven', (num) => {
      return num % 2 === 0;
    });
    
    Handlebars.registerHelper('isOdd', (num) => {
      return num % 2 !== 0;
    });

    // Color mapping helper for charts
    Handlebars.registerHelper('getColor', (index) => {
      const colors = ['orange', 'yellow', 'teal', 'blue', 'purple', 'pink', 'green', 'red'];
      return colors[index % colors.length];
    });

    // Helper to get hex color from colors array by index
    Handlebars.registerHelper('getChartColor', function(index) {
      const colors = this.colors || ['#ff9f43', '#ffd93d', '#06b6d4', '#457b9d', '#8b5cf6', '#ec4899', '#10b981', '#ef4444'];
      return colors[index % colors.length];
    });
  }

  /**
   * Render template with data
   * @param {string} layoutType - Template name (cards, timeline, etc.)
   * @param {object} data - Content data to inject
   * @param {array|object} colors - Color scheme array or object
   * @param {string} viewMode - landscape or portrait
   * @param {object} parameters - Additional parameters (style, card, background)
   * @returns {string} Rendered HTML
   */
  render(layoutType, data, colors, viewMode = 'landscape', parameters = {}) {
    try {
      const template = this.templates[layoutType];
      if (!template) {
        throw new Error(`Template '${layoutType}' not found. Available: ${Object.keys(this.templates).join(', ')}`);
      }

      // Normalize colors to array
      const normalizedColors = this.normalizeColors(colors);

      // Prepare context for template with all necessary data
      const context = {
        // Spread all data fields first (includes leftSide, rightSide, comparisonPoints, etc.)
        ...data,
        // Then override/add standard fields
        title: data.title || 'Infographic',
        description: data.description || '',
        subtitle: data.subtitle || data.description || '',
        items: data.items || [],
        cards: data.cards || [],
        timeline: data.timeline || [],
        sections: data.sections || [],
        root: data.root || null,
        columns: data.columns || 2,
        data: data.data || [],
        chartType: data.chartType || 'bar',
        colors: normalizedColors,
        viewMode,
        aspectRatio: viewMode === 'landscape' ? '16/9' : '9/16',
        maxWidth: viewMode === 'landscape' ? '1280px' : '480px',
        style: parameters.style || 'modern',
        card: parameters.card || 'flat',
        background: parameters.background || 'gradient'
      };

      // Render template
      const html = template(context);
      
      // Check if template already has full HTML structure (process-flow)
      if (html.trim().startsWith('<!DOCTYPE html>')) {
        return html;
      }
      
      // Wrap in full HTML document with UTF-8 encoding
      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title || 'Infographic'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
      
      return fullHtml;
    } catch (error) {
      console.error(`❌ Template rendering failed:`, error.message);
      throw error;
    }
  }

  /**
   * Normalize colors - handle both arrays and objects
   * @param {array|object} colors - Color array or object
   * @returns {array} Array of colors
   */
  normalizeColors(colors = []) {
    // If already an array, validate and return
    if (Array.isArray(colors)) {
      const validated = colors.filter(c => typeof c === 'string' && c.match(/^#[0-9A-Fa-f]{6}/));
      if (validated.length >= 3) {
        return validated;
      }
    }
    
    // If object, extract values
    if (typeof colors === 'object' && !Array.isArray(colors)) {
      const extracted = [
        colors.primary,
        colors.secondary,
        colors.accent,
        colors.accentLight
      ].filter(c => c && typeof c === 'string' && c.match(/^#[0-9A-Fa-f]{6}/));
      
      if (extracted.length >= 3) {
        return extracted;
      }
    }
    
    // Fallback to defaults
    return ['#1e40af', '#f97316', '#64748b', '#fbbf24'];
  }

  /**
   * Get list of available templates
   * @returns {string[]} Array of template names
   */
  getAvailableTemplates() {
    return Object.keys(this.templates);
  }

  /**
   * Render with error fallback
   * @param {string} layoutType
   * @param {object} data
   * @param {array|object} colors
   * @param {string} viewMode
   * @param {object} parameters - Additional parameters
   * @returns {object} { html, success, error }
   */
  renderSafe(layoutType, data, colors, viewMode = 'landscape', parameters = {}) {
    try {
      const html = this.render(layoutType, data, colors, viewMode, parameters);
      return {
        html,
        success: true,
        layoutType,
        error: null,
      };
    } catch (error) {
      console.error(`❌ Safe render failed: ${error.message}`);
      
      // Fallback to cards template if available
      if (layoutType !== 'cards' && this.templates.cards) {
        try {
          const fallbackHtml = this.render('cards', data, colors, viewMode, parameters);
          return {
            html: fallbackHtml,
            success: true,
            layoutType: 'cards',
            fallback: true,
            error: error.message,
          };
        } catch (fallbackError) {
          return {
            html: `<div style="padding: 2rem; text-align: center; color: red;">
              <h3>Template Rendering Error</h3>
              <p>${error.message}</p>
            </div>`,
            success: false,
            layoutType: null,
            error: `${error.message} / Fallback failed: ${fallbackError.message}`,
          };
        }
      }

      return {
        html: null,
        success: false,
        layoutType: null,
        error: error.message,
      };
    }
  }
}

module.exports = new TemplateRenderer();
