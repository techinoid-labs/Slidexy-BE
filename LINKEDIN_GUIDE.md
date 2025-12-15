# LinkedIn Integration - Complete Guide

## Quick Start (Already Configured! ✅)

Your LinkedIn credentials are already in `.env`:
```env
LINKEDIN_CLIENT_ID=86jdvquc3rz792
LINKEDIN_CLIENT_SECRET=WPL_AP1.o6jgp2lqlFLdat6B.ARusIA==
LINKEDIN_REDIRECT_URI=http://localhost:5000/api/linkedin/callback
```

**Just restart your server and it's ready to use!**

```bash
npm run dev
```

---

## How It Works

### 1. User Authentication Flow
1. User clicks "Connect LinkedIn" → Frontend calls `GET /api/linkedin/auth`
2. User redirected to LinkedIn to authorize
3. LinkedIn redirects back to `/api/linkedin/callback`
4. Backend saves token to database
5. User can now share slides!

### 2. Sharing Flow
1. User clicks "Share to LinkedIn" on a slide
2. Frontend calls `POST /api/linkedin/share` with `presentationId` and `slideIndex`
3. Backend downloads slide image
4. Backend uploads image to LinkedIn
5. Backend creates LinkedIn post
6. Returns LinkedIn post URL

---

## API Endpoints

### Connect LinkedIn Account
```bash
GET /api/linkedin/auth
Headers: Authorization: Bearer <JWT_TOKEN>

Response:
{
  "success": true,
  "authUrl": "https://www.linkedin.com/oauth/v2/authorization?..."
}
```

**Usage:** Redirect user to the `authUrl`

---

### Check Connection Status
```bash
GET /api/linkedin/status
Headers: Authorization: Bearer <JWT_TOKEN>

Response:
{
  "connected": true,
  "tokenValid": true,
  "profile": {
    "id": "abc123",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

### Share Slide to LinkedIn
```bash
POST /api/linkedin/share
Headers: 
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json

Body:
{
  "presentationId": "abc-123-def-456",
  "slideIndex": 0,
  "message": "Check out my presentation! 🚀"
}

Response:
{
  "success": true,
  "postId": "urn:li:share:123456",
  "shareUrl": "https://www.linkedin.com/feed/update/urn:li:share:123456"
}
```

---

### Disconnect LinkedIn
```bash
DELETE /api/linkedin/disconnect
Headers: Authorization: Bearer <JWT_TOKEN>

Response:
{
  "success": true,
  "message": "LinkedIn account disconnected"
}
```

---

## Frontend Integration (React Example)

### Simple Share Button
```jsx
import { useState, useEffect } from 'react';

function LinkedInShareButton({ presentationId, slideIndex, slideTitle }) {
  const [connected, setConnected] = useState(false);
  const [sharing, setSharing] = useState(false);
  const token = localStorage.getItem('authToken'); // Your JWT token

  // Check connection on mount
  useEffect(() => {
    fetch('http://localhost:5000/api/linkedin/status', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setConnected(data.connected && data.tokenValid))
    .catch(() => setConnected(false));
  }, []);

  // Connect to LinkedIn
  const connectLinkedIn = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/linkedin/auth', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      window.location.href = data.authUrl; // Redirect to LinkedIn
    } catch (error) {
      alert('Failed to connect: ' + error.message);
    }
  };

  // Share to LinkedIn
  const shareToLinkedIn = async () => {
    setSharing(true);
    try {
      const res = await fetch('http://localhost:5000/api/linkedin/share', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          presentationId,
          slideIndex,
          message: `Check out this slide: "${slideTitle}" 🚀\n\nCreated with Neuro Engine`
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert('Successfully shared to LinkedIn!');
        window.open(data.shareUrl, '_blank'); // Open LinkedIn post
      } else {
        throw new Error(data.error || 'Share failed');
      }
    } catch (error) {
      alert('Failed to share: ' + error.message);
    } finally {
      setSharing(false);
    }
  };

  return (
    <button 
      onClick={connected ? shareToLinkedIn : connectLinkedIn}
      disabled={sharing}
    >
      {sharing ? 'Sharing...' : connected ? '📤 Share to LinkedIn' : '🔗 Connect LinkedIn'}
    </button>
  );
}

export default LinkedInShareButton;
```

### Add to Your Presentation View
```jsx
import LinkedInShareButton from './LinkedInShareButton';

