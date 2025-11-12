# Web to Deck Feature Documentation

## Overview
The **Web to Deck** feature converts any website into a professional presentation or proposal by analyzing its content, images, and visual aesthetics.

## Implementation Details

### Files Created/Modified

1. **New Service**: `backend/services/generateWebToDeck.js`
   - Main service that orchestrates the web-to-deck conversion
   - Uses `fetchWebsiteText` to extract website data
   - Integrates with Gemini 2.5 Flash for content generation
   - Maintains website's visual identity (colors, fonts, images)

2. **Modified Controller**: `backend/controllers/presentationController.js`
   - Added `webToDeckHandler` function
   - Handles request validation and response formatting
   - Creates presentation document in database

3. **Modified Route**: `backend/routes/presentation.js`
   - Added POST `/web-to-deck` endpoint
   - Requires authentication
   - Full API documentation in comments

## API Endpoint

### POST `/api/presentation/web-to-deck`

**Authentication**: Required (JWT token)

**Request Body**:
```json
{
  "url": "https://example.com",
  "presentationType": "presentation",
  "slideCount": 5,
  "meta": {
    "goal": "Inform stakeholders",
    "tone": "Professional",
    "audience": "Business executives"
  }
}
```

**Parameters**:
- `url` (required): Website URL to convert
- `presentationType` (optional): "presentation" or "proposal" (default: "presentation")
- `slideCount` (optional): 3, 5, 7, or 10 slides (default: 5)
- `meta` (optional): Additional context for content generation

**Response**:
```json
{
  "success": true,
  "_id": "mongodb_id",
  "presentation_id": "uuid",
  "topic": "Website Title",
  "slides": [...],
  "meta": {
    "sourceUrl": "https://example.com",
    "websiteTitle": "Example Website",
    "websiteType": "portfolio",
    "generationMethod": "web-to-deck",
    "aesthetics": {
      "colors": ["#6c5ce7", "#00b894", ...],
      "fonts": ["Roboto", "Open Sans"],
      "primaryColor": "#6c5ce7",
      "backgroundColor": "#ffffff"
    },
    ...
  },
  "websiteImages": [
    {
      "src": "https://example.com/image.jpg",
      "alt": "Image description",
      "width": 1200,
      "height": 800
    }
  ],
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

## How It Works

### 1. Website Analysis (`fetchWebsiteText`)
- Launches headless Chromium browser via Puppeteer
- Extracts page content (headings, paragraphs, tables, links)
- Captures website images with metadata
- Analyzes CSS stylesheets and computed styles
- Identifies color palette, fonts, and design patterns
- Detects website type (portfolio, ecommerce, news, etc.)

### 2. AI Content Generation (`generateWebToDeck`)
- Builds comprehensive prompt for Gemini 2.5 Flash
- Includes website content, aesthetics, and context
- Generates structured slide data matching website brand
- References actual website images for slides
- Maintains color consistency with website design

### 3. Slide Transformation
- Converts AI output to frontend-compatible format
- Adds UUIDs and MongoDB-style IDs
- Structures elements (titles, bullets, quotes, images)
- Applies website color schemes to slides
- Validates and enhances with fallbacks

### 4. Database Storage
- Saves presentation to MongoDB
- Associates with authenticated user
- Stores metadata including source URL and aesthetics

## Features

✅ **Content Extraction**
- Comprehensive text and metadata extraction
- Image URLs with alt text and dimensions
- Structured data (tables, lists, headings)

✅ **Visual Identity Preservation**
- Extracts color palette from website
- Identifies brand colors and fonts
- Applies aesthetics to generated slides

✅ **Intelligent Generation**
- Uses Gemini 2.5 Flash for content quality
- Adapts to website type (portfolio, ecommerce, etc.)
- Creates presentation or proposal narratives

✅ **Image Integration**
- References actual website images
- Includes meta images and hero images
- Provides fallback image suggestions

✅ **Flexible Output**
- Supports 3, 5, 7, or 10 slide formats
- Different layouts (hero, content-split, quotes, etc.)
- Customizable tone and audience

## Slide Types Generated

1. **cover-hero**: Title slide with subtitle
2. **content-right-image**: Bullet points with image on right
3. **content-left-image**: Bullet points with image on left
4. **content-split**: Split content for comparisons
5. **quote-slide**: Testimonials or expert quotes
6. **infographic-bullets**: Metrics and data visualization
7. **call-to-action**: Closing slide with next steps

## Error Handling

The implementation includes comprehensive error handling:
- URL validation
- Slide count validation (3, 5, 7, 10 only)
- Presentation type validation (presentation/proposal)
- AI response parsing with fallbacks
- Detailed error messages for debugging

## Environment Variables Used

The feature uses existing API keys from `.env`:
- `API_KEY1` through `API_KEY12`: Gemini API keys (rotates automatically)

No additional environment variables required!

## Testing the Feature

### Example cURL Request:
```bash
curl -X POST http://localhost:5000/api/presentation/web-to-deck \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "url": "https://example.com",
    "presentationType": "presentation",
    "slideCount": 5,
    "meta": {
      "goal": "Showcase company services",
      "tone": "Professional and engaging",
      "audience": "Potential clients"
    }
  }'
```

### Example JavaScript Fetch:
```javascript
const response = await fetch('http://localhost:5000/api/presentation/web-to-deck', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`
  },
  body: JSON.stringify({
    url: 'https://example.com',
    presentationType: 'presentation',
    slideCount: 5,
    meta: {
      goal: 'Showcase company services',
      tone: 'Professional',
      audience: 'Business professionals'
    }
  })
});

const result = await response.json();
console.log(result);
```

## Key Implementation Principles

✅ **Careful Code Modifications**
- Minimal changes to existing files
- Only added new functionality, didn't modify core logic
- Used existing patterns and conventions

✅ **Integration with Existing System**
- Leverages existing `fetchWebsiteText` service
- Uses existing `geminiModels` utility for API key rotation
- Follows existing slide format structure

✅ **Production Ready**
- Comprehensive error handling
- Input validation
- Progress tracking capability
- Detailed logging

## Future Enhancements (Optional)

- Server-Sent Events (SSE) for real-time progress updates
- Caching of website data to avoid repeated scraping
- Support for password-protected websites
- Advanced aesthetic analysis (gradients, animations)
- Template selection based on website type
- Multi-language support

## Notes

- The feature requires authentication (JWT token)
- Website scraping may take 10-30 seconds depending on site complexity
- Gemini API keys are rotated automatically to handle rate limits
- Generated presentations are saved to the database automatically
- Website images are referenced by URL (not downloaded/stored)

---

**Implementation Date**: November 12, 2025
**Implemented By**: AI Assistant
**Status**: ✅ Complete and Ready for Testing
