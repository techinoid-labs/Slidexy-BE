# Neuro Engine

AI-powered presentation generation, plus the template pipeline that converts a PowerPoint file into a themed, editable deck.

## Template pipeline

A seed deck is a JSON layout on a 1600×900 canvas. A prompt rewrites the copy and photographs. The admin publishes the result, and the catalog downloads it as native PowerPoint objects.

### Converter

`services/templatePipeline/convert/pptxToDeck.js` reads a `.pptx` and writes schema version 2 JSON into `app-library/<deck-id>.json`, with extracted photos beside it. One file:

```bash
node services/templatePipeline/convert/pptxToDeck.js "path/to/deck.pptx" deck-id
```

A folder of decks, scored after each conversion:

```bash
node scripts/bulk_ingest.js "PPTX Slides Templates"
```

A file the converter cannot parse is appended to `ingest_failures.log`. The batch continues.

### Scorer

`scripts/score_seeds.js` asks the injector for a "A company overview." deck, then `services/templatePipeline/scoring/analyzeDeck.js` scores every slide. A slide passes only when the geometry rules, the vision review, and `quality_score >= 0.6` all pass. `qualityScore` is the percentage of passing slides. The method name on the DNA file is `hybrid-v2`.

```bash
node scripts/score_seeds.js health-medical
node scripts/score_seeds.js --all --resume
```

`--resume` skips seeds already marked `hybrid-v2` and overwrites an older score. Auto-layout only offers a seed when its score is at least 70.

### Single-seed

`services/templatePipeline/thematic.js` rewrites one seed. It invents a brand, shifts the palette, rewrites each text box to about the same length, and downloads Pexels photos into `image`, `maskedImage`, and collage cells. Model calls use `OPENROUTER_API_KEY` and, when that call cannot run, `API_KEY1` or `GEMINI_API_KEY`. Photos use `PEXELS_API_KEY`. All three are read from `.env`. There is no key built into the source.

Auto-Select classifies the prompt as Photo-heavy, Text-heavy, or Corporate and uses the highest enabled seed of that kind with a score of at least 70. A chosen base layout skips that pick and uses the seed you name.

```bash
node services/templatePipeline/thematic.js --prompt "A futuristic AI robotics company." --layout health-medical --out docs/template-pipeline/thematic-tests/ai-robotics
node scripts/auto_generate.js "A neighborhood bakery"
```

`auto_generate.js` is the single-seed path with Auto-Select. Slides are written under `docs/template-pipeline/admin-dashboard/tmp/`.

### Assembler

`services/templatePipeline/assemble_deck.js` builds a 10-slide deck from whole slides. Gemini writes the outline and the design language. Every slide comes from seeds that share that `recommendedUse`, so a Photo-heavy slide is never mixed with a Corporate slide. The highest-scoring seed in the deck supplies the palette and the fonts for every slide. A text box of one or two letters, such as a leftover "Aa" specimen, is left out. Numeric labels stay. Thematic injection then rewrites the copy and the photos. When that locked background is bright and a slide has a dark full-bleed photo, a 40% black scrim is placed on the photo and the type on it is set light.

```bash
node services/templatePipeline/assemble_deck.js "A sustainable fashion brand."
```

### Admin and user setup

The curator is loopback-only. It does not require MongoDB.

```powershell
$env:PIPELINE_PORT = "5055"
node services/templatePipeline/devServer.js
```

Open http://127.0.0.1:5055/ . Enter a prompt. Leave **Auto-Select Best Layout** checked for a single seed, or check **Auto-Assemble Deck (Max Variety)** to build the deck from one design language. Press Generate. Review the slides, then Publish to Catalog or Discard. Publish writes `app-library/published/<id>.json` and the slide images. Discard deletes the temporary folder. **Frankenstein Remix** is still on the form; it mixes two seeds and is not a launch path.

The full API server mounts the same admin routes at `/api/admin`, behind `JWT_SECRET` and an admin user:

```bash
npm start
```

That process also needs `MONGO_URI`. It listens on `PORT` (5000 when unset).

http://127.0.0.1:5055/catalog lists published decks. Search filters by name and description. View Deck opens the slide carousel. Download PPTX posts to `/api/catalog/:id/download` and returns a 13.333×7.5 inch file whose text, shapes, and pictures are separate objects. Illustrations and arch-masked photos are transparent PNGs placed as pictures. The same catalog routes are public on the full server at `/api/catalog`.

### Local setup

```bash
npm install
```

Create `.env` in this directory. The pipeline reads these names and no others for its keys:

```
API_KEY1=
PEXELS_API_KEY=
JWT_SECRET=
OPENROUTER_API_KEY=
MONGO_URI=
PORT=5000
```