function PresentationView({ presentation }) {
  return (
    <div>
      {presentation.slides.map((slide, index) => (
        <div key={index}>
          <img src={slide.image_url} alt={slide.slide_title.text} />
          <h2>{slide.slide_title.text}</h2>
          
          {/* Add LinkedIn share button */}
          <LinkedInShareButton
            presentationId={presentation.presentation_id}
            slideIndex={index}
            slideTitle={slide.slide_title.text}
          />
        </div>
      ))}
    </div>
  );
}
```

---

## Testing

### Quick Test with cURL

**1. Check if LinkedIn is configured:**
```bash
curl http://localhost:5000/api/linkedin/status -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**2. Get OAuth URL:**
```bash
curl http://localhost:5000/api/linkedin/auth -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**3. Share a slide (after connecting):**
```bash
curl -X POST http://localhost:5000/api/linkedin/share \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "presentationId": "your-presentation-id",
    "slideIndex": 0,
    "message": "Test post!"
  }'
```

### Using the Test Script
```bash
node test-linkedin.js
```

Update `USER_TOKEN` in the script with your JWT token first.

---

## LinkedIn App Setup (If you need to change settings)

1. Go to https://www.linkedin.com/developers/apps
2. Find your app: **86jdvquc3rz792**
3. Under "Auth" tab, verify:
   - Redirect URL: `http://localhost:5000/api/linkedin/callback`
   - Scopes: `openid`, `profile`, `email`, `w_member_social`

---

## Common Issues & Solutions

### "LinkedIn account not connected"
**Solution:** User needs to connect via `/api/linkedin/auth` first

### "Token expired"
**Solution:** Tokens expire after 60 days. User needs to reconnect.

### "Slide has no image"
**Solution:** Can only share slides with images. Ensure `slide.image_url` exists.

### "Invalid redirect_uri"
**Solution:** Make sure redirect URI in LinkedIn app matches `.env` exactly

---

## Database Schema

The User model now includes LinkedIn fields:

```javascript
{
  // Existing fields...
  email: String,
  password: String,
  
  // NEW LinkedIn fields (automatically added)
  linkedinConnected: Boolean,        // Connection status
  linkedinAccessToken: String,       // OAuth token (encrypted)
  linkedinTokenExpiry: Date,         // Token expiration
  linkedinProfile: {                 // LinkedIn profile
    id: String,
    name: String,
    email: String,
    picture: String
  }
}
```

**No manual migration needed!** Fields are added automatically.

---

## Security

- ✅ All endpoints require JWT authentication (except callback)
- ✅ CSRF protection with state parameter
- ✅ Tokens stored encrypted in MongoDB
- ✅ Token expiry tracking
- ✅ Input validation on all requests

---

## Files Added

### Core Implementation
- `services/linkedinService.js` - LinkedIn API wrapper
- `controllers/linkedinController.js` - Request handlers
- `routes/linkedinRoutes.js` - API routes
- `models/User.js` - Updated with LinkedIn fields (backward compatible)
- `server.js` - Routes registered

### Testing
- `test-linkedin.js` - Automated test script
- `LinkedIn_Integration_Postman_Collection.json` - Postman collection

---

## Production Deployment

1. **Update LinkedIn app redirect URI:**
   ```
   https://your-domain.com/api/linkedin/callback
   ```

2. **Update `.env` for production:**
   ```env
   LINKEDIN_REDIRECT_URI=https://your-domain.com/api/linkedin/callback
   FRONTEND_URL=https://your-domain.com
   ```

3. **Restart server**

That's it!

---

## Need Help?

**Test the integration:**
```bash
# Start server
npm run dev

# Test authentication
curl http://localhost:5000/api/linkedin/status -H "Authorization: Bearer YOUR_TOKEN"
```

**Import Postman Collection:**
- File: `LinkedIn_Integration_Postman_Collection.json`
- Update `auth_token` variable with your JWT

**Run automated tests:**
```bash
node test-linkedin.js
```

---

## Summary

✅ **LinkedIn OAuth** - Connect user accounts  
✅ **Share Slides** - Post images to LinkedIn  
✅ **Custom Messages** - Personalize posts  
✅ **Connection Management** - Connect/disconnect  
✅ **Secure** - Token management & validation  
✅ **Production Ready** - Error handling included  

**Already configured! Just restart your server and start using it.** 🚀
