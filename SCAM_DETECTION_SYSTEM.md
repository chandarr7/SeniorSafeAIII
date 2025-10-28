# Real-Time Scam Detection System

## Overview

SeniorSafeAI's Real-Time Scam Detection System provides three powerful layers of protection against online scams:

1. **Live Link Interceptor** - Scans suspicious links instantly using Google Safe Browsing, VirusTotal, and OpenAI vision models
2. **Voice Scam Detector** - Detects manipulation patterns and fake voices in phone calls using AI
3. **Prevention Mode Browser Extension** - Monitors emails and websites for scam-like patterns in real-time

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Frontend Components](#frontend-components)
- [Browser Extension](#browser-extension)
- [Usage Examples](#usage-examples)
- [Security Considerations](#security-considerations)

---

## Features

### 1. Live Link Interceptor

**Real-time URL scanning with multiple threat intelligence sources:**

- **Google Safe Browsing API** - Checks against Google's database of unsafe websites
- **VirusTotal API** - Scans URLs against 70+ antivirus engines
- **OpenAI GPT-4 Analysis** - AI-powered scam pattern detection
- **Pattern Recognition** - Identifies suspicious URL structures (IP addresses, shortened URLs, brand impersonation)

**User-Friendly Alerts:**
- Clear threat level indicators (Low, Medium, High, Critical)
- Detailed explanations of detected threats
- Actionable recommendations in simple language
- Visual warnings designed for seniors

### 2. Voice Scam Detector

**AI-powered phone call analysis:**

- **Speech-to-Text** - Converts audio to text using OpenAI Whisper
- **Pattern Detection** - Identifies common scam phrases and tactics
- **Real-Time Warnings** - Flash alerts during suspicious calls
- **Scam Type Classification** - Recognizes tech support, IRS, grandparent, lottery scams, etc.

**Detection Categories:**
- Tech Support Scams
- Government Impersonation (IRS, SSA)
- Bank Fraud
- Grandparent Scams
- Lottery/Prize Scams
- Pressure Tactics
- Suspicious Payment Requests

### 3. Prevention Mode Browser Extension

**Continuous protection while browsing:**

- **Email Monitoring** - Scans Gmail, Yahoo, Outlook for suspicious content
- **Website Analysis** - Detects scam patterns on any webpage
- **Link Protection** - Blocks dangerous links before clicking
- **Visual Warnings** - Big "⚠️ This looks suspicious" popups
- **Reporting System** - Track and report scams

---

## Architecture

### Backend Services

```
├── link_scanner.py           # URL scanning service
│   ├── Google Safe Browsing integration
│   ├── VirusTotal API integration
│   ├── OpenAI GPT-4 analysis
│   └── Pattern matching engine
│
├── voice_scam_detector.py    # Voice analysis service
│   ├── OpenAI Whisper transcription
│   ├── Scam phrase detection
│   ├── Manipulation tactic identification
│   └── Real-time analysis
│
└── app.py                     # FastAPI server
    ├── /api/scan-link
    ├── /api/scan-email
    ├── /api/analyze-voice-audio
    ├── /api/analyze-voice-text
    ├── /api/analyze-voice-realtime
    └── /api/health
```

### Frontend Components

```
Frontend/src/components/
├── LinkInterceptor.js        # Link scanning UI
└── VoiceScamDetector.js      # Voice analysis UI
```

### Browser Extension

```
BrowserExtension/
├── manifest.json             # Extension configuration
├── content.js                # Page monitoring script
├── background.js             # Service worker
├── popup.html                # Extension popup UI
├── popup.js                  # Popup functionality
└── content.css              # Warning styles
```

---

## Installation

### Backend Setup

1. **Install Python Dependencies**

```bash
cd Seniorsafe_LD
pip install -r requirements.txt
```

2. **Configure API Keys**

Create a `.env` file in `Seniorsafe_LD/`:

```env
# OpenAI API Key (required for AI analysis)
OPENAI_API_KEY=your_openai_api_key_here

# Google Safe Browsing API Key (optional but recommended)
GOOGLE_SAFE_BROWSING_API_KEY=your_google_api_key_here

# VirusTotal API Key (optional but recommended)
VIRUSTOTAL_API_KEY=your_virustotal_api_key_here
```

3. **Start the Backend Server**

```bash
# Option 1: Using FastAPI directly
uvicorn app:app --host 0.0.0.0 --port 80

# Option 2: Using Python
python -m uvicorn app:app --host 0.0.0.0 --port 80
```

### Frontend Setup

1. **Install Node Dependencies**

```bash
cd Frontend
npm install
```

2. **Update API Endpoint** (if needed)

In both `LinkInterceptor.js` and `VoiceScamDetector.js`, update the API URL if your backend is not running on `localhost:80`:

```javascript
const API_BASE_URL = 'http://your-backend-url:port/api';
```

3. **Start the Frontend**

```bash
npm start
```

### Browser Extension Installation

1. **Chrome Installation**

   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `BrowserExtension` folder
   - The extension should now appear in your toolbar

2. **Firefox Installation**

   - Open Firefox and go to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file from `BrowserExtension` folder

---

## Configuration

### API Keys Setup

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env` file

#### Google Safe Browsing API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "Safe Browsing API"
4. Create credentials (API Key)
5. Copy the key to your `.env` file

#### VirusTotal API Key
1. Go to [VirusTotal](https://www.virustotal.com/)
2. Create an account
3. Go to your profile and find API Key
4. Copy the key to your `.env` file

### Browser Extension Settings

Access settings by clicking the extension icon:

- **Protection Level**: Low, Medium, or High
- **Enable/Disable**: Toggle protection on/off
- **View Reports**: See blocked threats

---

## API Documentation

### 1. Scan Link

**Endpoint:** `POST /api/scan-link`

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "url": "https://example.com",
  "timestamp": "2024-01-15T10:30:00Z",
  "is_safe": false,
  "threat_level": "high",
  "threats": [
    "Flagged by 15 security vendors",
    "Suspicious URL pattern detected"
  ],
  "details": {
    "google_safe_browsing": {...},
    "virustotal": {...},
    "ai_analysis": {...}
  },
  "recommendations": [
    "⚠️ DANGER - This link is highly suspicious",
    "Do not click unless you are absolutely certain it's legitimate"
  ]
}
```

### 2. Scan Email

**Endpoint:** `POST /api/scan-email`

**Request:**
```json
{
  "email_content": "Full email text here..."
}
```

**Response:**
```json
{
  "urls_found": 3,
  "scanned_urls": [...],
  "is_safe": false,
  "threat_level": "medium",
  "overall_threats": [...],
  "recommendations": [...]
}
```

### 3. Analyze Voice (Audio)

**Endpoint:** `POST /api/analyze-voice-audio`

**Request:** `multipart/form-data` with audio file

**Response:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "is_suspicious": true,
  "threat_level": "critical",
  "scam_type": "fake_tech_support",
  "detected_phrases": [
    "your computer has a virus",
    "remote access",
    "gift card"
  ],
  "confidence": 85,
  "immediate_action": "HANG UP IMMEDIATELY - This is a scam call!",
  "recommendations": [...],
  "transcription": "Call transcription text..."
}
```

### 4. Analyze Voice (Text)

**Endpoint:** `POST /api/analyze-voice-text`

**Request:**
```json
{
  "transcription": "Hello, this is Microsoft calling about your computer..."
}
```

**Response:** Same as audio analysis

### 5. Health Check

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "link_scanner": {
      "google_safe_browsing": true,
      "virustotal": true,
      "openai": true
    },
    "voice_detector": {
      "openai": true
    }
  },
  "message": "SeniorSafeAI Scam Detection API is running"
}
```

---

## Frontend Components

### Link Interceptor Component

**Location:** `Frontend/src/components/LinkInterceptor.js`

**Features:**
- Text input for URL entry
- Automatic scanning on paste
- Real-time scan results
- Color-coded threat levels
- Detailed analysis accordion
- Simple recommendations

**Usage in React:**
```jsx
import LinkInterceptor from './components/LinkInterceptor';

function App() {
  return <LinkInterceptor />;
}
```

### Voice Scam Detector Component

**Location:** `Frontend/src/components/VoiceScamDetector.js`

**Features:**
- Live microphone recording
- Audio file upload
- Text transcription input
- Real-time warnings
- Critical threat dialog
- Scam type identification

**Usage in React:**
```jsx
import VoiceScamDetector from './components/VoiceScamDetector';

function App() {
  return <VoiceScamDetector />;
}
```

---

## Browser Extension

### How It Works

1. **Automatic Page Scanning**
   - Scans every page you visit for scam patterns
   - Monitors email services (Gmail, Yahoo, Outlook)
   - Tracks dynamic content loading

2. **Link Protection**
   - Intercepts clicks on suspicious links
   - Scans links before allowing navigation
   - Shows warnings for dangerous URLs

3. **Email Monitoring**
   - Adds warning badges to suspicious emails
   - Highlights dangerous content
   - Real-time pattern detection

4. **Visual Warnings**
   - Full-screen overlay for critical threats
   - Color-coded warning levels
   - Simple, clear recommendations

### Detected Patterns

The extension looks for:

- **Urgent Language**: "act now", "immediately", "last chance"
- **Payment Requests**: "wire transfer", "gift card", "bitcoin"
- **Identity Theft**: "verify account", "confirm SSN"
- **Tech Support**: "virus detected", "remote access"
- **Authority Impersonation**: "IRS", "FBI", "arrest warrant"
- **Prize Scams**: "you've won", "claim prize"

---

## Usage Examples

### Example 1: Scanning a Suspicious Link

```javascript
// User pastes a link
const link = "http://paypa1-secure.tk/verify";

// Frontend automatically calls API
const result = await fetch('/api/scan-link', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: link })
});

// Result shows CRITICAL threat
// User sees big red warning: "DO NOT CLICK THIS LINK"
```

### Example 2: Recording a Suspicious Call

```javascript
// User clicks "Start Recording"
// Scammer says: "Your computer has a virus. We need remote access."

// System detects:
// - "virus" (tech support scam)
// - "remote access" (tech support scam)
// - High urgency

// IMMEDIATE WARNING appears:
// "⚠️ HANG UP IMMEDIATELY - This is a scam call!"
```

### Example 3: Browser Extension in Action

```
1. User opens suspicious email about "Prize Winner"
2. Extension detects: "you've won", "claim prize", "processing fee"
3. Big orange warning appears:
   "⚠️ This email looks suspicious!"
4. User sees recommendations:
   - Do NOT click any links
   - Do NOT provide personal information
   - This is likely a lottery scam
```

---

## Security Considerations

### API Key Protection

- **Never commit API keys to version control**
- Store keys in `.env` file (already in `.gitignore`)
- Use environment variables in production
- Rotate keys regularly

### Rate Limiting

- Implement rate limiting on API endpoints
- Prevent abuse of external APIs
- Monitor API usage and costs

### Data Privacy

- Audio recordings are not stored permanently
- Transcriptions are processed in memory
- No personal information is logged
- Extension data stored locally only

### CORS Configuration

Current configuration allows all origins for development:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change in production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Production:** Restrict to specific domains:

```python
allow_origins=["https://yourdomain.com"],
```

---

## Troubleshooting

### Backend Issues

**Problem:** API returns "API key not configured"
- **Solution:** Check `.env` file contains correct API keys
- Restart the server after adding keys

**Problem:** CORS errors in browser
- **Solution:** Verify CORS middleware is configured
- Check frontend is calling correct backend URL

### Frontend Issues

**Problem:** Components not displaying
- **Solution:** Ensure Material-UI dependencies are installed
- Run `npm install` in Frontend directory

**Problem:** API calls failing
- **Solution:** Check backend is running on correct port
- Verify API_BASE_URL in component files

### Browser Extension Issues

**Problem:** Extension not loading
- **Solution:** Check manifest.json syntax
- Ensure all files are in correct locations

**Problem:** Warnings not appearing
- **Solution:** Check browser console for errors
- Verify content script is injecting properly

---

## Performance Optimization

### Link Scanner

- Parallel API calls for faster scanning
- Caching of recent scan results
- Timeout limits on external API calls

### Voice Detector

- Streaming transcription for large files
- Chunk-based analysis for real-time detection
- Efficient pattern matching algorithms

### Browser Extension

- Debounced page scanning
- Lazy loading of content checks
- Efficient DOM observation

---

## Future Enhancements

1. **Machine Learning Models**
   - Train custom models on scam datasets
   - Improve detection accuracy
   - Reduce false positives

2. **Community Reporting**
   - Share threat intelligence
   - Crowdsourced scam database
   - Real-time threat feeds

3. **Multi-Language Support**
   - Detect scams in multiple languages
   - Localized warnings and recommendations

4. **Mobile Apps**
   - iOS and Android versions
   - Call screening integration
   - SMS scam detection

5. **Advanced Analytics**
   - Dashboard for tracking threats
   - Trend analysis
   - Risk scoring

---

## Support

For issues, questions, or contributions:

- **GitHub Issues**: Report bugs and request features
- **Documentation**: See project README files
- **API Status**: Check `/api/health` endpoint

---

## License

This project is part of SeniorSafeAI, designed to protect seniors from online scams.

---

## Acknowledgments

- **Google Safe Browsing API** - URL threat intelligence
- **VirusTotal** - Malware and phishing detection
- **OpenAI** - GPT-4 and Whisper AI models
- **Material-UI** - React component library

---

## Version History

### Version 1.0.0 (2024-01-15)
- Initial release
- Live Link Interceptor
- Voice Scam Detector
- Prevention Mode Browser Extension
- Full API implementation
- React frontend components

---

**Remember: The best defense against scams is awareness. This system helps, but always stay vigilant!**
