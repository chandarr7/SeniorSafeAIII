/**
 * SeniorSafeAI Prevention Mode - Content Script
 * Monitors emails and websites for scam patterns in real-time
 */

// Configuration
const API_BASE_URL = 'http://localhost:80/api';

// Scam detection patterns
const scamPatterns = {
  urgentLanguage: [
    'urgent', 'immediately', 'act now', 'within 24 hours', 'limited time',
    'expires today', 'last chance', 'final notice', 'action required'
  ],
  paymentRequests: [
    'wire transfer', 'gift card', 'bitcoin', 'cryptocurrency', 'western union',
    'money gram', 'send money', 'payment needed', 'confirm payment', 'itunes card',
    'google play card', 'steam card', 'prepaid card', 'cash app', 'venmo', 'zelle'
  ],
  identityTheft: [
    'verify your account', 'confirm your identity', 'social security number',
    'ssn', 'account suspended', 'unusual activity', 'verify credentials',
    'update payment information', 'confirm password', 'security alert'
  ],
  prizes: [
    'you\'ve won', 'winner', 'claim your prize', 'lottery', 'jackpot',
    'free gift', 'congratulations', 'selected winner', 'prize claim'
  ],
  techSupport: [
    'your computer has a virus', 'windows security', 'apple support',
    'microsoft support', 'remote access', 'tech support', 'security breach',
    'infected', 'malware detected', 'expired license'
  ],
  authorityImpersonation: [
    'irs', 'internal revenue service', 'social security administration',
    'fbi', 'police department', 'court', 'legal action', 'arrest warrant',
    'tax refund', 'government agency'
  ]
};

// Track scanned links to avoid duplicates
const scannedLinks = new Set();
const scannedPages = new Set();

/**
 * Initialize the content script
 */
function initialize() {
  console.log('[SeniorSafeAI] Prevention Mode activated');

  // Scan the current page
  scanCurrentPage();

  // Monitor for new content (emails loading, dynamic content)
  observePageChanges();

  // Monitor links
  monitorLinks();

  // Add CSS for warnings
  injectStyles();
}

/**
 * Scan the current page for scam patterns
 */
function scanCurrentPage() {
  const url = window.location.href;

  // Don't scan the same page multiple times
  if (scannedPages.has(url)) return;
  scannedPages.add(url);

  // Get all text content
  const pageText = document.body.innerText.toLowerCase();

  // Check for scam patterns
  const detectedPatterns = detectScamPatterns(pageText);

  if (detectedPatterns.length > 0) {
    showScamWarning(detectedPatterns, 'page');
  }

  // Specifically check for Gmail, Yahoo, Outlook
  if (isEmailService(url)) {
    monitorEmailContent();
  }
}

/**
 * Detect scam patterns in text
 */
function detectScamPatterns(text) {
  const detected = [];
  let score = 0;

  for (const [category, patterns] of Object.entries(scamPatterns)) {
    const matches = patterns.filter(pattern => text.includes(pattern));
    if (matches.length > 0) {
      detected.push({
        category: category,
        matches: matches,
        count: matches.length
      });
      score += matches.length;
    }
  }

  // Determine threat level
  let threatLevel = 'low';
  if (score >= 5) threatLevel = 'critical';
  else if (score >= 3) threatLevel = 'high';
  else if (score >= 1) threatLevel = 'medium';

  return detected.length > 0 ? { patterns: detected, score, threatLevel } : null;
}

/**
 * Check if current page is an email service
 */
function isEmailService(url) {
  return url.includes('mail.google.com') ||
         url.includes('mail.yahoo.com') ||
         url.includes('outlook.live.com') ||
         url.includes('outlook.office.com');
}

/**
 * Monitor email content for scams
 */
function monitorEmailContent() {
  // Gmail
  if (window.location.href.includes('mail.google.com')) {
    const emailObserver = new MutationObserver(() => {
      const emails = document.querySelectorAll('[role="listitem"]');
      emails.forEach(email => {
        if (!email.hasAttribute('data-scam-checked')) {
          checkEmailForScams(email);
          email.setAttribute('data-scam-checked', 'true');
        }
      });
    });

    const emailList = document.querySelector('[role="main"]');
    if (emailList) {
      emailObserver.observe(emailList, { childList: true, subtree: true });
    }
  }

  // Check opened email
  setTimeout(() => {
    const emailBody = document.querySelector('[role="main"]');
    if (emailBody) {
      const emailText = emailBody.innerText.toLowerCase();
      const detectedPatterns = detectScamPatterns(emailText);

      if (detectedPatterns) {
        showScamWarning(detectedPatterns, 'email');
        highlightScamEmail();
      }
    }
  }, 1000);
}

/**
 * Check individual email for scam patterns
 */
