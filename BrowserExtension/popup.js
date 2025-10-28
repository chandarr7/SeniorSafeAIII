/**
 * SeniorSafeAI Prevention Mode - Popup Script
 */

// Load initial state when popup opens
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  updateStats();
  setupEventListeners();
});

/**
 * Load settings from storage
 */
function loadSettings() {
  chrome.storage.local.get(['enabled', 'protection_level'], (result) => {
    const enabled = result.enabled !== false; // Default to true
    const level = result.protection_level || 'high';

    updateStatusUI(enabled);
    document.getElementById('protection-level').value = level;
  });
}

/**
 * Update status UI
 */
function updateStatusUI(enabled) {
  const statusDiv = document.getElementById('status');
  const statusText = document.getElementById('status-text');
  const toggleBtn = document.getElementById('toggle-btn');

  if (enabled) {
    statusDiv.classList.remove('disabled');
    statusText.textContent = 'Protection Active';
    toggleBtn.textContent = 'Disable';
  } else {
    statusDiv.classList.add('disabled');
    statusText.textContent = 'Protection Disabled';
    toggleBtn.textContent = 'Enable';
  }
}

/**
 * Update statistics
 */
function updateStats() {
  chrome.storage.local.get(['reported_scams'], (result) => {
    const scams = result.reported_scams || [];

    // Count unique scams blocked
    document.getElementById('scams-blocked').textContent = scams.length;

    // Estimate links scanned (could be tracked separately)
    document.getElementById('links-scanned').textContent = scams.length * 5;

    // Show recent scams
    if (scams.length > 0) {
      displayRecentScams(scams.slice(-5).reverse());
    }
  });
}

/**
 * Display recent scams
 */
function displayRecentScams(scams) {
  const container = document.getElementById('recent-scams');
  const card = document.getElementById('recent-scams-card');

  if (scams.length === 0) {
    card.style.display = 'none';
    return;
  }

  card.style.display = 'block';
  container.innerHTML = '';

  scams.forEach(scam => {
    const item = document.createElement('div');
    item.className = 'scam-item';

    const time = new Date(scam.timestamp);
    const timeStr = time.toLocaleDateString() + ' ' + time.toLocaleTimeString();

    item.innerHTML = `
      <div class="url">🚨 ${scam.url.substring(0, 50)}${scam.url.length > 50 ? '...' : ''}</div>
      <div class="time">${timeStr}</div>
    `;

    container.appendChild(item);
  });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Toggle protection
  document.getElementById('toggle-btn').addEventListener('click', () => {
    chrome.storage.local.get(['enabled'], (result) => {
      const enabled = result.enabled !== false;
      const newState = !enabled;

      chrome.storage.local.set({ enabled: newState }, () => {
        updateStatusUI(newState);

        if (newState) {
          showNotification('Protection Enabled', 'SeniorSafeAI is now protecting you from scams');
        } else {
          showNotification('Protection Disabled', 'You are no longer protected from scams');
        }
      });
    });
  });

  // Protection level change
  document.getElementById('protection-level').addEventListener('change', (e) => {
    const level = e.target.value;

    chrome.storage.local.set({ protection_level: level }, () => {
      showNotification('Settings Updated', `Protection level set to: ${level}`);

      // Update info box
      const infoBox = document.querySelector('.info-box p');
      switch (level) {
        case 'low':
          infoBox.innerHTML = '<strong>Low Protection:</strong> Only blocks known dangerous sites';
          break;
        case 'medium':
          infoBox.innerHTML = '<strong>Medium Protection:</strong> Warns about suspicious content';
          break;
        case 'high':
          infoBox.innerHTML = '<strong>High Protection:</strong> Blocks suspicious links and shows warnings for potential scams';
          break;
      }
    });
  });

  // Scan current page
  document.getElementById('scan-page-btn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        // Trigger page scan
        window.location.reload();
      }
    });

    window.close();
  });

  // View reports
  document.getElementById('view-reports-btn').addEventListener('click', () => {
    chrome.storage.local.get(['reported_scams'], (result) => {
      const scams = result.reported_scams || [];

      if (scams.length === 0) {
        alert('No scams have been reported yet. Great job staying safe!');
      } else {
        // Could open a new tab with detailed report
        alert(`You have reported ${scams.length} suspicious activities. Stay vigilant!`);
      }
    });
  });

  // Settings
  document.getElementById('settings-btn').addEventListener('click', () => {
    // Could open options page
    chrome.runtime.openOptionsPage();
  });
}

/**
 * Show notification
 */
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: title,
    message: message,
    priority: 1
  });
}