`API_KEY1` is the Gemini key. `GEMINI_API_KEY` is accepted as the same value if you set that name instead. Do not put a key in source. The admin JWT is `process.env.JWT_SECRET`; login and the auth middleware refuse the request when it is missing.

Then start the curator with the PowerShell commands above. Generate one deck with:

```bash
node scripts/auto_generate.js "A neighborhood bakery"
```

## Presentation API

AI-powered presentation generation engine with LinkedIn sharing integration.

## Features

### 🎨 Presentation Generation
- Generate slides from multiple sources (YouTube, websites, text)
- AI-powered content creation
- Dynamic image generation
- Multiple layout types
- Customizable art styles and color palettes

### 📤 LinkedIn Integration (NEW!)
- OAuth 2.0 authentication with LinkedIn
- Share presentation slides directly to LinkedIn
- Upload images with custom messages
- Connection management
- Token validation and security

### 🌐 Website Generation
- Generate complete HTML websites
- Dynamic website structures
- Multiple templates and styles
- ZIP download support

### 📊 Infographics & Charts
- Create infographics from data
- Generate charts and visualizations
- Multiple infographic templates
- Explainer infographics

### 💳 Subscription & Billing
- Stripe integration
- Multiple pricing plans
- Trial period management
- Usage tracking

## Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB
- LinkedIn Developer Account (for sharing feature)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/techinoid-labs/neuro-engine.git
cd neuro-engine
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

Required variables:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
FRONTEND_URL=http://localhost:3000

# LinkedIn Integration
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:5000/api/linkedin/callback
```

4. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

Server will run on `http://localhost:5000`

## Social Media Integration

Neuro Engine supports sharing presentations to:
- **LinkedIn** - OAuth 2.0 integration with feed posting
- **Telegram** - Bot API integration with direct messaging
- **Reddit** - OAuth 2.0 integration with subreddit posting
- **Discord** - Bot API integration with channel messaging

### Quick Setup

**LinkedIn** (Already configured):
```bash
# Credentials already in .env
npm run dev
```

**Telegram**:
1. Create bot via @BotFather on Telegram
2. Add `TELEGRAM_BOT_TOKEN` to `.env`
3. Start conversation with bot to get chat ID
4. Connect via API

**Reddit**:
1. Create app at https://www.reddit.com/prefs/apps (select "web app")
2. Add credentials to `.env` (see `.env` file for placeholders)
3. Connect via OAuth flow

**Discord**:
1. Create application at https://discord.com/developers/applications
2. Create bot user and copy bot token
3. Add `DISCORD_BOT_TOKEN` to `.env`
4. Generate OAuth2 URL with permissions (52224: Send Messages, Attach Files, Embed Links, Read Message History)
5. Invite bot to your Discord server
6. Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
7. Right-click channel → Copy ID
8. Connect via API

See **[SOCIAL_MEDIA_ROADMAP.md](./SOCIAL_MEDIA_ROADMAP.md)** for platform comparisons and implementation details.

## API Documentation

### Core Endpoints

#### Presentations
- `POST /generate-slides` - Generate presentation slides
- `GET /presentation/:id` - Get presentation by ID
- `POST /edit-text` - Edit slide text
- `POST /generate-image-suggestions` - Get image suggestions

#### Social Media Integration
**LinkedIn:**
- `GET /api/linkedin/auth` - Initiate OAuth flow
- `GET /api/linkedin/callback` - OAuth callback handler
- `GET /api/linkedin/status` - Check connection status
- `POST /api/linkedin/share` - Share slide to LinkedIn
- `DELETE /api/linkedin/disconnect` - Disconnect account

**Telegram:**
- `GET /api/telegram/bot-info` - Get bot information
- `POST /api/telegram/connect` - Connect with chat ID
- `GET /api/telegram/status` - Check connection status
- `POST /api/telegram/share` - Share slide to Telegram
- `POST /api/telegram/send-message` - Send text message
- `DELETE /api/telegram/disconnect` - Disconnect account

**Reddit:**
- `GET /api/reddit/auth` - Initiate OAuth flow
- `GET /api/reddit/callback` - OAuth callback handler
- `GET /api/reddit/status` - Check connection status
- `POST /api/reddit/share` - Share single slide as image
- `POST /api/reddit/share-text` - Post text content
- `POST /api/reddit/share-gallery` - Share multiple slides as gallery
- `GET /api/reddit/subreddit/:name` - Get subreddit info
- `DELETE /api/reddit/disconnect` - Disconnect account

**Discord:**
- `GET /api/discord/bot-info` - Get bot information
- `POST /api/discord/connect` - Connect channel (requires channelId)
- `GET /api/discord/status` - Check connection status
- `POST /api/discord/share` - Share single slide with embed
- `POST /api/discord/share-custom` - Share custom image URL
- `POST /api/discord/send-message` - Send text message
- `POST /api/discord/share-multiple` - Share multiple slides
- `DELETE /api/discord/disconnect` - Disconnect channel