function checkEmailForScams(emailElement) {
  const emailText = emailElement.innerText.toLowerCase();
  const detectedPatterns = detectScamPatterns(emailText);

  if (detectedPatterns && detectedPatterns.score >= 2) {
    // Add warning badge to email
    const warningBadge = document.createElement('span');
    warningBadge.className = 'seniorsafe-warning-badge';
    warningBadge.innerHTML = '⚠️ SUSPICIOUS';
    warningBadge.style.cssText = `
      background-color: #ff3d00;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: bold;
      margin-left: 8px;
    `;

    const subject = emailElement.querySelector('[role="link"]');
    if (subject && !emailElement.querySelector('.seniorsafe-warning-badge')) {
      subject.appendChild(warningBadge);
    }
  }
}

/**
 * Highlight the current email as potentially dangerous
 */
function highlightScamEmail() {
  const emailBody = document.querySelector('[role="main"]');
  if (emailBody && !emailBody.hasAttribute('data-scam-highlighted')) {
    emailBody.style.border = '4px solid #ff3d00';
    emailBody.style.backgroundColor = '#fff3e0';
    emailBody.setAttribute('data-scam-highlighted', 'true');
  }
}

/**
 * Monitor links on the page
 */
function monitorLinks() {
  // Add click listeners to all links
  document.addEventListener('click', async (e) => {
    const link = e.target.closest('a');
    if (link && link.href) {
      const url = link.href;

      // Skip already scanned links
      if (scannedLinks.has(url)) return;

      // Check if link looks suspicious
      if (isSuspiciousLink(url)) {
        e.preventDefault();
        e.stopPropagation();

        // Scan the link
        const scanResult = await scanLink(url);

        if (scanResult && !scanResult.is_safe) {
          showLinkWarning(url, scanResult);
          scannedLinks.add(url);
        } else {
          // Link is safe, allow navigation
          window.location.href = url;
        }
      }
    }
  }, true);

  // Also monitor link hovers
  document.addEventListener('mouseover', (e) => {
    const link = e.target.closest('a');
    if (link && link.href && isSuspiciousLink(link.href)) {
      // Add visual indicator
      link.style.border = '2px solid orange';
      link.style.backgroundColor = '#fff3e0';
      link.title = '⚠️ Suspicious link - Click will be scanned first';
    }
  });
}

/**
 * Check if a link looks suspicious
 */
