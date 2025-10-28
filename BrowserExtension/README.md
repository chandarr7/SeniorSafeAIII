# SeniorSafeAI Prevention Mode - Browser Extension

## Overview

The SeniorSafeAI Prevention Mode browser extension provides real-time protection against online scams while browsing. It monitors emails, websites, and links to detect and block malicious content before it can harm users.

## Features

### 🛡️ Real-Time Protection

- **Automatic Page Scanning** - Analyzes every webpage for scam patterns
- **Email Monitoring** - Works with Gmail, Yahoo Mail, and Outlook
- **Link Protection** - Intercepts and scans suspicious links before clicking
- **Dynamic Content Detection** - Monitors new content as it loads

### 🚨 Smart Detection

**Scam Categories Detected:**
- Urgent Language (act now, limited time)
- Payment Requests (gift cards, wire transfers, cryptocurrency)
- Identity Theft (verify account, confirm SSN)
- Tech Support Scams (virus detected, remote access)
- Authority Impersonation (IRS, FBI, police)
- Prize/Lottery Scams (you've won, claim prize)

### 📊 User-Friendly Alerts

- **Visual Warnings** - Full-screen overlays with clear messages
- **Threat Levels** - Color-coded (Green/Yellow/Orange/Red)
- **Simple Language** - Easy-to-understand recommendations
- **Action Buttons** - Block, Report, or Dismiss threats

### 📈 Statistics & Reporting

- Track scams blocked
- View recent threats
- Report suspicious content
- Export threat logs

## Installation

### Chrome

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the `BrowserExtension` folder
6. The extension icon should appear in your toolbar

### Firefox

1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Navigate to `BrowserExtension` folder
5. Select the `manifest.json` file
6. The extension is now active

### Edge

1. Download or clone this repository
2. Open Edge and navigate to `edge://extensions/`
3. Enable "Developer mode" (toggle in left sidebar)
4. Click "Load unpacked"
5. Select the `BrowserExtension` folder
6. The extension icon should appear in your toolbar

## Setup

### 1. Configure Backend API

The extension requires the SeniorSafeAI backend API to be running.

**Update API URL in `content.js`:**
```javascript
const API_BASE_URL = 'http://localhost:80/api';
// Change to your backend URL if different
```

### 2. Adjust Protection Level

Click the extension icon and choose:
- **Low** - Basic protection (known dangerous sites only)
- **Medium** - Balanced protection (suspicious patterns)
- **High** - Maximum protection (recommended)

## How It Works

### Page Scanning

When you visit a website:
1. Extension analyzes page text for scam patterns
2. Checks for suspicious links and content
3. Shows warnings if threats detected
4. Blocks dangerous links automatically

### Email Monitoring

When you open an email:
1. Scans email content for scam keywords
2. Extracts and analyzes any links
3. Adds warning badges to suspicious emails
4. Highlights dangerous content

### Link Protection

When you click a link:
1. Checks if URL matches suspicious patterns
2. Sends URL to backend for deep scanning
3. Shows warning if threat detected
4. Allows override for false positives

## Visual Indicators

### Warning Levels

**🟢 Safe**
- No threats detected
- Proceed normally

**🟡 Caution**
- Minor suspicious patterns
- Verify before proceeding

**🟠 Warning**
- Multiple scam indicators
- Do not proceed without verification

**🔴 Danger**
- Critical threat detected
- Do NOT proceed

### UI Elements

**Warning Overlay:**
```
┌─────────────────────────────────┐
│         ⚠️                      │
│   This looks suspicious!        │
│                                 │
│  Detected: 5 scam indicators    │
│  • Urgent language              │
│  • Payment request              │
│  • Suspicious link              │
│                                 │
│  [Close]  [Report Scam]        │
└─────────────────────────────────┘
```

**Email Badge:**
```
Subject: You've Won!  [⚠️ SUSPICIOUS]
```

**Link Highlight:**
```
Click here    ← Orange border + warning tooltip
```

## Privacy & Security

### Data Collection

- **No personal data collected**
- **No browsing history stored**
- **No data sent to third parties**

### Local Storage Only

- Reported scams stored locally
- Settings stored in browser
- Can be cleared anytime

### Permissions Explained

- **activeTab** - Analyze current page content
- **storage** - Save settings and reports
- **notifications** - Show warnings
- **host_permissions** - Scan all websites

## Configuration

### Settings

Access via extension popup:

**Protection Level:**
- Controls sensitivity of detection
- Higher = more warnings (safer)
- Lower = fewer warnings (more permissive)

**Enable/Disable:**
- Toggle protection on/off
- Useful for trusted sites

**Auto-Scan:**
- Automatically scan pages on load
- Can disable for manual scanning

### Whitelist (Future Feature)

Add trusted domains to skip scanning:
```javascript
whitelist: [
  'yourbank.com',
  'trusted-site.com'
]
```

## Troubleshooting

### Extension Not Working

**Check:**
1. Extension is enabled in browser
2. Backend API is running
3. API URL is correct in `content.js`
4. No console errors (F12 Developer Tools)

### Warnings Not Appearing

**Solutions:**
1. Refresh the page
2. Check protection level is set to Medium or High
3. Verify content script is loaded (check Developer Tools)
4. Try disabling and re-enabling extension

### False Positives

**If legitimate site is blocked:**
1. Click "Proceed Anyway" (be careful!)
2. Report false positive via popup
3. Adjust protection level to Medium or Low

### Performance Issues

**If browser is slow:**
1. Lower protection level
2. Disable on trusted sites
3. Clear old reports (Settings)

## Development

### File Structure

```
BrowserExtension/
├── manifest.json       # Extension configuration
├── content.js          # Main detection logic
├── content.css         # Warning styles
├── background.js       # Service worker
├── popup.html          # Popup UI
├── popup.js            # Popup functionality
└── icons/              # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Adding New Scam Patterns

Edit `scamPatterns` in `content.js`:

```javascript
const scamPatterns = {
  newCategory: [
    'pattern1',
    'pattern2',
    'pattern3'
  ]
};
```

### Customizing Warnings

Edit warning styles in `content.css`:

```css
.seniorsafe-warning-box {
  background-color: #your-color;
  /* Your custom styles */
}
```

## API Integration

### Backend Endpoints Used

**Scan Link:**
```javascript
POST /api/scan-link
{
  "url": "https://example.com"
}
```

**Scan Email:**
```javascript
POST /api/scan-email
{
  "email_content": "Email text..."
}
```

### Response Handling

```javascript
if (result.threat_level === 'critical') {
  showCriticalWarning();
} else if (result.threat_level === 'high') {
  showHighWarning();
} else if (result.threat_level === 'medium') {
  showMediumWarning();
}
```

## Testing

### Manual Testing

1. Visit known scam sites (use test URLs)
2. Check warning appears
3. Verify threat level is correct
4. Test all action buttons

### Email Testing

1. Create test email with scam keywords
2. Check badge appears
3. Verify content highlighting
4. Test link interception

### Link Testing

1. Hover over suspicious link
2. Check visual indicator
3. Click link
4. Verify warning appears
5. Test "Block" and "Proceed" buttons

## Support & Contribution

### Reporting Issues

Found a bug? Create an issue with:
- Browser version
- Extension version
- Steps to reproduce
- Screenshots if applicable

### Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## Changelog

### Version 1.0.0
- Initial release
- Real-time page scanning
- Email monitoring
- Link protection
- Visual warnings
- Statistics tracking

## Roadmap

### Planned Features

- [ ] Whitelist/Blacklist management
- [ ] Custom scam patterns
- [ ] Export threat reports
- [ ] Cloud sync settings
- [ ] Dark mode
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Community threat sharing

## Credits

Developed by SeniorSafeAI Team

**Technologies:**
- Chrome Extension Manifest V3
- Vanilla JavaScript
- Chrome Storage API
- Chrome Notifications API

## License

Part of the SeniorSafeAI project.

## Disclaimer

This extension helps detect scams but is not 100% accurate. Always use caution when:
- Clicking unknown links
- Providing personal information
- Making online payments
- Responding to unsolicited emails

**When in doubt, don't click!**

---

**Stay Safe Online! 🛡️**
