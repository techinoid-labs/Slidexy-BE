# Slidexy Backend - API Configuration Issues & Solutions

## Current Status

### ✅ Working
- **FAL.AI**: Image generation via Flux is operational
- Environment variables are properly set

### ❌ Critical Issues

#### 1. OpenRouter - Insufficient Credits (402 Error)
**Problem**: Your OpenRouter account has no available credits
- Model: `google/gemini-2.0-flash-001` (text generation)
- Error: "402 Insufficient credits"

**Solution**:
1. Go to: https://openrouter.ai/settings/credits
2. Add credits to your account (pay-as-you-go)
3. Minimum recommended: $5-10 for testing
4. Model cost: $0.0000001 per 1K input tokens (extremely cheap)

---

#### 2. Google API - Model Not Available (404 Error)
**Problem**: Your Google API key cannot access `gemini-1.5-flash`
- Error: "404 Not Found - models/gemini-1.5-flash is not found"
- This suggests authentication or model availability issues

**Possible Causes**:
- API key was created for a different Google Cloud project
- Generative AI API is not enabled in your Google Cloud project
- API key has restricted permissions

**Solution**:
Option A: **Enable Generative AI API in Google Cloud** (Free)
1. Go to: https://console.cloud.google.com/
2. Select your project (or create a new one)
3. Enable "Generative Language API"
4. Create a new API key with proper permissions
5. Update `API_KEY1` in `.env`

Option B: **Rely on OpenRouter Only** (Recommended for now)
1. Add credits to OpenRouter (cheapest option)
2. Remove or disable the Google fallback
3. All text generation will use: `google/gemini-2.0-flash-001` via OpenRouter

---

## Current Architecture

```
Text Generation Flow:
┌─────────────────────────────────────────┐
│  Slide Generation Request               │
└────────────┬────────────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │ Try OpenRouter     │  ← BLOCKED (No credits)
    │ gemini-2.0-flash-1 │
    └────────────┬───────┘
                 │ FAIL
                 ▼
    ┌────────────────────┐
    │ Fall back to Google│  ← BLOCKED (API issue)
    │ gemini-1.5-flash   │
    └────────────┬───────┘
                 │ FAIL
                 ▼
    ┌────────────────────────┐
    │ Return DEFAULT SLIDES  │  ← Current behavior
    │ (Generic placeholders) │
    └────────────────────────┘

Image Generation Flow:
┌──────────────────────────┐
│ Try Flux via FAL.AI      │  ← WORKING ✅
│ (No text needed)         │
└──────────────────────────┘
```

---

## Recommended Fix (Fastest Solution)

### Step 1: Add Credits to OpenRouter
**Time**: 5 minutes  
**Cost**: ~$5 for significant testing capacity

1. Visit: https://openrouter.ai/settings/credits
2. Add payment method and credit
3. Return to command line and test:
```bash
node test-corrected-gemini.js
```

### Step 2: Restart Backend
```bash
npm start
# or
node server.js
```

### Step 3: Test Slide Generation
Make a request to `/api/generate-slides` - you should now get actual slide content instead of defaults.

---

## Alternative: Use Google Cloud API (Free Tier)

If you prefer the Google API (has free tier):

### Step 1: Set up Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Create new project or select existing
3. Enable "Generative Language API"
4. Create API key (Application restrictions: None)

### Step 2: Update .env
```env
API_KEY1=<your-new-google-api-key>
```

### Step 3: Verify
```bash
node api-status-check.js
```

---

## Current Model Selection

### Text Generation (in order of preference)
1. **OpenRouter** - `google/gemini-2.0-flash-001`
   - Cost: $0.0000001 per 1K input tokens
   - Speed: Very fast
   - Status: **Requires credits**

2. **Google Generative AI** - `gemini-1.5-flash`
   - Cost: Free tier available
   - Speed: Fast
   - Status: **API key issue**

### Image Generation
- **Primary**: FAL.AI with Flux (`fal-ai/flux-1/schnell`)
  - Status: ✅ **WORKING**
  - Cost: Pay-as-you-go

---

## Commands Reference

```bash
# Check API configuration status
node api-status-check.js

# Test OpenRouter configuration
node test-corrected-gemini.js

# Restart backend
npm start

# Check logs for errors
# Look for: "❌ SLIDE TEXT GENERATION FAILED" messages
```

---

## What's Causing Default Slide Content?

When both text generation APIs fail:
1. Slide generation tries OpenRouter → **402 error (no credits)**
2. Falls back to Google → **404 error (API issue)**
3. Error is caught and function returns "intelligent fallback slides"
4. Fallback slides use generic titles like:
   - "Presentation Title"
   - "Key Insight 1"
   - "Summary & Takeaways"

**Fix**: Enable at least ONE working text generation API.

---

## Next Steps

**Choose ONE solution**:

1. **Quickest**: Add OpenRouter credits (5 min, ~$5)
   ```
   → Visit https://openrouter.ai/settings/credits
   → Add $5-10
   → Ready to go
   ```

2. **Free Alternative**: Fix Google Cloud API setup
   ```
   → Set up Google Cloud project
   → Create/update API key
   → Test with: node api-status-check.js
   ```

3. **Hybrid Approach**: Use both
   ```
   → OpenRouter for primary (fast, cheap)
   → Google for fallback (free tier)
   ```

---

**Questions?**
- OpenRouter docs: https://openrouter.ai/docs
- Google Generative AI: https://ai.google.dev/
- FAL.AI: https://www.fal.ai/