#### User Management
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/me` - Get user profile
- `PUT /api/users/me` - Update profile

#### Stripe/Billing
- `POST /api/stripe/create-checkout-session` - Create checkout
- `GET /api/stripe/plans` - Get pricing plans
- `POST /api/stripe/webhook` - Stripe webhooks

Full API documentation available in Swagger: `http://localhost:5000/api-docs`

## Testing

### Automated Tests

**Social Media Integrations**
```bash
node test-linkedin.js
node test-telegram.js
node test-reddit.js
node test-discord.js
```

### Postman Collections

Import these collections for API testing:
- `LinkedIn_Integration_Postman_Collection.json` - LinkedIn endpoints
- `Telegram_Integration_Postman_Collection.json` - Telegram endpoints
- `Reddit_Integration_Postman_Collection.json` - Reddit endpoints
- `Discord_Integration_Postman_Collection.json` - Discord endpoints
- `Image_Deck_Postman_Collection.json` - Image deck endpoints
- `Raw_Text_Deck_Postman_Collection.json` - Text deck endpoints
- `Stylesheet_Deck_Postman_Collection.json` - Stylesheet endpoints
- `Unified_Web_Deck_Postman_Collection.json` - Web deck endpoints

### Manual Testing

```bash
# Test slide generation
curl -X POST http://localhost:5000/generate-slides \
  -H "Content-Type: application/json" \
  -d '{
    "source": "text",
    "textContent": "Your content here",
    "slideCount": 5
  }'

# Test LinkedIn connection
curl -X GET http://localhost:5000/api/linkedin/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Project Structure

```
neuro-engine/
├── controllers/        # Request handlers
│   ├── slideController.js
│   ├── linkedinController.js
│   └── ...
├── services/          # Business logic
│   ├── linkedinService.js
│   ├── generateSlideText.js
│   └── ...
├── routes/            # API routes
│   ├── linkedinRoutes.js
│   ├── presentation.js
│   └── ...
├── models/            # MongoDB schemas
│   ├── User.js
│   ├── Presentation.js
│   └── ...
├── middlewares/       # Express middlewares
│   ├── auth.js
│   └── ...
├── utils/             # Helper functions
├── constants/         # Constants and configs
└── server.js         # Main server file
```

## Environment Variables

Names are read from `.env`. The source has no default key.

**Required for the full server:**
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for admin and user JWT tokens
- `PORT` - Server port (default: 5000)

**Required for the template pipeline:**
- `API_KEY1` - Gemini API key (`GEMINI_API_KEY` is the same slot)
- `PEXELS_API_KEY` - Pexels API key
- `OPENROUTER_API_KEY` - used first for rewrite and vision; Gemini is used when that call cannot run

**LinkedIn (Optional but required for sharing):**
- `LINKEDIN_CLIENT_ID` - LinkedIn app client ID
- `LINKEDIN_CLIENT_SECRET` - LinkedIn app client secret
- `LINKEDIN_REDIRECT_URI` - OAuth redirect URI

**Other Services:**
- `FRONTEND_URL` - Frontend application URL
- Various API keys for AI services

## Documentation

### LinkedIn Integration
- 📘 **[Complete Guide](./LINKEDIN_GUIDE.md)** - All you need to know

### API Documentation
- Swagger UI: `http://localhost:5000/api-docs`
- See `swagger.yaml` for OpenAPI specification

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

See [LICENSE](./LICENSE) file for details.

## Support

For issues and questions:
- 📧 Email: support@neuro-engine.com
- 🐛 Issues: [GitHub Issues](https://github.com/techinoid-labs/neuro-engine/issues)
- 📖 Documentation: See docs folder

## Changelog

### Version 2.0.0 (December 2025)
- ✨ Added LinkedIn integration
- ✨ OAuth 2.0 authentication
- ✨ Share slides to LinkedIn
- ✨ Connection management
- 📚 Comprehensive documentation
- 🧪 Testing tools and Postman collections

### Version 1.x
- Initial presentation generation
- Website generation
- Infographics creation
- Stripe integration

## Roadmap

### Coming Soon
- [ ] S3 integration for slide previews
- [ ] LinkedIn carousel posts
- [ ] Post scheduling
- [ ] LinkedIn analytics
- [ ] Share to company pages
- [ ] Multiple social media platforms

### Under Consideration
- [ ] Video slide support
- [ ] Real-time collaboration
- [ ] Template marketplace
- [ ] Advanced analytics
- [ ] Mobile app

---

**Built with ❤️ by Techinoid Labs**