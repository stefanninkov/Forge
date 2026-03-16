// Forge Browser Extension - Popup Script

const API_BASE = 'http://localhost:3001/api';

// Check connection status
async function checkStatus() {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');

  try {
    const token = await getStoredToken();
    if (!token) {
      dot.className = 'status-dot disconnected';
      text.textContent = 'Not connected — set API token in settings';
      return;
    }

    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) {
      dot.className = 'status-dot connected';
      text.textContent = 'Connected to Forge';
    } else {
      dot.className = 'status-dot disconnected';
      text.textContent = 'Server unreachable';
    }
  } catch {
    dot.className = 'status-dot disconnected';
    text.textContent = 'Server unreachable';
  }
}

async function getStoredToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['forgeToken'], (result) => {
      resolve(result.forgeToken || null);
    });
  });
}

// Button handlers
document.getElementById('btn-capture').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  chrome.tabs.sendMessage(tab.id, { action: 'startCapture' });
  window.close();
});

document.getElementById('btn-inspect').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  chrome.tabs.sendMessage(tab.id, { action: 'startInspect' });
  window.close();
});

document.getElementById('btn-copy-html').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  chrome.tabs.sendMessage(tab.id, { action: 'copySelection' });
  window.close();
});

document.getElementById('btn-settings').addEventListener('click', () => {
  const token = prompt('Enter your Forge API token:');
  if (token !== null) {
    chrome.storage.local.set({ forgeToken: token }, () => {
      checkStatus();
    });
  }
});

// Init
checkStatus();