function isSuspiciousLink(url) {
  try {
    const urlObj = new URL(url);

    // Check for IP addresses
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(urlObj.hostname)) {
      return true;
    }

    // Check for suspicious TLDs
    const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top'];
    if (suspiciousTLDs.some(tld => urlObj.hostname.endsWith(tld))) {
      return true;
    }

    // Check for URL shorteners
    const shorteners = ['bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 't.co'];
    if (shorteners.some(sh => urlObj.hostname.includes(sh))) {
      return true;
    }

    // Check for excessive subdomains
    if (urlObj.hostname.split('.').length > 4) {
      return true;
    }

    // Check for brand impersonation
    const brands = ['paypal', 'amazon', 'microsoft', 'google', 'apple', 'facebook', 'bank'];
    for (const brand of brands) {
      if (urlObj.hostname.includes(brand) && !urlObj.hostname.endsWith(`${brand}.com`)) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Scan a link using the backend API
 */
async function scanLink(url) {
  try {
    const response = await fetch(`${API_BASE_URL}/scan-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url })
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('[SeniorSafeAI] Failed to scan link:', error);
  }

  return null;
}

/**
 * Show scam warning overlay
 */
function showScamWarning(detectedPatterns, type) {
  // Don't show duplicate warnings
  if (document.getElementById('seniorsafe-warning-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'seniorsafe-warning-overlay';
  overlay.className = 'seniorsafe-overlay';

  const threatLevel = detectedPatterns.threatLevel || 'medium';
  const bgColor = threatLevel === 'critical' ? '#d32f2f' :
                  threatLevel === 'high' ? '#f57c00' :
                  '#ffa726';

  overlay.innerHTML = `
    <div class="seniorsafe-warning-box" style="background-color: ${bgColor};">
      <div class="seniorsafe-warning-header">
        <span style="font-size: 48px;">⚠️</span>
        <h2>This ${type} looks suspicious!</h2>
      </div>

      <div class="seniorsafe-warning-content">
        <p style="font-size: 18px; margin-bottom: 15px;">
          We detected ${detectedPatterns.score} scam indicators:
        </p>

        <ul style="text-align: left; margin: 15px 0; padding-left: 20px;">
          ${detectedPatterns.patterns.map(p => `
            <li><strong>${p.category.replace(/([A-Z])/g, ' $1').trim()}:</strong>
                ${p.count} match${p.count > 1 ? 'es' : ''}</li>
          `).join('')}
        </ul>

        <div style="background-color: rgba(255,255,255,0.9); color: #333; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">⚡ What you should do:</h3>
          <ul style="text-align: left; margin: 10px 0;">
            <li>Do NOT click any links</li>
            <li>Do NOT provide personal information</li>
            <li>Do NOT send money or gift cards</li>
            <li>Verify sender through official contact methods</li>
          </ul>
        </div>

        <div style="margin-top: 20px;">
          <button id="seniorsafe-dismiss" class="seniorsafe-btn seniorsafe-btn-primary">
            I Understand - Close Warning
          </button>
          <button id="seniorsafe-report" class="seniorsafe-btn seniorsafe-btn-secondary">
            Report This Scam
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Event listeners
  document.getElementById('seniorsafe-dismiss').addEventListener('click', () => {
    overlay.remove();
  });

  document.getElementById('seniorsafe-report').addEventListener('click', () => {
    // Send notification to background script
    chrome.runtime.sendMessage({
      action: 'report_scam',
      url: window.location.href,
      patterns: detectedPatterns
    });
    alert('Thank you! This has been reported to SeniorSafeAI.');
    overlay.remove();
  });
}

/**
 * Show link warning
 */
function showLinkWarning(url, scanResult) {
  if (document.getElementById('seniorsafe-link-warning')) return;

  const overlay = document.createElement('div');
  overlay.id = 'seniorsafe-link-warning';
  overlay.className = 'seniorsafe-overlay';

  overlay.innerHTML = `
    <div class="seniorsafe-warning-box" style="background-color: #d32f2f;">
      <div class="seniorsafe-warning-header">
        <span style="font-size: 48px;">🚨</span>
        <h2>DANGEROUS LINK BLOCKED!</h2>
      </div>

      <div class="seniorsafe-warning-content">
        <p style="font-size: 18px; margin-bottom: 15px;">
          This link has been identified as dangerous:
        </p>

        <div style="background-color: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px; word-break: break-all; margin: 15px 0;">
          ${url}
        </div>

        <div style="background-color: rgba(255,255,255,0.9); color: #333; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #d32f2f;">Threat Level: ${scanResult.threat_level.toUpperCase()}</h3>
          <ul style="text-align: left;">
            ${scanResult.threats.map(threat => `<li>${threat}</li>`).join('')}
          </ul>
        </div>

        <div style="background-color: rgba(255,255,255,0.9); color: #333; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">What you should do:</h3>
          <ul style="text-align: left; margin: 10px 0;">
            ${scanResult.recommendations.slice(0, 5).map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        </div>

        <div style="margin-top: 20px;">
          <button id="seniorsafe-block-link" class="seniorsafe-btn seniorsafe-btn-primary">
            Block This Link
          </button>
          <button id="seniorsafe-proceed-anyway" class="seniorsafe-btn seniorsafe-btn-danger">
            Proceed Anyway (Not Recommended)
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('seniorsafe-block-link').addEventListener('click', () => {
    overlay.remove();
  });

  document.getElementById('seniorsafe-proceed-anyway').addEventListener('click', () => {
    if (confirm('Are you absolutely sure? This link is dangerous!')) {
      overlay.remove();
      window.location.href = url;
    }
  });
}

/**
 * Observe page changes for dynamic content
 */
function observePageChanges() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        // Check new content for scam patterns
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            const text = node.innerText?.toLowerCase() || '';
            if (text.length > 50) {
              const detectedPatterns = detectScamPatterns(text);
              if (detectedPatterns && detectedPatterns.score >= 3) {
                // Highlight suspicious element
                node.style.border = '3px solid orange';
                node.style.backgroundColor = '#fff3e0';
                node.setAttribute('title', '⚠️ SeniorSafeAI: Suspicious content detected');
              }
            }
          }
        });
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Inject custom styles
 */
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .seniorsafe-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.9);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .seniorsafe-warning-box {
      max-width: 600px;
      padding: 30px;
      border-radius: 12px;
      color: white;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      animation: slideUp 0.3s;
    }

    @keyframes slideUp {
      from { transform: translateY(50px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .seniorsafe-warning-header h2 {
      margin: 15px 0;
      font-size: 28px;
      font-weight: bold;
    }

    .seniorsafe-warning-content {
      margin-top: 20px;
    }

    .seniorsafe-btn {
      padding: 12px 24px;
      margin: 5px;
      font-size: 16px;
      font-weight: bold;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .seniorsafe-btn-primary {
      background-color: white;
      color: #333;
    }

    .seniorsafe-btn-primary:hover {
      background-color: #f0f0f0;
      transform: scale(1.05);
    }

    .seniorsafe-btn-secondary {
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .seniorsafe-btn-secondary:hover {
      background-color: rgba(255, 255, 255, 0.3);
      transform: scale(1.05);
    }

    .seniorsafe-btn-danger {
      background-color: rgba(255, 255, 255, 0.1);
      color: white;
      border: 2px solid white;
    }

    .seniorsafe-btn-danger:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
  `;

  document.head.appendChild(style);
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
