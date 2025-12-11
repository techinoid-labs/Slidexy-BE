# Neuro Engine 🚀

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

### Quick Setup

**LinkedIn** (Already configured):
```bash
# Credentials already in .env
npm run dev
```

**Telegram** (New):
1. Create bot via @BotFather on Telegram
2. Add `TELEGRAM_BOT_TOKEN` to `.env`
3. Start conversation with bot to get chat ID
4. Connect via API

See **[SOCIAL_MEDIA_GUIDE.md](./SOCIAL_MEDIA_GUIDE.md)** for complete documentation covering both integrations.

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

**LinkedIn Integration**
```bash
node test-linkedin.js
```

### Postman Collections

Import these collections for API testing:
- `LinkedIn_Integration_Postman_Collection.json` - LinkedIn endpoints
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

See `.env.example` for all available configuration options.

**Required:**
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens
- `PORT` - Server port (default: 5000)

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