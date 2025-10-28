/**
 * SeniorSafeAI Prevention Mode - Background Service Worker
 * Handles notifications, storage, and cross-tab communication
 */

// Track reported scams
let reportedScams = [];

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'report_scam') {
    handleScamReport(request, sender);
  } else if (request.action === 'check_link') {
    checkLinkSafety(request.url).then(sendResponse);
    return true; // Indicates async response
  }
});

/**
 * Handle scam report from content script
 */
function handleScamReport(report, sender) {
  const scamData = {
    url: report.url,
    patterns: report.patterns,
    timestamp: new Date().toISOString(),
    tabId: sender.tab?.id
  };

  reportedScams.push(scamData);

  // Save to storage
  chrome.storage.local.get(['reported_scams'], (result) => {
    const scams = result.reported_scams || [];
    scams.push(scamData);

    // Keep only last 100 reports
    if (scams.length > 100) {
      scams.shift();
    }

    chrome.storage.local.set({ reported_scams: scams });
  });

  // Show notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Scam Reported',
    message: 'Thank you for reporting this suspicious activity. Stay safe!',
    priority: 2
  });

  // Log for analytics (could send to backend)
  console.log('[SeniorSafeAI] Scam reported:', scamData);
}

/**
 * Check link safety using backend API
 */
async function checkLinkSafety(url) {
  try {
    const response = await fetch('http://localhost:80/api/scan-link', {
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
    console.error('[SeniorSafeAI] Failed to check link:', error);
  }

  return { is_safe: true, threat_level: 'unknown' };
}

/**
 * Initialize extension
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // First time install
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'SeniorSafeAI Prevention Mode Activated',
      message: 'We\'re now protecting you from online scams in real-time!',
      priority: 2
    });

    // Set default settings
    chrome.storage.local.set({
      enabled: true,
      protection_level: 'high',
      reported_scams: []
    });
  }
});

/**
 * Monitor tab updates for suspicious URLs
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    checkTabURL(tab.url, tabId);
  }
});

/**
 * Check if tab URL is suspicious
 */
async function checkTabURL(url, tabId) {
  try {
    const urlObj = new URL(url);

    // Check for known phishing domains (could expand this list)
    const suspiciousPatterns = [
      /p[a4]yp[a4]l/i,
      /[a4]m[a4]z[o0]n/i,
      /micr[o0]s[o0]ft/i,
      /g[o0][o0]gle/i,
      /[a4]pple/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(urlObj.hostname)) {
        // Show warning badge
        chrome.action.setBadgeText({ text: '!', tabId: tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#FF0000', tabId: tabId });

        // Show notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: '⚠️ Suspicious Website',
          message: 'This website looks suspicious. Be careful!',
          priority: 2
        });

        break;
      }
    }
  } catch (error) {
    // Invalid URL
  }
}

/**
 * Clear old data periodically
 */
chrome.alarms.create('cleanup', { periodInMinutes: 1440 }); // Daily

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanup') {
    chrome.storage.local.get(['reported_scams'], (result) => {
      const scams = result.reported_scams || [];
      const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

      const recentScams = scams.filter(scam => {
        return new Date(scam.timestamp).getTime() > oneMonthAgo;
      });

      chrome.storage.local.set({ reported_scams: recentScams });
    });
  }
});

console.log('[SeniorSafeAI] Background service worker initialized');
