# Infographic Service V2 Integration Guide

## Overview

The new template-based infographic generation system has been integrated into the unit-services folder as a new service. The old service remains intact and can still be used if needed.

## New Files Created

1. **`generateInfographicV2Service.js`** - Main new infographic generator service
   - Primary entry point for generating infographics using the new template system
   - Wraps the `infographic-template-system` module
   - Supports landscape/portrait view modes
   - Includes multi-view generation

2. **`infographicServiceRouter.js`** - Service router for easy switching
   - Routes requests to v1 or v2 service
   - Easy way to compare and test both systems
   - Default routes to v2 (recommended)

## How to Use

### Option 1: Direct Usage of V2 (Recommended)

```javascript
const infographicV2 = require('./unit-services/generateInfographicV2Service');

// Simple generation
const result = await infographicV2.generateInfographic('History of AI', 'landscape');

// Multiple views
const multiView = await infographicV2.generateMultiView('Climate Change');

// Get service info
const info = infographicV2.getServiceInfo();
```

### Option 2: Using the Router (Flexible)

```javascript
const router = require('./unit-services/infographicServiceRouter');

// Default: uses V2
const result = await router.generateInfographic('Machine Learning Basics');

// Force V1
const resultV1 = await router.generateInfographic('Topic', { useV1: true });

// Force V2
const resultV2 = await router.generateInfographic('Topic', { useV2: true });

// Switch active service
router.useV2(); // Recommended
router.useV1(); // Legacy
```

## Result Structure

Both services return the same output structure:

```javascript
{
  data: {
    title: string,
    subtitle: string,
    description: string,
    type: string,              // Layout type: cards, timeline, comparison, etc
    style: string,
    colors: string[],
    viewMode: string,          // 'landscape' or 'portrait'
    items: any[],              // Varies by layout type
    cards: any[],              // For card layout
    timeline: any[],           // For timeline layout
    // ... other layout-specific data
  },
  html: string,                // Rendered HTML
  meta: {
    generatedAt: string,
    processingTime: string,
    attempt: number,
    prompt: string,
    layoutType: string,
    // ... other metadata
  }
}
```

## Key Features of V2 System

✅ **Template-Based Rendering** - Uses handlebars templates for consistent rendering
✅ **Layout Analysis** - Analyzes content to choose the best visual layout
✅ **Content Generation** - Generates JSON data via Gemini API
✅ **Multiple Templates** - 7 different templates:
  - `cards` - Grid of concept cards
  - `timeline` - Chronological sequences
  - `comparison` - Side-by-side comparisons
  - `hierarchy` - Tree/organizational structures
  - `chart` - Data visualization with SVG
  - `list` - Numbered/bullet lists
  - `rich-layout` - Hero + mixed sections

✅ **View Modes** - Support for landscape and portrait layouts
✅ **Error Handling** - Automatic retry with exponential backoff
✅ **Design Consistency** - Pre-tested CSS ensures no overflow issues

## Migration Checklist

If you want to migrate existing code to use V2:

- [ ] Update imports from `getInfographicService` to `generateInfographicV2Service`
- [ ] Test V2 with your existing prompts/topics
- [ ] Update function calls if parameter formats differ
- [ ] Verify output HTML rendering in your UI
- [ ] Keep V1 service as fallback initially

## Old Service Preservation

The original service (`getInfographicService.js`) is **completely untouched** and continues to work as before. This allows for:

- ✅ Gradual migration
- ✅ Easy rollback if needed
- ✅ A/B testing between systems
- ✅ Legacy support for existing integrations

## Configuration

Both services use environment variables from `.env`:
- `GOOGLE_API_KEY` - Gemini API key (required)
- `GEMINI_MODEL` - Model version (defaults in code)

## Available Layout Types

Use `getAvailableLayouts()` to see all supported layouts:

```javascript
const layouts = infographicV2.getAvailableLayouts();
console.log(layouts);
// Output: { cards, timeline, comparison, hierarchy, chart, list, rich-layout }
```

## Support

For issues or questions:
1. Check the infographic-template-system README for technical details
2. Review test files in `infographic-template-system/` directory
3. Check logs for debugging information - V2 includes detailed console logging

## Next Steps

1. ✅ New services created and integrated
2. ⏳ Test V2 with your use cases
3. ⏳ Gradually migrate endpoints to use V2
4. ⏳ Archive or deprecate V1 when migration is complete
